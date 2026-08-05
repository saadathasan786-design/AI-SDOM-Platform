import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAgent, _resetForTests } from "../framework/agent-registry.js";
import {
  listAgentCatalog,
  getAgentMetadata,
  isAvailable,
  checkCompatibility,
} from "../framework/agent-catalog.js";

function minimalDef(overrides = {}) {
  return {
    id: "minimal-agent",
    name: "Minimal Agent",
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
    id: "full-agent",
    name: "Full Agent",
    version: "2.0.0",
    description: "Declares every optional field.",
    category: "remediation",
    inputRequirements: ["sourceFiles", "knowledgeGraph"],
    capabilities: ["invokes-generators"],
    supportedSeverities: ["critical"],
    requiresAdvisors: ["security", "architecture"],
    requiresGenerators: ["acf-field-group"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
    ...overrides,
  };
}

test("listAgentCatalog returns metadata for every registered agent", () => {
  _resetForTests();
  registerAgent(minimalDef());
  registerAgent(fullDef());

  const catalog = listAgentCatalog();
  assert.equal(catalog.length, 2);
  assert.ok(catalog.some((a) => a.id === "minimal-agent"));
  assert.ok(catalog.some((a) => a.id === "full-agent"));
});

test("getAgentMetadata applies documented defaults when optional fields are absent", () => {
  _resetForTests();
  registerAgent(minimalDef());

  const meta = getAgentMetadata("minimal-agent");
  assert.equal(meta.category, "uncategorized");
  assert.deepEqual(meta.capabilities, []);
  assert.deepEqual(meta.supportedSeverities, []);
  assert.deepEqual(meta.requiresAdvisors, []);
  assert.deepEqual(meta.requiresGenerators, []);
});

test("getAgentMetadata reads an agent's own declared fields without duplicating them", () => {
  _resetForTests();
  registerAgent(fullDef());

  const meta = getAgentMetadata("full-agent");
  assert.equal(meta.category, "remediation");
  assert.deepEqual(meta.capabilities, ["invokes-generators"]);
  assert.deepEqual(meta.requiresAdvisors, ["security", "architecture"]);
  assert.deepEqual(meta.requiresGenerators, ["acf-field-group"]);
});

test("getAgentMetadata throws a clear error for an unknown agent id", () => {
  _resetForTests();
  assert.throws(() => getAgentMetadata("nonexistent"), /Unknown agent: "nonexistent"/);
});

test("isAvailable returns true for a registered agent and false for an unknown one, never throwing", () => {
  _resetForTests();
  registerAgent(minimalDef());
  assert.equal(isAvailable("minimal-agent"), true);
  assert.equal(isAvailable("nonexistent"), false);
});

test("checkCompatibility returns compatible:true when all declared advisor/generator dependencies are actually registered (real Advisor/Generator Catalogs)", () => {
  _resetForTests();
  registerAgent(fullDef({ requiresAdvisors: ["security"], requiresGenerators: ["acf-field-group"] }));

  const result = checkCompatibility("full-agent");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAdvisors, []);
  assert.deepEqual(result.missingGenerators, []);
  assert.equal(result.error, null);
});

test("checkCompatibility reports missing advisors that are not actually registered", () => {
  _resetForTests();
  registerAgent(fullDef({ requiresAdvisors: ["not-a-real-advisor"], requiresGenerators: [] }));

  const result = checkCompatibility("full-agent");
  assert.equal(result.compatible, false);
  assert.deepEqual(result.missingAdvisors, ["not-a-real-advisor"]);
});

test("checkCompatibility reports missing generators that are not actually registered", () => {
  _resetForTests();
  registerAgent(fullDef({ requiresAdvisors: [], requiresGenerators: ["not-a-real-generator"] }));

  const result = checkCompatibility("full-agent");
  assert.equal(result.compatible, false);
  assert.deepEqual(result.missingGenerators, ["not-a-real-generator"]);
});

test("checkCompatibility with no declared dependencies is always compatible", () => {
  _resetForTests();
  registerAgent(minimalDef());

  const result = checkCompatibility("minimal-agent");
  assert.equal(result.compatible, true);
});

test("checkCompatibility never throws for an unknown agent id -- returns structured incompatibility instead", () => {
  _resetForTests();
  const result = checkCompatibility("does-not-exist");
  assert.equal(result.compatible, false);
  assert.match(result.error, /Unknown agent/);
});

test("checkCompatibility validates against real, currently-registered advisors (architecture, code-review, security, performance, accessibility)", () => {
  _resetForTests();
  registerAgent(
    fullDef({
      requiresAdvisors: ["architecture", "code-review", "security", "performance", "accessibility"],
      requiresGenerators: [],
    })
  );

  const result = checkCompatibility("full-agent");
  assert.equal(result.compatible, true);
});
