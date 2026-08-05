import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { registerGenerator, _resetForTests } from "../framework/generator-registry.js";
import { runGeneratorWithReport } from "../framework/generation-report.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-report-test-"));
}

function registerFake(name, fileList) {
  registerGenerator({
    name,
    version: "1.0.0",
    description: "fake generator for report tests",
    configSchema: { fields: [] },
    generate: async () => fileList,
  });
}

test("preview mode report lists created files with no rollback/warnings", async () => {
  _resetForTests();
  registerFake("fake", [{ path: "a.php", content: "<?php" }]);
  const dir = await tempDir();

  const report = await runGeneratorWithReport("fake", {}, { outputDir: dir, mode: "preview" });

  assert.equal(report.success, true);
  assert.deepEqual(report.files.created, ["a.php"]);
  assert.deepEqual(report.files.skipped, []);
  assert.deepEqual(report.warnings, []);
});

test("write mode report lists full written paths", async () => {
  _resetForTests();
  registerFake("fake", [{ path: "a.php", content: "<?php" }]);
  const dir = await tempDir();

  const report = await runGeneratorWithReport("fake", {}, { outputDir: dir, mode: "write" });

  assert.equal(report.success, true);
  assert.equal(report.files.created.length, 1);
  assert.ok(report.files.created[0].endsWith("a.php"));
});

test("failure report parses rollback status and file count from the executor's error message", async () => {
  _resetForTests();
  registerFake("fake", [
    { path: "first.php", content: "<?php" },
    { path: path.join("blocker", "second.php"), content: "<?php" },
  ]);
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "blocker"), "I am a file, not a directory");

  const report = await runGeneratorWithReport("fake", {}, { outputDir: dir, mode: "write" });

  assert.equal(report.success, false);
  assert.equal(report.rollback.occurred, true);
  assert.equal(report.rollback.files_removed, 1);
  assert.ok(report.error.includes("rolled back"));
});

test("report includes a numeric execution_ms and ISO timestamp regardless of outcome", async () => {
  _resetForTests();
  registerFake("fake", [{ path: "a.php", content: "<?php" }]);
  const dir = await tempDir();

  const report = await runGeneratorWithReport("fake", {}, { outputDir: dir, mode: "preview" });

  assert.equal(typeof report.execution_ms, "number");
  assert.ok(!Number.isNaN(new Date(report.timestamp).getTime()));
});
