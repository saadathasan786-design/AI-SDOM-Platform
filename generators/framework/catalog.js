/**
 * Generator Catalog — Stage 3C.
 *
 * A read-only discovery layer over the Generator Registry. The catalog:
 *   - contains no business logic (no generation, no template loading)
 *   - performs no filesystem writes (and no reads either — it only reads
 *     already-in-memory generator definitions via generator-registry.js)
 *   - does not duplicate data already defined inside generators — it reads
 *     each generator's own declared fields and applies a documented
 *     default only when a field is genuinely absent
 *   - is independent of any future CLI, Workflow Engine, or Extension SDK —
 *     nothing here imports or assumes any of those exist
 *
 * `supportedModes` is the one exception to "read from the generator": every
 * generator runs through the same executor.js, which supports preview /
 * dry-run / write uniformly for all of them. That is a framework invariant,
 * not generator-specific data — asking every generator author to redeclare
 * "yes, I support all three modes" would be pure duplication for a fact
 * that's always true. So it's hardcoded once, here.
 */

import { listGenerators, getGenerator, hasGenerator } from "./generator-registry.js";
import { FRAMEWORK_VERSION } from "./framework-version.js";
import { isAvailableCore } from "../../framework-shared/catalog-core.js";

// Every generator runs through the same executor — see file header.
const SUPPORTED_MODES = Object.freeze(["preview", "dry-run", "write"]);

function parseVersion(version) {
  return String(version ?? "0.0.0")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);
}

// Minimal major.minor.patch comparison — no semver library. Kept local to
// the catalog rather than promoted to the framework, per the stage's own
// rule: nothing else needs version comparison yet.
function isVersionAtLeast(current, minimum) {
  const c = parseVersion(current);
  const m = parseVersion(minimum);
  for (let i = 0; i < 3; i++) {
    if ((c[i] ?? 0) !== (m[i] ?? 0)) return (c[i] ?? 0) > (m[i] ?? 0);
  }
  return true; // equal
}

function buildMetadata(def) {
  const id = def.id || def.name;
  const minimumFrameworkVersion = def.minimumFrameworkVersion ?? null;
  const frameworkCompatible = minimumFrameworkVersion
    ? isVersionAtLeast(FRAMEWORK_VERSION, minimumFrameworkVersion)
    : true;

  return {
    id,
    name: def.name,
    description: def.description,
    version: def.version,
    category: def.category ?? "uncategorized",
    supportedModes: SUPPORTED_MODES,
    templateSource: def.templateDir ?? null,
    variableManifest: def.variableManifest ?? [],
    supportedOutputs: def.supportedOutputs ?? [],
    minimumFrameworkVersion,
    frameworkCompatible,
  };
}

/** List catalog metadata for every registered generator. */
export function listCatalog() {
  return listGenerators().map((entry) => buildMetadata(getGenerator(entry.id)));
}

/** Retrieve full catalog metadata for one generator. Throws if unknown. */
export function getGeneratorMetadata(id) {
  return buildMetadata(getGenerator(id));
}

/** Retrieve just the variable manifest for one generator. Throws if unknown. */
export function getVariableManifest(id) {
  return getGenerator(id).variableManifest ?? [];
}

/** Whether a generator supports a given execution mode. Throws if unknown generator. */
export function supportsMode(id, mode) {
  getGenerator(id); // throws if unknown — keeps error behavior consistent with the rest of the catalog
  return SUPPORTED_MODES.includes(mode);
}

/**
 * Whether a generator is available: registered AND framework-compatible.
 * Does NOT throw for an unknown generator — availability checks are meant
 * to be a safe yes/no query, unlike the other lookups here which mirror
 * the registry's throw-on-unknown behavior.
 *
 * Stage 14B: the "is it registered at all" sub-check now reuses the
 * shared isAvailableCore() (framework-shared/catalog-core.js), the same
 * core Advisor/Agent/Workflow Catalogs' own isAvailable() use directly.
 * This file's own additional frameworkCompatible check -- genuinely
 * unique to Generator, confirmed in Stage 14A's own review -- remains
 * entirely local, layered on top; behavior is unchanged.
 */
export function isAvailable(id) {
  if (!isAvailableCore(hasGenerator, id)) return false;
  return getGeneratorMetadata(id).frameworkCompatible;
}

/** Retrieve framework-compatibility details for one generator. Throws if unknown. */
export function getFrameworkCompatibility(id) {
  const metadata = getGeneratorMetadata(id);
  return {
    currentFrameworkVersion: FRAMEWORK_VERSION,
    minimumFrameworkVersion: metadata.minimumFrameworkVersion,
    compatible: metadata.frameworkCompatible,
  };
}
