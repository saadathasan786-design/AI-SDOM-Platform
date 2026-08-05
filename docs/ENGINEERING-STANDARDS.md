# Engineering Standards

The conventions this repository has consistently followed across its
entire development history. This document consolidates practices already
established in code and prior stage work — it does not introduce new
policy.

## Promotion discipline

A shared abstraction is extracted only after real, independent
duplication has accumulated across at least two real consumers — never
speculatively, never ahead of evidence. Every promotion in this
repository (`source-analysis.js`, `php-parsing.js`,
`generator-step-decision.js`, `plan-agent-sequence.js`, `registry-core.js`,
`catalog-core.js`) followed this bar, confirmed via direct `diff` before
extraction, not assumed.

When promoting:

1. Re-verify the duplication is still genuinely identical (or
   near-identical with a documented, evidence-based difference) by direct
   inspection — never trust a prior report without independent
   verification.
2. Extract only the confirmed-identical core. Leave genuine
   specialization local, even if that means the promoted utility takes a
   parameter to accommodate one consumer's real difference (e.g.
   `generator-step-decision.js`'s `actionLabel`, `registry-core.js`'s
   `label`).
3. Never normalize a genuine behavioral difference merely to increase
   sharing.
4. Preserve every existing public API name, signature, and return value
   exactly — a promotion is an internal refactor, never a breaking
   change.

## Architectural boundaries

- **Adapters orchestrate; frameworks execute; subsystems specialize;
  shared utilities remain generic.** No responsibility crosses these
  layers.
- **Frameworks never fetch their own context.** Context is always
  assembled by the caller (an adapter) and handed to
  `run*WithReport(id, context)`. A framework executor's only context
  -related job is filtering the supplied context down to exactly the
  component's declared `inputRequirements`.
- **A framework never reaches past its immediate lower layer.** Workflow
  calls Agent, never Advisor or Generator directly. Agent calls Advisor
  and Generator directly, since it genuinely depends on both.
- **Shared utilities are dependency-free** (or depend only on other
  utilities at the same or a lower architectural tier) and never import
  a framework, adapter, or subsystem that depends on them.

## Dependency direction

Strictly one-directional: `framework-shared/` → frameworks → adapters.
See `docs/REPOSITORY-ARCHITECTURE.md` for the complete, currently-verified
graph. No circular dependency is ever acceptable.

## API stability

Every public export's name, signature, and return shape is preserved
across every refactor. New capability is added additively (a new optional
parameter, a new optional context field) — never by changing an existing
contract's meaning.

## Production-freeze policy

A subsystem enters production freeze once its own dedicated architecture-
review stage independently re-verifies (not assumes) that its contracts,
dependency direction, and test suite are stable. Frozen code is not
touched outside a dedicated, explicitly-scoped stage — even a
well-intentioned drive-by improvement is deferred to such a stage.

## Documentation standards

See `docs/DOCUMENTATION-STANDARDS.md`.

## Testing philosophy

- **Manual validation before formal tests, always.** Every implementation
  stage in this repository's history performed genuine manual validation
  — real inputs, real edge cases — before writing a single formal
  assertion.
- **Zero-assertion-change regression is the acceptance bar for a pure
  refactor.** If a promotion or refactor requires changing an existing
  test's assertion, that is a signal the change was not behavior
  -preserving.
- **Full regression after every meaningful change**, not batched at the
  end of a multi-file migration — confirmed file-by-file throughout this
  repository's promotion stages.
- **Every genuine edge case gets a test**: malformed input, empty
  collections, duplicate registration, missing lookups, mutual
  exclusivity, and the never-throws contract wherever one is claimed.
