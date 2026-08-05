/**
 * Registry Core — Stage 14B. Promoted from the confirmed byte-identical
 * (modulo subsystem naming) register/get/has core independently
 * duplicated across generator-registry.js (Stage 3),
 * advisor-registry.js (Stage 4B), agent-registry.js (Stage 5B), and
 * workflow-registry.js (Stage 6B). Fresh, independent re-verification
 * for this stage (not assumed from Stage 14A) confirmed via direct diff
 * that Advisor/Agent/Workflow's register/get/has functions are
 * byte-identical modulo naming; Generator's diverges only in its
 * key-extraction step (id || name fallback), confirmed unchanged and
 * NOT extracted here, per Stage 14A's own promotion-boundary analysis.
 *
 * This promotion follows the exact same evidence-first precedent already
 * established by advisors/framework/source-analysis.js (Stage 4D),
 * advisors/framework/php-parsing.js (Stage 11B),
 * agents/framework/generator-step-decision.js (Stage 12B), and
 * workflows/framework/plan-agent-sequence.js (Stage 13B).
 *
 * SCOPE, deliberately minimal: only register/get/has. Each subsystem's
 * own Map instance remains entirely local to its own registry file --
 * this file holds no state of its own and stores nothing; it is three
 * pure functions operating on a Map passed in by the caller. list*(),
 * _resetForTests(), every exported wrapper name, and all validation
 * logic remain exactly where they were, in each subsystem's own
 * registry file, unchanged.
 *
 * WHY THIS LIVES OUTSIDE ANY SINGLE FRAMEWORK: this is genuinely
 * cross-framework code, shared by Generator, Advisor, Agent, and
 * Workflow equally -- placing it inside any one of their own
 * framework/ directories would misrepresent ownership. framework-shared/
 * is a new, minimal, purpose-built location for exactly this kind of
 * cross-framework-layer sharing, distinct from project-discovery/
 * (which is adapter-layer shared code, a different architectural tier
 * entirely, confirmed unrelated in every prior review stage).
 *
 * DEPENDENCY-FREE: no imports at all, confirmed by this file's own
 * import list (there is none). Never imports Project Discovery,
 * Knowledge Graph, Memory, adapters, or any subsystem's internals --
 * this file is imported BY subsystems, never the reverse.
 *
 * PURE, STATELESS, SIDE-EFFECT FREE WITH RESPECT TO ITS OWN MODULE
 * SCOPE: every function here takes the caller's own Map as an explicit
 * parameter and mutates only that Map -- never any state of its own,
 * since it holds none.
 */

/**
 * Registers `definition` under `key` in `registry`. Throws if `key` is
 * already present -- the exact same duplicate-registration behavior
 * every one of the four original registries already had.
 *
 * @param {Map<string, object>} registry - the caller's own registry Map.
 * @param {string} key - the key to register under (already extracted by
 *   the caller -- e.g. Generator's own keyFor() fallback logic runs
 *   BEFORE calling this function, entirely outside this file).
 * @param {object} definition - the definition to store, stored verbatim.
 * @param {string} label - a capitalized, human-readable subsystem label
 *   for the error message (e.g. "Generator", "Advisor", "Agent",
 *   "Workflow"), matching each subsystem's own pre-existing wording
 *   exactly.
 */
export function registerCore(registry, key, definition, label) {
  if (registry.has(key)) {
    throw new Error(`${label} "${key}" is already registered.`);
  }
  registry.set(key, definition);
}

/**
 * Retrieves the definition registered under `id`. Throws a descriptive
 * error listing every currently-registered id if `id` is unknown -- the
 * exact same missing-item behavior every one of the four original
 * registries already had.
 *
 * @param {Map<string, object>} registry - the caller's own registry Map.
 * @param {string} id - the id to look up.
 * @param {string} labelLower - a lowercase, human-readable subsystem
 *   label for the error message (e.g. "generator", "advisor", "agent",
 *   "workflow"), matching each subsystem's own pre-existing wording
 *   exactly. Pluralized by appending "s", matching every one of the
 *   four original registries' own regular pluralization.
 */
export function getCore(registry, id, labelLower) {
  const def = registry.get(id);
  if (!def) {
    throw new Error(
      `Unknown ${labelLower}: "${id}". Registered ${labelLower}s: ${[...registry.keys()].join(", ") || "(none)"}`
    );
  }
  return def;
}

/**
 * Whether `id` is currently registered. Never throws -- a safe yes/no
 * query, the exact same behavior every one of the four original
 * registries already had.
 *
 * @param {Map<string, object>} registry - the caller's own registry Map.
 * @param {string} id - the id to check.
 */
export function hasCore(registry, id) {
  return registry.has(id);
}
