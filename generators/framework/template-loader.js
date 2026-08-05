/**
 * Template Loader — reads a template directory recursively and returns a
 * flat list of { path, content } with placeholders substituted, in both
 * file/folder names and file contents.
 *
 * Placeholder syntax: __TOKEN__ (double underscore, matches the convention
 * WordPress scaffolds commonly use, e.g. WP_Widget boilerplates). A file
 * named "__SLUG__.php" with placeholders = { SLUG: "my-plugin" } becomes
 * "my-plugin.php". This is a plain string substitution engine — no logic,
 * no conditionals, no loops. If a generator needs more than substitution,
 * that belongs in the generator's own `generate()` function building the
 * file list programmatically, not in this loader.
 */

import fs from "node:fs/promises";
import path from "node:path";

function applyPlaceholders(input, placeholders) {
  let out = input;
  for (const [key, value] of Object.entries(placeholders)) {
    out = out.split(`__${key}__`).join(String(value));
  }
  return out;
}

/**
 * @param {string} templateDir - absolute path to the template's root folder
 * @param {Record<string,string>} placeholders - token -> replacement value
 * @returns {Promise<{path: string, content: string}[]>}
 */
export async function loadTemplate(templateDir, placeholders = {}) {
  const files = [];

  async function walk(currentDir, relBase) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(currentDir, entry.name);
      const relName = applyPlaceholders(entry.name, placeholders);
      const relPath = relBase ? path.join(relBase, relName) : relName;

      if (entry.isDirectory()) {
        await walk(absPath, relPath);
      } else {
        const raw = await fs.readFile(absPath, "utf8");
        files.push({ path: relPath, content: applyPlaceholders(raw, placeholders) });
      }
    }
  }

  await walk(templateDir, "");
  // Stable order regardless of filesystem readdir ordering.
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}
