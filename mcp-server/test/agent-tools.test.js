import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agentTools,
  handleAgentList,
  handleAgentRun,
  handleAgentCheckCompatibility,
} from "../agent-tools.js";
import { listAgentCatalog } from "../../agents/index.js";

function file(path, content) {
  return { path, content };
}

test("agentTools declares exactly the three required tools with correct names", () => {
  const names = agentTools.map((t) => t.name);
  assert.deepEqual(names, ["agent_list", "agent_run", "agent_checkCompatibility"]);
});

test("agent_run declares id as required in its inputSchema", () => {
  const tool = agentTools.find((t) => t.name === "agent_run");
  assert.deepEqual(tool.inputSchema.required, ["id"]);
});

test("agent_checkCompatibility declares id as required in its inputSchema", () => {
  const tool = agentTools.find((t) => t.name === "agent_checkCompatibility");
  assert.deepEqual(tool.inputSchema.required, ["id"]);
});

test("handleAgentList returns exactly what listAgentCatalog returns -- no duplication, no reshaping", async () => {
  const fromHandler = await handleAgentList();
  const fromCatalogDirectly = listAgentCatalog();
  assert.deepEqual(fromHandler, fromCatalogDirectly);
});

test("handleAgentList lists the real registered architecture-remediation agent with every required field", async () => {
  const result = await handleAgentList();
  assert.ok(result.length > 0);
  const agent = result.find((a) => a.id === "architecture-remediation");
  assert.ok(agent);
  assert.equal(typeof agent.name, "string");
  assert.equal(typeof agent.description, "string");
  assert.equal(typeof agent.category, "string");
  assert.ok(Array.isArray(agent.inputRequirements));
  assert.ok(Array.isArray(agent.requiresAdvisors));
  assert.ok(Array.isArray(agent.requiresGenerators));
});

test("handleAgentRun runs the real agent and returns its exact Agent Report shape (successful, clean workflow)", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const result = await handleAgentRun({ id: "architecture-remediation", context: { sourceFiles } });

  assert.equal(result.agent, "architecture-remediation");
  assert.equal(result.success, true);
  assert.equal(result.steps.length, 1);
  assert.equal(result.halted.action, "stop");
  assert.equal(typeof result.execution_ms, "number");
  assert.equal(typeof result.timestamp, "string");
});

test("handleAgentRun runs the real agent through both steps when a real violation is found", async () => {
  const sourceFiles = [
    file("generators/framework/executor.js", "import '../plugin/plugin-generator.js';\nexport const e = 1;"),
    file("generators/plugin/plugin-generator.js", "export const p = 1;"),
  ];
  const result = await handleAgentRun({ id: "architecture-remediation", context: { sourceFiles } });

  assert.equal(result.success, true);
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[1].result.mode, "dry-run");
});

test("handleAgentRun on an unknown agent id returns success:false with a clear error, never throwing", async () => {
  const result = await handleAgentRun({ id: "not-a-real-agent", context: {} });
  assert.equal(result.success, false);
  assert.match(result.errors[0].message, /Unknown agent/);
});

test("handleAgentRun throws a clear error when id is missing (invalid request shape)", async () => {
  await assert.rejects(() => handleAgentRun({ context: {} }), /requires a non-empty string 'id'/);
});

test("handleAgentRun throws a clear error when id is not a string", async () => {
  await assert.rejects(() => handleAgentRun({ id: 42 }), /requires a non-empty string 'id'/);
});

test("handleAgentRun defaults context to an empty object when omitted, surfacing the framework's own missing-input error", async () => {
  const result = await handleAgentRun({ id: "architecture-remediation" });
  assert.equal(result.success, false);
  assert.match(result.errors[0].message, /requires input "sourceFiles"/);
});

test("handleAgentCheckCompatibility returns compatible:true for the real, fully-satisfied agent", async () => {
  const result = await handleAgentCheckCompatibility({ id: "architecture-remediation" });
  assert.equal(result.compatible, true);
  assert.deepEqual(result.missingAdvisors, []);
  assert.deepEqual(result.missingGenerators, []);
  assert.equal(result.error, null);
});

test("handleAgentCheckCompatibility returns compatible:false with a populated error for an unknown agent id", async () => {
  const result = await handleAgentCheckCompatibility({ id: "not-a-real-agent" });
  assert.equal(result.compatible, false);
  assert.match(result.error, /Unknown agent/);
});

test("handleAgentCheckCompatibility throws a clear error when id is missing (invalid request shape)", async () => {
  await assert.rejects(() => handleAgentCheckCompatibility({}), /requires a non-empty string 'id'/);
});

test("handleAgentCheckCompatibility throws a clear error when id is not a string", async () => {
  await assert.rejects(() => handleAgentCheckCompatibility({ id: [] }), /requires a non-empty string 'id'/);
});
