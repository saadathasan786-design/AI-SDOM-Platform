import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAdvisorWithReport, listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("integration: the Performance Advisor is registered and discoverable via the real catalog", () => {
  assert.equal(isAvailable("performance"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "performance"));

  const meta = getAdvisorMetadata("performance");
  assert.equal(meta.category, "performance");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
});

test("integration: all four advisors are simultaneously discoverable", () => {
  const ids = listAdvisorCatalog().map((a) => a.id);
  assert.ok(ids.includes("architecture"));
  assert.ok(ids.includes("code-review"));
  assert.ok(ids.includes("security"));
  assert.ok(ids.includes("performance"));
});

test("integration: a clean codebase produces zero warnings", async () => {
  const sourceFiles = [file("clean.js", "export function addNumbers(a, b) {\n  return a + b;\n}")];
  const report = await runAdvisorWithReport("performance", { sourceFiles });
  assert.equal(report.success, true);
  assert.equal(report.summary.warning, 0);
});

test("integration: a problematic codebase (nested loops with expensive operations) produces multiple warnings through the full report pipeline", async () => {
  const sourceFiles = [
    file(
      "problematic.js",
      [
        "for (let i = 0; i < items.length; i++) {",
        "  for (let j = 0; j < items.length; j++) {",
        "    const re = new RegExp(items[i]);",
        "    fs.readFileSync('data.json');",
        "  }",
        "}",
      ].join("\n")
    ),
  ];
  const report = await runAdvisorWithReport("performance", { sourceFiles });
  assert.equal(report.success, true);
  assert.ok(report.summary.warning >= 2);
  assert.ok(report.findings.some((f) => f.id === "regex-compiled-in-loop"));
  assert.ok(report.findings.some((f) => f.id === "sync-io-in-loop"));
});

test("integration: empty project (zero files) produces a successful report with zero findings", async () => {
  const report = await runAdvisorWithReport("performance", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("integration: missing required input is reported as failure, never thrown", async () => {
  const report = await runAdvisorWithReport("performance", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("integration: malformed input (a file with null content) does not crash -- report wrapper catches it", async () => {
  const sourceFiles = [file("weird.js", null)];
  const report = await runAdvisorWithReport("performance", { sourceFiles });
  assert.equal(typeof report.success, "boolean");
  if (!report.success) assert.ok(report.error);
});

test("integration: failure handling does not affect a subsequent, valid run", async () => {
  const failedReport = await runAdvisorWithReport("performance", {});
  assert.equal(failedReport.success, false);

  const goodReport = await runAdvisorWithReport("performance", {
    sourceFiles: [file("a.js", "export const a = 1;")],
  });
  assert.equal(goodReport.success, true);
});

test("integration: running all four advisors against the same real context in parallel demonstrates failure isolation and independent results", async () => {
  const sourceFiles = [
    file(
      "problematic.js",
      [
        "export function get_user() {}",
        "const apiKey = 'sk_live_abcdef1234567890';",
        "for (const x of a) { for (const y of b) { doThing(); } }",
      ].join("\n")
    ),
  ];

  const [architectureReport, codeReviewReport, securityReport, performanceReport] = await Promise.all([
    runAdvisorWithReport("architecture", { sourceFiles }),
    runAdvisorWithReport("code-review", { sourceFiles }),
    runAdvisorWithReport("security", { sourceFiles }),
    runAdvisorWithReport("performance", { sourceFiles }),
  ]);

  assert.equal(architectureReport.success, true);
  assert.equal(codeReviewReport.success, true);
  assert.equal(securityReport.success, true);
  assert.equal(performanceReport.success, true);
  assert.ok(performanceReport.findings.some((f) => f.id === "nested-loop-complexity"));
});

test("integration: real project source analyzes successfully with bounded, plausible findings (regression guard for the brace-masking bug)", async () => {
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

  const sourceFiles = await collectSourceFiles(["generators", "advisors", "mcp-server"]);
  const report = await runAdvisorWithReport("performance", { sourceFiles });

  assert.equal(report.success, true);
  assert.ok(report.findings.some((f) => f.id === "performance-scan-summary"));

  const nestedLoopCount = report.findings.filter((f) => f.id === "nested-loop-complexity").length;
  const regexInLoopCount = report.findings.filter((f) => f.id === "regex-compiled-in-loop").length;
  // These thresholds are intentionally generous, not tightly pinned to
  // today's exact file count: this corpus grows as more advisors are
  // added (each contributing a few more instances of the same common,
  // benign "for each file, scan its matches" idiom), which is expected,
  // healthy growth -- not a regression. What this guards against is the
  // ACTUAL bug found in Stage 4F, where broken body-extraction inflated
  // counts by orders of magnitude (bodies running to the end of the
  // file), not a normal linear increase from more source files existing.
  assert.ok(nestedLoopCount < 60, `expected a bounded nested-loop count, got ${nestedLoopCount}`);
  assert.ok(regexInLoopCount < 30, `expected a bounded regex-in-loop count, got ${regexInLoopCount}`);
});
