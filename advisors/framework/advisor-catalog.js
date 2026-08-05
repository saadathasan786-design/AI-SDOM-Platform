/**
 * Advisor Catalog — read-only discovery layer over the Advisor Registry.
 * Mirrors generators/framework/catalog.js's PATTERN exactly (list, get
 * metadata, get a specific facet, safe availability check) but is a
 * separate implementation — same reasoning as advisor-registry.js,
 * whose comment documents that this pattern's instance count has since
 * grown from two to four (Generator, Advisor, Agent, Workflow), with
 * promotion deliberately deferred rather than acted on outside a
 * dedicated refactor stage.
 *
 * No business logic, no writes, no data duplication: reads each advisor's
 * own declared fields and applies a documented default only when a field
 * is genuinely absent.
 *
 * Deliberately NOT included: a framework-version compatibility concept
 * (the Generator Catalog's FRAMEWORK_VERSION/minimumFrameworkVersion
 * machinery). No advisor exists yet to need it, and building that
 * machinery now, before any real advisor has ever declared a minimum
 * version requirement, would be exactly the kind of speculative
 * abstraction this project has consistently avoided. Add it if and when
 * a real advisor needs it.
 */

import { listAdvisors, getAdvisor, hasAdvisor } from "./advisor-registry.js";
import { SEVERITY_LEVELS } from "./severity.js";
import { isAvailableCore } from "../../framework-shared/catalog-core.js";

function buildMetadata(def) {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    version: def.version,
    category: def.category ?? "uncategorized",
    inputRequirements: def.inputRequirements,
    supportedSeverities: def.supportedSeverities ?? SEVERITY_LEVELS,
  };
}

/** List catalog metadata for every registered advisor. */
export function listAdvisorCatalog() {
  return listAdvisors().map((entry) => buildMetadata(getAdvisor(entry.id)));
}

/** Retrieve full catalog metadata for one advisor. Throws if unknown. */
export function getAdvisorMetadata(id) {
  return buildMetadata(getAdvisor(id));
}

/** Retrieve just the input requirements for one advisor. Throws if unknown. */
export function getInputRequirements(id) {
  return getAdvisor(id).inputRequirements;
}

/** Whether an advisor declares support for a given severity level. Throws if unknown advisor. */
export function supportsSeverity(id, severity) {
  const metadata = getAdvisorMetadata(id);
  return metadata.supportedSeverities.includes(severity);
}

/**
 * Whether an advisor is available (registered). Never throws — a safe
 * yes/no query, same convention as the Generator Catalog's isAvailable().
 */
export function isAvailable(id) {
  return isAvailableCore(hasAdvisor, id);
}
