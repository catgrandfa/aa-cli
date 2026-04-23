export const updateCheckCommand = {
  command: "aa update check",
  summary: "Check the configured release manifest for a newer packaged binary",
  options: [],
  async run(context) {
    const manifest = await context.updateProvider.fetchManifest();
    return context.updateProvider.buildCheckResult(manifest);
  },
};
