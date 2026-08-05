# Catalog Core — `framework-shared/catalog-core.js`

## Purpose

The confirmed byte-identical `isAvailable()` core shared by all four
frameworks' catalogs — a safe "is this id currently registered" yes/no
check.

## Ownership

Lives in `framework-shared/`, alongside `registry-core.js`, for the same
cross-framework-ownership reasoning (Stage 14B).

## Public API

- `isAvailableCore(hasFn, id)` — returns `hasFn(id)`. Never throws.

## Consumers

All four framework catalogs: `generators/framework/catalog.js`,
`advisor-catalog.js`, `agent-catalog.js`, `workflow-catalog.js`. Advisor,
Agent, and Workflow Catalogs' own `isAvailable()` delegate to this
directly. Generator's `isAvailable()` reuses this for its own "is it
registered at all" sub-check, then layers its own additional
`frameworkCompatible` logic on top locally.

## Promotion rationale

Promoted in Stage 14B. Fresh, independent `diff` confirmed
Advisor/Agent/Workflow's `isAvailable()` byte-identical modulo naming.
Generator's is genuinely different (it also checks framework-version
compatibility) but still benefits from sharing the common registration
check.

## Why this extraction boundary was chosen

Only the "is this id registered" check was extracted.

## Why surrounding logic remained local

`listCatalog()`/`getMetadata()`/`supportsMode()`/`supportsSeverity()`/
`getInputRequirements()`/`getVariableManifest()`/
`getFrameworkCompatibility()`/`checkCompatibility()` all remain exactly
where they were, in each subsystem's own catalog file. Generator's
version-compatibility logic (`parseVersion`, `isVersionAtLeast`,
`getFrameworkCompatibility`) is genuinely unique to Generator (the only
subsystem whose written output could break compatibility across framework
versions) and was never folded into this shared core — this is not a
normalization of Generator's behavior, its `isAvailable()` remains
behaviorally identical to before Stage 14B.

## Dependency rules

Zero imports. Pure, stateless, side-effect free: takes the caller's own
`has*()` function and an id, returns a boolean, holds no state of its own
— never calls or knows the name of any subsystem's registry itself.

## Future extension guidance

A future fifth framework's catalog should reuse this core for its own
`isAvailable()` directly. A framework whose availability check needs
additional logic (like Generator's) should layer that logic locally on
top of this core's result, exactly as Generator's own catalog does.
