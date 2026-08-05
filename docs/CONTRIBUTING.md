# Contributing

How to add new capability to this repository without breaking any
existing contract. This consolidates the pattern every real Generator,
Advisor, Agent, and Workflow in this repository has already followed —
it does not introduce new rules.

## Adding a new Advisor

1. Create a new directory beside the existing advisors (e.g.
   `advisors/my-new-advisor/`).
2. Implement `{ id, name, version, description, inputRequirements,
   analyze }` — a pure function. Every real Advisor so far has needed
   only `inputRequirements: ["sourceFiles"]`; only declare more if your
   Advisor genuinely needs it (e.g. `knowledgeGraph`, if you have a real,
   evidenced use for it).
3. Register it in `advisors/index.js` alongside the existing
   `registerAdvisor()` calls.
4. Write a manual-validation pass first, then a focused test file in
   `advisors/test/`, then run the full Advisor suite.
5. Write `docs/MY-NEW-ADVISOR.md` following the shape of an existing
   advisor doc (e.g. `docs/SECURITY-ADVISOR.md`).
6. Do not modify `advisors/framework/*.js` unless your Advisor reveals a
   genuine contract gap — and if it does, that is itself a signal to stop
   and evaluate the framework change on its own merits, not bundle it
   into your Advisor's own change.

## Adding a new Agent / Workflow

Follow the identical pattern, substituting `plan`/`decide` for `analyze`,
registering in `agents/index.js` or `workflows/index.js`, and modeling
your doc after an existing Agent/Workflow doc.

## Adding a new Generator

Follow `docs/GENERATOR-FRAMEWORK.md`'s own generator-authoring guidance;
register in `generators/index.js`.

## Promoting a shared utility

Only after you find the same logic duplicated, byte-identical or
near-identical, across two or more real consumers. See
`docs/ENGINEERING-STANDARDS.md`'s Promotion Discipline section for the
full process, and model your new utility's doc after
`docs/PHP-PARSING.md` or `docs/REGISTRY-CORE.md`.

## Before submitting any change

1. Re-verify your own assumptions by direct inspection of the current
   repository — do not trust a prior report, comment, or doc without
   checking it yourself first.
2. Perform genuine manual validation of your change before writing formal
   tests.
3. Run the complete regression suite for every subsystem you touched, and
   the full repository regression if you touched anything shared.
4. No existing test assertion should need to change for a pure refactor
   — if one does, that's a signal your change is not behavior-preserving.
5. Update or create the relevant `docs/` file(s) — a change is not
   complete until its documentation matches, per
   `docs/DOCUMENTATION-STANDARDS.md`.

## What never changes without a dedicated, explicitly-scoped stage

Framework executor contracts, report shapes, registry/catalog public
APIs, `discoverProject()`/`buildProjectGraph()`/Memory Store signatures,
and any adapter's public CLI flags/MCP tool schemas/VS Code commands.
These are frozen; extending them is always additive, never a redefinition
of existing behavior.
