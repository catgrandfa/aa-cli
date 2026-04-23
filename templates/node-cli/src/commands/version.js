export const versionCommand = {
  command: "aa version",
  summary: "Show current CLI version metadata",
  options: [],
  async run(context) {
    return {
      name: "aa",
      version: context.version,
      runtime: context.runtimeMode,
      platform: context.platform,
    };
  },
};
