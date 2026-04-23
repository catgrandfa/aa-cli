import { CLIError } from "./errors.js";

export function assertConfirmed({ yes, stdinIsTTY, riskTier }) {
  if (riskTier !== "high") {
    return;
  }

  if (!stdinIsTTY && !yes) {
    throw new CLIError({
      code: "confirmation_required",
      message: "--yes required in non-interactive mode",
      retryable: false,
      suggestion: "Re-run the command with --yes",
    });
  }
}
