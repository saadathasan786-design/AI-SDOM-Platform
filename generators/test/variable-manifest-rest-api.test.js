import { test } from "node:test";
import assert from "node:assert/strict";
import { VARIABLE_MANIFEST } from "../rest-api/variable-manifest.js";

test("every manifest entry has the required documentation fields", () => {
  for (const entry of VARIABLE_MANIFEST) {
    assert.equal(typeof entry.variable, "string");
    assert.equal(typeof entry.description, "string");
    assert.ok(entry.variable.length > 0);
  }
});

test("route_path and method are marked required with no default", () => {
  const routePath = VARIABLE_MANIFEST.find((e) => e.variable === "route_path");
  const method = VARIABLE_MANIFEST.find((e) => e.variable === "method");
  assert.equal(routePath.required, true);
  assert.equal(method.required, true);
  assert.equal(routePath.default, null);
  assert.equal(method.default, null);
});

test("target_cpt documents that omitting it produces a stub rather than guessed logic", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "target_cpt");
  assert.match(entry.description, /TODO/);
});
