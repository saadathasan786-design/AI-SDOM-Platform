/**
 * Agent Catalog — read-only discovery layer over the Agent Registry.
 * Mirrors generators/framework/catalog.js and
 * advisors/framework/advisor-catalog.js's PATTERN exactly (list, get
 * metadata, safe availability check) but is a separate implementation --
 * same reasoning as agent-registry.js.
 *
 * checkCompatibility() is the one genuinely NEW facet neither the
 * Generator nor Advisor Catalog needed: Generators and Advisors never
 * declared a dependency on each other's registered content, but Agents
 * genuinely do (a plan may reference specific advisor/generator ids). This
 * reads the REAL, live Advisor and Generator Catalogs (via their existing,
 * unmodified isAvailable() exports) -- a read-only query, never a mutation,
 * and never duplicating either catalog's own data.
 */

import { listAgents, getAgent, hasAgent } from "./agent-registry.js";
import { isAvailable as isAdvisorAvailable } from "../../advisors/index.js";
import { isAvailable as isGeneratorAvailable } from "../../generators/index.js";
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
    supportedSeverities: def.supportedSeverities ?? [],
    requiresAdvisors: def.requiresAdvisors ?? [],
    requiresGenerators: def.requiresGenerators ?? [],
  };
}

/** List catalog metadata for every registered agent. */
export function listAgentCatalog() {
  return listAgents().map((entry) => buildMetadata(getAgent(entry.id)));
}

/** Retrieve full catalog metadata for one agent. Throws if unknown. */
export function getAgentMetadata(id) {
  return buildMetadata(getAgent(id));
}

/**
 * Whether an agent is available (registered). Never throws -- a safe
 * yes/no query, same convention as the Generator/Advisor Catalogs'
 * isAvailable().
 */
export function isAvailable(id) {
  return isAvailableCore(hasAgent, id);
}

/**
 * Checks whether an agent's declared Advisor/Generator dependencies are
 * ACTUALLY registered right now. Never throws -- returns structured
 * compatibility information regardless of outcome, including for an
 * unknown agent id.
 */
export function checkCompatibility(id) {
  if (!hasAgent(id)) {
    return {
      agent: id,
      compatible: false,
      missingAdvisors: [],
      missingGenerators: [],
      error: `Unknown agent: "${id}".`,
    };
  }

  const def = getAgent(id);
  const missingAdvisors = (def.requiresAdvisors ?? []).filter((advisorId) => !isAdvisorAvailable(advisorId));
  const missingGenerators = (def.requiresGenerators ?? []).filter((generatorId) => !isGeneratorAvailable(generatorId));

  return {
    agent: id,
    compatible: missingAdvisors.length === 0 && missingGenerators.length === 0,
    missingAdvisors,
    missingGenerators,
    error: null,
  };
}
