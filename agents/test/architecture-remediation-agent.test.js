import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, decide } from "../architecture-remediation/architecture-remediation-agent.js";

test("plan() returns exactly two plain-data steps: an advisors step and a generator step", async () => {
  const result = await plan({ sourceFiles: [{ path: "x.js", content: "export const a = 1;" }] });

  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[0].type, "advisors");
  assert.deepEqual(result.steps[0].ids, ["architecture"]);
  assert.equal(result.steps[1].type, "generator");
  assert.equal(result.steps[1].generatorId, "theme");
});

test("plan() passes the given sourceFiles through to the advisors step's context unchanged", async () => {
  const sourceFiles = [{ path: "a.js", content: "x" }];
  const result = await plan({ sourceFiles });
  assert.deepEqual(result.steps[0].context.sourceFiles, sourceFiles);
});

test("plan() always sets the generator step's mode to dry-run (never write)", async () => {
  const result = await plan({ sourceFiles: [] });
  assert.equal(result.steps[1].options.mode, "dry-run");
});

test("plan() returns plain, JSON-serializable data with no functions embedded", async () => {
  const result = await plan({ sourceFiles: [] });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("decide() after a successful advisors step with actionable (critical) findings returns continue", async () => {
  const step = { type: "advisors", ids: ["architecture"] };
  const result = { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 2 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
  assert.match(decision.reason, /2 actionable/);
});

test("decide() after a successful advisors step with actionable (warning) findings returns continue", async () => {
  const step = { type: "advisors", ids: ["architecture"] };
  const result = { success: true, summary: { info: 5, suggestion: 3, warning: 1, critical: 0 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
});

test("decide() after a successful advisors step with only info/suggestion findings returns stop", async () => {
  const step = { type: "advisors", ids: ["architecture"] };
  const result = { success: true, summary: { info: 4, suggestion: 2, warning: 0, critical: 0 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /nothing to remediate/);
});

test("decide() after a successful advisors step with zero findings at all returns stop", async () => {
  const step = { type: "advisors", ids: ["architecture"] };
  const result = { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
});

test("decide() after a FAILED advisors step returns fail, never continue or stop", async () => {
  const step = { type: "advisors", ids: ["architecture"] };
  const result = { success: false, advisorsFailed: ["architecture"], summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /Architecture Advisor step failed/);
});

test("decide() after a successful generator step returns stop", async () => {
  const step = { type: "generator", generatorId: "theme" };
  const result = { success: true, generator: "theme" };

  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /completed successfully/);
});

test("decide() after a FAILED generator step returns fail", async () => {
  const step = { type: "generator", generatorId: "theme" };
  const result = { success: false, error: "output directory conflict" };

  const decision = await decide(step, result);
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /output directory conflict/);
});

test("decide() never returns an action outside the fixed vocabulary", async () => {
  const cases = [
    [{ type: "advisors" }, { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 1 } }],
    [{ type: "advisors" }, { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } }],
    [{ type: "advisors" }, { success: false, advisorsFailed: ["x"] }],
    [{ type: "generator" }, { success: true }],
    [{ type: "generator" }, { success: false, error: "x" }],
  ];
  const validActions = new Set(["continue", "skip", "stop", "fail"]);
  for (const [step, result] of cases) {
    const decision = await decide(step, result);
    assert.ok(validActions.has(decision.action), `unexpected action: ${decision.action}`);
  }
});

test("decide() handles an unrecognized step type by failing safely rather than throwing", async () => {
  const decision = await decide({ type: "something-unexpected" }, {});
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /Unrecognized step type/);
});

test("decide() never inspects individual findings -- only result.summary/result.success (evidence of orchestration-only logic)", async () => {
  const step = { type: "advisors" };
  const withFindings = {
    success: true,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 1 },
    findings: [{ id: "layer-violation", severity: "critical", message: "x" }],
  };
  const withoutFindingsArray = {
    success: true,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 1 },
  };

  const decisionA = await decide(step, withFindings);
  const decisionB = await decide(step, withoutFindingsArray);
  assert.equal(decisionA.action, decisionB.action);
});
