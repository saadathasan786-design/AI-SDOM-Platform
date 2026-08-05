# CPT + Taxonomy Generator — Stage 3E

Located at `generators/cpt-taxonomy/`. **The first Injection Generator** —
targets an EXISTING plugin produced by the Plugin Generator (3B) and adds
a new CPT + paired taxonomy into it, rather than scaffolding new output.
Establishes the pattern future Injection Generators (ACF, REST API — per
the Stage 3 roadmap) will reuse.

## Scaffold vs Injection — the core difference

| | Scaffold Generator (Plugin, Theme) | Injection Generator (CPT+Taxonomy) |
|---|---|---|
| Reads from | A fixed `templateDir` (the boilerplate) | The TARGET project itself (`outputDir`), via `analyzeOutputDir` |
| Writes | New files that must not already exist | Modifies files that must already exist |
| Conflict means | "This file is already there" | "This file to modify isn't there — is this even a valid target?" |
| Idempotency | Not really applicable (you don't scaffold the same plugin twice into the same place) | Central requirement — running twice with the same input must be a safe no-op |
| Rollback on failure | Delete what was newly written | **Restore original content** for anything modified, delete only what was newly created |

## Analyze before modify

This generator declares `analyzeOutputDir: true`. Before `generate()` runs,
the executor reads the target directory's current files (the same
`loadTemplate()` utility already used for `templateDir`, just pointed at
`outputDir` instead) and passes them in as a third argument:
`generate(config, templateFiles, existingFiles)`. From that, the generator:

1. **Confirms the target is a valid plugin** — checks for
   `includes/Class-CPT.php` and `includes/Class-Taxonomy.php`. If either is
   missing, it throws a clear error rather than guessing or creating them
   from scratch (this generator only injects into existing structure).
2. **Auto-detects the target's text domain** — reads it out of an existing
   `__( '...', 'the-domain' )` call in either file. Not a config input;
   could not be correctly guessed without reading the target first, and
   asking the caller to re-supply a value already present in the target
   would risk it drifting out of sync.
3. **Checks whether this exact CPT/taxonomy already exists** (by derived
   slug) — if so, that file gets `operation: "skip"` with a `reason`
   instead of being modified again. This is the idempotency guarantee:
   run this generator twice with the same `cpt_name`, get a safe no-op the
   second time, not a duplicate registration or an error.

## Following plugin-boilerplate's own convention (not inventing a new one)

Look at the real `Class-CPT.php`: it already registers its own "project"
CPT via ONE class with a `register_project_cpt()` method, hooked from a
single `register(): void` method. Injecting a new CPT means adding another
method beside it and another hook line in `register()` — **not creating a
whole new class file per CPT**. This generator does exactly that:

```php
// Before injection — register() has one hook:
public function register(): void {
    add_action( 'init', array( $this, 'register_project_cpt' ) );
}

// After injecting "Event":
public function register(): void {
    add_action( 'init', array( $this, 'register_project_cpt' ) );
    add_action( 'init', array( $this, 'register_event_cpt' ) );
}

public function register_project_cpt(): void { /* unchanged */ }

public function register_event_cpt(): void { /* newly injected */ }
```

No `templateDir` is declared for this generator (unlike Plugin/Theme).
Those two find/replace literal tokens in a COPIED file; this generator
SYNTHESIZES a method that doesn't exist anywhere to copy from — the method
text is hand-written to match `Class-CPT.php`'s exact formatting (tabs,
field ordering, comment style). That's how "use plugin-boilerplate
conventions" is satisfied when there's no literal block to substitute
against.

## Framework extension: `operation` and `analyzeOutputDir`

> **Update (Stage 3F):** the `insertHookLine`/`insertMethodBeforeClassClose`
> helpers originally written locally in this generator have since been
> promoted to `generators/framework/php-class-injector.js`
> (`insertHookIntoRegisterMethod`/`insertMethodBeforeClassClose`), once the
> ACF Field Group Generator demonstrated a second real need for the exact
> same mechanics. This generator now imports them rather than defining its
> own copy. See `docs/ACF-GENERATOR.md` for details.

Two additions to `executor.js`, both justified by the stage's own rule
("promote only if at least two future Injection Generators will benefit")
— the approved Stage 3 roadmap already commits to an ACF Generator and a
REST API Generator using this exact same append-into-an-existing-plugin
pattern, so this clears that bar:

- **Per-file `operation: "create" | "modify" | "skip"`** (default
  `"create"` — fully backward compatible; every Stage 3A/3B/3D generator
  never declared this field and is unaffected). `"modify"` requires the
  target to already exist and rolls back to its **original content** (not
  just deleted) if a later step in the same run fails. `"skip"` is
  informational only — no existence check, no write, surfaced in results
  as a no-op rather than an error.
- **`analyzeOutputDir: true`** — executor reads the target directory before
  calling `generate()`, reusing `loadTemplate()` rather than adding new
  file-reading code.

`FRAMEWORK_VERSION` was bumped to `1.1.0` to reflect this — Plugin and
Theme still declare `minimumFrameworkVersion: "1.0.0"` and remain fully
compatible (1.1.0 satisfies "at least 1.0.0"). This generator declares
`minimumFrameworkVersion: "1.1.0"`, correctly signaling it needs the new
capability.

## Variable Manifest

Structurally different from Plugin/Theme's manifests: most values are
**derived from config**, not substituted from a template, and one
(`text_domain`) isn't config-derived at all — it's auto-detected from the
target. See `generators/cpt-taxonomy/variable-manifest.js` for the full
list (`cpt_name`, `cpt_plural`, `cpt_slug`, `taxonomy_name`,
`taxonomy_plural`, `taxonomy_slug`, `text_domain`).

## WordPress-specific validation

This generator checks the WordPress hard limits that would otherwise cause
a *silent* registration failure: post_type keys must be ≤20 characters,
taxonomy keys ≤32 characters. This check is local to this generator (not
promoted to `naming-validator.js`) since no other generator currently
needs WP-specific key-length validation — same "wait for a second real
need" discipline applied throughout this framework.

## Usage

```js
import "./generators/index.js";
import { runGenerator } from "./generators/framework/executor.js";
import { runGeneratorWithReport } from "./generators/framework/generation-report.js";

// outputDir must already be a plugin produced by the Plugin Generator.
const config = { cpt_name: "Event" }; // cpt_plural, taxonomy_name, taxonomy_plural all optional

await runGenerator("cpt-taxonomy", config, { outputDir, mode: "preview" });
await runGenerator("cpt-taxonomy", config, { outputDir, mode: "dry-run" });
const report = await runGeneratorWithReport("cpt-taxonomy", config, { outputDir, mode: "write" });

// Running again with the same cpt_name is a safe no-op:
report.no_op; // [{ path, reason }, ...] instead of duplicate registration
```

## What's preserved (unchanged from 3A/3B/3D)

Preview, dry-run, conflict detection, and rollback all work — but rollback
now correctly means "restore," not just "delete," for modified files. All
exercised end-to-end in `test/cpt-taxonomy-generator-integration.test.js`
against a REAL plugin produced by the real Plugin Generator (not a
fixture), including a rollback test that corrupts the taxonomy file mid-run
and confirms the already-modified CPT file gets its original content back.

## Explicitly out of scope for this stage

- **ACF Field Generator, REST API Generator** — not built, per instruction.
  Only the Injection Generator pattern was established for them to reuse.
- **Full PHP AST parsing** — insertion uses targeted string search (find
  `register(): void {`, find the class's final closing brace), not a real
  PHP parser. Reliable given these files were produced by this same
  framework's Plugin Generator with a highly consistent structure; would
  need hardening if this generator ever needs to target hand-edited or
  externally-authored plugin files.
- **Reconciling label differences on re-run** — idempotency checks by
  slug only. Running with the same `cpt_name` but a different `cpt_plural`
  the second time is still treated as a no-op (existing registration is
  left alone), not updated. Documented, intentional scope for v1.
