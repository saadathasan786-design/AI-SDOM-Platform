import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generatorTools,
  handleGeneratorList,
  handleGeneratorGet,
  handleGeneratorGetVariableManifest,
  handleGeneratorRun,
  handleGeneratorSupportsMode,
  handleGeneratorIsAvailable,
  handleGeneratorGetFrameworkCompatibility,
} from "../generator-tools.js";
import {
  listCatalog,
  getGeneratorMetadata,
  getVariableManifest,
} from "../../generators/index.js";

test("generatorTools declares the complete Generator MCP surface", () => {
  assert.deepEqual(
    generatorTools.map((tool) => tool.name),
    [
      "generator_list",
      "generator_get",
      "generator_getVariableManifest",
      "generator_run",
      "generator_supportsMode",
      "generator_isAvailable",
      "generator_getFrameworkCompatibility",
    ]
  );
});

test("generator_list requires no arguments", () => {
  const tool = generatorTools.find((t) => t.name === "generator_list");
  assert.deepEqual(tool.inputSchema.properties, {});
});

test("all id-based Generator tools declare id as required", () => {
  for (const name of [
    "generator_get",
    "generator_getVariableManifest",
    "generator_run",
    "generator_supportsMode",
    "generator_isAvailable",
    "generator_getFrameworkCompatibility",
  ]) {
    const tool = generatorTools.find((t) => t.name === name);
    assert.deepEqual(tool.inputSchema.required, ["id"]);
  }
});

test("handleGeneratorList returns exactly what the real Generator Catalog returns", async () => {
  assert.deepEqual(await handleGeneratorList(), listCatalog());
});

test("handleGeneratorList exposes the real registered plugin generator", async () => {
  const result = await handleGeneratorList();
  const plugin = result.find((entry) => entry.id === "plugin");
  assert.ok(plugin);
  assert.equal(plugin.name, "Plugin Generator");
  assert.equal(plugin.category, "plugin");
  assert.deepEqual(plugin.supportedModes, ["preview", "dry-run", "write"]);
  assert.equal(plugin.frameworkCompatible, true);
  assert.ok(Array.isArray(plugin.variableManifest));
});

test("handleGeneratorGet delegates to getGeneratorMetadata without reshaping", async () => {
  assert.deepEqual(await handleGeneratorGet({ id: "plugin" }), getGeneratorMetadata("plugin"));
});

test("handleGeneratorGetVariableManifest delegates unchanged", async () => {
  assert.deepEqual(
    await handleGeneratorGetVariableManifest({ id: "plugin" }),
    getVariableManifest("plugin")
  );
});

test("handleGeneratorRun returns the real Generation Report in preview mode", async () => {
  const result = await handleGeneratorRun({
    id: "plugin",
    config: { project_name: "Acme Client Portal" },
    mode: "preview",
  });

  assert.equal(result.generator, "plugin");
  assert.equal(result.mode, "preview");
  assert.equal(result.success, true);
  assert.ok(Array.isArray(result.files.created));
  assert.ok(result.files.created.includes("acme-client-portal.php"));
  assert.equal(result.error, null);
  assert.equal(typeof result.execution_ms, "number");
  assert.equal(typeof result.timestamp, "string");
});

test("handleGeneratorRun preserves the framework's failure report for invalid config", async () => {
  const result = await handleGeneratorRun({
    id: "plugin",
    config: {},
    mode: "preview",
  });

  assert.equal(result.generator, "plugin");
  assert.equal(result.success, false);
  assert.match(result.error, /Missing required config field/);
});

test("handleGeneratorRun returns a framework failure report for an unknown generator", async () => {
  const result = await handleGeneratorRun({
    id: "not-a-real-generator",
    config: {},
    mode: "preview",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /Unknown generator/);
});

test("handleGeneratorRun rejects a missing or non-string id at the MCP adapter boundary", async () => {
  await assert.rejects(
    () => handleGeneratorRun({ config: {} }),
    /generator_run requires a non-empty string 'id'/
  );
  await assert.rejects(
    () => handleGeneratorRun({ id: 42, config: {} }),
    /generator_run requires a non-empty string 'id'/
  );
});

test("handleGeneratorSupportsMode reports the Generator framework's supported modes", async () => {
  assert.equal(await handleGeneratorSupportsMode({ id: "plugin", mode: "preview" }), true);
  assert.equal(await handleGeneratorSupportsMode({ id: "plugin", mode: "dry-run" }), true);
  assert.equal(await handleGeneratorSupportsMode({ id: "plugin", mode: "write" }), true);
});

test("handleGeneratorIsAvailable reports the real plugin generator as available", async () => {
  assert.equal(await handleGeneratorIsAvailable({ id: "plugin" }), true);
  assert.equal(await handleGeneratorIsAvailable({ id: "not-a-real-generator" }), false);
});

test("handleGeneratorGetFrameworkCompatibility returns the framework's exact compatibility data", async () => {
  const result = await handleGeneratorGetFrameworkCompatibility({ id: "plugin" });
  assert.equal(result.compatible, true);
  assert.equal(result.currentFrameworkVersion, "1.0.0");
  assert.equal(result.minimumFrameworkVersion, "1.0.0");
});

test("all id shape checks reject missing ids", async () => {
  await assert.rejects(() => handleGeneratorGet({}), /generator_get requires a non-empty string 'id'/);
  await assert.rejects(
    () => handleGeneratorGetVariableManifest({}),
    /generator_getVariableManifest requires a non-empty string 'id'/
  );
  await assert.rejects(
    () => handleGeneratorSupportsMode({ mode: "preview" }),
    /generator_supportsMode requires a non-empty string 'id'/
  );
  await assert.rejects(
    () => handleGeneratorIsAvailable({}),
    /generator_isAvailable requires a non-empty string 'id'/
  );
  await assert.rejects(
    () => handleGeneratorGetFrameworkCompatibility({}),
    /generator_getFrameworkCompatibility requires a non-empty string 'id'/
  );
});
