import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, decide } from "../security-remediation/security-remediation-agent.js";

test("plan() returns exactly three plain-data steps: narrow scan, broad escalation, generator", async () => {
  const result = await plan({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] });

  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].type, "advisors");
  assert.deepEqual(result.steps[0].ids, ["security"]);
  assert.equal(result.steps[1].type, "advisors");
  assert.deepEqual(result.steps[1].ids, ["security", "code-review"]);
  assert.equal(result.steps[2].type, "generator");
  assert.equal(result.steps[2].generatorId, "plugin");
});

test("plan() passes the given sourceFiles through to both advisors steps' context unchanged", async () => {
  const sourceFiles = [{ path: "a.js", content: "x" }];
  const result = await plan({ sourceFiles });
  assert.deepEqual(result.steps[0].context.sourceFiles, sourceFiles);
  assert.deepEqual(result.steps[1].context.sourceFiles, sourceFiles);
});

test("plan() always sets the generator step's mode to dry-run (never write)", async () => {
  const result = await plan({ sourceFiles: [] });
  assert.equal(result.steps[2].options.mode, "dry-run");
});

test("plan() returns plain, JSON-serializable data with no functions embedded", async () => {
  const result = await plan({ sourceFiles: [] });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("plan() uses a genuinely different generator than the Architecture Remediation Agent (plugin, not theme)", async () => {
  const result = await plan({ sourceFiles: [] });
  assert.equal(result.steps[2].generatorId, "plugin");
});

test("decide() on the narrow scan (single advisor id) with critical findings returns continue", async () => {
  const step = { type: "advisors", ids: ["security"] };
  const result = { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 1 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
  assert.match(decision.reason, /escalating to a broader/);
});

test("decide() on the narrow scan with zero critical findings returns stop, even if warnings exist", async () => {
  const step = { type: "advisors", ids: ["security"] };
  const result = { success: true, summary: { info: 2, suggestion: 1, warning: 3, critical: 0 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /nothing urgent to escalate/);
});

test("decide() on the broad escalation step (multiple advisor ids) with critical findings returns continue", async () => {
  const step = { type: "advisors", ids: ["security", "code-review"] };
  const result = { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 1 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
  assert.match(decision.reason, /confirmed on the broader check/);
});

test("decide() on the broad escalation step with zero critical findings returns stop (the finding didn't survive escalation)", async () => {
  const step = { type: "advisors", ids: ["security", "code-review"] };
  const result = { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } };

  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /no critical issues/);
});

test("decide() distinguishes the narrow scan from the broad escalation purely by ids.length, not by any hidden state", async () => {
  const resultWithCritical = { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 1 } };

  const narrowDecision = await decide({ type: "advisors", ids: ["security"] }, resultWithCritical);
  const broadDecision = await decide({ type: "advisors", ids: ["security", "code-review"] }, resultWithCritical);

  assert.match(narrowDecision.reason, /initial scan/);
  assert.match(broadDecision.reason, /broader check/);
});

test("decide() after a FAILED advisors step (either gate) returns fail, never continue or stop", async () => {
  const narrowStep = { type: "advisors", ids: ["security"] };
  const broadStep = { type: "advisors", ids: ["security", "code-review"] };
  const failedResult = { success: false, advisorsFailed: ["security"], summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } };

  const narrowDecision = await decide(narrowStep, failedResult);
  const broadDecision = await decide(broadStep, failedResult);

  assert.equal(narrowDecision.action, "fail");
  assert.equal(broadDecision.action, "fail");
  assert.match(narrowDecision.reason, /Security scan step failed/);
});

test("decide() after a successful generator step returns stop", async () => {
  const step = { type: "generator", generatorId: "plugin" };
  const result = { success: true, generator: "plugin" };

  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /completed successfully/);
});

test("decide() after a FAILED generator step returns fail", async () => {
  const step = { type: "generator", generatorId: "plugin" };
  const result = { success: false, error: "output directory conflict" };

  const decision = await decide(step, result);
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /output directory conflict/);
});

test("decide() never returns an action outside the fixed vocabulary across all branches", async () => {
  const cases = [
    [{ type: "advisors", ids: ["security"] }, { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 1 } }],
    [{ type: "advisors", ids: ["security"] }, { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } }],
    [{ type: "advisors", ids: ["security", "code-review"] }, { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 1 } }],
    [{ type: "advisors", ids: ["security", "code-review"] }, { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } }],
    [{ type: "advisors", ids: ["security"] }, { success: false, advisorsFailed: ["x"] }],
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

test("decide() never inspects individual findings -- identical decision whether findings array is present or absent", async () => {
  const step = { type: "advisors", ids: ["security"] };
  const withFindings = {
    success: true,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 1 },
    findings: [{ id: "dangerous-eval-usage", severity: "critical", message: "x" }],
  };
  const withoutFindingsArray = {
    success: true,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 1 },
  };

  const decisionA = await decide(step, withFindings);
  const decisionB = await decide(step, withoutFindingsArray);
  assert.equal(decisionA.action, decisionB.action);
});
