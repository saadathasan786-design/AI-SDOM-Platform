import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, decide } from "../project-health-check/project-health-check-workflow.js";

test("plan() returns exactly three steps in the fixed sequence: architecture, security, performance", async () => {
  const result = await plan({ sourceFiles: [{ path: "x.js", content: "export const a = 1;" }] });

  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].agentId, "architecture-remediation");
  assert.equal(result.steps[1].agentId, "security-remediation");
  assert.equal(result.steps[2].agentId, "performance-optimization");
});

test("plan() passes the given sourceFiles through to every step's context, unchanged", async () => {
  const sourceFiles = [{ path: "a.js", content: "x" }];
  const result = await plan({ sourceFiles });
  for (const step of result.steps) {
    assert.deepEqual(step.context.sourceFiles, sourceFiles);
  }
});

test("plan() returns plain, JSON-serializable data with no functions embedded", async () => {
  const result = await plan({ sourceFiles: [] });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("decide() returns fail when an agent report has success:false, and includes the underlying error detail", async () => {
  const step = { agentId: "architecture-remediation" };
  const failedReport = { success: false, errors: [{ message: "something broke" }] };

  const decision = await decide(step, failedReport);
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /architecture-remediation/);
  assert.match(decision.reason, /something broke/);
});

test("decide() returns fail gracefully even when the failed report has no errors array", async () => {
  const step = { agentId: "security-remediation" };
  const failedReport = { success: false };

  const decision = await decide(step, failedReport);
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /no additional detail provided/);
});

test("decide() returns continue for a successful non-final agent (architecture)", async () => {
  const decision = await decide({ agentId: "architecture-remediation" }, { success: true });
  assert.equal(decision.action, "continue");
});

test("decide() returns continue for a successful non-final agent (security)", async () => {
  const decision = await decide({ agentId: "security-remediation" }, { success: true });
  assert.equal(decision.action, "continue");
});

test("decide() returns stop for the final agent (performance-optimization) on success", async () => {
  const decision = await decide({ agentId: "performance-optimization" }, { success: true });
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /completed successfully/);
});

test("decide() returns fail, not stop, even for the final agent if it reports failure", async () => {
  const decision = await decide({ agentId: "performance-optimization" }, { success: false, errors: [{ message: "x" }] });
  assert.equal(decision.action, "fail");
});

test("decide() never returns an action outside the three-action vocabulary (no skip)", async () => {
  const cases = [
    [{ agentId: "architecture-remediation" }, { success: true }],
    [{ agentId: "security-remediation" }, { success: true }],
    [{ agentId: "performance-optimization" }, { success: true }],
    [{ agentId: "architecture-remediation" }, { success: false, errors: [{ message: "x" }] }],
  ];
  const validActions = new Set(["continue", "stop", "fail"]);
  for (const [step, report] of cases) {
    const decision = await decide(step, report);
    assert.ok(validActions.has(decision.action), `unexpected action: ${decision.action}`);
  }
});

test("decide() never inspects embedded Advisor findings or Generator reports -- identical decision whether steps array is present or absent on the agent report", async () => {
  const step = { agentId: "architecture-remediation" };
  const withEmbeddedSteps = {
    success: true,
    steps: [{ type: "advisors", result: { findings: [{ id: "layer-violation", severity: "critical" }] } }],
  };
  const withoutEmbeddedSteps = { success: true };

  const decisionA = await decide(step, withEmbeddedSteps);
  const decisionB = await decide(step, withoutEmbeddedSteps);
  assert.equal(decisionA.action, decisionB.action);
});
