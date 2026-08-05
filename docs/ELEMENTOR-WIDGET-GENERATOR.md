# Elementor Widget Generator — Stage 3H

Located at `generators/elementor-widget/`. Transforms
`elementor-widget-boilerplate/` into a fully reusable production generator.
A genuine **hybrid**: scaffolds new output (like Plugin/Theme) AND injects
registration into the target plugin (like CPT/ACF/REST) — the first
generator to need both `templateDir` and `analyzeOutputDir`
simultaneously. Both were already independently supported by the executor;
this stage needed **zero framework changes** to combine them.

## New territory: no pre-existing integration point

Unlike CPT/ACF/REST — which each injected into a `Class-X.php` file that
already existed in `plugin-boilerplate/` — `elementor-widget-boilerplate/`
has no corresponding integration point inside the plugin at all. So:

- **First widget** for a target plugin: creates a NEW
  `includes/Class-Elementor.php` (following the same "class with a
  `register(): void` hook method" convention as every other integration
  class) AND modifies the target's **main plugin file** — a require_once
  fallback line, a `use` statement, and a bootstrap instantiation line.
  No prior generator has touched the main plugin file.
- **Second+ widget**: `Class-Elementor.php` already exists, so this
  generator injects a new require+register pair into its existing
  `register_widgets()` method instead, reusing `insertBeforeMethodClose`
  exactly as-is — main plugin file is **not** touched again.

## Finding the main plugin file (dynamic name, not a fixed path)

> **Update (Stage 3I):** the helpers described below have since been
> promoted to `generators/framework/main-file-injector.js`, once the
> Gutenberg Block Generator demonstrated a second real need for the exact
> same mechanics. This generator now imports them rather than defining its
> own copies. See `docs/GUTENBERG-BLOCK-GENERATOR.md` for details.

The main file's name varies (`{slug}.php`, derived from whatever project
name was used originally) — unlike `includes/Class-CPT.php` etc., which
have fixed paths. This generator finds it by scanning `analyzeOutputDir`'s
results for a root-level file (no directory separator in its path)
containing a `Plugin Name:` docblock. From that file, it also detects the
target's constant prefix, namespace, and text domain — all needed to
generate correct code, none of them config inputs.

## Widget class naming (collision avoidance)

`elementor-widget-boilerplate/`'s widgets have **no PHP namespace** (a
real Elementor-ecosystem convention — many Elementor extensions avoid
namespacing widget classes). To avoid collisions between multiple
generated plugins' widgets on the same site, this generator prefixes the
widget class name with the target project's own namespace segment:
`{ProjectSegment}_{WidgetPascalName}_Widget` — e.g.
`AcmeClientPortal_TestimonialCard_Widget`.

## A real bug found and fixed: stale docblock

The base widget's docblock comment describes MANUAL registration
instructions (`add_action('elementor/widgets/register', ...)` in theme
`functions.php`). Once this generator wires registration automatically via
`Class-Elementor.php`, that comment becomes actively misleading. Replaced
with an accurate one documenting automatic registration — found during
manual smoke testing, fixed before the formal test suite was written, and
covered by a dedicated test asserting the stale text is gone.

## New capability added: `get_keywords()`

The base widget has no `get_keywords()` method at all. This generator adds
one (via `insertMethodBeforeClassClose`, same primitive used for CPT/ACF's
new methods) when `keywords` is provided — and omits it entirely when not,
rather than generating an empty/pointless method.

## Idempotency

Detection is by **widget file existence** — simpler and more reliable than
parsing file content: does `widgets/class-{slug}-widget.php` already
exist? If so, the whole generation is a no-op (`operation: "skip"`). This
differs slightly from CPT/ACF/REST's identity check (which parse content
for a method/route name) because here a distinct physical file is a more
direct and reliable existence signal.

## Usage

```js
import "./generators/index.js";
import { runGenerator } from "./generators/framework/executor.js";

// First widget — creates Class-Elementor.php and wires the main file:
await runGenerator("elementor-widget", {
  widget_name: "Testimonial Card",
  keywords: ["testimonial", "quote", "review"],
  category: "theme-elements",
}, { outputDir, mode: "write" });

// Second widget — injects into the existing Class-Elementor.php only:
await runGenerator("elementor-widget", { widget_name: "Pricing Table" }, { outputDir, mode: "write" });
```

## What's preserved (unchanged from 3E/3F/3G)

Preview, dry-run, conflict detection, and rollback all work. Exercised
end-to-end in `test/elementor-widget-generator-integration.test.js`
against a REAL plugin, including the first-widget vs second-widget branch,
idempotency, and a full pipeline test with keywords + category overrides.

## Explicitly out of scope for this stage

- **Widget CSS/JS assets** — the base boilerplate widget is PHP-only
  (inline styles via classes like `boilerplate-cta__heading`, no separate
  enqueued stylesheet). This generator doesn't introduce asset scaffolding
  either — matches the source's own scope.
- **Control customization** — `register_controls()`'s actual fields
  (heading/button text/button link) are carried through unchanged from the
  template. Making the CONTROLS THEMSELVES configurable (not just
  name/slug/title/icon/category/keywords) is a larger scope than this
  stage — the base widget's specific controls stay as-is.
- **Removing/uninstalling a previously generated widget** — no generator
  in this framework does undo/removal yet; consistent with that absence
  elsewhere.

---

## Framework Generalization Evaluation (as instructed)

**The framework generalizes cleanly to this UI-oriented generator with
zero new abstractions.** Every mechanism this generator needed already
existed:

- `templateDir` (Plugin/Theme, 3B/3D) — for the widget class scaffold.
- `analyzeOutputDir` (CPT+Taxonomy, 3E) — for reading the target.
- `operation: "create"/"modify"/"skip"` (3E) — for the three-way split
  between the widget file, `Class-Elementor.php`, and the main file.
- `insertBeforeMethodClose`/`insertMethodBeforeClassClose`
  (3E/3F/3G) — reused unchanged for both the `get_keywords()` addition and
  the second-widget injection into `Class-Elementor.php`.
- Rollback/conflict-detection/Generation Reports — all generic, no
  per-generator wiring needed.

**No framework promotion was made this stage.** The three new pieces this
generator needed — finding the main file by scanning for a `Plugin Name:`
docblock, detecting constant-prefix/namespace/text-domain from it, and the
three main-file-specific insertion helpers (`insertRequireIntoFallbackBlock`,
`insertUseStatement`, `insertIntoBootstrap`) — are all **local to this
generator only**. Per the project's promotion rule, these stay here unless
a second generator needs to modify the main plugin file too. No other
generator currently does (CPT/ACF/REST only ever touch their own
`includes/Class-X.php`), so promoting main-file-editing helpers now would
be speculative, not evidence-based.

**This is the cleanest validation yet that Stage 3A's original framework
design was right-sized.** Four stages after Stage 3E introduced injection
support, a genuinely new shape (hybrid scaffold+injection, dynamic-filename
target discovery, first-time-vs-subsequent-time conditional file
operations) was absorbed without touching `executor.js`,
`generator-registry.js`, or `catalog.js` at all.
