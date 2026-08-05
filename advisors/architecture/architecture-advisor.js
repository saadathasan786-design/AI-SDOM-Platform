/**
 * Architecture Advisor — Stage 4C. The first real Advisor.
 *
 * Analyzes the project's own module dependency structure: circular
 * dependencies, dependency depth, layer violations, subsystem boundaries,
 * framework coupling (fan-in), registry/catalog convention consistency,
 * public API export cohesion, and technical-debt markers (TODO/FIXME).
 *
 * PURITY: `analyze()` never touches the filesystem. It receives
 * `sourceFiles` — an array of { path, content } pairs the CALLER already
 * read from disk — and does everything else (import parsing, graph
 * building, cycle detection, layer classification) as pure computation.
 * This mirrors exactly the discipline every Stage 3 generator's `generate()`
 * already followed: the executor/caller does I/O, the analysis function
 * does not.
 *
 * IMPORT PARSING: regex-based, not a real JS parser — the same documented
 * trade-off `generators/framework/php-class-injector.js` makes for PHP.
 * Reliable for the well-formed ESM `import ... from "..."` / `export ...
 * from "..."` statements this project consistently uses; not a general
 * JS analysis tool.
 *
 * EVIDENCE DISCIPLINE: every finding below is derived directly from the
 * given sourceFiles — nothing is speculated. Where a check can't be
 * confidently evaluated (e.g. an import specifier that doesn't resolve to
 * any given file), it is silently skipped rather than guessed at.
 *
 * LAYER RULES ARE PROJECT-SPECIFIC, ON PURPOSE. This advisor is built to
 * analyze THIS platform's known structure (generators/framework,
 * generators/*, advisors/framework, advisors/*, mcp-server) — the same
 * layering documented in Stage 3L's manual dependency audit. This is not
 * a hidden framework dependency (the Advisor Framework has no knowledge
 * of any of this); it's this one advisor's own domain knowledge, the same
 * way cpt-taxonomy-generator.js hardcodes WordPress's 20-character
 * post-type-key limit as its own domain knowledge rather than framework
 * config. See docs/ARCHITECTURE-ADVISOR.md for the framework-sufficiency
 * evaluation this design choice is based on.
 */

import path from "node:path";
import {
  buildDependencyGraph,
  computeFanIn,
  findDebtMarkers,
} from "../framework/source-analysis.js";

const LAYER_RULES = [
  { name: "platform-integration-intelligence", prefix: "mcp-server/" },
  { name: "generator-framework", prefix: "generators/framework/" },
  { name: "generators", prefix: "generators/" },
  { name: "advisor-framework", prefix: "advisors/framework/" },
  { name: "advisors", prefix: "advisors/" },
];

// Which top-level subsystem a layer belongs to. Used to forbid ANY edge
// crossing between the generators subsystem and the advisors subsystem
// (Stage 4A: "fully separate, parallel layers") -- not just
// framework-to-specific-implementation within the same subsystem.
function classifySubsystem(layer) {
  if (layer === "generator-framework" || layer === "generators") return "generators";
  if (layer === "advisor-framework" || layer === "advisors") return "advisors";
  if (layer === "platform-integration-intelligence") return "platform";
  return "other";
}

// A framework layer must not depend on any specific implementation within
// its OWN subsystem (e.g. generator-framework -> generators).
const OWN_SUBSYSTEM_FRAMEWORK_VIOLATIONS = [
  { from: "generator-framework", to: "generators" },
  { from: "advisor-framework", to: "advisors" },
];

const EXPORT_LINE_PATTERN = /^export\b/gm;
const TOP_LEVEL_AWAIT_PATTERN = /^await\s/m;

function classifyLayer(filePath) {
  for (const rule of LAYER_RULES) {
    if (filePath.startsWith(rule.prefix)) return rule.name;
  }
  return "other";
}

function findCycles(graph) {
  const visited = new Set();
  const stack = new Set();
  const seenCycleKeys = new Set();
  const cycles = [];

  function dfs(node, chain) {
    if (stack.has(node)) {
      const cycleStart = chain.indexOf(node);
      const cycle = chain.slice(cycleStart).concat(node);
      const key = [...cycle].sort().join("|");
      if (!seenCycleKeys.has(key)) {
        seenCycleKeys.add(key);
        cycles.push(cycle);
      }
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    for (const dep of graph.get(node) ?? []) {
      dfs(dep, [...chain, node]);
    }
    stack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node, []);
  }
  return cycles;
}

function computeLongestChain(graph) {
  const memo = new Map();

  function visit(node, stack) {
    if (stack.has(node)) return { length: 0, chain: [node] }; // cycle guard
    if (memo.has(node)) return memo.get(node);
    stack.add(node);
    let best = { length: 0, chain: [node] };
    for (const dep of graph.get(node) ?? []) {
      const sub = visit(dep, stack);
      if (sub.length + 1 > best.length) {
        best = { length: sub.length + 1, chain: [node, ...sub.chain] };
      }
    }
    stack.delete(node);
    memo.set(node, best);
    return best;
  }

  let overall = { length: 0, chain: [] };
  for (const node of graph.keys()) {
    const result = visit(node, new Set());
    if (result.length > overall.length) overall = result;
  }
  return overall;
}

function findRegistryWithoutCatalog(sourceFiles) {
  const paths = new Set(sourceFiles.map((f) => f.path));
  const orphans = [];
  for (const filePath of paths) {
    const match = /^(.*\/)([a-z-]+)-registry\.js$/.exec(filePath);
    if (!match) continue;
    const [, dir, kind] = match;
    // Two conventions are observed across this project's own subsystems:
    // advisors/ uses "{kind}-catalog.js", generators/ uses a bare
    // "catalog.js" in the same directory. Both satisfy the underlying
    // convention (a registry has a discoverable catalog); only flag when
    // NEITHER form exists.
    const prefixedCatalog = `${dir}${kind}-catalog.js`;
    const bareCatalog = `${dir}catalog.js`;
    if (!paths.has(prefixedCatalog) && !paths.has(bareCatalog)) {
      orphans.push({ registry: filePath, expectedCatalog: prefixedCatalog, alsoAccepted: bareCatalog });
    }
  }
  return orphans;
}

function countExports(content) {
  EXPORT_LINE_PATTERN.lastIndex = 0;
  return (content.match(EXPORT_LINE_PATTERN) ?? []).length;
}

/**
 * Pure analysis function. `input.sourceFiles` is an array of
 * { path, content } — path is project-root-relative with forward
 * slashes (e.g. "generators/framework/executor.js").
 */
export async function analyzeArchitecture({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    // Insufficient evidence — emit no finding, per the stated discipline,
    // rather than reporting a false "empty project" alarm.
    return findings;
  }

  const graph = buildDependencyGraph(sourceFiles);

  // 1. Circular dependencies
  const cycles = findCycles(graph);
  for (const cycle of cycles) {
    findings.push({
      id: "circular-dependency",
      severity: "critical",
      category: "dependency-structure",
      message: `Circular dependency detected across ${cycle.length - 1} module(s).`,
      recommendation: { message: "Break the cycle by extracting the shared concern into a separate module both sides can depend on, or by inverting one of the imports." },
      evidence: { cycle },
    });
  }

  // 2. Maximum dependency depth
  const longest = computeLongestChain(graph);
  if (longest.length > 0) {
    findings.push({
      id: "maximum-dependency-depth",
      severity: "info",
      category: "dependency-structure",
      message: `Longest dependency chain is ${longest.length} hop(s) across ${longest.chain.length} module(s).`,
      recommendation: { message: "No action needed unless this grows significantly; deep chains are harder to reason about." },
      evidence: { chain: longest.chain, depth: longest.length },
    });
  }

  // 3 & 4. Layer violations + cross-subsystem (mcp-server) coupling observations
  for (const [fromPath, edges] of graph.entries()) {
    const fromLayer = classifyLayer(fromPath);
    for (const toPath of edges) {
      const toLayer = classifyLayer(toPath);
      if (fromLayer === toLayer) continue;

      const fromSubsystem = classifySubsystem(fromLayer);
      const toSubsystem = classifySubsystem(toLayer);
      const ownSubsystemViolation = OWN_SUBSYSTEM_FRAMEWORK_VIOLATIONS.find(
        (r) => r.from === fromLayer && r.to === toLayer
      );
      const crossesGeneratorsAdvisors =
        (fromSubsystem === "generators" && toSubsystem === "advisors") ||
        (fromSubsystem === "advisors" && toSubsystem === "generators");

      if (ownSubsystemViolation) {
        findings.push({
          id: "layer-violation",
          severity: "critical",
          category: "layer-integrity",
          message: `"${fromPath}" (${fromLayer}) depends on "${toPath}" (${toLayer}), which violates the approved layering.`,
          recommendation: { message: `The ${fromLayer} must not depend on any specific ${toLayer === "generators" ? "generator" : "advisor"}.` },
          evidence: { from: fromPath, to: toPath, fromLayer, toLayer },
          location: { file: fromPath },
        });
      } else if (crossesGeneratorsAdvisors) {
        findings.push({
          id: "layer-violation",
          severity: "critical",
          category: "layer-integrity",
          message: `"${fromPath}" (${fromLayer}) depends on "${toPath}" (${toLayer}), crossing between the Generator and Advisor subsystems.`,
          recommendation: { message: "Generators and Advisors are designed as fully separate, parallel layers (Stage 4A) — this dependency should not exist." },
          evidence: { from: fromPath, to: toPath, fromLayer, toLayer },
          location: { file: fromPath },
        });
      } else if (fromSubsystem === "platform" || toSubsystem === "platform") {
        findings.push({
          id: "cross-subsystem-coupling-observed",
          severity: "info",
          category: "subsystem-boundaries",
          message: `"${fromPath}" (${fromLayer}) depends on "${toPath}" (${toLayer}) — a cross-subsystem edge involving mcp-server.`,
          recommendation: { message: "Not necessarily wrong (Advisors reading the Knowledge Graph is an anticipated future integration), but worth a deliberate look." },
          evidence: { from: fromPath, to: toPath, fromLayer, toLayer },
        });
      }
    }
  }

  // 5. Registry-without-catalog convention check
  for (const orphan of findRegistryWithoutCatalog(sourceFiles)) {
    findings.push({
      id: "registry-without-catalog",
      severity: "suggestion",
      category: "module-organization",
      message: `"${orphan.registry}" has no matching catalog module.`,
      recommendation: { message: `Consider adding "${orphan.expectedCatalog}" for discovery, matching this project's established registry+catalog convention.` },
      evidence: orphan,
      location: { file: orphan.registry },
    });
  }

  // 6. Unused framework modules (zero fan-in), a stability proxy
  const fanIn = computeFanIn(graph);
  for (const [filePath, count] of fanIn.entries()) {
    const layer = classifyLayer(filePath);
    const isFrameworkFile = layer === "generator-framework" || layer === "advisor-framework";
    const isEntryPoint = path.posix.basename(filePath) === "index.js";
    if (isFrameworkFile && !isEntryPoint && count === 0) {
      findings.push({
        id: "unused-framework-module",
        severity: "suggestion",
        category: "architectural-stability",
        message: `"${filePath}" is not imported by any other analyzed module.`,
        recommendation: { message: "Confirm this is intentional (e.g. only consumed via a re-export not visible in this analysis) or consider whether it's dead code." },
        evidence: { path: filePath, fanIn: count },
        location: { file: filePath },
      });
    }
  }

  // 7. Technical debt markers
  const debtMarkers = findDebtMarkers(sourceFiles);
  if (debtMarkers.length > 0) {
    findings.push({
      id: "technical-debt-markers",
      severity: "info",
      category: "technical-debt",
      message: `${debtMarkers.length} TODO/FIXME marker(s) found across the analyzed source.`,
      recommendation: { message: "Review and track these deliberately rather than letting them accumulate silently." },
      evidence: { markers: debtMarkers.slice(0, 20), truncated: debtMarkers.length > 20 },
    });
  }

  // 8. Module organization summary
  const perLayerCounts = {};
  for (const file of sourceFiles) {
    const layer = classifyLayer(file.path);
    perLayerCounts[layer] = (perLayerCounts[layer] ?? 0) + 1;
  }
  findings.push({
    id: "module-organization-summary",
    severity: "info",
    category: "module-organization",
    message: `Analyzed ${sourceFiles.length} module(s) across ${Object.keys(perLayerCounts).length} layer(s).`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { perLayerCounts },
  });

  // 9. Public API export cohesion (index.js files specifically)
  for (const file of sourceFiles) {
    if (path.posix.basename(file.path) !== "index.js") continue;
    const exportCount = countExports(file.content);
    const isRunnableScript = TOP_LEVEL_AWAIT_PATTERN.test(file.content);

    if (exportCount === 0 && isRunnableScript) {
      findings.push({
        id: "runnable-script-entry-point",
        severity: "info",
        category: "public-api-cohesion",
        message: `"${file.path}" has no exports but contains a top-level await, indicating it's a runnable script rather than an importable library entry point.`,
        recommendation: { message: "Purely descriptive; no action implied." },
        evidence: { path: file.path, exportCount, topLevelAwaitDetected: true },
      });
    } else if (exportCount === 0) {
      findings.push({
        id: "empty-public-entry-point",
        severity: "warning",
        category: "public-api-cohesion",
        message: `"${file.path}" is an entry point (index.js) but no export statements were detected.`,
        recommendation: { message: "Confirm this is intentional; an entry point with no exports may indicate an incomplete or misconfigured public API." },
        evidence: { path: file.path, exportCount },
        location: { file: file.path },
      });
    } else {
      findings.push({
        id: "public-entry-point-summary",
        severity: "info",
        category: "public-api-cohesion",
        message: `"${file.path}" declares ${exportCount} export statement(s).`,
        recommendation: { message: "Purely descriptive; no action implied." },
        evidence: { path: file.path, exportCount },
      });
    }
  }

  return findings;
}

export const architectureAdvisor = {
  id: "architecture",
  name: "Architecture Advisor",
  version: "1.0.0",
  category: "architecture",
  description:
    "Analyzes module dependency structure for circular dependencies, dependency depth, layer " +
    "violations, subsystem boundaries, framework coupling, registry/catalog consistency, public " +
    "API export cohesion, and technical-debt markers. Read-only, evidence-based — never files, " +
    "never invokes generators, no side effects.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzeArchitecture,
};
