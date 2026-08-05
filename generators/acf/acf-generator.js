/**
 * ACF Field Group Generator — Stage 3F. Second Injection Generator, fully
 * reusing the pattern established by the CPT + Taxonomy Generator (3E):
 * `analyzeOutputDir: true`, `operation: "modify"`, idempotent-by-key
 * detection, and the SAME shared `php-class-injector.js` helpers (now
 * promoted to the framework — this generator is the second real consumer
 * that justified the promotion).
 *
 * Targets an existing generated plugin's `includes/Class-ACF.php` and adds
 * a new `register_{group_key}_field_group()` method + a new `acf/init`
 * hook line — following that file's own convention exactly: a
 * `function_exists( 'acf_add_local_field_group' )` guard, then
 * `acf_add_local_field_group()` with 'key'/'title'/'fields'/'location'.
 *
 * One real, observed difference from CPT/Taxonomy: `Class-ACF.php`'s
 * existing field group ('Project Details') does NOT wrap its
 * 'title'/'label' strings in `__()` — no text domain is used for ACF
 * labels in this boilerplate at all. So unlike the CPT+Taxonomy
 * Generator, this one does NOT auto-detect or use a text domain — that
 * would be inventing a convention the boilerplate doesn't actually have.
 *
 * "Associate field groups with existing generated CPTs where applicable":
 * `target_cpt` is validated against the target's ACTUAL registered post
 * types (read from Class-CPT.php via analyzeOutputDir) — not merely
 * trusted as a string. If the given CPT isn't registered there, this
 * generator refuses rather than emitting a field group pointing at
 * nothing.
 */

import path from "node:path";
import { toOptionCase } from "../framework/constant-case-manager.js";
import { insertHookIntoRegisterMethod, insertMethodBeforeClassClose } from "../framework/php-class-injector.js";
import { VARIABLE_MANIFEST } from "./variable-manifest.js";

const ACF_FILE_PATH = path.join("includes", "Class-ACF.php");
const CPT_FILE_PATH = path.join("includes", "Class-CPT.php");

const REGISTERED_POST_TYPE_PATTERN = /register_post_type\(\s*'([a-z0-9_]+)'/g;

// A deliberately small, common subset of ACF field types for v1 — not
// every ACF field type exists here, just the ones seen in real agency
// work most often. Extend this list if a real need for more emerges.
const SUPPORTED_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "email",
  "url",
  "image",
  "gallery",
  "true_false",
  "select",
  "wysiwyg",
  "date_picker",
];

function detectRegisteredPostTypes(cptFileContent) {
  const slugs = [];
  let match;
  REGISTERED_POST_TYPE_PATTERN.lastIndex = 0;
  while ((match = REGISTERED_POST_TYPE_PATTERN.exec(cptFileContent)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

function validateFieldDef(field, index) {
  if (!field || typeof field.label !== "string" || field.label.trim() === "") {
    throw new Error(`Cannot generate field group: fields[${index}] is missing a non-empty "label".`);
  }
  if (!field.type || !SUPPORTED_FIELD_TYPES.includes(field.type)) {
    throw new Error(
      `Cannot generate field group: fields[${index}] has unsupported type "${field.type}" ` +
        `(supported: ${SUPPORTED_FIELD_TYPES.join(", ")}).`
    );
  }
  const name = field.name || toOptionCase(field.label);
  if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error(
      `Cannot generate field group: fields[${index}] derived an invalid field name "${name}" ` +
        "(must be lowercase letters, numbers, underscores, starting with a letter)."
    );
  }
  return { ...field, name };
}

function buildFieldGroupMethod({ groupKey, groupTitle, fields, targetCpt }) {
  const fieldEntries = fields
    .map(
      (f) =>
        `\t\t\t\tarray(\n` +
        `\t\t\t\t\t'key'   => 'field_${targetCpt}_${f.name}',\n` +
        `\t\t\t\t\t'label' => '${f.label}',\n` +
        `\t\t\t\t\t'name'  => '${f.name}',\n` +
        `\t\t\t\t\t'type'  => '${f.type}',\n` +
        `\t\t\t\t),`
    )
    .join("\n");

  return (
    `\tpublic function register_${groupKey}_field_group(): void {\n` +
    `\t\tif ( ! function_exists( 'acf_add_local_field_group' ) ) {\n` +
    `\t\t\treturn;\n` +
    `\t\t}\n\n` +
    `\t\tacf_add_local_field_group( array(\n` +
    `\t\t\t'key'      => 'group_${groupKey}',\n` +
    `\t\t\t'title'    => '${groupTitle}',\n` +
    `\t\t\t'fields'   => array(\n` +
    `${fieldEntries}\n` +
    `\t\t\t),\n` +
    `\t\t\t'location' => array(\n` +
    `\t\t\t\tarray(\n` +
    `\t\t\t\t\tarray(\n` +
    `\t\t\t\t\t\t'param'    => 'post_type',\n` +
    `\t\t\t\t\t\t'operator' => '==',\n` +
    `\t\t\t\t\t\t'value'    => '${targetCpt}',\n` +
    `\t\t\t\t\t),\n` +
    `\t\t\t\t),\n` +
    `\t\t\t),\n` +
    `\t\t) );\n` +
    `\t}\n`
  );
}

/**
 * Pure transform: given config and the existing target project's files
 * (already read by the executor via analyzeOutputDir), return the files
 * to inject. No filesystem access here.
 */
export function generateAcfFieldGroupFiles(config, _templateFiles, existingFiles) {
  if (!config.group_title || typeof config.group_title !== "string" || config.group_title.trim() === "") {
    throw new Error("Cannot generate field group: \"group_title\" is required and must be a non-empty string.");
  }
  if (!config.target_cpt || typeof config.target_cpt !== "string") {
    throw new Error("Cannot generate field group: \"target_cpt\" is required.");
  }
  if (!Array.isArray(config.fields) || config.fields.length === 0) {
    throw new Error('Cannot generate field group: "fields" must be a non-empty array.');
  }

  const acfFile = (existingFiles ?? []).find((f) => f.path === ACF_FILE_PATH);
  const cptFile = (existingFiles ?? []).find((f) => f.path === CPT_FILE_PATH);

  if (!acfFile || !cptFile) {
    throw new Error(
      `Cannot inject field group: target project is missing ${ACF_FILE_PATH} and/or ` +
        `${CPT_FILE_PATH}. This generator targets plugins produced by this framework's Plugin ` +
        "Generator (Stage 3B) — is outputDir pointed at one?"
    );
  }

  const registeredPostTypes = detectRegisteredPostTypes(cptFile.content);
  if (!registeredPostTypes.includes(config.target_cpt)) {
    throw new Error(
      `Cannot inject field group: target_cpt "${config.target_cpt}" is not registered in ` +
        `${CPT_FILE_PATH} (found: ${registeredPostTypes.join(", ") || "none"}). Run the CPT + ` +
        "Taxonomy Generator first, or check for a typo."
    );
  }

  const fields = config.fields.map((field, index) => validateFieldDef(field, index));

  const groupKey = toOptionCase(config.group_title);
  if (!groupKey) {
    throw new Error(`Cannot generate field group: "${config.group_title}" produced an empty group key.`);
  }

  const methodName = `register_${groupKey}_field_group`;

  if (acfFile.content.includes(`function ${methodName}(`)) {
    return [
      {
        path: ACF_FILE_PATH,
        operation: "skip",
        reason: `Field group "${groupKey}" is already registered in ${ACF_FILE_PATH} — nothing to do.`,
      },
    ];
  }

  const withHook = insertHookIntoRegisterMethod(
    acfFile.content,
    `add_action( 'acf/init', array( $this, '${methodName}' ) );`
  );
  const methodText = buildFieldGroupMethod({
    groupKey,
    groupTitle: config.group_title,
    fields,
    targetCpt: config.target_cpt,
  });

  return [
    {
      path: ACF_FILE_PATH,
      content: insertMethodBeforeClassClose(withHook, methodText),
      operation: "modify",
    },
  ];
}

export const acfFieldGroupGenerator = {
  id: "acf-field-group",
  name: "ACF Field Group Generator",
  version: "1.0.0",
  category: "capability",
  description:
    "Injects a new ACF field group (registered in PHP, not database JSON) into an EXISTING " +
    "plugin generated by the Plugin Generator — adds a new register_{group}_field_group() " +
    "method to its Class-ACF.php, associated with an existing registered CPT.",
  supportedOutputs: ["php-acf-field-group"],
  minimumFrameworkVersion: "1.1.0",
  variableManifest: VARIABLE_MANIFEST,
  analyzeOutputDir: true,
  configSchema: {
    fields: [
      {
        name: "group_title",
        type: "string",
        required: true,
        description: "Human-readable field group title, e.g. 'Event Details'.",
      },
      {
        name: "target_cpt",
        type: "string",
        required: true,
        description: "The post_type slug to attach this field group to. Must already be registered in the target.",
      },
      {
        name: "fields",
        required: true,
        description:
          "Array of { label, name? (derived from label if omitted), type (one of: " +
          SUPPORTED_FIELD_TYPES.join(", ") +
          ") }.",
      },
    ],
  },
  generate: generateAcfFieldGroupFiles,
};

export { VARIABLE_MANIFEST, SUPPORTED_FIELD_TYPES };
