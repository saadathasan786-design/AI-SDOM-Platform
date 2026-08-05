import { test } from "node:test";
import assert from "node:assert/strict";
import { toTextDomain } from "../framework/text-domain-manager.js";
import { toSlug } from "../framework/slug-generator.js";

test("produces the same value as toSlug (text domains follow slug rules)", () => {
  const input = "Acme Client Portal";
  assert.equal(toTextDomain(input), toSlug(input));
  assert.equal(toTextDomain(input), "acme-client-portal");
});
