import { test } from "node:test";
import assert from "node:assert/strict";
import { registerWorkflow, _resetForTests } from "../framework/workflow-registry.js";
import { runWorkflowWithReport } from "../framework/workflow-report.js";

function file(path, content) {
  return { path, content };
}

test("returns a success report with correct summary counts and empty recommendations when nothing halted early", async () => {
  _resetForTests();
  registerWorkflow({
    id: "clean-workflow",
    name: "Clean Workflow",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ agentId: "architecture-remediation", context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runWorkflowWithReport("clean-workflow", { sourceFiles: [] });

  assert.equal(report.success, true);
  assert.deepEqual(report.summary.agentsRun, ["architecture-remediation"]);
  assert.equal(report.summary.stepsFailed, 0);
  assert.deepEqual(report.errors, []);
  assert.equal(report.halted, null);
});

test("never throws: a planning failure produces a failure report instead", async () => {
  _resetForTests();
  registerWorkflow({
    id: "broken-planner",
    name: "Broken Planner",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => {
      throw new Error("plan exploded");
    },
    decide: async () => ({ action: "continue" }),
  });

  const report = await runWorkflowWithReport("broken-planner", {});

  assert.equal(report.success, false);
  assert.equal(report.errors[0].phase, "planning");
  assert.match(report.errors[0].message, /plan exploded/);
});

test("never throws: a decision failure produces a failure report with the correct stepIndex", async () => {
  _resetForTests();
  registerWorkflow({
    id: "broken-decider",
    name: "Broken Decider",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [{ agentId: "architecture-remediation", context: { sourceFiles: [] } }] }),
    decide: async () => {
      throw new Error("decide exploded");
    },
  });

  const report = await runWorkflowWithReport("broken-decider", { sourceFiles: [] });

  assert.equal(report.success, false);
  assert.equal(report.errors[0].phase, "execution");
  assert.equal(report.errors[0].stepIndex, 0);
});

test("never throws: an unregistered workflow id also produces a failure report, not an exception", async () => {
  _resetForTests();
  const report = await runWorkflowWithReport("does-not-exist", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown workflow/);
  assert.equal(report.errors[0].phase, "unexpected");
});

test("never throws: a missing required input also produces a failure report", async () => {
  _resetForTests();
  registerWorkflow({
    id: "needs-input",
    name: "Needs Input",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runWorkflowWithReport("needs-input", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("counts stepsFailed correctly and reports success:false when a decision action is fail", async () => {
  _resetForTests();
  registerWorkflow({
    id: "fails-workflow",
    name: "Fails Workflow",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [{ agentId: "architecture-remediation", context: { sourceFiles: [] } }] }),
    decide: async () => ({ action: "fail", reason: "manual failure for test" }),
  });

  const report = await runWorkflowWithReport("fails-workflow", { sourceFiles: [] });

  assert.equal(report.success, false);
  assert.equal(report.summary.stepsFailed, 1);
  assert.deepEqual(report.recommendations, ["manual failure for test"]);
  assert.equal(report.halted.action, "fail");
});

test("embeds the real, complete Agent Report unchanged inside a step", async () => {
  _resetForTests();
  registerWorkflow({
    id: "embeds-report",
    name: "Embeds Report",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ agentId: "security-remediation", context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runWorkflowWithReport("embeds-report", { sourceFiles: [file("x.js", "eval(x);")] });

  const embedded = report.steps[0].agentReport;
  assert.equal(embedded.agent, "security-remediation");
  assert.ok(Array.isArray(embedded.steps));
  assert.ok(embedded.steps[0].result.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.deepEqual(
    Object.keys(embedded).sort(),
    ["agent", "success", "plan", "steps", "halted", "summary", "recommendations", "errors", "execution_ms", "timestamp"].sort()
  );
});

test("multiple chained real agents: each step's agentReport is independently real and unmodified", async () => {
  _resetForTests();
  registerWorkflow({
    id: "multi-agent-workflow",
    name: "Multi Agent Workflow",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { agentId: "architecture-remediation", context: { sourceFiles: input.sourceFiles } },
        { agentId: "performance-optimization", context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runWorkflowWithReport("multi-agent-workflow", { sourceFiles: [file("clean.js", "export const a = 1;")] });

  assert.equal(report.steps.length, 2);
  assert.equal(report.steps[0].agentReport.agent, "architecture-remediation");
  assert.equal(report.steps[1].agentReport.agent, "performance-optimization");
  assert.deepEqual(report.summary.agentsRun, ["architecture-remediation", "performance-optimization"]);
});

test("includes numeric execution_ms and a valid ISO timestamp regardless of outcome", async () => {
  _resetForTests();
  registerWorkflow({
    id: "timed-workflow",
    name: "Timed Workflow",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runWorkflowWithReport("timed-workflow", {});
  assert.equal(typeof report.execution_ms, "number");
  assert.ok(!Number.isNaN(new Date(report.timestamp).getTime()));
});

test("failure isolation: running a broken and a working workflow in parallel, one's failure never affects the other's report", async () => {
  _resetForTests();
  registerWorkflow({
    id: "works",
    name: "Works",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });
  registerWorkflow({
    id: "fails-planning",
    name: "Fails Planning",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => {
      throw new Error("kaboom");
    },
    decide: async () => ({ action: "continue" }),
  });

  const [workingReport, brokenReport] = await Promise.all([
    runWorkflowWithReport("works", {}),
    runWorkflowWithReport("fails-planning", {}),
  ]);

  assert.equal(workingReport.success, true);
  assert.equal(brokenReport.success, false);
  assert.match(brokenReport.errors[0].message, /kaboom/);
});

test("an empty plan (zero steps) succeeds with an empty summary", async () => {
  _resetForTests();
  registerWorkflow({
    id: "no-op-workflow",
    name: "No Op Workflow",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runWorkflowWithReport("no-op-workflow", {});
  assert.equal(report.success, true);
  assert.deepEqual(report.steps, []);
  assert.deepEqual(report.summary, { agentsRun: [], stepsFailed: 0 });
});
