import { test } from "node:test";
import assert from "node:assert/strict";
import { VARIABLE_MANIFEST } from "../acf/variable-manifest.js";

test("every manifest entry has the required documentation fields", () => {
  for (const entry of VARIABLE_MANIFEST) {
    assert.equal(typeof entry.variable, "string");
    assert.equal(typeof entry.description, "string");
    assert.ok(entry.variable.length > 0);
  }
});

test("group_title and target_cpt are marked required with no default", () => {
  const groupTitle = VARIABLE_MANIFEST.find((e) => e.variable === "group_title");
  const targetCpt = VARIABLE_MANIFEST.find((e) => e.variable === "target_cpt");
  assert.equal(groupTitle.required, true);
  assert.equal(targetCpt.required, true);
  assert.equal(groupTitle.default, null);
  assert.equal(targetCpt.default, null);
});

test("target_cpt documents that it is validated against the target project, not merely trusted", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "target_cpt");
  assert.match(entry.description, /validated/);
});
