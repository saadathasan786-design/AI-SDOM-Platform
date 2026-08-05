import { test } from "node:test";
import assert from "node:assert/strict";
import { registerWorkflow, _resetForTests } from "../framework/workflow-registry.js";
import {
  listWorkflowCatalog,
  getWorkflowMetadata,
  isAvailable,
  checkCompatibility,
} from "../framework/workflow-catalog.js";

function minimalDef(overrides = {}) {
  return {
    id: "minimal-workflow",
    name: "Minimal Workflow",
    version: "1.0.0",
    description: "No optional fields set.",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
    ...overrides,
  };
}

function fullDef(overrides = {}) {
  return {
    id: "full-workflow",
    name: "Full Workflow",
    version: "2.0.0",
    description: "Declares every optional field.",
    category: "full-check",
    inputRequirements: ["sourceFiles", "knowledgeGraph"],
    capabilities: ["chains-agents"],
    requiredAgents: ["architecture-remediation", "security-remediation"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
    ...overrides,
  };
}

test("listWorkflowCatalog returns metadata for every registered workflow", () => {
  _resetForTests();
  registerWorkflow(minimalDef());
  registerWorkflow(fullDef());

  const catalog = listWorkflowCatalog();
  assert.equal(catalog.length, 2);
  assert.ok(catalog.some((w) => w.id === "minimal-workflow"));
  assert.ok(catalog.some((w) => w.id === "full-workflow"));
});

test("getWorkflowMetadata applies documented defaults when optional fields are absent", () => {
  _resetForTests();
  registerWorkflow(minimalDef());

  const meta = getWorkflowMetadata("minimal-workflow");
  assert.equal(meta.category, "uncategorized");
  assert.deepEqual(meta.capabilities, []);
  assert.deepEqual(meta.requiredAgents, []);
});

test("getWorkflowMetadata reads a workflow's own declared fields without duplicating them", () => {
  _resetForTests();
  registerWorkflow(fullDef());

  const meta = getWorkflowMetadata("full-workflow");
  assert.equal(meta.category, "full-check");
  assert.deepEqual(meta.capabilities, ["chains-agents"]);
  assert.deepEqual(meta.requiredAgents, ["architecture-remediation", "security-remediation"]);
});

test("getWorkflowMetadata throws a clear error for an unknown workflow id", () => {
  _resetForTests();
  assert.throws(() => getWorkflowMetadata("nonexistent"), /Unknown workflow: "nonexistent"/);
});

test("isAvailable returns true for a registered workflow and false for an unknown one, never throwing", () => {
  _resetForTests();
  registerWorkflow(minimalDef());
  assert.equal(isAvailable("minimal-workflow"), true);
  assert.equal(isAvailable("nonexistent"), false);
});

test("checkCompatibility returns compatible:true when all declared agent dependencies are actually registered (real Agent Catalog)", () => {
  _resetForTests();
  registerWorkflow(fullDef({ requiredAgents: ["architecture-remediation"] }));

  const result = checkCompatibility("full-workflow");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAgents, []);
  assert.equal(result.error, null);
});

test("checkCompatibility reports missing agents that are not actually registered", () => {
  _resetForTests();
  registerWorkflow(fullDef({ requiredAgents: ["not-a-real-agent"] }));

  const result = checkCompatibility("full-workflow");
  assert.equal(result.compatible, false);
  assert.deepEqual(result.missingAgents, ["not-a-real-agent"]);
});

test("checkCompatibility with no declared dependencies is always compatible", () => {
  _resetForTests();
  registerWorkflow(minimalDef());

  const result = checkCompatibility("minimal-workflow");
  assert.equal(result.compatible, true);
});

test("checkCompatibility never throws for an unknown workflow id -- returns structured incompatibility instead", () => {
  _resetForTests();
  const result = checkCompatibility("does-not-exist");
  assert.equal(result.compatible, false);
  assert.match(result.error, /Unknown workflow/);
});

test("checkCompatibility validates against all three real, currently-registered agents", () => {
  _resetForTests();
  registerWorkflow(
    fullDef({
      requiredAgents: ["architecture-remediation", "security-remediation", "performance-optimization"],
    })
  );

  const result = checkCompatibility("full-workflow");
  assert.equal(result.compatible, true);
});
