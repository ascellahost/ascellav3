import { AscellaContext, createOption } from "./mod";
import { ApplicationCommandOptionTypes } from "discordeno/types";
export default {
  name: "shutdown",
  description: "Shuts down the uploader in case of ddos",
  options: [createOption("unshutdown", "Unshuts down the uploader in case of ddos", ApplicationCommandOptionTypes.Boolean, false)],
  exec(ctx: AscellaContext) {
    let unshutdown = ctx.getValue<boolean>("unshutdown", false) || false;
    if (unshutdown) {
      ctx.kv.put("shutdown", "false");
    } else {
      ctx.kv.put("shutdown", "true");
    }

    return ctx.send({
      content: `Shut down: ${!unshutdown}`,
    });
  },
};
