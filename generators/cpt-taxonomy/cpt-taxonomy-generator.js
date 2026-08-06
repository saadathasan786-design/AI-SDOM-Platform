/**
 * CPT + Taxonomy Generator — Stage 3E. The first Injection Generator.
 *
 * Unlike the Plugin/Theme Generators (which SCAFFOLD new output), this
 * generator TARGETS an existing plugin already produced by the Plugin
 * Generator (3B) and injects a new CPT + paired taxonomy into its
 * existing `includes/Class-CPT.php` and `includes/Class-Taxonomy.php` —
 * following plugin-boilerplate's own convention exactly: ONE class per
 * concern, with one `register_{slug}()` method per registered CPT/
 * taxonomy, all hooked from a single `register(): void` method. Look at
 * the real Class-CPT.php: it already has this shape for its own "project"
 * CPT. Injecting a new CPT means adding another method beside it and
 * another hook line in `register()` — not creating a whole new file.
 *
 * "Analyze before modify" (a hard requirement for this stage): this
 * generator declares `analyzeOutputDir: true`, so the executor reads the
 * target plugin's current files before `generate()` runs. From that,
 * this generator:
 *   - confirms the target actually has Class-CPT.php/Class-Taxonomy.php
 *     (i.e., it looks like a plugin this framework generated)
 *   - detects the target's ALREADY-IN-USE text domain by reading it out
 *     of an existing `__( '...', 'the-domain' )` call, so injected labels
 *     use the correct domain automatically — this is not something the
 *     caller has to supply, and could not be correctly guessed without
 *     reading the target first
 *   - checks whether this exact CPT/taxonomy (by derived slug) is
 *     ALREADY registered, and if so, does nothing for that file
 *     (`operation: "skip"`) — this is the idempotency requirement: running
 *     this generator twice with the same cpt_name is a safe no-op, not a
 *     duplicate registration and not an error.
 *
 * No `templateDir` is declared here (unlike Plugin/Theme). Those two
 * generators find/replace literal tokens in a COPIED file; this generator
 * SYNTHESIZES a new method that doesn't exist anywhere to copy from. The
 * method text below was hand-written to match Class-CPT.php's exact
 * formatting (tabs, field ordering, comment style) — that's how "use
 * plugin-boilerplate conventions and coding style" is satisfied when
 * there's no literal block to substitute against.
 */

import path from "node:path";
import { toSlug } from "../framework/slug-generator.js";
import { toForwardSlashes } from "../framework/path-utils.js";
import { toOptionCase } from "../framework/constant-case-manager.js";
import { validateProjectName } from "../framework/naming-validator.js";
import { insertHookIntoRegisterMethod, insertMethodBeforeClassClose } from "../framework/php-class-injector.js";
import { VARIABLE_MANIFEST } from "./variable-manifest.js";

const CPT_FILE_PATH = path.join("includes", "Class-CPT.php");
const TAXONOMY_FILE_PATH = path.join("includes", "Class-Taxonomy.php");
// Forward-slash forms for embedding into user-facing messages — the raw
// `path.join` forms above stay platform-specific for filesystem operations
// (see framework/path-utils.js).
const CPT_FILE_PATH_DISPLAY = toForwardSlashes(CPT_FILE_PATH);
const TAXONOMY_FILE_PATH_DISPLAY = toForwardSlashes(TAXONOMY_FILE_PATH);

const TEXT_DOMAIN_PATTERN = /__\(\s*'[^']*',\s*'([a-z0-9_-]+)'\s*\)/;

// WordPress hard limits — exceeding these causes silent registration
// failures, so this generator checks them explicitly rather than letting
// a bad post_type/taxonomy key through.
const MAX_POST_TYPE_KEY_LENGTH = 20;
const MAX_TAXONOMY_KEY_LENGTH = 32;

function extractTextDomain(...fileContents) {
  for (const content of fileContents) {
    const match = TEXT_DOMAIN_PATTERN.exec(content);
    if (match) return match[1];
  }
  return null;
}

function buildCptMethod({ cptSlug, singularLabel, pluralLabel, restBaseAndRewrite, taxSlug, textDomain }) {
  return (
    `\tpublic function register_${cptSlug}_cpt(): void {\n` +
    `\t\tregister_post_type( '${cptSlug}', array(\n` +
    `\t\t\t'labels'          => array(\n` +
    `\t\t\t\t'name'          => __( '${pluralLabel}', '${textDomain}' ),\n` +
    `\t\t\t\t'singular_name' => __( '${singularLabel}', '${textDomain}' ),\n` +
    `\t\t\t\t'add_new_item'  => __( 'Add New ${singularLabel}', '${textDomain}' ),\n` +
    `\t\t\t\t'edit_item'     => __( 'Edit ${singularLabel}', '${textDomain}' ),\n` +
    `\t\t\t\t'all_items'     => __( 'All ${pluralLabel}', '${textDomain}' ),\n` +
    `\t\t\t),\n` +
    `\t\t\t'public'          => true,\n` +
    `\t\t\t'show_in_rest'    => true,\n` +
    `\t\t\t'rest_base'       => '${restBaseAndRewrite}',\n` +
    `\t\t\t'has_archive'     => true,\n` +
    `\t\t\t'supports'        => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),\n` +
    `\t\t\t'taxonomies'      => array( '${taxSlug}' ),\n` +
    `\t\t\t'rewrite'         => array( 'slug' => '${restBaseAndRewrite}' ),\n` +
    `\t\t) );\n` +
    `\t}\n`
  );
}

function buildTaxonomyMethod({ taxSlug, cptSlug, taxSingularLabel, taxPluralLabel, taxRestBase, taxRewriteSlug, textDomain }) {
  return (
    `\tpublic function register_${taxSlug}(): void {\n` +
    `\t\tregister_taxonomy( '${taxSlug}', array( '${cptSlug}' ), array(\n` +
    `\t\t\t'labels'            => array(\n` +
    `\t\t\t\t'name'          => __( '${taxPluralLabel}', '${textDomain}' ),\n` +
    `\t\t\t\t'singular_name' => __( '${taxSingularLabel}', '${textDomain}' ),\n` +
    `\t\t\t),\n` +
    `\t\t\t'public'            => true,\n` +
    `\t\t\t'show_in_rest'      => true,\n` +
    `\t\t\t'rest_base'         => '${taxRestBase}',\n` +
    `\t\t\t'hierarchical'      => true, // category-style; set false for tag-style.\n` +
    `\t\t\t'rewrite'           => array( 'slug' => '${taxRewriteSlug}' ),\n` +
    `\t\t) );\n` +
    `\t}\n`
  );
}

/**
 * Pure transform: given config and the existing target project's files
 * (already read by the executor via analyzeOutputDir — never by this
 * function), return the files to inject. No filesystem access here.
 *
 * `templateFiles` is unused (this generator declares no templateDir) but
 * kept in the signature to match the executor's standard call shape.
 */
export function generateCptTaxonomyFiles(config, _templateFiles, existingFiles) {
  const nameCheck = validateProjectName(config.cpt_name);
  if (!nameCheck.valid) {
    throw new Error(`Cannot generate CPT: ${nameCheck.reason}`);
  }

  const cptFile = (existingFiles ?? []).find((f) => f.path === CPT_FILE_PATH);
  const taxFile = (existingFiles ?? []).find((f) => f.path === TAXONOMY_FILE_PATH);

  if (!cptFile || !taxFile) {
    throw new Error(
      `Cannot inject CPT/Taxonomy: target project is missing ${CPT_FILE_PATH_DISPLAY} and/or ` +
        `${TAXONOMY_FILE_PATH_DISPLAY}. This generator targets plugins produced by this framework's ` +
        "Plugin Generator (Stage 3B) — is outputDir pointed at one?"
    );
  }

  const textDomain = extractTextDomain(cptFile.content, taxFile.content);
  if (!textDomain) {
    throw new Error(
      "Cannot inject CPT/Taxonomy: could not detect the target plugin's text domain from its " +
        "existing Class-CPT.php/Class-Taxonomy.php. Have these files been edited away from the " +
        "expected convention?"
    );
  }

  const singularLabel = config.cpt_name;
  const pluralLabel = config.cpt_plural || `${config.cpt_name}s`;
  const taxSingularLabel = config.taxonomy_name || `${config.cpt_name} Category`;
  const taxPluralLabel =
    config.taxonomy_plural || (config.taxonomy_name ? `${config.taxonomy_name}s` : `${config.cpt_name} Categories`);

  const cptSlug = toOptionCase(singularLabel);
  const cptRestBaseAndRewrite = toSlug(pluralLabel);
  const taxSlug = toOptionCase(taxSingularLabel);
  const taxRestBase = toSlug(taxPluralLabel);
  const taxRewriteSlug = toSlug(taxSingularLabel);

  if (!cptSlug) {
    throw new Error(`Cannot generate CPT: "${config.cpt_name}" produced an empty post type key.`);
  }
  if (cptSlug.length > MAX_POST_TYPE_KEY_LENGTH) {
    throw new Error(
      `Cannot generate CPT: derived post type key "${cptSlug}" is ${cptSlug.length} characters, ` +
        `exceeding WordPress's ${MAX_POST_TYPE_KEY_LENGTH}-character limit for post_type keys.`
    );
  }
  if (!taxSlug) {
    throw new Error(`Cannot generate taxonomy: "${taxSingularLabel}" produced an empty taxonomy key.`);
  }
  if (taxSlug.length > MAX_TAXONOMY_KEY_LENGTH) {
    throw new Error(
      `Cannot generate taxonomy: derived taxonomy key "${taxSlug}" is ${taxSlug.length} characters, ` +
        `exceeding WordPress's ${MAX_TAXONOMY_KEY_LENGTH}-character limit for taxonomy keys.`
    );
  }

  const cptMethodName = `register_${cptSlug}_cpt`;
  const taxMethodName = `register_${taxSlug}`;

  const files = [];

  // --- CPT file ---
  if (cptFile.content.includes(`function ${cptMethodName}(`)) {
    files.push({
      path: CPT_FILE_PATH,
      operation: "skip",
      reason: `CPT "${cptSlug}" is already registered in ${CPT_FILE_PATH_DISPLAY} — nothing to do.`,
    });
  } else {
    const withHook = insertHookIntoRegisterMethod(
      cptFile.content,
      `add_action( 'init', array( $this, '${cptMethodName}' ) );`
    );
    const methodText = buildCptMethod({
      cptSlug,
      singularLabel,
      pluralLabel,
      restBaseAndRewrite: cptRestBaseAndRewrite,
      taxSlug,
      textDomain,
    });
    files.push({
      path: CPT_FILE_PATH,
      content: insertMethodBeforeClassClose(withHook, methodText),
      operation: "modify",
    });
  }

  // --- Taxonomy file ---
  if (taxFile.content.includes(`function ${taxMethodName}(`)) {
    files.push({
      path: TAXONOMY_FILE_PATH,
      operation: "skip",
      reason: `Taxonomy "${taxSlug}" is already registered in ${TAXONOMY_FILE_PATH_DISPLAY} — nothing to do.`,
    });
  } else {
    const withHook = insertHookIntoRegisterMethod(
      taxFile.content,
      `add_action( 'init', array( $this, '${taxMethodName}' ) );`
    );
    const methodText = buildTaxonomyMethod({
      taxSlug,
      cptSlug,
      taxSingularLabel,
      taxPluralLabel,
      taxRestBase,
      taxRewriteSlug,
      textDomain,
    });
    files.push({
      path: TAXONOMY_FILE_PATH,
      content: insertMethodBeforeClassClose(withHook, methodText),
      operation: "modify",
    });
  }

  return files;
}

export const cptTaxonomyGenerator = {
  id: "cpt-taxonomy",
  name: "CPT + Taxonomy Generator",
  version: "1.0.0",
  category: "capability",
  description:
    "Injects a new custom post type and paired taxonomy into an EXISTING plugin generated by " +
    "the Plugin Generator — adds new register_{slug}() methods to its Class-CPT.php and " +
    "Class-Taxonomy.php following plugin-boilerplate's own convention, rather than scaffolding " +
    "a new plugin.",
  supportedOutputs: ["php-cpt", "php-taxonomy"],
  minimumFrameworkVersion: "1.1.0",
  variableManifest: VARIABLE_MANIFEST,
  analyzeOutputDir: true,
  configSchema: {
    fields: [
      {
        name: "cpt_name",
        type: "string",
        required: true,
        description: "Singular human-readable CPT name, e.g. 'Event'.",
      },
      {
        name: "cpt_plural",
        type: "string",
        required: false,
        description: "Plural CPT name; defaults to cpt_name + 's'.",
      },
      {
        name: "taxonomy_name",
        type: "string",
        required: false,
        description: "Singular taxonomy name; defaults to '{cpt_name} Category'.",
      },
      {
        name: "taxonomy_plural",
        type: "string",
        required: false,
        description: "Plural taxonomy name; defaults to '{cpt_name} Categories'.",
      },
    ],
  },
  generate: generateCptTaxonomyFiles,
};

export { VARIABLE_MANIFEST };
