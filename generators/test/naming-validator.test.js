import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateSlug,
  validateTextDomain,
  validateNamespaceSegment,
  validateProjectName,
} from "../framework/naming-validator.js";

test("validateSlug accepts a well-formed slug", () => {
  assert.deepEqual(validateSlug("acme-client-portal"), { valid: true });
});

test("validateSlug rejects empty, uppercase, and double-hyphen slugs", () => {
  assert.equal(validateSlug("").valid, false);
  assert.equal(validateSlug("Acme-Portal").valid, false);
  assert.equal(validateSlug("acme--portal").valid, false);
});

test("validateTextDomain applies the same rules as validateSlug", () => {
  assert.deepEqual(validateTextDomain("acme-portal"), { valid: true });
  assert.equal(validateTextDomain("Acme Portal").valid, false);
});

test("validateNamespaceSegment accepts a valid PHP identifier", () => {
  assert.deepEqual(validateNamespaceSegment("AcmeClientPortal"), { valid: true });
});

test("validateNamespaceSegment rejects a segment starting with a digit", () => {
  assert.equal(validateNamespaceSegment("2026Launch").valid, false);
});

test("validateProjectName rejects path separators and overly long names", () => {
  assert.equal(validateProjectName("acme/portal").valid, false);
  assert.equal(validateProjectName("a".repeat(101)).valid, false);
  assert.deepEqual(validateProjectName("Acme Client Portal"), { valid: true });
});
