import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTemplate } from "../framework/template-loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, "fixtures", "sample-template");

const PLACEHOLDERS = {
  PROJECT_NAME: "Acme Portal",
  TEXT_DOMAIN: "acme-portal",
  SLUG: "acme-portal",
  NAMESPACE: "AcmePortal",
};

test("loads all files recursively from a template directory", async () => {
  const files = await loadTemplate(FIXTURE_DIR, PLACEHOLDERS);
  const paths = files.map((f) => f.path);

  assert.ok(paths.includes("acme-portal.php"), "root file placeholder in filename should be substituted");
  assert.ok(paths.includes(path.join("includes", "Class-Activator.php")), "nested file should be included with its relative path");
});

test("substitutes placeholders inside file content", async () => {
  const files = await loadTemplate(FIXTURE_DIR, PLACEHOLDERS);
  const rootFile = files.find((f) => f.path === "acme-portal.php");

  assert.match(rootFile.content, /Plugin Name: Acme Portal/);
  assert.match(rootFile.content, /Text Domain: acme-portal/);
  assert.match(rootFile.content, /namespace AcmePortal;/);
  assert.doesNotMatch(rootFile.content, /__[A-Z_]+__/, "no placeholder tokens should remain");
});

test("substitutes placeholders inside nested file content using the correct namespace", async () => {
  const files = await loadTemplate(FIXTURE_DIR, PLACEHOLDERS);
  const nested = files.find((f) => f.path === path.join("includes", "Class-Activator.php"));

  assert.match(nested.content, /namespace AcmePortal\\Includes;/);
});

test("returns files in a stable, sorted order", async () => {
  const files = await loadTemplate(FIXTURE_DIR, PLACEHOLDERS);
  const paths = files.map((f) => f.path);
  const sorted = [...paths].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(paths, sorted);
});
