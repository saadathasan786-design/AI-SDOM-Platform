import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { registerGenerator, _resetForTests } from "../framework/generator-registry.js";
import { runGenerator } from "../framework/executor.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-executor-injection-test-"));
}

function registerModifyGenerator(name, fileList, { analyzeOutputDir = false } = {}) {
  registerGenerator({
    name,
    version: "1.0.0",
    description: "fake injection-style generator",
    configSchema: { fields: [] },
    analyzeOutputDir,
    generate: async (_config, _templateFiles, existingFiles) => {
      if (typeof fileList === "function") return fileList(existingFiles);
      return fileList;
    },
  });
}

test("a 'modify' operation refuses to write if the target file does not exist", async () => {
  _resetForTests();
  registerModifyGenerator("mod", [{ path: "a.php", content: "new content", operation: "modify" }]);
  const dir = await tempDir();

  await assert.rejects(
    () => runGenerator("mod", {}, { outputDir: dir, mode: "write" }),
    /Refusing to write.*a\.php/
  );
});

test("a 'modify' operation succeeds and overwrites an existing file", async () => {
  _resetForTests();
  registerModifyGenerator("mod", [{ path: "a.php", content: "new content", operation: "modify" }]);
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "a.php"), "old content");

  await runGenerator("mod", {}, { outputDir: dir, mode: "write" });
  const content = await fs.readFile(path.join(dir, "a.php"), "utf8");
  assert.equal(content, "new content");
});

test("a 'create' operation still refuses to write over an existing file (unchanged from Stage 3A)", async () => {
  _resetForTests();
  registerModifyGenerator("mod", [{ path: "a.php", content: "x", operation: "create" }]);
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "a.php"), "existing");

  await assert.rejects(() => runGenerator("mod", {}, { outputDir: dir, mode: "write" }), /Refusing to write/);
});

test("rollback restores original content for a 'modify' file when a later operation in the same run fails", async () => {
  _resetForTests();
  registerModifyGenerator("mod", [
    { path: "modified.php", content: "new content", operation: "modify" },
    { path: path.join("blocker", "new.php"), content: "x", operation: "create" },
  ]);
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "modified.php"), "ORIGINAL CONTENT");
  await fs.writeFile(path.join(dir, "blocker"), "I am a file, not a directory");

  await assert.rejects(() => runGenerator("mod", {}, { outputDir: dir, mode: "write" }), /rolled back/);

  const content = await fs.readFile(path.join(dir, "modified.php"), "utf8");
  assert.equal(content, "ORIGINAL CONTENT", "modify target must be restored to its original content, not left changed or deleted");
});

test("a 'skip' operation performs no filesystem check and is excluded from files_written", async () => {
  _resetForTests();
  registerModifyGenerator("mod", [
    { path: "does-not-exist-and-thats-fine.php", operation: "skip", reason: "nothing to do" },
  ]);
  const dir = await tempDir();

  const result = await runGenerator("mod", {}, { outputDir: dir, mode: "write" });
  assert.deepEqual(result.files_written, []);
  assert.equal(result.skipped_no_op.length, 1);
  assert.equal(result.skipped_no_op[0].reason, "nothing to do");

  const entries = await fs.readdir(dir);
  assert.deepEqual(entries, [], "a skip operation must never create anything on disk");
});

test("dry-run mode reports create/modify/skip files in their correct separate buckets", async () => {
  _resetForTests();
  registerModifyGenerator("mod", [
    { path: "new.php", content: "x", operation: "create" },
    { path: "existing.php", content: "y", operation: "modify" },
    { path: "skip.php", operation: "skip", reason: "already done" },
  ]);
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "existing.php"), "original");

  const result = await runGenerator("mod", {}, { outputDir: dir, mode: "dry-run" });
  assert.deepEqual(result.files_created, ["new.php"]);
  assert.deepEqual(result.files_modified, ["existing.php"]);
  assert.equal(result.skipped_no_op.length, 1);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.would_succeed, true);
});

test("analyzeOutputDir reads the target directory's current files and passes them to generate()", async () => {
  _resetForTests();
  let capturedExistingFiles;
  registerGenerator({
    name: "analyzer",
    version: "1.0.0",
    description: "reads outputDir",
    configSchema: { fields: [] },
    analyzeOutputDir: true,
    generate: async (_config, _templateFiles, existingFiles) => {
      capturedExistingFiles = existingFiles;
      return [];
    },
  });
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "existing-file.txt"), "hello");

  await runGenerator("analyzer", {}, { outputDir: dir, mode: "preview" });

  assert.equal(capturedExistingFiles.length, 1);
  assert.equal(capturedExistingFiles[0].path, "existing-file.txt");
  assert.equal(capturedExistingFiles[0].content, "hello");
});

test("analyzeOutputDir gives a clear error when outputDir is missing entirely", async () => {
  _resetForTests();
  registerGenerator({
    name: "analyzer",
    version: "1.0.0",
    description: "reads outputDir",
    configSchema: { fields: [] },
    analyzeOutputDir: true,
    generate: async () => [],
  });

  await assert.rejects(
    () => runGenerator("analyzer", {}, { outputDir: path.join(os.tmpdir(), "definitely-does-not-exist-xyz"), mode: "preview" }),
    /Cannot analyze target project/
  );
});

test("a generator without operation fields behaves exactly as in Stage 3A (all default to 'create')", async () => {
  _resetForTests();
  registerModifyGenerator("legacy", [{ path: "a.php", content: "x" }]); // no operation field at all
  const dir = await tempDir();

  const result = await runGenerator("legacy", {}, { outputDir: dir, mode: "dry-run" });
  assert.deepEqual(result.files_created, ["a.php"]);
  assert.deepEqual(result.files_modified, []);
});
