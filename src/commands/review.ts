import { AscellaContext, createOption } from "./mod";
import { ApplicationCommandOptionTypes } from "discordeno/types";
export default {
  name: "review",
  description: "Review Ascella",
  options: [createOption("review", "The review", ApplicationCommandOptionTypes.String, true)],
  async exec(ctx: AscellaContext) {
    const { reviews } = ctx.tables;
    const review = ctx.getValue<string>("review", true);
    const avatar = `https://cdn.discordapp.com/avatars/${ctx.user?.id}/${ctx.user?.avatar}.png?size=2048`;

    try {
      await reviews.InsertOne({
        name: ctx.user!.username,
        avatar: avatar,
        comment: review,
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
