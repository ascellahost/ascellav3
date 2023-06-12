import { Hono } from "hono";
import { cors } from "hono/cors";
import { extension } from "mime-types";
import { authError, badRequest, basicData, basicResponse, internalError, notFound, serverError } from "./errors";
import { genVanity } from "./urlStyle";
import { Styles, UploadLimits } from "common/build/main";
import { getHeaderDefaults, stringInject } from "./utils";
import { getOrm } from "./orm";
import { validator } from "hono/validator";
import { InferFromColumns, DataTypes } from "d1-orm";

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  let meta = await c.env.ASCELLA_DATA.head(loc);
  if (!meta) {
    for (let i = 0; i < 5; i++) {
      await sleep(300);
      meta = await c.env.ASCELLA_DATA.head(loc);
      if (meta) break;
    }
  }
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
    date: meta.uploaded.toISOString(),
    views: 0,
    embed: meta.customMetadata,
  });
});



api.get("/stats.json", async (c) => {
  const qr = c.env.ASCELLA_DB.prepare(
    `SELECT ( SELECT COUNT(*) FROM files ) AS files, ( SELECT COUNT(*) FROM users ) AS users, ( SELECT COUNT(*) FROM users ) AS users, COUNT(*) as domains, ( SELECT COUNT(*) FROM reviews ) AS reviews, ( SELECT SUM(size) FROM files ) AS storageUsage, ( SELECT COUNT(*) FROM files WHERE type = 'redirect' ) AS redirects FROM domains LIMIT 1`
  );
  const record = await qr.first<Record<string, number>>();

  if (!record) return internalError();
  record.views = (record.files * 1.2 + record.domains * 3 + record.users * 6 + record.storageUsage / 300000) | 0;
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
  let { users, files: filesDb } = getOrm(c.env.ASCELLA_DB);
  if ((await c.env.ASCELLA_KV.get("shutdown")) == "true") {
    return badRequest("Ascella is currently shutdown");
  }

  let user: InferFromColumns<{
    id: { type: DataTypes.INTEGER; primaryKey: boolean; autoIncrement: boolean; notNull: true };
    name: { type: DataTypes.TEXT; notNull: true; unique: boolean };
    email: { type: DataTypes.TEXT; unique: boolean; notNull: true };
    token: { type: DataTypes.TEXT; notNull: true };
    uuid: { type: DataTypes.TEXT; unique: boolean; notNull: true };
    domain: { type: DataTypes.TEXT; notNull: true };
  }> & {
    upload_limit: UploadLimits;
  };
  if (c.req.headers.get("ascella-token")) {
    //@ts-ignore -
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
      upload_limit: UploadLimits.Guest,
      id: 0,
      token: "",
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

  function convertBytesToMB(bytes: number) {
    return bytes / (1024 * 1024);
  }

  const replaces: Record<string, string> = {
    ip: c.req.headers.get("cf-connecting-ip"),
    filename: file.name,
    vanity: vanity,
    size: file.size,
    type: file.type,
    size_fmt: convertBytesToMB(file.size),
    extension: ext,
    now: new Date(Date.now()).toISOString(),
    ...settings,
    ...settings.embed,
    ...Object.fromEntries(c.req.headers.entries()),
  };

  let extraReplaces = c.req.headers.get("ascella-extra-replaces") == "true";
  if (extraReplaces && user.uuid) {
    let result: { images: number; size: number } = await c.env.ASCELLA_DB.prepare(
      "select count(*) as images, SUM(size) as size from files where uploader = ? limit 1"
    )
      .bind([user.uuid])
      .first();
    replaces.images = result.images.toString();
    replaces.size = result.size.toString();
    replaces.size_fmt = convertBytesToMB(result.size).toString();
  }

  const embed = {
    color: stringInject(settings.embed.color, replaces) ?? "",
    title: stringInject(settings.embed.title, replaces),
    description: stringInject(settings.embed.description, replaces),
    sitename: stringInject(settings.embed.sitename, replaces),
    sitenameUrl: (settings.embed.sitenameUrl as string) ?? "",
    author: stringInject(settings.embed.author, replaces),
    authorUrl: stringInject(settings.embed.authorUrl as string, replaces) ?? "",
  };

  const raw = `${APP_URL}/cdn/${user.uuid}/${filename}`;

  let postResponse = async () => {
    let data = {
      name: filename,
      size: file.size,
      type: file.type,
      vanity: vanity,
      upload_name: file.name,
    };
    if (user.uuid) {
      //@ts-ignore -
      data.uploader = user.uuid;
    }

    await filesDb.InsertOne(data);

    await c.env.ASCELLA_DATA.put(`${user.uuid}/${filename}`, file.stream(), {
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
  };

  c.executionCtx.waitUntil(postResponse());

  return Response.json({
    filename: filename,
    raw: raw,
    upload_date: replaces.now,
    delete: `${APP_URL}/api/v3/files/${vanity}/delete/${del}`,
    metadata: `${APP_URL}/api/v3/files/${vanity}`,
    size: replaces.size,
    vanity: vanity,
    url,
  });
});

api.get("/me", async (c) => {
  let { users } = getOrm(c.env.ASCELLA_DB);
  const token = c.req.headers.get("ascella-token");
  if (!token) return authError("ascella-token header missing");
  const data = await users.First({
    where: {
      token: token,
    },
  });
  if (!data) return authError("Invalid token");
  return basicResponse(200, "Successfully checked token", true, { data });
});

api.get("/me/files", async (c) => {
  let q = c.req.query().page;
  if (!q || isNaN(parseInt(q))) return badRequest("Invalid query");
  let page = parseInt(q);

  let { users, files } = getOrm(c.env.ASCELLA_DB);
  const token = c.req.headers.get("ascella-token");
  if (!token) return authError("ascella-token header missing");
  const data = await users.First({
    where: {
      token: token,
    },
  });
  const perPage = 20;
  if (!data) return authError("Invalid token");

  const images = await files.All({
    where: {
      uploader: data.uuid,
    },
    limit: perPage,
    offset: perPage * page,
    orderBy: "id",
  });
  const loc = `${APP_URL}/cdn/${data.uuid}/`;

  let result = images.results?.map((x) => ({
    name: x.upload_name,
    vanity: x.vanity,
    raw: `${loc}${x.name}`,
  }));
  if (!result) return internalError();
  return basicResponse(
    200,
    "Retrieved images",
    true,
    { data: result }
    //{
    // "ascella-image-count":  TODO
    //}
  );
});

export default api;
