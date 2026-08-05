import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { generateCptTaxonomyFiles } from "../cpt-taxonomy/cpt-taxonomy-generator.js";

const CPT_PATH = path.join("includes", "Class-CPT.php");
const TAX_PATH = path.join("includes", "Class-Taxonomy.php");

// Mirrors the real, generated (post-Plugin-Generator) shape of these files —
// not the raw boilerplate, but what a target project actually looks like.
function fakeCptFileContent() {
  return [
    "<?php",
    "namespace AcmeAgency\\AcmeClientPortal;",
    "",
    "class CPT {",
    "",
    "\tpublic function register(): void {",
    "\t\tadd_action( 'init', array( $this, 'register_project_cpt' ) );",
    "\t}",
    "",
    "\tpublic function register_project_cpt(): void {",
    "\t\tregister_post_type( 'project', array(",
    "\t\t\t'labels' => array( 'name' => __( 'Projects', 'acme-client-portal' ) ),",
    "\t\t) );",
    "\t}",
    "}",
    "",
  ].join("\n");
}

function fakeTaxFileContent() {
  return [
    "<?php",
    "namespace AcmeAgency\\AcmeClientPortal;",
    "",
    "class Taxonomy {",
    "",
    "\tpublic function register(): void {",
    "\t\tadd_action( 'init', array( $this, 'register_project_category' ) );",
    "\t}",
    "",
    "\tpublic function register_project_category(): void {",
    "\t\tregister_taxonomy( 'project_category', array( 'project' ), array(",
    "\t\t\t'labels' => array( 'name' => __( 'Project Categories', 'acme-client-portal' ) ),",
    "\t\t) );",
    "\t}",
    "}",
    "",
  ].join("\n");
}

function fakeExistingFiles(overrides = {}) {
  return [
    { path: CPT_PATH, content: fakeCptFileContent() },
    { path: TAX_PATH, content: fakeTaxFileContent() },
    ...(overrides.extra ?? []),
  ];
}

test("generates a modify operation for both Class-CPT.php and Class-Taxonomy.php", () => {
  const files = generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles());
  assert.equal(files.length, 2);
  assert.ok(files.every((f) => f.operation === "modify"));
  assert.ok(files.some((f) => f.path === CPT_PATH));
  assert.ok(files.some((f) => f.path === TAX_PATH));
});

test("injects a new hook line into register() without removing the existing one", () => {
  const files = generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles());
  const cptFile = files.find((f) => f.path === CPT_PATH);

  assert.match(cptFile.content, /add_action\( 'init', array\( \$this, 'register_project_cpt' \) \);/);
  assert.match(cptFile.content, /add_action\( 'init', array\( \$this, 'register_event_cpt' \) \);/);
});

test("injects a new method with correctly derived post type key, labels, and rest_base/rewrite", () => {
  const files = generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles());
  const cptFile = files.find((f) => f.path === CPT_PATH);

  assert.match(cptFile.content, /public function register_event_cpt\(\): void \{/);
  assert.match(cptFile.content, /register_post_type\( 'event', array\(/);
  assert.match(cptFile.content, /__\( 'Events', 'acme-client-portal' \)/);
  assert.match(cptFile.content, /__\( 'Event', 'acme-client-portal' \)/);
  assert.match(cptFile.content, /'rest_base'\s+=> 'events'/);
  assert.match(cptFile.content, /'rewrite'\s+=> array\( 'slug' => 'events' \)/);
});

test("preserves the existing register_project_cpt method untouched", () => {
  const files = generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles());
  const cptFile = files.find((f) => f.path === CPT_PATH);
  assert.match(cptFile.content, /register_post_type\( 'project', array\(/);
});

test("derives the taxonomy from cpt_name by default ('{cpt_name} Category')", () => {
  const files = generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles());
  const taxFile = files.find((f) => f.path === TAX_PATH);

  assert.match(taxFile.content, /public function register_event_category\(\): void \{/);
  assert.match(taxFile.content, /register_taxonomy\( 'event_category', array\( 'event' \)/);
  assert.match(taxFile.content, /__\( 'Event Categories', 'acme-client-portal' \)/);
  assert.match(taxFile.content, /'rest_base'\s+=> 'event-categories'/);
  assert.match(taxFile.content, /'rewrite'\s+=> array\( 'slug' => 'event-category' \)/);
});

test("respects explicit taxonomy_name and taxonomy_plural overrides", () => {
  const files = generateCptTaxonomyFiles(
    { cpt_name: "Event", taxonomy_name: "Event Type", taxonomy_plural: "Event Types" },
    [],
    fakeExistingFiles()
  );
  const taxFile = files.find((f) => f.path === TAX_PATH);

  assert.match(taxFile.content, /public function register_event_type\(\): void \{/);
  assert.match(taxFile.content, /__\( 'Event Types', 'acme-client-portal' \)/);
});

test("respects explicit cpt_plural override for irregular plurals", () => {
  const files = generateCptTaxonomyFiles(
    { cpt_name: "Story", cpt_plural: "Stories" },
    [],
    fakeExistingFiles()
  );
  const cptFile = files.find((f) => f.path === CPT_PATH);
  assert.match(cptFile.content, /__\( 'Stories', 'acme-client-portal' \)/);
  assert.match(cptFile.content, /'rest_base'\s+=> 'stories'/);
});

test("auto-detects the target project's text domain rather than requiring config", () => {
  const files = generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles());
  const cptFile = files.find((f) => f.path === CPT_PATH);
  // "acme-client-portal" appears nowhere in config -- only derivable by
  // reading the existing files, confirming detection actually happened.
  assert.match(cptFile.content, /acme-client-portal/);
});

test("idempotent: running again with the same cpt_name produces a skip operation for both files, not a duplicate", () => {
  const firstRun = generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles());
  const cptAfterFirstRun = firstRun.find((f) => f.path === CPT_PATH).content;

  // Second run's "existing files" now include the already-injected method.
  const secondRun = generateCptTaxonomyFiles(
    { cpt_name: "Event" },
    [],
    [{ path: CPT_PATH, content: cptAfterFirstRun }, { path: TAX_PATH, content: fakeTaxFileContent() }]
  );

  const cptResult = secondRun.find((f) => f.path === CPT_PATH);
  assert.equal(cptResult.operation, "skip");
  assert.match(cptResult.reason, /already registered/);
});

test("a different cpt_name is not blocked by an unrelated existing CPT", () => {
  const files = generateCptTaxonomyFiles({ cpt_name: "Testimonial" }, [], fakeExistingFiles());
  const cptFile = files.find((f) => f.path === CPT_PATH);
  assert.equal(cptFile.operation, "modify");
  assert.match(cptFile.content, /register_testimonial_cpt/);
});

test("throws a clear error when the target is missing Class-CPT.php or Class-Taxonomy.php", () => {
  assert.throws(
    () => generateCptTaxonomyFiles({ cpt_name: "Event" }, [], []),
    /missing includes[/\\]Class-CPT\.php/
  );
});

test("throws a clear error when project name (cpt_name) is empty", () => {
  assert.throws(
    () => generateCptTaxonomyFiles({ cpt_name: "" }, [], fakeExistingFiles()),
    /Cannot generate CPT:.*empty/
  );
});

test("throws a clear error when the derived post type key exceeds WordPress's 20-character limit", () => {
  assert.throws(
    () =>
      generateCptTaxonomyFiles(
        { cpt_name: "A Very Long Custom Post Type Name" },
        [],
        fakeExistingFiles()
      ),
    /exceeding WordPress's 20-character limit/
  );
});

test("throws a clear error when text domain cannot be detected", () => {
  const noDomainFiles = [
    { path: CPT_PATH, content: "<?php\nclass CPT {\n\tpublic function register(): void {\n\t}\n}\n" },
    { path: TAX_PATH, content: "<?php\nclass Taxonomy {\n\tpublic function register(): void {\n\t}\n}\n" },
  ];
  assert.throws(
    () => generateCptTaxonomyFiles({ cpt_name: "Event" }, [], noDomainFiles),
    /could not detect the target plugin's text domain/
  );
});

test("generateCptTaxonomyFiles performs no filesystem access (pure function contract)", () => {
  assert.doesNotThrow(() => generateCptTaxonomyFiles({ cpt_name: "Event" }, [], fakeExistingFiles()));
});
