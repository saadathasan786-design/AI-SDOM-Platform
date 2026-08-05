/**
 * Plugin Generator — Stage 3B.
 *
 * Treats `plugin-boilerplate/` (repo root) as the single source of truth.
 * No copy of it exists anywhere under generators/ — this definition's
 * `templateDir` points directly at the real folder, and the executor reads
 * it fresh on every run (see executor.js's templateDir handling). If
 * plugin-boilerplate/ changes, every future generation immediately reflects
 * that change with zero edits needed here.
 *
 * plugin-boilerplate/ doesn't use __TOKEN__ placeholders — it's real,
 * working code with its own literal identifiers (namespace
 * "Boilerplate\Plugin", text domain "boilerplate-plugin", constant prefix
 * "BOILERPLATE_PLUGIN", etc). This generator's job is simply: find those
 * exact literal strings, replace them with values derived from config.
 * That's `generatePluginFiles()` below — pure, no filesystem access; the
 * executor already loaded the raw file contents before calling it.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { toSlug } from "../framework/slug-generator.js";
import { buildPsr4Namespace } from "../framework/namespace-manager.js";
import { toTextDomain } from "../framework/text-domain-manager.js";
import { validateSlug, validateTextDomain, validateProjectName } from "../framework/naming-validator.js";
import { toConstantCase, toOptionCase } from "../framework/constant-case-manager.js";
import { VARIABLE_MANIFEST } from "./variable-manifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_BOILERPLATE_DIR = path.join(__dirname, "..", "..", "plugin-boilerplate");

const MAIN_FILE_NAME = "plugin-boilerplate.php";

/**
 * Pure transform: given config and the already-loaded raw template files
 * (read by the executor, never by this function), return the final file
 * list to write. No filesystem access here.
 */
export function generatePluginFiles(config, templateFiles) {
  const projectNameCheck = validateProjectName(config.project_name);
  if (!projectNameCheck.valid) {
    throw new Error(`Cannot generate plugin: ${projectNameCheck.reason}`);
  }

  const projectName = config.project_name;
  const vendorName = config.vendor_name || "Vendor";
  const author = config.author || "Your Name";
  const pluginUri = config.plugin_uri || "https://example.com";

  const textDomain = toTextDomain(projectName);
  const slug = toSlug(projectName);
  const vendorSlug = toSlug(vendorName);
  const constantPrefix = toConstantCase(projectName);
  const optionPrefix = toOptionCase(projectName);

  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) {
    throw new Error(`Cannot generate plugin: derived slug is invalid — ${slugCheck.reason}`);
  }
  const domainCheck = validateTextDomain(textDomain);
  if (!domainCheck.valid) {
    throw new Error(`Cannot generate plugin: derived text domain is invalid — ${domainCheck.reason}`);
  }
  if (!constantPrefix) {
    throw new Error(`Cannot generate plugin: "${projectName}" produced an empty constant prefix.`);
  }

  let namespace;
  try {
    namespace = buildPsr4Namespace(vendorName, projectName);
  } catch (err) {
    throw new Error(`Cannot generate plugin: ${err.message}`);
  }

  // Order doesn't matter here — every token is a distinct literal string
  // (differing in case, separators, or punctuation), so none is a
  // substring of another's *search* pattern. See VARIABLE_MANIFEST for the
  // full documented list this must stay in sync with.
  const replacements = [
    ["Boilerplate\\Plugin", namespace],
    ["BOILERPLATE_PLUGIN", constantPrefix],
    ["boilerplate_plugin", optionPrefix],
    ["boilerplate-plugin", textDomain],
    ["Boilerplate Plugin", projectName],
    ["yourname", vendorSlug],
    ["Your Name", author],
    ["https://example.com", pluginUri],
    // Stage 3G fix: the REST API class's namespace constant was never
    // being renamed, so every generated plugin shared the identical
    // 'boilerplate/v1' REST namespace regardless of project name — a real
    // collision risk across multiple generated plugins on one site, and
    // the thing the REST API Generator's "detect existing namespace" step
    // needs to be meaningful. Defaults the namespace to the plugin's own
    // text domain + '/v1', matching WP REST convention.
    ["boilerplate/v1", `${textDomain}/v1`],
  ];

  function applyReplacements(str) {
    let out = str;
    for (const [find, replaceWith] of replacements) {
      out = out.split(find).join(replaceWith);
    }
    return out;
  }

  return templateFiles.map((file) => ({
    path: file.path === MAIN_FILE_NAME ? `${slug}.php` : file.path,
    content: applyReplacements(file.content),
  }));
}

export const pluginGenerator = {
  id: "plugin",
  name: "Plugin Generator",
  version: "1.0.0",
  category: "plugin",
  description:
    "Scaffolds a new WordPress plugin from plugin-boilerplate/ (the project's single " +
    "source of truth for plugin structure: CPT, taxonomy, ACF integration, REST API, " +
    "activation/deactivation hooks).",
  supportedOutputs: ["php-plugin"],
  minimumFrameworkVersion: "1.0.0",
  variableManifest: VARIABLE_MANIFEST,
  configSchema: {
    fields: [
      {
        name: "project_name",
        type: "string",
        required: true,
        description: "Human-readable plugin name, e.g. 'Acme Client Portal'.",
      },
      {
        name: "vendor_name",
        type: "string",
        required: false,
        default: "Vendor",
        description: "Vendor/agency name — used in the PSR-4 namespace and composer vendor segment.",
      },
      {
        name: "author",
        type: "string",
        required: false,
        default: "Your Name",
        description: "Plugin author shown in the plugin header.",
      },
      {
        name: "plugin_uri",
        type: "string",
        required: false,
        default: "https://example.com",
        description: "Plugin URI shown in the plugin header.",
      },
    ],
  },
  templateDir: PLUGIN_BOILERPLATE_DIR,
  generate: generatePluginFiles,
};

export { VARIABLE_MANIFEST };
