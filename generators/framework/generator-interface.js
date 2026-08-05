/**
 * Generator Interface — the required shape of any generator definition.
 *
 * This is a validation function, not a class hierarchy — generators are
 * plain objects, checked at registration time. Keeps the framework usable
 * from any future context (MCP tool, CLI, test) without forcing a base
 * class or inheritance chain.
 *
 * Required shape:
 * {
 *   name: string,              // unique registry key, e.g. "plugin"
 *   version: string,           // generator's own version, e.g. "1.0.0"
 *   description: string,       // human-readable, shown in listGenerators()
 *   configSchema: {
 *     fields: [
 *       { name: string, type: "string"|"boolean"|"number", required: boolean, default?: any, description?: string }
 *     ]
 *   },
 *   generate: async (config) => [{ path: string, content: string }]
 *     // Pure function: given valid config, returns the list of files to
 *     // write (relative paths + content). MUST NOT touch the filesystem
 *     // itself — the executor handles preview/dry-run/write/rollback.
 * }
 */

const REQUIRED_FIELDS = ["name", "version", "description", "configSchema", "generate"];
const VALID_FIELD_TYPES = ["string", "boolean", "number"];

export function validateGeneratorDefinition(def) {
  if (!def || typeof def !== "object") {
    throw new Error("Generator definition must be an object.");
  }

  for (const key of REQUIRED_FIELDS) {
    if (!(key in def)) {
      throw new Error(`Generator definition missing required field: "${key}"`);
    }
  }

  if (typeof def.name !== "string" || def.name.trim() === "") {
    throw new Error('Generator "name" must be a non-empty string.');
  }

  if (typeof def.generate !== "function") {
    throw new Error(`Generator "${def.name}": "generate" must be a function.`);
  }

  if (!def.configSchema || !Array.isArray(def.configSchema.fields)) {
    throw new Error(`Generator "${def.name}": "configSchema.fields" must be an array.`);
  }

  for (const field of def.configSchema.fields) {
    if (!field.name || typeof field.name !== "string") {
      throw new Error(`Generator "${def.name}": every configSchema field needs a string "name".`);
    }
    if (field.type && !VALID_FIELD_TYPES.includes(field.type)) {
      throw new Error(
        `Generator "${def.name}": field "${field.name}" has invalid type "${field.type}" ` +
          `(expected one of ${VALID_FIELD_TYPES.join(", ")}).`
      );
    }
  }

  if ("templateDir" in def && (typeof def.templateDir !== "string" || def.templateDir.trim() === "")) {
    throw new Error(`Generator "${def.name}": "templateDir" must be a non-empty string when provided.`);
  }

  if ("id" in def && (typeof def.id !== "string" || def.id.trim() === "")) {
    throw new Error(`Generator "${def.name}": "id" must be a non-empty string when provided.`);
  }

  return true;
}
