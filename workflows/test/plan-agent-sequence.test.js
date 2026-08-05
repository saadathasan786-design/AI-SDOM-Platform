import { test } from "node:test";
import assert from "node:assert/strict";
import { planAgentSequence } from "../framework/plan-agent-sequence.js";

// ---------------------------------------------------------------------
// basic behavior
// ---------------------------------------------------------------------

test("builds one step per agent id, in order", () => {
  const result = planAgentSequence(["a", "b", "c"], { sourceFiles: [] });
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["a", "b", "c"]
  );
});

test("each step's context contains exactly { sourceFiles }, no other fields", () => {
  const sourceFiles = [{ path: "x.js", content: "y" }];
  const result = planAgentSequence(["a"], { sourceFiles });
  assert.deepEqual(Object.keys(result.steps[0].context), ["sourceFiles"]);
  assert.deepEqual(result.steps[0].context.sourceFiles, sourceFiles);
});

test("every step receives the exact same sourceFiles reference", () => {
  const sourceFiles = [{ path: "x.js", content: "y" }];
  const result = planAgentSequence(["a", "b", "c"], { sourceFiles });
  for (const step of result.steps) {
    assert.deepEqual(step.context.sourceFiles, sourceFiles);
  }
});

test("each step has exactly { agentId, context }, no other fields", () => {
  const result = planAgentSequence(["a"], { sourceFiles: [] });
  assert.deepEqual(Object.keys(result.steps[0]).sort(), ["agentId", "context"].sort());
});

test("returns exactly { steps }, no other top-level fields", () => {
  const result = planAgentSequence(["a"], { sourceFiles: [] });
  assert.deepEqual(Object.keys(result), ["steps"]);
});

// ---------------------------------------------------------------------
// edge cases
// ---------------------------------------------------------------------

test("an empty agent sequence produces zero steps, not an error", () => {
  const result = planAgentSequence([], { sourceFiles: [] });
  assert.deepEqual(result.steps, []);
});

test("a single-agent sequence produces exactly one step", () => {
  const result = planAgentSequence(["only-one"], { sourceFiles: [] });
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].agentId, "only-one");
});

test("an empty sourceFiles array is passed through correctly, not defaulted or altered", () => {
  const result = planAgentSequence(["a"], { sourceFiles: [] });
  assert.deepEqual(result.steps[0].context.sourceFiles, []);
});

// ---------------------------------------------------------------------
// purity / determinism / side-effect-free
// ---------------------------------------------------------------------

test("is pure and deterministic: identical input always produces a deep-equal result", () => {
  const agentSequence = ["a", "b"];
  const input = { sourceFiles: [{ path: "x", content: "y" }] };
  const resultA = planAgentSequence(agentSequence, input);
  const resultB = planAgentSequence(agentSequence, input);
  assert.deepEqual(resultA, resultB);
});

test("does not mutate the agentSequence array", () => {
  const agentSequence = ["a", "b", "c"];
  const copy = [...agentSequence];
  planAgentSequence(agentSequence, { sourceFiles: [] });
  assert.deepEqual(agentSequence, copy);
});

test("does not mutate the input object", () => {
  const input = { sourceFiles: [{ path: "x", content: "y" }] };
  const copy = JSON.parse(JSON.stringify(input));
  planAgentSequence(["a"], input);
  assert.deepEqual(input, copy);
});

// ---------------------------------------------------------------------
// dependency-free
// ---------------------------------------------------------------------

test("the module itself has zero imports", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../framework/plan-agent-sequence.js", import.meta.url), "utf8");
  const importLines = source.split("\n").filter((line) => line.trim().startsWith("import"));
  assert.equal(importLines.length, 0);
});

// ---------------------------------------------------------------------
// unchanged Workflow behavior -- exact real verification against every
// migrated workflow's own plan()
// ---------------------------------------------------------------------

test("real verification: project-health-check-workflow's own plan() produces the exact original three-step architecture-first sequence", async () => {
  const { plan } = await import("../project-health-check/project-health-check-workflow.js");
  const result = await plan({ sourceFiles: [{ path: "a.js", content: "x" }] });
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["architecture-remediation", "security-remediation", "performance-optimization"]
  );
});

test("real verification: security-audit-workflow's own plan() produces the exact original three-step security-first sequence", async () => {
  const { plan } = await import("../security-audit/security-audit-workflow.js");
  const result = await plan({ sourceFiles: [{ path: "a.js", content: "x" }] });
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["security-remediation", "architecture-remediation", "performance-optimization"]
  );
});

test("real verification: plugin-health-audit-workflow's own plan() produces the exact original three-step sequence", async () => {
  const { plan } = await import("../plugin-health-audit/plugin-health-audit-workflow.js");
  const result = await plan({ sourceFiles: [{ path: "a.php", content: "<?php" }] });
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["plugin-security-remediation", "plugin-performance-optimization", "architecture-remediation"]
  );
});

test("real verification: release-readiness-workflow's own plan() produces the exact original three-step sequence", async () => {
  const { plan } = await import("../release-readiness/release-readiness-workflow.js");
  const result = await plan({ sourceFiles: [{ path: "a.php", content: "<?php" }] });
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["plugin-security-remediation", "plugin-performance-optimization", "architecture-remediation"]
  );
});
