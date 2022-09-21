import { Context, Hono } from "hono";
import { extension } from "mime-types";
import { authError, badRequest, basicData, notFound } from "./errors";
import { genVanity, Styles } from "./urlStyle";
import { verifyKey } from "discord-interactions";
import type { DiscordInteraction } from "discordeno/types";
import { InteractionTypes } from "discordeno/types";
import { AscellaContext, commands, handleCommand } from "./commands/mod";
import { UploadLimits } from "ascella-common";
import { getHeaderDefaults } from "./utils";
import { getOrm } from "./orm";

export const api = new Hono<{ Bindings: Bindings }>();

const testUser = {
  email: "Tricked@tricked.pro",
  name: "Tricked",
  domain: "i.ascella.host",
  uuid: crypto.randomUUID(),
  limit: UploadLimits.Admin,
};

const backend = "http://127.0.0.1:8787";

api.get("/files/:vanity", async (c) => {
  const { vanity } = await c.req.param();
  const [_, { files }] = getOrm(c.env.__D1_BETA__);
  const file = await files.First({
    where: {
      vanity,
    },
  });
  if (!file) return notFound();
  // @ts-expect-error - d1-orm types bug
  const loc = `${file.uploader || "guest"}/${file.name}`;
  const meta = await c.env.ASCELLA_DATA.head(
    loc,
  );
  if (!meta) return notFound();
  if (
    !meta.customMetadata?.["expires-at"] ||
    new Date(meta.customMetadata["expires-at"]).getTime() < Date.now()
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
  return Response.json({
    raw: `${backend}/cdn/${loc}`,
    views: 0,
    embed: meta.customMetadata,
  });
});

api.get("/stats.json", async (c) => {
  return Response.json({
    files: 200,
    domains: 100,
    views: 320,
    users: 20,
    storageUsage: 10000,
    redirects: 1000,
  }, {
    headers: {
      "Cache-Control": "max-age=600, stale-while-revalidate=30",
    },
  });
});
api.get("/domains.json", async (c) => {
  const [_, { domains: dOrm }] = getOrm(c.env.__D1_BETA__);
  const domains = await dOrm.All({});

  return Response.json(
    (domains.results?.flat() ?? []).map((x) => ({
      ...x,
      private: x.private ? true : false,
    })),
    {
      headers: {
        "Cache-Control": "max-age=600, stale-while-revalidate=30",
      },
    },
  );
});
api.get("/reviews.json", async (c) => {
  const [_, { reviews: rOrm }] = getOrm(c.env.__D1_BETA__);
  const reviews = await rOrm.All({});

  return Response.json(
    reviews.results?.flat(),
    {
      headers: {
        "Cache-Control": "max-age=600, stale-while-revalidate=30",
      },
    },
  );
});
api.post("/upload", async (c) => {
  if (await c.env.ASCELLA_KV.get("shutdown") == "true") {
    return badRequest("Ascella is currently shutdown");
  }
  let user;
  if (c.req.headers.get("x-ascella-token")) {
    user = testUser;
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
  let file = form.get("file");

  if (file instanceof File) {
    const [_, { files: fOrm }] = getOrm(c.env.__D1_BETA__);

    let ext = extension(file.type) || "png";
    let filename = `${genVanity(Styles.ulid)}.${ext}`;
    const settings = getHeaderDefaults(user, c.req.headers);
    const vanity = settings.vanity ||
      genVanity(settings.url_style, settings.length);

    if (!vanity) return badRequest("Invalid url style");
    let url = [
      `https://${settings.domain}/`,
      settings.append ? encodeURIComponent(settings.append) + "/" : "",
      vanity,
      settings.ext ? `.${settings.ext}` : "",
    ].join("");
    let res = await c.env.ASCELLA_DATA.put(
      `${user.uuid}/${filename}`,
      file,
      {
        // TODO: add delete at property
        customMetadata: {
          "expires-at": (Date.now() + settings.autodelete * 24 * 60 * 60 * 1000)
            .toString(),
          ...settings.embed,
        },
      },
    );
    const raw = `${backend}/cdn/${user.uuid}/${filename}`;
    await fOrm.InsertOne({
      //@ts-expect-error - this is a bug in the orm
      data: {
        name: filename,
        size: file.size,
        type: file.type,
        vanity: vanity,
        upload_name: file.name,
      },
    });
    return Response.json({
      filename: filename,
      raw: raw,
      upload_date: res.uploaded.toISOString(),
      size: res.size,
      vanity: vanity,
      url,
    });
  } else {
    return badRequest("Invalid file");
  }
});

export default api;
