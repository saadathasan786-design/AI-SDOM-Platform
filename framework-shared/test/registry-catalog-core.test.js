import { test } from "node:test";
import assert from "node:assert/strict";
import { registerCore, getCore, hasCore } from "../registry-core.js";
import { isAvailableCore } from "../catalog-core.js";

// ---------------------------------------------------------------------
// registerCore / getCore / hasCore -- direct unit tests
// ---------------------------------------------------------------------

test("registerCore stores a definition under the given key", () => {
  const registry = new Map();
  registerCore(registry, "foo", { id: "foo", name: "Foo" }, "Advisor");
  assert.equal(registry.get("foo").name, "Foo");
});

test("registerCore throws with the exact 'X is already registered' wording on duplicate key", () => {
  const registry = new Map();
  registerCore(registry, "foo", {}, "Advisor");
  assert.throws(() => registerCore(registry, "foo", {}, "Advisor"), /Advisor "foo" is already registered\.$/);
});

test("registerCore's error label reflects whatever label is passed, matching each subsystem's own wording", () => {
  const registry = new Map();
  registerCore(registry, "x", {}, "Generator");
  assert.throws(() => registerCore(registry, "x", {}, "Generator"), /Generator "x" is already registered\.$/);
});

test("getCore retrieves a previously-registered definition", () => {
  const registry = new Map();
  registerCore(registry, "foo", { id: "foo", name: "Foo" }, "Advisor");
  assert.equal(getCore(registry, "foo", "advisor").name, "Foo");
});

test("getCore throws with the exact 'Unknown X' wording, listing all registered ids, for a missing id", () => {
  const registry = new Map();
  registerCore(registry, "a", {}, "Advisor");
  registerCore(registry, "b", {}, "Advisor");
  assert.throws(
    () => getCore(registry, "c", "advisor"),
    /Unknown advisor: "c"\. Registered advisors: a, b$/
  );
});

test("getCore's 'Registered Xs' lists '(none)' when the registry is empty", () => {
  const registry = new Map();
  assert.throws(() => getCore(registry, "x", "workflow"), /Registered workflows: \(none\)$/);
});

test("hasCore returns true for a registered id and false otherwise", () => {
  const registry = new Map();
  registerCore(registry, "foo", {}, "Advisor");
  assert.equal(hasCore(registry, "foo"), true);
  assert.equal(hasCore(registry, "bar"), false);
});

test("hasCore never throws, even for an empty registry", () => {
  const registry = new Map();
  assert.doesNotThrow(() => hasCore(registry, "anything"));
  assert.equal(hasCore(registry, "anything"), false);
});

// ---------------------------------------------------------------------
// isAvailableCore -- direct unit tests
// ---------------------------------------------------------------------

test("isAvailableCore delegates directly to the given hasFn", () => {
  assert.equal(
    isAvailableCore(() => true, "x"),
    true
  );
  assert.equal(
    isAvailableCore(() => false, "x"),
    false
  );
});

test("isAvailableCore never throws", () => {
  assert.doesNotThrow(() => isAvailableCore(() => false, "x"));
});

// ---------------------------------------------------------------------
// malformed / edge-case input
// ---------------------------------------------------------------------

test("registerCore with an empty-string key still works (no special-casing)", () => {
  const registry = new Map();
  assert.doesNotThrow(() => registerCore(registry, "", {}, "Advisor"));
  assert.equal(hasCore(registry, ""), true);
});

test("registerCore does not mutate the definition object it stores", () => {
  const registry = new Map();
  const definition = { id: "foo", name: "Foo" };
  const copy = { ...definition };
  registerCore(registry, "foo", definition, "Advisor");
  assert.deepEqual(definition, copy);
});

// ---------------------------------------------------------------------
// dependency-free
// ---------------------------------------------------------------------

test("registry-core.js has zero imports", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../registry-core.js", import.meta.url), "utf8");
  const importLines = source.split("\n").filter((line) => line.trim().startsWith("import"));
  assert.equal(importLines.length, 0);
});

test("catalog-core.js has zero imports", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../catalog-core.js", import.meta.url), "utf8");
  const importLines = source.split("\n").filter((line) => line.trim().startsWith("import"));
  assert.equal(importLines.length, 0);
});

// ---------------------------------------------------------------------
// real end-to-end verification through all four subsystem wrappers
// ---------------------------------------------------------------------

test("real end-to-end: Advisor Registry's register/get/has work through the shared core, using real registered advisors", async () => {
  const { getAdvisor, hasAdvisor } = await import("../../advisors/index.js");
  assert.equal(hasAdvisor("security"), true);
  assert.equal(getAdvisor("security").name, "Security Advisor");
  assert.throws(() => getAdvisor("does-not-exist-xyz"), /Unknown advisor: "does-not-exist-xyz"\./);
});

test("real end-to-end: Agent Registry's register/get/has work through the shared core, using real registered agents", async () => {
  const { getAgent, hasAgent } = await import("../../agents/index.js");
  assert.equal(hasAgent("architecture-remediation"), true);
  assert.throws(() => getAgent("does-not-exist-xyz"), /Unknown agent: "does-not-exist-xyz"\./);
});

test("real end-to-end: Workflow Registry's register/get/has work through the shared core, using real registered workflows", async () => {
  const { getWorkflow, hasWorkflow } = await import("../../workflows/index.js");
  assert.equal(hasWorkflow("project-health-check"), true);
  assert.throws(() => getWorkflow("does-not-exist-xyz"), /Unknown workflow: "does-not-exist-xyz"\./);
});

test("real end-to-end: Generator Registry's register/get/has work through the shared core, using real registered generators, id-based", async () => {
  const { getGenerator, listGenerators } = await import("../../generators/framework/generator-registry.js");
  const ids = listGenerators().map((g) => g.id);
  assert.ok(ids.includes("plugin"));
  assert.equal(getGenerator("plugin").name, "Plugin Generator");
});

test("real end-to-end: Generator's legacy id||name fallback still works, unchanged, registering a definition with no id", async () => {
  const { registerGenerator, getGenerator, hasGenerator } = await import("../../generators/framework/generator-registry.js");
  const definition = {
    name: "stage-14b-legacy-fallback-test",
    version: "1.0.0",
    description: "A test generator with no id, to confirm the name fallback.",
    configSchema: { fields: [] },
    generate: () => {},
  };
  registerGenerator(definition);
  assert.equal(hasGenerator("stage-14b-legacy-fallback-test"), true);
  assert.equal(getGenerator("stage-14b-legacy-fallback-test").name, "stage-14b-legacy-fallback-test");
});

test("real end-to-end: Generator's duplicate-registration behavior (via the name fallback key) is unchanged", async () => {
  const { registerGenerator } = await import("../../generators/framework/generator-registry.js");
  const definition = {
    name: "stage-14b-duplicate-fallback-test",
    version: "1.0.0",
    description: "d",
    configSchema: { fields: [] },
    generate: () => {},
  };
  registerGenerator(definition);
  assert.throws(
    () => registerGenerator({ ...definition, description: "different" }),
    /Generator "stage-14b-duplicate-fallback-test" is already registered\.$/
  );
});

test("real end-to-end: all four catalogs' isAvailable() produce identical true/false results to before this stage's migration", async () => {
  const { isAvailable: advisorIsAvailable } = await import("../../advisors/index.js");
  const { isAvailable: agentIsAvailable } = await import("../../agents/index.js");
  const { isAvailable: workflowIsAvailable } = await import("../../workflows/index.js");
  const { isAvailable: generatorIsAvailable } = await import("../../generators/index.js");

  assert.equal(advisorIsAvailable("security"), true);
  assert.equal(advisorIsAvailable("nope"), false);
  assert.equal(agentIsAvailable("architecture-remediation"), true);
  assert.equal(agentIsAvailable("nope"), false);
  assert.equal(workflowIsAvailable("project-health-check"), true);
  assert.equal(workflowIsAvailable("nope"), false);
  assert.equal(generatorIsAvailable("plugin"), true);
  assert.equal(generatorIsAvailable("nope"), false);
});
