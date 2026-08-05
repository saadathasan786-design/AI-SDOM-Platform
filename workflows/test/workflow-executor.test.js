import { test } from "node:test";
import assert from "node:assert/strict";
import { registerWorkflow, _resetForTests } from "../framework/workflow-registry.js";
import { runWorkflow } from "../framework/workflow-executor.js";

function file(path, content) {
  return { path, content };
}

test("resolves the workflow from the registry and assembles only declared inputRequirements", async () => {
  _resetForTests();
  let capturedInput;
  registerWorkflow({
    id: "picky",
    name: "Picky",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => {
      capturedInput = input;
      return { steps: [] };
    },
    decide: async () => ({ action: "continue" }),
  });

  await runWorkflow("picky", { sourceFiles: [], extraJunk: 123 });

  assert.deepEqual(Object.keys(capturedInput), ["sourceFiles"]);
});

test("throws a clear error for an unregistered workflow id", async () => {
  _resetForTests();
  await assert.rejects(() => runWorkflow("does-not-exist", {}), /Unknown workflow: "does-not-exist"/);
});

test("throws a clear error when a required input is missing from the context", async () => {
  _resetForTests();
  registerWorkflow({
    id: "needs-kg",
    name: "Needs KG",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["knowledgeGraph"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  await assert.rejects(() => runWorkflow("needs-kg", {}), /requires input "knowledgeGraph"/);
});

test("throws a phase-tagged planning error when plan() itself throws", async () => {
  _resetForTests();
  registerWorkflow({
    id: "broken-plan",
    name: "Broken Plan",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => {
      throw new Error("plan failure");
    },
    decide: async () => ({ action: "continue" }),
  });

  await assert.rejects(
    () => runWorkflow("broken-plan", {}),
    (err) => {
      assert.equal(err.phase, "planning");
      assert.match(err.message, /plan failure/);
      return true;
    }
  );
});

test("throws a phase-tagged planning error when plan() returns something without a steps array", async () => {
  _resetForTests();
  registerWorkflow({
    id: "malformed-plan",
    name: "Malformed Plan",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ notSteps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  await assert.rejects(
    () => runWorkflow("malformed-plan", {}),
    (err) => {
      assert.equal(err.phase, "planning");
      return true;
    }
  );
});

test("executes a real agent step via the actual runAgentWithReport(), embedding the real Agent Report unchanged", async () => {
  _resetForTests();
  registerWorkflow({
    id: "agent-runner",
    name: "Agent Runner",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ agentId: "security-remediation", context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const { steps } = await runWorkflow("agent-runner", { sourceFiles: [file("x.js", "eval(x);")] });

  assert.equal(steps.length, 1);
  assert.equal(steps[0].agentReport.agent, "security-remediation");
  assert.equal(steps[0].agentReport.success, true);
  assert.ok(steps[0].agentReport.steps[0].result.findings.some((f) => f.id === "dangerous-eval-usage"));
});

test("unregistered agent id in a step surfaces via runAgentWithReport's own never-throws contract, not a thrown executor error", async () => {
  _resetForTests();
  registerWorkflow({
    id: "unknown-agent-workflow",
    name: "Unknown Agent Workflow",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [{ agentId: "not-a-real-agent", context: {} }] }),
    decide: async (step, agentReport) => (agentReport.success ? { action: "continue" } : { action: "fail", reason: "agent failed" }),
  });

  const { steps, halted } = await runWorkflow("unknown-agent-workflow", {});
  assert.equal(steps[0].agentReport.success, false);
  assert.match(steps[0].agentReport.errors[0].message, /Unknown agent/);
  assert.equal(halted.action, "fail");
});

test("throws an execution error when decide() itself throws", async () => {
  _resetForTests();
  registerWorkflow({
    id: "broken-decide",
    name: "Broken Decide",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [{ agentId: "architecture-remediation", context: { sourceFiles: [] } }] }),
    decide: async () => {
      throw new Error("decide failure");
    },
  });

  await assert.rejects(
    () => runWorkflow("broken-decide", {}),
    (err) => {
      assert.equal(err.phase, "execution");
      assert.equal(err.stepIndex, 0);
      assert.match(err.message, /decide failure/);
      return true;
    }
  );
});

test("throws an execution error when decide() returns an invalid decision shape (e.g. 'skip', not part of this vocabulary)", async () => {
  _resetForTests();
  registerWorkflow({
    id: "invalid-decision",
    name: "Invalid Decision",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [{ agentId: "architecture-remediation", context: { sourceFiles: [] } }] }),
    decide: async () => ({ action: "skip" }),
  });

  await assert.rejects(() => runWorkflow("invalid-decision", {}), /invalid action/);
});

test("halts execution when decide() returns action:'stop', later steps never run", async () => {
  _resetForTests();
  let secondStepRan = false;
  registerWorkflow({
    id: "stops-early",
    name: "Stops Early",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { agentId: "architecture-remediation", context: { sourceFiles: input.sourceFiles } },
        { agentId: "security-remediation", context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async (step) => {
      if (step.agentId === "security-remediation") secondStepRan = true;
      return { action: "stop", reason: "test halt" };
    },
  });

  const { steps, halted } = await runWorkflow("stops-early", { sourceFiles: [] });

  assert.equal(steps.length, 1);
  assert.equal(secondStepRan, false);
  assert.equal(halted.action, "stop");
});

test("halts execution when decide() returns action:'fail'", async () => {
  _resetForTests();
  registerWorkflow({
    id: "fails-early",
    name: "Fails Early",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ agentId: "architecture-remediation", context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "fail", reason: "something is wrong" }),
  });

  const { halted } = await runWorkflow("fails-early", { sourceFiles: [] });
  assert.equal(halted.action, "fail");
});

test("continues through multiple steps when decide() returns action:'continue' each time", async () => {
  _resetForTests();
  registerWorkflow({
    id: "runs-both",
    name: "Runs Both",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { agentId: "architecture-remediation", context: { sourceFiles: input.sourceFiles } },
        { agentId: "security-remediation", context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const { steps, halted } = await runWorkflow("runs-both", { sourceFiles: [] });
  assert.equal(steps.length, 2);
  assert.equal(halted, null);
});

test("passes priorResults correctly to decide() on later steps", async () => {
  _resetForTests();
  const seenPriorResultsLengths = [];
  registerWorkflow({
    id: "tracks-prior",
    name: "Tracks Prior",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { agentId: "architecture-remediation", context: { sourceFiles: input.sourceFiles } },
        { agentId: "security-remediation", context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async (step, agentReport, priorResults) => {
      seenPriorResultsLengths.push(priorResults.length);
      return { action: "continue" };
    },
  });

  await runWorkflow("tracks-prior", { sourceFiles: [] });
  assert.deepEqual(seenPriorResultsLengths, [0, 1]);
});

test("real delegation: chains two different real agents (Architecture + Performance Optimization) in one workflow", async () => {
  _resetForTests();
  registerWorkflow({
    id: "chained-real-agents",
    name: "Chained Real Agents",
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

  const { steps } = await runWorkflow("chained-real-agents", {
    sourceFiles: [file("x.js", "export const a = 1;")],
  });

  assert.equal(steps.length, 2);
  assert.equal(steps[0].agentReport.agent, "architecture-remediation");
  assert.equal(steps[1].agentReport.agent, "performance-optimization");
});
