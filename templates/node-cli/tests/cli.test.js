import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

test("aa --describe returns a structured root description", () => {
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "--describe"], {
    cwd: resolve("."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.command, "aa");
  assert.ok(Array.isArray(payload.subcommands));
});

test("aa list users --json returns a structured list", () => {
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "list", "users", "--json"], {
    cwd: resolve("."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), [
    { name: "Alice", email: "alice@co.com", role: "admin" },
    { name: "Bob", email: "bob@co.com", role: "member" },
  ]);
});

test("aa doctor --json reports source runtime capabilities", () => {
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "doctor", "--json"], {
    cwd: resolve("."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    runtime: "source",
    platform: process.platform === "darwin" && process.arch === "arm64" ? "darwin-arm64" : `${process.platform}-${process.arch}`,
    supports_update_apply: false,
  });
});

test("aa version --json reports current metadata", () => {
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "version", "--json"], {
    cwd: resolve("."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.name, "aa");
  assert.equal(payload.version, "0.1.0");
  assert.equal(payload.runtime, "source");
});
