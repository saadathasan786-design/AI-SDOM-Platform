import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { _resetForTests, registerGenerator } from "../framework/generator-registry.js";
import { runGenerator } from "../framework/executor.js";
import { runGeneratorWithReport } from "../framework/generation-report.js";
import { pluginGenerator } from "../plugin/plugin-generator.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-plugin-gen-test-"));
}

function setup() {
  _resetForTests();
  registerGenerator(pluginGenerator);
}

const CONFIG = { project_name: "Acme Client Portal", vendor_name: "Acme Agency" };

test("preview mode against the real plugin-boilerplate/ returns fully substituted files and writes nothing", async () => {
  setup();
  const dir = await tempDir();

  const result = await runGenerator("plugin", CONFIG, { outputDir: dir, mode: "preview" });

  const main = result.files.find((f) => f.path === "acme-client-portal.php");
  assert.ok(main, "main plugin file should be present and renamed");
  assert.match(main.content, /Plugin Name: Acme Client Portal/);
  assert.match(main.content, /Text Domain: acme-client-portal/);
  assert.match(main.content, /AcmeAgency\\AcmeClientPortal/);

  const cpt = result.files.find((f) => f.path === path.join("includes", "Class-CPT.php"));
  assert.ok(cpt, "includes/Class-CPT.php should be carried through unrenamed");
  assert.match(cpt.content, /namespace AcmeAgency\\AcmeClientPortal;/);

  const composer = result.files.find((f) => f.path === "composer.json");
  assert.match(composer.content, /"name": "acme-agency\/acme-client-portal"/);

  const entries = await fs.readdir(dir);
  assert.deepEqual(entries, [], "preview must not write anything");
});

test("the real plugin-boilerplate/ source files are never modified by a preview run", async () => {
  const boilerplateDir = path.join(process.cwd(), "..", "plugin-boilerplate", "plugin-boilerplate.php");
  const before = await fs.readFile(boilerplateDir, "utf8");

  setup();
  await runGenerator("plugin", CONFIG, { outputDir: await tempDir(), mode: "preview" });

  const after = await fs.readFile(boilerplateDir, "utf8");
  assert.equal(before, after, "source boilerplate must be read-only from the generator's perspective");
});

test("dry-run mode reports every expected target path with no conflicts on a clean directory", async () => {
  setup();
  const dir = await tempDir();

  const result = await runGenerator("plugin", CONFIG, { outputDir: dir, mode: "dry-run" });

  assert.ok(result.target_paths.includes("acme-client-portal.php"));
  assert.ok(result.target_paths.includes("composer.json"));
  assert.ok(result.target_paths.includes(path.join("includes", "Class-CPT.php")));
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);
});

test("write mode writes a complete, correctly-renamed plugin to outputDir", async () => {
  setup();
  const dir = await tempDir();

  const result = await runGenerator("plugin", CONFIG, { outputDir: dir, mode: "write" });

  assert.ok(result.files_written.some((f) => f.endsWith("acme-client-portal.php")));

  const mainContent = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.match(mainContent, /Plugin Name: Acme Client Portal/);

  const uninstallContent = await fs.readFile(path.join(dir, "uninstall.php"), "utf8");
  assert.match(uninstallContent, /acme_client_portal_version/);
});

test("write mode renames the REST API namespace constant per-plugin (Stage 3G fix — was previously left as a shared literal)", async () => {
  setup();
  const dir = await tempDir();

  await runGenerator("plugin", CONFIG, { outputDir: dir, mode: "write" });

  const restApiContent = await fs.readFile(path.join(dir, "includes", "Class-RestApi.php"), "utf8");
  assert.match(restApiContent, /NAMESPACE_ = 'acme-client-portal\/v1'/);
  assert.ok(!restApiContent.includes("boilerplate/v1"), "no generated plugin should retain the shared boilerplate namespace");
});

test("write mode refuses to overwrite an existing generated plugin (conflict detection preserved)", async () => {
  setup();
  const dir = await tempDir();
  await runGenerator("plugin", CONFIG, { outputDir: dir, mode: "write" });

  await assert.rejects(
    () => runGenerator("plugin", CONFIG, { outputDir: dir, mode: "write" }),
    /Refusing to write/
  );
});

test("runGeneratorWithReport produces a structured success report for a write run", async () => {
  setup();
  const dir = await tempDir();

  const report = await runGeneratorWithReport("plugin", CONFIG, { outputDir: dir, mode: "write" });

  assert.equal(report.generator, "plugin");
  assert.equal(report.mode, "write");
  assert.equal(report.success, true);
  assert.deepEqual(report.warnings, []);
  assert.equal(report.rollback.occurred, false);
  assert.ok(report.files.created.length > 5, "several files should have been created");
  assert.equal(typeof report.execution_ms, "number");
  assert.ok(report.execution_ms >= 0);
  assert.equal(report.error, null);
});

test("runGeneratorWithReport reports conflicts as warnings in dry-run mode", async () => {
  setup();
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, "acme-client-portal.php"), "pre-existing");

  const report = await runGeneratorWithReport("plugin", CONFIG, { outputDir: dir, mode: "dry-run" });

  assert.equal(report.success, true);
  assert.equal(report.warnings.length, 1);
  assert.match(report.warnings[0], /acme-client-portal\.php/);
  assert.ok(report.files.skipped.includes("acme-client-portal.php"));
});

test("runGeneratorWithReport reports failure and rollback status without throwing", async () => {
  setup();
  const dir = await tempDir();
  await runGenerator("plugin", CONFIG, { outputDir: dir, mode: "write" }); // first run succeeds

  // Second run into the same directory will conflict on the very first
  // written-vs-existing check inside the executor's own conflict guard —
  // use write mode again to hit the "Refusing to write" path (not a
  // mid-run rollback, but confirms failure is captured, not thrown, here).
  const report = await runGeneratorWithReport("plugin", CONFIG, { outputDir: dir, mode: "write" });

  assert.equal(report.success, false);
  assert.match(report.error, /Refusing to write/);
  assert.equal(report.rollback.occurred, false);
});
