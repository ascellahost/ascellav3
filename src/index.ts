import { Context, Hono } from "hono";
import { extension } from "mime-types";
import { authError, badRequest, basicData, notFound } from "./errors";
import { genVanity, Styles } from "./urlStyle";
import { verifyKey } from "discord-interactions";
import type { DiscordInteraction } from "discordeno/types";
import { InteractionTypes } from "discordeno/types";
import { AscellaContext, commands, handleCommand } from "./commands/mod";
const app = new Hono<{ Bindings: Bindings }>();

const backend = "http://127.0.0.1:8787";

enum UploadLimits {
  Guest = 1024 * 1024 * 5,
  User = 1024 * 1024 * 10,
  Premium = 1024 * 1024 * 100,
  Admin = 1024 * 1024 * 512,
}

const testUser = {
  email: "Tricked@tricked.pro",
  name: "Tricked",
  domain: "i.ascella.host",
  uuid: crypto.randomUUID(),
  append: null,
  limit: UploadLimits.Admin,
  url_style: Styles.default,
};
let getHeaderDefaults = (user: Record<string, any>, headers: Headers) => {
  let defaults: Record<string, any> = {
    ...user,
  };
  ["domain", "append", "vanity", "ext"].forEach((x) =>
    defaults[x] = headers.get(`x-ascella-${x}`) || defaults[x]
  );
  let style = parseInt(headers.get("x-ascella-style")!);
  if (style) {
    defaults.url_style = style;
  }
  let autodelete = parseInt(headers.get("x-ascella-autodelete")!);
  if (autodelete) {
    defaults.autodelete = autodelete;
  }
  let length = parseInt(headers.get("x-ascella-vanity-length")!);
  if (length) {
    defaults.length = length;
  }
  return defaults;
};
app.notFound(async (c) =>
  Response.json(basicData(200, "Welcome to the Ascella API", true))
);
app.get("/cdn/:id/:file", async (c) => {
  const { id, file } = await c.req.param();
  let res = await c.env.ASCELLA_DATA.get(`${id}/${file}`) as
    | R2ObjectBody
    | null;
  if (!res) return notFound();
  return new Response(res.body);
});
app.get("/api/v3/file/:vanity", async (c) => {
  const { vanity } = await c.req.param();
  let res = await c.env.ASCELLA_DATA.get(`${vanity}`) as
    | R2ObjectBody
    | null;
  if (!res) return notFound();
  return new Response(res.body);
});
app.post("/api/v3/upload", async (c) => {
  if (await c.env.ASCELLA_KV.get("shutdown") == "true") {
    return badRequest("Aascella is currently shutdown");
  }
  let user;
  if (c.req.headers.get("x-ascella-token")) {
    user = testUser;
  } else {
    user = {
      email: "",
      name: "",
      domain: "",
      uuid: "guest",
      limit: UploadLimits.Guest,
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
          "content-type": file.type,
          "content-length": file.size.toString(),
          "expires-at": (Date.now() + settings.autodelete * 24 * 60 * 60 * 1000)
            .toString(),
        },
      },
    );
    const raw = `${backend}/cdn/${user.uuid}/${filename}`;
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

app.post("/discord", async (c) => {
  // Using the incoming headers, verify this request actually came from discord.
  const signature = c.req.headers.get("x-signature-ed25519")!;
  const timestamp = c.req.headers.get("x-signature-timestamp")!;
  const body = await c.req.clone().arrayBuffer();

  const isValidRequest = verifyKey(
    body,
    signature,
    timestamp,
    c.env.CLIENT_PUB,
  );

  if (!isValidRequest) {
    return authError();
  }
  const message = await c.req.json<
    DiscordInteraction
  >();
  //@ts-ignore -
  if (message.type === InteractionType.Ping) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    console.log("Handling Ping request");
    return Response.json({
      type: InteractionTypes.Ping,
    });
  }

  if (message.type === InteractionTypes.ApplicationCommand) {
    return await handleCommand(message, c);
  }

  return Response.json({ error: "Unknown Type" }, { status: 400 });
});

export default app;
