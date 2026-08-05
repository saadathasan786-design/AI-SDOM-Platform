import { test } from "node:test";
import assert from "node:assert/strict";
import { toSlug } from "../framework/slug-generator.js";

test("converts spaces and mixed case into a lowercase hyphenated slug", () => {
  assert.equal(toSlug("Acme Client Portal"), "acme-client-portal");
});

test("collapses repeated non-alphanumeric characters into a single hyphen", () => {
  assert.equal(toSlug("Acme   Client---Portal!!"), "acme-client-portal");
});

test("strips leading and trailing hyphens", () => {
  assert.equal(toSlug("  --Acme Portal--  "), "acme-portal");
});

test("returns an empty string for input that is only symbols", () => {
  assert.equal(toSlug("!!!"), "");
});

test("handles undefined/null input without throwing", () => {
  assert.equal(toSlug(undefined), "");
  assert.equal(toSlug(null), "");
});
