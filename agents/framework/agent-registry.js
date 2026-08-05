/**
 * Agent Registry — id -> agent definition, validated at registration
 * time via agent-interface.js.
 *
 * Deliberately a plain Map-backed registry, same PATTERN as
 * generators/framework/generator-registry.js and
 * advisors/framework/advisor-registry.js -- no auto-discovery, no
 * filesystem scanning, explicit registerAgent() only.
 *
 * This is a separate implementation, not shared code. At this file's
 * original writing, a third near-identical registry (Generator,
 * Advisor, Agent) was itself the kind of evidence this project's
 * promotion discipline calls for -- but the promotion candidate was a
 * FUTURE "generic registry factory," not something to build
 * speculatively on three data points assembled in the same stage. That
 * count has since grown to four (Generator, Advisor, Agent, Workflow),
 * independently verified as of Stage 12B -- the "fourth registry-like
 * need" this comment originally said to revisit on has in fact
 * appeared. Promotion remains deliberately deferred, not because the
 * evidence is insufficient, but per this project's established
 * discipline of not refactoring frozen, already-tested framework code
 * outside a dedicated stage scoped for that purpose (see Stage 5A's
 * Registry section for the original reasoning, and Stages
 * 6A/6G/7I/8G/9D/11A/11B/12A for the accumulated evidence trail).
 */

import { validateAgentDefinition } from "./agent-interface.js";
import { registerCore, getCore, hasCore } from "../../framework-shared/registry-core.js";

const registry = new Map();

export function registerAgent(definition) {
  validateAgentDefinition(definition);
  registerCore(registry, definition.id, definition, "Agent");
}

export function getAgent(id) {
  return getCore(registry, id, "agent");
}

export function hasAgent(id) {
  return hasCore(registry, id);
}

export function listAgents() {
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
