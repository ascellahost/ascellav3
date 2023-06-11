import { Hono } from "hono";
import { authError, basicData, notFound } from "../../src/errors";
import { verifyKey } from "discord-interactions";
import { DiscordChannel, DiscordInteraction, GuildFeatures } from "discordeno/types";
import { InteractionTypes } from "discordeno/types";
import { AscellaContext, commands, handleCommand } from "./commands/mod";
import { initTables } from "../../src/orm";


export const app = new Hono<{ Bindings: Bindings }>();
app.get("/", async (c) => {
    await c.env.ASCELLA_DB.exec("SELECT 1")
    return c.json(basicData(200, "Welcome to the Ascella API", true));
})

app
    .post("/discord", async (c) => {
        // Using the incoming headers, verify this request actually came from discord.
        const signature = c.req.headers.get("x-signature-ed25519")!;
        const timestamp = c.req.headers.get("x-signature-timestamp")!;
        //@ts-ignore -

        const body = await c.req.arrayBuffer();

        const isValidRequest = verifyKey(body, signature, timestamp, CLIENT_PUB);

        if (!isValidRequest) {
            return authError();
        }
        const message: DiscordInteraction = JSON.parse(new TextDecoder().decode(body));

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
    })
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
        const res = await AscellaContext.rest(CLIENT_TOKEN, `/applications/${CLIENT_ID}/commands`, {
            method: "PUT",
            body: commands,
        });

        return Response.json({
            status: res.status,
            body: await res.json(),
        });
    });

const scheduled = async (controller: any, env: Bindings, ctx: any) => {
    const qr = env.ASCELLA_DB.prepare(
        `SELECT ( SELECT COUNT(*) FROM files ) AS files, ( SELECT COUNT(*) FROM users ) AS users, ( SELECT COUNT(*) FROM users ) AS users, COUNT(*) as domains, ( SELECT COUNT(*) FROM reviews ) AS reviews, ( SELECT SUM(size) FROM files ) AS storageUsage, ( SELECT COUNT(*) FROM files WHERE type = 'redirect' ) AS redirects FROM domains LIMIT 1`
    );
    const record = await qr.first<Record<string, number>>();
    let actx = new AscellaContext({} as DiscordInteraction, { env } as any);

    const channels = await actx.rest(`/guilds/${GUILD_ID}/channels`, {
        method: "GET"
    }).then(r => r.json()) as DiscordChannel[]

    const orderedChannels = channels.filter(x => x.parent_id == GUILD_STATS_ID).sort((x, y) => {
        return (x.position || 0) - (y.position || 0)
    });

    const list = [
        `Files: ${record.files}`,
        `Users: ${record.users}`,
        `Domains: ${record.domains}`,
        `Storage Usage: ${new Intl.NumberFormat("en", {
            unit: "megabyte",
            style: "unit",
            unitDisplay: "short",
            notation: "compact",
        }).format((record.storageUsage / 1000000) | 0)}`,
    ]

    for (let i = 0; i < list.length; i++) {
        await actx.rest(`/channels/${orderedChannels[i].id}`, {
            method: "PATCH",
            body: {
                name: list[i],
            }
        })
    }
}

Object.assign(app, {
    scheduled
})

export default app;