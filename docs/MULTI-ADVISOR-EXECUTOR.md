# Multi-Advisor Executor and Unified Advisor Report — Stage 4I

Located at `advisors/framework/multi-advisor-executor.js`. Implements the
Stage 4A section 11 design exactly. Runs N advisors concurrently against
ONE shared context and produces a Unified Advisor Report.

## No architectural blocker — and why

advisor-executor.js (Stage 4B) deliberately never fetches inputs itself
-- the caller supplies `context`, and the executor only picks out
declared keys. This module inherits that contract exactly:
runAdvisors(ids, context) takes the same shape runAdvisor/
runAdvisorWithReport already accept.

This is what makes "fetch every required input exactly once" and "no
duplicated Knowledge Graph builds / Generation Report loading / Memory
retrieval / Catalog queries" true by construction, not by new
deduplication logic: every advisor in a batch reads from the SAME single
context object the caller already assembled. There is only ever one
fetch -- done once, by the caller, before calling runAdvisors() at all.
No I/O of any kind happens inside this module.

## How each requirement is satisfied

- Resolve advisors from the registry -- via the existing getAdvisor(),
  reused unchanged.
- Collect the union of inputRequirements -- computed and returned as
  inputRequirementsUnion, informational (since nothing is actually
  fetched, the union isn't used to drive fetching -- it's transparency
  for the caller about what the batch, in aggregate, needs).
- Execute concurrently -- Promise.all over
  uniqueIds.map(id => runAdvisorWithReport(id, context)).
- Failure isolation -- each advisor runs through the already-proven
  runAdvisorWithReport() (never runAdvisor() directly), which never
  throws. Promise.all only rejects if a promise rejects; since
  runAdvisorWithReport() guarantees it never does, one advisor's internal
  failure can never prevent the others from completing.
- Deterministic ordering -- Promise.all resolves in input-array order
  regardless of completion timing; verified explicitly with a
  slow-vs-fast advisor test in both id orderings.
- Duplicate advisor IDs -- deduplicated via [...new Set(ids)]. Running
  the same advisor's pure analyze() twice against the identical shared
  context would always produce identical results -- pure waste, not a
  meaningful re-check.

## Unified Advisor Report shape

```jsonc
{
  "success": true,               // advisorsFailed.length === 0
  "advisorCount": 3,              // unique advisors requested
  "advisorsRun": ["architecture", "security"],
  "advisorsFailed": ["broken-id"],
  "findings": [ /* flattened, from all SUCCESSFUL advisors */ ],
  "summary": { "info": 4, "suggestion": 2, "warning": 1, "critical": 0 },
  "advisorReports": [ /* the full individual runAdvisorWithReport() result per advisor, in order */ ],
  "inputRequirementsUnion": ["sourceFiles"],
  "execution_ms": 12,
  "timestamp": "2026-08-02T00:00:00.000Z"
}
```

`inputRequirementsUnion` is additive to the shape specified in the task --
included because "collect the union" is an explicit, named
responsibility; omitting it from the output would mean computing it for
no purpose.

## What was NOT changed (backward compatibility)

runAdvisor() and runAdvisorWithReport() -- zero modifications. Every
existing advisor's own tests (257 of them, across five advisors and the
shared framework) pass completely unmodified. runAdvisors is a pure
addition to advisors/index.js's exports, alongside the two unchanged
functions.

## Usage

```js
import { runAdvisors, listAdvisorCatalog } from "./advisors/index.js";

const allIds = listAdvisorCatalog().map((a) => a.id);
const report = await runAdvisors(allIds, { sourceFiles });

report.success;         // did every requested advisor succeed?
report.advisorsRun;     // which ones actually ran
report.advisorsFailed;  // which ones failed (isolated, didn't block others)
report.findings;        // everything, combined
report.summary;         // aggregate severity counts
```

## Explicitly out of scope for this stage

- Actual fetching of Knowledge Graph/Generation Report/Memory/Catalog
  data -- remains the caller's responsibility, unchanged from Stage 4B's
  design. This module orchestrates advisor EXECUTION, not input
  ACQUISITION.
- Per-advisor timeout/cancellation -- not requested, not built.
- Advisor dependency ordering (Stage 4A's "meta-advisor" concept) -- this
  is the flat, fully-parallel primary-advisor case only, exactly as
  scoped.
