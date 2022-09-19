import { AscellaContext, commands, createOption } from "./mod";
import type { DiscordEmbed, DiscordInteraction } from "discordeno/types";
import {
  ApplicationCommandFlags,
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  InteractionResponseTypes,
  InteractionTypes,
} from "discordeno/types";

export default {
  name: "commands",
  description: "Update all commands",
  async exec(ctx: AscellaContext) {
    const res = await ctx.rest(`/applications/${ctx.clientId}/commands`, {
      method: "PUT",
      body: commands,
    });
    return ctx.send({
      content: `Updated commands: ${res.status} ${res.statusText}`,
    });
  },
};
