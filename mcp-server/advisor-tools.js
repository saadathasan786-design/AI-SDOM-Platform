/**
 * Advisor MCP Tools — Stage 4J. A thin adapter exposing the existing
 * Advisor Framework (../advisors/) through MCP tools.
 *
 * This file contains NO analysis logic, NO severity calculation, NO
 * finding creation, NO report generation. Every handler below delegates
 * directly to advisors/index.js's own, already-tested functions
 * (listAdvisorCatalog, runAdvisorWithReport, runAdvisors) and returns
 * their result unchanged. The only code here is translating between an
 * MCP tool call's { name, arguments } shape and those functions' existing
 * signatures -- the same role knowledge-graph.js/memory-store.js play for
 * their own domains, just for the Advisor Framework instead.
 *
 * The one thing this file DOES do that the Advisor Framework itself
 * doesn't: a thin presence/type check on the MCP call's own arguments
 * (e.g. "was 'id' given as a string at all?"). This is NOT duplicated
 * Advisor validation -- it's validating the shape of the incoming MCP
 * request, a distinct adapter-layer concern, since nothing upstream of
 * this handler enforces the inputSchema's `required` field at runtime.
 * Once past that shape check, everything else -- including "is this a
 * REGISTERED advisor id" -- is left entirely to the framework's own
 * existing logic (getAdvisor()'s "Unknown advisor" error, surfaced via
 * runAdvisorWithReport()'s/runAdvisors()' own never-throws contract).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAdvisorCatalog, runAdvisorWithReport, runAdvisors } from "../advisors/index.js";
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

export const advisorTools = [
  {
    name: "advisor_list",
    description:
      "List every registered Advisor from the real Advisor Catalog: id, name, description, " +
      "category, supported severities, and input requirements.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "advisor_run",
    description:
      "Run a single Advisor by id against a given context (e.g. { sourceFiles: [{path, content}] }) " +
      "and return its Advisor Report exactly as the framework produces it. Supply EITHER context OR " +
      "projectRoot, never both. Optionally set includeKnowledgeGraph to also attach the current " +
      "WordPress site's live Knowledge Graph as context.knowledgeGraph. Optionally supply memoryScope " +
      "to also attach this project's snapshot history as context.memoryHistory.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Advisor id, e.g. 'architecture', 'security', 'code-review', 'performance', 'accessibility'." },
        context: { type: "object", description: "Inputs the advisor needs, e.g. { sourceFiles: [{ path, content }] }. Mutually exclusive with projectRoot." },
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
    name: "advisor_runMany",
    description:
      "Run multiple Advisors concurrently against one shared context and return the Unified " +
      "Advisor Report exactly as the framework produces it. Supply EITHER context OR projectRoot, " +
      "never both. Optionally set includeKnowledgeGraph to also attach the current WordPress site's " +
      "live Knowledge Graph as context.knowledgeGraph. Optionally supply memoryScope to also attach " +
      "this project's snapshot history as context.memoryHistory.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, description: "Advisor ids to run." },
        context: { type: "object", description: "Shared inputs for all requested advisors. Mutually exclusive with projectRoot." },
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
      required: ["ids"],
    },
  },
];

/**
 * Resolves the context to run against from either args.context or
 * args.projectRoot, enforcing mutual exclusivity between them. Returns
 * the resolved context object directly, or throws a descriptive Error
 * that index.js's existing try/catch around tool dispatch already
 * converts into a structured MCP error response -- the same mechanism
 * already used for this file's own pre-existing shape-check throws
 * (e.g. "advisor_run requires a non-empty string 'id'.").
 *
 * Stage 10B: the mutual-exclusivity check and projectRoot resolution
 * now delegate to the shared resolveProjectSource() helper
 * (project-discovery/resolve-project-source.js) -- the exact same
 * ~6-line core previously duplicated byte-for-byte across all three CLI
 * files and all three MCP tool files. This file's own pre-existing
 * error wording ("Supply either 'context' or 'projectRoot', not both.")
 * was already identical to the shared helper's, so no translation is
 * needed here -- the helper's neutral { ok, context } | { ok, error }
 * result is unwrapped directly into this file's own throw convention.
 *
 * Stage 9B: if includeKnowledgeGraph is true, ADDITIONALLY (not
 * exclusively -- this is an orthogonal flag layered on top of whichever
 * base context was already resolved from context/projectRoot/neither)
 * calls the existing, unmodified buildProjectGraph(wpRequest) and
 * attaches its return value verbatim as context.knowledgeGraph. Built
 * only when explicitly requested -- never automatically -- exactly
 * matching this project's Stage 9A design conclusion and the same
 * "adapter builds it, framework never fetches it itself" principle
 * already proven for context/projectRoot.
 *
 * Stage 9C: if memoryScope is supplied, ADDITIONALLY (independently of
 * includeKnowledgeGraph -- context/projectRoot, includeKnowledgeGraph,
 * and memoryScope are three fully orthogonal, freely-combinable
 * options) calls the existing, unmodified
 * memory.listSnapshots({ scope: memoryScope }) and attaches its return
 * value verbatim as context.memoryHistory. memory-store.js's own
 * validateScope() throws a clear, pre-existing error for a missing or
 * malformed scope (requiring at least one of client_id/project_id) --
 * that error is allowed to propagate naturally through this async
 * function to index.js's existing catch block, exactly like every
 * other structured error this file already produces; no additional
 * wrapping or reinterpretation of memory-store.js's own error is added.
 *
 * Stage 10B ALSO deliberately does NOT move Knowledge Graph or Memory
 * handling into the shared helper: Stage 10A's own evidence found zero
 * cross-adapter duplication for either (only MCP ever calls
 * buildProjectGraph() or memory.listSnapshots()), so promoting them
 * would be relocation, not deduplication.
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

/** Delegates to listAdvisorCatalog() unchanged -- no filtering, no reshaping. */
export async function handleAdvisorList() {
  return listAdvisorCatalog();
}

/**
 * Delegates to runAdvisorWithReport() unchanged. The only logic here is
 * the MCP-request-shape check described in the file header, plus
 * resolving context vs. projectRoot via resolveContext().
 */
export async function handleAdvisorRun(args = {}) {
  if (typeof args.id !== "string" || args.id.trim() === "") {
    throw new Error("advisor_run requires a non-empty string 'id'.");
  }
  const context = await resolveContext(args);
  return runAdvisorWithReport(args.id, context);
}

/**
 * Delegates to runAdvisors() unchanged. The only logic here is the
 * MCP-request-shape check described in the file header, plus resolving
 * context vs. projectRoot via resolveContext().
 */
export async function handleAdvisorRunMany(args = {}) {
  if (!Array.isArray(args.ids)) {
    throw new Error("advisor_runMany requires 'ids' to be an array of advisor id strings.");
  }
  const context = await resolveContext(args);
  return runAdvisors(args.ids, context);
}
