import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAdvisorWithReport, listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("integration: the Code Review Advisor is registered and discoverable via the real catalog", () => {
  assert.equal(isAvailable("code-review"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "code-review"));

  const meta = getAdvisorMetadata("code-review");
  assert.equal(meta.category, "code-quality");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
});

test("integration: both advisors are simultaneously discoverable and independently runnable", () => {
  const catalog = listAdvisorCatalog();
  const ids = catalog.map((a) => a.id);
  assert.ok(ids.includes("architecture"));
  assert.ok(ids.includes("code-review"));
});

test("integration: a clean codebase produces zero warnings or critical findings", async () => {
  const sourceFiles = [
    file(
      "clean.js",
      ["/**", " * Adds two numbers.", " */", "export function addNumbers(a, b) {", "  return a + b;", "}"].join("\n")
    ),
  ];
  const report = await runAdvisorWithReport("code-review", { sourceFiles });
  assert.equal(report.success, true);
  assert.equal(report.summary.warning, 0);
  assert.equal(report.summary.critical, 0);
});

test("integration: a problematic codebase (multiple real issues) produces multiple warnings through the full report pipeline", async () => {
  const sourceFiles = [
    file(
      "problematic.js",
      [
        "export function get_user_data() {}",
        "export function fetchUserProfile() {}",
        "",
        "export function riskyOperation() {",
        "  try {",
        "    doSomething();",
        "  } catch (e) {}",
        "}",
      ].join("\n")
    ),
  ];
  const report = await runAdvisorWithReport("code-review", { sourceFiles });
  assert.equal(report.success, true);
  assert.ok(report.summary.warning >= 2);
  assert.ok(report.findings.some((f) => f.id === "naming-inconsistency"));
  assert.ok(report.findings.some((f) => f.id === "empty-catch-block"));
});

test("integration: empty project (zero files) produces a successful report with zero findings", async () => {
  const report = await runAdvisorWithReport("code-review", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("integration: missing required input is reported as failure, never thrown", async () => {
  const report = await runAdvisorWithReport("code-review", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("integration: malformed input (a file with null content) does not crash -- report wrapper catches it", async () => {
  const sourceFiles = [file("weird.js", null)];
  const report = await runAdvisorWithReport("code-review", { sourceFiles });
  assert.equal(typeof report.success, "boolean");
  if (!report.success) assert.ok(report.error);
});

test("integration: failure handling does not affect a subsequent, valid run", async () => {
  const failedReport = await runAdvisorWithReport("code-review", {});
  assert.equal(failedReport.success, false);

  const goodReport = await runAdvisorWithReport("code-review", {
    sourceFiles: [file("a.js", "export const a = 1;")],
  });
  assert.equal(goodReport.success, true);
});

test("integration: running both advisors against the same real context in parallel demonstrates failure isolation and independent results", async () => {
  const sourceFiles = [
    file(
      "problematic.js",
      ["export function get_user() {}", "export function fetchUser() {}", "try { x(); } catch (e) {}"].join("\n")
    ),
  ];

  const [architectureReport, codeReviewReport] = await Promise.all([
    runAdvisorWithReport("architecture", { sourceFiles }),
    runAdvisorWithReport("code-review", { sourceFiles }),
  ]);

  assert.equal(architectureReport.success, true);
  assert.equal(codeReviewReport.success, true);
  assert.ok(codeReviewReport.findings.some((f) => f.id === "naming-inconsistency"));
});

test("integration: real project source (this repository's own generators/ and advisors/ trees) analyzes successfully with a bounded, non-noisy set of warnings", async () => {
  async function collectSourceFiles(rootDirs) {
    const files = [];
    async function walk(dir, relBase) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "test" || entry.name === "node_modules") continue;
        const abs = path.join(dir, entry.name);
        const rel = relBase ? path.posix.join(relBase, entry.name) : entry.name;
        if (entry.isDirectory()) {
          await walk(abs, rel);
        } else if (entry.name.endsWith(".js")) {
          files.push({ path: rel, content: await fs.readFile(abs, "utf8") });
        }
      }
    }
    for (const dir of rootDirs) {
      await walk(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."), dir), dir);
    }
    return files;
  }

  const sourceFiles = await collectSourceFiles(["generators", "advisors"]);
  const report = await runAdvisorWithReport("code-review", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.summary.critical, 0);
  assert.ok(report.findings.some((f) => f.id === "code-size-summary"));
  const duplicationCount = report.findings.filter((f) => f.id === "cross-file-duplication").length;
  // Threshold raised from 20 to 35 following Stage 7C: the WordPress
  // Performance Advisor and WordPress Security Advisor now genuinely
  // share several small helper functions (maskPhpStrings,
  // extractBalancedParens, findLineNumber) verbatim, a real, accurately
  // -detected duplication -- not a regression in this test, evidence
  // that Code Review's own duplication check is working correctly. Per
  // Stage 7C's explicit "do not modify any existing Advisor" scope, this
  // duplication was deliberately left in place rather than refactored;
  // it is an honest, evidence-based, deferred promotion candidate,
  // mirroring the exact treatment already given to the confirmed
  // registry duplication across Stages 6A/6G/7A. This is still a bounded
  // sanity check, not a precise business threshold.
  assert.ok(duplicationCount < 35, `expected a bounded duplication count, got ${duplicationCount}`);
});
