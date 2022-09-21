import { Context, Hono } from "hono";
import { extension } from "mime-types";
import { authError, badRequest, basicData, notFound } from "./errors";
import { genVanity, Styles } from "./urlStyle";
import { verifyKey } from "discord-interactions";
import type { DiscordInteraction } from "discordeno/types";
import { InteractionTypes } from "discordeno/types";
import { AscellaContext, commands, handleCommand } from "./commands/mod";
import api from "./api";
export const app = new Hono<{ Bindings: Bindings }>();

app.notFound(async (c) => Response.json(notFound()));
app.get(
  "/",
  async (c) => {
    console.log(c.env.__D1_BETA__);
    Response.json(basicData(200, "Welcome to the Ascella API", true));
  },
);
app.get("/cdn/:id/:file", async (c) => {
  const { id, file } = await c.req.param();
  let res = await c.env.ASCELLA_DATA.get(`${id}/${file}`) as
    | R2ObjectBody
    | null;
  if (!res) return notFound();
  return new Response(res.body);
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
  // @ts-ignore -
  if (message.type === InteractionTypes.Ping) {
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

app.route("/api/v3", api);

export default app;
