import type { DiscordEmbed, DiscordInteraction } from "discordeno/types";
import { ApplicationCommandOptionTypes, InteractionResponseTypes } from "discordeno/types";
import { Context } from "hono";

import shutdown from "./shutdown";
import cmds from "./commands";
import updateTables from "./updateTables";
import addDomain from "./addDomain";
import review from "./review";

import { getOrm } from "@/orm";
export function createOption(
  name: string,
  description: string,
  type: ApplicationCommandOptionTypes = ApplicationCommandOptionTypes.String,
  required = false
) {
  return {
    name,
    description,
    type,
    required,
  };
}
export class AscellaContext {
  tables: ReturnType<typeof getOrm>;
  orm: ReturnType<typeof getOrm>["orm"];
  constructor(
    private data: DiscordInteraction,
    private context: Context<{
      Bindings: Bindings;
    }>
  ) {
    const orm = getOrm(this.context.env.ASCELLA_DB);
    this.orm = orm.orm;
    this.tables = orm;
  }
  get name() {
    return this.data.data?.name;
  }
  get user() {
    return this.data.member?.user;
  }
  get kv() {
    return this.context.env.ASCELLA_KV;
  }
  get options() {
    return this.data.data?.options;
  }
  get clientId() {
    return CLIENT_ID;
  }
  getValue<T>(name: string, required: false): T | undefined;
  getValue<T>(name: string, required: true): T;
  getValue<T>(name: string, required: boolean): T | undefined {
    let option = this.options?.find((x) => x.name === name);
    if (
      !option ||
      option.type == ApplicationCommandOptionTypes.SubCommand ||
      option.type == ApplicationCommandOptionTypes.SubCommandGroup
    ) {
      if (required) {
        throw new Error(`Missing required option ${name}`);
      }
      return undefined;
    }
    return option.value as T;
  }
  send({ content, embeds, ephemeral }: { content?: string; embeds?: DiscordEmbed[]; ephemeral?: boolean }) {
    return this.context.json({
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content,
        embeds,
        flags: ephemeral ? 64 : undefined,
      },
    });
  }

  static async rest(token: string, endpoint: string, options?: { body?: Record<string, any>; method?: string }) {
    return await fetch(`https://discord.com/api/v10${endpoint}`, {
      method: options?.method || "POST",
      body: options?.body ? JSON.stringify(options?.body) : undefined,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${token}`,
      },
    });
  }

  async rest(endpoint: string, options?: { body?: Record<string, any>; method?: string }) {
    return await AscellaContext.rest(CLIENT_TOKEN, endpoint, options);
  }
}

export const commands = [shutdown, cmds, updateTables, addDomain, review] as const;

export async function handleCommand(
  data: DiscordInteraction,
  context: Context<{
    Bindings: Bindings;
  }>
) {
  let ctx = new AscellaContext(data, context);
  let command = commands.find((x) => x.name === ctx.name);
  if (!command) {
    return ctx.send({
      content: `Unknown command ${ctx.name}`,
    });
  }
  return await command.exec(ctx);
}
