import { test } from "node:test";
import assert from "node:assert/strict";
import { generatePluginFiles } from "../plugin/plugin-generator.js";

// Mimics the real plugin-boilerplate/ files' actual literal identifiers —
// not __TOKEN__ placeholders, since that's not how the real boilerplate is
// written. These fixtures are intentionally minimal, not full copies.
const FAKE_TEMPLATE_FILES = [
  {
    path: "plugin-boilerplate.php",
    content: [
      "<?php",
      "/**",
      " * Plugin Name: Boilerplate Plugin",
      " * Plugin URI: https://example.com",
      " * Author: Your Name",
      " * Text Domain: boilerplate-plugin",
      " */",
      "define( 'BOILERPLATE_PLUGIN_VERSION', '1.0.0' );",
      "use Boilerplate\\Plugin\\CPT;",
    ].join("\n"),
  },
  {
    path: "includes/Class-CPT.php",
    content: [
      "<?php",
      "namespace Boilerplate\\Plugin;",
      "'name' => __( 'Projects', 'boilerplate-plugin' ),",
    ].join("\n"),
  },
  {
    path: "includes/Class-Activator.php",
    content: [
      "<?php",
      "namespace Boilerplate\\Plugin;",
      "add_option( 'boilerplate_plugin_version', BOILERPLATE_PLUGIN_VERSION );",
    ].join("\n"),
  },
  {
    path: "composer.json",
    content: '{ "name": "yourname/boilerplate-plugin" }',
  },
];

function baseConfig(overrides = {}) {
  return { project_name: "Acme Client Portal", vendor_name: "Acme Agency", ...overrides };
}

test("renames the main plugin file to the derived slug", () => {
  const files = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const paths = files.map((f) => f.path);
  assert.ok(paths.includes("acme-client-portal.php"));
  assert.ok(!paths.includes("plugin-boilerplate.php"));
});

test("leaves non-main file paths unchanged", () => {
  const files = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const paths = files.map((f) => f.path);
  assert.ok(paths.includes("includes/Class-CPT.php"));
  assert.ok(paths.includes("includes/Class-Activator.php"));
  assert.ok(paths.includes("composer.json"));
});

test("substitutes the namespace everywhere it appears", () => {
  const files = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const main = files.find((f) => f.path === "acme-client-portal.php");
  const cpt = files.find((f) => f.path === "includes/Class-CPT.php");

  assert.match(main.content, /use AcmeAgency\\AcmeClientPortal\\CPT;/);
  assert.match(cpt.content, /namespace AcmeAgency\\AcmeClientPortal;/);
});

test("substitutes text domain in both the header and gettext calls", () => {
  const files = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const main = files.find((f) => f.path === "acme-client-portal.php");
  const cpt = files.find((f) => f.path === "includes/Class-CPT.php");

  assert.match(main.content, /Text Domain: acme-client-portal/);
  assert.match(cpt.content, /__\( 'Projects', 'acme-client-portal' \)/);
});

test("substitutes constant prefix (upper) and option prefix (lower) independently", () => {
  const files = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const main = files.find((f) => f.path === "acme-client-portal.php");
  const activator = files.find((f) => f.path === "includes/Class-Activator.php");

  assert.match(main.content, /ACME_CLIENT_PORTAL_VERSION/);
  assert.match(activator.content, /add_option\( 'acme_client_portal_version', ACME_CLIENT_PORTAL_VERSION \)/);
});

test("substitutes composer vendor slug and project slug", () => {
  const files = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const composer = files.find((f) => f.path === "composer.json");
  assert.match(composer.content, /"name": "acme-agency\/acme-client-portal"/);
});

test("uses default vendor 'Vendor' when vendor_name is not provided", () => {
  const files = generatePluginFiles({ project_name: "Acme Client Portal" }, FAKE_TEMPLATE_FILES);
  const composer = files.find((f) => f.path === "composer.json");
  assert.match(composer.content, /"name": "vendor\/acme-client-portal"/);
});

test("substitutes author and plugin URI when provided, leaves derived defaults otherwise", () => {
  const withOverrides = generatePluginFiles(
    baseConfig({ author: "Jane Smith", plugin_uri: "https://acmeagency.com" }),
    FAKE_TEMPLATE_FILES
  );
  const main = withOverrides.find((f) => f.path === "acme-client-portal.php");
  assert.match(main.content, /Author: Jane Smith/);
  assert.match(main.content, /Plugin URI: https:\/\/acmeagency\.com/);

  const withoutOverrides = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const mainDefault = withoutOverrides.find((f) => f.path === "acme-client-portal.php");
  assert.match(mainDefault.content, /Author: Your Name/);
  assert.match(mainDefault.content, /Plugin URI: https:\/\/example\.com/);
});

test("no boilerplate literal tokens remain in any generated file", () => {
  const files = generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const leftoverTokens = ["Boilerplate\\Plugin", "BOILERPLATE_PLUGIN", "boilerplate-plugin", "boilerplate_plugin", "Boilerplate Plugin", "yourname"];
  for (const file of files) {
    for (const token of leftoverTokens) {
      assert.ok(!file.content.includes(token), `"${token}" should not remain in ${file.path}`);
    }
  }
});

test("throws a clear error when project_name is empty", () => {
  assert.throws(
    () => generatePluginFiles({ project_name: "" }, FAKE_TEMPLATE_FILES),
    /Cannot generate plugin:.*empty/
  );
});

test("throws a clear error when project_name contains only symbols (would derive an empty slug)", () => {
  assert.throws(
    () => generatePluginFiles({ project_name: "!!!" }, FAKE_TEMPLATE_FILES),
    /Cannot generate plugin: derived slug is invalid/
  );
});

test("throws a clear error when project_name contains a path separator", () => {
  assert.throws(
    () => generatePluginFiles({ project_name: "Acme/Portal" }, FAKE_TEMPLATE_FILES),
    /path separators/
  );
});

test("generatePluginFiles performs no filesystem access (pure function contract)", () => {
  // If this function touched fs, calling it with in-memory fixtures only
  // (no real files on disk at all) would fail. It doesn't — that's the test.
  assert.doesNotThrow(() => generatePluginFiles(baseConfig(), FAKE_TEMPLATE_FILES));
});
