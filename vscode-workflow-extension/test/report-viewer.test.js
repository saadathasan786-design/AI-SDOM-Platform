import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWorkflowReportHtml, buildCatalogHtml, buildCompatibilityHtml } from "../src/report-viewer.js";

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

test("buildWorkflowReportHtml includes workflow name, status, execution time, and summary", () => {
  const report = {
    workflow: "project-health-check",
    success: true,
    execution_ms: 12,
    summary: { agentsRun: ["architecture-remediation"], stepsFailed: 0 },
    steps: [],
    errors: [],
    recommendations: [],
  };
  const html = buildWorkflowReportHtml(report);
  assert.match(html, /Workflow: project-health-check/);
  assert.match(html, /SUCCESS/);
  assert.match(html, /12ms/);
  assert.match(html, /agentsRun=\[architecture-remediation\]/);
});

test("buildWorkflowReportHtml renders a workflow step with its embedded Agent Report, nested advisor step, findings, and decision", () => {
  const report = {
    workflow: "x",
    success: true,
    execution_ms: 1,
    summary: { agentsRun: ["security-remediation"], stepsFailed: 0 },
    steps: [
      {
        agentId: "security-remediation",
        agentReport: {
          success: true,
          execution_ms: 5,
          steps: [
            {
              type: "advisors",
              ids: ["security"],
              result: { success: true, findings: [finding({ id: "dangerous-eval-usage", message: "eval() found" })] },
            },
          ],
        },
        decision: { action: "continue", reason: "escalating" },
      },
    ],
    errors: [],
    recommendations: [],
  };
  const html = buildWorkflowReportHtml(report);
  assert.match(html, /Agent: security-remediation -- SUCCESS/);
  assert.match(html, /Advisor:<\/strong> security -- SUCCESS/);
  assert.match(html, /dangerous-eval-usage/);
  assert.match(html, /eval\(\) found/);
  assert.match(html, /x\.js:1/);
  assert.match(html, /Do something about it\./);
  assert.match(html, /Decision:<\/strong> continue: escalating/);
});

test("buildWorkflowReportHtml renders a nested generator step's mode and result inside an agent step", () => {
  const report = {
    workflow: "x",
    success: true,
    execution_ms: 10,
    summary: { agentsRun: ["architecture-remediation"], stepsFailed: 0 },
    steps: [
      {
        agentId: "architecture-remediation",
        agentReport: {
          success: true,
          execution_ms: 8,
          steps: [{ type: "generator", generatorId: "theme", result: { success: true, mode: "dry-run" } }],
        },
        decision: { action: "stop", reason: "done" },
      },
    ],
    errors: [],
    recommendations: [],
  };
  const html = buildWorkflowReportHtml(report);
  assert.match(html, /Generator:<\/strong> "theme" \(mode: dry-run\) -- SUCCESS/);
});

test("buildWorkflowReportHtml renders a multi-advisor step (Agent name with multiple ids)", () => {
  const report = {
    workflow: "x",
    success: true,
    execution_ms: 1,
    summary: { agentsRun: ["security-remediation"], stepsFailed: 0 },
    steps: [
      {
        agentId: "security-remediation",
        agentReport: {
          success: true,
          steps: [{ type: "advisors", ids: ["security", "code-review"], result: { success: true, findings: [] } }],
        },
        decision: { action: "continue" },
      },
    ],
    errors: [],
    recommendations: [],
  };
  const html = buildWorkflowReportHtml(report);
  assert.match(html, /Advisors:<\/strong> security, code-review/);
});

test("buildWorkflowReportHtml renders errors when present", () => {
  const report = {
    workflow: "x",
    success: false,
    execution_ms: 0,
    summary: { agentsRun: [], stepsFailed: 0 },
    steps: [],
    errors: [{ phase: "planning", message: "plan exploded", stepIndex: null }],
    recommendations: [],
  };
  const html = buildWorkflowReportHtml(report);
  assert.match(html, /Errors/);
  assert.match(html, /\[planning\]/);
  assert.match(html, /plan exploded/);
});

test("buildWorkflowReportHtml renders recommendations when present", () => {
  const report = {
    workflow: "x",
    success: true,
    execution_ms: 0,
    summary: { agentsRun: [], stepsFailed: 0 },
    steps: [],
    errors: [],
    recommendations: ["Nothing to remediate."],
  };
  const html = buildWorkflowReportHtml(report);
  assert.match(html, /Recommendations/);
  assert.match(html, /Nothing to remediate\./);
});

test("buildWorkflowReportHtml includes a severity filter checkbox for every level", () => {
  const report = {
    workflow: "x",
    success: true,
    execution_ms: 0,
    summary: { agentsRun: [], stepsFailed: 0 },
    steps: [],
    errors: [],
    recommendations: [],
  };
  const html = buildWorkflowReportHtml(report);
  for (const level of ["info", "suggestion", "warning", "critical"]) {
    assert.match(html, new RegExp(`value="${level}"`));
  }
});

test("XSS prevention: buildWorkflowReportHtml escapes HTML in nested finding messages, decisions, errors, and recommendations", () => {
  const report = {
    workflow: "x",
    success: false,
    execution_ms: 0,
    summary: { agentsRun: [], stepsFailed: 0 },
    steps: [
      {
        agentId: "security-remediation",
        agentReport: {
          success: true,
          steps: [
            {
              type: "advisors",
              ids: ["security"],
              result: { success: true, findings: [finding({ message: '<script>alert("finding-xss")</script>' })] },
            },
          ],
        },
        decision: { action: "continue", reason: '<img src=x onerror="alert(1)">' },
      },
    ],
    errors: [{ phase: "execution", message: '<script>alert("error-xss")</script>', stepIndex: 0 }],
    recommendations: ['<script>alert("rec-xss")</script>'],
  };
  const html = buildWorkflowReportHtml(report);
  assert.ok(!html.includes('<script>alert("finding-xss")</script>'));
  assert.ok(!html.includes('<script>alert("error-xss")</script>'));
  assert.ok(!html.includes('<script>alert("rec-xss")</script>'));
  assert.ok(!html.includes('<img src=x onerror="alert(1)">'));
  assert.match(html, /&lt;script&gt;/);
});

test("XSS prevention: buildWorkflowReportHtml escapes HTML in an embedded Generator step's error message", () => {
  const report = {
    workflow: "x",
    success: false,
    execution_ms: 0,
    summary: { agentsRun: [], stepsFailed: 1 },
    steps: [
      {
        agentId: "architecture-remediation",
        agentReport: {
          success: false,
          steps: [
            { type: "generator", generatorId: "theme", result: { success: false, error: '<script>alert("gen-error-xss")</script>' } },
          ],
        },
        decision: { action: "fail" },
      },
    ],
    errors: [],
    recommendations: [],
  };
  const html = buildWorkflowReportHtml(report);
  assert.ok(!html.includes('<script>alert("gen-error-xss")</script>'));
  assert.match(html, /&lt;script&gt;/);
});

test("XSS prevention: buildCatalogHtml escapes HTML in workflow metadata (id, name, description, requiredAgents)", () => {
  const catalog = [
    {
      id: '<script>alert("id-xss")</script>',
      name: '<script>alert("name-xss")</script>',
      category: "x",
      description: '<script>alert("desc-xss")</script>',
      inputRequirements: [],
      capabilities: [],
      requiredAgents: ['<script>alert("agent-xss")</script>'],
    },
  ];
  const html = buildCatalogHtml(catalog);
  assert.ok(!html.includes('<script>alert("id-xss")</script>'));
  assert.ok(!html.includes('<script>alert("name-xss")</script>'));
  assert.ok(!html.includes('<script>alert("desc-xss")</script>'));
  assert.ok(!html.includes('<script>alert("agent-xss")</script>'));
  assert.match(html, /&lt;script&gt;/);
});

test("buildCatalogHtml renders every workflow's full metadata directly from the given catalog", () => {
  const catalog = [
    {
      id: "project-health-check",
      name: "Project Health Check Workflow",
      category: "health-check",
      description: "Runs three agents.",
      inputRequirements: ["sourceFiles"],
      capabilities: ["chains-agents"],
      requiredAgents: ["architecture-remediation", "security-remediation", "performance-optimization"],
    },
  ];
  const html = buildCatalogHtml(catalog);
  assert.match(html, /Registered Workflows \(1\)/);
  assert.match(html, /project-health-check/);
  assert.match(html, /Project Health Check Workflow/);
  assert.match(html, /sourceFiles/);
  assert.match(html, /chains-agents/);
  assert.match(html, /architecture-remediation/);
});

test("buildCatalogHtml handles an empty catalog gracefully", () => {
  const html = buildCatalogHtml([]);
  assert.match(html, /Registered Workflows \(0\)/);
});

test("buildCompatibilityHtml shows compatible status and missing agents", () => {
  const result = { workflow: "x", compatible: false, missingAgents: ["security-remediation"], error: null };
  const html = buildCompatibilityHtml(result);
  assert.match(html, /Compatible:<\/strong> false/);
  assert.match(html, /security-remediation/);
});

test("buildCompatibilityHtml shows the error for an unknown workflow", () => {
  const result = { workflow: "x", compatible: false, missingAgents: [], error: 'Unknown workflow: "x".' };
  const html = buildCompatibilityHtml(result);
  assert.match(html, /Unknown workflow/);
});

test("XSS prevention: buildCompatibilityHtml escapes HTML in the error field and missing agents", () => {
  const result = {
    workflow: "x",
    compatible: false,
    missingAgents: ['<script>alert("missing-agent-xss")</script>'],
    error: null,
  };
  const html = buildCompatibilityHtml(result);
  assert.ok(!html.includes('<script>alert("missing-agent-xss")</script>'));
  assert.match(html, /&lt;script&gt;/);

  const errorResult = { workflow: "x", compatible: false, missingAgents: [], error: '<script>alert("compat-error-xss")</script>' };
  const errorHtml = buildCompatibilityHtml(errorResult);
  assert.ok(!errorHtml.includes('<script>alert("compat-error-xss")</script>'));
  assert.match(errorHtml, /&lt;script&gt;/);
});
