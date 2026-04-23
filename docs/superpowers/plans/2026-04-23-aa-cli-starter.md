# aa-cli Starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first reusable `aa-cli` starter repository with practice docs, a zero-dependency Node.js CLI template, a companion CLI skill template, structured example contracts, and a real manifest-based self-update path for packaged binaries.

**Architecture:** Keep the repository split between shared guidance and a concrete starter template. The implementation lives under `templates/node-cli`, where commands export metadata plus a `run()` function and shared runtime behavior comes from `src/core`. Release/update logic is implemented in the starter as a provider-backed module that can check and apply binary updates while refusing unsupported source-runtime update attempts.

**Tech Stack:** Markdown docs, Node.js standard library (`node:test`, `node:assert`, `node:util`, `node:fs`, `node:path`, `node:os`, `node:https`, `node:crypto`, `node:stream`, `node:child_process` only if strictly required), Bun packaging documented for release.

---

## File Map

- Create: `.gitignore`
- Create: `README.md`
- Create: `docs/aa-cli-practice.md`
- Create: `docs/command-contract.md`
- Create: `docs/release-and-update.md`
- Create: `examples/contracts/users-list.json`
- Create: `examples/contracts/deploy-dry-run.json`
- Create: `examples/contracts/error-image-not-found.json`
- Create: `examples/contracts/update-check.json`
- Create: `skills/cli-agent/SKILL.md`
- Create: `skills/cli-agent/templates/command-spec.md`
- Create: `skills/cli-agent/templates/error-catalog.md`
- Create: `skills/cli-agent/templates/release-checklist.md`
- Create: `templates/node-cli/package.json`
- Create: `templates/node-cli/README.md`
- Create: `templates/node-cli/bin/aa.js`
- Create: `templates/node-cli/src/cli.js`
- Create: `templates/node-cli/src/core/output.js`
- Create: `templates/node-cli/src/core/errors.js`
- Create: `templates/node-cli/src/core/input.js`
- Create: `templates/node-cli/src/core/safety.js`
- Create: `templates/node-cli/src/core/describe.js`
- Create: `templates/node-cli/src/core/update.js`
- Create: `templates/node-cli/src/commands/help.js`
- Create: `templates/node-cli/src/commands/list.js`
- Create: `templates/node-cli/src/commands/doctor.js`
- Create: `templates/node-cli/src/commands/version.js`
- Create: `templates/node-cli/src/commands/update-check.js`
- Create: `templates/node-cli/src/commands/update-apply.js`
- Create: `templates/node-cli/tests/output.test.js`
- Create: `templates/node-cli/tests/input.test.js`
- Create: `templates/node-cli/tests/describe.test.js`
- Create: `templates/node-cli/tests/cli.test.js`
- Create: `templates/node-cli/tests/update.test.js`

### Task 1: Set up repository scaffolding and test harness

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `templates/node-cli/package.json`
- Create: `templates/node-cli/README.md`
- Create: `templates/node-cli/bin/aa.js`

- [ ] **Step 1: Write the failing smoke test for the template entrypoint**

```js
// templates/node-cli/tests/cli.test.js
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
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/cli.test.js`
Expected: FAIL because `bin/aa.js` and the CLI runtime do not exist yet.

- [ ] **Step 3: Add repository scaffolding and the minimal executable**

```json
// templates/node-cli/package.json
{
  "name": "aa-node-cli-template",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "aa": "./bin/aa.js"
  },
  "scripts": {
    "test": "node --test tests/*.test.js"
  }
}
```

```js
// templates/node-cli/bin/aa.js
#!/usr/bin/env node
import { runCli } from "../src/cli.js";

await runCli(process.argv.slice(2));
```

```gitignore
# .gitignore
.worktrees/
```

```md
# README.md

`aa-cli` is a starter repository for building agent-friendly CLIs with shared command contracts, reusable docs, a Node.js template, and release/update conventions.
```

- [ ] **Step 4: Run the smoke test again**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/cli.test.js`
Expected: FAIL again, but now because `src/cli.js` is missing rather than the binary entrypoint.

- [ ] **Step 5: Commit the scaffolding once the test is red for the right reason**

```bash
git add .gitignore README.md templates/node-cli/package.json templates/node-cli/bin/aa.js templates/node-cli/tests/cli.test.js
git commit -m "chore: scaffold aa-cli starter template"
```

### Task 2: Implement core CLI contract helpers with TDD

**Files:**
- Create: `templates/node-cli/src/core/output.js`
- Create: `templates/node-cli/src/core/errors.js`
- Create: `templates/node-cli/src/core/input.js`
- Create: `templates/node-cli/src/core/safety.js`
- Test: `templates/node-cli/tests/output.test.js`
- Test: `templates/node-cli/tests/input.test.js`

- [ ] **Step 1: Write failing tests for output selection, structured errors, and JSON input**

```js
// templates/node-cli/tests/output.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { createOutput } from "../src/core/output.js";

test("createOutput prefers json for non-tty mode", () => {
  const output = createOutput({ json: false, yaml: false, isTTY: false, fields: "", limit: "100" });
  assert.equal(output.mode, "json");
});

test("createOutput limits list payloads and picks requested fields", () => {
  const output = createOutput({ json: true, yaml: false, isTTY: true, fields: "name,role", limit: "1" });
  const rendered = output.serialize([
    { name: "Alice", email: "alice@co.com", role: "admin" },
    { name: "Bob", email: "bob@co.com", role: "member" }
  ]);

  assert.deepEqual(JSON.parse(rendered), [{ name: "Alice", role: "admin" }]);
});
```

```js
// templates/node-cli/tests/input.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { parseJsonInput, validatePath } from "../src/core/input.js";
import { CLIError } from "../src/core/errors.js";

test("parseJsonInput reads inline json payloads", () => {
  assert.deepEqual(parseJsonInput("{\"title\":\"Bug\"}", null), { title: "Bug" });
});

test("parseJsonInput throws CLIError on malformed json", () => {
  assert.throws(() => parseJsonInput("{bad", null), CLIError);
});

test("validatePath rejects traversal outside the base directory", () => {
  assert.throws(() => validatePath("../secrets", "/tmp/base"), CLIError);
});
```

- [ ] **Step 2: Run the core helper tests to verify they fail**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/output.test.js tests/input.test.js`
Expected: FAIL because the core helper modules do not exist yet.

- [ ] **Step 3: Write the minimal core helper implementations**

```js
// templates/node-cli/src/core/errors.js
export class CLIError extends Error {
  constructor({ code, message, input = undefined, retryable = false, suggestion = undefined }) {
    super(message);
    this.name = "CLIError";
    this.code = code;
    this.input = input;
    this.retryable = retryable;
    this.suggestion = suggestion;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        input: this.input,
        retryable: this.retryable,
        suggestion: this.suggestion,
      },
    };
  }
}
```

```js
// templates/node-cli/src/core/output.js
function pickFields(item, fields) {
  if (!fields.length) return item;
  return Object.fromEntries(fields.filter((key) => key in item).map((key) => [key, item[key]]));
}

export function createOutput({ json, yaml, isTTY, fields, limit }) {
  const mode = json || !isTTY ? "json" : yaml ? "yaml" : "table";
  const keys = fields ? fields.split(",").filter(Boolean) : [];
  const cap = Number.parseInt(limit ?? "100", 10);

  return {
    mode,
    serialize(data) {
      const normalized = Array.isArray(data) ? data.slice(0, cap).map((item) => pickFields(item, keys)) : pickFields(data, keys);
      if (mode === "json") return `${JSON.stringify(normalized, null, 2)}\n`;
      if (mode === "yaml") throw new Error("yaml_not_implemented");
      return `${JSON.stringify(normalized, null, 2)}\n`;
    },
  };
}
```

```js
// templates/node-cli/src/core/input.js
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { CLIError } from "./errors.js";

export function parseJsonInput(raw, stdinText) {
  if (!raw) return null;
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
```

```js
// templates/node-cli/src/core/safety.js
import { CLIError } from "./errors.js";

export function assertConfirmed({ yes, stdinIsTTY, riskTier }) {
  if (riskTier !== "high") return;
  if (!stdinIsTTY && !yes) {
    throw new CLIError({
      code: "confirmation_required",
      message: "--yes required in non-interactive mode",
      retryable: false,
      suggestion: "Re-run the command with --yes",
    });
  }
}
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/output.test.js tests/input.test.js`
Expected: PASS with 5 passing tests and 0 failures.

- [ ] **Step 5: Commit the core helper layer**

```bash
git add templates/node-cli/src/core/errors.js templates/node-cli/src/core/output.js templates/node-cli/src/core/input.js templates/node-cli/src/core/safety.js templates/node-cli/tests/output.test.js templates/node-cli/tests/input.test.js
git commit -m "feat: add core cli contract helpers"
```

### Task 3: Implement command metadata, help/describe, and sample commands

**Files:**
- Create: `templates/node-cli/src/cli.js`
- Create: `templates/node-cli/src/core/describe.js`
- Create: `templates/node-cli/src/commands/help.js`
- Create: `templates/node-cli/src/commands/list.js`
- Create: `templates/node-cli/src/commands/doctor.js`
- Create: `templates/node-cli/src/commands/version.js`
- Test: `templates/node-cli/tests/describe.test.js`
- Test: `templates/node-cli/tests/cli.test.js`

- [ ] **Step 1: Write failing tests for describe output and example commands**

```js
// templates/node-cli/tests/describe.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { describeCommand } from "../src/core/describe.js";
import { rootCommand } from "../src/cli.js";

test("describeCommand returns nested subcommand metadata", () => {
  const payload = describeCommand(rootCommand);
  assert.equal(payload.command, "aa");
  assert.ok(payload.subcommands.some((entry) => entry.command === "aa update"));
});
```

```js
// templates/node-cli/tests/cli.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function run(args) {
  return spawnSync(process.execPath, [resolve("bin/aa.js"), ...args], {
    cwd: resolve("."),
    encoding: "utf8",
  });
}

test("aa list users --json returns a structured list", () => {
  const result = run(["list", "users", "--json"]);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), [
    { name: "Alice", email: "alice@co.com", role: "admin" },
    { name: "Bob", email: "bob@co.com", role: "member" }
  ]);
});
```

- [ ] **Step 2: Run describe and command tests to verify they fail**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/describe.test.js tests/cli.test.js`
Expected: FAIL because the command router, describe helper, and sample commands do not exist.

- [ ] **Step 3: Implement the command registry and describe/help support**

```js
// templates/node-cli/src/core/describe.js
export function describeCommand(command) {
  return {
    command: command.command,
    summary: command.summary,
    risk_tier: command.riskTier ?? "low",
    supports_dry_run: Boolean(command.supportsDryRun),
    options: command.options ?? [],
    subcommands: (command.subcommands ?? []).map((child) => describeCommand(child)),
  };
}

export function renderHelp(command) {
  const lines = [
    `Usage: ${command.command} [options]`,
    "",
    command.summary,
  ];
  return `${lines.join("\n")}\n`;
}
```

```js
// templates/node-cli/src/commands/list.js
export const listUsersCommand = {
  command: "aa list users",
  summary: "List users in a structured format",
  options: [],
  async run() {
    return [
      { name: "Alice", email: "alice@co.com", role: "admin" },
      { name: "Bob", email: "bob@co.com", role: "member" },
    ];
  },
};
```

```js
// templates/node-cli/src/commands/doctor.js
export const doctorCommand = {
  command: "aa doctor",
  summary: "Report runtime capabilities for the current environment",
  options: [],
  async run(context) {
    return {
      runtime: context.runtimeMode,
      platform: context.platform,
      supports_update_apply: context.runtimeMode === "packaged-binary",
    };
  },
};
```

```js
// templates/node-cli/src/commands/version.js
export const versionCommand = {
  command: "aa version",
  summary: "Show current CLI version metadata",
  options: [],
  async run(context) {
    return {
      name: "aa",
      version: context.version,
      runtime: context.runtimeMode,
      platform: context.platform,
    };
  },
};
```

```js
// templates/node-cli/src/commands/help.js
import { renderHelp } from "../core/describe.js";

export const helpCommand = {
  command: "aa help",
  summary: "Render concise help output for the root command tree",
  options: [],
  async run(context) {
    return {
      help: renderHelp(context.rootCommand),
    };
  },
};
```

```js
// templates/node-cli/src/cli.js
import { parseArgs } from "node:util";
import { createOutput } from "./core/output.js";
import { CLIError } from "./core/errors.js";
import { describeCommand, renderHelp } from "./core/describe.js";
import { doctorCommand } from "./commands/doctor.js";
import { helpCommand } from "./commands/help.js";
import { listUsersCommand } from "./commands/list.js";
import { versionCommand } from "./commands/version.js";

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

  if (values.describe) {
    process.stdout.write(output.serialize(describeCommand(rootCommand)));
    return;
  }

  if (values.help || positionals.length === 0) {
    process.stdout.write(renderHelp(rootCommand));
    return;
  }

  if (positionals.join(" ") === "list users") {
    process.stdout.write(output.serialize(await listUsersCommand.run()));
    return;
  }

  throw new CLIError({
    code: "unknown_command",
    message: `Unknown command: ${positionals.join(" ")}`,
    input: { command: positionals },
    retryable: false,
    suggestion: "Run aa --describe to inspect supported commands",
  });
}
```

- [ ] **Step 4: Run the describe and CLI tests again**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/describe.test.js tests/cli.test.js`
Expected: PASS with the root `--describe` path and `list users` behavior working.

- [ ] **Step 5: Commit the command router and sample commands**

```bash
git add templates/node-cli/src/cli.js templates/node-cli/src/core/describe.js templates/node-cli/src/commands/list.js templates/node-cli/src/commands/doctor.js templates/node-cli/src/commands/version.js templates/node-cli/tests/describe.test.js templates/node-cli/tests/cli.test.js
git commit -m "feat: add root command routing and describe support"
```

### Task 4: Implement manifest-based update check/apply with TDD

**Files:**
- Create: `templates/node-cli/src/core/update.js`
- Create: `templates/node-cli/src/commands/update-check.js`
- Create: `templates/node-cli/src/commands/update-apply.js`
- Test: `templates/node-cli/tests/update.test.js`

- [ ] **Step 1: Write failing tests for update manifest parsing and runtime restrictions**

```js
// templates/node-cli/tests/update.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { CLIError } from "../src/core/errors.js";
import { resolveManifestTarget, buildUpdateCheckResult, assertUpdateRuntimeSupported } from "../src/core/update.js";

const manifest = {
  name: "aa",
  version: "0.2.0",
  published_at: "2026-04-23T12:00:00Z",
  notes_url: "https://example.com/releases/v0.2.0",
  platforms: {
    "darwin-arm64": {
      url: "https://example.com/aa-darwin-arm64",
      sha256: "abc"
    }
  }
};

test("resolveManifestTarget returns the matching platform asset", () => {
  assert.deepEqual(resolveManifestTarget(manifest, "darwin-arm64"), manifest.platforms["darwin-arm64"]);
});

test("resolveManifestTarget throws CLIError for missing platform assets", () => {
  assert.throws(() => resolveManifestTarget(manifest, "linux-x64"), CLIError);
});

test("assertUpdateRuntimeSupported rejects source-runtime apply", () => {
  assert.throws(() => assertUpdateRuntimeSupported("source"), CLIError);
});

test("buildUpdateCheckResult reports update availability", () => {
  assert.deepEqual(buildUpdateCheckResult({ currentVersion: "0.1.0", manifest, platform: "darwin-arm64" }), {
    name: "aa",
    current_version: "0.1.0",
    latest_version: "0.2.0",
    update_available: true,
    platform: "darwin-arm64",
    notes_url: "https://example.com/releases/v0.2.0"
  });
});
```

- [ ] **Step 2: Run the update tests to verify they fail**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/update.test.js`
Expected: FAIL because the update helpers do not exist yet.

- [ ] **Step 3: Implement update helpers plus `update check` and `update apply` commands**

```js
// templates/node-cli/src/core/update.js
import { CLIError } from "./errors.js";

export function resolveManifestTarget(manifest, platform) {
  const target = manifest.platforms?.[platform];
  if (!target) {
    throw new CLIError({
      code: "platform_asset_missing",
      message: `No update asset is available for platform '${platform}'`,
      input: { platform },
      retryable: false,
    });
  }
  return target;
}

export function assertUpdateRuntimeSupported(runtimeMode) {
  if (runtimeMode !== "packaged-binary") {
    throw new CLIError({
      code: "unsupported_runtime_mode",
      message: "update apply only works from a packaged binary runtime",
      retryable: false,
      suggestion: "Build or install a packaged binary before running aa update apply",
    });
  }
}

export function buildUpdateCheckResult({ currentVersion, manifest, platform }) {
  resolveManifestTarget(manifest, platform);
  return {
    name: manifest.name,
    current_version: currentVersion,
    latest_version: manifest.version,
    update_available: currentVersion !== manifest.version,
    platform,
    notes_url: manifest.notes_url,
  };
}
```

```js
// templates/node-cli/src/commands/update-check.js
export const updateCheckCommand = {
  command: "aa update check",
  summary: "Check the release manifest for a newer packaged binary",
  options: [],
  async run(context) {
    const manifest = await context.updateProvider.fetchManifest();
    return context.updateProvider.buildCheckResult(manifest);
  },
};
```

```js
// templates/node-cli/src/commands/update-apply.js
export const updateApplyCommand = {
  command: "aa update apply",
  summary: "Download and replace the current packaged binary",
  riskTier: "high",
  options: [],
  async run(context) {
    return context.updateProvider.applyUpdate();
  },
};
```

- [ ] **Step 4: Run the update tests again**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/update.test.js`
Expected: PASS with manifest resolution and runtime checks covered.

- [ ] **Step 5: Commit the update flow**

```bash
git add templates/node-cli/src/core/update.js templates/node-cli/src/commands/update-check.js templates/node-cli/src/commands/update-apply.js templates/node-cli/tests/update.test.js
git commit -m "feat: add manifest-based update flow"
```

### Task 5: Write docs, skill assets, and example contracts

**Files:**
- Create: `docs/aa-cli-practice.md`
- Create: `docs/command-contract.md`
- Create: `docs/release-and-update.md`
- Create: `skills/cli-agent/SKILL.md`
- Create: `skills/cli-agent/templates/command-spec.md`
- Create: `skills/cli-agent/templates/error-catalog.md`
- Create: `skills/cli-agent/templates/release-checklist.md`
- Create: `examples/contracts/users-list.json`
- Create: `examples/contracts/deploy-dry-run.json`
- Create: `examples/contracts/error-image-not-found.json`
- Create: `examples/contracts/update-check.json`

- [ ] **Step 1: Write a failing documentation regression test that checks key contract phrases**

```js
// templates/node-cli/tests/cli.test.js
import { readFileSync } from "node:fs";

test("practice docs mention json output, dry-run, and update flow", () => {
  const practice = readFileSync(resolve("../docs/aa-cli-practice.md"), "utf8");
  assert.match(practice, /--json/);
  assert.match(practice, /--dry-run/);
  assert.match(practice, /update check/);
});
```

- [ ] **Step 2: Run the doc regression test to verify it fails**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/cli.test.js`
Expected: FAIL because the repository docs and skill assets do not exist yet.

- [ ] **Step 3: Write the repository docs, skill, and example contracts**

```md
<!-- docs/aa-cli-practice.md -->
# aa-cli Practice

Document the eight core CLI rules with Bad/Good examples in Node.js, plus guidance for YAML as an optional extension, binary packaging with Bun, and manifest-driven updates.
```

```md
<!-- docs/command-contract.md -->
# Command Contract

Define command path conventions, shared flags, error payload shape, risk tiers, and the required `--describe` metadata schema.
```

```md
<!-- docs/release-and-update.md -->
# Release and Update

Document Bun target platforms, release asset naming, the manifest schema, and how `aa update check` and `aa update apply` behave in packaged-binary versus source runtime modes.
```

```md
<!-- skills/cli-agent/SKILL.md -->
# CLI Agent Skill

Require contract-first CLI changes, synchronized docs and examples, and release/update impact checks for every command change.
```

```json
// examples/contracts/update-check.json
{
  "name": "aa",
  "current_version": "0.1.0",
  "latest_version": "0.2.0",
  "update_available": true,
  "platform": "darwin-arm64",
  "notes_url": "https://example.com/releases/v0.2.0"
}
```

- [ ] **Step 4: Run the doc regression test again**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/cli.test.js`
Expected: PASS with the repository docs present and the required contract text included.

- [ ] **Step 5: Commit the docs and skill assets**

```bash
git add docs/aa-cli-practice.md docs/command-contract.md docs/release-and-update.md skills/cli-agent/SKILL.md skills/cli-agent/templates/command-spec.md skills/cli-agent/templates/error-catalog.md skills/cli-agent/templates/release-checklist.md examples/contracts/users-list.json examples/contracts/deploy-dry-run.json examples/contracts/error-image-not-found.json examples/contracts/update-check.json
git commit -m "docs: add aa-cli practice guide and cli skill"
```

### Task 6: Run full verification and prepare the branch

**Files:**
- Modify: plan checkboxes in `docs/superpowers/plans/2026-04-23-aa-cli-starter.md`

- [ ] **Step 1: Run the full template test suite**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node --test tests/*.test.js`
Expected: PASS with all tests green and 0 failures.

- [ ] **Step 2: Run smoke commands for describe, list, doctor, version, and update check**

Run: `cd /Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli && node bin/aa.js --describe && node bin/aa.js list users --json && node bin/aa.js doctor --json && node bin/aa.js version --json`
Expected: Structured JSON output for each command with no stderr output.

- [ ] **Step 3: Review the repository against the design spec**

Check:
- `docs/superpowers/specs/2026-04-23-aa-cli-practice-design.md`
- Every required docs/template/skills/examples file from the spec exists
- Update apply returns `unsupported_runtime_mode` when running from source

- [ ] **Step 4: Commit any final checklist updates**

```bash
git add .
git commit -m "chore: finalize aa-cli starter"
```
