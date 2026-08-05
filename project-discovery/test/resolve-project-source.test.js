import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveProjectSource } from "../resolve-project-source.js";

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "resolve-project-source-test-"));
}

// ---------------------------------------------------------------------
// context only
// ---------------------------------------------------------------------

test("context only: returns { ok: true, context } with the given context unchanged", async () => {
  const context = { sourceFiles: [{ path: "a.js", content: "x" }] };
  const result = await resolveProjectSource({ context });
  assert.deepEqual(result, { ok: true, context });
});

test("context only: an object context is returned by identity/deep-equality, not reshaped", async () => {
  const context = { sourceFiles: [], customField: "preserved" };
  const result = await resolveProjectSource({ context });
  assert.equal(result.context.customField, "preserved");
});

// ---------------------------------------------------------------------
// projectRoot only
// ---------------------------------------------------------------------

test("projectRoot only: delegates to the real, unmodified discoverProject() and returns its context verbatim", async () => {
  const root = await makeTempDir();
  await fs.writeFile(path.join(root, "package.json"), '{"name":"test"}');
  await fs.writeFile(path.join(root, "index.js"), "export const a = 1;");

  const result = await resolveProjectSource({ projectRoot: root });
  assert.equal(result.ok, true);
  assert.equal(result.context.projectType, "generic-js");
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path).sort(), ["index.js", "package.json"]);
});

test("projectRoot only: a non-existent directory returns { ok: false, error } -- never throws", async () => {
  const result = await resolveProjectSource({ projectRoot: "/definitely/does/not/exist/12345" });
  assert.equal(result.ok, false);
  assert.match(result.error, /does not exist or is not accessible/);
});

test("projectRoot only: a path pointing at a file, not a directory, returns { ok: false, error }", async () => {
  const root = await makeTempDir();
  const filePath = path.join(root, "a-file.txt");
  await fs.writeFile(filePath, "content");

  const result = await resolveProjectSource({ projectRoot: filePath });
  assert.equal(result.ok, false);
  assert.match(result.error, /is not a directory/);
});

// ---------------------------------------------------------------------
// neither supplied
// ---------------------------------------------------------------------

test("neither context nor projectRoot: returns { ok: true, context: {} }", async () => {
  const result = await resolveProjectSource({});
  assert.deepEqual(result, { ok: true, context: {} });
});

test("called with no arguments at all: still returns { ok: true, context: {} }, never throws", async () => {
  const result = await resolveProjectSource();
  assert.deepEqual(result, { ok: true, context: {} });
});

// ---------------------------------------------------------------------
// mutual exclusivity
// ---------------------------------------------------------------------

test("both context and projectRoot supplied: returns { ok: false, error } with the exact designed wording", async () => {
  const root = await makeTempDir();
  const result = await resolveProjectSource({ context: {}, projectRoot: root });
  assert.equal(result.ok, false);
  assert.equal(result.error, "Supply either 'context' or 'projectRoot', not both.");
});

test("mutual exclusivity is checked BEFORE calling discoverProject() -- an invalid projectRoot combined with a context still reports the mutual-exclusivity error, not a discovery error", async () => {
  const result = await resolveProjectSource({ context: {}, projectRoot: "/does/not/exist" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "Supply either 'context' or 'projectRoot', not both.");
});

// ---------------------------------------------------------------------
// never throws / scope boundaries
// ---------------------------------------------------------------------

test("never throws for any tested input shape", async () => {
  await assert.doesNotReject(() => resolveProjectSource({}));
  await assert.doesNotReject(() => resolveProjectSource({ context: {} }));
  await assert.doesNotReject(() => resolveProjectSource({ projectRoot: "/nope" }));
  await assert.doesNotReject(() => resolveProjectSource({ context: {}, projectRoot: "/nope" }));
  await assert.doesNotReject(() => resolveProjectSource());
});

test("dependency-free except for discoverProject(): the module's own imports are limited to discover-project.js", async () => {
  const source = await fs.readFile(new URL("../resolve-project-source.js", import.meta.url), "utf8");
  const importLines = source.split("\n").filter((line) => line.trim().startsWith("import"));
  assert.equal(importLines.length, 1);
  assert.match(importLines[0], /discover-project\.js/);
});

test("exact result shape: only 'ok' plus 'context' or 'error', never both, never extra fields", async () => {
  const successResult = await resolveProjectSource({ context: { sourceFiles: [] } });
  assert.deepEqual(Object.keys(successResult).sort(), ["ok", "context"].sort());

  const failureResult = await resolveProjectSource({ context: {}, projectRoot: "/x" });
  assert.deepEqual(Object.keys(failureResult).sort(), ["ok", "error"].sort());
});
