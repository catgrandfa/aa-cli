import { parseArgs } from "node:util";
import { createOutput } from "./core/output.js";
import { CLIError, getExitCode } from "./core/errors.js";
import { describeCommand, renderHelp } from "./core/describe.js";
import { doctorCommand } from "./commands/doctor.js";
import { helpCommand } from "./commands/help.js";
import { listUsersCommand } from "./commands/list.js";
import { versionCommand } from "./commands/version.js";

function detectPlatform() {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return "darwin-arm64";
  }

  return `${process.platform}-${process.arch}`;
}

export const rootCommand = {
  command: "aa",
  summary: "Agent-friendly CLI starter template",
  options: [],
  subcommands: [helpCommand, doctorCommand, versionCommand, listUsersCommand],
};

export async function runCli(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      json: { type: "boolean", default: false },
      yaml: { type: "boolean", default: false },
      describe: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
      fields: { type: "string" },
      limit: { type: "string", default: "100" },
    },
  });

  const output = createOutput({
    json: values.json,
    yaml: values.yaml,
    isTTY: process.stdout.isTTY,
    fields: values.fields ?? "",
    limit: values.limit,
  });
  const context = {
    version: "0.1.0",
    runtimeMode: "source",
    platform: detectPlatform(),
    rootCommand,
  };

  try {
    if (values.describe) {
      process.stdout.write(output.serialize(describeCommand(rootCommand)));
      return;
    }

    if (values.help || positionals.length === 0) {
      process.stdout.write(renderHelp(rootCommand));
      return;
    }

    const commandKey = positionals.join(" ");

    if (commandKey === "list users") {
      process.stdout.write(output.serialize(await listUsersCommand.run(context)));
      return;
    }

    if (commandKey === "doctor") {
      process.stdout.write(output.serialize(await doctorCommand.run(context)));
      return;
    }

    if (commandKey === "version") {
      process.stdout.write(output.serialize(await versionCommand.run(context)));
      return;
    }

    throw new CLIError({
      code: "unknown_command",
      message: `Unknown command: ${commandKey}`,
      input: { command: positionals },
      retryable: false,
      suggestion: "Run aa --describe to inspect supported commands",
    });
  } catch (error) {
    if (error instanceof CLIError) {
      process.stderr.write(`${JSON.stringify(error.toJSON(), null, 2)}\n`);
    } else {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    }
    process.exitCode = getExitCode(error);
  }
}
