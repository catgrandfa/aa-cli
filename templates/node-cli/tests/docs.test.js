import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("practice docs describe json output, dry-run, and json-input", () => {
  const practice = readFileSync(resolve("..", "..", "docs", "aa-cli-practice.md"), "utf8");

  assert.match(practice, /--json/);
  assert.match(practice, /--dry-run/);
  assert.match(practice, /--json-input/);
});

test("release docs describe Bun packaging and update commands", () => {
  const release = readFileSync(resolve("..", "..", "docs", "release-and-update.md"), "utf8");

  assert.match(release, /Bun/i);
  assert.match(release, /update check/);
  assert.match(release, /update apply/);
});

test("cli skill requires contract-first changes", () => {
  const skill = readFileSync(resolve("..", "..", "skills", "cli-agent", "SKILL.md"), "utf8");

  assert.match(skill, /contract-first/i);
  assert.match(skill, /examples\/contracts/);
  assert.match(skill, /release impact/i);
});
