import { test } from "node:test";
import assert from "node:assert/strict";
import { toNamespaceSegment, buildPsr4Namespace } from "../framework/namespace-manager.js";

test("converts a phrase into PascalCase", () => {
  assert.equal(toNamespaceSegment("acme client portal"), "AcmeClientPortal");
});

test("strips non-alphanumeric characters between words", () => {
  assert.equal(toNamespaceSegment("acme-client_portal!!"), "AcmeClientPortal");
});

test("prefixes with N if the result would start with a digit", () => {
  assert.equal(toNamespaceSegment("2026 launch"), "N2026Launch");
});

test("builds a vendor\\project PSR-4 namespace", () => {
  assert.equal(buildPsr4Namespace("Acme Agency", "Client Portal"), "AcmeAgency\\ClientPortal");
});

test("throws if vendor or project produces an empty segment", () => {
  assert.throws(() => buildPsr4Namespace("!!!", "Client Portal"), /requires both/);
  assert.throws(() => buildPsr4Namespace("Acme Agency", ""), /requires both/);
});
