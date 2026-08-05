# Plan Agent Sequence Utility — `workflows/framework/plan-agent-sequence.js`

## Purpose

Builds a Workflow plan whose steps invoke each agent in a given sequence,
in order, each receiving the same `sourceFiles`.

## Ownership

Lives in `workflows/framework/` — owned by the Workflow Framework. Every
current Workflow's `plan()` does exactly this, differing only in which
agent ids and in what order.

## Public API

- `planAgentSequence(agentSequence, input)` — returns `{ steps: [{
  agentId, context: { sourceFiles } }, ...] }`, one step per entry in
  `agentSequence`, in order.

## Consumers

All four real Workflows: `project-health-check-workflow.js`,
`security-audit-workflow.js`, `plugin-health-audit-workflow.js`,
`release-readiness-workflow.js`. Each keeps its own `AGENT_SEQUENCE`
constant locally and passes it into this helper.

## Promotion rationale

Promoted in Stage 13B. Fresh, independent three-way `diff` confirmed all
four Workflows' `plan()` functions byte-identical — stronger evidence than
any prior review had documented (earlier reviews only checked pairwise).

## Why this extraction boundary was chosen

Only the "map a fixed agent sequence into `{ agentId, context }` plan
steps" logic was extracted.

## Why surrounding logic remained local

Each Workflow's own `AGENT_SEQUENCE` constant is workflow-specific data,
not duplicated logic, and remains local, passed into the helper as a
parameter. Each Workflow's `decide()` policy — which genuinely differs
(uniform-fail-then-final-stop vs. always-stop-at-final-step, confirmed
distinct in Stage 13A's own review) — was never touched.

## Dependency rules

Zero imports. Pure, deterministic, side-effect free: does not mutate
either the `agentSequence` array or the `input` object.

## Future extension guidance

A future Workflow whose `plan()` is a straightforward agent sequence
should call this helper with its own `AGENT_SEQUENCE`, rather than
reimplementing the mapping. A Workflow whose plan genuinely needs a
different step shape (not just a different sequence) should keep its own
local `plan()`, since this helper is deliberately scoped to the one plan
shape every current Workflow shares.
