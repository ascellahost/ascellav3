import { Hono } from "hono";
import { extension } from "mime-types";
import { badRequest, notFound } from "./errors";
import { genVanity, Styles } from "./urlStyle";

const app = new Hono<{ Bindings: Bindings }>();

const backend = "http://127.0.0.1:8787";

const testUser = {
  email: "Tricked@tricked.pro",
  name: "Tricked",
  domain: "i.ascella.host",
  uuid: crypto.randomUUID(),
  append: null,
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
app.get("/cdn/:id/:file", async (c) => {
  const { id, file } = await c.req.param();
  let res = await c.env.ASCELLA_DATA.get(`${id}/${file}`) as
    | R2ObjectBody
    | null;
  if (!res) return notFound();
  return new Response(res.body);
});
app.post("/api/v3/upload", async (c) => {
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
    const settings = getHeaderDefaults(testUser, c.req.headers);
    const vanity = settings.vanity ||
      genVanity(settings.url_style, settings.length);
    console.log(vanity);
    if (!vanity) return badRequest("Invalid url style");
    let url = [
      `https://${settings.domain}/`,
      settings.append ? encodeURIComponent(settings.append) + "/" : "",
      vanity,
      settings.ext ? `.${settings.ext}` : "",
    ].join("");

    let res = await c.env.ASCELLA_DATA.put(
      `${testUser.uuid}/${filename}`,
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
    const raw = `${backend}/cdn/${testUser.uuid}/${filename}`;
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

export default app;
