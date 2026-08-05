import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runAdvisorWithReport, listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("integration: the Security Advisor is registered and discoverable via the real catalog", () => {
  assert.equal(isAvailable("security"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "security"));

  const meta = getAdvisorMetadata("security");
  assert.equal(meta.category, "security");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
});

test("integration: all three advisors are simultaneously discoverable", () => {
  const ids = listAdvisorCatalog().map((a) => a.id);
  assert.ok(ids.includes("architecture"));
  assert.ok(ids.includes("code-review"));
  assert.ok(ids.includes("security"));
});

test("integration: a clean codebase produces zero critical or warning findings", async () => {
  const sourceFiles = [file("clean.js", "export function addNumbers(a, b) {\n  return a + b;\n}")];
  const report = await runAdvisorWithReport("security", { sourceFiles });
  assert.equal(report.success, true);
  assert.equal(report.summary.critical, 0);
  assert.equal(report.summary.warning, 0);
});

test("integration: a problematic codebase (multiple real vulnerabilities) produces multiple critical findings through the full report pipeline", async () => {
  const sourceFiles = [
    file(
      "vulnerable.js",
      [
        "const result = eval(userInput);",
        "const apiKey = 'sk_live_abcdef1234567890';",
        "const agent = new https.Agent({ rejectUnauthorized: false });",
      ].join("\n")
    ),
  ];
  const report = await runAdvisorWithReport("security", { sourceFiles });
  assert.equal(report.success, true);
  assert.ok(report.summary.critical >= 3);
  assert.ok(report.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.ok(report.findings.some((f) => f.id === "hardcoded-credential"));
  assert.ok(report.findings.some((f) => f.id === "disabled-ssl-verification"));
});

test("integration: empty project (zero files) produces a successful report with zero findings", async () => {
  const report = await runAdvisorWithReport("security", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("integration: missing required input is reported as failure, never thrown", async () => {
  const report = await runAdvisorWithReport("security", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("integration: malformed input (a file with null content) does not crash -- report wrapper catches it", async () => {
  const sourceFiles = [file("weird.js", null)];
  const report = await runAdvisorWithReport("security", { sourceFiles });
  assert.equal(typeof report.success, "boolean");
  if (!report.success) assert.ok(report.error);
});

test("integration: failure handling does not affect a subsequent, valid run", async () => {
  const failedReport = await runAdvisorWithReport("security", {});
  assert.equal(failedReport.success, false);

  const goodReport = await runAdvisorWithReport("security", {
    sourceFiles: [file("a.js", "export const a = 1;")],
  });
  assert.equal(goodReport.success, true);
});

test("integration: running all three advisors against the same real context in parallel demonstrates failure isolation and independent results", async () => {
  const sourceFiles = [
    file(
      "problematic.js",
      ["export function get_user() {}", "const apiKey = 'sk_live_abcdef1234567890';", "try { x(); } catch (e) {}"].join(
        "\n"
      )
    ),
  ];

  const [architectureReport, codeReviewReport, securityReport] = await Promise.all([
    runAdvisorWithReport("architecture", { sourceFiles }),
    runAdvisorWithReport("code-review", { sourceFiles }),
    runAdvisorWithReport("security", { sourceFiles }),
  ]);

  assert.equal(architectureReport.success, true);
  assert.equal(codeReviewReport.success, true);
  assert.equal(securityReport.success, true);
  assert.ok(securityReport.findings.some((f) => f.id === "hardcoded-credential"));
});

test("integration: real project source analyzes with only explainable findings (no RegExp.exec() false positives)", async () => {
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
      await walk(path.join(process.cwd(), "..", dir), dir);
    }
    return files;
  }

  const sourceFiles = await collectSourceFiles(["generators", "advisors", "mcp-server"]);
  const report = await runAdvisorWithReport("security", { sourceFiles });

  assert.equal(report.success, true);
  assert.ok(report.findings.some((f) => f.id === "security-scan-summary"));

  // The real regression this test guards: RegExp.prototype.exec() calls
  // (used throughout this codebase's own regex-based analysis) must never
  // be misclassified as child_process usage, except this advisor's own
  // self-referential doc-string matches, which are a separately accepted,
  // documented limitation.
  const childProcessFindings = report.findings.filter((f) => f.id === "child-process-usage");
  for (const finding of childProcessFindings) {
    assert.equal(
      finding.evidence.path,
      "advisors/security/security-advisor.js",
      `unexpected child-process-usage finding outside the advisor's own self-referential match: ${JSON.stringify(finding.evidence)}`
    );
  }

  // The one genuine, already-documented, intentional pattern in this
  // repository should still be correctly (accurately) detected.
  assert.ok(
    report.findings.some((f) => f.id === "disabled-ssl-verification" && f.evidence.path === "mcp-server/wp-client.js")
  );
});
