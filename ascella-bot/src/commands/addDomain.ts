import { AscellaContext, createOption } from "./mod";
import { ApplicationCommandOptionTypes } from "discordeno/types";
export default {
  name: "add-domain",
  description: "Add a new domain",
  options: [
    createOption("domain", "The domain to add", ApplicationCommandOptionTypes.String, true),
    createOption("official", "Is this an official domain", ApplicationCommandOptionTypes.Boolean, false),
    createOption("apex", "Is this an apex domain", ApplicationCommandOptionTypes.Boolean, false),
    createOption("private", "Is this a private domain", ApplicationCommandOptionTypes.String, false),
  ],
  async exec(ctx: AscellaContext) {
    const { domains } = ctx.tables;
    const domain = ctx.getValue<string>("domain", true);
    const official = ctx.getValue<boolean>("official", false) ? 1 : 0;
    const apex = ctx.getValue<boolean>("apex", false) ? 1 : 0;
    const priv = ctx.getValue<string>("private", false);
    try {
      await domains.InsertOne({
        domain,
        official,
        apex,
        private: priv,
      });
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
