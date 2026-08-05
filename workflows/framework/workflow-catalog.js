/**
 * Workflow Catalog — read-only discovery layer over the Workflow
 * Registry. Mirrors agents/framework/agent-catalog.js's PATTERN exactly
 * (list, get metadata, safe availability check, checkCompatibility) but
 * is a separate implementation -- same reasoning as
 * workflow-registry.js.
 *
 * checkCompatibility() is NOT a new facet at this layer -- per Stage 6A
 * section 5, it's the same pattern the Agent Catalog already
 * generalized, applied one level up: a Workflow declares a dependency
 * on registered Agent ids (requiredAgents), so this reads the REAL,
 * live Agent Catalog (via its existing, unmodified isAvailable()
 * export) -- a read-only query, never a mutation, never duplicating the
 * Agent Catalog's own data.
 */

import { listWorkflows, getWorkflow, hasWorkflow } from "./workflow-registry.js";
import { isAvailable as isAgentAvailable } from "../../agents/index.js";
import { isAvailableCore } from "../../framework-shared/catalog-core.js";

function buildMetadata(def) {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    version: def.version,
    category: def.category ?? "uncategorized",
    inputRequirements: def.inputRequirements,
    capabilities: def.capabilities ?? [],
    requiredAgents: def.requiredAgents ?? [],
  };
}

/** List catalog metadata for every registered workflow. */
export function listWorkflowCatalog() {
  return listWorkflows().map((entry) => buildMetadata(getWorkflow(entry.id)));
}

/** Retrieve full catalog metadata for one workflow. Throws if unknown. */
export function getWorkflowMetadata(id) {
  return buildMetadata(getWorkflow(id));
}

/**
 * Whether a workflow is available (registered). Never throws -- a safe
 * yes/no query, same convention as the Generator/Advisor/Agent
 * Catalogs' isAvailable().
 */
export function isAvailable(id) {
  return isAvailableCore(hasWorkflow, id);
}

/**
 * Checks whether a workflow's declared Agent dependencies are ACTUALLY
 * registered right now. Never throws -- returns structured
 * compatibility information regardless of outcome, including for an
 * unknown workflow id.
 */
export function checkCompatibility(id) {
  if (!hasWorkflow(id)) {
    return {
      workflow: id,
      compatible: false,
      missingAgents: [],
      error: `Unknown workflow: "${id}".`,
    };
  }

  const def = getWorkflow(id);
  const missingAgents = (def.requiredAgents ?? []).filter((agentId) => !isAgentAvailable(agentId));

  return {
    workflow: id,
    compatible: missingAgents.length === 0,
    missingAgents,
    error: null,
  };
}
