import { test } from "node:test";
import assert from "node:assert/strict";
import { decideGeneratorStep } from "../framework/generator-step-decision.js";

// ---------------------------------------------------------------------
// successful generator step / stop decision
// ---------------------------------------------------------------------

test("a successful result returns action 'stop' with the default Remediation-labeled reason", () => {
  const decision = decideGeneratorStep({ success: true });
  assert.deepEqual(decision, { action: "stop", reason: "Remediation generator step completed successfully (dry-run)." });
});

test("a successful result with an explicit actionLabel uses that label instead of the default", () => {
  const decision = decideGeneratorStep({ success: true }, { actionLabel: "Optimization" });
  assert.deepEqual(decision, { action: "stop", reason: "Optimization generator step completed successfully (dry-run)." });
});

// ---------------------------------------------------------------------
// failed generator step / fail decision
// ---------------------------------------------------------------------

test("a failed result returns action 'fail' with the error message embedded, default label", () => {
  const decision = decideGeneratorStep({ success: false, error: "disk full" });
  assert.deepEqual(decision, { action: "fail", reason: "Remediation generator step failed: disk full" });
});

test("a failed result with an explicit actionLabel uses that label instead of the default", () => {
  const decision = decideGeneratorStep({ success: false, error: "timeout" }, { actionLabel: "Optimization" });
  assert.deepEqual(decision, { action: "fail", reason: "Optimization generator step failed: timeout" });
});

// ---------------------------------------------------------------------
// every decision outcome is exactly one of the two valid actions
// ---------------------------------------------------------------------

test("only ever returns action 'stop' or 'fail', never 'continue' or 'skip'", () => {
  const successDecision = decideGeneratorStep({ success: true });
  const failureDecision = decideGeneratorStep({ success: false, error: "x" });
  assert.ok(["stop", "fail"].includes(successDecision.action));
  assert.ok(["stop", "fail"].includes(failureDecision.action));
});

// ---------------------------------------------------------------------
// purity / determinism / side-effect-free
// ---------------------------------------------------------------------

test("is pure and deterministic: identical input always produces an identical, deep-equal result", () => {
  const input = { success: false, error: "same error" };
  const a = decideGeneratorStep(input);
  const b = decideGeneratorStep(input);
  assert.deepEqual(a, b);
});

test("does not mutate its input result object", () => {
  const input = { success: true };
  const inputCopy = { ...input };
  decideGeneratorStep(input);
  assert.deepEqual(input, inputCopy);
});

test("does not mutate the options object", () => {
  const options = { actionLabel: "Optimization" };
  const optionsCopy = { ...options };
  decideGeneratorStep({ success: true }, options);
  assert.deepEqual(options, optionsCopy);
});

// ---------------------------------------------------------------------
// malformed / edge-case input
// ---------------------------------------------------------------------

test("a failed result with no error field still produces a fail decision, without throwing", () => {
  assert.doesNotThrow(() => decideGeneratorStep({ success: false }));
  const decision = decideGeneratorStep({ success: false });
  assert.equal(decision.action, "fail");
  assert.match(decision.reason, /Remediation generator step failed: undefined/);
});

test("called with no options argument at all defaults to the Remediation label", () => {
  assert.doesNotThrow(() => decideGeneratorStep({ success: true }));
  const decision = decideGeneratorStep({ success: true });
  assert.match(decision.reason, /^Remediation/);
});

test("called with an empty options object defaults to the Remediation label", () => {
  const decision = decideGeneratorStep({ success: true }, {});
  assert.match(decision.reason, /^Remediation/);
});

// ---------------------------------------------------------------------
// unchanged Agent behavior -- exact real end-to-end verification against
// every migrated agent
// ---------------------------------------------------------------------

test("real end-to-end: architecture-remediation-agent's own generator-step decide() branch uses the shared helper with the default (Remediation) label", async () => {
  const { decide } = await import("../architecture-remediation/architecture-remediation-agent.js");
  const decision = await decide({ type: "generator" }, { success: true });
  assert.deepEqual(decision, { action: "stop", reason: "Remediation generator step completed successfully (dry-run)." });
});

test("real end-to-end: performance-optimization-agent's own generator-step decide() branch uses the shared helper with the default (Remediation) label", async () => {
  const { decide } = await import("../performance-optimization/performance-optimization-agent.js");
  const decision = await decide({ type: "generator" }, { success: true });
  assert.deepEqual(decision, { action: "stop", reason: "Remediation generator step completed successfully (dry-run)." });
});

test("real end-to-end: security-remediation-agent's own generator-step decide() branch uses the shared helper with the default (Remediation) label", async () => {
  const { decide } = await import("../security-remediation/security-remediation-agent.js");
  const decision = await decide({ type: "generator" }, { success: false, error: "x" });
  assert.deepEqual(decision, { action: "fail", reason: "Remediation generator step failed: x" });
});

test("real end-to-end: plugin-security-remediation-agent's own generator-step decide() branch uses the shared helper with the default (Remediation) label", async () => {
  const { decide } = await import("../plugin-security-remediation/plugin-security-remediation-agent.js");
  const decision = await decide({ type: "generator" }, { success: true });
  assert.deepEqual(decision, { action: "stop", reason: "Remediation generator step completed successfully (dry-run)." });
});

test("real end-to-end: plugin-performance-optimization-agent's own generator-step decide() branch uses the shared helper with the Optimization label, preserving its unique wording", async () => {
  const { decide } = await import("../plugin-performance-optimization/plugin-performance-optimization-agent.js");
  const decision = await decide({ type: "generator" }, { success: true });
  assert.deepEqual(decision, { action: "stop", reason: "Optimization generator step completed successfully (dry-run)." });
});

test("real end-to-end: plugin-performance-optimization-agent's failure path also preserves its Optimization label", async () => {
  const { decide } = await import("../plugin-performance-optimization/plugin-performance-optimization-agent.js");
  const decision = await decide({ type: "generator" }, { success: false, error: "boom" });
  assert.deepEqual(decision, { action: "fail", reason: "Optimization generator step failed: boom" });
});
