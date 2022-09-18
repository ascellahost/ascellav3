import { Hono } from "hono";
import { extension } from "mime-types";
import { badRequest } from "./errors";
import { genVanity, Styles } from "./urlStyle";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/api/v3/upload", async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return badRequest("Invalid form data");
  }
  let file = form.get("file");

  if (file instanceof File) {
    let uuid = crypto.randomUUID();
    let ext = extension(file.type) || "png";
    let filename = `${uuid}.${ext}`;
    let expires = parseInt(c.req.headers.get("x-delete-days")!) ?? "30";
    let res = await c.env.ASCELLA_DATA.put(`USER_ID/${filename}`, file, {
      // TODO: add delete at property
      customMetadata: {
        "content-type": file.type,
        "content-length": file.size.toString(),
        "expires-at": (Date.now() + expires * 24 * 60 * 60 * 1000).toString(),
      },
    });

    return Response.json({
      filename: filename,
      upload_date: res.uploaded.toISOString(),
      size: res.size,
      vanity: genVanity(Styles.default),
    });
  } else {
    return badRequest("Invalid file");
  }
});

export default app;
