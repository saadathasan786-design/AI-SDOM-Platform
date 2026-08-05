# Generator-Step Decision Utility — `agents/framework/generator-step-decision.js`

## Purpose

Decides the outcome of a generator-type Agent plan step, given its
already-computed result: `fail` if the generator step itself failed,
`stop` if it succeeded (a generator step is always the final step in
every current Agent's plan).

## Ownership

Lives in `agents/framework/` — owned by the Agent Framework. Every current
Agent's plan ends with, at most, one generator step, decided identically
except for a human-readable label.

## Public API

- `decideGeneratorStep(result, { actionLabel = "Remediation" } = {})` —
  returns `{ action: "fail" | "stop", reason }`. `actionLabel` customizes
  the human-readable label in both reason strings.

## Consumers

Five real Agents: `architecture-remediation-agent.js`,
`performance-optimization-agent.js`, `security-remediation-agent.js`,
`plugin-security-remediation-agent.js` (all four using the default
`"Remediation"` label), and `plugin-performance-optimization-agent.js`
(using `actionLabel: "Optimization"`).

## Promotion rationale

Promoted in Stage 12B. Fresh, independent `diff` confirmed 4 of 5 Agents'
generator-step decision blocks byte-identical, with the 5th differing only
in the "Remediation"/"Optimization" word choice appearing twice.

## Why this extraction boundary was chosen

Only the generator-step decision outcome itself was extracted — the exact
behavior every one of the five Agents' own `decide()` functions already had
for this one step type.

## Why surrounding logic remained local

Nothing about planning, Advisor execution, or orchestration was touched.
Each Agent's own advisor-step decision logic — which genuinely differs
agent-to-agent (isolated vs. accumulated critical/warning/suggestion
thresholds) — remains entirely local, since it was never duplicated.

## Dependency rules

Zero imports. Pure, deterministic, side-effect free: reads only its own
arguments, returns a plain decision object, never mutates its input.

## Future extension guidance

A future Agent whose plan ends in a generator step should call this helper
with its own `actionLabel`, rather than reimplementing the fail/stop logic.
If a future Agent's generator-step policy genuinely needs to differ beyond
a label (e.g. a `continue` outcome instead of always `stop`), that
divergence should stay local to that Agent rather than adding a new
parameter here speculatively — extend this helper only once a second real
Agent needs the same new behavior.
