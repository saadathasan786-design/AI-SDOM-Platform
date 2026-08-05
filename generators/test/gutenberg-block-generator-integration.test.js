import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { _resetForTests, registerGenerator } from "../framework/generator-registry.js";
import { runGenerator } from "../framework/executor.js";
import { runGeneratorWithReport } from "../framework/generation-report.js";
import { pluginGenerator } from "../plugin/plugin-generator.js";
import { gutenbergBlockGenerator } from "../gutenberg-block/gutenberg-block-generator.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-gutenberg-test-"));
}

function setup() {
  _resetForTests();
  registerGenerator(pluginGenerator);
  registerGenerator(gutenbergBlockGenerator);
}

async function buildTargetPlugin(dir) {
  await runGenerator(
    "plugin",
    { project_name: "Acme Client Portal", vendor_name: "Acme Agency" },
    { outputDir: dir, mode: "write" }
  );
}

test("preview mode against a real generated plugin shows all files for the first block", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const result = await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "preview" });

  const paths = result.files.map((f) => f.path);
  assert.ok(paths.includes(path.join("blocks", "feature-card", "block.json")));
  assert.ok(paths.includes(path.join("blocks", "feature-card", "src", "edit.js")));
  assert.ok(paths.includes(path.join("includes", "Class-Blocks.php")));
  assert.ok(paths.includes("acme-client-portal.php"));
});

test("preview mode does not modify the real target plugin at all", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);
  const before = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");

  await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "preview" });

  const after = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.equal(before, after);
});

test("dry-run mode reports 7 creates and 1 modify with no conflicts on a clean target", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const result = await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "dry-run" });

  assert.equal(result.files_created.length, 7);
  assert.equal(result.files_modified.length, 1);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);
});

test("write mode produces valid, parseable JSON files with correct real content", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  await runGenerator("gutenberg-block", { block_name: "Feature Card", keywords: ["card"] }, { outputDir: dir, mode: "write" });

  const blockJson = JSON.parse(await fs.readFile(path.join(dir, "blocks", "feature-card", "block.json"), "utf8"));
  assert.equal(blockJson.name, "acme-client-portal/feature-card");
  assert.equal(blockJson.textdomain, "acme-client-portal");
  assert.deepEqual(blockJson.keywords, ["card"]);

  const packageJson = JSON.parse(await fs.readFile(path.join(dir, "blocks", "feature-card", "package.json"), "utf8"));
  assert.equal(packageJson.name, "acme-client-portal-feature-card-block");
});

test("write mode correctly wires the main plugin file (require, use, bootstrap)", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "write" });

  const mainContent = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.match(mainContent, /use AcmeAgency\\AcmeClientPortal\\Blocks;/);
  assert.match(mainContent, /\( new Blocks\(\) \)->register\(\);/);
  assert.match(mainContent, /Class-Blocks\.php/);
});

test("no build/ directory or npm-related side effects are produced by generation", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "write" });

  const buildDirExists = await fs
    .access(path.join(dir, "blocks", "feature-card", "build"))
    .then(() => true, () => false);
  const nodeModulesExists = await fs
    .access(path.join(dir, "blocks", "feature-card", "node_modules"))
    .then(() => true, () => false);

  assert.equal(buildDirExists, false, "no build/ directory should be created by generation alone");
  assert.equal(nodeModulesExists, false, "no node_modules/ should be created by generation alone");
});

test("a second, different block injects into the existing Class-Blocks.php and does not re-touch the main file", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);
  await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "write" });
  const mainContentAfterFirst = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");

  const result = await runGenerator("gutenberg-block", { block_name: "Pricing Table" }, { outputDir: dir, mode: "write" });

  assert.equal(result.files_created.length, 6, "only the new block's 6 source files, not another Class-Blocks.php");
  assert.equal(result.files_modified.length, 1, "only Class-Blocks.php");
  assert.ok(!result.files_modified.some((f) => f.endsWith("acme-client-portal.php")));

  const mainContentAfterSecond = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.equal(mainContentAfterFirst, mainContentAfterSecond);

  const blocksContent = await fs.readFile(path.join(dir, "includes", "Class-Blocks.php"), "utf8");
  assert.match(blocksContent, /blocks\/feature-card/);
  assert.match(blocksContent, /blocks\/pricing-table/);
});

test("write mode is idempotent: running twice with the same block_name only generates once", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "write" });
  const secondResult = await runGenerator("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "write" });

  assert.deepEqual(secondResult.files_created, []);
  assert.deepEqual(secondResult.files_modified, []);
  assert.equal(secondResult.skipped_no_op.length, 1);
});

test("runGeneratorWithReport reports created vs modified files distinctly for the first block", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const report = await runGeneratorWithReport("gutenberg-block", { block_name: "Feature Card" }, { outputDir: dir, mode: "write" });

  assert.equal(report.success, true);
  assert.equal(report.files.created.length, 7);
  assert.equal(report.files.modified.length, 1);
});

test("full pipeline: plugin -> gutenberg block composes correctly end to end with custom category/icon", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const report = await runGeneratorWithReport(
    "gutenberg-block",
    { block_name: "Feature Card", category: "design", icon: "index-card", keywords: ["card", "feature"] },
    { outputDir: dir, mode: "write" }
  );

  assert.equal(report.success, true);
  const blockJson = JSON.parse(await fs.readFile(path.join(dir, "blocks", "feature-card", "block.json"), "utf8"));
  assert.equal(blockJson.category, "design");
  assert.equal(blockJson.icon, "index-card");
  assert.deepEqual(blockJson.keywords, ["card", "feature"]);
});
