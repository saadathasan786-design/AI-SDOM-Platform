import { test } from "node:test";
import assert from "node:assert/strict";
import { SEVERITY_LEVELS, isValidSeverity, severityRank, emptySeveritySummary } from "../framework/severity.js";

test("SEVERITY_LEVELS is ordered ascending by urgency", () => {
  assert.deepEqual(SEVERITY_LEVELS, ["info", "suggestion", "warning", "critical"]);
});

test("isValidSeverity accepts every level and rejects unknown strings", () => {
  for (const level of SEVERITY_LEVELS) {
    assert.equal(isValidSeverity(level), true);
  }
  assert.equal(isValidSeverity("catastrophic"), false);
  assert.equal(isValidSeverity(undefined), false);
});

test("severityRank returns ascending ranks matching array order, -1 for invalid", () => {
  assert.equal(severityRank("info"), 0);
  assert.equal(severityRank("suggestion"), 1);
  assert.equal(severityRank("warning"), 2);
  assert.equal(severityRank("critical"), 3);
  assert.equal(severityRank("nonsense"), -1);
});

test("emptySeveritySummary returns a zero-initialized count for every level", () => {
  assert.deepEqual(emptySeveritySummary(), { info: 0, suggestion: 0, warning: 0, critical: 0 });
});
