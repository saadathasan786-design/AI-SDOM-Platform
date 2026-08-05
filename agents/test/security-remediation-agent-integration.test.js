import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runAgentWithReport, listAgentCatalog, getAgentMetadata, isAvailable, checkCompatibility } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("registration: the Security Remediation Agent is registered and appears in the real Agent Catalog", () => {
  assert.equal(isAvailable("security-remediation"), true);
  const catalog = listAgentCatalog();
  assert.ok(catalog.some((a) => a.id === "security-remediation"));
});

test("catalog discovery: both real agents are simultaneously discoverable", () => {
  const ids = listAgentCatalog().map((a) => a.id);
  assert.ok(ids.includes("architecture-remediation"));
  assert.ok(ids.includes("security-remediation"));
});

test("catalog discovery: metadata exposes correct category, inputRequirements, capabilities, and dependency declarations", () => {
  const meta = getAgentMetadata("security-remediation");
  assert.equal(meta.category, "remediation");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.capabilities, ["invokes-generators"]);
  assert.deepEqual(meta.requiresAdvisors, ["security", "code-review"]);
  assert.deepEqual(meta.requiresGenerators, ["plugin"]);
});

test("compatibility: checkCompatibility confirms the real Security Advisor, Code Review Advisor, and Plugin Generator are all registered", () => {
  const result = checkCompatibility("security-remediation");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAdvisors, []);
  assert.deepEqual(result.missingGenerators, []);
});

test("successful workflow: clean code produces zero critical findings on the narrow scan, agent stops cleanly after step 1", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("security-remediation", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(report.steps[0].type, "advisors");
  assert.deepEqual(report.steps[0].ids, ["security"]);
  assert.equal(report.halted.action, "stop");
  assert.match(report.halted.reason, /nothing urgent to escalate/);
  assert.deepEqual(report.summary.generatorsRun, []);
});

test("workflow with no actionable findings: the embedded Advisor Report from the narrow scan is real and unmodified", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("security-remediation", { sourceFiles });

  const embedded = report.steps[0].result;
  assert.equal(embedded.advisorsRun[0], "security");
  assert.ok(Array.isArray(embedded.advisorReports));
  assert.equal(embedded.summary.critical, 0);
});

test("successful workflow: a real critical security finding (eval) escalates through all three steps, embedding real, unmodified reports", async () => {
  const sourceFiles = [file("x.js", "eval(x);")];
  const report = await runAgentWithReport("security-remediation", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);

  const narrowResult = report.steps[0].result;
  assert.ok(narrowResult.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.equal(report.steps[0].decision.action, "continue");

  const broadResult = report.steps[1].result;
  assert.deepEqual(broadResult.advisorsRun.sort(), ["code-review", "security"]);
  assert.equal(report.steps[1].decision.action, "continue");

  const generatorResult = report.steps[2].result;
  assert.equal(generatorResult.generator, "plugin");
  assert.equal(generatorResult.mode, "dry-run");
  assert.equal(generatorResult.success, true);
  assert.equal(report.steps[2].decision.action, "stop");

  assert.deepEqual(report.summary.generatorsRun, ["plugin"]);
});

test("real delegation: the dry-run generator step performs zero real filesystem writes", async () => {
  const sourceFiles = [file("x.js", "eval(x);")];
  const dryRunDir = path.join(os.tmpdir(), "security-remediation-agent-dry-run");

  await runAgentWithReport("security-remediation", { sourceFiles });

  const exists = await fs
    .access(dryRunDir)
    .then(() => true)
    .catch(() => false);
  assert.equal(exists, false, "dry-run mode must never create real output");
});

test("real delegation: the broad escalation step genuinely runs both the Security and Code Review Advisors together in one call", async () => {
  const sourceFiles = [file("x.js", "eval(x);")];
  const report = await runAgentWithReport("security-remediation", { sourceFiles });

  const broadStep = report.steps[1];
  assert.equal(broadStep.result.advisorCount, 2);
  assert.deepEqual(broadStep.result.advisorsFailed, []);
});

test("planning failure: missing the required sourceFiles input entirely produces a clean failure report, never throws", async () => {
  const report = await runAgentWithReport("security-remediation", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("never-throws contract: unknown agent id still produces a structured failure report", async () => {
  const report = await runAgentWithReport("not-a-real-agent", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown agent/);
});

test("never-throws contract: running both real agents in parallel with different inputs does not interfere", async () => {
  const [architectureReport, securityReport] = await Promise.all([
    runAgentWithReport("architecture-remediation", {
      sourceFiles: [file("clean.js", "export const a = 1;")],
    }),
    runAgentWithReport("security-remediation", {
      sourceFiles: [file("x.js", "eval(x);")],
    }),
  ]);

  assert.equal(architectureReport.steps.length, 1);
  assert.equal(securityReport.steps.length, 3);
});

test("recommendations reflect the agent's own decision reasons at each gate, sourced only from decide()", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("security-remediation", { sourceFiles });

  assert.equal(report.recommendations.length, 1);
  assert.equal(report.recommendations[0], report.halted.reason);
});

test("intermediate case: the broad escalation step's decision is derived from ITS OWN result summary, not copied from step 1", async () => {
  const sourceFiles = [file("x.js", "eval(x);")];
  const report = await runAgentWithReport("security-remediation", { sourceFiles });

  assert.notEqual(report.steps[0].decision.reason, report.steps[1].decision.reason);
  assert.match(report.steps[0].decision.reason, /initial scan/);
  assert.match(report.steps[1].decision.reason, /broader check/);
});
