import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSingleReportHtml, buildUnifiedReportHtml, buildCatalogHtml } from "../src/report-viewer.js";

function finding(overrides = {}) {
  return {
    id: "test-finding",
    severity: "warning",
    category: "test",
    message: "A test finding.",
    recommendation: { message: "Do something about it." },
    evidence: { path: "x.js", line: 1 },
    location: { file: "x.js", line: 1 },
    ...overrides,
  };
}

test("buildSingleReportHtml includes advisor name, status, execution time, and summary", () => {
  const report = {
    advisor: "security",
    success: true,
    error: null,
    execution_ms: 5,
    summary: { info: 1, suggestion: 0, warning: 1, critical: 0 },
    findings: [finding()],
  };
  const html = buildSingleReportHtml(report);
  assert.match(html, /Advisor: security/);
  assert.match(html, /SUCCESS/);
  assert.match(html, /5ms/);
  assert.match(html, /info=1 suggestion=0 warning=1 critical=0/);
});

test("buildSingleReportHtml renders each finding's severity, id, message, location, recommendation, and evidence", () => {
  const report = {
    advisor: "security",
    success: true,
    error: null,
    execution_ms: 1,
    summary: { info: 0, suggestion: 0, warning: 1, critical: 0 },
    findings: [finding({ id: "dangerous-eval-usage", message: "eval() found" })],
  };
  const html = buildSingleReportHtml(report);
  assert.match(html, /dangerous-eval-usage/);
  assert.match(html, /eval\(\) found/);
  assert.match(html, /x\.js:1/);
  assert.match(html, /Do something about it\./);
  assert.match(html, /&quot;path&quot;: &quot;x\.js&quot;/);
});

test("buildSingleReportHtml shows the error message when the report failed", () => {
  const report = {
    advisor: "not-real",
    success: false,
    error: 'Unknown advisor: "not-real".',
    execution_ms: 0,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 0 },
    findings: [],
  };
  const html = buildSingleReportHtml(report);
  assert.match(html, /FAILED/);
  assert.match(html, /Unknown advisor/);
});

test("buildSingleReportHtml includes a severity filter checkbox for every level", () => {
  const report = {
    advisor: "x",
    success: true,
    error: null,
    execution_ms: 0,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 0 },
    findings: [],
  };
  const html = buildSingleReportHtml(report);
  for (const level of ["info", "suggestion", "warning", "critical"]) {
    assert.match(html, new RegExp(`value="${level}"`));
  }
});

test("buildSingleReportHtml escapes HTML in messages to prevent injection", () => {
  const report = {
    advisor: "x",
    success: true,
    error: null,
    execution_ms: 0,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 0 },
    findings: [finding({ message: '<script>alert("xss")</script>' })],
  };
  const html = buildSingleReportHtml(report);
  assert.ok(!html.includes('<script>alert("xss")</script>'));
  assert.match(html, /&lt;script&gt;/);
});

test("buildUnifiedReportHtml groups findings by advisor and shows per-advisor status", () => {
  const report = {
    success: true,
    advisorsRun: ["architecture", "security"],
    advisorsFailed: [],
    execution_ms: 10,
    summary: { info: 1, suggestion: 0, warning: 1, critical: 0 },
    advisorReports: [
      { advisor: "architecture", success: true, execution_ms: 3, findings: [] },
      { advisor: "security", success: true, execution_ms: 7, findings: [finding()] },
    ],
  };
  const html = buildUnifiedReportHtml(report);
  assert.match(html, /Unified Advisor Report/);
  assert.match(html, /architecture.*SUCCESS/s);
  assert.match(html, /security.*SUCCESS/s);
  assert.match(html, /No findings\./);
  assert.match(html, /test-finding/);
});

test("buildUnifiedReportHtml lists failed advisors separately from successful ones", () => {
  const report = {
    success: false,
    advisorsRun: ["architecture"],
    advisorsFailed: ["not-real"],
    execution_ms: 5,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 0 },
    advisorReports: [
      { advisor: "architecture", success: true, execution_ms: 2, findings: [] },
      { advisor: "not-real", success: false, error: 'Unknown advisor: "not-real".', execution_ms: 0, findings: [] },
    ],
  };
  const html = buildUnifiedReportHtml(report);
  assert.match(html, /Failed:<\/strong> not-real/);
  assert.match(html, /not-real.*FAILED/s);
});

test("buildCatalogHtml renders every advisor's full metadata directly from the given catalog", () => {
  const catalog = [
    {
      id: "security",
      name: "Security Advisor",
      category: "security",
      description: "Static security analysis.",
      inputRequirements: ["sourceFiles"],
      supportedSeverities: ["info", "critical"],
    },
  ];
  const html = buildCatalogHtml(catalog);
  assert.match(html, /Registered Advisors \(1\)/);
  assert.match(html, /security/);
  assert.match(html, /Security Advisor/);
  assert.match(html, /Static security analysis\./);
  assert.match(html, /sourceFiles/);
  assert.match(html, /info, critical/);
});

test("buildCatalogHtml handles an empty catalog gracefully", () => {
  const html = buildCatalogHtml([]);
  assert.match(html, /Registered Advisors \(0\)/);
});
