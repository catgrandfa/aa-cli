export const updateApplyCommand = {
  command: "aa update apply",
  summary: "Download and replace the current packaged binary",
  riskTier: "high",
  supportsDryRun: true,
  options: [],
  async run(context) {
    return context.updateProvider.applyUpdate();
  },
};
