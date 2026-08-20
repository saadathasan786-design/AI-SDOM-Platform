/**
 * Generator MCP Tools — thin adapter exposing the existing Generator
 * Framework (../generators/) through MCP.
 *
 * This file contains NO generation logic, validation logic, template
 * loading, filesystem writes, rollback handling, or report construction.
 * Every handler delegates directly to the Generator Framework's existing
 * catalog/execution functions and returns their result unchanged.
 *
 * The only adapter-level validation here is the shape of the MCP request
 * itself (for example, requiring a non-empty generator id). Framework
 * validation remains owned by the Generator Framework.
 */

import {
  listCatalog,
  getGeneratorMetadata,
  getVariableManifest,
  supportsMode,
  isAvailable,
  getFrameworkCompatibility,
  runGeneratorWithReport,
} from "../generators/index.js";

export const generatorTools = [
  {
    name: "generator_list",
    description:
      "List every registered Generator from the real Generator Catalog: id, name, description, " +
      "version, category, supported modes, template source, variable manifest, supported outputs, " +
      "and framework compatibility.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "generator_get",
    description:
      "Get the complete catalog metadata for one registered Generator, exactly as the Generator " +
      "Catalog provides it.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Generator id, e.g. 'plugin'." } },
      required: ["id"],
    },
  },
  {
    name: "generator_getVariableManifest",
    description: "Get the declared variable manifest for one registered Generator.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Generator id." } },
      required: ["id"],
    },
  },
  {
    name: "generator_run",
    description:
      "Run a registered Generator and return its Generation Report exactly as the framework " +
      "produces it. Supports preview, dry-run, and write modes. Supply outputDir for dry-run/write; " +
      "preview does not write files.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Generator id, e.g. 'plugin'." },
        config: { type: "object", description: "Generator configuration matching its declared config schema." },
        outputDir: { type: "string", description: "Target directory for dry-run/write execution." },
        mode: { type: "string", enum: ["preview", "dry-run", "write"], default: "write" },
      },
      required: ["id"],
    },
  },
  {
    name: "generator_supportsMode",
    description: "Check whether a registered Generator supports a requested execution mode.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Generator id." },
        mode: { type: "string", enum: ["preview", "dry-run", "write"] },
      },
      required: ["id", "mode"],
    },
  },
  {
    name: "generator_isAvailable",
    description:
      "Check whether a Generator is registered and compatible with the current Generator Framework version.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Generator id." } },
      required: ["id"],
    },
  },
  {
    name: "generator_getFrameworkCompatibility",
    description: "Return the current framework version, Generator minimum version, and compatibility status.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Generator id." } },
      required: ["id"],
    },
  },
];

function requireId(args, toolName) {
  if (typeof args.id !== "string" || args.id.trim() === "") {
    throw new Error(`${toolName} requires a non-empty string 'id'.`);
  }
}

export async function handleGeneratorList() {
  return listCatalog();
}

export async function handleGeneratorGet(args = {}) {
  requireId(args, "generator_get");
  return getGeneratorMetadata(args.id);
}

export async function handleGeneratorGetVariableManifest(args = {}) {
  requireId(args, "generator_getVariableManifest");
  return getVariableManifest(args.id);
}

export async function handleGeneratorRun(args = {}) {
  requireId(args, "generator_run");
  return runGeneratorWithReport(args.id, args.config ?? {}, {
    outputDir: args.outputDir,
    mode: args.mode ?? "write",
  });
}

export async function handleGeneratorSupportsMode(args = {}) {
  requireId(args, "generator_supportsMode");
  if (typeof args.mode !== "string" || args.mode.trim() === "") {
    throw new Error("generator_supportsMode requires a non-empty string 'mode'.");
  }
  return supportsMode(args.id, args.mode);
}

export async function handleGeneratorIsAvailable(args = {}) {
  requireId(args, "generator_isAvailable");
  return isAvailable(args.id);
}

export async function handleGeneratorGetFrameworkCompatibility(args = {}) {
  requireId(args, "generator_getFrameworkCompatibility");
  return getFrameworkCompatibility(args.id);
}
