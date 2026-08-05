import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { _resetForTests, registerGenerator } from "../framework/generator-registry.js";
import { pluginGenerator } from "../plugin/plugin-generator.js";
import { themeGenerator } from "../theme/theme-generator.js";
import { cptTaxonomyGenerator } from "../cpt-taxonomy/cpt-taxonomy-generator.js";
import { acfFieldGroupGenerator } from "../acf/acf-generator.js";
import { runPortfolioStarterPack } from "../portfolio-starter-pack/portfolio-starter-pack.js";

async function tempPair() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "wp-portfolio-test-"));
  return { themeOutputDir: path.join(root, "theme"), pluginOutputDir: path.join(root, "plugin") };
}

function setup() {
  _resetForTests();
  registerGenerator(pluginGenerator);
  registerGenerator(themeGenerator);
  registerGenerator(cptTaxonomyGenerator);
  registerGenerator(acfFieldGroupGenerator);
}

async function exists(p) {
  return fs.access(p).then(() => true, () => false);
}

test("write mode composes all 4 generators into a real, complete portfolio project", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();

  const report = await runPortfolioStarterPack(
    { project_name: "Acme Portfolio" },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" }
  );

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 4);
  assert.deepEqual(report.steps.map((s) => s.generator), ["theme", "plugin", "cpt-taxonomy", "acf-field-group"]);
  assert.ok(report.steps.every((s) => s.success));

  assert.ok(await exists(path.join(themeOutputDir, "style.css")));
  assert.ok(await exists(path.join(pluginOutputDir, "acme-portfolio.php")));

  const cptContent = await fs.readFile(path.join(pluginOutputDir, "includes", "Class-CPT.php"), "utf8");
  assert.match(cptContent, /register_portfolio_item_cpt/);
  assert.match(cptContent, /register_project_cpt/, "original built-in project CPT must remain untouched");

  const taxContent = await fs.readFile(path.join(pluginOutputDir, "includes", "Class-Taxonomy.php"), "utf8");
  assert.match(taxContent, /register_portfolio_item_category/);

  const acfContent = await fs.readFile(path.join(pluginOutputDir, "includes", "Class-ACF.php"), "utf8");
  assert.match(acfContent, /register_portfolio_item_details_field_group/);
  assert.match(acfContent, /'value'\s+=> 'portfolio_item'/);
});

test("theme and plugin content is genuinely produced by the real Theme/Plugin generators, not reimplemented", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();

  await runPortfolioStarterPack(
    { project_name: "Acme Portfolio", vendor_name: "Acme Agency", author: "Jane Smith" },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" }
  );

  const styleCss = await fs.readFile(path.join(themeOutputDir, "style.css"), "utf8");
  assert.match(styleCss, /Theme Name: Acme Portfolio/);
  assert.match(styleCss, /Author: Jane Smith/);

  const mainPhp = await fs.readFile(path.join(pluginOutputDir, "acme-portfolio.php"), "utf8");
  assert.match(mainPhp, /use AcmeAgency\\AcmePortfolio\\Activator;/);
});

test("dry-run mode reports success without writing anything to the real target", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();

  const report = await runPortfolioStarterPack(
    { project_name: "Acme Portfolio" },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "dry-run" }
  );

  assert.equal(report.success, true);
  assert.ok(report.steps.every((s) => s.success));
  assert.equal(await exists(themeOutputDir), false);
  assert.equal(await exists(pluginOutputDir), false);
});

test("preview mode returns actual file content without writing anything to the real target", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();

  const report = await runPortfolioStarterPack(
    { project_name: "Acme Portfolio" },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "preview" }
  );

  assert.equal(report.success, true);
  const cptStep = report.steps.find((s) => s.generator === "cpt-taxonomy");
  assert.ok(cptStep.preview_files.length > 0);
  const cptPreviewFile = cptStep.preview_files.find((f) => f.path.includes("Class-CPT.php"));
  assert.match(cptPreviewFile.content, /register_portfolio_item_cpt/);

  assert.equal(await exists(themeOutputDir), false);
  assert.equal(await exists(pluginOutputDir), false);
});

test("write mode is idempotent: theme/plugin are skipped, CPT/ACF report no-ops, on a second identical run", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();
  const config = { project_name: "Acme Portfolio" };

  await runPortfolioStarterPack(config, { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" });
  const second = await runPortfolioStarterPack(config, {
    theme_output_dir: themeOutputDir,
    plugin_output_dir: pluginOutputDir,
    mode: "write",
  });

  assert.equal(second.success, true);
  const [themeStep, pluginStep, cptStep, acfStep] = second.steps;
  assert.equal(themeStep.skipped, true);
  assert.equal(pluginStep.skipped, true);
  assert.equal(cptStep.no_op.length, 2);
  assert.equal(acfStep.no_op.length, 1);

  const cptContent = await fs.readFile(path.join(pluginOutputDir, "includes", "Class-CPT.php"), "utf8");
  const occurrences = cptContent.split("register_portfolio_item_cpt").length - 1;
  assert.equal(occurrences, 2, "method definition + hook line = 2, not 4, after running twice");
});

test("preview mode against an already-composed target correctly shows theme/plugin as skipped", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();
  const config = { project_name: "Acme Portfolio" };
  await runPortfolioStarterPack(config, { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" });

  const preview = await runPortfolioStarterPack(config, {
    theme_output_dir: themeOutputDir,
    plugin_output_dir: pluginOutputDir,
    mode: "preview",
  });

  assert.equal(preview.success, true);
  assert.equal(preview.steps[0].skipped, true);
  assert.equal(preview.steps[1].skipped, true);
});

test("a failure partway through (bad ACF field type) reports which step failed and why", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();

  const report = await runPortfolioStarterPack(
    { project_name: "Acme Portfolio", acf_fields: [{ label: "Bad", type: "repeater" }] },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" }
  );

  assert.equal(report.success, false);
  assert.equal(report.failed_step, "acf-field-group");
  assert.match(report.error, /unsupported type "repeater"/);
});

test("earlier successful steps are left in place (resumable) after a later step fails", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();

  await runPortfolioStarterPack(
    { project_name: "Acme Portfolio", acf_fields: [{ label: "Bad", type: "repeater" }] },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" }
  );

  assert.ok(await exists(path.join(themeOutputDir, "style.css")), "theme output must remain");
  assert.ok(await exists(path.join(pluginOutputDir, "includes", "Class-CPT.php")), "plugin + CPT output must remain");
});

test("after fixing the config, re-running resumes correctly", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();

  await runPortfolioStarterPack(
    { project_name: "Acme Portfolio", acf_fields: [{ label: "Bad", type: "repeater" }] },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" }
  );

  const resumed = await runPortfolioStarterPack(
    { project_name: "Acme Portfolio" },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" }
  );

  assert.equal(resumed.success, true);
  assert.equal(resumed.steps[0].skipped, true);
  assert.equal(resumed.steps[1].skipped, true);

  const acfContent = await fs.readFile(path.join(pluginOutputDir, "includes", "Class-ACF.php"), "utf8");
  assert.match(acfContent, /register_portfolio_item_details_field_group/);
});

test("throws a clear error if theme_output_dir or plugin_output_dir is missing", async () => {
  setup();
  await assert.rejects(
    () => runPortfolioStarterPack({ project_name: "X" }, { theme_output_dir: "/tmp/x" }),
    /requires both theme_output_dir and plugin_output_dir/
  );
});

test("execution_ms and timestamp are present regardless of outcome", async () => {
  setup();
  const { themeOutputDir, pluginOutputDir } = await tempPair();
  const report = await runPortfolioStarterPack(
    { project_name: "Acme Portfolio" },
    { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode: "write" }
  );
  assert.equal(typeof report.execution_ms, "number");
  assert.ok(!Number.isNaN(new Date(report.timestamp).getTime()));
});
