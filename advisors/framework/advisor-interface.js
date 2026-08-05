/**
 * Advisor Interface — the required shape of any advisor definition.
 *
 * Structurally parallel to the Generator Framework's generator-interface.js,
 * but read-oriented: an advisor never writes anything, so there's no
 * config-schema-for-writing, no templateDir, no operation types — only
 * "what input do you need" and "what do you conclude from it."
 *
 * This is a validation function, not a class hierarchy — advisors are
 * plain objects, checked at registration time. This mirrors the Generator
 * Framework's own deliberate choice (no forced inheritance, no base
 * class), re-applied here rather than shared as code — see
 * docs/ADVISOR-FRAMEWORK.md for why nothing is imported from
 * generators/framework/ despite the structural similarity.
 *
 * Required shape:
 * {
 *   id: string,                    // unique registry key
 *   name: string,                  // human-readable display name
 *   version: string,               // advisor's own version
 *   description: string,           // human-readable, shown in listAdvisorCatalog()
 *   category?: string,             // optional, defaults to "uncategorized" in the catalog
 *   inputRequirements: string[],   // which inputs analyze() needs, e.g. ["generationReport"]
 *   supportedSeverities?: string[],// optional, defaults to all SEVERITY_LEVELS in the catalog
 *   analyze: async (input) => Finding[]
 *     // Pure function: given exactly the inputs it declared needing,
 *     // returns a list of findings. MUST NOT write files, call generators,
 *     // or have any side effect — analysis only.
 * }
 */

import { SEVERITY_LEVELS } from "./severity.js";

const REQUIRED_FIELDS = ["id", "name", "version", "description", "inputRequirements", "analyze"];

export function validateAdvisorDefinition(def) {
  if (!def || typeof def !== "object") {
    throw new Error("Advisor definition must be an object.");
  }

  for (const key of REQUIRED_FIELDS) {
    if (!(key in def)) {
      throw new Error(`Advisor definition missing required field: "${key}"`);
    }
  }

  if (typeof def.id !== "string" || def.id.trim() === "") {
    throw new Error('Advisor "id" must be a non-empty string.');
  }

  if (typeof def.name !== "string" || def.name.trim() === "") {
    throw new Error(`Advisor "${def.id}": "name" must be a non-empty string.`);
  }

  if (typeof def.analyze !== "function") {
    throw new Error(`Advisor "${def.id}": "analyze" must be a function.`);
  }

  if (!Array.isArray(def.inputRequirements)) {
    throw new Error(`Advisor "${def.id}": "inputRequirements" must be an array.`);
  }
  for (const requirement of def.inputRequirements) {
    if (typeof requirement !== "string" || requirement.trim() === "") {
      throw new Error(`Advisor "${def.id}": every inputRequirements entry must be a non-empty string.`);
    }
  }

  if ("supportedSeverities" in def) {
    if (!Array.isArray(def.supportedSeverities)) {
      throw new Error(`Advisor "${def.id}": "supportedSeverities" must be an array when provided.`);
    }
    for (const severity of def.supportedSeverities) {
      if (!SEVERITY_LEVELS.includes(severity)) {
        throw new Error(
          `Advisor "${def.id}": "${severity}" is not a valid severity (expected one of ${SEVERITY_LEVELS.join(", ")}).`
        );
      }
    }
  }

  return true;
}
