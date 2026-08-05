import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAdvisor, _resetForTests } from "../framework/advisor-registry.js";
import {
  listAdvisorCatalog,
  getAdvisorMetadata,
  getInputRequirements,
  supportsSeverity,
  isAvailable,
} from "../framework/advisor-catalog.js";
import { SEVERITY_LEVELS } from "../framework/severity.js";

function minimalDef(overrides = {}) {
  return {
    id: "minimal",
    name: "Minimal Advisor",
    version: "1.0.0",
    description: "No optional fields set.",
    inputRequirements: ["generationReport"],
    analyze: async () => [],
    ...overrides,
  };
}

function fullDef(overrides = {}) {
  return {
    id: "full",
    name: "Full Advisor",
    version: "2.0.0",
    description: "Declares every optional field.",
    category: "security",
    inputRequirements: ["generationReport", "knowledgeGraph"],
    supportedSeverities: ["warning", "critical"],
    analyze: async () => [],
    ...overrides,
  };
}

test("listAdvisorCatalog returns metadata for every registered advisor", () => {
  _resetForTests();
  registerAdvisor(minimalDef());
  registerAdvisor(fullDef());

  const catalog = listAdvisorCatalog();
  assert.equal(catalog.length, 2);
  assert.ok(catalog.some((a) => a.id === "minimal"));
  assert.ok(catalog.some((a) => a.id === "full"));
});

test("getAdvisorMetadata applies documented defaults when optional fields are absent", () => {
  _resetForTests();
  registerAdvisor(minimalDef());

  const meta = getAdvisorMetadata("minimal");
  assert.equal(meta.category, "uncategorized");
  assert.deepEqual(meta.supportedSeverities, SEVERITY_LEVELS);
});

test("getAdvisorMetadata reads an advisor's own declared fields without duplicating them", () => {
  _resetForTests();
  registerAdvisor(fullDef());

  const meta = getAdvisorMetadata("full");
  assert.equal(meta.category, "security");
  assert.deepEqual(meta.supportedSeverities, ["warning", "critical"]);
  assert.deepEqual(meta.inputRequirements, ["generationReport", "knowledgeGraph"]);
});

test("getInputRequirements returns the advisor's declared requirements directly", () => {
  _resetForTests();
  registerAdvisor(fullDef());
  assert.deepEqual(getInputRequirements("full"), ["generationReport", "knowledgeGraph"]);
});

test("getInputRequirements throws for an unknown advisor", () => {
  _resetForTests();
  assert.throws(() => getInputRequirements("nonexistent"), /Unknown advisor/);
});

test("supportsSeverity respects an advisor's declared subset", () => {
  _resetForTests();
  registerAdvisor(fullDef());
  assert.equal(supportsSeverity("full", "critical"), true);
  assert.equal(supportsSeverity("full", "info"), false);
});

test("supportsSeverity defaults to all levels when an advisor declares no subset", () => {
  _resetForTests();
  registerAdvisor(minimalDef());
  for (const level of SEVERITY_LEVELS) {
    assert.equal(supportsSeverity("minimal", level), true);
  }
});

test("isAvailable returns true for a registered advisor and false for an unknown one, never throwing", () => {
  _resetForTests();
  registerAdvisor(minimalDef());
  assert.equal(isAvailable("minimal"), true);
  assert.equal(isAvailable("nonexistent"), false);
});

test("getAdvisorMetadata throws a clear error for an unknown advisor id", () => {
  _resetForTests();
  assert.throws(() => getAdvisorMetadata("nonexistent"), /Unknown advisor: "nonexistent"/);
});

test("an advisor missing optional metadata is still listed, not silently dropped", () => {
  _resetForTests();
  registerAdvisor(minimalDef());
  assert.equal(listAdvisorCatalog().length, 1);
});
