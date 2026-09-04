import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { _resetForTests, registerGenerator } from "../framework/generator-registry.js";
import { runGenerator } from "../framework/executor.js";
import { runGeneratorWithReport } from "../framework/generation-report.js";
import { themeGenerator } from "../theme/theme-generator.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-theme-gen-test-"));
}

function setup() {
  _resetForTests();
  registerGenerator(themeGenerator);
}

const CONFIG = { project_name: "Acme Portal" };

test("preview mode against the real theme-boilerplate/ returns fully substituted files and writes nothing", async () => {
  setup();
  const dir = await tempDir();

  const result = await runGenerator("theme", CONFIG, { outputDir: dir, mode: "preview" });

  const style = result.files.find((f) => f.path === "style.css");
  assert.ok(style, "style.css should be present");
  assert.match(style.content, /Theme Name: Acme Portal/);
  assert.match(style.content, /Text Domain: acme-portal/);

  const enqueue = result.files.find((f) => f.path === path.join("inc", "enqueue.php"));
  assert.match(enqueue.content, /'acme-portal-style'/);

  const entries = await fs.readdir(dir);
  assert.deepEqual(entries, [], "preview must not write anything");
});

test("the real theme-boilerplate/ source files are never modified by a preview run", async () => {
  const styleCssPath = path.join(process.cwd(), "theme-boilerplate", "style.css");
  const before = await fs.readFile(styleCssPath, "utf8");

  setup();
  await runGenerator("theme", CONFIG, { outputDir: await tempDir(), mode: "preview" });

  const after = await fs.readFile(styleCssPath, "utf8");
  assert.equal(before, after, "source theme boilerplate must be read-only from the generator's perspective");
});

test("dry-run mode reports every expected target path with no conflicts on a clean directory", async () => {
  setup();
  const dir = await tempDir();

  const result = await runGenerator("theme", CONFIG, { outputDir: dir, mode: "dry-run" });

  assert.ok(result.target_paths.includes("style.css"));
  assert.ok(result.target_paths.includes("functions.php"));
  assert.ok(result.target_paths.includes(path.join("inc", "setup.php")));
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);
});

test("write mode writes a complete, correctly-substituted theme to outputDir, with original filenames preserved", async () => {
  setup();
  const dir = await tempDir();

  const result = await runGenerator("theme", CONFIG, { outputDir: dir, mode: "write" });

  assert.ok(result.files_written.some((f) => f.endsWith("style.css")));
  assert.ok(result.files_written.some((f) => f.endsWith(path.join("templates", "index.html"))));

  const styleContent = await fs.readFile(path.join(dir, "style.css"), "utf8");
  assert.match(styleContent, /Theme Name: Acme Portal/);

  const setupContent = await fs.readFile(path.join(dir, "inc", "setup.php"), "utf8");
  assert.match(setupContent, /register_block_pattern_category\( 'acme-portal'/);
});

test("write mode refuses to overwrite an existing generated theme (conflict detection preserved)", async () => {
  setup();
  const dir = await tempDir();
  await runGenerator("theme", CONFIG, { outputDir: dir, mode: "write" });

  await assert.rejects(
    () => runGenerator("theme", CONFIG, { outputDir: dir, mode: "write" }),
    /Refusing to write/
  );
});

test("runGeneratorWithReport produces a structured success report for a write run", async () => {
  setup();
  const dir = await tempDir();

  const report = await runGeneratorWithReport("theme", CONFIG, { outputDir: dir, mode: "write" });

  assert.equal(report.generator, "theme");
  assert.equal(report.success, true);
  assert.deepEqual(report.warnings, []);
  assert.equal(report.rollback.occurred, false);
  assert.ok(report.files.created.length > 5);
  assert.equal(report.error, null);
});
