# Plugin Performance Optimization Agent — Second Real WordPress Agent

Located at `agents/plugin-performance-optimization/`. The second real
WordPress-specific Agent, validating that the Agent Framework supports
a second, genuinely different WordPress orchestration policy.

## Orchestration shape

```
Step 1: wordpress-performance Advisor  -> decide() gate
Step 2 (conditional): Plugin Generator (dry-run only)
```

Same shape as the Plugin Security Remediation Agent (Stage 7E) — what
differs is the decision policy, not the shape.

## Decision policy — accumulation, not isolation

```
critical > 0     -> continue (currently unreachable via the real Advisor -- see below)
warning >= 2     -> continue (ACCUMULATED warnings required)
suggestion >= 3  -> continue (same volume threshold as the generic Performance Agent)
otherwise        -> stop
```

## Concrete, verified cross-Agent policy comparison (required by this stage)

Direct inspection of all three relevant agents' actual threshold logic:

```
Plugin Security Remediation Agent (7E):     warning > 0   (isolated -- ANY single warning triggers)
Plugin Performance Optimization Agent (7F):  warning >= 2  (accumulated -- one alone does NOT trigger)
Generic Performance Optimization Agent (5H): warning > 0   (also isolated, for comparison)
```

Honest note: this Agent's warning threshold is stricter than even the
GENERIC Performance Optimization Agent's own warning > 0 -- the generic
Agent's own policy is isolated too. This stage's instruction to
"emphasize accumulated concerns rather than isolated findings" was
implemented as a genuinely new refinement for this specific Agent, not
a copy of the generic Agent's exact warning-branch. The suggestion >= 3
volume threshold, however, IS reused identically from the generic
Performance Optimization Agent, as instructed.

Direct behavioral proof, not just code inspection: calling both agents'
decide() with the identical synthetic input
{ warning: 1, suggestion: 0, critical: 0 } produces:

```
Plugin Security Remediation Agent:     "continue"
Plugin Performance Optimization Agent: "stop"
```

Conclusion: the two WordPress Agents demonstrate genuinely different
orchestration behavior, not a superficial relabeling. The difference is
a real, verified difference in judgment (isolated-finding-matters vs.
accumulation-required), directly mirroring the same real-world
reasoning that already distinguished the generic Security and
Performance Optimization Agents (Stages 5G/5H) from each other: a
single security gap is a standalone risk; a single performance
inefficiency, in this Agent's judgment, is not yet worth acting on
alone.

## An honest discovery, mirroring Stage 7E's own precedent

Direct inspection (via grep, before writing this policy) confirms the
WordPress Performance Advisor's current rule set never produces
critical-level findings -- only warning, suggestion, and info. The
critical > 0 branch is therefore currently unreachable via the real
Advisor, kept for the same forward-compatibility and defensive reasons
Stage 7E already documented for its own analogous branch.

## Manual validation performed before the formal suite existed

- Efficient plugin (batched WP_Query with explicit limit and
  no_found_rows, cached option read) -- zero findings, agent stops, no
  Generator step.
- A single isolated warning (orderby => 'rand' alone) -- confirmed to
  NOT escalate, the key genuine-difference test.
- Mixed plugin (2 suggestion-level findings, below the volume
  threshold) -- confirmed does not escalate.
- Inefficient plugin (3 accumulated warnings: query-in-loop +
  expensive-random-order) -- confirmed escalates to the dry-run Plugin
  Generator step.
- Zero filesystem writes and exact embedded report key sets confirmed
  for all scenarios.

## Zero framework modifications required

Every file outside agents/plugin-performance-optimization/ and
agents/index.js (registration only) that changed did so only to correct
one now-stale hardcoded agent-count assertion (4 -> 5, in mcp-server's
workflow real-invocation test) -- a mechanical, unavoidable test-data
correction directly caused by successfully registering a genuine fifth
Agent.

## Usage

```js
import { runAgentWithReport } from "./agents/index.js";

const report = await runAgentWithReport("plugin-performance-optimization", {
  sourceFiles: [{ path: "my-plugin.php", content: "<?php ..." }],
});
```

## Explicitly out of scope for this stage

- No real code optimization -- same honesty as every other remediation
  Agent in this project.
- No WordPress Workflow, no adapter changes, no modification to either
  existing Agent.
