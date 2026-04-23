import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describeCommand } from "../src/core/describe.js";
import { rootCommand } from "../src/cli.js";

test("describeCommand returns nested subcommand metadata", () => {
  const payload = describeCommand(rootCommand);

  assert.equal(payload.command, "aa");
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa doctor"));
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa version"));
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa list users"));
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa update check"));
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa update apply"));
});

test("aa update check --describe returns the nested command description", () => {
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "update", "check", "--describe"], {
    cwd: resolve("."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    command: "aa update check",
    summary: "Check the configured release manifest for a newer packaged binary",
    options: [],
    risk_tier: "low",
    supports_dry_run: false,
    subcommands: [],
  });
});
