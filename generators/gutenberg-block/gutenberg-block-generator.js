/**
 * Gutenberg Block Generator — Stage 3I.
 *
 * Same hybrid shape as the Elementor Widget Generator (3H): SCAFFOLDS new
 * block source files from `gutenberg-block-boilerplate/` (declares
 * `templateDir`) AND INJECTS server-side registration into the target
 * plugin (declares `analyzeOutputDir`). Reuses the now-promoted
 * `main-file-injector.js` helpers directly — no duplication, since this is
 * exactly the second real consumer that justified that promotion.
 *
 * IMPORTANT SCOPE BOUNDARY: this generator only ever produces SOURCE files
 * (block.json, package.json, src/*.js, src/*.scss). It never runs `npm
 * install` or any build command, and never fabricates `build/` output —
 * `block.json` references `file:./build/index.js` etc exactly as the
 * source boilerplate does; those files simply don't exist until the
 * developer runs the existing `wp-scripts build` workflow themselves. This
 * generator has no shell-execution capability at all — nothing in the
 * framework does — so this isn't a constraint being worked around, it's
 * the correct, intentional scope (see the Stage 3I build-tooling
 * evaluation in docs/GUTENBERG-BLOCK-GENERATOR.md for why no framework
 * change was needed here either).
 *
 * block.json and package.json are real JSON — parsed and mutated directly
 * rather than string-token-replaced, which is more robust than the
 * find/replace approach every other generator uses for its non-JSON files
 * (no risk of a token accidentally matching inside an unrelated string).
 * src/*.js and src/*.scss still use string substitution for the "testimonial"
 * root CSS class, since those aren't structured data.
 *
 * Following the same established discipline as every prior generator:
 * attribute/field names (`quote`, `author`) are NOT renamed or redesigned
 * — only block-level identity (namespace/slug/title/description/category/
 * icon/textdomain) and the CSS class root change. Redesigning the actual
 * edit/save UI into a "generic" block would contradict "use the existing
 * boilerplate as the single source of truth."
 */

import path from "node:path";
import { toSlug } from "../framework/slug-generator.js";
import { toForwardSlashes } from "../framework/path-utils.js";
import { validateProjectName } from "../framework/naming-validator.js";
import { insertBeforeMethodClose, insertMethodBeforeClassClose } from "../framework/php-class-injector.js";
import {
  findMainPluginFile,
  detectPluginConstants,
  insertRequireIntoFallbackBlock,
  insertUseStatement,
  insertIntoBootstrap,
} from "../framework/main-file-injector.js";
import { VARIABLE_MANIFEST } from "./variable-manifest.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOCK_TEMPLATE_DIR = path.join(__dirname, "..", "..", "gutenberg-block-boilerplate");

const BLOCKS_CLASS_PATH = path.join("includes", "Class-Blocks.php");
const REGISTER_BLOCKS_MARKER = "public function register_blocks(): void {";

function buildBlockJson(templateContent, { namespace, slug, title, description, category, icon, textDomain, keywords, supports }) {
  const parsed = JSON.parse(templateContent);
  parsed.name = `${namespace}/${slug}`;
  parsed.title = title;
  parsed.description = description;
  parsed.category = category;
  parsed.icon = icon;
  parsed.textdomain = textDomain;
  parsed.supports = supports;
  if (keywords.length > 0) {
    parsed.keywords = keywords;
  }
  // Rewrite attribute selectors from the boilerplate's ".testimonial__x"
  // to the new slug's root class, same rename applied to the JS/SCSS files.
  const rewritten = JSON.stringify(parsed, null, 2).split("testimonial").join(slug);
  return rewritten + "\n";
}

function buildPackageJson(templateContent, { namespace, slug }) {
  const parsed = JSON.parse(templateContent);
  parsed.name = `${namespace}-${slug}-block`;
  return JSON.stringify(parsed, null, 2) + "\n";
}

function buildFreshBlocksClass({ namespace, blockDirRelPath }) {
  return (
    `<?php\n` +
    `namespace ${namespace};\n\n` +
    `if ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n\n` +
    `/**\n * Registers custom Gutenberg blocks.\n */\n` +
    `class Blocks {\n\n` +
    `\tpublic function register(): void {\n` +
    `\t\tadd_action( 'init', array( $this, 'register_blocks' ) );\n` +
    `\t}\n\n` +
    `\t${REGISTER_BLOCKS_MARKER}\n` +
    `\t\tregister_block_type( __DIR__ . '/../${toForwardSlashes(blockDirRelPath)}' );\n` +
    `\t}\n` +
    `}\n`
  );
}

function buildRegisterBlockLine(blockDirRelPath) {
  return `register_block_type( __DIR__ . '/../${toForwardSlashes(blockDirRelPath)}' );`;
}

/**
 * Pure transform: given config, the loaded block template files, and the
 * target project's existing files (both read by the executor), return the
 * files to write/inject. No filesystem access, and NO build/npm execution,
 * here or anywhere in this generator.
 */
export function generateGutenbergBlockFiles(config, templateFiles, existingFiles) {
  const nameCheck = validateProjectName(config.block_name);
  if (!nameCheck.valid) {
    throw new Error(`Cannot generate block: ${nameCheck.reason}`);
  }

  const title = config.title || config.block_name;
  const description = config.description || "A custom block.";
  const category = config.category || "widgets";
  const icon = config.icon || "block-default";
  const keywords = config.keywords ?? [];
  const supports = config.supports ?? { html: false };
  const slug = config.slug || toSlug(config.block_name);

  if (!slug) {
    throw new Error(`Cannot generate block: "${config.block_name}" produced an empty slug.`);
  }

  const mainFile = findMainPluginFile(existingFiles);
  if (!mainFile) {
    throw new Error(
      "Cannot inject block: could not find the target's main plugin file (a root-level file " +
        "with a 'Plugin Name:' docblock). This generator targets plugins produced by this " +
        "framework's Plugin Generator (Stage 3B) — is outputDir pointed at one?"
    );
  }

  const { constantPrefix, namespace, textDomain } = detectPluginConstants(mainFile.content);
  if (!constantPrefix || !namespace || !textDomain) {
    throw new Error(
      "Cannot inject block: could not detect the target's constant prefix, namespace, or text " +
        "domain from its main plugin file."
    );
  }

  const blockNamespace = config.namespace || textDomain;
  const blockDirRelPath = path.join("blocks", slug);
  const blockJsonPath = path.join(blockDirRelPath, "block.json");

  const alreadyExists = (existingFiles ?? []).some((f) => f.path === blockJsonPath);
  if (alreadyExists) {
    return [
      {
        path: blockJsonPath,
        operation: "skip",
        reason: `Block "${slug}" already exists at ${toForwardSlashes(blockDirRelPath)} — nothing to do.`,
      },
    ];
  }

  const findTemplate = (relPath) => {
    const file = (templateFiles ?? []).find((f) => f.path === relPath);
    if (!file) throw new Error(`Cannot generate block: template file "${relPath}" not found.`);
    return file;
  };

  const blockJsonContent = buildBlockJson(findTemplate("block.json").content, {
    namespace: blockNamespace,
    slug,
    title,
    description,
    category,
    icon,
    textDomain,
    keywords,
    supports,
  });
  const packageJsonContent = buildPackageJson(findTemplate("package.json").content, {
    namespace: blockNamespace,
    slug,
  });
  const indexJsContent = findTemplate(path.join("src", "index.js")).content.split("testimonial").join(slug);
  const editJsContent = findTemplate(path.join("src", "edit.js")).content.split("testimonial").join(slug);
  const saveJsContent = findTemplate(path.join("src", "save.js")).content.split("testimonial").join(slug);
  const styleScssContent = findTemplate(path.join("src", "style.scss")).content.split("testimonial").join(slug);

  const files = [
    { path: blockJsonPath, content: blockJsonContent, operation: "create" },
    { path: path.join(blockDirRelPath, "package.json"), content: packageJsonContent, operation: "create" },
    { path: path.join(blockDirRelPath, "src", "index.js"), content: indexJsContent, operation: "create" },
    { path: path.join(blockDirRelPath, "src", "edit.js"), content: editJsContent, operation: "create" },
    { path: path.join(blockDirRelPath, "src", "save.js"), content: saveJsContent, operation: "create" },
    { path: path.join(blockDirRelPath, "src", "style.scss"), content: styleScssContent, operation: "create" },
  ];

  const blocksFile = (existingFiles ?? []).find((f) => f.path === BLOCKS_CLASS_PATH);

  if (blocksFile) {
    // Second+ block: inject into the existing Class-Blocks.php.
    const withInjection = insertBeforeMethodClose(
      blocksFile.content,
      REGISTER_BLOCKS_MARKER,
      buildRegisterBlockLine(blockDirRelPath)
    );
    files.push({ path: BLOCKS_CLASS_PATH, content: withInjection, operation: "modify" });
  } else {
    // First block: create Class-Blocks.php AND wire it into the main plugin file.
    files.push({
      path: BLOCKS_CLASS_PATH,
      content: buildFreshBlocksClass({ namespace, blockDirRelPath }),
      operation: "create",
    });

    let mainFileContent = insertRequireIntoFallbackBlock(mainFile.content, constantPrefix, "includes/Class-Blocks.php");
    mainFileContent = insertUseStatement(mainFileContent, namespace, "Blocks");
    mainFileContent = insertIntoBootstrap(mainFileContent, "( new Blocks() )->register();");

    files.push({ path: mainFile.path, content: mainFileContent, operation: "modify" });
  }

  return files;
}

export const gutenbergBlockGenerator = {
  id: "gutenberg-block",
  name: "Gutenberg Block Generator",
  version: "1.0.0",
  category: "capability",
  description:
    "Scaffolds a new Gutenberg block (block.json + package.json + src/*.js) from " +
    "gutenberg-block-boilerplate/ and automatically registers it server-side inside an EXISTING " +
    "plugin generated by the Plugin Generator. Generates source files only — never runs npm " +
    "install or a build command.",
  supportedOutputs: ["gutenberg-block"],
  minimumFrameworkVersion: "1.1.0",
  variableManifest: VARIABLE_MANIFEST,
  templateDir: BLOCK_TEMPLATE_DIR,
  analyzeOutputDir: true,
  configSchema: {
    fields: [
      { name: "block_name", type: "string", required: true, description: "Human-readable block name, e.g. 'Feature Card'." },
      { name: "slug", type: "string", required: false, description: "Overrides the derived block slug." },
      { name: "namespace", type: "string", required: false, description: "Overrides the detected default block namespace." },
      { name: "title", type: "string", required: false, description: "Overrides the derived block.json title." },
      { name: "description", type: "string", required: false, description: "block.json description. Defaults to 'A custom block.'" },
      { name: "category", type: "string", required: false, description: "block.json category. Defaults to 'widgets'." },
      { name: "icon", type: "string", required: false, description: "block.json icon. Defaults to 'block-default'." },
      { name: "keywords", required: false, description: "Array of search keyword strings." },
      { name: "supports", required: false, description: "block.json supports object. Defaults to { html: false }." },
    ],
  },
  generate: generateGutenbergBlockFiles,
};

export { VARIABLE_MANIFEST };
