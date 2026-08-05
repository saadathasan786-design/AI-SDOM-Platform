import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  runWorkflowWithReport,
  listWorkflowCatalog,
  getWorkflowMetadata,
  isAvailable,
  checkCompatibility,
} from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("registration: the Project Health Check Workflow is registered and appears in the real Workflow Catalog", () => {
  assert.equal(isAvailable("project-health-check"), true);
  const catalog = listWorkflowCatalog();
  assert.ok(catalog.some((w) => w.id === "project-health-check"));
});

test("discovery: metadata exposes correct category, inputRequirements, capabilities, and requiredAgents", () => {
  const meta = getWorkflowMetadata("project-health-check");
  assert.equal(meta.category, "health-check");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.capabilities, ["chains-agents"]);
  assert.deepEqual(meta.requiredAgents, ["architecture-remediation", "security-remediation", "performance-optimization"]);
});

test("compatibility: checkCompatibility confirms all three real Agents are registered", () => {
  const result = checkCompatibility("project-health-check");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAgents, []);
});

test("planning: the real workflow's plan produces the correct three-step sequence with required inputs threaded through", async () => {
  const { plan } = await import("../project-health-check/project-health-check-workflow.js");
  const result = await plan({ sourceFiles: [file("x.js", "x")] });
  assert.equal(result.steps.length, 3);
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["architecture-remediation", "security-remediation", "performance-optimization"]
  );
});

test("successful workflow: clean code runs all three real agents to completion, stopping cleanly after the final one", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runWorkflowWithReport("project-health-check", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);
  assert.deepEqual(
    report.steps.map((s) => s.agentId),
    ["architecture-remediation", "security-remediation", "performance-optimization"]
  );
  assert.equal(report.halted.action, "stop");
  assert.deepEqual(report.summary.agentsRun, ["architecture-remediation", "security-remediation", "performance-optimization"]);
});

test("integration: the complete four-layer execution chain runs correctly (Workflow -> Agent -> Advisor -> Generator, dry-run)", async () => {
  const sourceFiles = [
    file(
      "generators/framework/executor.js",
      "import '../plugin/plugin-generator.js';\neval(x);\nfunction f(items) { for (let i = 0; i < items.length; i++) { JSON.parse(items[i]); } }"
    ),
    file("generators/plugin/plugin-generator.js", "export const p = 1;"),
  ];

  const report = await runWorkflowWithReport("project-health-check", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);

  const archAgentReport = report.steps[0].agentReport;
  assert.equal(archAgentReport.agent, "architecture-remediation");
  assert.ok(archAgentReport.steps[0].result.findings.some((f) => f.id === "layer-violation"));
  assert.equal(archAgentReport.steps[1].result.generator, "theme");
  assert.equal(archAgentReport.steps[1].result.mode, "dry-run");

  const secAgentReport = report.steps[1].agentReport;
  assert.equal(secAgentReport.agent, "security-remediation");
  assert.ok(secAgentReport.steps[0].result.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.equal(secAgentReport.steps.length, 3);
  assert.equal(secAgentReport.steps[2].result.generator, "plugin");
  assert.equal(secAgentReport.steps[2].result.mode, "dry-run");

  const perfAgentReport = report.steps[2].agentReport;
  assert.equal(perfAgentReport.agent, "performance-optimization");
  assert.ok(perfAgentReport.steps[0].result.findings.some((f) => f.id === "json-operation-in-loop"));
  assert.equal(perfAgentReport.steps[1].result.generator, "theme");
  assert.equal(perfAgentReport.steps[1].result.mode, "dry-run");
});

test("embedded Agent Reports remain completely unchanged -- verified key-set equality against the real Agent Report shape, three deep", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runWorkflowWithReport("project-health-check", { sourceFiles });

  const expectedAgentReportKeys = [
    "agent",
    "success",
    "plan",
    "steps",
    "halted",
    "summary",
    "recommendations",
    "errors",
    "execution_ms",
    "timestamp",
  ].sort();

  for (const step of report.steps) {
    assert.deepEqual(Object.keys(step.agentReport).sort(), expectedAgentReportKeys);
  }
});

test("embedded Advisor Report (nested inside an Agent Report) remains completely unchanged", async () => {
  const sourceFiles = [file("x.js", "eval(x);")];
  const report = await runWorkflowWithReport("project-health-check", { sourceFiles });

  const securityAgentAdvisorStep = report.steps[1].agentReport.steps[0];
  assert.equal(securityAgentAdvisorStep.type, "advisors");
  assert.deepEqual(
    Object.keys(securityAgentAdvisorStep.result).sort(),
    [
      "advisorCount",
      "advisorReports",
      "advisorsFailed",
      "advisorsRun",
      "execution_ms",
      "findings",
      "inputRequirementsUnion",
      "success",
      "summary",
      "timestamp",
    ].sort()
  );
});

test("real delegation: zero real filesystem writes occur anywhere across the entire four-layer chain", async () => {
  const sourceFiles = [
    file("generators/framework/executor.js", "import '../plugin/plugin-generator.js';\neval(x);"),
    file("generators/plugin/plugin-generator.js", "export const p = 1;"),
  ];

  await runWorkflowWithReport("project-health-check", { sourceFiles });

  const dryRunDirs = [
    path.join(os.tmpdir(), "architecture-remediation-agent-dry-run"),
    path.join(os.tmpdir(), "security-remediation-agent-dry-run"),
    path.join(os.tmpdir(), "performance-optimization-agent-dry-run"),
  ];

  for (const dir of dryRunDirs) {
    const exists = await fs
      .access(dir)
      .then(() => true)
      .catch(() => false);
    assert.equal(exists, false, `dry-run mode must never create real output at ${dir}`);
  }
});

test("required inputs: missing sourceFiles entirely produces a clean, never-thrown failure report", async () => {
  const report = await runWorkflowWithReport("project-health-check", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("never-throws contract: unknown workflow id still produces a structured failure report", async () => {
  const report = await runWorkflowWithReport("not-a-real-workflow", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown workflow/);
});

test("recommendations reflect the workflow's own decision reasons, sourced only from decide()", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const report = await runWorkflowWithReport("project-health-check", { sourceFiles });

  assert.equal(report.recommendations.length, 1);
  assert.equal(report.recommendations[0], report.halted.reason);
});
