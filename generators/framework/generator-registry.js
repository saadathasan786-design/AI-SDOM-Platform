/**
 * Generator Registry — id -> generator definition, validated at
 * registration time via generator-interface.js.
 *
 * Deliberately a plain Map-backed registry, same pattern as the Platform
 * API dispatcher (mcp-server/platform-api.js) — no plugin-discovery magic,
 * no filesystem scanning. A generator gets in by calling registerGenerator()
 * explicitly. Auto-discovery (e.g. "scan a folder for generator.js files")
 * is an Extension SDK concern (Layer 5, later stage), not this registry's.
 *
 * Stage 3C change: the registry key is `definition.id` if present,
 * otherwise `definition.name` (unchanged behavior for any generator that
 * doesn't declare an id). This split exists because the Generator Catalog
 * needs a stable, machine-readable key distinct from a human-readable
 * display name ("plugin" vs "Plugin Generator") — every generator needs
 * this the same way, so it lives here rather than being reinvented per
 * generator.
 */

import { validateGeneratorDefinition } from "./generator-interface.js";
import { registerCore, getCore, hasCore } from "../../framework-shared/registry-core.js";

const registry = new Map();

function keyFor(definition) {
  return definition.id || definition.name;
}

export function registerGenerator(definition) {
  validateGeneratorDefinition(definition);
  const key = keyFor(definition);
  registerCore(registry, key, definition, "Generator");
}

export function getGenerator(id) {
  return getCore(registry, id, "generator");
}

export function hasGenerator(id) {
  return hasCore(registry, id);
}

export function listGenerators() {
  return [...registry.entries()].map(([id, def]) => ({
    id,
    name: def.name,
    version: def.version,
    description: def.description,
    configSchema: def.configSchema,
  }));
}

/** Test-only helper: clears the registry so tests don't leak state across files. */
export function _resetForTests() {
  registry.clear();
}
