# Generator Framework — Stage 3A

Located at `generators/framework/`. This is infrastructure only — **no
Theme, Plugin, CPT, or Widget generator is implemented here.** Every future
generator (Stage 3B onward) is built ON TOP of this framework, not
alongside it.

## Why this exists

Stage 3 was split in two so the reusable parts (registry, naming rules,
template substitution, safe file writing) get built and tested once,
correctly, before the first concrete generator locks in assumptions that
would otherwise need to be retrofitted across every generator later.

## Pieces

| File | Responsibility |
|---|---|
| `generator-interface.js` | Defines and validates the required shape of a generator definition |
| `generator-registry.js` | name → definition registry (register/get/list), same pattern as `mcp-server/platform-api.js` |
| `slug-generator.js` | Free text → WP-safe slug (`acme-client-portal`) |
| `namespace-manager.js` | Free text → PHP/PSR-4 namespace segment (`AcmeClientPortal`), and vendor+project composition |
| `text-domain-manager.js` | Free text → WP text domain — thin wrapper over slug rules, kept separate because it's a distinct WP concept even though the rules currently match |
| `constant-case-manager.js` | Free text → upper `SNAKE_CASE` (PHP constant prefixes) and lower `snake_case` (option-key prefixes). **Promoted from the Plugin Generator in Stage 3D** once the Theme Generator demonstrated a second real need — see the engineering rule note below. |
| `php-class-injector.js` | String-anchored insertion helpers for adding new code into an existing plugin-boilerplate-convention class. `insertMethodBeforeClassClose` and the general `insertBeforeMethodClose(source, methodMarker, text)`, plus the `insertHookIntoRegisterMethod` convenience wrapper. **Promoted from the CPT+Taxonomy Generator in Stage 3F; generalized in Stage 3G** once the REST API Generator needed to insert into a differently-named method (`register_routes()`, not `register()`). |
| `main-file-injector.js` | Discovery (`findMainPluginFile`, `detectPluginConstants`) and bootstrap-injection helpers (`insertRequireIntoFallbackBlock`, `insertUseStatement`, `insertIntoBootstrap`) for a target's MAIN plugin file. **Promoted from the Elementor Widget Generator in Stage 3I** once the Gutenberg Block Generator demonstrated a second real need. |
| `naming-validator.js` | Post-hoc validation: does this slug/namespace/project name actually satisfy WP/PHP rules |
| `template-loader.js` | Reads a template directory recursively, substitutes `__TOKEN__` placeholders in both file/folder names and file contents |
| `executor.js` | Runs a registered generator in `preview` / `dry-run` / `write` mode, with conflict detection and rollback-on-failure. Also the only place a generator's `templateDir` (if declared) is read from disk — see below. |
| `generation-report.js` | Wraps an executor run into a structured report (success/warnings/rollback/files created+modified+skipped/execution time) |
| `framework-version.js` | The framework's own canonical version, for compatibility checks (Stage 3C) |
| `catalog.js` | Read-only discovery layer: list/inspect registered generators, their variable manifests, supported modes, and framework compatibility (Stage 3C) |

> **Stage 3B addition:** a generator definition may optionally declare
> `templateDir` (absolute path to a real source folder). When present, the
> executor reads it via `loadTemplate()` itself and passes the raw file
> list to `generate(config, templateFiles)` as a second argument —
> `generate()` still never touches the filesystem; the executor does the
> one read, same as it does the writes. Generators without `templateDir`
> are unaffected and keep the original `generate(config)` single-argument
> signature. See `docs/PLUGIN-GENERATOR.md` for the first real usage of
> this against `plugin-boilerplate/`.

> **Stage 3C addition:** the registry key is `definition.id` if declared,
> otherwise `definition.name` (fully backward compatible — nothing built
> in Stage 3A/3B declares an `id`, and none of it needed to change). This
> split exists because the catalog needs a stable machine key ("plugin")
> distinct from a human display name ("Plugin Generator"). See the Catalog
> section below.

> **Stage 3E addition — Injection Generators:** a generator may declare
> `analyzeOutputDir: true` to have the executor read the TARGET directory
> (`outputDir`) before `generate()` runs, passed as a third argument:
> `generate(config, templateFiles, existingFiles)`. Each returned file may
> also declare `operation: "create" | "modify" | "skip"` (default
> `"create"`, fully backward compatible). `"modify"` requires the target to
> already exist and rolls back to its ORIGINAL content (not deletion) if a
> later step fails; `"skip"` is a no-op with a `reason`, for idempotent
> "nothing to do here" cases. See `docs/CPT-TAXONOMY-GENERATOR.md` for the
> first real usage — the reference Injection Generator.

## Generator Lifecycle

There are now two generator shapes:

- **Scaffold Generators** (Plugin, Theme) — declare `templateDir`, produce
  new output that must not already exist.
- **Injection Generators** (CPT+Taxonomy, and future ACF/REST API
  generators) — declare `analyzeOutputDir`, target an EXISTING project,
  and modify files that must already exist. See
  `docs/CPT-TAXONOMY-GENERATOR.md` for the full pattern and why rollback
  means "restore," not "delete," for this shape.

1. **Author** a generator definition (see shape below) — typically in its
   own folder under `generators/<name>/`, alongside a `variable-manifest.js`
   if it substitutes template content.
2. **Register** it exactly once, in `generators/index.js`, via
   `registerGenerator(definition)`. This is explicit — there is no
   auto-discovery/folder-scanning in this framework (that's an Extension
   SDK concern, later).
3. **Discover** it through the Catalog (`listCatalog()`,
   `getGeneratorMetadata(id)`, etc.) — this is how any future CLI, MCP
   tool, or workflow finds out what's available and what it needs, without
   importing the generator's module directly.
4. **Run** it via `runGenerator(id, config, options)` (raw executor result)
   or `runGeneratorWithReport(id, config, options)` (structured report) —
   in `preview`, `dry-run`, or `write` mode.
5. **Retire/replace** — not built yet. No generator has needed this; when
   one does, that's the point to design it, not before.

## Metadata Schema

A generator definition's REQUIRED fields (enforced by
`generator-interface.js`, unchanged since Stage 3A — this bar stays low so
a minimal test generator never needs to carry catalog-only fields it
doesn't have a real use for):

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Historically the registry key; now the human-readable display label if `id` is also present |
| `version` | yes | The generator's own version |
| `description` | yes | Shown by the catalog |
| `configSchema.fields` | yes | Array of `{name, type?, required?, default?, description?}` |
| `generate` | yes | Pure function — no filesystem access |

Optional fields, read by the Catalog with documented defaults when absent
(none of these are enforced by `generator-interface.js` — see the
"IMPORTANT ENGINEERING RULE" note at the end of this doc for why):

| Field | Default if absent | Notes |
|---|---|---|
| `id` | falls back to `name` | Stable machine key, distinct from display `name` |
| `templateDir` | `null` | Absolute path; executor reads it, generator receives already-loaded files |
| `analyzeOutputDir` | `false` | Executor reads the TARGET directory (`outputDir`) before `generate()` runs — for Injection Generators (Stage 3E) |
| `category` | `"uncategorized"` | Free-text grouping (`"plugin"`, `"theme"`, `"capability"`, etc.) |
| `variableManifest` | `[]` | Should be the same array a generator's own `variable-manifest.js` exports — attach it to the definition object so the catalog can read it generically |
| `supportedOutputs` | `[]` | Free-text list of artifact types produced (`["php-plugin"]`) |
| `minimumFrameworkVersion` | `null` (always compatible) | Compared against `framework-version.js`'s `FRAMEWORK_VERSION` |

`supportedModes` is **not** a field a generator declares at all — every
generator runs through the same executor, so `preview`/`dry-run`/`write`
support is a framework-wide invariant, hardcoded once in `catalog.js`.
Asking every generator to redeclare something that's always true would be
pure duplication.

## Catalog API

```js
import {
  listCatalog,
  getGeneratorMetadata,
  getVariableManifest,
  supportsMode,
  isAvailable,
  getFrameworkCompatibility,
} from "./generators/framework/catalog.js";

listCatalog();                        // metadata for every registered generator
getGeneratorMetadata("plugin");       // full metadata for one — throws if unknown
getVariableManifest("plugin");        // just that generator's variable manifest
supportsMode("plugin", "dry-run");    // true/false — throws if the generator id is unknown
isAvailable("plugin");                // true/false — never throws, safe existence+compat check
getFrameworkCompatibility("plugin");  // { currentFrameworkVersion, minimumFrameworkVersion, compatible }
```

The catalog is **read-only**: it never writes files, never calls
`generate()` or the executor, and never duplicates data a generator
already declares — it reads each generator's own fields and applies a
default only when a field is genuinely absent.

## Best Practices for Future Generators

- **Declare `id` and a human `name` separately** once your generator has a
  reason to display something friendlier than its machine key — not
  required, but the plugin generator (`id: "plugin"`, `name: "Plugin
  Generator"`) is the reference example.
- **Attach your `variable-manifest.js` export directly onto the definition**
  as `variableManifest` — don't make catalog consumers import your
  generator's internal files to find variables.
- **Only add a framework-level field/change if two or more generators would
  need it.** If a capability is only required by your one generator, keep
  it inside that generator's own file — see the engineering rule below.
- **Set `minimumFrameworkVersion` to the current `FRAMEWORK_VERSION`** at
  the time you build the generator, so future framework changes that break
  an assumption you relied on show up as an incompatibility, not a silent
  bug.

## Generator definition shape (the config format)

```js
{
  name: "plugin",              // unique registry key
  version: "1.0.0",
  description: "Scaffolds a new WordPress plugin from plugin-boilerplate.",
  configSchema: {
    fields: [
      { name: "project_name", type: "string", required: true, description: "Human-readable name, e.g. 'Acme Client Portal'" },
      { name: "vendor_name", type: "string", required: false, default: "Client", description: "Used in the PSR-4 namespace" },
    ],
  },
  generate: async (config) => {
    // MUST be pure — no filesystem access here. Return the files to write.
    // Typically calls loadTemplate() internally, or builds the list by hand.
    return [
      { path: `${slug}.php`, content: "..." },
      { path: `includes/Class-Activator.php`, content: "..." },
    ];
  },
}
```

Register it once, anywhere generator modules are wired up:

```js
import { registerGenerator } from "./framework/generator-registry.js";
registerGenerator(pluginGeneratorDefinition);
```

## Running a generator

```js
import { runGenerator } from "./framework/executor.js";

// See the files that would be created, full content, nothing written:
await runGenerator("plugin", config, { outputDir, mode: "preview" });

// See just the target paths + which ones already exist, nothing written:
await runGenerator("plugin", config, { outputDir, mode: "dry-run" });

// Actually write. Refuses if any target file already exists (no silent
// overwrite). If any individual write fails partway through, every file
// already written in this run is deleted before the error is thrown.
await runGenerator("plugin", config, { outputDir, mode: "write" });
```

## Rules for anyone building a generator on this framework

- **`generate()` must be pure.** No `fs` calls inside it. The executor is
  the only place file I/O happens — that's what makes preview/dry-run/
  rollback possible at all. If a generator needs to read a template, it
  should use `loadTemplate()` (also pure — reads the template, doesn't
  touch the output location).
- **Use the naming utilities, don't hand-roll slug/namespace logic.** Every
  generator should derive its slug via `toSlug()`, its namespace via
  `toNamespaceSegment()`/`buildPsr4Namespace()`, and its text domain via
  `toTextDomain()` — consistency across generators depends on this.
- **Validate early, fail with a clear message.** `naming-validator.js`
  functions return `{valid, reason}` rather than throwing — a generator's
  own `generate()` can check these and throw a generator-specific error
  before returning any files, rather than letting the executor discover a
  malformed name partway through a write.
- **Don't overwrite silently.** The executor already refuses to write over
  an existing file — don't add a generator-level "force overwrite" flag
  without a very deliberate reason; ask before implementing one.

## Engineering Rule: When a Framework Change Is Justified

Every new generator must justify any framework modification it requires.
If a capability is only needed by one generator, it stays inside that
generator's own file — it does not get promoted into `generators/framework/`
speculatively. Promotion happens only after a capability has been
demonstrated to be reusable by two or more real generators (not "might be
useful someday").

Stage 3C's two framework changes both meet this bar explicitly:
- **`id`-based registry keying** — needed by the catalog for every current
  and future generator alike (a stable key distinct from a display name is
  not one generator's concern).
- **`FRAMEWORK_VERSION`** — the framework's own version is inherently a
  single fact every generator's compatibility check needs to compare
  against; it cannot correctly live inside any one generator's file.

**Stage 3D's promotion is the rule working exactly as intended:** the
Plugin Generator (3B) had a private `toConstantCase()` helper. When the
Theme Generator (3D) needed the identical upper/lower snake-case
derivation, that was the second real generator demonstrating the need —
so it moved to `generators/framework/constant-case-manager.js`, and the
Plugin Generator was refactored to import it instead of keeping its own
copy. This is what "promote after two generators demonstrate the need"
looks like in practice: not promoted speculatively in Stage 3B when only
one generator existed, promoted the moment a second one genuinely needed
the same thing.

**Stage 3E's `operation`/`analyzeOutputDir` additions meet the bar
differently:** only one generator (CPT+Taxonomy) uses them so far, but the
approved Stage 3 roadmap already commits to a second and third Injection
Generator (ACF, REST API) using this identical pattern — so the bar is met
by a committed near-term plan, not retrofitted after the fact. If that
roadmap changes and no other Injection Generator ever materializes, this
would be the one deviation from "wait for actual evidence" in this
project's history, and worth revisiting.

**Stage 3F closes that loop with real evidence:** the ACF Field Group
Generator is the second Injection Generator, and it needed the EXACT same
`insertHookLine`/`insertMethodBeforeClassClose` mechanics the CPT+Taxonomy
Generator had as private helpers. That's now `php-class-injector.js` —
promoted on real second-use evidence, same as the Stage 3D pattern.

**Stage 3G — Change Set evaluation, resolved (for now):** with a third
Injection Generator (REST API) built, the question of whether to promote
a general "Change Set" abstraction was evaluated with real evidence
across all three. Conclusion: **not yet justified.** REST API's insertion
target (a call block inside an EXISTING method, not a new sibling method)
and its duplicate policy (refuse, not skip) both genuinely differ from
CPT/ACF — these aren't incidental styling gaps a thin abstraction could
paper over. What WAS justified and done: generalizing
`insertHookIntoRegisterMethod` into `insertBeforeMethodClose` (same
mechanic, parameterized by which method) — real code reuse, not
speculative. Full reasoning and a per-generator comparison table in
`docs/REST-API-GENERATOR.md`'s "Change Set Evaluation" section, including
what would need to be true (a fourth Injection Generator, compared against
these three) before revisiting this.

**Stage 3H — a fourth generator, no promotion needed:** the Elementor
Widget Generator is the first hybrid (scaffold + injection) and the first
to modify the main plugin file, yet needed zero framework changes — every
mechanism it uses (`templateDir`, `analyzeOutputDir`, `operation`, both
shared insertion helpers) already existed. Its three new, main-file-specific
helpers stay local to this one generator, since no other generator edits
the main file yet. See `docs/ELEMENTOR-WIDGET-GENERATOR.md`'s framework
generalization section for the full evaluation.

**Stage 3I promotes those main-file helpers on real second-use evidence:**
the Gutenberg Block Generator needed the IDENTICAL main-file discovery and
bootstrap-injection mechanics Elementor had built locally one stage
earlier. Now `main-file-injector.js`, with Elementor refactored to import
from it — the same "wait for two, then promote" pattern as every prior
promotion in this project. Gutenberg also needed no new capability for its
one genuinely new technique (JSON-aware parse/mutate/restringify for
`block.json`/`package.json`) — plain JavaScript, no framework change. See
`docs/GUTENBERG-BLOCK-GENERATOR.md`'s build-tool awareness evaluation for
why no shell-execution capability was added either, despite this being the
first generator to touch build-tooling-adjacent files.

**Stage 3J — the first Solution Generator, no promotion made:** the
Portfolio Starter Pack composes four existing generators via
`runGeneratorWithReport()` — no framework change needed for that. It also
revealed that Solution Generators are structurally different from every
prior generator (multi-step, multi-directory, sequential real writes
between steps) and cannot fit `registerGenerator()`'s single-pass contract
at all — so it lives entirely outside the registry, as its own module. Its
orchestration logic (skip-if-already-present, resumable-on-failure
sequencing) stays local until a second Solution Generator (Business
Website, per the roadmap) proves the same shape is needed twice. See
`docs/PORTFOLIO-STARTER-PACK.md`'s Composition Evaluation for the full
reasoning.

Everything else Stage 3C introduced (`category`, `supportedOutputs`,
`variableManifest` attachment, `minimumFrameworkVersion`) is optional
per-generator metadata with catalog-side defaults — deliberately NOT
enforced as required fields in `generator-interface.js`, so a minimal
future generator never has to carry metadata it has no real use for yet.

## Explicitly out of scope for this stage (future extension points)

- **Auto-discovery of generators** (scanning a folder for `generator.js`
  files and registering them automatically) — belongs to the Extension SDK
  (Layer 5), not this registry. This registry only supports explicit
  `registerGenerator()` calls.
- **CLI/interactive prompts wiring** — this framework is UI-agnostic. An
  MCP tool, a CLI, or a future Cowork workflow can all call `runGenerator()`
  or the Catalog the same way; none of that wiring exists yet.
- **Config schema validation beyond `required`** — v1 only checks that
  required fields are present. Type-checking values against `field.type`
  is a straightforward future addition once a real generator's config
  actually needs it.
- **Undo after a session ends** — rollback only covers a single in-progress
  `runGenerator()` call failing partway through, not "undo a generator run
  from yesterday" (a natural future Memory integration, not built here).
- **Semver ranges / caret constraints for `minimumFrameworkVersion`** — the
  catalog's version comparison is a plain major.minor.patch "at least"
  check, not a full semver range parser. Fine while only one generator
  declares a minimum version; revisit if a real need for ranges emerges.

## Stage 14B: shared registry/catalog core

`generator-registry.js`'s `register`/`get`/`has` and `catalog.js`'s
`isAvailable()` now delegate to `framework-shared/registry-core.js` and
`framework-shared/catalog-core.js` respectively — the confirmed
byte-identical core shared with the Advisor, Agent, and Workflow
Frameworks. See `docs/REGISTRY-CORE.md` and `docs/CATALOG-CORE.md` for
the full promotion rationale. The Generator Registry's own `keyFor()`
fallback (`definition.id || definition.name`, for backward compatibility
with pre-Stage-3C generators) and the Catalog's own version-compatibility
logic (`parseVersion`, `isVersionAtLeast`, `getFrameworkCompatibility`)
were deliberately NOT extracted — both are genuinely unique to Generator
and remain exactly where they were, layered locally on top of the shared
core.
