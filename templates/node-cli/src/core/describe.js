export function describeCommand(command) {
  return {
    command: command.command,
    summary: command.summary,
    options: command.options ?? [],
    risk_tier: command.riskTier ?? "low",
    supports_dry_run: Boolean(command.supportsDryRun),
    subcommands: (command.subcommands ?? []).map((child) => describeCommand(child)),
  };
}

export function renderHelp(command) {
  return `Usage: ${command.command} [options]\n\n${command.summary}\n`;
}
