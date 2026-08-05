import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registerGenerator,
  getGenerator,
  listGenerators,
  hasGenerator,
  _resetForTests,
} from "../framework/generator-registry.js";

function validDef(overrides = {}) {
  return {
    name: "sample",
    version: "1.0.0",
    description: "A sample generator for tests.",
    configSchema: { fields: [{ name: "project_name", type: "string", required: true }] },
    generate: async () => [{ path: "sample.php", content: "<?php" }],
    ...overrides,
  };
}

test("registers and retrieves a valid generator", () => {
  _resetForTests();
  registerGenerator(validDef());

  const def = getGenerator("sample");
  assert.equal(def.name, "sample");
  assert.equal(def.version, "1.0.0");
});

test("rejects a definition missing a required field", () => {
  _resetForTests();
  const { generate, ...missingGenerate } = validDef();
  assert.throws(() => registerGenerator(missingGenerate), /missing required field: "generate"/);
});

test("rejects a definition where generate is not a function", () => {
  _resetForTests();
  assert.throws(
    () => registerGenerator(validDef({ generate: "not-a-function" })),
    /"generate" must be a function/
  );
});

test("rejects a configSchema field with an invalid type", () => {
  _resetForTests();
  assert.throws(
    () =>
      registerGenerator(
        validDef({ configSchema: { fields: [{ name: "x", type: "array" }] } })
      ),
    /invalid type "array"/
  );
});

test("refuses to register the same generator name twice", () => {
  _resetForTests();
  registerGenerator(validDef());
  assert.throws(() => registerGenerator(validDef()), /already registered/);
});

test("getGenerator throws a helpful error for an unknown name", () => {
  _resetForTests();
  registerGenerator(validDef());
  assert.throws(() => getGenerator("nonexistent"), /Unknown generator: "nonexistent"/);
});

test("listGenerators returns metadata for all registered generators, without exposing generate()", () => {
  _resetForTests();
  registerGenerator(validDef());
  registerGenerator(validDef({ name: "other" }));

  const list = listGenerators();
  assert.equal(list.length, 2);
  assert.ok(list.every((g) => typeof g.generate === "undefined"));
});

test("registers and keys a generator by its explicit id, separate from its display name", () => {
  _resetForTests();
  registerGenerator(validDef({ id: "sample-id", name: "Sample Display Name" }));

  const def = getGenerator("sample-id");
  assert.equal(def.name, "Sample Display Name");

  const list = listGenerators();
  assert.equal(list[0].id, "sample-id");
  assert.equal(list[0].name, "Sample Display Name");
});

test("falls back to name as the registry key when no id is declared (backward compatible)", () => {
  _resetForTests();
  registerGenerator(validDef()); // no id field — same shape Stage 3A/3B generators used

  assert.equal(getGenerator("sample").name, "sample");
  assert.equal(listGenerators()[0].id, "sample");
});

test("hasGenerator reports registration status without throwing", () => {
  _resetForTests();
  registerGenerator(validDef());

  assert.equal(hasGenerator("sample"), true);
  assert.equal(hasGenerator("nonexistent"), false);
});

test("two generators with the same name but different explicit ids can both be registered", () => {
  _resetForTests();
  registerGenerator(validDef({ id: "sample-v1", name: "sample" }));
  registerGenerator(validDef({ id: "sample-v2", name: "sample" }));

  assert.equal(listGenerators().length, 2);
});
