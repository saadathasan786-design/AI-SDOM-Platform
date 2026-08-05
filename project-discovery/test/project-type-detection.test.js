import { test } from "node:test";
import assert from "node:assert/strict";
import { detectProjectType, extractWordPressMetadata } from "../project-type-detection.js";

function file(p, content) {
  return { path: p, content };
}

// ---------------------------------------------------------------------
// Every project type
// ---------------------------------------------------------------------

test("detects wordpress-plugin from a Plugin Name header", () => {
  const files = [file("my-plugin.php", "<?php\n/**\n * Plugin Name: My Plugin\n */")];
  assert.equal(detectProjectType(files), "wordpress-plugin");
});

test("detects wordpress-theme from a Theme Name header", () => {
  const files = [file("style.css", "/*\nTheme Name: My Theme\n*/")];
  assert.equal(detectProjectType(files), "wordpress-theme");
});

test("detects wordpress-site from a wp-content directory", () => {
  const files = [file("wp-content/plugins/x/x.php", "<?php // plugin"), file("wp-config-sample.php", "<?php // config")];
  assert.equal(detectProjectType(files), "wordpress-site");
});

test("wordpress-site takes precedence over a plugin header found inside wp-content", () => {
  const files = [
    file("wp-content/plugins/x/x.php", "<?php\n/**\n * Plugin Name: X\n */"),
    file("wp-config-sample.php", "<?php"),
  ];
  assert.equal(detectProjectType(files), "wordpress-site");
});

test("detects generic-php from composer.json with no WordPress signals", () => {
  const files = [file("composer.json", '{"name":"vendor/pkg"}'), file("index.php", "<?php")];
  assert.equal(detectProjectType(files), "generic-php");
});

test("detects generic-js from package.json with no WordPress signals", () => {
  const files = [file("package.json", '{"name":"pkg"}'), file("index.js", "export const a = 1;")];
  assert.equal(detectProjectType(files), "generic-js");
});

test("detects mixed when both composer.json and package.json are present with no WordPress signals", () => {
  const files = [file("composer.json", '{"name":"php"}'), file("package.json", '{"name":"js"}')];
  assert.equal(detectProjectType(files), "mixed");
});

test("detects monorepo from 2+ independent sub-project manifests", () => {
  const files = [file("packages/a/package.json", '{"name":"a"}'), file("packages/b/package.json", '{"name":"b"}')];
  assert.equal(detectProjectType(files), "monorepo");
});

test("monorepo detection works with mixed composer.json/package.json sub-roots", () => {
  const files = [file("apps/php-app/composer.json", '{"name":"a"}'), file("apps/js-app/package.json", '{"name":"b"}')];
  assert.equal(detectProjectType(files), "monorepo");
});

test("detects unknown when no recognizable signals are present", () => {
  const files = [file("notes.txt", "just some notes")];
  assert.equal(detectProjectType(files), "unknown");
});

test("detects unknown for a completely empty sourceFiles array", () => {
  assert.equal(detectProjectType([]), "unknown");
});

// ---------------------------------------------------------------------
// Plugin / theme detection specifics
// ---------------------------------------------------------------------

test("plugin detection works even with a bare header line (no docblock asterisk prefix)", () => {
  const files = [file("plugin.php", "<?php\nPlugin Name: Bare Style Plugin\nVersion: 1.0")];
  assert.equal(detectProjectType(files), "wordpress-plugin");
});

test("theme detection also recognizes a Theme Name header inside a .php file", () => {
  const files = [file("functions.php", "<?php\n/**\n * Theme Name: PHP Theme File\n */")];
  assert.equal(detectProjectType(files), "wordpress-theme");
});

test("a single composer.json at the true root (not nested) does not trigger monorepo detection", () => {
  const files = [file("composer.json", '{"name":"pkg"}'), file("src/index.php", "<?php")];
  assert.equal(detectProjectType(files), "generic-php");
});

// ---------------------------------------------------------------------
// WordPress metadata extraction
// ---------------------------------------------------------------------

test("extracts pluginHeaders with all recognized fields", () => {
  const files = [
    file(
      "my-plugin.php",
      "<?php\n/**\n * Plugin Name: My Plugin\n * Version: 1.2.3\n * Text Domain: my-plugin\n * Author: Jane Doe\n * Requires at least: 5.8\n * Requires PHP: 7.4\n * License: GPLv2\n * Description: A test plugin.\n */"
    ),
  ];
  const metadata = extractWordPressMetadata(files);
  assert.deepEqual(metadata.pluginHeaders, {
    Name: "My Plugin",
    Version: "1.2.3",
    TextDomain: "my-plugin",
    Author: "Jane Doe",
    RequiresAtLeast: "5.8",
    RequiresPHP: "7.4",
    License: "GPLv2",
    Description: "A test plugin.",
  });
});

test("extracts themeHeaders similarly", () => {
  const files = [file("style.css", "/*\nTheme Name: My Theme\nVersion: 2.0.0\n*/")];
  const metadata = extractWordPressMetadata(files);
  assert.deepEqual(metadata.themeHeaders, { ThemeName: "My Theme", Version: "2.0.0" });
});

test("extracts wpContentRoot from the first file path containing wp-content", () => {
  const files = [file("wp-content/plugins/x/x.php", "<?php")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.wpContentRoot, "wp-content");
});

test("wpContentRoot is correct even when wp-content is nested deeper than the root", () => {
  const files = [file("site/wp-content/themes/y/style.css", "/* theme */")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.wpContentRoot, "site/wp-content");
});

test("does not populate pluginHeaders/themeHeaders/wpContentRoot when absent", () => {
  const files = [file("index.js", "export const a = 1;")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.pluginHeaders, undefined);
  assert.equal(metadata.themeHeaders, undefined);
  assert.equal(metadata.wpContentRoot, undefined);
});

// --- readme.txt ---

test("parses readme.txt header fields correctly, skipping the === Title === line and stopping at == Section ==", () => {
  const content = [
    "=== My Plugin ===",
    "Contributors: someone",
    "Requires at least: 5.8",
    "Stable tag: 1.2.3",
    "",
    "== Description ==",
    "Contributors: this-should-not-be-captured",
  ].join("\n");
  const files = [file("readme.txt", content)];
  const metadata = extractWordPressMetadata(files);
  assert.deepEqual(metadata.readmeHeaders, {
    Contributors: "someone",
    "Requires at least": "5.8",
    "Stable tag": "1.2.3",
  });
});

test("readme.txt detection is case-insensitive on filename", () => {
  const files = [file("README.txt", "=== X ===\nStable tag: 1.0.0")];
  const metadata = extractWordPressMetadata(files);
  assert.deepEqual(metadata.readmeHeaders, { "Stable tag": "1.0.0" });
});

test("does not populate readmeHeaders when no readme.txt exists", () => {
  const files = [file("index.php", "<?php")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.readmeHeaders, undefined);
});

// --- block.json ---

test("parses block.json files into structured objects, supporting multiple blocks", () => {
  const files = [
    file("blocks/a/block.json", '{"name":"plugin/a","version":"1.0.0"}'),
    file("blocks/b/block.json", '{"name":"plugin/b","version":"2.0.0"}'),
  ];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.blockJsonFiles.length, 2);
  assert.deepEqual(metadata.blockJsonFiles[0].content, { name: "plugin/a", version: "1.0.0" });
  assert.equal(typeof metadata.blockJsonFiles[0].content, "object");
});

test("does not populate blockJsonFiles when none exist", () => {
  const files = [file("index.js", "x")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.blockJsonFiles, undefined);
});

test("a malformed block.json is excluded from blockJsonFiles rather than crashing", () => {
  const files = [
    file("blocks/good/block.json", '{"name":"good"}'),
    file("blocks/bad/block.json", "{not valid json"),
  ];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.blockJsonFiles.length, 1);
  assert.deepEqual(metadata.blockJsonFiles[0].content, { name: "good" });
});

// --- composer.json / package.json ---

test("parses composer.json into a structured object, not raw text", () => {
  const files = [file("composer.json", '{"name":"vendor/pkg","require":{"php":">=7.4"}}')];
  const metadata = extractWordPressMetadata(files);
  assert.equal(typeof metadata.composerJson, "object");
  assert.deepEqual(metadata.composerJson, { name: "vendor/pkg", require: { php: ">=7.4" } });
});

test("parses package.json into a structured object, not raw text", () => {
  const files = [file("package.json", '{"name":"my-pkg","version":"1.0.0"}')];
  const metadata = extractWordPressMetadata(files);
  assert.deepEqual(metadata.packageJson, { name: "my-pkg", version: "1.0.0" });
});

test("when multiple composer.json files exist, the root-most one is used", () => {
  const files = [
    file("packages/sub/composer.json", '{"name":"sub"}'),
    file("composer.json", '{"name":"root"}'),
  ];
  const metadata = extractWordPressMetadata(files);
  assert.deepEqual(metadata.composerJson, { name: "root" });
});

// --- malformed JSON ---

test("malformed composer.json results in an absent composerJson field, not a thrown error", () => {
  const files = [file("composer.json", '{"name": "broken", invalid json')];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.composerJson, undefined);
});

test("malformed package.json results in an absent packageJson field, not a thrown error", () => {
  const files = [file("package.json", "not json at all {{{")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.packageJson, undefined);
});

test("a malformed manifest does not prevent a valid sibling manifest from being parsed", () => {
  const files = [file("composer.json", "broken {{{"), file("package.json", '{"valid":true}')];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.composerJson, undefined);
  assert.deepEqual(metadata.packageJson, { valid: true });
});

// ---------------------------------------------------------------------
// Missing metadata / false-positive prevention
// ---------------------------------------------------------------------

test("a generic JS project produces no WordPress-specific metadata fields (only the generic packageJson)", () => {
  const files = [file("package.json", '{"name":"pkg"}'), file("index.js", "export const a = 1;")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.pluginHeaders, undefined);
  assert.equal(metadata.themeHeaders, undefined);
  assert.equal(metadata.wpContentRoot, undefined);
  assert.equal(metadata.readmeHeaders, undefined);
  assert.equal(metadata.blockJsonFiles, undefined);
  assert.deepEqual(metadata.packageJson, { name: "pkg" });
});

test("false-positive prevention: a comment mentioning 'Plugin Name' in prose, not as a real header line, does not trigger plugin detection", () => {
  const files = [file("notes.md", "This file talks about Plugin Name conventions but is not a real header.")];
  const metadata = extractWordPressMetadata(files);
  assert.equal(metadata.pluginHeaders, undefined);
});

test("extractWordPressMetadata returns an empty object (not undefined) when nothing is found", () => {
  const metadata = extractWordPressMetadata([file("notes.txt", "nothing relevant here")]);
  assert.deepEqual(metadata, {});
});

// ---------------------------------------------------------------------
// Never-throws contract
// ---------------------------------------------------------------------

test("never throws: detectProjectType handles an empty array", () => {
  assert.doesNotThrow(() => detectProjectType([]));
});

test("never throws: extractWordPressMetadata handles an empty array", () => {
  assert.doesNotThrow(() => extractWordPressMetadata([]));
});

test("never throws: extremely malformed JSON content across every JSON-parsed field", () => {
  const files = [
    file("composer.json", "{{{{{"),
    file("package.json", "}}}}}"),
    file("blocks/x/block.json", "null but not really"),
  ];
  assert.doesNotThrow(() => extractWordPressMetadata(files));
});
