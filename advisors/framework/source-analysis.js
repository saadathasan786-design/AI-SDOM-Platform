/**
 * Source Analysis — shared, pure helpers for analyzing a set of
 * { path, content } source files: import parsing, dependency graph
 * construction, and debt-marker (TODO/FIXME) detection.
 *
 * Promoted into the Advisor Framework in Stage 4D. The Architecture
 * Advisor (4C) built these as its own local functions; the Code Review
 * Advisor (4D) needs the IDENTICAL import-graph-building (for dead-code/
 * fan-in analysis) and the IDENTICAL TODO/FIXME detection. Two real
 * advisors needing the same capability is this project's own promotion
 * bar — the same evidence-based discipline Stage 3 applied to
 * php-class-injector.js and main-file-injector.js, now applied here.
 * The Architecture Advisor has been refactored to import from here
 * instead of keeping its own copies (verified behavior-preserving against
 * its full test suite before this file existed in its current form).
 *
 * Deliberately NOT promoted (still local to whichever advisor needs it):
 * anything specific to layer/subsystem classification (Architecture
 * Advisor's own domain knowledge) or code-quality heuristics like naming
 * conventions, duplication detection, or complexity counting (Code
 * Review Advisor's own domain knowledge). Only the genuinely
 * advisor-agnostic mechanics — "parse imports," "build a dependency
 * graph," "find TODO/FIXME markers" — live here.
 *
 * Import parsing remains regex-based, not a real JS parser — the same
 * documented trade-off as generators/framework/php-class-injector.js.
 */

import path from "node:path";

const IMPORT_PATTERN = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const DEBT_MARKER_PATTERN = /\b(TODO|FIXME)\b/g;

/** Extracts every import/re-export specifier string from a file's content. */
export function parseImports(content) {
  const specifiers = [];
  let match;
  IMPORT_PATTERN.lastIndex = 0;
  while ((match = IMPORT_PATTERN.exec(content)) !== null) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

/**
 * Resolves a relative import specifier to a path within `knownPaths`.
 * Returns null for external specifiers (bare/node: imports) or anything
 * that can't be confidently resolved — no edge is guessed into existence.
 */
export function resolveInternalImport(fromPath, specifier, knownPaths) {
  if (!specifier.startsWith(".")) return null;
  const dir = path.posix.dirname(fromPath);
  const resolved = path.posix.normalize(path.posix.join(dir, specifier));
  if (knownPaths.has(resolved)) return resolved;
  if (knownPaths.has(`${resolved}.js`)) return `${resolved}.js`;
  return null;
}

/** Builds a Map<path, Set<path>> dependency graph from a sourceFiles array. */
export function buildDependencyGraph(sourceFiles) {
  const knownPaths = new Set(sourceFiles.map((f) => f.path));
  const graph = new Map();
  for (const file of sourceFiles) {
    const edges = new Set();
    for (const specifier of parseImports(file.content)) {
      const resolved = resolveInternalImport(file.path, specifier, knownPaths);
      if (resolved && resolved !== file.path) edges.add(resolved);
    }
    graph.set(file.path, edges);
  }
  return graph;
}

/** Computes fan-in (number of distinct importers) for every node in a graph. */
export function computeFanIn(graph) {
  const fanIn = new Map();
  for (const node of graph.keys()) fanIn.set(node, 0);
  for (const edges of graph.values()) {
    for (const target of edges) {
      fanIn.set(target, (fanIn.get(target) ?? 0) + 1);
    }
  }
  return fanIn;
}

/** Finds every TODO/FIXME marker across a sourceFiles array, with file+line location. */
export function findDebtMarkers(sourceFiles) {
  const markers = [];
  for (const file of sourceFiles) {
    const lines = file.content.split("\n");
    lines.forEach((line, index) => {
      DEBT_MARKER_PATTERN.lastIndex = 0;
      if (DEBT_MARKER_PATTERN.test(line)) {
        markers.push({ path: file.path, line: index + 1 });
      }
    });
  }
  return markers;
}
