/**
 * Plan Agent Sequence Utility — Stage 13B. Promoted from four
 * byte-identical implementations independently duplicated across
 * project-health-check-workflow.js (Stage 6C),
 * security-audit-workflow.js (Stage 6D),
 * plugin-health-audit-workflow.js (Stage 7G), and
 * release-readiness-workflow.js (Stage 7H).
 *
 * This promotion follows the exact same evidence-first precedent already
 * established by advisors/framework/source-analysis.js (Stage 4D),
 * advisors/framework/php-parsing.js (Stage 11B), and
 * agents/framework/generator-step-decision.js (Stage 12B): a shared
 * utility extracted only after real, independent, byte-identical
 * duplication accumulated across multiple real consumers -- never
 * speculative, never built ahead of evidence. Fresh, independent
 * re-verification for this stage (not assumed from Stage 13A) confirmed
 * all four workflows' plan() functions byte-identical via direct
 * three-way diff.
 *
 * SCOPE, deliberately minimal: only the "map a fixed agent sequence into
 * { agentId, context } plan steps" logic every workflow's plan()
 * already had. The agent sequence ITSELF (each workflow's own
 * AGENT_SEQUENCE constant) is workflow-specific DATA, not duplicated
 * logic -- it remains exactly where it was in each workflow file,
 * passed into this helper as a parameter. Nothing about decide() is
 * touched here: every workflow's decision policy (which genuinely
 * differs -- uniform-fail-then-final-stop vs. always-stop-at-final-step,
 * confirmed distinct in Stage 13A's own review) remains entirely local
 * to each workflow file.
 *
 * PURE, DETERMINISTIC, SIDE-EFFECT FREE: reads only its own arguments,
 * returns a plain plan object -- no I/O, no randomness, no mutation of
 * either argument.
 *
 * DEPENDENCY-FREE: no imports at all. Confirmed by this file's own
 * import list (there is none). Never imports Project Discovery,
 * Knowledge Graph, Memory, adapters, or Agent/Advisor/Generator
 * internals.
 */

/**
 * Builds a Workflow plan whose steps invoke each agent in
 * `agentSequence`, in order, each receiving the same sourceFiles.
 *
 * @param {string[]} agentSequence - the workflow's own fixed sequence
 *   of agent ids (workflow-specific data, supplied by the caller, never
 *   hardcoded here).
 * @param {{ sourceFiles: unknown }} input - the workflow's already
 *   -filtered input (per its own declared inputRequirements).
 * @returns {{ steps: { agentId: string, context: { sourceFiles: unknown } }[] }}
 */
export function planAgentSequence(agentSequence, input) {
  return {
    steps: agentSequence.map((agentId) => ({
      agentId,
      context: { sourceFiles: input.sourceFiles },
    })),
  };
}
