/**
 * Workflow Registry — id -> workflow definition, validated at
 * registration time via workflow-interface.js.
 *
 * Deliberately a plain Map-backed registry, same PATTERN as
 * agents/framework/agent-registry.js, advisors/framework/advisor-registry.js,
 * and generators/framework/generator-registry.js -- no auto-discovery, no
 * filesystem scanning, explicit registerWorkflow() only.
 *
 * Stage 6A identified this as the fourth instance of an identical
 * pattern and concluded, with concrete evidence, that a shared registry
 * factory is now justified in principle. That promotion is EXPLICITLY
 * DEFERRED to a future, dedicated refactor stage -- not implemented
 * here, per Stage 6B's explicit instruction not to extract or introduce
 * a shared Registry factory in this foundation build. This file remains
 * an independent implementation, matching the other three exactly.
 */

import { validateWorkflowDefinition } from "./workflow-interface.js";
import { registerCore, getCore, hasCore } from "../../framework-shared/registry-core.js";

const registry = new Map();

export function registerWorkflow(definition) {
  validateWorkflowDefinition(definition);
  registerCore(registry, definition.id, definition, "Workflow");
}

export function getWorkflow(id) {
  return getCore(registry, id, "workflow");
}

export function hasWorkflow(id) {
  return hasCore(registry, id);
}

export function listWorkflows() {
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
