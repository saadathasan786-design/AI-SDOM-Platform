import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runAgentWithReport, listAgentCatalog, getAgentMetadata, isAvailable, checkCompatibility } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

const WARNING_CODE = "function f(items) { for (let i = 0; i < items.length; i++) { JSON.parse(items[i]); } }";
const VOLUME_CODE = `
function f(items) {
  var s = '';
  for (var i = 0; i < items.length; i++) { s += 'x'; }
  switch (items[0]) { case 1: break; case 2: break; case 3: break; case 4: break; case 5: break; case 6: break; case 7: break; case 8: break; case 9: break; case 10: break; case 11: break; }
  if (a) { if (b) { if (c) { if (d) { doThing(); } } } }
}
`;

test("registration: the Performance Optimization Agent is registered and appears in the real Agent Catalog", () => {
  assert.equal(isAvailable("performance-optimization"), true);
  const catalog = listAgentCatalog();
  assert.ok(catalog.some((a) => a.id === "performance-optimization"));
});

test("catalog discovery: all three real agents are simultaneously discoverable", () => {
  const ids = listAgentCatalog().map((a) => a.id);
  assert.ok(ids.includes("architecture-remediation"));
  assert.ok(ids.includes("security-remediation"));
  assert.ok(ids.includes("performance-optimization"));
});

test("catalog discovery: metadata exposes correct category, inputRequirements, capabilities, and dependency declarations", () => {
  const meta = getAgentMetadata("performance-optimization");
  assert.equal(meta.category, "remediation");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.capabilities, ["invokes-generators"]);
  assert.deepEqual(meta.requiresAdvisors, ["performance"]);
  assert.deepEqual(meta.requiresGenerators, ["theme"]);
});

test("compatibility: checkCompatibility confirms the real Performance Advisor and Theme Generator are both registered", () => {
  const result = checkCompatibility("performance-optimization");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAdvisors, []);
  assert.deepEqual(result.missingGenerators, []);
});

test("successful workflow: clean code produces zero findings, agent stops cleanly after step 1", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("performance-optimization", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(report.halted.action, "stop");
  assert.match(report.halted.reason, /do not yet meet the remediation threshold/);
  assert.deepEqual(report.summary.generatorsRun, []);
});

test("workflow with no actionable findings: the embedded Unified Advisor Report is real and unmodified", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("performance-optimization", { sourceFiles });

  const embedded = report.steps[0].result;
  assert.equal(embedded.advisorsRun[0], "performance");
  assert.ok(Array.isArray(embedded.advisorReports));
  assert.equal(embedded.summary.warning, 0);
});

test("successful workflow: a real warning-level finding (json-operation-in-loop) escalates to the generator step", async () => {
  const sourceFiles = [file("x.js", WARNING_CODE)];
  const report = await runAgentWithReport("performance-optimization", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 2);
  assert.ok(report.steps[0].result.findings.some((f) => f.id === "json-operation-in-loop"));
  assert.equal(report.steps[0].decision.action, "continue");

  const generatorResult = report.steps[1].result;
  assert.equal(generatorResult.generator, "theme");
  assert.equal(generatorResult.mode, "dry-run");
  assert.equal(generatorResult.success, true);
  assert.equal(report.steps[1].decision.action, "stop");

  assert.deepEqual(report.summary.generatorsRun, ["theme"]);
});

test("successful workflow: high suggestion volume (3+ suggestions, zero warnings) also escalates -- the volume-based branch, verified against real findings", async () => {
  const sourceFiles = [file("x.js", VOLUME_CODE)];
  const report = await runAgentWithReport("performance-optimization", { sourceFiles });

  const advisorResult = report.steps[0].result;
  assert.equal(advisorResult.summary.warning, 0);
  assert.ok(advisorResult.summary.suggestion >= 3);
  assert.equal(report.steps[0].decision.action, "continue");
  assert.match(report.steps[0].decision.reason, /suggestion=/);
  assert.equal(report.steps.length, 2);
});

test("real delegation: the dry-run generator step performs zero real filesystem writes", async () => {
  const sourceFiles = [file("x.js", WARNING_CODE)];
  const dryRunDir = path.join(os.tmpdir(), "performance-optimization-agent-dry-run");

  await runAgentWithReport("performance-optimization", { sourceFiles });

  const exists = await fs
    .access(dryRunDir)
    .then(() => true)
    .catch(() => false);
  assert.equal(exists, false, "dry-run mode must never create real output");
});

test("planning failure: missing the required sourceFiles input entirely produces a clean failure report, never throws", async () => {
  const report = await runAgentWithReport("performance-optimization", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("never-throws contract: unknown agent id still produces a structured failure report", async () => {
  const report = await runAgentWithReport("not-a-real-agent", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown agent/);
});

test("never-throws contract: running all three real agents in parallel with different inputs does not interfere", async () => {
  const [architectureReport, securityReport, performanceReport] = await Promise.all([
    runAgentWithReport("architecture-remediation", { sourceFiles: [file("clean.js", "export const a = 1;")] }),
    runAgentWithReport("security-remediation", { sourceFiles: [file("x.js", "eval(x);")] }),
    runAgentWithReport("performance-optimization", { sourceFiles: [file("x.js", WARNING_CODE)] }),
  ]);

  assert.equal(architectureReport.steps.length, 1);
  assert.equal(securityReport.steps.length, 3);
  assert.equal(performanceReport.steps.length, 2);
});

test("recommendations reflect the agent's own decision reasons, sourced only from decide()", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("performance-optimization", { sourceFiles });

  assert.equal(report.recommendations.length, 1);
  assert.equal(report.recommendations[0], report.halted.reason);
});
