# Registry Core — `framework-shared/registry-core.js`

## Purpose

The confirmed byte-identical `register`/`get`/`has` core shared by all
four frameworks' registries — a `Map`-backed store's registration,
lookup-with-throw, and safe-lookup operations.

## Ownership

Lives in `framework-shared/`, a new, minimal, purpose-built location for
genuinely cross-framework code (Stage 14B) — distinct from
`project-discovery/`, which is adapter-layer shared code, a different
architectural tier. Each framework's own `Map` instance remains entirely
local to its own registry file; this file holds no state of its own.

## Public API

- `registerCore(registry, key, definition, label)` — stores `definition`
  under `key`; throws `"${label} \"${key}\" is already registered."` on
  duplicate.
- `getCore(registry, id, labelLower)` — retrieves the definition registered
  under `id`; throws a descriptive `"Unknown ${labelLower}: ..."` error,
  listing every registered id, if missing.
- `hasCore(registry, id)` — safe yes/no query, never throws.

## Consumers

All four framework registries: `generator-registry.js`,
`advisor-registry.js`, `agent-registry.js`, `workflow-registry.js`.

## Promotion rationale

Promoted in Stage 14B. Fresh, independent `diff` confirmed
Advisor/Agent/Workflow's `register/get/has` core byte-identical modulo
naming. Generator's diverges only in its key-extraction step (an `id ||
name` fallback for backward compatibility with pre-Stage-3C generators).

## Why this extraction boundary was chosen

Only `register`/`get`/`has` — the byte-identical core — was extracted.

## Why surrounding logic remained local

`list*()` (each framework's own metadata field shape genuinely differs —
e.g. Generator's `configSchema` vs. the other three's `inputRequirements`),
`_resetForTests()`, every exported wrapper name, all validation logic, and
Generator's own `keyFor()` fallback all remain exactly where they were,
unchanged. Generator's `registerGenerator()` computes its own key via its
local `keyFor()` *before* calling `registerCore()` — this file never knows
about the fallback logic at all.

## Dependency rules

Zero imports. Pure with respect to its own module scope: every function
takes the caller's own `Map` as an explicit parameter and mutates only
that `Map`, never any state of its own.

## Future extension guidance

A future fifth framework's registry should reuse this core directly rather
than reimplementing `register/get/has`. If a future framework's key logic
diverges (like Generator's fallback), compute the key locally before
calling `registerCore()`, exactly as Generator's own registry does — do
not add a `keyFor` parameter to this file speculatively until a second
framework genuinely needs one.
