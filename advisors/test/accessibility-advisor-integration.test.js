import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runAdvisorWithReport, listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("integration: the Accessibility Advisor is registered and discoverable via the real catalog", () => {
  assert.equal(isAvailable("accessibility"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "accessibility"));

  const meta = getAdvisorMetadata("accessibility");
  assert.equal(meta.category, "accessibility");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
});

test("integration: all five advisors are simultaneously discoverable", () => {
  const ids = listAdvisorCatalog().map((a) => a.id);
  assert.ok(ids.includes("architecture"));
  assert.ok(ids.includes("code-review"));
  assert.ok(ids.includes("security"));
  assert.ok(ids.includes("performance"));
  assert.ok(ids.includes("accessibility"));
});

test("integration: clean markup produces zero critical or warning findings", async () => {
  const sourceFiles = [file("clean.html", "<img src=\"a.jpg\" alt=\"A photo\">\n<button>Submit</button>")];
  const report = await runAdvisorWithReport("accessibility", { sourceFiles });
  assert.equal(report.success, true);
  assert.equal(report.summary.critical, 0);
  assert.equal(report.summary.warning, 0);
});

test("integration: problematic markup (multiple real issues) produces multiple findings through the full report pipeline", async () => {
  const sourceFiles = [
    file(
      "problematic.html",
      [
        "<img src=\"a.jpg\">",
        "<input type=\"text\" id=\"name\">",
        "<h2>Section</h2><h4>Sub</h4>",
        "<button></button>",
        "<a href=\"/x\">click here</a>",
      ].join("\n")
    ),
  ];
  const report = await runAdvisorWithReport("accessibility", { sourceFiles });
  assert.equal(report.success, true);
  assert.ok(report.summary.critical >= 1);
  assert.ok(report.summary.warning >= 3);
  assert.ok(report.findings.some((f) => f.id === "missing-alt-attribute"));
  assert.ok(report.findings.some((f) => f.id === "unlabeled-form-control"));
  assert.ok(report.findings.some((f) => f.id === "skipped-heading-level"));
});

test("integration: empty project (zero files) produces a successful report with zero findings", async () => {
  const report = await runAdvisorWithReport("accessibility", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("integration: missing required input is reported as failure, never thrown", async () => {
  const report = await runAdvisorWithReport("accessibility", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("integration: malformed input (a file with null content) does not crash -- report wrapper catches it", async () => {
  const sourceFiles = [file("weird.html", null)];
  const report = await runAdvisorWithReport("accessibility", { sourceFiles });
  assert.equal(typeof report.success, "boolean");
  if (!report.success) assert.ok(report.error);
});

test("integration: failure handling does not affect a subsequent, valid run", async () => {
  const failedReport = await runAdvisorWithReport("accessibility", {});
  assert.equal(failedReport.success, false);

  const goodReport = await runAdvisorWithReport("accessibility", {
    sourceFiles: [file("a.html", "<p>Hello</p>")],
  });
  assert.equal(goodReport.success, true);
});

test("integration: running all five advisors against the same real context in parallel demonstrates failure isolation and independent results", async () => {
  const sourceFiles = [
    file(
      "problematic.js",
      [
        "export function get_user() {}",
        "const apiKey = 'sk_live_abcdef1234567890';",
        "for (const x of a) { for (const y of b) { doThing(); } }",
        "<img src=\"a.jpg\">",
      ].join("\n")
    ),
  ];

  const [architectureReport, codeReviewReport, securityReport, performanceReport, accessibilityReport] = await Promise.all([
    runAdvisorWithReport("architecture", { sourceFiles }),
    runAdvisorWithReport("code-review", { sourceFiles }),
    runAdvisorWithReport("security", { sourceFiles }),
    runAdvisorWithReport("performance", { sourceFiles }),
    runAdvisorWithReport("accessibility", { sourceFiles }),
  ]);

  assert.equal(architectureReport.success, true);
  assert.equal(codeReviewReport.success, true);
  assert.equal(securityReport.success, true);
  assert.equal(performanceReport.success, true);
  assert.equal(accessibilityReport.success, true);
  assert.ok(accessibilityReport.findings.some((f) => f.id === "missing-alt-attribute"));
});

test("integration: real markup from this project's own boilerplates analyzes successfully", async () => {
  const projectRoot = path.join(process.cwd(), "..");
  const realPaths = [
    "elementor-widget-boilerplate/widgets/class-custom-widget.php",
    "gutenberg-block-boilerplate/src/save.js",
    "gutenberg-block-boilerplate/src/edit.js",
    "theme-boilerplate/parts/header.html",
    "theme-boilerplate/parts/footer.html",
    "theme-boilerplate/templates/index.html",
    "theme-boilerplate/templates/single.html",
    "theme-boilerplate/templates/page.html",
  ];

  const sourceFiles = [];
  for (const relPath of realPaths) {
    const abs = path.join(projectRoot, relPath);
    sourceFiles.push({ path: relPath, content: await fs.readFile(abs, "utf8") });
  }

  const report = await runAdvisorWithReport("accessibility", { sourceFiles });

  assert.equal(report.success, true);
  assert.ok(report.findings.some((f) => f.id === "accessibility-scan-summary"));
  // This real content is genuinely clean (verified by manual smoke testing
  // against a deliberately problematic synthetic fixture first, to confirm
  // the detectors actually fire and this isn't a false negative from
  // broken regexes) -- zero critical/warning findings is the correct,
  // honest result here.
  assert.equal(report.summary.critical, 0);
  assert.equal(report.summary.warning, 0);
});
