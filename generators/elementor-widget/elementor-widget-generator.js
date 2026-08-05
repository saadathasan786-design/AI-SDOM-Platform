/**
 * Elementor Widget Generator — Stage 3H.
 *
 * A genuine hybrid: SCAFFOLDS a new widget class file from
 * `elementor-widget-boilerplate/widgets/` (like Plugin/Theme — declares
 * `templateDir`), AND INJECTS registration into the target plugin (like
 * CPT/ACF/REST — declares `analyzeOutputDir`). This is the first generator
 * to need both simultaneously; the executor already supported this
 * combination with zero changes (`templateFiles` and `existingFiles` are
 * independent, both passed to `generate()`).
 *
 * New territory this stage introduces: `elementor-widget-boilerplate/`
 * has no pre-existing integration point inside `plugin-boilerplate/` the
 * way Class-CPT.php/Class-ACF.php/Class-RestApi.php already did for their
 * generators. So:
 *
 * - The FIRST widget generated for a target plugin creates a NEW
 *   `includes/Class-Elementor.php` (following the same "class with a
 *   `register(): void` hook method" convention as every other
 *   plugin-boilerplate integration class) AND modifies the target's MAIN
 *   PLUGIN FILE — adding a require_once fallback line, a `use` statement,
 *   and a bootstrap instantiation line. No prior generator has touched the
 *   main plugin file; its filename is dynamic (`{slug}.php`), so it's
 *   found by scanning for a root-level file containing a `Plugin Name:`
 *   docblock, not by a fixed path.
 * - The SECOND+ widget for the same target finds `Class-Elementor.php`
 *   already exists, and injects a new require+register line into its
 *   EXISTING `register_widgets()` method instead — reusing
 *   `insertBeforeMethodClose` exactly as-is, no new framework work.
 *
 * Duplicate detection is by widget FILE existence (does
 * `widgets/class-{slug}-widget.php` already exist?) — simpler and more
 * reliable than parsing Class-Elementor.php's content, and naturally
 * idempotent: re-running with the same widget_name is a safe no-op.
 */

import path from "node:path";
import { toOptionCase } from "../framework/constant-case-manager.js";
import { toNamespaceSegment } from "../framework/namespace-manager.js";
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
const WIDGET_TEMPLATE_DIR = path.join(__dirname, "..", "..", "elementor-widget-boilerplate", "widgets");
const WIDGET_TEMPLATE_FILE = "class-custom-widget.php";

const ELEMENTOR_CLASS_PATH = path.join("includes", "Class-Elementor.php");
const REGISTER_WIDGETS_MARKER = "public function register_widgets( Widgets_Manager $widgets_manager ): void {";

function widgetFilePath(slug) {
  return path.join("widgets", `class-${slug}-widget.php`);
}

function buildKeywordsMethod(keywords) {
  const list = keywords.map((k) => `'${k}'`).join(", ");
  return `\tpublic function get_keywords(): array {\n\t\treturn array( ${list} );\n\t}\n`;
}

function buildWidgetFileContent({ templateContent, className, slug, title, icon, category, textDomain, keywords }) {
  const staleDocblock =
    "/**\n" +
    " * A single custom Elementor widget: a \"Call to Action\" box.\n" +
    " *\n" +
    " * Registration: hook this into `elementor/widgets/register` from wherever\n" +
    " * you're loading Elementor extensions (theme functions.php or a small\n" +
    " * \"elementor-extensions\" plugin), guarded by did_action('elementor/loaded').\n" +
    " *\n" +
    " *   add_action( 'elementor/widgets/register', function ( $widgets_manager ) {\n" +
    " *       require_once __DIR__ . '/widgets/class-custom-widget.php';\n" +
    " *       $widgets_manager->register( new \\Boilerplate_CTA_Widget() );\n" +
    " *   } );\n" +
    " */";
  const accurateDocblock =
    `/**\n * ${title} — an Elementor widget.\n *\n` +
    ` * Registered automatically by includes/Class-Elementor.php — no manual\n` +
    ` * wiring needed.\n */`;

  let content = templateContent
    .split(staleDocblock).join(accurateDocblock)
    .split("Boilerplate_CTA_Widget").join(className)
    .split("'boilerplate_cta'").join(`'${slug}'`)
    .split("'Boilerplate CTA'").join(`'${title}'`)
    .split("'boilerplate-plugin'").join(`'${textDomain}'`)
    .split("'eicon-call-to-action'").join(`'${icon}'`)
    .split("array( 'general' )").join(`array( '${category}' )`);

  if (keywords.length > 0) {
    content = insertMethodBeforeClassClose(content, buildKeywordsMethod(keywords));
  }
  return content;
}

function buildFreshElementorClass({ namespace, widgetFileRelPath, className, textDomain }) {
  return (
    `<?php\n` +
    `namespace ${namespace};\n\n` +
    `if ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n\n` +
    `use Elementor\\Widgets_Manager;\n\n` +
    `/**\n * Registers custom Elementor widgets.\n */\n` +
    `class Elementor_Widgets {\n\n` +
    `\tpublic function register(): void {\n` +
    `\t\tadd_action( 'elementor/widgets/register', array( $this, 'register_widgets' ) );\n` +
    `\t}\n\n` +
    `\t${REGISTER_WIDGETS_MARKER}\n` +
    `\t\tif ( ! did_action( 'elementor/loaded' ) ) {\n\t\t\treturn;\n\t\t}\n\n` +
    `\t\trequire_once __DIR__ . '/../${widgetFileRelPath}';\n` +
    `\t\t$widgets_manager->register( new \\${className}() );\n` +
    `\t}\n` +
    `}\n`
  );
}

function buildRegisterWidgetLine(widgetFileRelPath, className) {
  return (
    `require_once __DIR__ . '/../${widgetFileRelPath}';\n` +
    `\t\t$widgets_manager->register( new \\${className}() );`
  );
}

/**
 * Pure transform: given config, the loaded widget template, and the
 * target project's existing files (both read by the executor — via
 * `templateDir` and `analyzeOutputDir` respectively), return the files to
 * write/inject. No filesystem access here.
 */
export function generateElementorWidgetFiles(config, templateFiles, existingFiles) {
  const nameCheck = validateProjectName(config.widget_name);
  if (!nameCheck.valid) {
    throw new Error(`Cannot generate widget: ${nameCheck.reason}`);
  }

  const slug = config.slug || toOptionCase(config.widget_name);
  const title = config.title || config.widget_name;
  const icon = config.icon || "eicon-info-circle";
  const category = config.category || "general";
  const keywords = config.keywords ?? [];

  if (!slug) {
    throw new Error(`Cannot generate widget: "${config.widget_name}" produced an empty slug.`);
  }

  const mainFile = findMainPluginFile(existingFiles);
  if (!mainFile) {
    throw new Error(
      "Cannot inject widget: could not find the target's main plugin file (a root-level file " +
        "with a 'Plugin Name:' docblock). This generator targets plugins produced by this " +
        "framework's Plugin Generator (Stage 3B) — is outputDir pointed at one?"
    );
  }

  const { constantPrefix, namespace, textDomain } = detectPluginConstants(mainFile.content);
  if (!constantPrefix || !namespace || !textDomain) {
    throw new Error(
      "Cannot inject widget: could not detect the target's constant prefix, namespace, or text " +
        "domain from its main plugin file."
    );
  }

  const widgetPath = widgetFilePath(slug);
  const alreadyExists = (existingFiles ?? []).some((f) => f.path === widgetPath);
  if (alreadyExists) {
    return [
      {
        path: widgetPath,
        operation: "skip",
        reason: `Widget "${slug}" already exists at ${widgetPath} — nothing to do.`,
      },
    ];
  }

  const templateFile = (templateFiles ?? []).find((f) => f.path === WIDGET_TEMPLATE_FILE);
  if (!templateFile) {
    throw new Error(`Cannot generate widget: template file "${WIDGET_TEMPLATE_FILE}" not found.`);
  }

  const className = `${toNamespaceSegment(namespace.split("\\").pop())}_${toNamespaceSegment(config.widget_name)}_Widget`;

  const widgetFileContent = buildWidgetFileContent({
    templateContent: templateFile.content,
    className,
    slug,
    title,
    icon,
    category,
    textDomain,
    keywords,
  });

  const files = [{ path: widgetPath, content: widgetFileContent, operation: "create" }];

  const elementorFile = (existingFiles ?? []).find((f) => f.path === ELEMENTOR_CLASS_PATH);

  if (elementorFile) {
    // Second+ widget: inject into the existing Class-Elementor.php.
    const newLine = buildRegisterWidgetLine(widgetPath, className);
    const withInjection = insertBeforeMethodClose(elementorFile.content, REGISTER_WIDGETS_MARKER, newLine);
    files.push({ path: ELEMENTOR_CLASS_PATH, content: withInjection, operation: "modify" });
  } else {
    // First widget: create Class-Elementor.php AND wire it into the main plugin file.
    files.push({
      path: ELEMENTOR_CLASS_PATH,
      content: buildFreshElementorClass({ namespace, widgetFileRelPath: widgetPath, className, textDomain }),
      operation: "create",
    });

    let mainFileContent = insertRequireIntoFallbackBlock(mainFile.content, constantPrefix, "includes/Class-Elementor.php");
    mainFileContent = insertUseStatement(mainFileContent, namespace, "Elementor_Widgets");
    mainFileContent = insertIntoBootstrap(mainFileContent, "( new Elementor_Widgets() )->register();");

    files.push({ path: mainFile.path, content: mainFileContent, operation: "modify" });
  }

  return files;
}

export const elementorWidgetGenerator = {
  id: "elementor-widget",
  name: "Elementor Widget Generator",
  version: "1.0.0",
  category: "capability",
  description:
    "Scaffolds a new Elementor widget from elementor-widget-boilerplate/ and automatically " +
    "registers it inside an EXISTING plugin generated by the Plugin Generator — creates " +
    "includes/Class-Elementor.php (or injects into it) and wires it into the main plugin file " +
    "on the first widget.",
  supportedOutputs: ["php-elementor-widget"],
  minimumFrameworkVersion: "1.1.0",
  variableManifest: VARIABLE_MANIFEST,
  templateDir: WIDGET_TEMPLATE_DIR,
  analyzeOutputDir: true,
  configSchema: {
    fields: [
      { name: "widget_name", type: "string", required: true, description: "Human-readable widget name, e.g. 'Testimonial Card'." },
      { name: "slug", type: "string", required: false, description: "Overrides the derived get_name() slug." },
      { name: "title", type: "string", required: false, description: "Overrides the derived get_title() label." },
      { name: "icon", type: "string", required: false, description: "Elementor icon slug. Defaults to 'eicon-info-circle'." },
      { name: "category", type: "string", required: false, description: "Elementor widget category. Defaults to 'general'." },
      { name: "keywords", required: false, description: "Array of search keyword strings for get_keywords()." },
    ],
  },
  generate: generateElementorWidgetFiles,
};

export { VARIABLE_MANIFEST };
