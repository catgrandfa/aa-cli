import { parseArgs } from "node:util";
import { createOutput } from "./core/output.js";
import { CLIError, getExitCode } from "./core/errors.js";
import { describeCommand, renderHelp } from "./core/describe.js";
import { parseJsonInput } from "./core/input.js";
import { createUpdateProvider } from "./core/update.js";
import { assertConfirmed } from "./core/safety.js";
import { doctorCommand } from "./commands/doctor.js";
import { helpCommand } from "./commands/help.js";
import { listUsersCommand } from "./commands/list.js";
import { updateApplyCommand } from "./commands/update-apply.js";
import { updateCheckCommand } from "./commands/update-check.js";
import { versionCommand } from "./commands/version.js";

function detectPlatform() {
  if (process.env.AA_TEST_PLATFORM) {
    return process.env.AA_TEST_PLATFORM;
  }

  if (process.platform === "darwin" && process.arch === "arm64") {
    return "darwin-arm64";
  }

  return `${process.platform}-${process.arch}`;
}

function detectRuntimeMode() {
  if (process.env.AA_RUNTIME_MODE) {
    return process.env.AA_RUNTIME_MODE;
  }

  return process.argv[1]?.endsWith(".js") ? "source" : "packaged-binary";
}

function findCommand(positionals) {
  const commandKey = ["aa", ...positionals].join(" ").trim();
  return rootCommand.subcommands.find((command) => command.command === commandKey) ?? null;
}

export const rootCommand = {
  command: "aa",
  summary: "Agent-friendly CLI starter template",
  options: [],
  subcommands: [helpCommand, doctorCommand, versionCommand, listUsersCommand, updateCheckCommand, updateApplyCommand],
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
      yes: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      "json-input": { type: "string" },
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
  const structuredInput = parseJsonInput(values["json-input"], null);
  const context = {
    version: "0.1.0",
    runtimeMode: detectRuntimeMode(),
    platform: detectPlatform(),
    rootCommand,
    resolveInput(fallback = {}) {
      if (structuredInput && typeof structuredInput === "object" && !Array.isArray(structuredInput)) {
        return {
          ...fallback,
          ...structuredInput,
        };
      }

      return structuredInput ?? fallback;
    },
    updateProvider: createUpdateProvider({
      currentVersion: "0.1.0",
      runtimeMode: detectRuntimeMode(),
      platform: detectPlatform(),
      executablePath: process.execPath,
      manifestFile: process.env.AA_UPDATE_MANIFEST_FILE,
      manifestUrl: process.env.AA_UPDATE_MANIFEST_URL,
    }),
  };

  try {
    if (values.describe) {
      const targetCommand = positionals.length > 0 ? findCommand(positionals) : rootCommand;
      process.stdout.write(output.serialize(describeCommand(targetCommand ?? rootCommand)));
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

    if (commandKey === "help") {
      process.stdout.write(output.serialize(await helpCommand.run(context)));
      return;
    }

    if (commandKey === "version") {
      process.stdout.write(output.serialize(await versionCommand.run(context)));
      return;
    }

    if (commandKey === "update check") {
      process.stdout.write(output.serialize(await updateCheckCommand.run(context)));
      return;
    }

    if (commandKey === "update apply") {
      if (values["dry-run"]) {
        process.stdout.write(output.serialize(await context.updateProvider.buildPlan()));
        return;
      }

      assertConfirmed({
        yes: values.yes,
        stdinIsTTY: process.stdin.isTTY,
        riskTier: updateApplyCommand.riskTier,
      });
      process.stdout.write(output.serialize(await updateApplyCommand.run(context)));
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
