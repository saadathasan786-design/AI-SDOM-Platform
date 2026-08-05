import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAdvisorDefinition } from "../framework/advisor-interface.js";

function validDef(overrides = {}) {
  return {
    id: "sample",
    name: "Sample Advisor",
    version: "1.0.0",
    description: "A sample advisor for tests.",
    inputRequirements: ["generationReport"],
    analyze: async () => [],
    ...overrides,
  };
}

test("accepts a fully valid minimal definition", () => {
  assert.equal(validateAdvisorDefinition(validDef()), true);
});

test("accepts an advisor with empty inputRequirements (needs nothing)", () => {
  assert.equal(validateAdvisorDefinition(validDef({ inputRequirements: [] })), true);
});

test("rejects a non-object definition", () => {
  assert.throws(() => validateAdvisorDefinition(null), /must be an object/);
  assert.throws(() => validateAdvisorDefinition("not-an-object"), /must be an object/);
});

test("rejects a definition missing a required field", () => {
  const { analyze, ...missingAnalyze } = validDef();
  assert.throws(() => validateAdvisorDefinition(missingAnalyze), /missing required field: "analyze"/);

  const { id, ...missingId } = validDef();
  assert.throws(() => validateAdvisorDefinition(missingId), /missing required field: "id"/);
});

test("rejects an empty id or name", () => {
  assert.throws(() => validateAdvisorDefinition(validDef({ id: "" })), /"id" must be a non-empty string/);
  assert.throws(() => validateAdvisorDefinition(validDef({ name: "  " })), /"name" must be a non-empty string/);
});

test("rejects analyze that is not a function", () => {
  assert.throws(() => validateAdvisorDefinition(validDef({ analyze: "not-a-function" })), /"analyze" must be a function/);
});

test("rejects inputRequirements that is not an array", () => {
  assert.throws(
    () => validateAdvisorDefinition(validDef({ inputRequirements: "generationReport" })),
    /"inputRequirements" must be an array/
  );
});

test("rejects an inputRequirements entry that is not a non-empty string", () => {
  assert.throws(
    () => validateAdvisorDefinition(validDef({ inputRequirements: [""] })),
    /every inputRequirements entry must be a non-empty string/
  );
  assert.throws(
    () => validateAdvisorDefinition(validDef({ inputRequirements: [42] })),
    /every inputRequirements entry must be a non-empty string/
  );
});

test("accepts valid supportedSeverities", () => {
  assert.equal(
    validateAdvisorDefinition(validDef({ supportedSeverities: ["info", "critical"] })),
    true
  );
});

test("rejects supportedSeverities that is not an array", () => {
  assert.throws(
    () => validateAdvisorDefinition(validDef({ supportedSeverities: "critical" })),
    /"supportedSeverities" must be an array/
  );
});

test("rejects an invalid severity in supportedSeverities", () => {
  assert.throws(
    () => validateAdvisorDefinition(validDef({ supportedSeverities: ["critical", "catastrophic"] })),
    /"catastrophic" is not a valid severity/
  );
});
