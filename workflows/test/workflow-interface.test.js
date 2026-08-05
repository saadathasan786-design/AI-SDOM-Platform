import { test } from "node:test";
import assert from "node:assert/strict";
import { validateWorkflowDefinition, validateDecision } from "../framework/workflow-interface.js";

function validDef(overrides = {}) {
  return {
    id: "sample-workflow",
    name: "Sample Workflow",
    version: "1.0.0",
    description: "A sample workflow for tests.",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
    ...overrides,
  };
}

test("accepts a fully valid minimal definition", () => {
  assert.equal(validateWorkflowDefinition(validDef()), true);
});

test("accepts a workflow with empty inputRequirements", () => {
  assert.equal(validateWorkflowDefinition(validDef({ inputRequirements: [] })), true);
});

test("rejects a non-object definition", () => {
  assert.throws(() => validateWorkflowDefinition(null), /must be an object/);
  assert.throws(() => validateWorkflowDefinition("nope"), /must be an object/);
});

test("rejects a definition missing a required field", () => {
  for (const field of ["id", "name", "version", "description", "inputRequirements", "plan", "decide"]) {
    const def = validDef();
    delete def[field];
    assert.throws(() => validateWorkflowDefinition(def), new RegExp(`missing required field: "${field}"`));
  }
});

test("rejects empty id, name, version, or description", () => {
  assert.throws(() => validateWorkflowDefinition(validDef({ id: "" })), /"id" must be a non-empty string/);
  assert.throws(() => validateWorkflowDefinition(validDef({ name: "  " })), /"name" must be a non-empty string/);
  assert.throws(() => validateWorkflowDefinition(validDef({ version: "" })), /"version" must be a non-empty string/);
  assert.throws(() => validateWorkflowDefinition(validDef({ description: "" })), /"description" must be a non-empty string/);
});

test("rejects plan or decide that are not functions", () => {
  assert.throws(() => validateWorkflowDefinition(validDef({ plan: "not-a-function" })), /"plan" must be a function/);
  assert.throws(() => validateWorkflowDefinition(validDef({ decide: 42 })), /"decide" must be a function/);
});

test("rejects inputRequirements that is not an array of non-empty strings", () => {
  assert.throws(() => validateWorkflowDefinition(validDef({ inputRequirements: "sourceFiles" })), /must be an array of non-empty strings/);
  assert.throws(() => validateWorkflowDefinition(validDef({ inputRequirements: [""] })), /must be an array of non-empty strings/);
});

test("accepts valid optional fields: capabilities, requiredAgents, configuration", () => {
  const def = validDef({
    capabilities: ["chains-agents"],
    requiredAgents: ["architecture-remediation"],
    configuration: { threshold: 3 },
  });
  assert.equal(validateWorkflowDefinition(def), true);
});

test("rejects invalid capabilities or requiredAgents", () => {
  assert.throws(() => validateWorkflowDefinition(validDef({ capabilities: "not-array" })), /"capabilities" must be an array/);
  assert.throws(() => validateWorkflowDefinition(validDef({ requiredAgents: [123] })), /"requiredAgents" must be an array/);
});

test("rejects a non-object configuration", () => {
  assert.throws(() => validateWorkflowDefinition(validDef({ configuration: "nope" })), /"configuration" must be an object/);
  assert.throws(() => validateWorkflowDefinition(validDef({ configuration: null })), /"configuration" must be an object/);
});

test("validateDecision accepts every valid action (continue, stop, fail -- no skip)", () => {
  for (const action of ["continue", "stop", "fail"]) {
    assert.equal(validateDecision({ action }, "workflow-x", 0), true);
  }
});

test("validateDecision rejects 'skip' -- the Workflow Framework vocabulary is deliberately three actions only", () => {
  assert.throws(() => validateDecision({ action: "skip" }, "workflow-x", 0), /invalid action "skip"/);
});

test("validateDecision rejects a non-object decision", () => {
  assert.throws(() => validateDecision(null, "workflow-x", 0), /must return an object/);
  assert.throws(() => validateDecision("continue", "workflow-x", 0), /must return an object/);
});

test("validateDecision rejects an invalid action", () => {
  assert.throws(() => validateDecision({ action: "maybe" }, "workflow-x", 2), /invalid action "maybe"/);
});
