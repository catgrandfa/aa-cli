import test from "node:test";
import assert from "node:assert/strict";
import { describeCommand } from "../src/core/describe.js";
import { rootCommand } from "../src/cli.js";

test("describeCommand returns nested subcommand metadata", () => {
  const payload = describeCommand(rootCommand);

  assert.equal(payload.command, "aa");
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa doctor"));
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa version"));
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa list users"));
});
