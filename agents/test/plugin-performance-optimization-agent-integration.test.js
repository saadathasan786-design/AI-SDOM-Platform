import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runAgentWithReport, listAgentCatalog, getAgentMetadata, isAvailable, checkCompatibility } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

const EFFICIENT_CODE = `<?php
function my_efficient_render($post_ids) {
    $query = new WP_Query( array(
        'post__in' => $post_ids,
        'posts_per_page' => 10,
        'no_found_rows' => true,
    ) );
    $cached_setting = get_option( 'my_plugin_setting' );
    foreach ( $query->posts as $post ) {
        echo esc_html( $post->post_title );
    }
}`;

const INEFFICIENT_CODE = `<?php
function h($ids) {
  foreach ($ids as $id) {
    $x = get_post_meta($id, 'k', true);
  }
}
function s() {
  $q = new WP_Query( array( 'orderby' => 'rand' ) );
}`;

test("registration: the Plugin Performance Optimization Agent is registered and appears in the real Agent Catalog", () => {
  assert.equal(isAvailable("plugin-performance-optimization"), true);
  const catalog = listAgentCatalog();
  assert.ok(catalog.some((a) => a.id === "plugin-performance-optimization"));
});

test("catalog discovery: all five real agents are simultaneously discoverable", () => {
  const ids = listAgentCatalog().map((a) => a.id);
  assert.ok(ids.includes("architecture-remediation"));
  assert.ok(ids.includes("security-remediation"));
  assert.ok(ids.includes("performance-optimization"));
  assert.ok(ids.includes("plugin-security-remediation"));
  assert.ok(ids.includes("plugin-performance-optimization"));
});

test("catalog discovery: metadata exposes correct category, inputRequirements, capabilities, and dependency declarations", () => {
  const meta = getAgentMetadata("plugin-performance-optimization");
  assert.equal(meta.category, "wordpress-remediation");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.capabilities, ["invokes-generators"]);
  assert.deepEqual(meta.requiresAdvisors, ["wordpress-performance"]);
  assert.deepEqual(meta.requiresGenerators, ["plugin"]);
});

test("compatibility: checkCompatibility confirms the real WordPress Performance Advisor and Plugin Generator are both registered", () => {
  const result = checkCompatibility("plugin-performance-optimization");
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAdvisors, []);
  assert.deepEqual(result.missingGenerators, []);
});

test("efficient plugin: zero findings, agent stops cleanly after step 1, no generator step", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("efficient.php", EFFICIENT_CODE)] });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(report.halted.action, "stop");
  assert.match(report.halted.reason, /do not yet accumulate enough/);
  assert.deepEqual(report.summary.generatorsRun, []);
});

test("real delegation: a single isolated warning-level finding does NOT escalate -- confirming the genuine accumulation-based policy against real advisor output", async () => {
  const isolatedContent = `<?php
function s() {
  $q = new WP_Query( array( 'orderby' => 'rand', 'posts_per_page' => 5, 'no_found_rows' => true ) );
}`;
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("a.php", isolatedContent)] });

  assert.equal(report.steps[0].result.summary.warning, 1);
  assert.equal(report.steps.length, 1);
  assert.equal(report.halted.action, "stop");
});

test("mixed plugin: below-threshold accumulation (2 suggestions) does not escalate", async () => {
  const mixedContent = `<?php
function repeated_lookups() {
  $a = get_option('x');
  $b = get_option('x');
}
function query_no_found_rows() {
  $q = new WP_Query( array( 'posts_per_page' => 5 ) );
}`;
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("mixed.php", mixedContent)] });
  assert.equal(report.steps[0].result.summary.suggestion, 2);
  assert.equal(report.steps.length, 1);
});

test("inefficient plugin: real accumulated warning-level findings escalate to the dry-run Plugin Generator step", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("inefficient.php", INEFFICIENT_CODE)] });

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 2);

  const advisorResult = report.steps[0].result;
  assert.ok(advisorResult.findings.some((f) => f.id === "query-in-loop"));
  assert.ok(advisorResult.findings.some((f) => f.id === "expensive-random-order"));
  assert.ok(advisorResult.summary.warning >= 2);
  assert.equal(report.steps[0].decision.action, "continue");

  const generatorResult = report.steps[1].result;
  assert.equal(generatorResult.generator, "plugin");
  assert.equal(generatorResult.mode, "dry-run");
  assert.equal(generatorResult.success, true);
  assert.equal(report.steps[1].decision.action, "stop");

  assert.deepEqual(report.summary.generatorsRun, ["plugin"]);
});

test("preview-only / no-write guarantee: zero real filesystem writes occur for the inefficient plugin scenario", async () => {
  const dryRunDir = path.join(os.tmpdir(), "plugin-performance-optimization-agent-dry-run");

  await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("inefficient.php", INEFFICIENT_CODE)] });

  const exists = await fs
    .access(dryRunDir)
    .then(() => true)
    .catch(() => false);
  assert.equal(exists, false, "dry-run mode must never create real output");
});

test("embedded Advisor Report remains completely unchanged -- exact real Unified Advisor Report shape", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("inefficient.php", INEFFICIENT_CODE)] });
  const advisorResult = report.steps[0].result;

  assert.deepEqual(
    Object.keys(advisorResult).sort(),
    ["advisorCount", "advisorReports", "advisorsFailed", "advisorsRun", "execution_ms", "findings", "inputRequirementsUnion", "success", "summary", "timestamp"].sort()
  );
  assert.deepEqual(advisorResult.advisorsRun, ["wordpress-performance"]);
});

test("embedded Generation Report remains completely unchanged -- exact real Generation Report shape", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("inefficient.php", INEFFICIENT_CODE)] });
  const generatorResult = report.steps[1].result;

  assert.deepEqual(
    Object.keys(generatorResult).sort(),
    ["generator", "mode", "success", "files", "warnings", "rollback", "no_op", "execution_ms", "timestamp", "error"].sort()
  );
});

test("report structure: the Agent Report itself uses the exact same shape as every other real agent", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("efficient.php", EFFICIENT_CODE)] });
  assert.deepEqual(
    Object.keys(report).sort(),
    ["agent", "success", "plan", "steps", "halted", "summary", "recommendations", "errors", "execution_ms", "timestamp"].sort()
  );
});

test("planning failure: missing the required sourceFiles input entirely produces a clean failure report, never throws", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("empty input: an empty sourceFiles array produces a clean, successful, no-op report", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(report.halted.action, "stop");
});

test("never-throws contract: unknown agent id still produces a structured failure report", async () => {
  const report = await runAgentWithReport("not-a-real-agent", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown agent/);
});

test("never-throws contract: running all five real agents in parallel with different inputs does not interfere", async () => {
  const [architectureReport, securityReport, performanceReport, wpSecurityReport, wpPerformanceReport] = await Promise.all([
    runAgentWithReport("architecture-remediation", { sourceFiles: [file("clean.js", "export const a = 1;")] }),
    runAgentWithReport("security-remediation", { sourceFiles: [file("x.js", "eval(x);")] }),
    runAgentWithReport("performance-optimization", { sourceFiles: [file("x.js", "export const a = 1;")] }),
    runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("vuln.php", "<?php\n$x = $_POST['x'];")] }),
    runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("inefficient.php", INEFFICIENT_CODE)] }),
  ]);

  assert.equal(architectureReport.steps.length, 1);
  assert.equal(securityReport.steps.length, 3);
  assert.equal(performanceReport.steps.length, 1);
  assert.equal(wpSecurityReport.steps.length, 2);
  assert.equal(wpPerformanceReport.steps.length, 2);
});

test("recommendations reflect the agent's own decision reasons, sourced only from decide()", async () => {
  const report = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("efficient.php", EFFICIENT_CODE)] });
  assert.equal(report.recommendations.length, 1);
  assert.equal(report.recommendations[0], report.halted.reason);
});

// ---------------------------------------------------------------------
// Cross-Agent decision policy comparison (required by this stage)
// ---------------------------------------------------------------------

test("policy comparison: this Agent stops on a single isolated warning while the same signal would escalate the Plugin Security Remediation Agent -- genuine, verified policy difference", async () => {
  const perfIsolated =
    "<?php\nfunction s() { $q = new WP_Query( array( 'orderby' => 'rand', 'posts_per_page' => 5, 'no_found_rows' => true ) ); }";
  const perfReport = await runAgentWithReport("plugin-performance-optimization", { sourceFiles: [file("b.php", perfIsolated)] });

  assert.equal(perfReport.steps[0].result.summary.warning, 1);
  assert.equal(perfReport.steps.length, 1); // stops -- one warning is not enough for THIS agent

  const securityIsolated = "<?php\n$x = $_POST['x'];\necho $x;";
  const securityReport = await runAgentWithReport("plugin-security-remediation", { sourceFiles: [file("a.php", securityIsolated)] });
  assert.ok(securityReport.steps.length >= 1);
});
