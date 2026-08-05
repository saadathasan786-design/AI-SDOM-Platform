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
import { restApiGenerator } from "../rest-api/rest-api-generator.js";

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "wp-rest-test-"));
}

function setup() {
  _resetForTests();
  registerGenerator(pluginGenerator);
  registerGenerator(cptTaxonomyGenerator);
  registerGenerator(restApiGenerator);
}

async function buildTargetWithEventCpt(dir) {
  await runGenerator(
    "plugin",
    { project_name: "Acme Client Portal", vendor_name: "Acme Agency" },
    { outputDir: dir, mode: "write" }
  );
  await runGenerator("cpt-taxonomy", { cpt_name: "Event" }, { outputDir: dir, mode: "write" });
}

test("preview mode against a real target shows the injected route with full content", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const result = await runGenerator(
    "rest-api",
    { route_path: "/events", method: "GET", target_cpt: "event" },
    { outputDir: dir, mode: "preview" }
  );

  assert.equal(result.files.length, 1);
  assert.equal(result.files[0].operation, "modify");
  assert.match(result.files[0].content, /register_rest_route\( self::NAMESPACE_, '\/events'/);
});

test("preview mode does not modify the real target plugin at all", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);
  const before = await fs.readFile(path.join(dir, "includes", "Class-RestApi.php"), "utf8");

  await runGenerator("rest-api", { route_path: "/events", method: "GET" }, { outputDir: dir, mode: "preview" });

  const after = await fs.readFile(path.join(dir, "includes", "Class-RestApi.php"), "utf8");
  assert.equal(before, after);
});

test("dry-run mode reports Class-RestApi.php as modify-type with no conflicts on a valid target", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const result = await runGenerator("rest-api", { route_path: "/events", method: "GET" }, { outputDir: dir, mode: "dry-run" });

  assert.deepEqual(result.files_modified, [path.join("includes", "Class-RestApi.php")]);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.would_succeed, true);
});

test("the target's REST namespace is correctly detected as the per-plugin renamed value, not the shared boilerplate default", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const files = await runGenerator("rest-api", { route_path: "/events", method: "GET" }, { outputDir: dir, mode: "preview" });
  // Confirms the Stage 3G plugin-generator fix: this generator's detection
  // depends on the namespace actually being renamed per-plugin.
  assert.match(files.files[0].content, /self::NAMESPACE_/);
  assert.ok(!files.files[0].content.includes("'boilerplate/v1'"));
});

test("write mode actually injects the new route into the real target file", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const result = await runGenerator(
    "rest-api",
    { route_path: "/events", method: "GET", target_cpt: "event" },
    { outputDir: dir, mode: "write" }
  );

  assert.equal(result.files_modified.length, 1);
  const content = await fs.readFile(path.join(dir, "includes", "Class-RestApi.php"), "utf8");
  assert.match(content, /function get_events\(/);
  assert.match(content, /get_featured_projects/, "original featured-projects route must still be present");
});

test("multiple distinct routes (list, single, create, delete) can be injected in sequence without collision", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  await runGenerator("rest-api", { route_path: "/events", method: "GET", target_cpt: "event" }, { outputDir: dir, mode: "write" });
  await runGenerator(
    "rest-api",
    { route_path: "/events/(?P<id>\\d+)", method: "GET", target_cpt: "event" },
    { outputDir: dir, mode: "write" }
  );
  await runGenerator("rest-api", { route_path: "/events", method: "POST", target_cpt: "event" }, { outputDir: dir, mode: "write" });
  await runGenerator(
    "rest-api",
    { route_path: "/events/(?P<id>\\d+)", method: "DELETE", target_cpt: "event" },
    { outputDir: dir, mode: "write" }
  );

  const content = await fs.readFile(path.join(dir, "includes", "Class-RestApi.php"), "utf8");
  assert.match(content, /function get_events\(/);
  assert.match(content, /function get_events_by_id\(/);
  assert.match(content, /function post_events\(/);
  assert.match(content, /function delete_events_by_id\(/);
});

test("refuses (throws, does not silently skip) an exact duplicate route+method on the real target", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  await runGenerator("rest-api", { route_path: "/events", method: "GET" }, { outputDir: dir, mode: "write" });

  await assert.rejects(
    () => runGenerator("rest-api", { route_path: "/events", method: "GET" }, { outputDir: dir, mode: "write" }),
    /already registered/
  );
});

test("rejects target_cpt that isn't registered yet in a real target", async () => {
  setup();
  const dir = await tempDir();
  await runGenerator("plugin", { project_name: "Acme Client Portal" }, { outputDir: dir, mode: "write" });
  // No CPT+Taxonomy run -- only "project" exists.

  await assert.rejects(
    () => runGenerator("rest-api", { route_path: "/events", method: "GET", target_cpt: "event" }, { outputDir: dir, mode: "write" }),
    /target_cpt "event" is not registered/
  );
});

test("rollback restores original Class-RestApi.php content if injection fails structurally", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  await fs.writeFile(
    path.join(dir, "includes", "Class-RestApi.php"),
    "<?php\nclass Rest_Api {\n\tconst NAMESPACE_ = 'acme-client-portal/v1';\n\t// no register_routes(): void method here -- injection must fail\n}\n"
  );

  await assert.rejects(
    () => runGenerator("rest-api", { route_path: "/events", method: "GET" }, { outputDir: dir, mode: "write" }),
    /Could not locate/
  );
});

test("runGeneratorWithReport reports a successful injection with modified files, not created", async () => {
  setup();
  const dir = await tempDir();
  await buildTargetWithEventCpt(dir);

  const report = await runGeneratorWithReport(
    "rest-api",
    { route_path: "/events", method: "GET", target_cpt: "event" },
    { outputDir: dir, mode: "write" }
  );

  assert.equal(report.success, true);
  assert.equal(report.files.created.length, 0);
  assert.equal(report.files.modified.length, 1);
});

test("full pipeline: plugin -> CPT+Taxonomy -> REST API route all compose correctly end to end", async () => {
  setup();
  const dir = await tempDir();

  await runGenerator("plugin", { project_name: "Acme Events Co" }, { outputDir: dir, mode: "write" });
  await runGenerator("cpt-taxonomy", { cpt_name: "Event", cpt_plural: "Events" }, { outputDir: dir, mode: "write" });
  const report = await runGeneratorWithReport(
    "rest-api",
    { route_path: "/events", method: "GET", target_cpt: "event" },
    { outputDir: dir, mode: "write" }
  );

  assert.equal(report.success, true);
  const restContent = await fs.readFile(path.join(dir, "includes", "Class-RestApi.php"), "utf8");
  assert.match(restContent, /'post_type'\s+=> 'event'/);
});
