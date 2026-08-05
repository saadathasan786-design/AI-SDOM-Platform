# Advisor Framework — Stage 4B (Foundation)

Located at `advisors/`. A completely separate, parallel subsystem to the
Generator Framework (`generators/`) — zero imports in either direction,
verified explicitly (see Architecture Compliance in the Stage Completion
Report). This stage builds only the reusable framework; no real advisors
are implemented or registered here.

## Why a separate implementation, not shared code with `generators/`

Every module here mirrors a Generator Framework counterpart in pattern
only:

| Advisor module | Generator Framework analog | Shared code? |
|---|---|---|
| `advisor-interface.js` | `generator-interface.js` | No |
| `advisor-registry.js` | `generator-registry.js` | No |
| `advisor-executor.js` | `executor.js` | No |
| `advisor-report.js` | `generation-report.js` | No |
| `advisor-catalog.js` | `catalog.js` | No |
| `source-analysis.js` | (no direct analog — shared *between advisors*, not with the Generator Framework) | N/A |
| `multi-advisor-executor.js` | (no direct Generator Framework analog — the Generator Framework has no multi-generator equivalent) | N/A |

**Stage 4D update:** `source-analysis.js` was promoted once the Code
Review Advisor became the second real advisor needing import parsing,
dependency-graph building, and TODO/FIXME detection — the Architecture
Advisor had these as local functions. Same evidence-based promotion
discipline as every Stage 3 promotion, applied here between two real
Advisors rather than two Generators. See `docs/CODE-REVIEW-ADVISOR.md`
for the full reasoning.

This is deliberate, not an oversight: two structurally similar
implementations is exactly two instances of a pattern — below this
project's own two-consumer promotion bar for extracting a shared factory.
The same discipline that governed every Stage 3 promotion
(`constant-case-manager.js`, `php-class-injector.js`, `main-file-injector.js`
— each promoted only on a genuine second real need) applies here in
reverse: don't share code across the Generator and Advisor Frameworks
until a third, similar system emerges to prove the abstraction is real
rather than coincidental.

## What's simpler than the Generator Framework, and why

Advisors are read-only analysis — this removes entire categories of
Generator Framework complexity, not by omission but because the
underlying problem doesn't exist for a read-only operation:

- No preview/dry-run/write modes. An advisor only ever analyzes.
- No conflict detection. Nothing is written, so there's nothing to
  conflict with.
- No rollback. Nothing is written, so there's nothing to undo.
- No templateDir/analyzeOutputDir file-reading mechanics. The Advisor
  Executor doesn't fetch anything itself — the caller supplies a
  `context` object with whatever inputs it already has (a Generation
  Report, a Knowledge Graph snapshot, etc.), and the executor's only job
  is picking out exactly the keys an advisor's `inputRequirements`
  declared needing.

## Severity model

One unified scale (info < suggestion < warning < critical) across every
advisor, regardless of domain — not a per-category scale. This is what
makes a future multi-advisor aggregate report meaningfully
sortable/filterable across security, performance, SEO, etc. findings side
by side.

## Failure isolation — no separate orchestration module needed

`runAdvisorWithReport()` never throws (same contract as
`runGeneratorWithReport()`). This alone is what makes running several
advisors safe — whether sequentially or via `Promise.all` — without a
dedicated "multi-advisor executor" module. One advisor's `analyze()`
throwing produces a `success: false` report for that advisor only; every
other advisor's report is unaffected. Verified explicitly with a
three-advisor test (two reliable, one broken) run in parallel.

## Registration gap deliberately NOT repeated

Stage 3M's production-readiness review of the Generator Framework flagged
that `generators/index.js` imports `registerGenerator` internally but
never re-exports it — external generator authors have no path to register
through the documented entry point. `advisors/index.js` re-exports
`registerAdvisor` from day one, closing that gap in the new subsystem
rather than carrying it forward.

## Deliberately NOT built in this stage

- Any real advisor. Foundation only, per instruction.
- A framework-version/compatibility system (the Generator Catalog's
  FRAMEWORK_VERSION/minimumFrameworkVersion machinery). No advisor exists
  yet to need it — building it now would be speculative. Add it when a
  real advisor declares a real minimum-version requirement.
- A dedicated multi-advisor orchestration module. Deferred at the time
  this section was written (Stage 4B) since the failure-isolation
  guarantee already fell out of runAdvisorWithReport() never throwing.
  Built in Stage 4I as multi-advisor-executor.js / runAdvisors() once a
  real need (a Unified Advisor Report, deduplication semantics,
  deterministic ordering) justified it — see
  docs/MULTI-ADVISOR-EXECUTOR.md.

## Usage

```js
import { registerAdvisor, runAdvisorWithReport, listAdvisorCatalog } from "./advisors/index.js";

registerAdvisor({
  id: "example-advisor",
  name: "Example Advisor",
  version: "1.0.0",
  description: "...",
  category: "security",
  inputRequirements: ["generationReport"],
  analyze: async ({ generationReport }) => {
    // pure analysis, return Finding[]
    return [];
  },
});

const report = await runAdvisorWithReport("example-advisor", {
  generationReport: someRealGenerationReportFromStage3,
});
// report.success, report.findings, report.summary (per-severity counts), report.error
```

## Stage 14B: shared registry/catalog core

`advisor-registry.js`'s `register`/`get`/`has` and `advisor-catalog.js`'s
`isAvailable()` now delegate to `framework-shared/registry-core.js` and
`framework-shared/catalog-core.js` respectively — the confirmed
byte-identical core shared with the Agent and Workflow Frameworks (and,
for `registerCore`/`isAvailableCore` specifically, the Generator Framework
too, which layers its own additional logic on top locally). See
`docs/REGISTRY-CORE.md` and `docs/CATALOG-CORE.md` for the full promotion
rationale. `list*()`, `_resetForTests()`, every exported wrapper name, and
`advisor-interface.js`'s validation logic were not touched by this
promotion and remain exactly as described above.
