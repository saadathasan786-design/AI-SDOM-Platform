/**
 * Advisor Registry — id -> advisor definition, validated at registration
 * time via advisor-interface.js.
 *
 * Deliberately a plain Map-backed registry, same PATTERN as
 * generators/framework/generator-registry.js — no auto-discovery, no
 * filesystem scanning. An advisor gets in by calling registerAdvisor()
 * explicitly.
 *
 * This is a separate implementation, not shared code. At this file's
 * original writing, two structurally identical registries (Generator,
 * Advisor) existed -- below this project's own two-consumer promotion
 * bar for extracting a shared "generic registry factory." That count
 * has since grown to four (Generator, Advisor, Agent, Workflow),
 * independently verified as of Stage 11B -- the promotion bar has in
 * fact been met. Promotion remains deliberately deferred, not because
 * the evidence is insufficient, but per this project's established
 * discipline of not refactoring frozen, already-tested framework code
 * outside a dedicated stage scoped for that purpose (see Stages
 * 6A/6G/7I/8G/9D/11A for the accumulated evidence trail).
 *
 * Unlike the Generator Registry (which falls back to `name` as the key
 * for backward compatibility with pre-Stage-3C generators), every advisor
 * requires an explicit `id` from day one — there is no legacy population
 * to stay compatible with here.
 */

import { validateAdvisorDefinition } from "./advisor-interface.js";
import { registerCore, getCore, hasCore } from "../../framework-shared/registry-core.js";

const registry = new Map();

export function registerAdvisor(definition) {
  validateAdvisorDefinition(definition);
  registerCore(registry, definition.id, definition, "Advisor");
}

export function getAdvisor(id) {
  return getCore(registry, id, "advisor");
}

export function hasAdvisor(id) {
  return hasCore(registry, id);
}

export function listAdvisors() {
  return [...registry.entries()].map(([id, def]) => ({
    id,
    name: def.name,
    version: def.version,
    description: def.description,
    inputRequirements: def.inputRequirements,
  }));
}

/** Test-only helper: clears the registry so tests don't leak state across files. */
export function _resetForTests() {
  registry.clear();
}
