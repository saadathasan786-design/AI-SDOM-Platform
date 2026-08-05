/**
 * Resolve Project Source — Stage 10B. The narrow, evidence-based
 * extraction identified in Stage 10A: the ~6-line core that was
 * byte-for-byte duplicated across all 6 CLI/MCP resolveContext()
 * implementations (validate context/projectRoot mutual exclusivity,
 * call discoverProject(), unwrap its result).
 *
 * SCOPE, EXACTLY AS DESIGNED: this helper does ONLY three things --
 * mutual-exclusivity validation, invoking discoverProject(), and
 * translating its result into a neutral { ok, context } | { ok, error }
 * shape. It deliberately does NOT load JSON context files (CLI-only,
 * no cross-adapter duplication existed for that piece -- see Stage
 * 10A Section 2), does NOT touch Knowledge Graph (MCP-only, zero CLI
 * counterpart), and does NOT touch Memory (MCP-only, zero CLI
 * counterpart). Each adapter's own file keeps those responsibilities
 * exactly where they already were.
 *
 * DEPENDENCY-FREE except for discoverProject() -- confirmed by this
 * file's own import list. This keeps this helper firmly inside the
 * existing project-discovery/ dependency boundary rather than
 * introducing any new architectural layer: it depends on
 * discoverProject() the exact same way project-type-detection.js
 * already does, and nothing depends on it from outside the adapter
 * layer.
 *
 * ADAPTER OWNERSHIP PRESERVED: this helper is adapter-layer code, not
 * framework code. It has no framework import, and no framework imports
 * it. Each adapter (CLI, MCP) remains fully responsible for its own
 * error-handling convention -- this helper never throws and never
 * decides how a failure should be surfaced; it only reports facts.
 *
 * WHY KNOWLEDGE GRAPH AND MEMORY REMAIN OUTSIDE THIS HELPER: Stage 10A's
 * own responsibility analysis (Section 2) found that MCP's Knowledge
 * Graph and Memory loading have no shared counterpart anywhere in the
 * CLI -- only MCP ever calls buildProjectGraph() or
 * memory-store.js's listSnapshots(). Promoting logic that only one of
 * two adapter families uses is not deduplication, it is relocation --
 * Stage 10A's Section 4 (Common Abstraction Analysis) explicitly found
 * no genuine shared behavior there to justify moving it. Each MCP file
 * therefore keeps its own Knowledge Graph and Memory handling exactly
 * as it already was.
 */

import { discoverProject } from "./discover-project.js";

/**
 * Validates that at most one of `context`/`projectRoot` was supplied,
 * then either resolves `projectRoot` via the existing, unmodified
 * discoverProject() or passes `context` through unchanged. Never
 * throws -- every outcome, success or failure, is reported as data.
 *
 * @param {{ context?: object, projectRoot?: string }} input
 * @returns {Promise<{ ok: true, context: object } | { ok: false, error: string }>}
 */
export async function resolveProjectSource({ context, projectRoot } = {}) {
  if (context !== undefined && projectRoot !== undefined) {
    return { ok: false, error: "Supply either 'context' or 'projectRoot', not both." };
  }

  if (projectRoot !== undefined) {
    const result = await discoverProject(projectRoot);
    if (!result.success) {
      return { ok: false, error: result.error };
    }
    return { ok: true, context: result.context };
  }

  return { ok: true, context: context ?? {} };
}
