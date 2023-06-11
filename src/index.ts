import { Hono } from "hono";
import { basicData, notFound } from "./errors";
import { initTables } from "./orm";
import { sentry } from "@hono/sentry";
import api from "./api";
import oauth from "./oauth";

export const app = new Hono<{ Bindings: Bindings }>();

if (!DEBUG) api.use("*", sentry({ dsn: SENTRY_DSN }));

app.get("/", async (c) => {
  Response.json(basicData(200, "Welcome to the Ascella API", true));
});

app.get("/cdn/:id/:file", async (c) => {
  const { id, file } = await c.req.param();

  let res = (await c.env.ASCELLA_DATA.get(`${id}/${file}`)) as R2ObjectBody | null;
  if (!res) return notFound();
  return new Response(res.body, {
    headers: {
      "Content-Type": res.httpMetadata?.["contentType"] || "image/png",
    },
  });
});

app
  .get(async (c) => {
    const { token, force } = c.req.query();
    if (!token) {
      return Response.json({ error: "Missing Token" }, { status: 400 });
    }
    if (token != CLIENT_TOKEN) {
      return Response.json({ error: "Invalid Token" }, { status: 401 });
    }
    try {
      await initTables(c.env!.ASCELLA_DB, (force as "default" | "force") || "default");
    } catch {
      return Response.json({ error: "Failed to init tables" }, { status: 500 });
    }

    return Response.json({
      status: 200
    });
  });

app.route("/api/v3", api);
app.route("/oauth", oauth);

app.notFound((c) => notFound());

export default app;
