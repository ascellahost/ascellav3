import type { DiscordEmbed, DiscordInteraction } from "discordeno/types";
import {
  ApplicationCommandFlags,
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  InteractionResponseTypes,
  InteractionTypes,
} from "discordeno/types";
import { Context } from "hono";

import shutdown from "./shutdown";
import cmds from "./commands";
export function createOption(
  name: string,
  description: string,
  type: ApplicationCommandOptionTypes = ApplicationCommandOptionTypes.String,
  required = false,
) {
  return {
    name,
    description,
    type,
    required,
  };
}
export class AscellaContext {
  constructor(
    private data: DiscordInteraction,
    private context: Context<string, {
      Bindings: Bindings;
    }>,
  ) {
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
    return this.context.env.CLIENT_ID;
  }
  getValue<T>(name: string, required: boolean): T | undefined {
    let option = this.options?.find((x) => x.name === name);
    if (
      !option || option.type == ApplicationCommandOptionTypes.SubCommand ||
      option.type == ApplicationCommandOptionTypes.SubCommandGroup
    ) {
      if (required) {
        throw new Error(`Missing required option ${name}`);
      }
      return undefined;
    }
    return option.value as T;
  }
  send({
    content,
    embeds,
    ephemeral,
  }: {
    content?: string;
    embeds?: DiscordEmbed[];
    ephemeral?: boolean;
  }) {
    return this.context.json({
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content,
        embeds,
        flags: ephemeral ? 64 : undefined,
      },
    });
  }
  async rest(
    endpoint: string,
    options?: { body?: Record<string, any>; method?: string },
  ) {
    return await fetch(`https://discord.com/api/v10${endpoint}`, {
      method: options?.method || "POST",
      body: options?.body ? JSON.stringify(options?.body) : undefined,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bot ${this.context.env.CLIENT_TOKEN}`,
      },
    });
  }
}

export const commands = [shutdown, cmds] as const;

export async function handleCommand(
  data: DiscordInteraction,
  context: Context<string, {
    Bindings: Bindings;
  }>,
) {
  let ctx = new AscellaContext(data, context);
  let command = commands.find((x) => x.name === ctx.name);
  if (!command) {
    return ctx.send({
      content: `Unknown command ${ctx.name}`,
    });
  }
  return command.exec(ctx);
}
