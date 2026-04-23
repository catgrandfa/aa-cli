import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { CLIError } from "./errors.js";

export function parseJsonInput(raw, stdinText) {
  if (!raw) {
    return null;
  }

  const text = raw === "-" ? stdinText ?? readFileSync(0, "utf8") : raw;

  try {
    return JSON.parse(text);
  } catch {
    throw new CLIError({
      code: "invalid_json_input",
      message: "Failed to parse --json-input payload",
      retryable: false,
      suggestion: "Pass valid JSON via --json-input or stdin",
    });
  }
}

export function validatePath(input, baseDir) {
  const resolved = resolve(baseDir, input);

  if (relative(baseDir, resolved).startsWith("..")) {
    throw new CLIError({
      code: "path_traversal_rejected",
      message: `Path traversal rejected: ${input}`,
      input: { path: input },
      retryable: false,
    });
  }

  if (/[\x00-\x1f]/.test(input)) {
    throw new CLIError({
      code: "control_characters_rejected",
      message: "Control characters rejected",
      input: { path: input },
      retryable: false,
    });
  }

  return resolved;
}
