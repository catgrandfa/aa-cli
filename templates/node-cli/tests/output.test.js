import test from "node:test";
import assert from "node:assert/strict";
import { createOutput } from "../src/core/output.js";

test("createOutput prefers json for non-tty mode", () => {
  const output = createOutput({
    json: false,
    yaml: false,
    isTTY: false,
    fields: "",
    limit: "100",
  });

  assert.equal(output.mode, "json");
});

test("createOutput limits list payloads and picks requested fields", () => {
  const output = createOutput({
    json: true,
    yaml: false,
    isTTY: true,
    fields: "name,role",
    limit: "1",
  });
  const rendered = output.serialize([
    { name: "Alice", email: "alice@co.com", role: "admin" },
    { name: "Bob", email: "bob@co.com", role: "member" },
  ]);

  assert.deepEqual(JSON.parse(rendered), [{ name: "Alice", role: "admin" }]);
});
