# WordPress Security Advisor — First Real WordPress-Specific Advisor

Located at `advisors/wordpress-security/`. Registered through the
existing, unmodified Advisor Framework via `advisors/index.js`. The
first real implementation of the Stage 7A WordPress specialization
design -- confirming that design's central claim: WordPress
specialization needs no new framework capability, only new Advisor
content.

## Detection rules

| Rule id | Severity | Trigger |
|---|---|---|
| missing-nonce-verification | critical | File uses $_POST[...] but never calls wp_verify_nonce()/check_admin_referer()/check_ajax_referer() anywhere in the file |
| missing-capability-check | critical | File uses $_POST[...] but never calls current_user_can() anywhere in the file |
| rest-route-missing-permission-callback | critical | register_rest_route() call with no permission_callback key, or with it set to '__return_true' |
| unprepared-sql-query | critical | $wpdb->query/get_results/get_row/get_var/get_col() call built from a variable, without ->prepare() |
| unescaped-output | warning | echo/print of a bare PHP variable with no escaping function |
| unsanitized-request-input | warning | Raw $_GET/$_POST/$_REQUEST access on a line with no recognized sanitizing function |
| wordpress-security-scan-summary | info | Descriptive summary, matching the exact pattern every other Advisor uses |

## A deliberate consolidation

The task description lists "missing sanitization of request input" and
"direct use of $_GET/$_POST/$_REQUEST without sanitization" as separate
bullets. These describe the SAME underlying code pattern -- a raw
superglobal access with no sanitizing function on the same line -- and
are implemented as ONE rule (unsanitized-request-input), not two, to
avoid double-counting identical evidence. This mirrors this project's
own precedent (e.g. CPT+Taxonomy sharing one Generator, Stage 3D).

## Report shape — no invented structures

Per this stage's explicit, repeated instruction to "reuse the existing
Advisor report format exactly" and "not invent new report structures,"
every finding uses the EXACT SAME shape every existing Advisor already
uses: { id, severity, category, message, recommendation, evidence,
location }. Where the task's own field list mentions
"title"/"description"/"filename," these map onto the existing shape's
message (a single combined title+description, the convention every
existing finding already follows) and location.file/location.line --
not new top-level fields. Verified by a dedicated test asserting the
exact key set of a real finding.

## A real false positive found and fixed during manual validation

Smoke-testing against a genuinely secure sample plugin (proper nonce
check, capability check, sanitization, escaping, prepared query, real
permission_callback) initially produced ONE false positive:
wp_verify_nonce($_POST['my_nonce'], ...) was flagged as "unsanitized
request input," even though passing a raw nonce value into
wp_verify_nonce() is the CORRECT idiomatic WordPress pattern (the
function itself safely consumes the value; nonce values don't need
sanitize_text_field()). Fixed by adding wp_verify_nonce, isset, empty,
and array_key_exists to the recognized "safe consuming function"
allowlist -- all functions that check for or safely compare a
superglobal value rather than storing/outputting/querying it. After the
fix, the secure sample plugin produces ZERO non-summary findings; the
intentionally vulnerable sample plugin correctly triggers every
applicable rule, including both REST route variants (missing
permission_callback entirely, and set to __return_true).

## Reused technique: string-masking before paren-depth counting

register_rest_route() and $wpdb->*() calls can span multiple lines and
their string arguments may themselves contain parentheses. A
maskPhpStrings() helper masks single/double-quoted string contents to
spaces before counting paren depth to find each call's true closing
paren -- proactively applying the exact fix Stage 4F's Performance
Advisor needed only AFTER discovering a real brace-counting bug, this
time built in from the start.

## Zero framework modifications required

Every file outside advisors/wordpress-security/ and advisors/index.js
(registration only) is unchanged. One category of pre-existing test
files needed a mechanical update: several downstream test suites
(mcp-server, cli) hardcoded an exact catalog.length === 5 assertion for
the Advisor Catalog. With a genuine sixth Advisor now registered, these
were updated to 6 -- a test-data correction directly and unavoidably
required by successfully completing this task, not a framework or
adapter behavior change (confirmed by diff: only the literal expected
number changed, no logic).

## Usage

```js
import { runAdvisorWithReport } from "./advisors/index.js";

const report = await runAdvisorWithReport("wordpress-security", {
  sourceFiles: [{ path: "my-plugin.php", content: "<?php ..." }],
});
```

## Explicitly out of scope for this stage

- No WordPress Agent, Workflow, project discovery, AI modification, or
  adapter changes -- this stage builds only the Advisor itself.
- No additional WordPress Advisors (performance, hooks, etc.) -- future
  work per the Stage 7A design's recommended implementation order.
