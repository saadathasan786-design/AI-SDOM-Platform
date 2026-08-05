import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { _resetForTests, registerGenerator } from "../framework/generator-registry.js";
import { runGenerator } from "../framework/executor.js";
import { runGeneratorWithReport } from "../framework/generation-report.js";
import { pluginGenerator } from "../plugin/plugin-generator.js";
import { elementorWidgetGenerator } from "../elementor-widget/elementor-widget-generator.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-elementor-test-"));
}

function setup() {
  _resetForTests();
  registerGenerator(pluginGenerator);
  registerGenerator(elementorWidgetGenerator);
}

async function buildTargetPlugin(dir) {
  await runGenerator(
    "plugin",
    { project_name: "Acme Client Portal", vendor_name: "Acme Agency" },
    { outputDir: dir, mode: "write" }
  );
}

test("preview mode against a real generated plugin shows all three files for the first widget", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const result = await runGenerator(
    "elementor-widget",
    { widget_name: "Testimonial Card" },
    { outputDir: dir, mode: "preview" }
  );

  const paths = result.files.map((f) => f.path);
  assert.ok(paths.includes(path.join("widgets", "class-testimonial_card-widget.php")));
  assert.ok(paths.includes(path.join("includes", "Class-Elementor.php")));
  assert.ok(paths.includes("acme-client-portal.php"));
});

test("preview mode does not modify the real target plugin at all", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);
  const before = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");

  await runGenerator("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "preview" });

  const after = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.equal(before, after);
});

test("dry-run mode reports create for widget+Class-Elementor.php and modify for the main file, no conflicts", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const result = await runGenerator("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "dry-run" });

  assert.equal(result.files_created.length, 2);
  assert.equal(result.files_modified.length, 1);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);
});

test("write mode creates the widget, creates Class-Elementor.php, and wires the main plugin file correctly", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const result = await runGenerator("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "write" });
  assert.equal(result.files_created.length, 2);
  assert.equal(result.files_modified.length, 1);

  const mainContent = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.match(mainContent, /use AcmeAgency\\AcmeClientPortal\\Elementor_Widgets;/);
  assert.match(mainContent, /\( new Elementor_Widgets\(\) \)->register\(\);/);
  assert.match(mainContent, /Class-Elementor\.php/);

  const widgetContent = await fs.readFile(path.join(dir, "widgets", "class-testimonial_card-widget.php"), "utf8");
  assert.match(widgetContent, /class AcmeAgency_TestimonialCard_Widget|class AcmeClientPortal_TestimonialCard_Widget/);
});

test("a second, different widget injects into the existing Class-Elementor.php and does not re-touch the main file", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);
  await runGenerator("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "write" });
  const mainContentAfterFirst = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");

  const result = await runGenerator("elementor-widget", { widget_name: "Pricing Table" }, { outputDir: dir, mode: "write" });

  assert.equal(result.files_created.length, 1, "only the new widget file, not a second Class-Elementor.php");
  assert.equal(result.files_modified.length, 1, "only Class-Elementor.php, not the main file again");
  assert.ok(!result.files_modified.some((f) => f.endsWith("acme-client-portal.php")));

  const mainContentAfterSecond = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.equal(mainContentAfterFirst, mainContentAfterSecond, "main file must be untouched by the second widget");

  const elementorContent = await fs.readFile(path.join(dir, "includes", "Class-Elementor.php"), "utf8");
  assert.match(elementorContent, /class-testimonial_card-widget\.php/);
  assert.match(elementorContent, /class-pricing_table-widget\.php/);
});

test("write mode is idempotent: running twice with the same widget_name only generates once", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  await runGenerator("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "write" });
  const secondResult = await runGenerator("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "write" });

  assert.deepEqual(secondResult.files_created, []);
  assert.deepEqual(secondResult.files_modified, []);
  assert.equal(secondResult.skipped_no_op.length, 1);
});

test("a pre-existing conflict on one target file is refused cleanly, leaving the main plugin file untouched", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);
  const originalMainContent = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");

  // Pre-create Class-Elementor.php's exact target path as a DIRECTORY,
  // so the executor's pre-write conflict check refuses the whole run
  // before anything is written.
  await fs.mkdir(path.join(dir, "includes", "Class-Elementor.php"));

  await assert.rejects(
    () => runGenerator("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "write" }),
    /Refusing to write/
  );

  const mainContentAfter = await fs.readFile(path.join(dir, "acme-client-portal.php"), "utf8");
  assert.equal(mainContentAfter, originalMainContent, "main plugin file must be untouched when the run is refused pre-write");
});

test("runGeneratorWithReport reports created vs modified files distinctly for the first widget", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const report = await runGeneratorWithReport("elementor-widget", { widget_name: "Testimonial Card" }, { outputDir: dir, mode: "write" });

  assert.equal(report.success, true);
  assert.equal(report.files.created.length, 2);
  assert.equal(report.files.modified.length, 1);
});

test("full pipeline: plugin -> elementor widget composes correctly end to end with keywords", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetPlugin(dir);

  const report = await runGeneratorWithReport(
    "elementor-widget",
    { widget_name: "Testimonial Card", keywords: ["testimonial", "review"], category: "theme-elements" },
    { outputDir: dir, mode: "write" }
  );

  assert.equal(report.success, true);
  const widgetContent = await fs.readFile(path.join(dir, "widgets", "class-testimonial_card-widget.php"), "utf8");
  assert.match(widgetContent, /array\( 'testimonial', 'review' \)/);
  assert.match(widgetContent, /array\( 'theme-elements' \)/);
});
