/**
 * Agent MCP Tools — Stage 5D. A thin adapter exposing the existing Agent
 * Framework (../agents/) through MCP tools, following exactly the same
 * discipline as mcp-server/advisor-tools.js (Stage 4J).
 *
 * This file contains NO planning logic, NO decision logic, NO analysis
 * logic, NO generation logic, NO report construction. Every handler
 * delegates directly to agents/index.js's own, already-tested functions
 * (listAgentCatalog, runAgentWithReport, checkCompatibility) and returns
 * their result unchanged. The only code here is translating between an
 * MCP tool call's { name, arguments } shape and those functions' existing
 * signatures.
 *
 * The one thing this file DOES do that the Agent Framework itself
 * doesn't: a thin presence/type check on the MCP call's own arguments
 * (e.g. "was 'id' given as a string at all?"). This is NOT duplicated
 * Agent validation -- it's validating the shape of the incoming MCP
 * request, the same distinct adapter-layer concern advisor-tools.js
 * already established. Once past that shape check, everything else --
 * including "is this a REGISTERED agent id" -- is left entirely to the
 * framework's own existing logic (getAgent()'s "Unknown agent" error,
 * surfaced via runAgentWithReport()'s/checkCompatibility()'s own
 * never-throws contracts).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgentCatalog, runAgentWithReport, checkCompatibility } from "../agents/index.js";
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

export const agentTools = [
  {
    name: "agent_list",
    description:
      "List every registered Agent from the real Agent Catalog: id, name, description, category, " +
      "input requirements, capabilities, and declared Advisor/Generator dependencies.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "agent_run",
    description:
      "Run a single Agent by id against a given context (e.g. { sourceFiles: [{path, content}] }) " +
      "and return its Agent Report exactly as the framework produces it. Supply EITHER context OR " +
      "projectRoot, never both. Optionally set includeKnowledgeGraph to also attach the current " +
      "WordPress site's live Knowledge Graph as context.knowledgeGraph. Optionally supply memoryScope " +
      "to also attach this project's snapshot history as context.memoryHistory.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Agent id, e.g. 'architecture-remediation'." },
        context: { type: "object", description: "Inputs the agent needs, e.g. { sourceFiles: [{ path, content }] }. Mutually exclusive with projectRoot." },
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
    name: "agent_checkCompatibility",
    description:
      "Check whether an Agent's declared Advisor/Generator dependencies are actually registered " +
      "right now. Returns structured compatibility information exactly as the framework produces it.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Agent id to check." },
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
 * advisor-tools.js's migration.
 *
 * Stage 9B: if includeKnowledgeGraph is true, ADDITIONALLY attaches the
 * existing, unmodified buildProjectGraph(wpRequest)'s return value
 * verbatim as context.knowledgeGraph -- built only when explicitly
 * requested, identical to advisor-tools.js's implementation.
 *
 * Stage 9C: if memoryScope is supplied, ADDITIONALLY (independently of
 * includeKnowledgeGraph) attaches memory.listSnapshots({ scope:
 * memoryScope })'s return value verbatim as context.memoryHistory,
 * identical to advisor-tools.js's implementation.
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

/** Delegates to listAgentCatalog() unchanged -- no filtering, no reshaping. */
export async function handleAgentList() {
  return listAgentCatalog();
}

/**
 * Delegates to runAgentWithReport() unchanged. The only logic here is
 * the MCP-request-shape check described in the file header, plus
 * resolving context vs. projectRoot via resolveContext().
 */
export async function handleAgentRun(args = {}) {
  if (typeof args.id !== "string" || args.id.trim() === "") {
    throw new Error("agent_run requires a non-empty string 'id'.");
  }
  const context = await resolveContext(args);
  return runAgentWithReport(args.id, context);
}

/**
 * Delegates to checkCompatibility() unchanged. The only logic here is
 * the MCP-request-shape check described in the file header.
 */
export async function handleAgentCheckCompatibility(args = {}) {
  if (typeof args.id !== "string" || args.id.trim() === "") {
    throw new Error("agent_checkCompatibility requires a non-empty string 'id'.");
  }
  return checkCompatibility(args.id);
}
