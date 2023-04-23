import { AscellaContext, createOption } from "./mod";
import { ApplicationCommandOptionTypes } from "discordeno/types";
import { initTables } from "@/orm";
export default {
  name: "update-tables",
  description: "Updates the tables",
  options: [createOption("force", "force set the tables", ApplicationCommandOptionTypes.Boolean, false)],
  async exec(ctx: AscellaContext) {
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
