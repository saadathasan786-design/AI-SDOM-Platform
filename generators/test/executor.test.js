import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { registerGenerator, _resetForTests } from "../framework/generator-registry.js";
import { runGenerator } from "../framework/executor.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-generator-test-"));
}

function registerSample(name = "sample", fileList = [{ path: "sample.php", content: "<?php echo 1;" }]) {
  registerGenerator({
    name,
    version: "1.0.0",
    description: "test generator",
    configSchema: { fields: [{ name: "project_name", type: "string", required: true }] },
    generate: async () => fileList,
  });
}

test("preview mode returns full file contents and writes nothing to disk", async () => {
  _resetForTests();
  registerSample();
  const dir = await tempDir();

  const result = await runGenerator("sample", { project_name: "Acme" }, { outputDir: dir, mode: "preview" });

  assert.equal(result.mode, "preview");
  assert.equal(result.files[0].path, "sample.php");
  assert.match(result.files[0].content, /echo 1/);

  const entries = await fs.readdir(dir);
  assert.deepEqual(entries, [], "preview must not write any files");
});

test("dry-run mode reports target paths and no conflicts on a clean directory", async () => {
  _resetForTests();
  registerSample();
  const dir = await tempDir();

  const result = await runGenerator("sample", { project_name: "Acme" }, { outputDir: dir, mode: "dry-run" });

  assert.deepEqual(result.target_paths, ["sample.php"]);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);

  const entries = await fs.readdir(dir);
  assert.deepEqual(entries, [], "dry-run must not write any files");
});

test("dry-run mode detects a pre-existing conflicting file", async () => {
  _resetForTests();
  registerSample();
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "sample.php"), "existing content");

  const result = await runGenerator("sample", { project_name: "Acme" }, { outputDir: dir, mode: "dry-run" });

  assert.deepEqual(result.conflicts, ["sample.php"]);
  assert.equal(result.would_succeed, false);
});

test("write mode actually writes files to outputDir", async () => {
  _resetForTests();
  registerSample();
  const dir = await tempDir();

  const result = await runGenerator("sample", { project_name: "Acme" }, { outputDir: dir, mode: "write" });

  assert.equal(result.files_written.length, 1);
  const content = await fs.readFile(path.join(dir, "sample.php"), "utf8");
  assert.match(content, /echo 1/);
});

test("write mode creates nested directories as needed", async () => {
  _resetForTests();
  registerSample("nested", [{ path: path.join("includes", "Class-Activator.php"), content: "<?php" }]);
  const dir = await tempDir();

  await runGenerator("nested", { project_name: "Acme" }, { outputDir: dir, mode: "write" });

  const content = await fs.readFile(path.join(dir, "includes", "Class-Activator.php"), "utf8");
  assert.equal(content, "<?php");
});

test("write mode refuses to overwrite an existing file (no silent overwrite)", async () => {
  _resetForTests();
  registerSample();
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "sample.php"), "do not touch me");

  await assert.rejects(
    () => runGenerator("sample", { project_name: "Acme" }, { outputDir: dir, mode: "write" }),
    /Refusing to write.*sample\.php/
  );

  const content = await fs.readFile(path.join(dir, "sample.php"), "utf8");
  assert.equal(content, "do not touch me", "existing file must be untouched after refusal");
});

test("write mode rolls back already-written files if a later write fails", async () => {
  _resetForTests();
  // "blocker" already exists as a plain FILE. The second generated file's
  // parent directory is "blocker/", so fs.mkdir(...) for it will fail
  // (ENOTDIR) — but the target path itself ("blocker/nested.php") does not
  // yet exist, so conflict detection (which only checks exact target
  // paths) won't flag it upfront. This forces a genuine mid-run failure,
  // after "first.php" has already been written successfully.
  registerSample("multi", [
    { path: "first.php", content: "<?php // first" },
    { path: path.join("blocker", "nested.php"), content: "<?php // this will fail" },
  ]);
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "blocker"), "I am a file, not a directory");

  await assert.rejects(
    () => runGenerator("multi", { project_name: "Acme" }, { outputDir: dir, mode: "write" }),
    /writing 1 file\(s\); all were rolled back/
  );

  const firstExists = await fs.access(path.join(dir, "first.php")).then(() => true, () => false);
  assert.equal(firstExists, false, "first.php should have been rolled back after the second write failed");
});

test("throws a clear error for a required config field that is missing", async () => {
  _resetForTests();
  registerSample();
  const dir = await tempDir();

  await assert.rejects(
    () => runGenerator("sample", {}, { outputDir: dir, mode: "dry-run" }),
    /Missing required config field: "project_name"/
  );
});

test("throws a clear error for an unregistered generator name", async () => {
  _resetForTests();
  const dir = await tempDir();
  await assert.rejects(
    () => runGenerator("does-not-exist", {}, { outputDir: dir, mode: "preview" }),
    /Unknown generator: "does-not-exist"/
  );
});
