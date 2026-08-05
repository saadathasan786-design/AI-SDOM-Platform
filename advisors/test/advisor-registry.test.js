import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registerAdvisor,
  getAdvisor,
  listAdvisors,
  hasAdvisor,
  _resetForTests,
} from "../framework/advisor-registry.js";

function validDef(overrides = {}) {
  return {
    id: "sample",
    name: "Sample Advisor",
    version: "1.0.0",
    description: "A sample advisor.",
    inputRequirements: [],
    analyze: async () => [],
    ...overrides,
  };
}

test("registers and retrieves a valid advisor", () => {
  _resetForTests();
  registerAdvisor(validDef());

  const def = getAdvisor("sample");
  assert.equal(def.id, "sample");
  assert.equal(def.name, "Sample Advisor");
});

test("rejects an invalid definition at registration time (delegates to advisor-interface)", () => {
  _resetForTests();
  assert.throws(() => registerAdvisor({ id: "bad" }), /missing required field/);
});

test("refuses to register the same advisor id twice", () => {
  _resetForTests();
  registerAdvisor(validDef());
  assert.throws(() => registerAdvisor(validDef()), /already registered/);
});

test("getAdvisor throws a helpful error listing registered advisors for an unknown id", () => {
  _resetForTests();
  registerAdvisor(validDef());
  assert.throws(() => getAdvisor("nonexistent"), /Unknown advisor: "nonexistent".*sample/);
});

test("hasAdvisor reports registration status without throwing", () => {
  _resetForTests();
  registerAdvisor(validDef());
  assert.equal(hasAdvisor("sample"), true);
  assert.equal(hasAdvisor("nonexistent"), false);
});

test("listAdvisors returns metadata for all registered advisors, without exposing analyze()", () => {
  _resetForTests();
  registerAdvisor(validDef());
  registerAdvisor(validDef({ id: "other" }));

  const list = listAdvisors();
  assert.equal(list.length, 2);
  assert.ok(list.every((a) => typeof a.analyze === "undefined"));
});

test("two advisors with different ids can coexist", () => {
  _resetForTests();
  registerAdvisor(validDef({ id: "first" }));
  registerAdvisor(validDef({ id: "second" }));
  assert.equal(listAdvisors().length, 2);
});
