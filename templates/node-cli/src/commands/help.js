import { renderHelp } from "../core/describe.js";

export const helpCommand = {
  command: "aa help",
  summary: "Render concise help for the root command tree",
  options: [],
  async run(context) {
    return {
      help: renderHelp(context.rootCommand),
    };
  },
};
