import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAgent, _resetForTests } from "../framework/agent-registry.js";
import { runAgentWithReport } from "../framework/agent-report.js";

function file(path, content) {
  return { path, content };
}

test("returns a success report with correct summary counts and recommendations empty when nothing halted", async () => {
  _resetForTests();
  registerAgent({
    id: "clean-agent",
    name: "Clean Agent",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ type: "advisors", ids: ["architecture"], context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runAgentWithReport("clean-agent", { sourceFiles: [] });

  assert.equal(report.success, true);
  assert.deepEqual(report.summary.advisorsRun, ["architecture"]);
  assert.equal(report.summary.stepsFailed, 0);
  assert.deepEqual(report.recommendations, []);
  assert.deepEqual(report.errors, []);
  assert.equal(report.halted, null);
});

test("never throws: a planning failure produces a failure report instead", async () => {
  _resetForTests();
  registerAgent({
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

  const report = await runAgentWithReport("broken-planner", {});

  assert.equal(report.success, false);
  assert.equal(report.errors[0].phase, "planning");
  assert.match(report.errors[0].message, /plan exploded/);
});

test("never throws: a decision failure produces a failure report with the correct stepIndex", async () => {
  _resetForTests();
  registerAgent({
    id: "broken-decider",
    name: "Broken Decider",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [{ type: "advisors", ids: ["architecture"], context: { sourceFiles: [] } }] }),
    decide: async () => {
      throw new Error("decide exploded");
    },
  });

  const report = await runAgentWithReport("broken-decider", { sourceFiles: [] });

  assert.equal(report.success, false);
  assert.equal(report.errors[0].phase, "execution");
  assert.equal(report.errors[0].stepIndex, 0);
});

test("never throws: an unregistered agent id also produces a failure report, not an exception", async () => {
  _resetForTests();
  const report = await runAgentWithReport("does-not-exist", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown agent/);
  assert.equal(report.errors[0].phase, "unexpected");
});

test("never throws: a missing required input also produces a failure report", async () => {
  _resetForTests();
  registerAgent({
    id: "needs-input",
    name: "Needs Input",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runAgentWithReport("needs-input", {});
  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /requires input "sourceFiles"/);
});

test("counts stepsFailed correctly and reports success:false when a decision action is fail", async () => {
  _resetForTests();
  registerAgent({
    id: "fails-agent",
    name: "Fails Agent",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [{ type: "advisors", ids: ["architecture"], context: { sourceFiles: [] } }] }),
    decide: async () => ({ action: "fail", reason: "manual failure for test" }),
  });

  const report = await runAgentWithReport("fails-agent", { sourceFiles: [] });

  assert.equal(report.success, false);
  assert.equal(report.summary.stepsFailed, 1);
  assert.deepEqual(report.recommendations, ["manual failure for test"]);
  assert.equal(report.halted.action, "fail");
});

test("counts stepsSkipped correctly when a decision action is skip", async () => {
  _resetForTests();
  registerAgent({
    id: "skips-agent",
    name: "Skips Agent",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { type: "advisors", ids: ["architecture"], context: { sourceFiles: input.sourceFiles } },
        { type: "advisors", ids: ["security"], context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async (step) => (step.ids.includes("security") ? { action: "skip" } : { action: "continue" }),
  });

  const report = await runAgentWithReport("skips-agent", { sourceFiles: [] });

  assert.equal(report.success, true);
  assert.equal(report.summary.stepsSkipped, 1);
});

test("embeds the real Unified Advisor Report unchanged inside a step", async () => {
  _resetForTests();
  registerAgent({
    id: "embeds-report",
    name: "Embeds Report",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ type: "advisors", ids: ["security"], context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runAgentWithReport("embeds-report", { sourceFiles: [file("x.js", "eval(x);")] });

  const embedded = report.steps[0].result;
  assert.equal(embedded.advisorCount, 1);
  assert.ok(Array.isArray(embedded.advisorReports));
  assert.ok(embedded.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.deepEqual(
    Object.keys(embedded).sort(),
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

test("generatorsRun is populated correctly for a generator step", async () => {
  _resetForTests();
  registerAgent({
    id: "generator-agent",
    name: "Generator Agent",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({
      steps: [
        {
          type: "generator",
          generatorId: "theme",
          config: { project_name: "Report Test Theme" },
          options: { outputDir: "/tmp/agent-report-test-theme", mode: "dry-run" },
        },
      ],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runAgentWithReport("generator-agent", {});

  assert.deepEqual(report.summary.generatorsRun, ["theme"]);
  assert.equal(report.steps[0].result.generator, "theme");
});

test("includes numeric execution_ms and a valid ISO timestamp regardless of outcome", async () => {
  _resetForTests();
  registerAgent({
    id: "timed-agent",
    name: "Timed Agent",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runAgentWithReport("timed-agent", {});
  assert.equal(typeof report.execution_ms, "number");
  assert.ok(!Number.isNaN(new Date(report.timestamp).getTime()));
});

test("failure isolation: running a broken and a working agent in parallel, one's failure never affects the other's report", async () => {
  _resetForTests();
  registerAgent({
    id: "works",
    name: "Works",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });
  registerAgent({
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
    runAgentWithReport("works", {}),
    runAgentWithReport("fails-planning", {}),
  ]);

  assert.equal(workingReport.success, true);
  assert.equal(brokenReport.success, false);
  assert.match(brokenReport.errors[0].message, /kaboom/);
});

test("an empty plan (zero steps) succeeds with an empty summary", async () => {
  _resetForTests();
  registerAgent({
    id: "no-op-agent",
    name: "No Op Agent",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  const report = await runAgentWithReport("no-op-agent", {});
  assert.equal(report.success, true);
  assert.deepEqual(report.steps, []);
  assert.deepEqual(report.summary, { advisorsRun: [], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 });
});
