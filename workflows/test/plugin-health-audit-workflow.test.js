import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, decide } from "../plugin-health-audit/plugin-health-audit-workflow.js";

test("plan() returns exactly three steps in the fixed sequence: security, performance, architecture", async () => {
  const result = await plan({ sourceFiles: [{ path: "x.php", content: "<?php" }] });

  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].agentId, "plugin-security-remediation");
  assert.equal(result.steps[1].agentId, "plugin-performance-optimization");
  assert.equal(result.steps[2].agentId, "architecture-remediation");
});

test("plan() steps use exactly the { agentId, context } shape, no other fields", async () => {
  const result = await plan({ sourceFiles: [] });
  for (const step of result.steps) {
    assert.deepEqual(Object.keys(step).sort(), ["agentId", "context"].sort());
  }
});

test("plan() passes the given sourceFiles through to every step's context, unchanged", async () => {
  const sourceFiles = [{ path: "a.php", content: "<?php" }];
  const result = await plan({ sourceFiles });
  for (const step of result.steps) {
    assert.deepEqual(step.context.sourceFiles, sourceFiles);
  }
});

test("plan() returns plain, JSON-serializable data with no functions embedded", async () => {
  const result = await plan({ sourceFiles: [] });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("decide() returns continue for a successful plugin-security-remediation step", async () => {
  const decision = await decide({ agentId: "plugin-security-remediation" }, { success: true });
  assert.equal(decision.action, "continue");
});

test("decide() returns continue for a successful plugin-performance-optimization step", async () => {
  const decision = await decide({ agentId: "plugin-performance-optimization" }, { success: true });
  assert.equal(decision.action, "continue");
});

test("decide() returns stop for the final agent (architecture-remediation) on success", async () => {
  const decision = await decide({ agentId: "architecture-remediation" }, { success: true });
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /completed successfully/);
});

test("decide() returns fail when an agent report has success:false, including the underlying error detail", async () => {
  const step = { agentId: "plugin-security-remediation" };
  const failedReport = { success: false, errors: [{ message: "something broke" }] };
  const decision = await decide(step, failedReport);
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /plugin-security-remediation/);
  assert.match(decision.reason, /something broke/);
});

test("decide() returns fail even for the final agent if it reports failure (fail overrides stop)", async () => {
  const decision = await decide({ agentId: "architecture-remediation" }, { success: false, errors: [{ message: "x" }] });
  assert.equal(decision.action, "fail");
});

test("decide() gracefully handles a failed report with no errors array", async () => {
  const decision = await decide({ agentId: "plugin-security-remediation" }, { success: false });
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /no additional detail provided/);
});

test("decide() never returns an action outside the three-action vocabulary (no skip)", async () => {
  const cases = [
    [{ agentId: "plugin-security-remediation" }, { success: true }],
    [{ agentId: "plugin-performance-optimization" }, { success: true }],
    [{ agentId: "architecture-remediation" }, { success: true }],
    [{ agentId: "plugin-security-remediation" }, { success: false, errors: [{ message: "x" }] }],
  ];
  const validActions = new Set(["continue", "stop", "fail"]);
  for (const [step, report] of cases) {
    const decision = await decide(step, report);
    assert.ok(validActions.has(decision.action), `unexpected action: ${decision.action}`);
  }
});

test("decide() never inspects embedded Advisor findings or Generator reports -- identical decision whether steps array is present or absent on the agent report", async () => {
  const step = { agentId: "plugin-security-remediation" };
  const withEmbeddedSteps = {
    success: true,
    steps: [{ type: "advisors", result: { findings: [{ id: "missing-nonce-verification", severity: "critical" }] } }],
  };
  const withoutEmbeddedSteps = { success: true };

  const decisionA = await decide(step, withEmbeddedSteps);
  const decisionB = await decide(step, withoutEmbeddedSteps);
  assert.equal(decisionA.action, decisionB.action);
});
