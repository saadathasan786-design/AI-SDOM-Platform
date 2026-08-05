/**
 * Catalog Core — Stage 14B. Promoted from the confirmed byte-identical
 * (modulo subsystem naming) isAvailable() core independently duplicated
 * across advisor-catalog.js (Stage 4B), agent-catalog.js (Stage 5B),
 * and workflow-catalog.js (Stage 6B). Fresh, independent re-verification
 * for this stage (not assumed from Stage 14A) confirmed via direct diff
 * that these three are byte-identical modulo naming.
 *
 * Generator's own isAvailable() is genuinely different (it ALSO checks
 * framework-version compatibility, confirmed unique to Generator in
 * Stage 14A's own review) -- but it still reuses this shared core for
 * its own "is it registered at all" sub-check, layering its additional
 * frameworkCompatible logic on top locally. This is not a normalization
 * of Generator's behavior to match the others; Generator's isAvailable()
 * remains behaviorally identical to before this stage, confirmed by
 * this stage's own manual validation and tests.
 *
 * SCOPE, deliberately minimal: only the "is this id currently
 * registered" check. listCatalog()/getMetadata()/supportsMode()/
 * supportsSeverity()/getInputRequirements()/getVariableManifest()/
 * getFrameworkCompatibility()/checkCompatibility() all remain exactly
 * where they were, in each subsystem's own catalog file, unchanged.
 *
 * WHY THIS LIVES OUTSIDE ANY SINGLE FRAMEWORK: same reasoning as
 * registry-core.js in this same framework-shared/ directory -- genuinely
 * cross-framework code, shared by Generator, Advisor, Agent, and
 * Workflow equally.
 *
 * DEPENDENCY-FREE: no imports at all, confirmed by this file's own
 * import list (there is none).
 *
 * PURE, STATELESS, SIDE-EFFECT FREE: takes the caller's own has*()
 * function and an id, returns a boolean, holds no state of its own.
 */

/**
 * Whether `id` is registered, according to the caller's own `hasFn`
 * (e.g. hasAdvisor, hasAgent, hasWorkflow, hasGenerator). Never throws --
 * a safe yes/no query, the exact same behavior every one of the four
 * original catalogs' own isAvailable() already had for this check.
 *
 * @param {(id: string) => boolean} hasFn - the caller's own registry
 *   hasX() function (e.g. hasAdvisor), never called or known by name
 *   here -- passed in directly, so this file never imports any
 *   subsystem's registry itself.
 * @param {string} id - the id to check.
 */
export function isAvailableCore(hasFn, id) {
  return hasFn(id);
}
