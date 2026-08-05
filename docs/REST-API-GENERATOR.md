# REST API Generator — Stage 3G

Located at `generators/rest-api/`. Third Injection Generator. Builds on
the CPT+Taxonomy (3E) and ACF (3F) pattern, but — importantly — does NOT
use the exact same insertion shape as those two. That difference is the
central evidence for this stage's Change Set evaluation (see below).

## A genuinely different insertion strategy (not just reused code)

`Class-RestApi.php` demonstrates a THIRD convention, distinct from both
CPT/Taxonomy (one method per item) and ACF (one method for the group):
**ONE `register_routes()` method containing MULTIPLE `register_rest_route()`
calls**, hooked ONCE via `register()`. The real file already has two routes
coexisting in that one method. Adding a new route means:

1. Insert a new `register_rest_route()` call block into the EXISTING
   `register_routes()` method — **not** a new hook in `register()`
   (already wired once, permanently) and **not** a new sibling method for
   route registration itself.
2. Insert the new HTTP callback method (e.g. `get_events()`) as a sibling
   method before the class close — this part **is** identical to CPT/ACF,
   reusing `insertMethodBeforeClassClose` unchanged.

This is why `insertHookIntoRegisterMethod` (hardcoded to the `register()`
method) was generalized into `insertBeforeMethodClose(source, methodMarker,
text)` in this stage — same underlying mechanic (find a method, insert
before its close), but parameterized by WHICH method, because the correct
target method differs per file's own real, observed convention.
`insertHookIntoRegisterMethod` is kept as a thin, backward-compatible
wrapper calling the general form with `register()`'s marker — CPT/ACF are
unaffected.

## A deliberately different duplicate policy

CPT/ACF **skip silently** on a duplicate (idempotent no-op). This
generator **refuses (throws)** on an exact `(namespace, path, method)`
collision instead. This is a considered difference, not an oversight:
routes are identity-sensitive in a way CPT slugs and ACF group keys
aren't — registering the same path+method twice is far more likely a
genuine authoring mistake (or a sign of a stale/incorrect target) worth
surfacing loudly, versus CPT/ACF's common case of "re-run the same
generator call, it's already done, carry on."

## Configurable namespace and version

Detects the target's namespace from `Class-RestApi.php`'s
`const NAMESPACE_ = '...'`. If the caller's `namespace` config matches the
detected default, generated code uses `self::NAMESPACE_` (idiomatic, matches
the file's own style). If the caller specifies a DIFFERENT namespace,
generated code uses a literal string for that one route instead — supporting
genuinely per-route namespace/version overrides without touching the
class's shared constant (which would affect every existing route too).

## Incidental fix discovered and applied this stage

While implementing "detect existing namespace," found that the Plugin
Generator (3B) never actually renamed `Class-RestApi.php`'s
`NAMESPACE_` constant — every generated plugin shared the literal
`'boilerplate/v1'` regardless of project name. Fixed in
`plugin-generator.js` (one line added to its token-replacement list,
`["boilerplate/v1", `${textDomain}/v1`]`), fully regression-tested (all
178 pre-existing tests passed before this stage's own code was written),
with a dedicated new test asserting the fix. This was necessary for
"detect existing namespace" to be meaningful at all — a namespace that's
identical across every generated plugin isn't something worth detecting.

## CRUD generation scope (honest, not over-promised)

- **With `target_cpt`**: generates a full, correct implementation —
  `WP_Query`/`get_post`/`wp_insert_post`/`wp_update_post`/`wp_delete_post`
  as appropriate to the HTTP method, with `WP_Error` 404s, `is_wp_error()`
  checks, and correct status codes (200/201/204).
- **Without `target_cpt`**: generates a correctly-wired stub —
  registered, permission-checked, args validated — with a `// TODO`
  comment and a `501 Not Implemented` response. This generator cannot
  know arbitrary business logic for a route like `/reports/summary`; it
  scaffolds everything that CAN be known correctly and marks the rest
  honestly, rather than guessing.

## ACF integration

`include_acf: true` (with `target_cpt` set) adds
`get_fields( $post->ID )` (guarded by `function_exists( 'get_fields' )`,
matching the ACF Generator's own guard convention) to GET response(s).

## Usage

```js
import "./generators/index.js";
import { runGenerator } from "./generators/framework/executor.js";

// List + single + create + delete for an "event" CPT:
await runGenerator("rest-api", { route_path: "/events", method: "GET", target_cpt: "event" }, { outputDir, mode: "write" });
await runGenerator("rest-api", { route_path: "/events/(?P<id>\\d+)", method: "GET", target_cpt: "event", include_acf: true }, { outputDir, mode: "write" });
await runGenerator("rest-api", { route_path: "/events", method: "POST", permission: "publish_posts", target_cpt: "event" }, { outputDir, mode: "write" });
await runGenerator("rest-api", { route_path: "/events/(?P<id>\\d+)", method: "DELETE", target_cpt: "event" }, { outputDir, mode: "write" });

// Custom logic stub, no CPT:
await runGenerator("rest-api", {
  route_path: "/reports/summary",
  method: "GET",
  args: [{ name: "limit", type: "integer" }],
}, { outputDir, mode: "write" });
```

## What's preserved (unchanged from 3E/3F)

Preview, dry-run, conflict detection, and rollback all work. Exercised
end-to-end in `test/rest-api-generator-integration.test.js` against a REAL
plugin+CPT, including four distinct routes (list/single/create/delete)
injected in sequence without collision, and a full three-stage pipeline
test (Plugin → CPT+Taxonomy → REST API).

## Explicitly out of scope for this stage

- **Blank-line spacing between successive route blocks is not perfectly
  consistent** — a cosmetic-only formatting quirk found during manual
  smoke testing (some route pairs get a blank-line separator, others
  don't, depending on insertion order). Does not affect PHP correctness.
  Documented rather than engineered away, to avoid over-building whitespace
  normalization logic for a purely cosmetic concern — same discipline
  applied to ACF's "field array alignment" simplification.
- **Full route-array formatting alignment** — same category as above.
- **Nested/wildcard route collision detection** — duplicate detection is
  by exact string match on path+method+namespace; it won't catch a
  "logically overlapping but textually different" route (e.g.
  `/events/(?P<id>\d+)` vs `/events/(?P<slug>[a-z-]+)` targeting the same
  conceptual resource). A real PHP/regex-aware router isn't in scope here.

---

## Change Set Evaluation — Evidence from All Three Injection Generators

Per instruction: this is an evaluation, not an implementation. No Change
Set abstraction has been built.

### What's genuinely common across all three

- All three declare `analyzeOutputDir: true` and read specific target
  files before doing anything.
- All three use `operation: "modify"` and rely on the executor's
  restore-on-rollback behavior for that operation type.
- All three use `insertMethodBeforeClassClose` to add a new sibling method.
- All three produce a Generation Report the same way, with no
  generator-specific reporting code needed.

### What's genuinely NOT common — real, load-bearing differences

| | CPT+Taxonomy | ACF | REST API |
|---|---|---|---|
| Insertion target for the "new capability" itself | New sibling method (`register_{slug}_cpt`) | New sibling method (`register_{group}_field_group`) | **New call block inside an EXISTING method** (`register_routes()`) |
| Needs a new hook line in `register()`? | Yes | Yes | **No** — already wired once |
| Duplicate policy | Skip (idempotent no-op) | Skip (idempotent no-op) | **Refuse (throw)** |
| Text domain handling | Auto-detected, applied to labels | **Not used at all** (file has no `__()` calls) | Not applicable (REST doesn't use `__()` either) |
| Identity check mechanism | Method name substring | Method name substring | **(namespace, path, method) triple**, parsed positionally from call arguments |

### Recommendation

**A rigid, single-shape Change Set abstraction is NOT yet justified.** The
three Injection Generators share a real family resemblance (analyze →
identity-check → insert-or-refuse/skip → report), but the concrete
insertion target, the hook-wiring requirement, and the duplicate-handling
policy all differ in ways that matter to correctness — not incidental
styling differences that a thin abstraction could paper over. A Change Set
built now, generalized from only three data points where two of the three
"shared" mechanics (insertion target, duplicate policy) actually vary,
would either:

(a) be so parameterized (pluggable identity-check, pluggable insertion
    target, pluggable duplicate policy) that it adds an abstraction layer
    without removing meaningful duplication, or
(b) bake in assumptions from CPT/ACF that REST already had to break.

**What IS justified and already done:** promoting the truly identical
low-level primitives (`insertMethodBeforeClassClose`,
`insertBeforeMethodClose`) — real, byte-for-byte-identical code reuse
across all three. That's the correct grain size for promotion right now.

**Revisit this specifically** if a fourth Injection Generator is built and
its shape can be compared against these three. If a genuine common
orchestration pattern (not just shared low-level string helpers) emerges
across four real examples, that's when a `ChangeSet` concept — likely
something like `{ identityCheck, insertionStrategy, onDuplicate }` as
explicit, named, pluggable parts rather than a rigid template — would
have enough real evidence to be designed correctly instead of guessed at.
