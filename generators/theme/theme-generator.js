/**
 * Theme Generator — Stage 3D.
 *
 * Treats `theme-boilerplate/` (repo root) as the single source of truth,
 * same pattern as the Plugin Generator (3B): `templateDir` points directly
 * at the real folder, the executor reads it fresh on every run, and this
 * file's `generate()` is a pure find/replace over already-loaded content —
 * no filesystem access here at all.
 *
 * Structurally simpler than the Plugin Generator:
 * - No PHP namespace / Composer / PSR-4 — WP themes in this boilerplate
 *   are procedural, collision-avoided via prefixed constants only. So
 *   there's no `vendor_name` config field and no namespace derivation.
 * - No main-file-to-rename. WordPress identifies a theme by its folder
 *   (wherever the caller points `outputDir`) plus `style.css`, not by a
 *   specific PHP filename the way a plugin's main file matters. So every
 *   file path from theme-boilerplate/ passes through unchanged.
 *
 * Token replacement order matters here (unlike the Plugin Generator, where
 * every token happened to be non-overlapping): "boilerplate" (bare,
 * lowercase) is a literal substring of "boilerplate-theme" and
 * "boilerplate-style"/"boilerplate-main". More specific tokens are
 * replaced first so the bare-word replacement only catches what's left
 * (enqueue handles, block pattern category slug) — see the ordered list
 * in generateThemeFiles() below.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { toSlug } from "../framework/slug-generator.js";
import { toTextDomain } from "../framework/text-domain-manager.js";
import { validateSlug, validateTextDomain, validateProjectName } from "../framework/naming-validator.js";
import { toConstantCase } from "../framework/constant-case-manager.js";
import { VARIABLE_MANIFEST } from "./variable-manifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEME_BOILERPLATE_DIR = path.join(__dirname, "..", "..", "theme-boilerplate");

export function generateThemeFiles(config, templateFiles) {
  const projectNameCheck = validateProjectName(config.project_name);
  if (!projectNameCheck.valid) {
    throw new Error(`Cannot generate theme: ${projectNameCheck.reason}`);
  }

  const projectName = config.project_name;
  const author = config.author || "Your Name";
  const themeUri = config.theme_uri || "https://example.com";

  const textDomain = toTextDomain(projectName);
  const slug = toSlug(projectName);
  const constantPrefix = toConstantCase(projectName);

  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) {
    throw new Error(`Cannot generate theme: derived slug is invalid — ${slugCheck.reason}`);
  }
  const domainCheck = validateTextDomain(textDomain);
  if (!domainCheck.valid) {
    throw new Error(`Cannot generate theme: derived text domain is invalid — ${domainCheck.reason}`);
  }
  if (!constantPrefix) {
    throw new Error(`Cannot generate theme: "${projectName}" produced an empty constant prefix.`);
  }

  // Order is significant — see file header. Most specific / longest
  // literal strings first, so the later bare-word tokens only consume
  // what genuinely remains.
  const replacements = [
    ["BOILERPLATE_THEME", constantPrefix],
    ["boilerplate-theme", textDomain],
    ["Boilerplate Theme", projectName],
    ["boilerplate", slug],
    ["Boilerplate", projectName],
    ["Your Name", author],
    ["https://example.com", themeUri],
  ];

  function applyReplacements(str) {
    let out = str;
    for (const [find, replaceWith] of replacements) {
      out = out.split(find).join(replaceWith);
    }
    return out;
  }

  // No file renaming — see file header. theme-boilerplate/ has no
  // "main file" convention the way plugin-boilerplate.php does.
  return templateFiles.map((file) => ({
    path: file.path,
    content: applyReplacements(file.content),
  }));
}

export const themeGenerator = {
  id: "theme",
  name: "Theme Generator",
  version: "1.0.0",
  category: "theme",
  description:
    "Scaffolds a new WordPress block (FSE) theme from theme-boilerplate/ (the project's " +
    "single source of truth for theme structure: setup, enqueue, security and performance " +
    "defaults, block templates/parts).",
  supportedOutputs: ["wp-theme"],
  minimumFrameworkVersion: "1.0.0",
  variableManifest: VARIABLE_MANIFEST,
  configSchema: {
    fields: [
      {
        name: "project_name",
        type: "string",
        required: true,
        description: "Human-readable theme name, e.g. 'Acme Portal'.",
      },
      {
        name: "author",
        type: "string",
        required: false,
        default: "Your Name",
        description: "Theme author shown in the style.css header.",
      },
      {
        name: "theme_uri",
        type: "string",
        required: false,
        default: "https://example.com",
        description: "Theme URI and Author URI shown in the style.css header.",
      },
    ],
  },
  templateDir: THEME_BOILERPLATE_DIR,
  generate: generateThemeFiles,
};

export { VARIABLE_MANIFEST };
