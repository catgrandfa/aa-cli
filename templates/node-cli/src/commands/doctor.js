export const doctorCommand = {
  command: "aa doctor",
  summary: "Report runtime capabilities for the current environment",
  options: [],
  async run(context) {
    return {
      runtime: context.runtimeMode,
      platform: context.platform,
      supports_update_apply: context.runtimeMode === "packaged-binary",
    };
  },
};
