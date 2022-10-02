import { Context, Hono } from "hono";
import { extension } from "mime-types";
import { authError, badRequest, basicData, notFound } from "./errors";
import { genVanity } from "./urlStyle";
import { verifyKey } from "discord-interactions";
import type { DiscordInteraction } from "discordeno/types";
import { InteractionTypes } from "discordeno/types";
import { AscellaContext, commands, handleCommand } from "./commands/mod";
import { Styles, UploadLimits } from "common/build/main";
import { getHeaderDefaults, stringInject } from "./utils";
import { getOrm } from "./orm";
import { Value } from "@sinclair/typebox/value";

export const api = new Hono<{ Bindings: Bindings }>();

const testUser = {
  email: "Tricked@tricked.pro",
  name: "Tricked",
  domain: "i.ascella.host",
  uuid: crypto.randomUUID(),
  limit: UploadLimits.Admin,
};

const backend = "http://127.0.0.1:8787";

api.get("/files/:vanity/delete/:delete", async (c) => {
  const { vanity, delete: del } = await c.req.param();
  const [_, { files }] = getOrm(c.env.__D1_BETA__);
  const file = await files.First({
    where: {
      vanity,
    },
  });
  if (!file) return notFound();
  const loc = `${file.uploader || "guest"}/${file.name}`;
  const meta = await c.env.ASCELLA_DATA.head(
    loc,
  );
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
  const { vanity } = await c.req.param();
  const [_, { files }] = getOrm(c.env.__D1_BETA__);
  const file = await files.First({
    where: {
      vanity,
    },
  });
  if (!file) return notFound();
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
  delete meta.customMetadata["delete"];

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

// import { Static, Type } from "@sinclair/typebox";

// const SignUp = Type.Object({
//   email: Type.RegEx(
//     /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
//   ),
//   name: Type.String({ minLength: 3, maxLength: 32 }),
//   password: Type.String({ minLength: 8, maxLength: 128 }),
//   "cf-turnstile-response": Type.String(),
// });

// api.post("/signup", async (c) => {
//   const [_, { users }] = getOrm(c.env.__D1_BETA__);

//   const body = Object.fromEntries((await c.req.formData()).entries()) as Record<
//     string,
//     string
//   >;

//   console.log(body);

//   if (!Value.Check(SignUp, body)) {
//     return badRequest();
//   }
//   // Turnstile injects a token in "cf-turnstile-response".
//   const token = body["cf-turnstile-response"];
//   const ip = c.req.headers.get("CF-Connecting-IP") as string;

//   let exists = await users.First({
//     where: {
//       email: body.email,
//     },
//   });
//   if (exists) return badRequest("Email already exists");
//   // verify the captcha token
//   if (c.env.CLOUDFLARE_SECRET) {
//     // Validate the token by calling the "/siteverify" API endpoint.
//     let formData = new FormData();

//     formData.append("secret", c.env.CLOUDFLARE_SECRET);
//     formData.append("response", token);
//     formData.append("remoteip", ip);

//     const result = await fetch(
//       "https://challenges.cloudflare.com/turnstile/v0/siteverify",
//       {
//         body: formData,
//         method: "POST",
//       },
//     );

//     const outcome = await result.json() as { success: boolean };
//     if (!outcome.success) {
//       return badRequest("Invalid captcha");
//     }
//   }
//   //TODO add email verification
//   const user = await users.InsertOne({
//     name: body.name,
//     email: body.email,
//     uuid: crypto.randomUUID(),
//     token: genVanity(Styles.default, 20),
//     upload_limit: UploadLimits.User,
//   });
// });

api.post("/upload", async (c) => {
  if (await c.env.ASCELLA_KV.get("shutdown") == "true") {
    return badRequest("Ascella is currently shutdown");
  }
  let user;
  if (c.req.headers.get("ascella-token")) {
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
  let file = form.get("file") as File;

  if (file instanceof File) {
    const [_, { files: fOrm }] = getOrm(c.env.__D1_BETA__);
    const bannedFileTypes = ["application/"];
    if (bannedFileTypes.some((x) => (file as File)?.type.startsWith(x))) {
      return badRequest("Disallowed file type");
    }
    const ext = extension(file.type) || "png";
    const filename = `${genVanity(Styles.ulid)}.${ext}`;
    const del = genVanity(Styles.ulid);
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
    const replaces = {
      ip: c.req.headers.get("cf-connecting-ip"),
      filename: file.name,
      vanity: vanity,
      size: file.size,
      type: file.type,
      extension: ext,
    };
    const embed = {
      color: settings.embed.color,
      title: stringInject(settings.embed.title, replaces),
      description: stringInject(settings.embed.description, replaces),
      sitename: stringInject(settings.embed.sitename, replaces),
      sitenameUrl: settings.embed.sitenameUrl as string,
      author: stringInject(settings.embed.author, replaces),
      authorUrl: settings.embed.authorUrl as string,
    };
    let res = await c.env.ASCELLA_DATA.put(
      `${user.uuid}/${filename}`,
      file,
      {
        httpMetadata: {
          "contentType": file.type,
        },

        customMetadata: {
          "expires-at": (Date.now() + settings.autodelete * 24 * 60 * 60 * 1000)
            .toString(),
          "delete": del,
          "ip": c.req.headers.get("cf-connecting-ip") || "",
          ...embed,
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
      delete: `${backend}/files/${vanity}/delete/${del}`,
      size: res.size,
      vanity: vanity,
      url,
    });
  } else {
    return badRequest("Invalid file");
  }
});

export default api;
