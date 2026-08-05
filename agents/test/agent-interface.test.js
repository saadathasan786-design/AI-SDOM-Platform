import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAgentDefinition, validateDecision } from "../framework/agent-interface.js";

function validDef(overrides = {}) {
  return {
    id: "sample-agent",
    name: "Sample Agent",
    version: "1.0.0",
    description: "A sample agent for tests.",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
    ...overrides,
  };
}

test("accepts a fully valid minimal definition", () => {
  assert.equal(validateAgentDefinition(validDef()), true);
});

test("accepts an agent with empty inputRequirements", () => {
  assert.equal(validateAgentDefinition(validDef({ inputRequirements: [] })), true);
});

test("rejects a non-object definition", () => {
  assert.throws(() => validateAgentDefinition(null), /must be an object/);
  assert.throws(() => validateAgentDefinition("nope"), /must be an object/);
});

test("rejects a definition missing a required field", () => {
  for (const field of ["id", "name", "version", "description", "inputRequirements", "plan", "decide"]) {
    const def = validDef();
    delete def[field];
    assert.throws(() => validateAgentDefinition(def), new RegExp(`missing required field: "${field}"`));
  }
});

test("rejects empty id, name, version, or description", () => {
  assert.throws(() => validateAgentDefinition(validDef({ id: "" })), /"id" must be a non-empty string/);
  assert.throws(() => validateAgentDefinition(validDef({ name: "  " })), /"name" must be a non-empty string/);
  assert.throws(() => validateAgentDefinition(validDef({ version: "" })), /"version" must be a non-empty string/);
  assert.throws(() => validateAgentDefinition(validDef({ description: "" })), /"description" must be a non-empty string/);
});

test("rejects plan or decide that are not functions", () => {
  assert.throws(() => validateAgentDefinition(validDef({ plan: "not-a-function" })), /"plan" must be a function/);
  assert.throws(() => validateAgentDefinition(validDef({ decide: 42 })), /"decide" must be a function/);
});

test("rejects inputRequirements that is not an array of non-empty strings", () => {
  assert.throws(() => validateAgentDefinition(validDef({ inputRequirements: "sourceFiles" })), /must be an array of non-empty strings/);
  assert.throws(() => validateAgentDefinition(validDef({ inputRequirements: [""] })), /must be an array of non-empty strings/);
  assert.throws(() => validateAgentDefinition(validDef({ inputRequirements: [42] })), /must be an array of non-empty strings/);
});

test("accepts valid optional fields: capabilities, requiresAdvisors, requiresGenerators, supportedSeverities, configSchema", () => {
  const def = validDef({
    capabilities: ["invokes-generators"],
    requiresAdvisors: ["security"],
    requiresGenerators: ["acf-field-group"],
    supportedSeverities: ["critical"],
    configSchema: { fields: [] },
  });
  assert.equal(validateAgentDefinition(def), true);
});

test("rejects invalid capabilities, requiresAdvisors, requiresGenerators, supportedSeverities", () => {
  assert.throws(() => validateAgentDefinition(validDef({ capabilities: "not-array" })), /"capabilities" must be an array/);
  assert.throws(() => validateAgentDefinition(validDef({ requiresAdvisors: [123] })), /"requiresAdvisors" must be an array/);
  assert.throws(() => validateAgentDefinition(validDef({ requiresGenerators: [""] })), /"requiresGenerators" must be an array/);
  assert.throws(() => validateAgentDefinition(validDef({ supportedSeverities: [null] })), /"supportedSeverities" must be an array/);
});

test("rejects a non-object configSchema", () => {
  assert.throws(() => validateAgentDefinition(validDef({ configSchema: "nope" })), /"configSchema" must be an object/);
  assert.throws(() => validateAgentDefinition(validDef({ configSchema: null })), /"configSchema" must be an object/);
});

test("validateDecision accepts every valid action", () => {
  for (const action of ["continue", "skip", "stop", "fail"]) {
    assert.equal(validateDecision({ action }, "agent-x", 0), true);
  }
});

test("validateDecision rejects a non-object decision", () => {
  assert.throws(() => validateDecision(null, "agent-x", 0), /must return an object/);
  assert.throws(() => validateDecision("continue", "agent-x", 0), /must return an object/);
});

test("validateDecision rejects an invalid action", () => {
  assert.throws(() => validateDecision({ action: "maybe" }, "agent-x", 2), /invalid action "maybe"/);
});
