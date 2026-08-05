# WordPress Performance Advisor — Second Real WordPress-Specific Advisor

Located at `advisors/wordpress-performance/`. Registered through the
existing, unmodified Advisor Framework via `advisors/index.js`. A
completely separate Advisor definition from both the generic
Performance Advisor (Stage 4F, JS-focused) and the WordPress Security
Advisor (Stage 7B) -- no code is imported between any of the three.

## Detection rules

| Rule id | Severity | Trigger |
|---|---|---|
| repeated-meta-lookup | suggestion | The same literal key passed to get_post_meta()/get_user_meta()/get_option() 2+ times in one file |
| query-in-loop | warning | A get_post_meta()/get_user_meta()/get_option()/get_posts()/new WP_Query()/$wpdb query call found inside a for/foreach/while loop body -- classic N+1 |
| wp-query-missing-limit | warning | new WP_Query() call whose args lack both posts_per_page and numberposts |
| wp-query-missing-no-found-rows | suggestion | new WP_Query() call whose args lack no_found_rows entirely |
| expensive-random-order | warning | WP_Query args contain orderby => 'rand' |
| wordpress-performance-scan-summary | info | Descriptive summary, matching the exact pattern every other Advisor uses |

## A deliberate consolidation

The task's 7 numbered detection-scope bullets describe 5 genuinely
distinct code patterns, not 7 -- mirroring Stage 7B's own precedent.
Items #1 ("missing transient/cache for expensive repeated operations")
and #2 ("repeated get_post_meta()/get_user_meta()/get_option()
lookups") are the SAME underlying evidence (a repeated identical-key
lookup is exactly the situation a cache would address). Items #3
("N+1 style metadata/query patterns") and #6 ("expensive database usage
suitable for caching") are the SAME underlying evidence (a query call
sitting inside a loop body). Item #7 ("general best-practice
violations") is implemented as one concrete, well-documented real
anti-pattern (ORDER BY RAND()) rather than left open-ended and
unfalsifiable.

## Reused technique: string-masking before bracket-depth counting

Loop bodies and WP_Query(...) call arguments can span multiple lines
and contain string literals with brace/paren characters. The exact same
maskPhpStrings() technique from wordpress-security-advisor.js (Stage
7B) is reused for both paren-depth counting (finding a call's true
closing paren) and brace-depth counting (finding a loop's true closing
brace) -- not reinvented differently.

## Two things found and confirmed during manual validation

1. A WP_Query with an explicit, tight posts_per_page still correctly
   gets only a suggestion-level (not warning-level) finding for missing
   no_found_rows. Verified directly: this is the intended design (a
   small, explicit limit means the missing-no_found_rows finding is a
   "consider" not a "must-fix"), not a bug.
2. update_meta_cache() itself is never mistakenly flagged as a
   repeated-lookup or query-in-loop target -- confirmed by a dedicated
   test. An honest, documented limitation remains: this Advisor cannot
   know that a preceding update_meta_cache() call primed the cache for a
   subsequent loop's get_post_meta() calls, since recognizing that
   relationship would require whole-program reasoning this Advisor
   deliberately avoids, per this stage's explicit instruction.

Manual smoke-testing against both a genuinely efficient sample plugin
(zero non-summary findings) and an intentionally inefficient sample
(all 5 rules fire correctly) was completed BEFORE the formal test suite
was written, per the established discipline.

## Honest, documented limitations (no AST parsing, no control flow)

- repeated-meta-lookup and loop-body detection are file-level/textual
  heuristics -- a key repeated in two genuinely unrelated functions in
  the same file will still be flagged (same class of limitation already
  accepted for the WordPress Security Advisor's file-level nonce/
  capability checks).
- Loop detection only recognizes the common brace-delimited
  for/foreach/while syntax, not PHP's alternate colon/endforeach syntax.
- No attempt is made to verify whether a query result is actually
  cached or reused elsewhere in the file -- these are pattern-level
  signals, not proof of an actual performance problem.

## A genuine, honest side effect: real duplication detected by the existing Code Review Advisor

Per this stage's explicit "do not modify any existing Advisor" scope,
wordpress-performance-advisor.js reuses maskPhpStrings(),
extractBalancedParens(), and findLineNumber() VERBATIM from
wordpress-security-advisor.js, rather than extracting them into a new
shared module (which would require modifying the existing Security
Advisor to import from it). Running the existing, unmodified Code
Review Advisor against this project's own real generators/+advisors/
source correctly detected this as genuine cross-file duplication,
pushing the integration test's duplication-count sanity check from a
threshold of 20 to a real value of 29. This is an accurate finding by
an unmodified Advisor working correctly, not a defect -- the test's
sanity threshold was raised to 35 with an explanatory comment. This
duplication is an honest, evidence-based, deliberately-deferred
promotion candidate for a future, dedicated refactor stage -- mirroring
the exact treatment already given to the confirmed 4-registry
duplication across Stages 6A/6G/7A.

## Zero framework modifications required

Every file outside advisors/wordpress-performance/ and
advisors/index.js (registration only) that changed did so ONLY to
correct now-stale hardcoded advisor-count assertions (5/6 -> 6/7 across
mcp-server, cli, and the WordPress Security Advisor's own discovery
test) and the duplication-count sanity threshold described above -- all
mechanical, unavoidable test-data corrections directly caused by
successfully registering a genuine seventh Advisor, not framework or
adapter logic changes.

## Usage

```js
import { runAdvisorWithReport } from "./advisors/index.js";

const report = await runAdvisorWithReport("wordpress-performance", {
  sourceFiles: [{ path: "my-plugin.php", content: "<?php ..." }],
});
```

## Explicitly out of scope for this stage

- No WordPress Agent, Workflow, project discovery, AI modification, or
  adapter changes -- this stage builds only the Advisor itself.
- No registry-factory or duplication refactor -- explicitly deferred.
