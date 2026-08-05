# Portfolio Starter Pack — Stage 3J

Located at `generators/portfolio-starter-pack/`. **The first Solution
Generator** — composes four existing generators (Theme, Plugin,
CPT+Taxonomy, ACF Field Group) into a complete portfolio website. No
generation logic, template processing, or naming logic is duplicated;
every file this produces is written by one of those four generators' own
existing, unchanged code.

## Why this isn't registered via `registerGenerator()`

Every generator through Stage 3I fits one contract: a single
`generate(config, templateFiles, existingFiles)` call, one executor write
phase, atomic. A Solution Generator structurally cannot fit that shape —
CPT+Taxonomy's `analyzeOutputDir` step needs to read the Plugin's REAL,
already-written files, which only exist after the Plugin step has
**actually written them to disk**. This is inherently multi-step,
multi-directory (theme output vs plugin output), sequential, with real
writes between steps.

Forcing this into `registerGenerator()` would mean either lying about its
shape (a fake `generate()` that secretly does something else) or weakening
the registry's single-pass contract for every other generator. Neither is
acceptable. So this is its own module — `runPortfolioStarterPack(config,
options)` — with its own metadata object (`PORTFOLIO_METADATA`, matching
the same conceptual shape the Catalog uses: id/name/description/category/
configSchema/variableManifest) for discoverability, rather than forcing a
fit that doesn't exist.

## Composition

```
Theme Generator
  |
Plugin Generator
  |
CPT + Taxonomy Generator  (cpt_name defaults to "Portfolio Item")
  |
ACF Field Group Generator (target_cpt = the CPT step's own derived slug)
```

`deriveStepConfigs()` maps one flattened input onto each generator's own
config shape — no naming logic is reinvented; `target_cpt` is computed via
the exact same `toOptionCase()` the CPT+Taxonomy Generator uses internally,
so the ACF step is guaranteed to target the CPT the previous step just
created, never independently guessed.

## Idempotency (relies entirely on what each generator already provides)

- **Theme/Plugin** (Scaffold Generators) refuse to overwrite existing
  output. So before calling either, this orchestrator checks whether its
  target directory already has content and **skips that step entirely**
  if so — it never even invokes the generator, so it never hits that
  refusal.
- **CPT+Taxonomy/ACF** (Injection Generators) already skip silently when
  their identity exists. This orchestrator just calls them plainly every
  time — their own idempotency does the rest.

No new idempotency behavior was invented. Verified: running the whole
Starter Pack twice against the same targets correctly skips Theme/Plugin
and reports CPT/ACF as no-ops, with zero duplicate registration.

## Rollback — a deliberate choice, not an oversight

This orchestrator does **not** implement a whole-sequence "undo everything
if a later step fails" transaction. Each individual generator's own atomic
rollback is preserved completely unchanged. On top of that, this
orchestrator relies on **resumability** instead of a competing undo
mechanism: if step 3 fails, steps 1-2's output is left in place (valid,
complete, safe), the failure is reported clearly with which step and why,
and re-running the whole Starter Pack after fixing the issue skips the
already-completed steps and retries only what's left.

This is simpler than building a second, competing notion of "transaction"
on top of the framework's existing one, and matches how a human operator
would actually recover. Verified: a forced ACF failure (invalid field
type) leaves Theme/Plugin/CPT output fully intact; fixing the config and
re-running correctly resumes and completes.

## Preview and dry-run: a disposable scratch copy

Since later steps genuinely need real (or realistically current) prior
state to analyze correctly, "preview the whole sequence" is implemented by
**actually running the full write-mode sequence against a disposable
scratch directory** (seeded from the real target's current state, if any,
via `fs.cp`) — then reading back results and discarding the scratch copy.
This is an honest technique: it shows exactly what would happen, including
correctly reflecting an already-partially-composed real target (Theme/
Plugin correctly show as "would skip," CPT/ACF correctly show as "would be
no-ops"), without ever touching the real target. Verified: `theme_output_dir`
and `plugin_output_dir` do not exist on disk after a dry-run or preview
call against a fresh target.

## Usage

```js
import "./generators/index.js"; // registers theme/plugin/cpt-taxonomy/acf-field-group
import { runPortfolioStarterPack } from "./generators/portfolio-starter-pack/portfolio-starter-pack.js";

const report = await runPortfolioStarterPack(
  { project_name: "Acme Portfolio" }, // everything else has sensible defaults
  { theme_output_dir: "...", plugin_output_dir: "...", mode: "write" }
);

report.success;       // true/false overall
report.steps;         // per-step reports, in order
report.failed_step;   // which generator failed, if any
```

## What's preserved (unchanged from every underlying generator)

Preview, dry-run, conflict detection, and each generator's own rollback
all work exactly as designed — nothing about them was bypassed or
weakened. Exercised end-to-end in
`test/portfolio-starter-pack-integration.test.js` against real generator
output on real disk, including a full composition test, idempotent
re-run, dry-run/preview against both fresh and already-composed targets,
and a failure/resumability sequence.

## Explicitly out of scope for this stage

- Business Website, Blog, WooCommerce Store, Membership Site — not built,
  per instruction.
- A Workflow Engine concept — not introduced; this is a generator that
  calls other generators, nothing more.
- Whole-sequence transactional rollback — a considered, documented
  omission (see above), not a gap.

---

## Composition Evaluation (as instructed)

**Was the existing Generator Framework sufficient?** Yes, almost entirely.
`runGeneratorWithReport()` — built in Stage 3B, unchanged since — was all
that was needed to invoke each step. The one thing the framework does
**not** provide, because no single-pass generator ever needed it, is a way
to sequence multiple `runGenerator` calls against different directories
where later calls depend on earlier calls' real disk output. That's not a
missing framework abstraction — it's a different *kind* of thing
(orchestration) than what the framework's registry/executor are for
(single-pass generation), and building it as its own module rather than
forcing a framework change was the correct boundary.

**Do Solution Generators reveal any missing abstractions?** One candidate
worth naming honestly: a shared "run a sequence of generators with
skip-if-already-present and resumable-on-failure semantics" helper. This
Starter Pack's `runSequence()` internal function does exactly that, but
it's currently specific to this one Starter Pack's 4 fixed steps. If a
second Solution Generator (Business Website, per the roadmap) needs the
*same* orchestration shape — sequencing N generators with the same
skip/resume semantics, just a different list of steps and configs — that
would be the second real consumer this project's promotion rule requires
before generalizing it.

**Should a Recipe/Composition Framework be promoted now?** **No.** One
Solution Generator is one data point. This project's standing rule —
"never promote abstractions without multiple proven consumers" — applies
here exactly as it did for `constant-case-manager.js`, `php-class-injector.js`,
and `main-file-injector.js` in earlier stages: each of those waited for a
genuine second real need before generalizing, and each promotion was
better for having real evidence instead of a guess. A Recipe/Composition
Framework designed from ONE example (this Portfolio pack) would be
guessing at what varies across future Solution Generators (Does Business
Website need a 5th or 6th step? Does it need conditional branching, not
just linear sequencing? Does it need parallel independent steps?) — none
of that is knowable yet.

**Recommendation:** keep this orchestration logic local to
`portfolio-starter-pack.js` until the Business Website Starter Pack is
built. At that point, compare the two Solution Generators' actual
orchestration code side by side — the same evidence-based comparison this
project did for the three Injection Generators before concluding "no
Change Set abstraction yet" in Stage 3G. If the shape truly matches,
promote a shared "generator sequence runner" then, with real evidence
driving its design. If it doesn't match — e.g., if Business Website needs
genuinely different sequencing logic — that's equally valuable evidence
that no such abstraction was ever warranted.
