import { test } from "node:test";
import assert from "node:assert/strict";
import { VARIABLE_MANIFEST } from "../gutenberg-block/variable-manifest.js";

test("every manifest entry has the required documentation fields", () => {
  for (const entry of VARIABLE_MANIFEST) {
    assert.equal(typeof entry.variable, "string");
    assert.equal(typeof entry.description, "string");
    assert.ok(entry.variable.length > 0);
  }
});

test("block_name is marked required with no default", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "block_name");
  assert.equal(entry.required, true);
  assert.equal(entry.default, null);
});

test("keywords entry documents it is not present in the base boilerplate", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "keywords");
  assert.match(entry.description, /NOT present in the base boilerplate/);
});
