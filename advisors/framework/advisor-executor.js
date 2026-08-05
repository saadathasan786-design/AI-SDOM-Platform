/**
 * Advisor Executor — runs a registered advisor's `analyze()` against a
 * context of available inputs.
 *
 * This is deliberately much simpler than the Generator Executor:
 * - No preview/dry-run/write modes — an advisor only ever analyzes.
 * - No conflict detection, no rollback — nothing is written, so neither
 *   concept applies. This is not an omission; it's the correct shape for
 *   a read-only operation.
 * - "Assembles inputs only": the executor's one job is to pick out
 *   exactly the keys the advisor's `inputRequirements` declared from the
 *   caller-supplied context, and hand that (and only that) to `analyze()`.
 *   The executor never fetches those inputs itself (it doesn't call the
 *   Knowledge Graph, Memory, or anything else) — the caller is
 *   responsible for supplying a context object containing whatever it
 *   already has; the executor's only responsibility is the hand-off.
 */

import { getAdvisor } from "./advisor-registry.js";

/**
 * @param {string} id - registered advisor id
 * @param {object} context - a bag of whatever inputs the caller has available,
 *   e.g. { generationReport, knowledgeGraph, memoryHistory, sourceFiles, catalogMetadata }
 * @returns {Promise<{ advisor: string, findings: object[] }>}
 */
export async function runAdvisor(id, context = {}) {
  const advisorDef = getAdvisor(id);

  const input = {};
  for (const requirement of advisorDef.inputRequirements) {
    if (!(requirement in context)) {
      throw new Error(
        `Advisor "${id}" requires input "${requirement}" but it was not provided in the context.`
      );
    }
    input[requirement] = context[requirement];
  }

  const findings = await advisorDef.analyze(input);
  return { advisor: id, findings: findings ?? [] };
}
