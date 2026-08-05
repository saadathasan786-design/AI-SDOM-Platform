import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runAgentWithReport, listAgentCatalog, getAgentMetadata, isAvailable, checkCompatibility } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("registration: the Architecture Remediation Agent is registered and appears in the real Agent Catalog", () => {
  assert.equal(isAvailable("architecture-remediation"), true);
  const catalog = listAgentCatalog();
  assert.ok(catalog.some((a) => a.id === "architecture-remediation"));
});

test("catalog discovery: metadata exposes correct category, inputRequirements, capabilities, and dependency declarations", () => {
  const meta = getAgentMetadata("architecture-remediation");
  assert.equal(meta.category, "remediation");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.capabilities, ["invokes-generators"]);
  assert.deepEqual(meta.requiresAdvisors, ["architecture"]);
  assert.deepEqual(meta.requiresGenerators, ["theme"]);
});

test("compatibility: checkCompatibility confirms the real Architecture Advisor and Theme Generator are both registered", () => {
  const result = checkCompatibility("architecture-remediation");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAdvisors, []);
  assert.deepEqual(result.missingGenerators, []);
});

test("successful workflow: clean code produces zero actionable findings, agent stops cleanly after step 1, generator step never runs", async () => {
  const sourceFiles = [file("generators/framework/clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("architecture-remediation", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(report.steps[0].type, "advisors");
  assert.equal(report.halted.action, "stop");
  assert.match(report.halted.reason, /nothing to remediate/);
  assert.deepEqual(report.summary.generatorsRun, []);
});

test("workflow with no findings: the embedded Unified Advisor Report is the real, unmodified report from runAdvisors()", async () => {
  const sourceFiles = [file("generators/framework/clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("architecture-remediation", { sourceFiles });

  const embedded = report.steps[0].result;
  assert.equal(embedded.advisorsRun[0], "architecture");
  assert.ok(Array.isArray(embedded.advisorReports));
  assert.equal(embedded.summary.critical, 0);
  assert.equal(embedded.summary.warning, 0);
});

test("successful workflow: a real layer violation is actionable, the agent proceeds to the dry-run generator step, both embedded reports are real and unmodified", async () => {
  const sourceFiles = [
    file("generators/framework/executor.js", "import '../plugin/plugin-generator.js';\nexport const e = 1;"),
    file("generators/plugin/plugin-generator.js", "export const p = 1;"),
  ];
  const report = await runAgentWithReport("architecture-remediation", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 2);

  const advisorResult = report.steps[0].result;
  assert.ok(advisorResult.findings.some((f) => f.id === "layer-violation"));
  assert.equal(report.steps[0].decision.action, "continue");

  const generatorResult = report.steps[1].result;
  assert.equal(generatorResult.generator, "theme");
  assert.equal(generatorResult.mode, "dry-run");
  assert.equal(generatorResult.success, true);
  assert.equal(report.steps[1].decision.action, "stop");

  assert.deepEqual(report.summary.advisorsRun, ["architecture"]);
  assert.deepEqual(report.summary.generatorsRun, ["theme"]);
});

test("real delegation: the dry-run generator step performs zero real filesystem writes", async () => {
  const sourceFiles = [
    file("generators/framework/executor.js", "import '../plugin/plugin-generator.js';\nexport const e = 1;"),
    file("generators/plugin/plugin-generator.js", "export const p = 1;"),
  ];
  const dryRunDir = path.join(os.tmpdir(), "architecture-remediation-agent-dry-run");

  await runAgentWithReport("architecture-remediation", { sourceFiles });

  const exists = await fs
    .access(dryRunDir)
    .then(() => true)
    .catch(() => false);
  assert.equal(exists, false, "dry-run mode must never create real output");
});

test("advisor/generator failure isolation: a malformed but JS-valid context never crashes the agent -- always returns a structured report", async () => {
  const report = await runAgentWithReport("architecture-remediation", { sourceFiles: null });
  assert.equal(typeof report.success, "boolean");
});

test("planning failure: missing the required sourceFiles input entirely produces a clean failure report, never throws", async () => {
  const report = await runAgentWithReport("architecture-remediation", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("never-throws contract: unknown agent id still produces a structured failure report", async () => {
  const report = await runAgentWithReport("not-a-real-agent", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown agent/);
});

test("never-throws contract: running the real agent twice in parallel with different inputs does not interfere", async () => {
  const [cleanReport, violationReport] = await Promise.all([
    runAgentWithReport("architecture-remediation", {
      sourceFiles: [file("generators/framework/clean.js", "export const a = 1;")],
    }),
    runAgentWithReport("architecture-remediation", {
      sourceFiles: [
        file("generators/framework/executor.js", "import '../plugin/plugin-generator.js';\nexport const e = 1;"),
        file("generators/plugin/plugin-generator.js", "export const p = 1;"),
      ],
    }),
  ]);

  assert.equal(cleanReport.steps.length, 1);
  assert.equal(violationReport.steps.length, 2);
});

test("recommendations reflect the agent's own decision reasons, sourced only from decide(), not fabricated separately", async () => {
  const sourceFiles = [file("generators/framework/clean.js", "export const a = 1;")];
  const report = await runAgentWithReport("architecture-remediation", { sourceFiles });

  assert.equal(report.recommendations.length, 1);
  assert.equal(report.recommendations[0], report.halted.reason);
});
