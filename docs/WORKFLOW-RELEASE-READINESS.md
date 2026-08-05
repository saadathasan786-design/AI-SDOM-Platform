# Release Readiness Workflow — Second Real WordPress Workflow

Located at `workflows/release-readiness/`. The second real WordPress
Workflow, validating that the Workflow Framework cleanly supports a
second, genuinely different orchestration policy for the exact same
three Agents the Plugin Health Audit Workflow (Stage 7G) already uses.

## Sequence — identical to Plugin Health Audit, by design

```
Plugin Security Remediation Agent -> Plugin Performance Optimization Agent -> Architecture Remediation Agent
```

Reusing the exact same sequence deliberately isolates the decision
policy as the only variable, making the genuine-difference comparison
with Plugin Health Audit unambiguous.

## Decision policy — genuinely different from Plugin Health Audit's uniform rule

```
Step 1 (Security):      success:false -> fail | otherwise -> continue
Step 2 (Performance):    success:false -> fail | otherwise -> continue
Step 3 (Architecture):   ALWAYS -> stop, regardless of success or failure
```

This mirrors the exact same distinction Stage 6C's Project Health Check
Workflow and Stage 6D's Security Audit Workflow already established for
the generic Agents. Verified directly: calling decide() on the final
step with a synthetic FAILED report still returns stop, never fail --
confirmed by a dedicated test.

## Manual validation performed before the formal suite existed

- Secure plugin -- all three agents ran in order, workflow stopped
  cleanly after the final agent.
- Vulnerable plugin -- confirmed real critical/warning findings in the
  Security and Performance Agents, each independently escalating to
  their own dry-run Generator steps; workflow still completed
  successfully and stopped (agent-level success remained true even
  though real findings were escalated internally).
- Mixed plugin -- confirmed the workflow completes successfully.
- Every decide() branch -- verified directly: fail on step 1, fail on
  step 2, and -- critically -- always stop on step 3 even when given a
  synthetic failed report.
- Embedded Agent/Advisor/Generation Reports confirmed to match their
  exact real key sets, unmodified.
- Zero filesystem writes confirmed across all three agents' dry-run
  output directories.

## Scope

- plan() steps use exactly { agentId, context } -- no other shape.
- No retries, no re-planning, no branching beyond the final-step rule.

## Known limitations

Same as Plugin Health Audit: the generic Architecture Remediation
Agent's checks are JS/import-graph-oriented and may correctly find
nothing when run against PHP source -- an honest, expected interaction,
not a defect.

## Future extension points

MCP/CLI/VS Code adapters already expose this Workflow automatically with
zero further changes, confirmed by their existing catalog-based
discovery.

## Zero framework modifications required

Every file outside workflows/release-readiness/ and workflows/index.js
(registration only) is unchanged. Full project regression (1418 tests
across every subsystem) passes with zero failures.

## Usage

```js
import { runWorkflowWithReport } from "./workflows/index.js";

const report = await runWorkflowWithReport("release-readiness", {
  sourceFiles: [{ path: "my-plugin.php", content: "<?php ..." }],
});
```
