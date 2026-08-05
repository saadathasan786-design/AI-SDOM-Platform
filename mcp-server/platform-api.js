/**
 * Platform API — minimal internal dispatcher (Layer 1).
 *
 * Deliberately thin: a moduleName -> action -> handler registry, plus one
 * `call()` function. Introduced now (Stage 2) because Memory is a second
 * real module alongside Stage 1's Knowledge Graph — the two-consumer bar
 * set in the approved architecture for adding this layer.
 *
 * Do NOT add validation, events, middleware, retries, or versioning here
 * until a THIRD module needs something this shape can't already do. This
 * is routing only, no business logic — modules keep their own internal
 * logic exactly as before; this just gives callers (like index.js) one
 * consistent way to reach any module instead of importing every module
 * directly everywhere.
 */

const registry = new Map();

/**
 * @param {string} name - module name, e.g. "knowledgeGraph", "memory"
 * @param {Record<string, Function>} actions - map of action name -> async handler
 */
export function registerModule(name, actions) {
  if (registry.has(name)) {
    throw new Error(`Module "${name}" is already registered.`);
  }
  registry.set(name, actions);
}

/**
 * @param {string} moduleName
 * @param {string} action
 * @param {any} payload - passed through untouched to the handler
 */
export async function call(moduleName, action, payload) {
  const actions = registry.get(moduleName);
  if (!actions) {
    throw new Error(`Unknown module: ${moduleName}`);
  }
  const handler = actions[action];
  if (!handler) {
    throw new Error(`Unknown action "${action}" on module "${moduleName}".`);
  }
  return handler(payload);
}

/** For debugging/introspection only — not used by any business logic. */
export function listModules() {
  return [...registry.keys()].map((name) => ({
    name,
    actions: Object.keys(registry.get(name)),
  }));
}

/** Test-only helper: clears the registry so tests don't leak state across files. */
export function _resetForTests() {
  registry.clear();
}
