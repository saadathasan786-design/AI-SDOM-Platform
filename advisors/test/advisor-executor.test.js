import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAdvisor, _resetForTests } from "../framework/advisor-registry.js";
import { runAdvisor } from "../framework/advisor-executor.js";

test("passes only the declared inputRequirements to analyze(), nothing else", async () => {
  _resetForTests();
  let capturedInput;
  registerAdvisor({
    id: "picky",
    name: "Picky Advisor",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["generationReport"],
    analyze: async (input) => {
      capturedInput = input;
      return [];
    },
  });

  await runAdvisor("picky", {
    generationReport: { success: true },
    knowledgeGraph: { irrelevant: true },
    extraJunk: 123,
  });

  assert.deepEqual(Object.keys(capturedInput), ["generationReport"]);
  assert.deepEqual(capturedInput.generationReport, { success: true });
});

test("returns the findings analyze() produces", async () => {
  _resetForTests();
  registerAdvisor({
    id: "finder",
    name: "Finder",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [{ id: "x", severity: "info", message: "hello" }],
  });

  const result = await runAdvisor("finder", {});
  assert.equal(result.advisor, "finder");
  assert.deepEqual(result.findings, [{ id: "x", severity: "info", message: "hello" }]);
});

test("defaults findings to an empty array if analyze() returns nothing", async () => {
  _resetForTests();
  registerAdvisor({
    id: "quiet",
    name: "Quiet",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => undefined,
  });

  const result = await runAdvisor("quiet", {});
  assert.deepEqual(result.findings, []);
});

test("throws a clear error when a required input is missing from the context", async () => {
  _resetForTests();
  registerAdvisor({
    id: "needs-kg",
    name: "Needs KG",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["knowledgeGraph"],
    analyze: async () => [],
  });

  await assert.rejects(
    () => runAdvisor("needs-kg", { generationReport: {} }),
    /requires input "knowledgeGraph" but it was not provided/
  );
});

test("throws a clear error for an unregistered advisor id", async () => {
  _resetForTests();
  await assert.rejects(() => runAdvisor("does-not-exist", {}), /Unknown advisor: "does-not-exist"/);
});

test("propagates analyze() throwing unwrapped -- wrapping is advisor-report.js's job, not the executor's", async () => {
  _resetForTests();
  registerAdvisor({
    id: "broken",
    name: "Broken",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => {
      throw new Error("boom");
    },
  });

  await assert.rejects(() => runAdvisor("broken", {}), /boom/);
});
