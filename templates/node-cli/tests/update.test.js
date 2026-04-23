import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { CLIError } from "../src/core/errors.js";
import {
  assertUpdateRuntimeSupported,
  buildUpdateCheckResult,
  resolveManifestTarget,
} from "../src/core/update.js";

const manifest = {
  name: "aa",
  version: "0.2.0",
  published_at: "2026-04-23T12:00:00Z",
  notes_url: "https://example.com/releases/v0.2.0",
  platforms: {
    "darwin-arm64": {
      url: "https://example.com/aa-darwin-arm64",
      sha256: "abc",
    },
    "linux-x64": {
      url: "https://example.com/aa-linux-x64",
      sha256: "def",
    },
  },
};

function writeManifest() {
  const dir = mkdtempSync(join(tmpdir(), "aa-cli-manifest-"));
  const path = join(dir, "manifest.json");
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  return path;
}

test("resolveManifestTarget returns the matching platform asset", () => {
  assert.deepEqual(resolveManifestTarget(manifest, "darwin-arm64"), manifest.platforms["darwin-arm64"]);
});

test("resolveManifestTarget throws CLIError for missing platform assets", () => {
  assert.throws(() => resolveManifestTarget(manifest, "linux-arm64"), CLIError);
});

test("assertUpdateRuntimeSupported rejects source runtime apply", () => {
  assert.throws(() => assertUpdateRuntimeSupported("source"), CLIError);
});

test("buildUpdateCheckResult reports update availability", () => {
  assert.deepEqual(
    buildUpdateCheckResult({
      currentVersion: "0.1.0",
      manifest,
      platform: "darwin-arm64",
    }),
    {
      name: "aa",
      current_version: "0.1.0",
      latest_version: "0.2.0",
      update_available: true,
      platform: "darwin-arm64",
      notes_url: "https://example.com/releases/v0.2.0",
    },
  );
});

test("aa update check --json reads a manifest file and returns structured output", () => {
  const manifestPath = writeManifest();
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "update", "check", "--json"], {
    cwd: resolve("."),
    encoding: "utf8",
    env: {
      ...process.env,
      AA_UPDATE_MANIFEST_FILE: manifestPath,
      AA_TEST_PLATFORM: "darwin-arm64",
    },
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    name: "aa",
    current_version: "0.1.0",
    latest_version: "0.2.0",
    update_available: true,
    platform: "darwin-arm64",
    notes_url: "https://example.com/releases/v0.2.0",
  });
});

test("aa update apply --yes --json rejects source runtime mode with structured error", () => {
  const manifestPath = writeManifest();
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "update", "apply", "--yes", "--json"], {
    cwd: resolve("."),
    encoding: "utf8",
    env: {
      ...process.env,
      AA_UPDATE_MANIFEST_FILE: manifestPath,
      AA_TEST_PLATFORM: "darwin-arm64",
    },
  });

  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stderr), {
    error: {
      code: "unsupported_runtime_mode",
      message: "update apply only works from a packaged binary runtime",
      retryable: false,
      suggestion: "Build or install a packaged binary before running aa update apply",
    },
  });
});

test("aa update apply --dry-run --json returns a structured update plan", () => {
  const manifestPath = writeManifest();
  const cliPath = resolve("bin/aa.js");
  const result = spawnSync(process.execPath, [cliPath, "update", "apply", "--dry-run", "--json"], {
    cwd: resolve("."),
    encoding: "utf8",
    env: {
      ...process.env,
      AA_UPDATE_MANIFEST_FILE: manifestPath,
      AA_TEST_PLATFORM: "darwin-arm64",
    },
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    actions: [
      {
        type: "replace_binary",
        platform: "darwin-arm64",
        current_version: "0.1.0",
        target_version: "0.2.0",
      },
    ],
    risk_tier: "high",
    requires_approval: true,
  });
});
