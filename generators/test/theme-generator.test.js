import { test } from "node:test";
import assert from "node:assert/strict";
import { generateThemeFiles } from "../theme/theme-generator.js";

// Mimics the real theme-boilerplate/ files' actual literal identifiers.
const FAKE_TEMPLATE_FILES = [
  {
    path: "style.css",
    content: [
      "/*",
      "Theme Name: Boilerplate Theme",
      "Theme URI: https://example.com",
      "Author: Your Name",
      "Author URI: https://example.com",
      "Text Domain: boilerplate-theme",
      "*/",
    ].join("\n"),
  },
  {
    path: "functions.php",
    content: [
      "<?php",
      "/**",
      " * Boilerplate Theme functions and definitions.",
      " */",
      "define( 'BOILERPLATE_THEME_VERSION', '1.0.0' );",
      "define( 'BOILERPLATE_THEME_DIR', get_template_directory() );",
    ].join("\n"),
  },
  {
    path: "inc/enqueue.php",
    content: [
      "<?php",
      "wp_enqueue_style( 'boilerplate-style', BOILERPLATE_THEME_URI . '/style.css' );",
      "wp_enqueue_script( 'boilerplate-main', BOILERPLATE_THEME_URI . '/assets/js/main.js' );",
    ].join("\n"),
  },
  {
    path: "inc/setup.php",
    content: [
      "<?php",
      "register_block_pattern_category( 'boilerplate', array(",
      "\t'label' => __( 'Boilerplate', 'boilerplate-theme' ),",
      ") );",
    ].join("\n"),
  },
  {
    path: "parts/footer.html",
    content: '<p>© Boilerplate Theme. All rights reserved.</p>',
  },
];

function baseConfig(overrides = {}) {
  return { project_name: "Acme Portal", ...overrides };
}

test("does not rename any file paths (themes have no main-file convention)", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const paths = files.map((f) => f.path).sort();
  assert.deepEqual(paths, ["functions.php", "inc/enqueue.php", "inc/setup.php", "parts/footer.html", "style.css"]);
});

test("substitutes theme name in style.css and functions.php docblock", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const style = files.find((f) => f.path === "style.css");
  const fns = files.find((f) => f.path === "functions.php");

  assert.match(style.content, /Theme Name: Acme Portal/);
  assert.match(fns.content, /Acme Portal functions and definitions\./);
});

test("substitutes text domain in style.css header", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const style = files.find((f) => f.path === "style.css");
  assert.match(style.content, /Text Domain: acme-portal/);
});

test("substitutes constant prefix consistently across multiple constants", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const fns = files.find((f) => f.path === "functions.php");
  const enqueue = files.find((f) => f.path === "inc/enqueue.php");

  assert.match(fns.content, /ACME_PORTAL_VERSION/);
  assert.match(fns.content, /ACME_PORTAL_DIR/);
  assert.match(enqueue.content, /ACME_PORTAL_URI/);
});

test("substitutes bare slug in enqueue handles and block pattern category slug, without over-matching the constant prefix", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const enqueue = files.find((f) => f.path === "inc/enqueue.php");
  const setup = files.find((f) => f.path === "inc/setup.php");

  assert.match(enqueue.content, /'acme-portal-style'/);
  assert.match(enqueue.content, /'acme-portal-main'/);
  assert.match(setup.content, /register_block_pattern_category\( 'acme-portal'/);
});

test("substitutes the bare capitalized pattern-category label with the project name", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const setup = files.find((f) => f.path === "inc/setup.php");
  assert.match(setup.content, /__\( 'Acme Portal', 'acme-portal' \)/);
});

test("substitutes the footer copyright line", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const footer = files.find((f) => f.path === "parts/footer.html");
  assert.match(footer.content, /© Acme Portal\. All rights reserved\./);
});

test("substitutes author and theme URI when provided, uses defaults otherwise", () => {
  const withOverrides = generateThemeFiles(
    baseConfig({ author: "Jane Smith", theme_uri: "https://acmeagency.com" }),
    FAKE_TEMPLATE_FILES
  );
  const style = withOverrides.find((f) => f.path === "style.css");
  assert.match(style.content, /Author: Jane Smith/);
  assert.match(style.content, /Theme URI: https:\/\/acmeagency\.com/);
  assert.match(style.content, /Author URI: https:\/\/acmeagency\.com/);

  const withDefaults = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const styleDefault = withDefaults.find((f) => f.path === "style.css");
  assert.match(styleDefault.content, /Author: Your Name/);
});

test("no boilerplate literal tokens remain in any generated file", () => {
  const files = generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES);
  const leftoverTokens = ["BOILERPLATE_THEME", "boilerplate-theme", "Boilerplate Theme", "boilerplate", "Boilerplate"];
  for (const file of files) {
    for (const token of leftoverTokens) {
      assert.ok(!file.content.includes(token), `"${token}" should not remain in ${file.path}`);
    }
  }
});

test("throws a clear error when project_name is empty", () => {
  assert.throws(
    () => generateThemeFiles({ project_name: "" }, FAKE_TEMPLATE_FILES),
    /Cannot generate theme:.*empty/
  );
});

test("throws a clear error when project_name contains only symbols", () => {
  assert.throws(
    () => generateThemeFiles({ project_name: "!!!" }, FAKE_TEMPLATE_FILES),
    /Cannot generate theme: derived slug is invalid/
  );
});

test("generateThemeFiles performs no filesystem access (pure function contract)", () => {
  assert.doesNotThrow(() => generateThemeFiles(baseConfig(), FAKE_TEMPLATE_FILES));
});
