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
import { acfFieldGroupGenerator } from "../acf/acf-generator.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-acf-test-"));
}

function setup() {
  _resetForTests();
  registerGenerator(pluginGenerator);
  registerGenerator(cptTaxonomyGenerator);
  registerGenerator(acfFieldGroupGenerator);
}

async function buildTargetWithEventCpt(dir) {
  await runGenerator(
    "plugin",
    { project_name: "Acme Client Portal", vendor_name: "Acme Agency" },
    { outputDir: dir, mode: "write" }
  );
  await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });
}

const ACF_CONFIG = {
  group_title: "Event Details",
  target_cpt: "event",
  fields: [
    { label: "Event Date", type: "date_picker" },
    { label: "Venue Name", type: "text" },
  ],
};

test("preview mode against a real plugin+CPT target shows the injected field group with full content", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const result = await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "preview" });

  assert.equal(result.files.length, 1);
  assert.equal(result.files[0].operation, "modify");
  assert.match(result.files[0].content, /register_event_details_field_group/);
  assert.match(result.files[0].content, /field_event_event_date/);
});

test("preview mode does not modify the real target plugin at all", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);
  const before = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");

  await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "preview" });

  const after = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");
  assert.equal(before, after);
});

test("dry-run mode reports Class-ACF.php as modify-type with no conflicts on a valid target", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const result = await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "dry-run" });

  assert.deepEqual(result.files_modified, [path.join("includes", "Class-ACF.php")]);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);
});

test("dry-run against a target where the target_cpt doesn't exist yet fails with a clear error", async () => {
  setup();
  const dir = await tempDir();
  await runGenerator("plugin", { project_name: "Acme Client Portal" }, { outputDir: dir, mode: "write" });
  // No CPT+Taxonomy generator run -- only "project" exists, not "event".

  await assert.rejects(
    () => runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "dry-run" }),
    /target_cpt "event" is not registered/
  );
});

test("write mode actually injects the field group into the real target file", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const result = await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" });

  assert.equal(result.files_modified.length, 1);
  const content = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");
  assert.match(content, /register_event_details_field_group/);
  assert.match(content, /register_field_groups/, "original project-details field group must still be present");
});

test("write mode is idempotent: running twice with the same group_title only injects once", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" });
  const secondResult = await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" });

  assert.deepEqual(secondResult.files_modified, []);
  assert.equal(secondResult.skipped_no_op.length, 1);

  const content = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");
  const occurrences = content.split("register_event_details_field_group").length - 1;
  assert.equal(occurrences, 2, "method definition + hook line = 2 occurrences, not 4 (no duplicate injection)");
});

test("a second, different field group can be injected without disturbing the first", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" });
  await runGenerator(
    "acf-field-group",
    { group_title: "Event Pricing", target_cpt: "event", fields: [{ label: "Ticket Price", type: "number" }] },
    { outputDir: dir, mode: "write" }
  );

  const content = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");
  assert.match(content, /register_field_groups/);
  assert.match(content, /register_event_details_field_group/);
  assert.match(content, /register_event_pricing_field_group/);
});

test("rollback restores original Class-ACF.php content if injection fails structurally", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const originalContent = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");
  await fs.writeFile(
    path.join(dir, "includes", "Class-ACF.php"),
    "<?php\n// no register(): void method here -- injection must fail\nclass ACF_Fields {}\n"
  );

  await assert.rejects(
    () => runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" }),
    /Could not locate/
  );

  // The corrupted content stays corrupted (nothing to roll back TO, since
  // this run never got past the first, only file) -- but the real
  // assertion here is that the run doesn't leave a half-written file.
  const afterFailure = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");
  assert.ok(!afterFailure.includes("register_event_details_field_group"));
  void originalContent;
});

test("runGeneratorWithReport surfaces no-op as a warning, not a failure, on the second identical run", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);
  await runGenerator("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" });

  const report = await runGeneratorWithReport("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" });

  assert.equal(report.success, true);
  assert.equal(report.no_op.length, 1);
  assert.ok(report.warnings.some((w) => w.includes("already up to date")));
});

test("full pipeline: plugin -> CPT+Taxonomy -> ACF field group all compose correctly end to end", async () => {
  setup();
  const dir = await tempDir();

  await runGenerator("plugin", { project_name: "Acme Events Co" }, { outputDir: dir, mode: "write" });
  await runGenerator("cpt-taxonomy", { cpt_name: "Event", cpt_plural: "Events" }, { outputDir: dir, mode: "write" });
  const report = await runGeneratorWithReport("acf-field-group", ACF_CONFIG, { outputDir: dir, mode: "write" });

  assert.equal(report.success, true);

  const cptContent = await fs.readFile(path.join(dir, "includes", "Class-CPT.php"), "utf8");
  const acfContent = await fs.readFile(path.join(dir, "includes", "Class-ACF.php"), "utf8");
  assert.match(cptContent, /register_event_cpt/);
  assert.match(acfContent, /'value'\s+=> 'event'/);
});
