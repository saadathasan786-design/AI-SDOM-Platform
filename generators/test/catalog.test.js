import { test } from "node:test";
import assert from "node:assert/strict";
import { registerGenerator, _resetForTests } from "../framework/generator-registry.js";
import {
  listCatalog,
  getGeneratorMetadata,
  getVariableManifest,
  supportsMode,
  isAvailable,
  getFrameworkCompatibility,
} from "../framework/catalog.js";
import { FRAMEWORK_VERSION } from "../framework/framework-version.js";

function minimalDef(overrides = {}) {
  return {
    id: "sample",
    name: "Sample Generator",
    version: "1.0.0",
    description: "A minimal generator with no optional catalog metadata.",
    configSchema: { fields: [] },
    generate: async () => [],
    ...overrides,
  };
}

function fullDef(overrides = {}) {
  return {
    id: "full",
    name: "Full Generator",
    version: "2.0.0",
    description: "A generator declaring every optional catalog field.",
    category: "widget",
    templateDir: "/fake/template/dir",
    variableManifest: [{ variable: "x", description: "x", replaces_literal_token: "X" }],
    supportedOutputs: ["php-widget"],
    minimumFrameworkVersion: "1.0.0",
    configSchema: { fields: [{ name: "project_name", required: true }] },
    generate: async () => [],
    ...overrides,
  };
}

test("listCatalog returns metadata for every registered generator", () => {
  _resetForTests();
  registerGenerator(minimalDef());
  registerGenerator(fullDef());

  const catalog = listCatalog();
  assert.equal(catalog.length, 2);
  assert.ok(catalog.some((g) => g.id === "sample"));
  assert.ok(catalog.some((g) => g.id === "full"));
});

test("getGeneratorMetadata applies documented defaults for a generator with no optional fields", () => {
  _resetForTests();
  registerGenerator(minimalDef());

  const meta = getGeneratorMetadata("sample");
  assert.equal(meta.id, "sample");
  assert.equal(meta.name, "Sample Generator");
  assert.equal(meta.category, "uncategorized");
  assert.deepEqual(meta.supportedModes, ["preview", "dry-run", "write"]);
  assert.equal(meta.templateSource, null);
  assert.deepEqual(meta.variableManifest, []);
  assert.deepEqual(meta.supportedOutputs, []);
  assert.equal(meta.minimumFrameworkVersion, null);
  assert.equal(meta.frameworkCompatible, true, "no minimum version declared means always compatible");
});

test("getGeneratorMetadata reads a generator's own declared fields without duplicating them", () => {
  _resetForTests();
  registerGenerator(fullDef());

  const meta = getGeneratorMetadata("full");
  assert.equal(meta.category, "widget");
  assert.equal(meta.templateSource, "/fake/template/dir");
  assert.deepEqual(meta.supportedOutputs, ["php-widget"]);
  assert.equal(meta.variableManifest.length, 1);
  assert.equal(meta.variableManifest[0].variable, "x");
});

test("getVariableManifest returns the generator's manifest directly", () => {
  _resetForTests();
  registerGenerator(fullDef());

  const manifest = getVariableManifest("full");
  assert.equal(manifest.length, 1);
  assert.equal(manifest[0].variable, "x");
});

test("getVariableManifest returns an empty array for a generator that declares none", () => {
  _resetForTests();
  registerGenerator(minimalDef());

  assert.deepEqual(getVariableManifest("sample"), []);
});

test("supportsMode reports the framework-wide supported modes for any registered generator", () => {
  _resetForTests();
  registerGenerator(minimalDef());

  assert.equal(supportsMode("sample", "preview"), true);
  assert.equal(supportsMode("sample", "dry-run"), true);
  assert.equal(supportsMode("sample", "write"), true);
  assert.equal(supportsMode("sample", "nonexistent-mode"), false);
});

test("supportsMode throws for an unregistered generator (consistent with registry lookups)", () => {
  _resetForTests();
  assert.throws(() => supportsMode("does-not-exist", "preview"), /Unknown generator/);
});

test("isAvailable returns false (not throws) for an unregistered generator", () => {
  _resetForTests();
  assert.equal(isAvailable("does-not-exist"), false);
});

test("isAvailable returns true for a registered, framework-compatible generator", () => {
  _resetForTests();
  registerGenerator(fullDef({ minimumFrameworkVersion: FRAMEWORK_VERSION }));
  assert.equal(isAvailable("full"), true);
});

test("isAvailable returns false for a registered generator requiring a newer framework version", () => {
  _resetForTests();
  registerGenerator(fullDef({ minimumFrameworkVersion: "99.0.0" }));
  assert.equal(isAvailable("full"), false);
});

test("getFrameworkCompatibility reports current vs required version and a compatible flag", () => {
  _resetForTests();
  registerGenerator(fullDef({ minimumFrameworkVersion: "1.0.0" }));

  const compat = getFrameworkCompatibility("full");
  assert.equal(compat.currentFrameworkVersion, FRAMEWORK_VERSION);
  assert.equal(compat.minimumFrameworkVersion, "1.0.0");
  assert.equal(compat.compatible, true);
});

test("getFrameworkCompatibility flags incompatibility when minimumFrameworkVersion exceeds current", () => {
  _resetForTests();
  registerGenerator(fullDef({ minimumFrameworkVersion: "5.0.0" }));

  const compat = getFrameworkCompatibility("full");
  assert.equal(compat.compatible, false);
});

test("duplicate registration is still rejected by the registry (catalog doesn't bypass it)", () => {
  _resetForTests();
  registerGenerator(minimalDef());
  assert.throws(() => registerGenerator(minimalDef()), /already registered/);
});

test("a generator missing optional metadata is still listed, not silently dropped", () => {
  _resetForTests();
  registerGenerator(minimalDef()); // declares none of category/templateDir/variableManifest/etc.

  const catalog = listCatalog();
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, "sample");
});

test("getGeneratorMetadata throws a clear error for an unsupported/unknown generator id", () => {
  _resetForTests();
  assert.throws(() => getGeneratorMetadata("nonexistent"), /Unknown generator: "nonexistent"/);
});

test("catalog entries fall back to name as id when a generator declares no explicit id (backward compatible)", () => {
  _resetForTests();
  const { id, ...noId } = minimalDef();
  registerGenerator(noId); // no id field at all — key derived from name inside the registry

  const meta = getGeneratorMetadata("Sample Generator");
  assert.equal(meta.id, "Sample Generator");
});
