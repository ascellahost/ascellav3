import { AscellaContext, createOption } from "./mod";
import type { DiscordEmbed, DiscordInteraction } from "discordeno/types";
import {
  ApplicationCommandFlags,
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  InteractionResponseTypes,
  InteractionTypes,
} from "discordeno/types";
import { getOrm, initTables } from "@/orm";
export default {
  name: "update-tables",
  "description": "Updates the tables",
  "options": [
    createOption(
      "force",
      "force set the tables",
      ApplicationCommandOptionTypes.Boolean,
      false,
    ),
  ],
  async exec(ctx: AscellaContext) {
    const { users, domains, files, reviews } = ctx.tables;
    const force = ctx.getValue<boolean>("force", false) ? "force" : "default";
    try {
      await initTables(ctx.orm, force);
      return ctx.send({
        content: `Success`,
      });
    } catch (e) {
      return ctx.send({
        content: `Error: ${e}`,
      });
    }
  },
};
