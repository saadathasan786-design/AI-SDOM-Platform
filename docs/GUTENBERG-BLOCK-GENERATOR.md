# Gutenberg Block Generator — Stage 3I

Located at `generators/gutenberg-block/`. Transforms
`gutenberg-block-boilerplate/` into a fully reusable production generator.
Same hybrid shape as the Elementor Widget Generator (3H): scaffolds new
block source files (`templateDir`) AND injects server-side registration
into the target plugin (`analyzeOutputDir`).

## Framework promotion: this stage's real evidence

Stage 3H's Elementor Widget Generator needed to find the target's main
plugin file (dynamic filename) and inject a require_once fallback line, a
`use` statement, and a bootstrap instantiation line into it — built as
LOCAL helpers at the time, since only one generator needed them. **This
stage is the second real generator needing the exact same mechanics** —
so those helpers are now `generators/framework/main-file-injector.js`
(`findMainPluginFile`, `detectPluginConstants`,
`insertRequireIntoFallbackBlock`, `insertUseStatement`,
`insertIntoBootstrap`), and the Elementor Widget Generator has been
refactored to import them instead of keeping its own copies. Verified
behavior-preserving: all 243 pre-existing tests passed unmodified after
the refactor, before any Gutenberg-specific code was written.

## JSON-aware substitution (a real improvement over string tokens)

`block.json` and `package.json` are actual JSON — this generator parses
them (`JSON.parse`), mutates fields directly, and re-stringifies, rather
than using the string-token-replace approach every other generator uses.
This is strictly more robust: no risk of a token accidentally matching
inside an unrelated string, and structural correctness (valid JSON output)
is guaranteed by construction rather than hoped for. `src/*.js` and
`src/*.scss` still use string substitution (for the `testimonial` → new
slug CSS class root), since those aren't structured data.

## What's renamed vs. what stays the same (consistent with every prior generator)

Following the same discipline established by Plugin/Theme/CPT/ACF/REST/
Elementor: only **block-level identity** changes — namespace, slug, title,
description, category, icon, textdomain, and the CSS class root
(`testimonial` → new slug, consistently across block.json's attribute
selectors, the JS files' `className` references, and the SCSS root
selector). The actual field names (`quote`, `author`) and the edit/save UI
logic are **not** redesigned into something "generic" — matching the
explicit instruction to treat the existing boilerplate as the literal
single source of truth, the same way Elementor's widget controls
(`heading`/`button_text`/`button_link`) were left unchanged when
scaffolding new widgets.

## New capability added: `keywords`

The base `block.json` has no `keywords` field at all — same situation as
Elementor's missing `get_keywords()`. Added directly to the parsed JSON
object when provided, omitted entirely when not (no empty `"keywords": []`
clutter).

## Registration convention (new — no prior integration point existed)

Same "first block vs. second+ block" pattern as Elementor:

- **First block**: creates `includes/Class-Blocks.php` (same
  "class with a `register(): void` hook method" convention as every other
  integration class) hooking WordPress core's `init` action, and wires the
  main plugin file.
- **Second+ block**: injects a new `register_block_type()` call into the
  existing `Class-Blocks.php`'s `register_blocks()` method, reusing
  `insertBeforeMethodClose` unchanged — main file is not touched again.

## Idempotency

Detection is by the generated block's `block.json` file existence — same
reliable-physical-file-existence approach as Elementor's widget-file
check, for the same reason (simpler and more direct than parsing
`Class-Blocks.php`'s content for a specific registration line).

## Usage

```js
import "./generators/index.js";
import { runGenerator } from "./generators/framework/executor.js";

// First block — creates Class-Blocks.php and wires the main file:
await runGenerator("gutenberg-block", {
  block_name: "Feature Card",
  category: "design",
  icon: "index-card",
  keywords: ["card", "feature"],
}, { outputDir, mode: "write" });

// Second block — injects into the existing Class-Blocks.php only:
await runGenerator("gutenberg-block", { block_name: "Pricing Table" }, { outputDir, mode: "write" });
```

After generation, the normal `@wordpress/scripts` workflow applies
unchanged: `cd blocks/feature-card && npm install && npm run build` — this
generator produces exactly the source files a developer would have
hand-written, nothing more.

## What's preserved (unchanged from 3E–3H)

Preview, dry-run, conflict detection, and rollback all work. Exercised
end-to-end in `test/gutenberg-block-generator-integration.test.js`
against a REAL plugin, including a dedicated test confirming **no
`build/` directory or `node_modules/` is ever created by generation
alone**.

## Explicitly out of scope for this stage

- **Running `npm install` or any build command** — explicitly required
  NOT to happen, and the framework has no shell-execution capability at
  all to do so even if asked (see the build-tooling evaluation below).
- **Fabricating `build/index.js` etc.** — `block.json` references these
  exactly as the source boilerplate does; they don't exist until the
  developer builds, matching normal `@wordpress/scripts` workflow.
- **Block attribute/control customization** — same limitation as
  Elementor's controls; the specific `quote`/`author` fields aren't
  independently configurable in this version.
- **Multiple attributes/variations per block** — one block per generator
  call, matching the source boilerplate's own scope (one block per
  folder).

---

## Build-Tool Awareness Evaluation (as instructed)

**No new framework capability was needed, and none is recommended.**

The requirement to support build tooling could have been read as "the
framework needs to know how to invoke `wp-scripts build`" — it doesn't,
and shouldn't:

1. **The explicit instruction was to generate source only, never execute
   build/npm commands.** This isn't a limitation being worked around —
   it's the correct, deliberately scoped behavior. A generator that
   silently shells out to `npm install` during "just generate some files"
   would be a surprising, slow, network-dependent side effect completely
   inconsistent with every other generator's pure-then-write model.
2. **The framework has no shell-execution capability at all** — not for
   this generator, not for any other. Adding one now, for a single
   generator that's explicitly forbidden from using it, would be
   speculative infrastructure with zero current consumers — the opposite
   of this project's evidence-based promotion discipline.
3. **What this generator DID need — JSON-aware file mutation instead of
   string tokens — required no framework change either.** `JSON.parse`/
   `JSON.stringify` are plain JavaScript; no new executor capability, no
   new shared helper. If a second JSON-heavy generator emerges later and
   needs the SAME parse-mutate-restringify pattern with enough shared
   logic to be worth extracting (e.g., a common "merge these fields into
   this JSON template" helper), that would be the evidence-based moment to
   consider promoting it — not before, and not for this one generator's
   fairly simple field-by-field mutation.

**If a future generator genuinely needs to trigger a build** (e.g., a
"scaffold and build a production block" workflow), that would be a
Workflow Engine concern (Layer 5, per the original platform architecture)
— orchestrating this generator's output THEN separately invoking a build
step — not a change to what a generator's `generate()` function is
allowed to do. Keeping "generate files" and "run a build" as separate
concerns is itself the right architectural boundary, not a gap to close.
