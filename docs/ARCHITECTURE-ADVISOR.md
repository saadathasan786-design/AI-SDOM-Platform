# Architecture Advisor — Stage 4C

Located at `advisors/architecture/`. The first real Advisor built on the
Stage 4B foundation. Analyzes module dependency structure: circular
dependencies, dependency depth, layer violations, subsystem boundaries,
framework coupling (fan-in), registry/catalog convention consistency,
public API export cohesion, and technical-debt markers.

## Purity — no filesystem access anywhere in analyze()

`inputRequirements: ["sourceFiles"]` — the caller reads .js files off
disk and hands in {path, content} pairs; analyze() does everything else
(import parsing, graph building, cycle detection, layer classification)
as pure computation. This mirrors the exact discipline every Stage 3
generate() function already followed.

## Import parsing: regex, not a real parser

> **Update (Stage 4D):** import parsing, dependency-graph building, and
> TODO/FIXME detection described below have since been promoted to
> `advisors/framework/source-analysis.js`, once the Code Review Advisor
> demonstrated a second real need for the exact same mechanics. This
> advisor now imports them rather than defining its own copies. See
> `docs/CODE-REVIEW-ADVISOR.md` for details.

Same documented trade-off as php-class-injector.js: a regex extracts
import/re-export specifiers. Reliable for this project's consistently
well-formed ESM syntax; not a general JS analysis tool. An import that
can't be confidently resolved to a given sourceFiles entry is silently
skipped — no edge is guessed into existence.

## Layer rules are this advisor's own domain knowledge, not framework config

The layer classification (mcp-server/ vs generators/framework/ vs
generators/* vs advisors/framework/ vs advisors/*) and the
subsystem-crossing rules are hardcoded inside this one advisor file — the
same way cpt-taxonomy-generator.js hardcodes WordPress's 20-character
post-type-key limit as its own domain knowledge rather than framework
config. The Advisor Framework itself has zero awareness of any of this.

## A real bug found and fixed during implementation (not a design flaw)

The first version's forbidden-edge table only checked "a framework
depends on its own subsystem's specific implementation"
(generator-framework -> generators, advisor-framework -> advisors). It
missed the case of a framework depending on the OTHER subsystem's
implementation (e.g. advisor-framework -> generators) — caught while
writing the integration test for exactly that scenario. Fixed by
replacing the pairwise table with a subsystem classification
(classifySubsystem()) plus a clean rule: any edge crossing between the
generators subsystem and the advisors subsystem is a violation,
regardless of which specific layer on each side. Verified against the
full test suite before and after.

## A real false positive found via manual smoke testing (also fixed)

Running this advisor against the real project initially flagged
mcp-server/index.js as an "empty public entry point" (zero exports) —
technically true but misleading: that file is a runnable script (it calls
await server.connect(transport) at the top level), not a library entry
point. Fixed by detecting a genuine, checkable signal — a top-level
(column-zero) await statement — and classifying such files as
runnable-script-entry-point (info) instead of empty-public-entry-point
(warning). This is exactly why "perform manual smoke testing before
relying on the automated suite" mattered here: this distinction wasn't
obvious until the advisor was pointed at real code.

## An accepted, documented limitation (not fixed — a genuine trade-off)

The TODO/FIXME detector matches the literal strings "TODO"/"FIXME"
anywhere in a file's text — including inside this advisor's own source,
where those words appear as part of the regex pattern definition and this
very documentation. This is a known, accepted consequence of pragmatic
text-matching rather than real parsing, consistent with every other
"not a full parser" trade-off already accepted elsewhere in this project
(php-class-injector.js, main-file-injector.js). Making the detector
"smarter" about this would require actually parsing comments/strings vs.
code — disproportionate complexity for a debt-marker count.

## Usage

```js
import fs from "node:fs/promises";
import path from "node:path";
import { runAdvisorWithReport } from "./advisors/index.js";

// Caller does the I/O -- analyze() never touches disk.
async function collectSourceFiles(rootDirs) { /* walk and read .js files, return {path, content}[] */ }

const sourceFiles = await collectSourceFiles(["generators", "advisors", "mcp-server"]);
const report = await runAdvisorWithReport("architecture", { sourceFiles });

report.success;   // true/false
report.findings;  // Finding[]
report.summary;   // { info, suggestion, warning, critical } counts
```

## Explicitly out of scope for this stage

- A generic/configurable version usable on arbitrary unrelated codebases
  — this advisor is deliberately built for THIS platform's known
  structure, per the framework-sufficiency evaluation in the Stage
  Completion Report.
- Deeper semantic API-cohesion checks (e.g. detecting naming
  inconsistencies between two index.js files' same-named exports) —
  evaluated and deliberately not attempted; would require actual semantic
  analysis, not evidence-based text/graph checks.
- A real JS parser replacing the regex-based import extraction — not
  justified by any observed failure in this project's own consistently
  well-formed ESM source.
