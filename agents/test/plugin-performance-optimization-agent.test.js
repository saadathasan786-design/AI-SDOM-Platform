import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, decide } from "../plugin-performance-optimization/plugin-performance-optimization-agent.js";

test("plan() returns exactly two plain-data steps: an advisors step and a generator step", async () => {
  const result = await plan({ sourceFiles: [{ path: "x.php", content: "<?php" }] });

  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[0].type, "advisors");
  assert.deepEqual(result.steps[0].ids, ["wordpress-performance"]);
  assert.equal(result.steps[1].type, "generator");
  assert.equal(result.steps[1].generatorId, "plugin");
});

test("plan() passes the given sourceFiles through to the advisors step's context unchanged", async () => {
  const sourceFiles = [{ path: "a.php", content: "<?php" }];
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

test("decide() with critical findings (critical=1) returns continue", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: true, summary: { info: 1, suggestion: 0, warning: 0, critical: 1 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
});

test("decide() with a SINGLE isolated warning (warning=1) returns stop -- the genuine difference from the Plugin Security Remediation Agent", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: true, summary: { info: 1, suggestion: 0, warning: 1, critical: 0 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
});

test("decide() with accumulated warnings (warning=2) returns continue", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: true, summary: { info: 1, suggestion: 0, warning: 2, critical: 0 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
  assert.match(decision.reason, /warning=2\/2/);
});

test("decide() with warnings well above the accumulation threshold (warning=5) also returns continue", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: true, summary: { info: 0, suggestion: 0, warning: 5, critical: 0 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
});

test("decide() with suggestion volume (suggestion=3, warning=0, critical=0) returns continue -- the same volume threshold as the generic Performance Optimization Agent", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: true, summary: { info: 1, suggestion: 3, warning: 0, critical: 0 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "continue");
  assert.match(decision.reason, /suggestion=3\/3/);
});

test("decide() with suggestion volume just below the threshold (suggestion=2, warning=0, critical=0) returns stop", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: true, summary: { info: 1, suggestion: 2, warning: 0, critical: 0 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
  assert.match(decision.reason, /do not yet accumulate enough/);
});

test("decide() with zero findings at all returns stop", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: true, summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "stop");
});

test("decide() after a FAILED advisors step returns fail, never continue or stop", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const result = { success: false, advisorsFailed: ["wordpress-performance"], summary: { info: 0, suggestion: 0, warning: 0, critical: 0 } };
  const decision = await decide(step, result);
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /WordPress Performance scan step failed/);
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
    [{ type: "advisors" }, { success: true, summary: { info: 0, suggestion: 0, warning: 2, critical: 0 } }],
    [{ type: "advisors" }, { success: true, summary: { info: 0, suggestion: 3, warning: 0, critical: 0 } }],
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

test("decide() never inspects individual findings -- identical decision whether findings array is present or absent", async () => {
  const step = { type: "advisors", ids: ["wordpress-performance"] };
  const withFindings = {
    success: true,
    summary: { info: 0, suggestion: 0, warning: 2, critical: 0 },
    findings: [{ id: "query-in-loop", severity: "warning", message: "x" }],
  };
  const withoutFindingsArray = {
    success: true,
    summary: { info: 0, suggestion: 0, warning: 2, critical: 0 },
  };

  const decisionA = await decide(step, withFindings);
  const decisionB = await decide(step, withoutFindingsArray);
  assert.equal(decisionA.action, decisionB.action);
});
