import { Hono } from "hono";
import { cors } from "hono/cors";
import { extension } from "mime-types";
import { authError, badRequest, basicData, internalError, notFound, serverError } from "./errors";
import { genVanity } from "./urlStyle";
import { Styles, UploadLimits } from "common/build/main";
import { getHeaderDefaults, stringInject } from "./utils";
import { getOrm } from "./orm";

export const api = new Hono<{ Bindings: Bindings }>();
api.use(
  "*",
  cors({
    origin: (x) => x,
  })
);

api.get("/", async (c) => {
  return Response.json(basicData(200, "Welcome to the api", true));
});

api.get("/files/:vanity/delete/:delete", async (c) => {
  const { vanity, delete: del } = await c.req.param();
  const { files } = getOrm(c.env.ASCELLA_DB);
  const file = await files.First({
    where: {
      vanity,
    },
  });

  if (!file) return notFound();
  const loc = `${file.uploader || "guest"}/${file.name}`;
  const meta = await c.env.ASCELLA_DATA.head(loc);
  if (!meta?.customMetadata) return notFound();
  if (meta.customMetadata["delete"] !== del) return authError();
  await c.env.ASCELLA_DATA.delete(loc);
  await files.Delete({
    where: {
      vanity,
    },
  });
  return Response.json(basicData(202, "File deleted", true));
});

api.get("/files/:vanity", async (c) => {
  const { vanity } = c.req.param();
  const { files } = getOrm(c.env.ASCELLA_DB);
  const file = await files.First({
    where: {
      vanity,
    },
  });

  if (!file) return notFound();
  const loc = `${file.uploader || "guest"}/${file.name}`;
  const meta = await c.env.ASCELLA_DATA.head(loc);

  if (!meta) return notFound();
  if (
    (!meta.customMetadata?.["expires-at"] || new Date(meta.customMetadata["expires-at"]).getTime() < Date.now()) &&
    meta.customMetadata?.["expires-at"] !== ""
  ) {
    await c.env.ASCELLA_DATA.delete(loc);
    await files.Delete({
      where: {
        vanity,
      },
    });
    return notFound();
  }
  delete meta.customMetadata["expires-at"];
  delete meta.customMetadata["delete"];
  delete meta.customMetadata["ip"];

  return Response.json({
    raw: `${APP_URL}/cdn/${loc}`,
    views: 0,
    embed: meta.customMetadata,
  });
});

api.get("/stats.json", async (c) => {
  const { orm } = getOrm(c.env.ASCELLA_DB);
  const qr = await c.env.ASCELLA_DB.prepare(
    `SELECT ( SELECT COUNT(*) FROM files ) AS files, ( SELECT COUNT(*) FROM users ) AS users, ( SELECT COUNT(*) FROM users ) AS users, COUNT(*) as domains, ( SELECT COUNT(*) FROM reviews ) AS reviews, ( SELECT SUM(size) FROM files ) AS storageUsage, ( SELECT COUNT(*) FROM files WHERE type = 'redirect' ) AS redirects FROM domains LIMIT 1`
  );
  const record = await qr.first<Record<string, number>>();

  if (!record) return internalError();
  record.views = (record.files * 1.2 + record.domains * 3 + record.users * 6 + record.storageUsage / 100000) | 0;
  return Response.json(record, {
    headers: {
      "Cache-Control": "max-age=600, stale-while-revalidate=30",
    },
  });
});
api.get("/domains.json", async (c) => {
  const { domains: dOrm } = getOrm(c.env.ASCELLA_DB);
  const domains = await dOrm.All({});

  return Response.json(
    (domains.results?.flat() ?? []).map((x) => ({
      ...x,
      apex: x.apex == 1 ? true : false,
      official: x.official == 1 ? true : false,
      private: x.private ? true : false,
    })),
    {
      headers: {
        "Cache-Control": "max-age=600, stale-while-revalidate=30",
      },
    }
  );
});
api.get("/reviews.json", async (c) => {
  const { reviews: rOrm } = getOrm(c.env.ASCELLA_DB);
  const reviews = await rOrm.All({});
  return Response.json(reviews.results?.flat(), {
    headers: {
      "Cache-Control": "max-age=600, stale-while-revalidate=30",
    },
  });
});

api.post("/upload", async (c) => {
  let { users } = getOrm(c.env.ASCELLA_DB);
  if ((await c.env.ASCELLA_KV.get("shutdown")) == "true") {
    return badRequest("Ascella is currently shutdown");
  }

  let user;
  if (c.req.headers.get("ascella-token")) {
    user = await users.First({
      where: {
        token: c.req.headers.get("ascella-token")!,
      },
    });
    if (!user) {
      return authError();
    }
  } else {
    user = {
      email: "",
      name: "",
      domain: "ascella.host",
      uuid: "guest",
      limit: UploadLimits.Guest,
      url_style: Styles.default,
    };
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return badRequest("Invalid form data");
  }
  let file = form.get("file") as unknown as File;

  if (!(file instanceof File)) {
    return badRequest("Invalid file");
  }

  if (file.size > user.upload_limit!) {
    return badRequest("Payload too large!");
  }
  const { files: fOrm } = getOrm(c.env.ASCELLA_DB);
  const bannedFileTypes = ["application/"];

  if (bannedFileTypes.some((x) => (file as File)?.type.startsWith(x))) {
    return badRequest("Disallowed file type");
  }

  const ext = extension(file.type) || "png";
  const filename = `${genVanity(Styles.ulid)}.${ext}`;
  const del = genVanity(Styles.ulid);

  const settings = getHeaderDefaults(user, c.req.headers);
  let vanity = settings.vanity || genVanity(settings.url_style, settings.length);
  if (settings.url_style == Styles.filename) vanity = file.name;
  if (!vanity) return badRequest("Invalid url style");
  if (settings.domain == "ascella.host") settings.domain = "i.ascella.host";
  let url = [
    `https://${settings.domain}/`,
    settings.append ? encodeURIComponent(settings.append) + "/" : "",
    vanity,
    settings.ext ? `.${settings.ext}` : "",
  ].join("");

  const replaces = {
    ip: c.req.headers.get("cf-connecting-ip"),
    filename: file.name,
    vanity: vanity,
    size: file.size,
    type: file.type,
    extension: ext,
    now: new Date(Date.now()).toISOString(),
    ...settings,
    ...settings.embed,
    ...Object.fromEntries(c.req.headers.entries()),
  };

  const embed = {
    color: settings.embed.color ?? "",
    title: stringInject(settings.embed.title, replaces),
    description: stringInject(settings.embed.description, replaces),
    sitename: stringInject(settings.embed.sitename, replaces),
    sitenameUrl: (settings.embed.sitenameUrl as string) ?? "",
    author: stringInject(settings.embed.author, replaces),
    authorUrl: (settings.embed.authorUrl as string) ?? "",
  };

  const raw = `${APP_URL}/cdn/${user.uuid}/${filename}`;

  let res = await c.env.ASCELLA_DATA.put(`${user.uuid}/${filename}`, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      "expires-at": settings.autodelete ? (Date.now() + settings.autodelete * 24 * 60 * 60 * 1000).toString() : "",
      delete: del,
      ip: c.req.headers.get("cf-connecting-ip") || "",
      ...embed,
    },
  });
  await fOrm.InsertOne({
    name: filename,
    size: file.size,
    type: file.type,
    vanity: vanity,
    upload_name: file.name,
  });

  return Response.json({
    filename: filename,
    raw: raw,
    upload_date: res.uploaded.toISOString(),
    delete: `${APP_URL}/api/v3/files/${vanity}/delete/${del}`,
    metadata: `${APP_URL}/api/v3/files/${vanity}`,
    size: res.size,
    vanity: vanity,
    url,
  });
});

export default api;
