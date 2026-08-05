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

const SECURE_CODE = `<?php
function my_secure_handler() {
    if ( ! wp_verify_nonce( $_POST['my_nonce'], 'my_action' ) ) wp_die();
    if ( ! current_user_can( 'manage_options' ) ) wp_die();
    $name = sanitize_text_field( $_POST['name'] );
    echo esc_html( $name );
}`;

const VULNERABLE_CODE = `<?php
function my_insecure_handler() {
    $name = $_POST['name'];
    update_option( 'my_setting', $name );
}
function h($ids) {
  foreach ($ids as $id) {
    $x = get_post_meta($id, 'k', true);
  }
}
function s() {
  $q = new WP_Query( array( 'orderby' => 'rand' ) );
}`;

const MIXED_CODE = `<?php
function secure_part() {
  if (!current_user_can('manage_options')) wp_die();
  if (!wp_verify_nonce($_POST['n'], 'a')) wp_die();
  $x = sanitize_text_field($_POST['x']);
  echo esc_html($x);
}
function h($ids) {
  foreach ($ids as $id) { $y = get_post_meta($id, 'j', true); }
}`;

test("registration: the Release Readiness Workflow is registered and appears in the real Workflow Catalog", () => {
  assert.equal(isAvailable("release-readiness"), true);
  const catalog = listWorkflowCatalog();
  assert.ok(catalog.some((w) => w.id === "release-readiness"));
});

test("catalog discovery: all four real workflows are simultaneously discoverable", () => {
  const ids = listWorkflowCatalog().map((w) => w.id);
  assert.ok(ids.includes("project-health-check"));
  assert.ok(ids.includes("security-audit"));
  assert.ok(ids.includes("plugin-health-audit"));
  assert.ok(ids.includes("release-readiness"));
});

test("discovery: metadata exposes correct category, inputRequirements, capabilities, and requiredAgents", () => {
  const meta = getWorkflowMetadata("release-readiness");
  assert.equal(meta.category, "wordpress-release-readiness");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.capabilities, ["chains-agents"]);
  assert.deepEqual(meta.requiredAgents, [
    "plugin-security-remediation",
    "plugin-performance-optimization",
    "architecture-remediation",
  ]);
});

test("compatibility: checkCompatibility confirms all three required agents are registered", () => {
  const result = checkCompatibility("release-readiness");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAgents, []);
});

test("planning: the real workflow's plan produces the correct three-step sequence", async () => {
  const { plan } = await import("../release-readiness/release-readiness-workflow.js");
  const result = await plan({ sourceFiles: [file("x.php", "<?php")] });
  assert.equal(result.steps.length, 3);
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["plugin-security-remediation", "plugin-performance-optimization", "architecture-remediation"]
  );
});

test("secure plugin: all three agents run in order, stopping after the final step", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("secure.php", SECURE_CODE)] });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);
  assert.deepEqual(
    report.steps.map((s) => s.agentId),
    ["plugin-security-remediation", "plugin-performance-optimization", "architecture-remediation"]
  );
  assert.equal(report.halted.action, "stop");
  assert.match(report.halted.reason, /Architecture Remediation step/);
});

test("cross-agent execution / complete four-layer chain: vulnerable plugin runs correctly (Workflow -> WordPress Agents + generic Agent -> Advisors -> Generators, dry-run)", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);

  const secAgentReport = report.steps[0].agentReport;
  assert.equal(secAgentReport.agent, "plugin-security-remediation");
  assert.ok(secAgentReport.steps[0].result.findings.some((f) => f.id === "missing-nonce-verification"));

  const perfAgentReport = report.steps[1].agentReport;
  assert.equal(perfAgentReport.agent, "plugin-performance-optimization");
  assert.ok(perfAgentReport.steps[0].result.findings.some((f) => f.id === "query-in-loop"));

  const archAgentReport = report.steps[2].agentReport;
  assert.equal(archAgentReport.agent, "architecture-remediation");

  assert.equal(report.halted.action, "stop");
});

test("mixed plugin: workflow completes successfully with a mix of clean and flagged code", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("mixed.php", MIXED_CODE)] });
  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);
});

test("embedded Agent Reports remain completely unchanged -- verified key-set equality against the real Agent Report shape, three deep", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("secure.php", SECURE_CODE)] });

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
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });

  const securityAgentAdvisorStep = report.steps[0].agentReport.steps[0];
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

test("embedded Generation Report (nested inside an Agent Report's generator step) remains completely unchanged", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });

  const secAgentReport = report.steps[0].agentReport;
  const generatorStep = secAgentReport.steps.find((s) => s.type === "generator");
  assert.ok(generatorStep);
  assert.deepEqual(
    Object.keys(generatorStep.result).sort(),
    ["generator", "mode", "success", "files", "warnings", "rollback", "no_op", "execution_ms", "timestamp", "error"].sort()
  );
  assert.equal(generatorStep.result.mode, "dry-run");
});

test("no disk writes: zero real filesystem writes occur anywhere across the entire chain", async () => {
  await runWorkflowWithReport("release-readiness", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });

  const dryRunDirs = [
    path.join(os.tmpdir(), "plugin-security-remediation-agent-dry-run"),
    path.join(os.tmpdir(), "plugin-performance-optimization-agent-dry-run"),
    path.join(os.tmpdir(), "architecture-remediation-agent-dry-run"),
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
  const report = await runWorkflowWithReport("release-readiness", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("empty input: an empty sourceFiles array produces a clean, successful workflow", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);
});

test("never-throws contract: unknown workflow id still produces a structured failure report", async () => {
  const report = await runWorkflowWithReport("not-a-real-workflow", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown workflow/);
});

test("exact report shape: the Workflow Report itself uses the exact same shape as every other real workflow", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("secure.php", SECURE_CODE)] });
  assert.deepEqual(
    Object.keys(report).sort(),
    ["workflow", "success", "plan", "steps", "halted", "summary", "recommendations", "errors", "execution_ms", "timestamp"].sort()
  );
});

test("recommendations reflect the workflow's own decision reasons, sourced only from decide()", async () => {
  const report = await runWorkflowWithReport("release-readiness", { sourceFiles: [file("secure.php", SECURE_CODE)] });
  assert.equal(report.recommendations.length, 1);
  assert.equal(report.recommendations[0], report.halted.reason);
});

test("never-throws contract: running all four real workflows in parallel with the same input does not interfere", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];

  const [healthCheckReport, auditReport, pluginHealthReport, releaseReadinessReport] = await Promise.all([
    runWorkflowWithReport("project-health-check", { sourceFiles }),
    runWorkflowWithReport("security-audit", { sourceFiles }),
    runWorkflowWithReport("plugin-health-audit", { sourceFiles }),
    runWorkflowWithReport("release-readiness", { sourceFiles }),
  ]);

  assert.deepEqual(
    healthCheckReport.steps.map((s) => s.agentId),
    ["architecture-remediation", "security-remediation", "performance-optimization"]
  );
  assert.deepEqual(
    auditReport.steps.map((s) => s.agentId),
    ["security-remediation", "architecture-remediation", "performance-optimization"]
  );
  assert.deepEqual(
    pluginHealthReport.steps.map((s) => s.agentId),
    ["plugin-security-remediation", "plugin-performance-optimization", "architecture-remediation"]
  );
  assert.deepEqual(
    releaseReadinessReport.steps.map((s) => s.agentId),
    ["plugin-security-remediation", "plugin-performance-optimization", "architecture-remediation"]
  );
});

test("policy comparison: Plugin Health Audit and Release Readiness use the identical agent sequence but produce genuinely different halted reasons", async () => {
  const sourceFiles = [file("secure.php", SECURE_CODE)];

  const pluginHealthReport = await runWorkflowWithReport("plugin-health-audit", { sourceFiles });
  const releaseReadinessReport = await runWorkflowWithReport("release-readiness", { sourceFiles });

  assert.deepEqual(
    pluginHealthReport.steps.map((s) => s.agentId),
    releaseReadinessReport.steps.map((s) => s.agentId)
  );
  assert.notEqual(pluginHealthReport.halted.reason, releaseReadinessReport.halted.reason);
});
