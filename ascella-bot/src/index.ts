import { Hono } from "hono";
import { authError, basicData, notFound } from "../../src/errors";
import { verifyKey } from "discord-interactions";
import { DiscordChannel, DiscordInteraction, GuildFeatures } from "discordeno/types";
import { InteractionTypes } from "discordeno/types";
import { AscellaContext, commands, handleCommand } from "./commands/mod";
import { initTables } from "../../src/orm";
import { Toucan } from 'toucan-js';


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
    const sentry = new Toucan({
        dsn: SENTRY_DSN,
        context: ctx,

    });
    const qr = env.ASCELLA_DB.prepare(
        `SELECT ( SELECT COUNT(*) FROM files ) AS files, ( SELECT COUNT(*) FROM users ) AS users, ( SELECT COUNT(*) FROM users ) AS users, COUNT(*) as domains, ( SELECT COUNT(*) FROM reviews ) AS reviews, ( SELECT SUM(size) FROM files ) AS storageUsage, ( SELECT COUNT(*) FROM files WHERE type = 'redirect' ) AS redirects FROM domains LIMIT 1`
    );
    const record = await qr.first<Record<string, number>>();
    try {
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
            if (orderedChannels[i].name == list[i]) continue;
            await actx.rest(`/channels/${orderedChannels[i].id}`, {
                method: "PATCH",
                body: {
                    name: list[i],
                }
            })
        }
    } catch (e) {
        console.log(e)
        sentry.captureException(e)
    }

    if (controller.cron !== "30 0 * * *") {
        // normal hourly cron
        return
    }

    const date = new Date();

    date.setDate(date.getDate() - 1);

    const body = {
        query: `
{
  viewer {
    zones(filter: { zoneTag: $tag }) {
      httpRequests1dGroups( limit: 1, filter: {  date: $date }) {
				 uniq {
				 uniques
			}
				sum {
					threats,
					bytes,
					requests,
					encryptedRequests,
					cachedBytes,
					pageViews,
				}
			}
    }
    accounts(filter: { accountTag: $account }) {
      r2StorageAdaptiveGroups(
        limit: 1
        filter: { date: $date, bucketName: "ascella" }
      ) {
        dimensions {
          date
        }
        max {
          metadataSize
          uploadCount
          objectCount
          payloadSize
        }
      }
    }
  }
}
    `,
        variables: {
            tag: "01b3972a62eb7e60ae8657bae191fc18",
            date: date.toISOString().split("T")[0],
            account: CLOUDFLARE_ACCOUNT_ID
        },
    };


    try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/graphql`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json() as any;

        const vv = data.data.viewer.zones[0].httpRequests1dGroups[0]
        const r2 = data.data.viewer.accounts[0].r2StorageAdaptiveGroups[0]
        const obj = {
            date: date.toISOString().split("T")[0],
            date_full: date.toISOString(),
            date_ms: +date,
            ...record,
            ...vv.sum,
            ...vv.uniq,
            ...r2.max,
        }

        const json = JSON.stringify(obj) + "\n";

        const object = await env.ASCELLA_DATA.get("stats.jsonl")

        const text = await object?.text() ?? ""
        console.log(text + json)
        console.log((text + json).split("\n").length)
        await env.ASCELLA_DATA.put("stats.jsonl", text + json)
    } catch (e) {
        sentry.captureException(e)
    }

}

Object.assign(app, {
    scheduled
})

export default app;