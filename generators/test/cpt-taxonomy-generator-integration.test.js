import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { _resetForTests, registerGenerator } from "../framework/generator-registry.js";
import { runGenerator } from "../framework/executor.js";
import { runGeneratorWithReport } from "../framework/generation-report.js";
import { pluginGenerator } from "../plugin/plugin-generator.js";
import { cptTaxonomyGenerator } from "../cpt-taxonomy/cpt-taxonomy-generator.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-cpt-tax-test-"));
}

function setup() {
  _resetForTests();
  registerGenerator(pluginGenerator);
  registerGenerator(cptTaxonomyGenerator);
}

/** Generates a real target plugin via the real Plugin Generator, into dir. */
async function generateTargetPlugin(dir) {
  await runGenerator(
    "plugin",
    { project_name: "Acme Client Portal", vendor_name: "Acme Agency" },
    { outputDir: dir, mode: "write" }
  );
}

test("preview mode against a real generated plugin shows the modified files with full injected content", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);

  const result = await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "preview" });

  assert.equal(result.files.length, 2);
  assert.ok(result.files.every((f) => f.operation === "modify"));
  const cptFile = result.files.find((f) => f.path === path.join("includes", "Class-CPT.php"));
  assert.match(cptFile.content, /register_event_cpt/);
  assert.match(cptFile.content, /acme-client-portal/);
});

test("preview mode does not modify the real target plugin at all", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);
  const before = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");

  await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "preview" });

  const after = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");
  assert.equal(before, after);
});

test("dry-run mode reports both target files as modify-type with no conflicts, on a valid target", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);

  const result = await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "dry-run" });

  assert.deepEqual(result.files_modified.sort(), [path.join("includes", "Class-CPT.php"), path.join("includes", "Class-Taxonomy.php")].sort());
  assert.deepEqual(result.files_created, []);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);
});

test("dry-run mode reports a conflict if a target file to modify is missing (not a plugin-generated target)", async () => {
  setup();
  const dir = await tempDir(); // empty -- never had the plugin generator run against it

  await assert.rejects(
    () => runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "dry-run" }),
    /missing includes[/\\]Class-CPT\.php/
  );
});

test("write mode actually injects the new CPT and taxonomy into the real target files", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);

  const result = await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });

  assert.equal(result.files_modified.length, 2);
  assert.deepEqual(result.files_created, []);

  const cptContent = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");
  assert.match(cptContent, /register_event_cpt/);
  assert.match(cptContent, /register_project_cpt/, "original project CPT must still be present");

  const taxContent = await fs.readFile(path.join(dir, "includes", "Class-Taxonomy.php"), "utf8");
  assert.match(taxContent, /register_event_category/);
  assert.match(taxContent, /register_project_category/, "original project taxonomy must still be present");
});

test("write mode is idempotent: running twice with the same cpt_name only injects once", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);

  await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });
  const secondResult = await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });

  assert.deepEqual(secondResult.files_modified, []);
  assert.equal(secondResult.skipped_no_op.length, 2);

  const cptContent = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");
  const occurrences = cptContent.split("register_event_cpt").length - 1;
  assert.equal(occurrences, 2, "method definition + hook line = 2 occurrences, not 4 (no duplicate injection)");
});

test("a second, different CPT can be injected after the first without disturbing it", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);

  await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });
  await runGenerator("cpt-taxonomy", { cpt_name: "Testimonial" }, { outputDir: dir, mode: "write" });

  const cptContent = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");
  assert.match(cptContent, /register_project_cpt/);
  assert.match(cptContent, /register_event_cpt/);
  assert.match(cptContent, /register_testimonial_cpt/);
});

test("rollback restores original file content (not just deletes) if injecting into the taxonomy file fails after the CPT file already succeeded", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);

  const originalTaxContent = await fs.readFile(path.join(dir, "includes", "Class-Taxonomy.php"), "utf8");
  // Corrupt the taxonomy file's structure so insertion fails mid-run, AFTER
  // the CPT file (processed first) has already been successfully modified.
  await fs.writeFile(
    path.join(dir, "includes", "Class-Taxonomy.php"),
    "<?php\n// no register(): void method here -- injection must fail\nclass Taxonomy {}\n"
  );

  const originalCptContent = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");

  await assert.rejects(
    () => runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" }),
    /Could not locate/
  );

  const cptAfter = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");
  assert.equal(cptAfter, originalCptContent, "Class-CPT.php must be rolled back to its original content, not left half-modified or deleted");
});

test("runGeneratorWithReport surfaces no-op files as warnings, not as failures", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);
  await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });

  const report = await runGeneratorWithReport("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });

  assert.equal(report.success, true);
  assert.equal(report.no_op.length, 2);
  assert.ok(report.warnings.some((w) => w.includes("already up to date")));
  assert.deepEqual(report.files.modified, []);
});

test("runGeneratorWithReport reports created vs modified files distinctly on a real injection", async () => {
  setup();
  const dir = await tempDir();
  await generateTargetPlugin(dir);

  const report = await runGeneratorWithReport("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });

  assert.equal(report.success, true);
  assert.equal(report.files.created.length, 0, "an injection generator creates no new files here");
  assert.equal(report.files.modified.length, 2);
});
