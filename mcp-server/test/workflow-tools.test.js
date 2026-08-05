import { test } from "node:test";
import assert from "node:assert/strict";
import {
  workflowTools,
  handleWorkflowList,
  handleWorkflowRun,
  handleWorkflowCheckCompatibility,
} from "../workflow-tools.js";
import { listWorkflowCatalog } from "../../workflows/index.js";

function file(path, content) {
  return { path, content };
}

test("workflowTools declares exactly the three required tools with correct names", () => {
  const names = workflowTools.map((t) => t.name);
  assert.deepEqual(names, ["workflow_list", "workflow_run", "workflow_checkCompatibility"]);
});

test("workflow_run declares id as required in its inputSchema", () => {
  const tool = workflowTools.find((t) => t.name === "workflow_run");
  assert.deepEqual(tool.inputSchema.required, ["id"]);
});

test("workflow_checkCompatibility declares id as required in its inputSchema", () => {
  const tool = workflowTools.find((t) => t.name === "workflow_checkCompatibility");
  assert.deepEqual(tool.inputSchema.required, ["id"]);
});

test("handleWorkflowList returns exactly what listWorkflowCatalog returns -- no duplication, no reshaping", async () => {
  const fromHandler = await handleWorkflowList();
  const fromCatalogDirectly = listWorkflowCatalog();
  assert.deepEqual(fromHandler, fromCatalogDirectly);
});

test("handleWorkflowList lists both real registered workflows with every required field", async () => {
  const result = await handleWorkflowList();
  const ids = result.map((w) => w.id);
  assert.ok(ids.includes("project-health-check"));
  assert.ok(ids.includes("security-audit"));
  for (const workflow of result) {
    assert.equal(typeof workflow.name, "string");
    assert.equal(typeof workflow.description, "string");
    assert.equal(typeof workflow.category, "string");
    assert.ok(Array.isArray(workflow.inputRequirements));
    assert.ok(Array.isArray(workflow.requiredAgents));
  }
});

test("handleWorkflowRun runs the real project-health-check workflow and returns its exact Workflow Report shape", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const result = await handleWorkflowRun({ id: "project-health-check", context: { sourceFiles } });

  assert.equal(result.workflow, "project-health-check");
  assert.equal(result.success, true);
  assert.equal(result.steps.length, 3);
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["architecture-remediation", "security-remediation", "performance-optimization"]
  );
  assert.equal(typeof result.execution_ms, "number");
  assert.equal(typeof result.timestamp, "string");
});

test("handleWorkflowRun runs the real security-audit workflow with a genuinely different agent order", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const result = await handleWorkflowRun({ id: "security-audit", context: { sourceFiles } });

  assert.equal(result.success, true);
  assert.deepEqual(
    result.steps.map((s) => s.agentId),
    ["security-remediation", "architecture-remediation", "performance-optimization"]
  );
});

test("handleWorkflowRun on real findings: embedded Agent Report and its own embedded Advisor Report remain completely unchanged", async () => {
  const sourceFiles = [file("x.js", "eval(x);")];
  const result = await handleWorkflowRun({ id: "security-audit", context: { sourceFiles } });

  const secAgentReport = result.steps[0].agentReport;
  assert.equal(secAgentReport.agent, "security-remediation");
  assert.deepEqual(
    Object.keys(secAgentReport).sort(),
    ["agent", "success", "plan", "steps", "halted", "summary", "recommendations", "errors", "execution_ms", "timestamp"].sort()
  );

  const embeddedAdvisorStep = secAgentReport.steps[0];
  assert.equal(embeddedAdvisorStep.type, "advisors");
  assert.ok(embeddedAdvisorStep.result.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.deepEqual(
    Object.keys(embeddedAdvisorStep.result).sort(),
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

test("handleWorkflowRun on an unknown workflow id returns success:false with a clear error, never throwing", async () => {
  const result = await handleWorkflowRun({ id: "not-a-real-workflow", context: {} });
  assert.equal(result.success, false);
  assert.match(result.errors[0].message, /Unknown workflow/);
});

test("handleWorkflowRun throws a clear error when id is missing (invalid request shape)", async () => {
  await assert.rejects(() => handleWorkflowRun({ context: {} }), /requires a non-empty string 'id'/);
});

test("handleWorkflowRun throws a clear error when id is not a string", async () => {
  await assert.rejects(() => handleWorkflowRun({ id: 42 }), /requires a non-empty string 'id'/);
});

test("handleWorkflowRun defaults context to an empty object when omitted, surfacing the framework's own missing-input error (execution failure path)", async () => {
  const result = await handleWorkflowRun({ id: "project-health-check" });
  assert.equal(result.success, false);
  assert.match(result.errors[0].message, /requires input "sourceFiles"/);
});

test("handleWorkflowCheckCompatibility returns compatible:true for the real, fully-satisfied workflows", async () => {
  const result1 = await handleWorkflowCheckCompatibility({ id: "project-health-check" });
  assert.equal(result1.compatible, true);
  assert.deepEqual(result1.missingAgents, []);
  assert.equal(result1.error, null);

  const result2 = await handleWorkflowCheckCompatibility({ id: "security-audit" });
  assert.equal(result2.compatible, true);
});

test("handleWorkflowCheckCompatibility returns compatible:false with a populated error for an unknown workflow id", async () => {
  const result = await handleWorkflowCheckCompatibility({ id: "not-a-real-workflow" });
  assert.equal(result.compatible, false);
  assert.match(result.error, /Unknown workflow/);
});

test("handleWorkflowCheckCompatibility throws a clear error when id is missing (invalid request shape)", async () => {
  await assert.rejects(() => handleWorkflowCheckCompatibility({}), /requires a non-empty string 'id'/);
});

test("handleWorkflowCheckCompatibility throws a clear error when id is not a string", async () => {
  await assert.rejects(() => handleWorkflowCheckCompatibility({ id: [] }), /requires a non-empty string 'id'/);
});
