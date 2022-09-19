import { AscellaContext, commands, createOption } from "./mod";
import {
  APIBaseInteraction,
  APIChatInputApplicationCommandInteractionData,
  APIEmbed,
  APIMessageApplicationCommandInteractionData,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";

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
