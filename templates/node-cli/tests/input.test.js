import test from "node:test";
import assert from "node:assert/strict";
import { parseJsonInput, validatePath } from "../src/core/input.js";
import { CLIError } from "../src/core/errors.js";

test("parseJsonInput reads inline json payloads", () => {
  assert.deepEqual(parseJsonInput('{"title":"Bug"}', null), { title: "Bug" });
});

test("parseJsonInput throws CLIError on malformed json", () => {
  assert.throws(() => parseJsonInput("{bad", null), CLIError);
});

test("validatePath rejects traversal outside the base directory", () => {
  assert.throws(() => validatePath("../secrets", "/tmp/base"), CLIError);
});
