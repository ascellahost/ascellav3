import { AscellaContext, commands } from "./mod";

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
