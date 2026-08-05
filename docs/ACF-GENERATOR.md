# ACF Field Group Generator — Stage 3F

Located at `generators/acf/`. Second Injection Generator, fully reusing
the pattern established by the CPT + Taxonomy Generator (3E): targets an
EXISTING generated plugin, `analyzeOutputDir: true`, `operation: "modify"`,
idempotent-by-key detection.

## Framework reuse triggered by this stage

The CPT + Taxonomy Generator (3E) had two string-insertion helpers
(`insertHookLine`, `insertMethodBeforeClassClose`) as local, unexported
functions. This generator needs the IDENTICAL mechanics — find
`register(): void { ... }`, insert a hook line before its close; find a
class's final closing brace, insert a new method before it. That's the
second real Injection Generator needing the same capability, so they're
now promoted to `generators/framework/php-class-injector.js`
(`insertHookIntoRegisterMethod`, `insertMethodBeforeClassClose`), and the
CPT + Taxonomy Generator has been refactored to import from there instead
of keeping its own copies. Verified behavior-preserving: all 148
pre-existing tests passed unmodified after the refactor, before any ACF
generator code was written.

No `FRAMEWORK_VERSION` bump was needed for this — unlike Stage 3E's
`operation`/`analyzeOutputDir` (a genuinely new executor capability), this
is a pure code-reuse promotion of pure helper functions, the same kind of
change as Stage 3D's `constant-case-manager.js` promotion.

## A real, observed convention difference from CPT/Taxonomy

`Class-ACF.php`'s existing field group ('Project Details') does **not**
wrap its `'title'`/`'label'` strings in `__()` — no text domain is used
for ACF labels anywhere in this boilerplate. This generator does **not**
auto-detect or apply a text domain, unlike the CPT+Taxonomy Generator —
inventing that convention here would contradict what the actual file does.
This was only knowable by reading the real file first, which is exactly
why "analyze before modify" matters as a discipline, not just a slogan.

## Field key convention (also only visible by reading the real file)

The existing field keys (`field_project_client`, `field_project_url`) are
prefixed by the **CPT slug** (`project`), not the group slug
(`project_details`). This generator matches that exactly:
`field_{target_cpt}_{field_name}` — verified by a dedicated test using a
DIFFERENT group title than the target CPT name, to confirm the prefix
really does come from `target_cpt` and not accidentally from the group.

## Associate with existing CPTs — validated, not trusted

`target_cpt` is checked against the target project's ACTUAL registered
post types, read from `Class-CPT.php` via `analyzeOutputDir` (regex-matched
against every `register_post_type( 'slug', ...)` call in that file). If
the given CPT isn't there, this generator refuses with a clear error
listing what IS registered, rather than emitting a field group with a
location rule pointing at nothing.

## Idempotency

Detection is by the derived method name (`register_{group_key}_field_group`)
already present in `Class-ACF.php`'s content — if found, the file gets
`operation: "skip"` with a `reason`, same mechanism as the CPT+Taxonomy
Generator. Verified: running with the same `group_title` twice is a no-op
(method count doesn't double); a DIFFERENT `group_title` targeting the
same CPT injects cleanly alongside the first, undisturbed.

## Supported ACF field types (v1)

A deliberately small, common subset: `text`, `textarea`, `number`, `email`,
`url`, `image`, `gallery`, `true_false`, `select`, `wysiwyg`, `date_picker`.
Not every ACF field type — just what's seen most often in real agency
work. Extend `SUPPORTED_FIELD_TYPES` in `acf-generator.js` if a real need
for more (repeater, flexible content, relationship, etc.) emerges.

## Usage

```js
import "./generators/index.js";
import { runGenerator } from "./generators/framework/executor.js";

// outputDir must be a plugin with the target_cpt already registered
// (e.g. via the CPT + Taxonomy Generator).
const config = {
  group_title: "Event Details",
  target_cpt: "event",
  fields: [
    { label: "Event Date", type: "date_picker" },       // name derived: "event_date"
    { label: "Venue Name", type: "text" },
    { label: "Capacity", name: "max_capacity", type: "number" }, // explicit name override
  ],
};

await runGenerator("acf-field-group", config, { outputDir, mode: "write" });
```

## What's preserved (unchanged from 3E)

Preview, dry-run, conflict detection, and rollback all work identically.
Exercised end-to-end in `test/acf-generator-integration.test.js` against a
REAL plugin+CPT built by the real Plugin and CPT+Taxonomy Generators
chained together — including a full three-generator pipeline test
(Plugin → CPT+Taxonomy → ACF Field Group) confirming they compose
correctly end to end.

## Explicitly out of scope for this stage

- **REST field exposure for the new CPT** — `Class-ACF.php`'s existing
  `register_rest_field()` only exposes ACF data for the `project` CPT
  (hardcoded). This generator does not extend that to new CPTs; matches
  the Stage 3 roadmap's separation between the ACF Generator and a future
  REST API Generator.
- **Field group array alignment** — the real file has hand-aligned `=>`
  operators within each field's array (cosmetic WPCS convention). Injected
  groups use consistent-but-not-dynamically-column-aligned formatting.
  Functionally identical PHP; a cosmetic simplification, not a defect.
- **Repeater/flexible content/relationship field types** — not in v1's
  supported list; extend if real need emerges.
- **Reconciling field differences on re-run** — same documented limitation
  as CPT+Taxonomy: idempotency is by group key only, not a full diff/update
  of an existing group's fields.

## Change Set observation (documented per instruction — not implemented)

Both Injection Generators built so far (CPT+Taxonomy, ACF) follow the
exact same underlying shape:

1. Read specific existing target files (`analyzeOutputDir`)
2. Detect an identity marker to check idempotency (a method name)
3. If absent: insert one hook line into `register()` + one new method
   before the class close (via the now-shared `php-class-injector.js`)
4. If present: return a `skip` operation with a reason

This is a genuine, repeating pattern — arguably a "Change Set": a named,
reusable recipe of "read these files, check this identity marker, apply
this hook+method insertion, else skip." **Per instruction, this is not
being implemented as a framework abstraction in this stage** — only
`php-class-injector.js`'s two low-level string helpers were promoted, not
the higher-level "detect + hook + method + skip" orchestration itself.

**Recommendation:** if the REST API Generator (the next planned Injection
Generator per the Stage 3 roadmap) follows this same four-step shape, that
would be a third confirmed instance — at that point, promoting a
`ChangeSet` concept into the framework (something like
`applyChangeSet({ existingFiles, identityCheck, hookLine, methodBuilder })`
that the executor or a shared helper runs) would meet this project's own
promotion bar and be worth a dedicated stage. Recommend evaluating this
explicitly when the REST API Generator is built, rather than deciding now
on two data points.
