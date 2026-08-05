# Source Analysis — `advisors/framework/source-analysis.js`

## Purpose

Shared, pure helpers for analyzing a set of `{ path, content }` source
files: import parsing, dependency-graph construction, fan-in computation,
and debt-marker (TODO/FIXME) detection.

## Ownership

Lives in `advisors/framework/` — owned by the Advisor Framework, not a
cross-framework utility. It is imported only by Advisors, never by any
other framework.

## Public API

- `parseImports(content)` — regex-based import-statement extraction.
- `resolveInternalImport(fromPath, specifier, knownPaths)` — resolves a
  relative import specifier against a known set of source-file paths.
- `buildDependencyGraph(sourceFiles)` — builds a `{ file -> [imported
  files] }` graph from a set of source files.
- `computeFanIn(graph)` — counts how many other files import each file.
- `findDebtMarkers(sourceFiles)` — finds `TODO`/`FIXME` comments.

## Consumers

Four real Advisors, confirmed via direct import: `architecture-advisor.js`,
`code-review-advisor.js`, `performance-advisor.js`, `security-advisor.js`.
`accessibility-advisor.js` explicitly evaluated using it and documented why
it did not apply (no import-graph or debt-marker need for accessibility
analysis) — a genuine "considered, not applied" case, not an oversight.

## Promotion rationale

Promoted in Stage 4D, this repository's first shared-utility promotion.
The Architecture Advisor (Stage 4C) built import parsing and dependency-
graph construction as its own local functions. The Code Review Advisor
(Stage 4D) needed the identical import-graph-building (for dead-code/
fan-in analysis) and identical TODO/FIXME detection. Two real advisors
needing the same capability is this project's own promotion bar,
established even earlier at Stage 3 for `php-class-injector.js`/
`main-file-injector.js`.

## Why this extraction boundary was chosen

Only the genuinely advisor-agnostic mechanics — "parse imports," "build a
dependency graph," "find TODO/FIXME markers" — were extracted.

## Why surrounding logic remained local

Anything specific to layer/subsystem classification (the Architecture
Advisor's own domain knowledge) or code-quality heuristics like naming
conventions, duplication detection, or complexity counting (the Code
Review Advisor's own domain knowledge) remained local to each advisor,
since neither is genuinely shared.

## Dependency rules

Imports only `node:path`. Never imports Project Discovery, Knowledge
Graph, Memory, adapters, or any other framework. Import parsing is
regex-based, not a real JS parser — the same documented trade-off as
`generators/framework/php-class-injector.js`.

## Future extension guidance

If a future advisor needs import parsing or dependency-graph analysis,
import this module directly rather than reimplementing it. If a future
advisor needs a genuinely new, shared mechanic not covered here, follow
the same two-real-consumer promotion bar before extracting it — do not
add speculative capability to this file ahead of a second real need.
