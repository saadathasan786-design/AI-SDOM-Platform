import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runAgentWithReport, listAgentCatalog, getAgentMetadata, isAvailable, checkCompatibility } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

const SECURE_CODE = `<?php
function my_secure_handler() {
    if ( ! wp_verify_nonce( $_POST['my_nonce'], 'my_action' ) ) {
        wp_die( 'Invalid nonce' );
    }
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Unauthorized' );
    }
    $name = sanitize_text_field( $_POST['name'] );
    echo esc_html( $name );
}`;

const VULNERABLE_CODE = `<?php
function my_insecure_handler() {
    $name = $_POST['name'];
    update_option( 'my_setting', $name );
}
function my_search_handler() {
    global $wpdb;
    $term = $_GET['term'];
    $results = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}my_table WHERE name = '" . $term . "'" );
    echo $results[0]->name;
}`;

test("registration: the Plugin Security Remediation Agent is registered and appears in the real Agent Catalog", () => {
  assert.equal(isAvailable("plugin-security-remediation"), true);
  const catalog = listAgentCatalog();
  assert.ok(catalog.some((a) => a.id === "plugin-security-remediation"));
});

test("catalog discovery: all four real agents are simultaneously discoverable", () => {
  const ids = listAgentCatalog().map((a) => a.id);
  assert.ok(ids.includes("architecture-remediation"));
  assert.ok(ids.includes("security-remediation"));
  assert.ok(ids.includes("performance-optimization"));
  assert.ok(ids.includes("plugin-security-remediation"));
});

test("catalog discovery: metadata exposes correct category, inputRequirements, capabilities, and dependency declarations", () => {
  const meta = getAgentMetadata("plugin-security-remediation");
  assert.equal(meta.category, "wordpress-remediation");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.capabilities, ["invokes-generators"]);
  assert.deepEqual(meta.requiresAdvisors, ["wordpress-security"]);
  assert.deepEqual(meta.requiresGenerators, ["plugin"]);
});

test("compatibility: checkCompatibility confirms the real WordPress Security Advisor and Plugin Generator are both registered", () => {
  const result = checkCompatibility("plugin-security-remediation");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAdvisors, []);
  assert.deepEqual(result.missingGenerators, []);
});

test("clean/secure plugin: zero findings, agent stops cleanly after step 1, no generator step", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("secure.php", SECURE_CODE)] });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(report.halted.action, "stop");
  assert.match(report.halted.reason, /No meaningful WordPress security findings/);
  assert.deepEqual(report.summary.generatorsRun, []);
});

test("mixed plugin (secure code with no genuine findings): behaves identically to the clean case", async () => {
  const mixedContent = `<?php
function h() {
  if ( ! wp_verify_nonce( $_POST['n'], 'a' ) ) wp_die();
  if ( ! current_user_can( 'manage_options' ) ) wp_die();
  $x = sanitize_text_field( $_POST['x'] );
  echo esc_html( $x );
}`;
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("mixed.php", mixedContent)] });
  assert.equal(report.steps.length, 1);
  assert.equal(report.halted.action, "stop");
});

test("vulnerable plugin: real critical/warning findings escalate to the dry-run Plugin Generator step", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 2);

  const advisorResult = report.steps[0].result;
  assert.ok(advisorResult.findings.some((f) => f.id === "missing-nonce-verification"));
  assert.ok(advisorResult.findings.some((f) => f.id === "missing-capability-check"));
  assert.ok(advisorResult.summary.critical > 0);
  assert.equal(report.steps[0].decision.action, "continue");

  const generatorResult = report.steps[1].result;
  assert.equal(generatorResult.generator, "plugin");
  assert.equal(generatorResult.mode, "dry-run");
  assert.equal(generatorResult.success, true);
  assert.equal(report.steps[1].decision.action, "stop");

  assert.deepEqual(report.summary.generatorsRun, ["plugin"]);
});

test("preview-only / no-write guarantee: zero real filesystem writes occur for the vulnerable plugin scenario", async () => {
  const dryRunDir = path.join(os.tmpdir(), "plugin-security-remediation-agent-dry-run");

  await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });

  const exists = await fs
    .access(dryRunDir)
    .then(() => true)
    .catch(() => false);
  assert.equal(exists, false, "dry-run mode must never create real output");
});

test("embedded Advisor Report remains completely unchanged -- exact real Unified Advisor Report shape", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });
  const advisorResult = report.steps[0].result;

  assert.deepEqual(
    Object.keys(advisorResult).sort(),
    ["advisorCount", "advisorReports", "advisorsFailed", "advisorsRun", "execution_ms", "findings", "inputRequirementsUnion", "success", "summary", "timestamp"].sort()
  );
  assert.deepEqual(advisorResult.advisorsRun, ["wordpress-security"]);
});

test("embedded Generation Report remains completely unchanged -- exact real Generation Report shape", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] });
  const generatorResult = report.steps[1].result;

  assert.deepEqual(
    Object.keys(generatorResult).sort(),
    ["generator", "mode", "success", "files", "warnings", "rollback", "no_op", "execution_ms", "timestamp", "error"].sort()
  );
});

test("report structure: the Agent Report itself uses the exact same shape as every other real agent", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("secure.php", SECURE_CODE)] });
  assert.deepEqual(
    Object.keys(report).sort(),
    ["agent", "success", "plan", "steps", "halted", "summary", "recommendations", "errors", "execution_ms", "timestamp"].sort()
  );
});

test("planning failure: missing the required sourceFiles input entirely produces a clean failure report, never throws", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("empty input: an empty sourceFiles array produces a clean, successful, no-op report", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(report.halted.action, "stop");
});

test("never-throws contract: unknown agent id still produces a structured failure report", async () => {
  const report = await runAgentWithReport("not-a-real-agent", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown agent/);
});

test("never-throws contract: running all four real agents in parallel with different inputs does not interfere", async () => {
  const [architectureReport, securityReport, performanceReport, wpSecurityReport] = await Promise.all([
    runAgentWithReport("architecture-remediation", { sourceFiles: [file("clean.js", "export const a = 1;")] }),
    runAgentWithReport("security-remediation", { sourceFiles: [file("x.js", "eval(x);")] }),
    runAgentWithReport("performance-optimization", { sourceFiles: [file("x.js", "export const a = 1;")] }),
    runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("vuln.php", VULNERABLE_CODE)] }),
  ]);

  assert.equal(architectureReport.steps.length, 1);
  assert.equal(securityReport.steps.length, 3);
  assert.equal(performanceReport.steps.length, 1);
  assert.equal(wpSecurityReport.steps.length, 2);
});

test("recommendations reflect the agent's own decision reasons, sourced only from decide()", async () => {
  const report = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("secure.php", SECURE_CODE)] });
  assert.equal(report.recommendations.length, 1);
  assert.equal(report.recommendations[0], report.halted.reason);
});
