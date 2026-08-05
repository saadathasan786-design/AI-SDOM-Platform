# Code Review Advisor — Stage 4D

Located at `advisors/code-review/`. The second real Advisor. Analyzes
source code quality: naming consistency, cross-file duplication, dead
code, maintainability, documentation coverage, TODO/FIXME usage,
error-handling consistency, API consistency, and complexity heuristics.

## Framework promotion: genuine second-use evidence, acted on immediately

This advisor needed two things the Architecture Advisor (4C) had already
built as local functions: TODO/FIXME marker detection, and
dependency-graph building (for dead-code/fan-in analysis). Two real
advisors needing identical capability is this project's own promotion
bar — so before writing any Code Review-specific logic, parseImports,
resolveInternalImport, buildDependencyGraph, computeFanIn, and
findDebtMarkers were extracted into advisors/framework/source-analysis.js,
and the Architecture Advisor was refactored to import from there instead
of keeping its own copies. Verified behavior-preserving: all 87
pre-existing tests passed unmodified after the refactor, before any Code
Review code was written — the same discipline Stage 3 applied to every
promotion (constant-case-manager.js, php-class-injector.js,
main-file-injector.js).

Deliberately NOT promoted: naming-convention classification, duplication
detection, documentation-coverage heuristics, complexity counting,
empty-catch detection, and async-style-mixing detection are all this
advisor's own domain knowledge — no other advisor needs them yet.

## A real noise problem found via manual smoke testing (and fixed)

Running the first version against this repository's own real source
(46 files) produced 56 cross-file-duplication findings — almost all
noise: trivial matches like "}," repeated by coincidence, and — more
importantly — shared import statement blocks across sibling generators
(e.g. Elementor and Gutenberg both importing the same framework helpers)
being flagged as "duplication," when that's exactly the correct, expected
reuse this whole framework is built around.

Fixed by: raising the block size (4 to 6 lines) and minimum block-length
threshold (40 to 100 characters) to filter trivial matches, and
explicitly excluding blocks that are entirely import statements. This
brought the same real-project run down to 7 findings — a defensible,
actionable signal. A real project fixture test now asserts this stays
bounded (< 20) so future changes can't silently reintroduce the noise.
Some residual low-signal matches remain (structural similarity between
generators following the same intentional config shape, like
"variableManifest: VARIABLE_MANIFEST," appearing in both Plugin and Theme
generators) — documented as an accepted limitation of a regex/line-based
heuristic rather than real semantic duplication detection, consistent
with every other "not a full parser" trade-off already accepted in this
project.

## Design choices, stated plainly (no opaque scoring)

Every threshold (long-file line count, complexity decision-point count,
documentation coverage percentage) is a named constant, and every finding
includes the actual numbers in its evidence — a reader can see exactly why
something was flagged and judge the threshold's reasonableness
themselves, rather than trust an opaque score.

## Usage

```js
import { runAdvisorWithReport } from "./advisors/index.js";

const report = await runAdvisorWithReport("code-review", { sourceFiles });
report.findings; // naming-inconsistency, cross-file-duplication, possible-dead-file,
                  // long-file, low-documentation-coverage, empty-catch-block,
                  // mixed-async-style, high-branching-complexity, todo-fixme-markers,
                  // code-size-summary
```

## Explicitly out of scope for this stage

- Named-export-level dead-code detection (only file-level fan-in is
  checked, not "is this specific exported symbol ever imported by name")
  — would require parsing named import lists, a real parser concern.
- Cyclomatic complexity per-function (only a whole-file decision-point
  count proxy) — meaningfully more precise complexity analysis needs real
  function-boundary parsing.
- Semantic (not just textual) duplication detection — e.g. two blocks
  that do the same thing with different variable names would not be
  caught; only literal text matches are.
