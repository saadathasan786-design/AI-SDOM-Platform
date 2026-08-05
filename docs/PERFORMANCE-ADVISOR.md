# Performance Advisor — Stage 4F

Located at `advisors/performance/`. The fourth real Advisor. Static
performance analysis: nested loop complexity, expensive operations inside
loops (regex compilation, JSON operations, synchronous I/O, collection
lookups), duplicate file reads, large switch statements, excessive
conditional nesting, oversized modules/functions, inefficient object
cloning, string concatenation in loops, and redundant imports.

## Framework: no promotion needed, one already-justified reuse

inputRequirements: ["sourceFiles"] proved fully sufficient. This is the
fourth real consumer of source-analysis.js's parseImports() (for the
redundant-import check) -- no new promotion required, already justified
since Stage 4D. No advisors/framework/* file was touched.

## A significant real bug found via manual smoke testing (fixed properly, not just documented)

The first version's loop/function/switch body extraction used naive
character-by-character brace counting. Smoke-testing against this
repository's own real source (48 files) produced 21
nested-loop-complexity findings, 3 regex-compiled-in-loop, and 4
json-operation-in-loop -- investigating the evidence showed extracted
"loop bodies" running to the end of the file (15,000+ characters for what
should have been a 10-line loop).

Root cause: this advisor's own source contains lines like
`content[i] === "{"` -- a string literal holding exactly one brace
character. Naive counting treated that as a real, unmatched opening
brace, throwing off depth tracking for everything after it.

Fix: added maskNonCode(), which replaces the CONTENTS of string literals,
template-literal text, and comments with spaces -- preserving exact
character positions/length, so line numbers stay correct -- while leaving
real code (including ${...} template interpolation, which contains
genuine braces) untouched. Every brace/paren-counting function
(findMatchingBraceEnd, extractLoopBodies, extractFunctionBodies,
findLargeSwitchStatements, findExcessiveConditionalNesting) now scans the
masked buffer for structural analysis while still extracting real text
from the original content for pattern matching.

Result: re-running against the same real project after the fix:
nested-loop-complexity dropped from 21 to 7, regex-compiled-in-loop from
3 to 0 (confirming those were 100% artifacts of the bug, not real
matches), json-operation-in-loop from 4 to 2, oversized-function from 10
to 7. A dedicated regression test (both a synthetic fixture reproducing
the exact `content[i] === "{"` pattern, and a bounded-count assertion
against the real project) now guards against reintroducing this.

## Honest severity calibration (not suppression)

> **Update (Stage 4G):** the real-project regression test's bounded-count
> thresholds were tightened too aggressively in this stage's own initial
> writing — a fifth advisor's source file legitimately added a few more
> instances of the same common "for each file, scan its matches" idiom to
> the shared corpus, which is expected, healthy growth, not a regression.
> Adjusted to generous, growth-tolerant bounds that still catch the actual
> bug (which inflated counts by orders of magnitude, not a modest linear
> increase). See docs/ACCESSIBILITY-ADVISOR.md for the full account.

nested-loop-complexity was additionally downgraded from warning to
suggestion after the fix, once it became clear that even the
correctly-bounded remaining matches were overwhelmingly the extremely
common, usually-benign "outer loop over a small collection, inner loop
independently bounded" idiom (e.g. "for each file, scan its regex
matches") -- not genuine O(n^2)-over-shared-large-data concerns that
static text analysis cannot reliably distinguish. The message was
reworded to state this plainly rather than imply false confidence -- the
same honest-calibration approach already used for the Security Advisor's
ReDoS check (Stage 4E).

## Three requested checks deliberately merged or omitted

- "repeated path normalization" -- not implemented as its own check.
  Reliably detecting redundant (not just frequent) path normalization
  without semantic analysis was evaluated and found too speculative,
  parallel to the Security Advisor's decision to skip path-traversal
  detection for the same reason.
- "obvious algorithmic inefficiencies" -- folded into
  nested-loop-complexity, the one concrete, checkable proxy available
  without real complexity analysis.
- "repeated expensive calculations" -- covered by the loop-body checks
  (regex/JSON/sync-IO/collection-lookup inside a loop), the concrete,
  checkable instances of this category.

## A deliberate precision trade-off, not a bug

string-concatenation-in-loop only matches `variable += 'literal'` (RHS
starting with a quote), not `variable += someOtherVariable`. This is
intentional: += is used for both string concatenation and numeric
accumulation (count += 1), which are structurally indistinguishable
without type information. Requiring a quote-prefixed RHS trades recall
(misses variable-based concatenation) for precision (never false
-positives on numeric counters) -- consistent with this project's
conservative, evidence-first bias.

## Usage

```js
import { runAdvisorWithReport } from "./advisors/index.js";

const report = await runAdvisorWithReport("performance", { sourceFiles });
report.findings; // nested-loop-complexity, regex-compiled-in-loop, json-operation-in-loop,
                  // sync-io-in-loop, sync-io-usage, collection-lookup-in-loop,
                  // string-concatenation-in-loop, duplicate-file-read, large-switch-statement,
                  // excessive-conditional-nesting, oversized-module, oversized-function,
                  // inefficient-object-cloning, redundant-import, performance-scan-summary
```

## Explicitly out of scope for this stage

- Path normalization redundancy detection (see above).
- Real complexity analysis (Big-O inference) -- only the nested-loop
  proxy is used.
- Distinguishing a loop's expected iteration count (small vs. large) --
  all loop-body checks apply uniformly regardless of the collection size,
  since that information isn't available via static text analysis.
- A single expensive-operation finding may appear once for an outer loop
  and again for its inner loop, since both loop bodies genuinely contain
  the pattern (the inner body is a subset of the outer body's text). This
  is accurate, not duplicated noise fabricated by the advisor -- not
  deduplicated further, to avoid hiding a real nested occurrence.
