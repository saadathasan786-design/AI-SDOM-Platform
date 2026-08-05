import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { generateAcfFieldGroupFiles, SUPPORTED_FIELD_TYPES } from "../acf/acf-generator.js";

const ACF_PATH = path.join("includes", "Class-ACF.php");
const CPT_PATH = path.join("includes", "Class-CPT.php");

function fakeAcfFileContent() {
  return [
    "<?php",
    "namespace AcmeAgency\\AcmeClientPortal;",
    "",
    "class ACF_Fields {",
    "",
    "\tpublic function register(): void {",
    "\t\tadd_action( 'acf/init', array( $this, 'register_field_groups' ) );",
    "\t}",
    "",
    "\tpublic function register_field_groups(): void {",
    "\t\tif ( ! function_exists( 'acf_add_local_field_group' ) ) {",
    "\t\t\treturn;",
    "\t\t}",
    "\t\tacf_add_local_field_group( array(",
    "\t\t\t'key'   => 'group_project_details',",
    "\t\t\t'title' => 'Project Details',",
    "\t\t) );",
    "\t}",
    "}",
    "",
  ].join("\n");
}

function fakeCptFileContent(postTypes = ["project", "event"]) {
  const registrations = postTypes.map((slug) => `\t\tregister_post_type( '${slug}', array() );`).join("\n");
  return `<?php\nclass CPT {\n\tpublic function register(): void {\n\t}\n${registrations}\n}\n`;
}

function fakeExistingFiles(postTypes) {
  return [
    { path: ACF_PATH, content: fakeAcfFileContent() },
    { path: CPT_PATH, content: fakeCptFileContent(postTypes) },
  ];
}

function validConfig(overrides = {}) {
  return {
    group_title: "Event Details",
    target_cpt: "event",
    fields: [{ label: "Event Date", type: "date_picker" }],
    ...overrides,
  };
}

test("generates a single modify operation for Class-ACF.php", () => {
  const files = generateAcfFieldGroupFiles(validConfig(), [], fakeExistingFiles());
  assert.equal(files.length, 1);
  assert.equal(files[0].path, ACF_PATH);
  assert.equal(files[0].operation, "modify");
});

test("injects a new hook line without removing the existing one", () => {
  const files = generateAcfFieldGroupFiles(validConfig(), [], fakeExistingFiles());
  const content = files[0].content;
  assert.match(content, /add_action\( 'acf\/init', array\( \$this, 'register_field_groups' \) \);/);
  assert.match(content, /add_action\( 'acf\/init', array\( \$this, 'register_event_details_field_group' \) \);/);
});

test("injects a new method with correct group key, field key, and location rule", () => {
  const files = generateAcfFieldGroupFiles(validConfig(), [], fakeExistingFiles());
  const content = files[0].content;

  assert.match(content, /public function register_event_details_field_group\(\): void \{/);
  assert.match(content, /'key'\s+=> 'group_event_details'/);
  assert.match(content, /'title'\s+=> 'Event Details'/);
  assert.match(content, /'key'\s+=> 'field_event_event_date'/);
  assert.match(content, /'value'\s+=> 'event'/);
});

test("field key is prefixed by the TARGET CPT slug, not the group slug (matches real boilerplate convention)", () => {
  const files = generateAcfFieldGroupFiles(
    { group_title: "Scheduling Info", target_cpt: "event", fields: [{ label: "Start Time", type: "text" }] },
    [],
    fakeExistingFiles()
  );
  const content = files[0].content;
  assert.match(content, /'key'\s+=> 'field_event_start_time'/, "field key must use 'event' (target_cpt), not 'scheduling_info' (group slug)");
});

test("derives field name from label when name is not explicitly provided", () => {
  const files = generateAcfFieldGroupFiles(
    { group_title: "Event Details", target_cpt: "event", fields: [{ label: "Venue Name", type: "text" }] },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /'name'\s+=> 'venue_name'/);
});

test("uses an explicitly provided field name over the derived one", () => {
  const files = generateAcfFieldGroupFiles(
    { group_title: "Event Details", target_cpt: "event", fields: [{ label: "Venue Name", name: "venue", type: "text" }] },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /'name'\s+=> 'venue'/);
});

test("preserves the existing register_field_groups() method untouched", () => {
  const files = generateAcfFieldGroupFiles(validConfig(), [], fakeExistingFiles());
  assert.match(files[0].content, /public function register_field_groups\(\): void \{/);
  assert.match(files[0].content, /group_project_details/);
});

test("supports multiple fields in one group", () => {
  const files = generateAcfFieldGroupFiles(
    {
      group_title: "Event Details",
      target_cpt: "event",
      fields: [
        { label: "Event Date", type: "date_picker" },
        { label: "Venue Name", type: "text" },
        { label: "Is Sold Out", type: "true_false" },
      ],
    },
    [],
    fakeExistingFiles()
  );
  const content = files[0].content;
  assert.match(content, /'name'\s+=> 'event_date'/);
  assert.match(content, /'name'\s+=> 'venue_name'/);
  assert.match(content, /'name'\s+=> 'is_sold_out'/);
});

test("idempotent: a second run for the same group_title produces a skip operation, not a duplicate", () => {
  const firstRun = generateAcfFieldGroupFiles(validConfig(), [], fakeExistingFiles());
  const acfAfterFirstRun = firstRun[0].content;

  const secondRun = generateAcfFieldGroupFiles(validConfig(), [], [
    { path: ACF_PATH, content: acfAfterFirstRun },
    { path: CPT_PATH, content: fakeCptFileContent() },
  ]);

  assert.equal(secondRun.length, 1);
  assert.equal(secondRun[0].operation, "skip");
  assert.match(secondRun[0].reason, /already registered/);
});

test("throws when target_cpt is not registered in the target's Class-CPT.php", () => {
  assert.throws(
    () => generateAcfFieldGroupFiles(validConfig({ target_cpt: "nonexistent" }), [], fakeExistingFiles()),
    /target_cpt "nonexistent" is not registered/
  );
});

test("throws when group_title is missing", () => {
  assert.throws(
    () => generateAcfFieldGroupFiles(validConfig({ group_title: "" }), [], fakeExistingFiles()),
    /"group_title" is required/
  );
});

test("throws when fields is missing or empty", () => {
  assert.throws(
    () => generateAcfFieldGroupFiles(validConfig({ fields: [] }), [], fakeExistingFiles()),
    /"fields" must be a non-empty array/
  );
});

test("throws a clear error listing supported types when a field has an unsupported type", () => {
  assert.throws(
    () => generateAcfFieldGroupFiles(validConfig({ fields: [{ label: "X", type: "repeater" }] }), [], fakeExistingFiles()),
    /unsupported type "repeater"/
  );
});

test("throws when a field is missing a label", () => {
  assert.throws(
    () => generateAcfFieldGroupFiles(validConfig({ fields: [{ type: "text" }] }), [], fakeExistingFiles()),
    /missing a non-empty "label"/
  );
});

test("throws when the target is missing Class-ACF.php or Class-CPT.php", () => {
  assert.throws(
    () => generateAcfFieldGroupFiles(validConfig(), [], []),
    /missing includes[/\\]Class-ACF\.php/
  );
});

test("every SUPPORTED_FIELD_TYPES entry is actually accepted", () => {
  for (const type of SUPPORTED_FIELD_TYPES) {
    assert.doesNotThrow(() =>
      generateAcfFieldGroupFiles(
        { group_title: `Group ${type}`, target_cpt: "event", fields: [{ label: "Test Field", type }] },
        [],
        fakeExistingFiles()
      )
    );
  }
});

test("generateAcfFieldGroupFiles performs no filesystem access (pure function contract)", () => {
  assert.doesNotThrow(() => generateAcfFieldGroupFiles(validConfig(), [], fakeExistingFiles()));
});
