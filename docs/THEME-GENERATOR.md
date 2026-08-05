# Theme Generator — Stage 3D

Located at `generators/theme/`. Second concrete generator on the Stage 3A
framework, built to the same standards as the Plugin Generator (3B):
single source of truth, pure `generate()`, preview/dry-run/write/rollback,
structured Generation Report, discoverable variable manifest, comprehensive
tests. `theme-boilerplate/` (repo root) is the single source of truth —
`templateDir` points directly at it, nothing is duplicated.

## How it differs from the Plugin Generator (genuine, not corner-cutting)

| | Plugin Generator | Theme Generator |
|---|---|---|
| PHP namespace / PSR-4 | Yes (`Boilerplate\Plugin`) | **No** — `theme-boilerplate/` is procedural, collision-avoided via prefixed constants only |
| Composer / vendor concept | Yes (`vendor_name` config field) | **No** — no `composer.json`, no vendor slug |
| Main-file rename | Yes (`plugin-boilerplate.php` → `{slug}.php`) | **No** — WordPress identifies a theme by folder + `style.css`, not a specific filename. Every path passes through unchanged. |
| Token replacement order | Non-overlapping tokens, order didn't matter | **Order matters** — `boilerplate` (bare) is a literal substring of `boilerplate-theme`/`boilerplate-style`, so more specific tokens must be replaced first |

## Framework promotion triggered by this stage

Both this generator and the Plugin Generator need upper/lower snake-case
derivation (`ACME_PORTAL` / `acme_portal`). The Plugin Generator (3B) had
this as a local, unexported helper. Per the standing rule — *"a framework
capability should only be promoted after at least two generators
demonstrate the need"* — this is now `generators/framework/constant-case-manager.js`
(`toConstantCase`, `toOptionCase`), and the Plugin Generator has been
refactored to import it instead of keeping its own copy. Verified
behavior-preserving: all 85 pre-existing tests passed unmodified after the
refactor, before any Theme Generator code was added.

## Variable Manifest

| Variable | From config | Default | Example |
|---|---|---|---|
| `project_name` | `project_name` (required) | — | `Acme Portal` |
| `text_domain` | derived from `project_name` | — | `acme-portal` |
| `slug` | derived from `project_name` (same value as text_domain, different token) | — | `acme-portal` |
| `pattern_category_label` | derived from `project_name` | — | `Acme Portal` |
| `constant_prefix` | derived from `project_name` | — | `ACME_PORTAL` |
| `author` | `author` | `Your Name` | `Jane Smith` |
| `theme_uri` | `theme_uri` | `https://example.com` | `https://acmeagency.com` |

Note `text_domain` and `slug` derive from the identical `toSlug(project_name)`
value but replace two different literal tokens (`boilerplate-theme` vs bare
`boilerplate`) — documented as two manifest entries rather than one,
because they target distinct places in the source.

## Recipe Framework readiness (no Recipes built yet)

The Theme Generator exposes the same catalog metadata shape as the Plugin
Generator — `id`, `name`, `category`, `configSchema`, `variableManifest`,
`supportedOutputs`, `minimumFrameworkVersion` — using the existing Stage 3C
Catalog API, with **no new fields or abstractions invented for this**.
A future Recipe Framework can call `listCatalog()` or
`getGeneratorMetadata("theme")` / `getGeneratorMetadata("plugin")` today
and get everything it would need to compose the two (what each produces,
what config each needs, what each substitutes) without either generator
being modified. This is a consequence of Stage 3C already being generic,
not new work done in this stage.

## Usage

```js
import "./generators/index.js"; // registers both plugin and theme generators
import { runGenerator } from "./generators/framework/executor.js";
import { runGeneratorWithReport } from "./generators/framework/generation-report.js";

const config = { project_name: "Acme Portal" };

await runGenerator("theme", config, { outputDir, mode: "preview" });
const report = await runGeneratorWithReport("theme", config, { outputDir, mode: "write" });
```

## What's preserved (unchanged from 3A/3B)

Preview, dry-run, conflict detection, and rollback all work identically —
exercised end-to-end in `test/theme-generator-integration.test.js` against
the real `theme-boilerplate/` folder, including a byte-for-byte check that
the source is never modified by generation.

## Explicitly out of scope for this stage

- **Recipes / multi-generator composition** — not built, per instruction.
  Only metadata readiness was ensured.
- **`assets/js/main.js` and equivalent build output** — `theme-boilerplate/`
  doesn't currently ship a real `assets/` folder with build tooling, so
  this generator doesn't need to handle one yet. If a future version of
  the boilerplate adds a build step, that's the same wrinkle flagged for
  the future Gutenberg Block Generator in the Stage 3 roadmap review.
- **Splitting `theme_uri` from `author_uri`** — style.css has both a
  "Theme URI" and an "Author URI" line, both currently `https://example.com`;
  this generator sets both from the one `theme_uri` config value. Fine for
  now; split into two fields later if a real need for different values
  emerges.
