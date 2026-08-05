/**
 * Workflow MCP Tools — thin adapter exposing the existing Workflow
 * Framework (../workflows/) through MCP tools, following exactly the
 * same discipline as mcp-server/advisor-tools.js (Stage 4J) and
 * mcp-server/agent-tools.js (Stage 5D).
 *
 * This file contains NO planning logic, NO decision logic, NO analysis
 * logic, NO generation logic, NO report construction. Every handler
 * delegates directly to workflows/index.js's own, already-tested
 * functions (listWorkflowCatalog, runWorkflowWithReport,
 * checkCompatibility) and returns their result unchanged.
 *
 * The one thing this file DOES do that the Workflow Framework itself
 * doesn't: a thin presence/type check on the MCP call's own arguments
 * (e.g. "was 'id' given as a string at all?"). This is NOT duplicated
 * Workflow validation -- it's validating the shape of the incoming MCP
 * request, the same distinct adapter-layer concern advisor-tools.js and
 * agent-tools.js already established. Once past that shape check,
 * everything else -- including "is this a REGISTERED workflow id" -- is
 * left entirely to the framework's own existing logic (getWorkflow()'s
 * "Unknown workflow" error, surfaced via runWorkflowWithReport()'s/
 * checkCompatibility()'s own never-throws contracts).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { listWorkflowCatalog, runWorkflowWithReport, checkCompatibility } from "../workflows/index.js";
import { resolveProjectSource } from "../project-discovery/resolve-project-source.js";
import { buildProjectGraph } from "./knowledge-graph.js";
import { wpRequest } from "./wp-client.js";
import { createMemoryStore } from "./memory-store.js";

// Same memory/ directory index.js already points its own createMemoryStore()
// instance at -- constructed locally here rather than importing a shared
// singleton, since memory-store.js exports only the createMemoryStore()
// factory (unlike wp-client.js's directly-exported wpRequest singleton).
// This is the exact same, unmodified factory function index.js already
// uses, not a new abstraction.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const memory = createMemoryStore(path.join(__dirname, "..", "memory"));

export const workflowTools = [
  {
    name: "workflow_list",
    description:
      "List every registered Workflow from the real Workflow Catalog: id, name, description, category, " +
      "input requirements, capabilities, and declared required Agents.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "workflow_run",
    description:
      "Run a single Workflow by id against a given context (e.g. { sourceFiles: [{path, content}] }) " +
      "and return its Workflow Report exactly as the framework produces it. Supply EITHER context OR " +
      "projectRoot, never both. Optionally set includeKnowledgeGraph to also attach the current " +
      "WordPress site's live Knowledge Graph as context.knowledgeGraph. Optionally supply memoryScope " +
      "to also attach this project's snapshot history as context.memoryHistory.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Workflow id, e.g. 'project-health-check', 'security-audit'." },
        context: { type: "object", description: "Inputs the workflow needs, e.g. { sourceFiles: [{ path, content }] }. Mutually exclusive with projectRoot." },
        projectRoot: {
          type: "string",
          description:
            "A directory path to automatically discover context from (via the existing Project Context Discovery utility). Mutually exclusive with context.",
        },
        includeKnowledgeGraph: {
          type: "boolean",
          description:
            "If true, builds the current WordPress site's live Knowledge Graph and attaches it as context.knowledgeGraph, in addition to context/projectRoot. Off by default.",
        },
        memoryScope: {
          type: "object",
          description:
            "If supplied ({ client_id?, project_id? }, at least one required), retrieves this scope's Memory snapshot history and attaches it as context.memoryHistory. Omitted by default.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "workflow_checkCompatibility",
    description:
      "Check whether a Workflow's declared required Agents are actually registered right now. Returns " +
      "structured compatibility information exactly as the framework produces it.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Workflow id to check." },
      },
      required: ["id"],
    },
  },
];

/**
 * Resolves the context to run against from either args.context or
 * args.projectRoot, enforcing mutual exclusivity between them. See
 * advisor-tools.js's identical resolveContext() for the full rationale.
 *
 * Stage 10B: the mutual-exclusivity check and projectRoot resolution
 * now delegate to the shared resolveProjectSource() helper
 * (project-discovery/resolve-project-source.js) -- identical to
 * advisor-tools.js/agent-tools.js's migration.
 *
 * Stage 9B: if includeKnowledgeGraph is true, ADDITIONALLY attaches the
 * existing, unmodified buildProjectGraph(wpRequest)'s return value
 * verbatim as context.knowledgeGraph -- built only when explicitly
 * requested, identical to advisor-tools.js/agent-tools.js's
 * implementation.
 *
 * Stage 9C: if memoryScope is supplied, ADDITIONALLY (independently of
 * includeKnowledgeGraph) attaches memory.listSnapshots({ scope:
 * memoryScope })'s return value verbatim as context.memoryHistory,
 * identical to advisor-tools.js/agent-tools.js's implementation.
 */
export async function resolveContext(args) {
  const resolved = await resolveProjectSource({ context: args.context, projectRoot: args.projectRoot });
  if (!resolved.ok) {
    throw new Error(resolved.error);
  }
  let context = resolved.context;

  if (args.includeKnowledgeGraph === true) {
    const knowledgeGraph = await buildProjectGraph(wpRequest);
    context = { ...context, knowledgeGraph };
  }

  if (args.memoryScope !== undefined) {
    const memoryHistory = await memory.listSnapshots({ scope: args.memoryScope });
    context = { ...context, memoryHistory };
  }

  return context;
}

/** Delegates to listWorkflowCatalog() unchanged -- no filtering, no reshaping. */
export async function handleWorkflowList() {
  return listWorkflowCatalog();
}

/**
 * Delegates to runWorkflowWithReport() unchanged. The only logic here is
 * the MCP-request-shape check described in the file header, plus
 * resolving context vs. projectRoot via resolveContext().
 */
export async function handleWorkflowRun(args = {}) {
  if (typeof args.id !== "string" || args.id.trim() === "") {
    throw new Error("workflow_run requires a non-empty string 'id'.");
  }
  const context = await resolveContext(args);
  return runWorkflowWithReport(args.id, context);
}

/**
 * Delegates to checkCompatibility() unchanged. The only logic here is
 * the MCP-request-shape check described in the file header.
 */
export async function handleWorkflowCheckCompatibility(args = {}) {
  if (typeof args.id !== "string" || args.id.trim() === "") {
    throw new Error("workflow_checkCompatibility requires a non-empty string 'id'.");
  }
  return checkCompatibility(args.id);
}
