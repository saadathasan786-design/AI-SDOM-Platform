import { test } from "node:test";
import assert from "node:assert/strict";
import { toConstantCase, toOptionCase } from "../framework/constant-case-manager.js";

test("toConstantCase converts a phrase into upper SNAKE_CASE", () => {
  assert.equal(toConstantCase("Acme Client Portal"), "ACME_CLIENT_PORTAL");
});

test("toConstantCase strips non-alphanumeric characters and collapses separators", () => {
  assert.equal(toConstantCase("acme-client_portal!!"), "ACME_CLIENT_PORTAL");
});

test("toConstantCase strips leading/trailing underscores", () => {
  assert.equal(toConstantCase("  __Acme Portal__  "), "ACME_PORTAL");
});

test("toOptionCase is the lowercase of toConstantCase", () => {
  const input = "Acme Client Portal";
  assert.equal(toOptionCase(input), toConstantCase(input).toLowerCase());
  assert.equal(toOptionCase(input), "acme_client_portal");
});

test("both handle undefined/null input without throwing", () => {
  assert.equal(toConstantCase(undefined), "");
  assert.equal(toOptionCase(null), "");
});
