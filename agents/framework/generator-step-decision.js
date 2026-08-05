/**
 * Generator-Step Decision Utility — Stage 12B. Promoted from five
 * near-identical implementations independently duplicated across
 * architecture-remediation-agent.js (Stage 5C),
 * performance-optimization-agent.js (Stage 5H),
 * security-remediation-agent.js (Stage 5G),
 * plugin-security-remediation-agent.js (Stage 7E), and
 * plugin-performance-optimization-agent.js (Stage 7F).
 *
 * This promotion follows the exact same evidence-first precedent already
 * established by advisors/framework/source-analysis.js (Stage 4D) and
 * advisors/framework/php-parsing.js (Stage 11B): a shared utility
 * extracted only after real, independent duplication accumulated across
 * multiple real consumers -- never speculative, never built ahead of
 * evidence. Fresh, independent re-verification for this stage (not
 * assumed from Stage 12A) confirmed 4 of 5 agents byte-identical via
 * direct diff, with the 5th differing only in a single word choice
 * ("Remediation" vs "Optimization") appearing twice.
 *
 * SCOPE, deliberately minimal: only the generator-step decision outcome
 * itself (fail on failure, stop on success) -- the exact behavior every
 * one of the five agents' own decide() functions already had for this
 * one step type. Nothing about planning, Advisor execution, or
 * orchestration is touched; every agent's own advisor-step decision
 * logic (which genuinely differs agent-to-agent -- isolated vs.
 * accumulated thresholds, critical/warning/suggestion counts, etc.,
 * confirmed unique per agent in Stage 12A's own review) remains exactly
 * where it was.
 *
 * PURE, DETERMINISTIC, SIDE-EFFECT FREE: this function reads only its
 * own arguments and returns a plain decision object -- no I/O, no
 * randomness, no mutation of its input.
 *
 * DEPENDENCY-FREE: no imports at all. Confirmed by this file's own
 * import list (there is none). Never imports Project Discovery,
 * Knowledge Graph, Memory, adapters, Workflow Framework, or Generator/
 * Advisor internals.
 */

/**
 * Decides the outcome of a generator step, given its already-computed
 * result. Fails if the generator step itself failed; otherwise stops
 * (a generator step is always the final step in every current agent's
 * plan, so a successful generator step always ends the agent's run).
 *
 * @param {{ success: boolean, error?: string }} result - the generator
 *   step's already-computed result (never fetched or re-executed here).
 * @param {{ actionLabel?: string }} [options] - actionLabel customizes
 *   the human-readable label used in both reason strings (defaults to
 *   "Remediation", matching four of the five original agents' own
 *   pre-existing wording; plugin-performance-optimization-agent.js
 *   passes "Optimization" to preserve its own pre-existing wording
 *   byte-for-byte).
 * @returns {{ action: "fail" | "stop", reason: string }}
 */
export function decideGeneratorStep(result, { actionLabel = "Remediation" } = {}) {
  if (!result.success) {
    return { action: "fail", reason: `${actionLabel} generator step failed: ${result.error}` };
  }
  return { action: "stop", reason: `${actionLabel} generator step completed successfully (dry-run).` };
}
