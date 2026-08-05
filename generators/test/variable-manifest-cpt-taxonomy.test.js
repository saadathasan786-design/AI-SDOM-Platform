import { test } from "node:test";
import assert from "node:assert/strict";
import { VARIABLE_MANIFEST } from "../cpt-taxonomy/variable-manifest.js";

test("every manifest entry has the required documentation fields", () => {
  for (const entry of VARIABLE_MANIFEST) {
    assert.equal(typeof entry.variable, "string");
    assert.equal(typeof entry.description, "string");
    assert.ok(entry.variable.length > 0);
  }
});

test("cpt_name entry is marked required with no default", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "cpt_name");
  assert.equal(entry.required, true);
  assert.equal(entry.default, null);
});

test("text_domain entry is documented as auto-detected, not a config input", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "text_domain");
  assert.match(entry.config_field, /auto-detected/);
  assert.match(entry.config_field, /NOT a config input/);
});
