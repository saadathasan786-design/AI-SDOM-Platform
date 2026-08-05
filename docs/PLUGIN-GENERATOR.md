# Plugin Generator — Stage 3B

Located at `generators/plugin/`. The first concrete generator built on the
Stage 3A framework. `plugin-boilerplate/` (repo root) is the single source
of truth — this generator's `templateDir` points directly at that real
folder; nothing is duplicated or copied under `generators/`.

## How it works

`plugin-boilerplate/` is real, working code — not a template with
`__TOKEN__` placeholders. It has its own literal identifiers:

| In plugin-boilerplate/ | Example |
|---|---|
| Namespace | `Boilerplate\Plugin` |
| Text domain / slug | `boilerplate-plugin` |
| Constant prefix | `BOILERPLATE_PLUGIN_VERSION`, `_DIR`, `_URL`, `_FILE` |
| Option prefix | `boilerplate_plugin_version` |
| Plugin title | `Boilerplate Plugin` |
| Composer vendor | `yourname/boilerplate-plugin` |
| Author / URI | `Your Name`, `https://example.com` |

The generator's job is simple: find those exact literal strings, replace
them with values derived from config. That logic lives in
`generatePluginFiles()` — a pure function with no filesystem access. The
executor (unmodified from Stage 3A, only extended to support an optional
`templateDir`) reads `plugin-boilerplate/` fresh on every run and hands the
raw file contents to `generatePluginFiles()`. **All filesystem access stays
in the executor** — reading the template source and writing the output are
both done there; nothing else touches disk.

## Variable Manifest

Every supported variable is declared in `generators/plugin/variable-manifest.js`
(`VARIABLE_MANIFEST`), so what this generator can substitute is discoverable
without reading the substitution code itself:

| Variable | From config | Default | Example |
|---|---|---|---|
| `project_name` | `project_name` (required) | — | `Acme Client Portal` |
| `text_domain` | derived from `project_name` | — | `acme-client-portal` |
| `namespace` | derived from `vendor_name` + `project_name` | — | `AcmeAgency\AcmeClientPortal` |
| `constant_prefix` | derived from `project_name` | — | `ACME_CLIENT_PORTAL` |
| `option_prefix` | derived from `project_name` | — | `acme_client_portal` |
| `vendor_slug` | `vendor_name` | `Vendor` → `vendor` | `acme-agency` |
| `author` | `author` | `Your Name` | `Jane Smith` |
| `plugin_uri` | `plugin_uri` | `https://example.com` | `https://acmeagency.com` |

A unit test (`test/variable-manifest.test.js`) asserts every token in this
manifest is actually substituted by `generatePluginFiles()` — the manifest
and the code cannot silently drift apart.

## Catalog Metadata (Stage 3C)

This generator is registered with full catalog metadata — the reference
example other generators should follow:

```js
{
  id: "plugin",                    // stable machine key (unchanged — this is what runGenerator("plugin", ...) still uses)
  name: "Plugin Generator",         // human display label
  category: "plugin",
  supportedOutputs: ["php-plugin"],
  minimumFrameworkVersion: "1.0.0",
  variableManifest: VARIABLE_MANIFEST,  // the same export documented above, attached directly
}
```

Query it via the catalog rather than importing this module directly:

```js
import { getGeneratorMetadata, isAvailable } from "./generators/framework/catalog.js";
getGeneratorMetadata("plugin");
isAvailable("plugin"); // true — registered and framework-compatible
```

## Usage

```js
import "./generators/index.js"; // registers the plugin generator
import { runGenerator } from "./generators/framework/executor.js";
import { runGeneratorWithReport } from "./generators/framework/generation-report.js";

const config = { project_name: "Acme Client Portal", vendor_name: "Acme Agency" };

// Raw executor result (Stage 3A shape — preview/dry-run/write, unchanged):
await runGenerator("plugin", config, { outputDir, mode: "preview" });

// Structured Generation Report (Stage 3B addition):
const report = await runGeneratorWithReport("plugin", config, { outputDir, mode: "write" });
```

## Generation Report shape

```jsonc
{
  "generator": "plugin",
  "mode": "write",              // "preview" | "dry-run" | "write"
  "success": true,
  "warnings": [],                // e.g. dry-run conflicts, listed here as warnings
  "rollback": { "occurred": false, "files_removed": 0 },
  "files": { "created": [...], "skipped": [...] },
  "execution_ms": 42,
  "timestamp": "2026-07-28T00:00:00.000Z",
  "error": null
}
```

On failure (e.g. a mid-run write error triggering the executor's
rollback), `success` is `false`, `rollback.occurred` is `true` with the
actual count of files removed, and `error` holds the underlying message —
`runGeneratorWithReport` never throws; failures are reported, not raised.

This report builder (`generators/framework/generation-report.js`) is
generic — it doesn't know anything about plugins specifically — so any
future generator gets the same structured report for free.

## What's preserved from Stage 3A (unchanged)

- **Preview** — full file contents, nothing written.
- **Dry-run** — target paths + conflicts, nothing written.
- **Conflict detection** — write mode refuses to overwrite existing files.
- **Rollback** — a mid-run write failure deletes everything already written
  in that run before the error propagates.

All exercised end-to-end in `test/plugin-generator-integration.test.js`
against the real `plugin-boilerplate/` folder — not a fixture copy.

## Explicitly out of scope for this stage (future extension points)

- **Config value type-checking** (e.g. rejecting a non-string `author`) —
  the framework's `configSchema` only checks `required` presence today.
- **Custom starting version** — generated plugins always start at `1.0.0`
  (whatever `plugin-boilerplate/` currently declares); no config field
  overrides it yet.
- **CPT/ACF field customization at generation time** — this generator
  scaffolds the plugin as-is from the boilerplate; adding/removing CPTs or
  ACF fields during generation is a future generator's job (or a later
  enhancement here), not built now.
- **`toConstantCase()` / `toOptionCase()`** were promoted from this
  generator into `generators/framework/constant-case-manager.js` in
  Stage 3D, once the Theme Generator demonstrated a second real need for
  the same derivation. This generator now imports them rather than
  defining its own copy — see `docs/THEME-GENERATOR.md` for details.
