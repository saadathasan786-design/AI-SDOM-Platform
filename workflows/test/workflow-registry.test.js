import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registerWorkflow,
  getWorkflow,
  listWorkflows,
  hasWorkflow,
  _resetForTests,
} from "../framework/workflow-registry.js";

function validDef(overrides = {}) {
  return {
    id: "sample-workflow",
    name: "Sample Workflow",
    version: "1.0.0",
    description: "A sample workflow.",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
    ...overrides,
  };
}

test("registers and retrieves a valid workflow", () => {
  _resetForTests();
  registerWorkflow(validDef());
  const def = getWorkflow("sample-workflow");
  assert.equal(def.id, "sample-workflow");
  assert.equal(def.name, "Sample Workflow");
});

test("rejects an invalid definition at registration time (delegates to workflow-interface)", () => {
  _resetForTests();
  assert.throws(() => registerWorkflow({ id: "bad" }), /missing required field/);
});

test("refuses to register the same workflow id twice", () => {
  _resetForTests();
  registerWorkflow(validDef());
  assert.throws(() => registerWorkflow(validDef()), /already registered/);
});

test("getWorkflow throws a helpful error listing registered workflows for an unknown id", () => {
  _resetForTests();
  registerWorkflow(validDef());
  assert.throws(() => getWorkflow("nonexistent"), /Unknown workflow: "nonexistent".*sample-workflow/);
});

test("hasWorkflow reports registration status without throwing", () => {
  _resetForTests();
  registerWorkflow(validDef());
  assert.equal(hasWorkflow("sample-workflow"), true);
  assert.equal(hasWorkflow("nonexistent"), false);
});

test("listWorkflows returns metadata for all registered workflows, without exposing plan/decide functions", () => {
  _resetForTests();
  registerWorkflow(validDef());
  registerWorkflow(validDef({ id: "other-workflow" }));

  const list = listWorkflows();
  assert.equal(list.length, 2);
  assert.ok(list.every((w) => typeof w.plan === "undefined" && typeof w.decide === "undefined"));
});

test("two workflows with different ids can coexist", () => {
  _resetForTests();
  registerWorkflow(validDef({ id: "first" }));
  registerWorkflow(validDef({ id: "second" }));
  assert.equal(listWorkflows().length, 2);
});
