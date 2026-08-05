import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAgentReportHtml, buildCatalogHtml, buildCompatibilityHtml } from "../src/report-viewer.js";

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

test("buildAgentReportHtml includes agent name, status, execution time, and summary", () => {
  const report = {
    agent: "architecture-remediation",
    success: true,
    execution_ms: 12,
    summary: { advisorsRun: ["architecture"], generatorsRun: ["theme"], stepsSkipped: 0, stepsFailed: 0 },
    steps: [],
    errors: [],
    recommendations: [],
  };
  const html = buildAgentReportHtml(report);
  assert.match(html, /Agent: architecture-remediation/);
  assert.match(html, /SUCCESS/);
  assert.match(html, /12ms/);
  assert.match(html, /advisorsRun=\[architecture\]/);
  assert.match(html, /generatorsRun=\[theme\]/);
});

test("buildAgentReportHtml renders an advisors step with its embedded findings, decision, and location", () => {
  const report = {
    agent: "x",
    success: true,
    execution_ms: 1,
    summary: { advisorsRun: ["security"], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 },
    steps: [
      {
        type: "advisors",
        ids: ["security"],
        result: { success: true, execution_ms: 5, findings: [finding({ id: "dangerous-eval-usage", message: "eval() found" })] },
        decision: { action: "continue", reason: "actionable findings found" },
      },
    ],
    errors: [],
    recommendations: [],
  };
  const html = buildAgentReportHtml(report);
  assert.match(html, /Step: Advisor \(security\)/);
  assert.match(html, /dangerous-eval-usage/);
  assert.match(html, /eval\(\) found/);
  assert.match(html, /x\.js:1/);
  assert.match(html, /Do something about it\./);
  assert.match(html, /Decision:<\/strong> continue: actionable findings found/);
});

test("buildAgentReportHtml renders a generator step with its mode and result", () => {
  const report = {
    agent: "x",
    success: true,
    execution_ms: 10,
    summary: { advisorsRun: [], generatorsRun: ["theme"], stepsSkipped: 0, stepsFailed: 0 },
    steps: [
      {
        type: "generator",
        generatorId: "theme",
        options: { mode: "dry-run" },
        result: { success: true, mode: "dry-run", execution_ms: 8 },
        decision: { action: "stop", reason: "completed successfully" },
      },
    ],
    errors: [],
    recommendations: [],
  };
  const html = buildAgentReportHtml(report);
  assert.match(html, /Step: Generator "theme" \(mode: dry-run\)/);
  assert.match(html, /SUCCESS/);
  assert.match(html, /Decision:<\/strong> stop: completed successfully/);
});

test("buildAgentReportHtml renders errors when present", () => {
  const report = {
    agent: "x",
    success: false,
    execution_ms: 0,
    summary: { advisorsRun: [], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 },
    steps: [],
    errors: [{ phase: "planning", message: "plan exploded", stepIndex: null }],
    recommendations: [],
  };
  const html = buildAgentReportHtml(report);
  assert.match(html, /Errors/);
  assert.match(html, /\[planning\]/);
  assert.match(html, /plan exploded/);
});

test("buildAgentReportHtml renders recommendations when present", () => {
  const report = {
    agent: "x",
    success: true,
    execution_ms: 0,
    summary: { advisorsRun: [], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 },
    steps: [],
    errors: [],
    recommendations: ["Nothing to remediate."],
  };
  const html = buildAgentReportHtml(report);
  assert.match(html, /Recommendations/);
  assert.match(html, /Nothing to remediate\./);
});

test("buildAgentReportHtml includes a severity filter checkbox for every level", () => {
  const report = {
    agent: "x",
    success: true,
    execution_ms: 0,
    summary: { advisorsRun: [], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 },
    steps: [],
    errors: [],
    recommendations: [],
  };
  const html = buildAgentReportHtml(report);
  for (const level of ["info", "suggestion", "warning", "critical"]) {
    assert.match(html, new RegExp(`value="${level}"`));
  }
});

test("buildAgentReportHtml escapes HTML in finding messages, decisions, and errors (XSS prevention)", () => {
  const report = {
    agent: "x",
    success: false,
    execution_ms: 0,
    summary: { advisorsRun: [], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 },
    steps: [
      {
        type: "advisors",
        ids: ["x"],
        result: { success: true, findings: [finding({ message: '<script>alert("finding-xss")</script>' })] },
        decision: { action: "continue", reason: '<img src=x onerror="alert(1)">' },
      },
    ],
    errors: [{ phase: "execution", message: '<script>alert("error-xss")</script>', stepIndex: 0 }],
    recommendations: ['<script>alert("rec-xss")</script>'],
  };
  const html = buildAgentReportHtml(report);
  assert.ok(!html.includes('<script>alert("finding-xss")</script>'));
  assert.ok(!html.includes('<script>alert("error-xss")</script>'));
  assert.ok(!html.includes('<script>alert("rec-xss")</script>'));
  assert.ok(!html.includes('<img src=x onerror="alert(1)">'));
  assert.match(html, /&lt;script&gt;/);
});

test("buildCatalogHtml renders every agent's full metadata directly from the given catalog", () => {
  const catalog = [
    {
      id: "architecture-remediation",
      name: "Architecture Remediation Agent",
      category: "remediation",
      description: "Runs the Architecture Advisor.",
      inputRequirements: ["sourceFiles"],
      capabilities: ["invokes-generators"],
      requiresAdvisors: ["architecture"],
      requiresGenerators: ["theme"],
    },
  ];
  const html = buildCatalogHtml(catalog);
  assert.match(html, /Registered Agents \(1\)/);
  assert.match(html, /architecture-remediation/);
  assert.match(html, /Architecture Remediation Agent/);
  assert.match(html, /sourceFiles/);
  assert.match(html, /invokes-generators/);
  assert.match(html, /architecture/);
  assert.match(html, /theme/);
});

test("buildCatalogHtml handles an empty catalog gracefully", () => {
  const html = buildCatalogHtml([]);
  assert.match(html, /Registered Agents \(0\)/);
});

test("buildCatalogHtml escapes HTML in agent metadata (XSS prevention)", () => {
  const catalog = [
    {
      id: "x",
      name: '<script>alert("catalog-xss")</script>',
      category: "x",
      description: "d",
      inputRequirements: [],
      capabilities: [],
      requiresAdvisors: [],
      requiresGenerators: [],
    },
  ];
  const html = buildCatalogHtml(catalog);
  assert.ok(!html.includes('<script>alert("catalog-xss")</script>'));
  assert.match(html, /&lt;script&gt;/);
});

test("buildCompatibilityHtml shows compatible status and missing dependencies", () => {
  const result = { agent: "x", compatible: false, missingAdvisors: ["security"], missingGenerators: [], error: null };
  const html = buildCompatibilityHtml(result);
  assert.match(html, /Compatible:<\/strong> false/);
  assert.match(html, /security/);
});

test("buildCompatibilityHtml shows the error for an unknown agent", () => {
  const result = { agent: "x", compatible: false, missingAdvisors: [], missingGenerators: [], error: 'Unknown agent: "x".' };
  const html = buildCompatibilityHtml(result);
  assert.match(html, /Unknown agent/);
});

test("buildCompatibilityHtml escapes HTML in the error field (XSS prevention)", () => {
  const result = {
    agent: "x",
    compatible: false,
    missingAdvisors: [],
    missingGenerators: [],
    error: '<script>alert("compat-xss")</script>',
  };
  const html = buildCompatibilityHtml(result);
  assert.ok(!html.includes('<script>alert("compat-xss")</script>'));
  assert.match(html, /&lt;script&gt;/);
});
