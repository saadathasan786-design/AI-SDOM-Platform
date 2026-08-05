import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAgent, _resetForTests } from "../framework/agent-registry.js";
import { runAgent } from "../framework/agent-executor.js";

function file(path, content) {
  return { path, content };
}

test("resolves the agent from the registry and assembles only declared inputRequirements", async () => {
  _resetForTests();
  let capturedInput;
  registerAgent({
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

  await runAgent("picky", { sourceFiles: [], extraJunk: 123 });

  assert.deepEqual(Object.keys(capturedInput), ["sourceFiles"]);
});

test("throws a clear error for an unregistered agent id", async () => {
  _resetForTests();
  await assert.rejects(() => runAgent("does-not-exist", {}), /Unknown agent: "does-not-exist"/);
});

test("throws a clear error when a required input is missing from the context", async () => {
  _resetForTests();
  registerAgent({
    id: "needs-kg",
    name: "Needs KG",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["knowledgeGraph"],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  await assert.rejects(() => runAgent("needs-kg", {}), /requires input "knowledgeGraph"/);
});

test("throws a phase-tagged planning error when plan() itself throws", async () => {
  _resetForTests();
  registerAgent({
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
    () => runAgent("broken-plan", {}),
    (err) => {
      assert.equal(err.phase, "planning");
      assert.match(err.message, /plan failure/);
      return true;
    }
  );
});

test("throws a phase-tagged planning error when plan() returns something without a steps array", async () => {
  _resetForTests();
  registerAgent({
    id: "malformed-plan",
    name: "Malformed Plan",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ notSteps: [] }),
    decide: async () => ({ action: "continue" }),
  });

  await assert.rejects(
    () => runAgent("malformed-plan", {}),
    (err) => {
      assert.equal(err.phase, "planning");
      return true;
    }
  );
});

test("executes a real advisors step via the actual runAdvisors(), embedding the real Unified Advisor Report unchanged", async () => {
  _resetForTests();
  registerAgent({
    id: "advisor-runner",
    name: "Advisor Runner",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ type: "advisors", ids: ["security"], context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const { steps } = await runAgent("advisor-runner", { sourceFiles: [file("x.js", "eval(x);")] });

  assert.equal(steps.length, 1);
  assert.equal(steps[0].result.advisorsRun[0], "security");
  assert.ok(steps[0].result.findings.some((f) => f.id === "dangerous-eval-usage"));
});

test("executes a real single-advisor step via the actual runAdvisorWithReport()", async () => {
  _resetForTests();
  registerAgent({
    id: "single-advisor-runner",
    name: "Single Advisor Runner",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ type: "advisor", id: "architecture", context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const { steps } = await runAgent("single-advisor-runner", { sourceFiles: [file("x.js", "export const a = 1;")] });

  assert.equal(steps[0].result.advisor, "architecture");
  assert.equal(steps[0].result.success, true);
});

test("throws an execution error for an unknown plan step type", async () => {
  _resetForTests();
  registerAgent({
    id: "bad-step-type",
    name: "Bad Step Type",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({ steps: [{ type: "not-a-real-type" }] }),
    decide: async () => ({ action: "continue" }),
  });

  await assert.rejects(
    () => runAgent("bad-step-type", {}),
    (err) => {
      assert.equal(err.phase, "execution");
      assert.equal(err.stepIndex, 0);
      return true;
    }
  );
});

test("throws an execution error when decide() itself throws", async () => {
  _resetForTests();
  registerAgent({
    id: "broken-decide",
    name: "Broken Decide",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [{ type: "advisors", ids: ["architecture"], context: { sourceFiles: [] } }] }),
    decide: async () => {
      throw new Error("decide failure");
    },
  });

  await assert.rejects(
    () => runAgent("broken-decide", { sourceFiles: [] }),
    (err) => {
      assert.equal(err.phase, "execution");
      assert.equal(err.stepIndex, 0);
      assert.match(err.message, /decide failure/);
      return true;
    }
  );
});

test("throws an execution error when decide() returns an invalid decision shape", async () => {
  _resetForTests();
  registerAgent({
    id: "invalid-decision",
    name: "Invalid Decision",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async () => ({ steps: [{ type: "advisors", ids: ["architecture"], context: { sourceFiles: [] } }] }),
    decide: async () => ({ action: "do-something-invalid" }),
  });

  await assert.rejects(() => runAgent("invalid-decision", { sourceFiles: [] }), /invalid action/);
});

test("halts execution when decide() returns action:'stop', later steps never run", async () => {
  _resetForTests();
  let secondStepRan = false;
  registerAgent({
    id: "stops-early",
    name: "Stops Early",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { type: "advisors", ids: ["architecture"], context: { sourceFiles: input.sourceFiles } },
        { type: "advisors", ids: ["security"], context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async (step) => {
      if (step.ids.includes("security")) secondStepRan = true;
      return { action: "stop", reason: "test halt" };
    },
  });

  const { steps, halted } = await runAgent("stops-early", { sourceFiles: [] });

  assert.equal(steps.length, 1);
  assert.equal(secondStepRan, false);
  assert.equal(halted.action, "stop");
});

test("halts execution when decide() returns action:'fail'", async () => {
  _resetForTests();
  registerAgent({
    id: "fails-early",
    name: "Fails Early",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [{ type: "advisors", ids: ["architecture"], context: { sourceFiles: input.sourceFiles } }],
    }),
    decide: async () => ({ action: "fail", reason: "something is wrong" }),
  });

  const { halted } = await runAgent("fails-early", { sourceFiles: [] });
  assert.equal(halted.action, "fail");
});

test("continues through multiple steps when decide() returns action:'continue' each time", async () => {
  _resetForTests();
  registerAgent({
    id: "runs-both",
    name: "Runs Both",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { type: "advisors", ids: ["architecture"], context: { sourceFiles: input.sourceFiles } },
        { type: "advisors", ids: ["security"], context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const { steps, halted } = await runAgent("runs-both", { sourceFiles: [] });
  assert.equal(steps.length, 2);
  assert.equal(halted, null);
});

test("passes priorResults correctly to decide() on later steps", async () => {
  _resetForTests();
  const seenPriorResultsLengths = [];
  registerAgent({
    id: "tracks-prior",
    name: "Tracks Prior",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    plan: async (input) => ({
      steps: [
        { type: "advisors", ids: ["architecture"], context: { sourceFiles: input.sourceFiles } },
        { type: "advisors", ids: ["security"], context: { sourceFiles: input.sourceFiles } },
      ],
    }),
    decide: async (step, result, priorResults) => {
      seenPriorResultsLengths.push(priorResults.length);
      return { action: "continue" };
    },
  });

  await runAgent("tracks-prior", { sourceFiles: [] });
  assert.deepEqual(seenPriorResultsLengths, [0, 1]);
});

test("executes a real generator step via the actual runGeneratorWithReport(), in dry-run mode to avoid real writes", async () => {
  _resetForTests();
  registerAgent({
    id: "generator-runner",
    name: "Generator Runner",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    plan: async () => ({
      steps: [
        {
          type: "generator",
          generatorId: "theme",
          config: { project_name: "Agent Test Theme" },
          options: { outputDir: "/tmp/agent-executor-test-theme", mode: "dry-run" },
        },
      ],
    }),
    decide: async () => ({ action: "continue" }),
  });

  const { steps } = await runAgent("generator-runner", {});
  assert.equal(steps[0].result.generator, "theme");
  assert.equal(steps[0].result.mode, "dry-run");
});
