/**
 * Elementor MCP Tools — thin adapter exposing the governed Elementor
 * Document Service (./elementor.js) through MCP.
 *
 * This file contains NO mutation logic, document parsing, structural-guard
 * logic, verification, or rollback handling. Every handler delegates to the
 * Elementor service created from the SAME injected wpRequest + memory store
 * used by the rest of the server, and returns its result unchanged.
 *
 * The only adapter-level validation here is the shape of the MCP request
 * itself (e.g. requiring page_id and element_id). Framework/GOV logic remains
 * owned by elementor.js.
 */

import { createElementorService } from "./elementor.js";

export const elementorTools = [
  {
    name: "wp_elementor_inspect",
    description:
      "Read the current Elementor document data for a given page. Returns the element count, " +
      "the document's stable SHA-256 (over its _elementor_data), and optionally the full " +
      "settings of a specific element. Read-only; never mutates anything.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: { type: "number", description: "WordPress page ID (must be an Elementor page)." },
        element_id: {
          type: "string",
          description: "Optional Elementor element id (e.g. 'f7916fd') to return its settings for.",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "wp_elementor_patch",
    description:
      "Governed single-field mutation of an existing Elementor page's _elementor_data via the " +
      "standard WP REST meta field. Perform the full inspect -> snapshot -> validate(guard) -> " +
      "(dry-run | write -> verify -> rollback) cycle. Refuses structural changes (element " +
      "ids/order/counts/globals/image ids) unless allow_structural is explicitly true. " +
      "Provide expected_baseline_sha256 (from wp_elementor_inspect) to guard against stale writes.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: { type: "number", description: "WordPress page ID." },
        element_id: {
          type: "string",
          description: "Elementor element id whose property should change, e.g. 'f7916fd'.",
        },
        property_path: {
          type: "string",
          description: "Dotted path to the property, e.g. 'settings.editor'.",
        },
        value: {
          description: "The new value for the property (string, number, boolean, array, object).",
        },
        expected_baseline_sha256: {
          type: "string",
          description: "Optional document SHA-256 from a prior wp_elementor_inspect. If provided and it does not match the current document, the write is aborted as stale.",
        },
        allow_structural: {
          type: "boolean",
          default: false,
          description: "If true, permits a change that alters the element tree structure. Off by default (simple-edits only).",
        },
        dry_run: {
          type: "boolean",
          default: false,
          description: "If true, compute and report the change without writing anything to WordPress.",
        },
        client_id: { type: "string", description: "Optional scope identifier for the Memory snapshot." },
        project_id: { type: "string", description: "Optional scope identifier for the Memory snapshot." },
      },
      required: ["page_id", "element_id", "property_path", "value"],
    },
  },
];

function requirePositiveInt(args, field, toolName) {
  const v = args[field];
  if (!Number.isInteger(v) || v <= 0) {
    throw new Error(`${toolName} requires a positive integer '${field}'.`);
  }
}

function requireNonEmptyString(args, field, toolName) {
  const v = args[field];
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`${toolName} requires a non-empty string '${field}'.`);
  }
}

export async function handleElementorInspect({ service, args = {} }) {
  requirePositiveInt(args, "page_id", "wp_elementor_inspect");
  return service.inspect({
    page_id: args.page_id,
    element_id: typeof args.element_id === "string" && args.element_id !== "" ? args.element_id : undefined,
  });
}

export async function handleElementorPatch({ service, args = {} }) {
  requirePositiveInt(args, "page_id", "wp_elementor_patch");
  requireNonEmptyString(args, "element_id", "wp_elementor_patch");
  requireNonEmptyString(args, "property_path", "wp_elementor_patch");
  if (!("value" in args)) {
    throw new Error("wp_elementor_patch requires a 'value' to write.");
  }
  const scope =
    args.client_id || args.project_id ? { client_id: args.client_id, project_id: args.project_id } : undefined;
  return service.patch({
    page_id: args.page_id,
    element_id: args.element_id,
    property_path: args.property_path,
    value: args.value,
    expected_baseline_sha256: args.expected_baseline_sha256,
    allow_structural: args.allow_structural === true,
    dry_run: args.dry_run === true,
    scope,
  });
}
