# Plugin Health Audit Workflow — First Real WordPress Workflow

Located at `workflows/plugin-health-audit/`. The first real WordPress
Workflow, validating that the existing, unmodified Workflow Framework
can orchestrate WordPress-specific Agents alongside an existing generic
Agent.

## Architecture / Sequence

```
Plugin Security Remediation Agent (Stage 7E, WordPress-specific)
  -> Plugin Performance Optimization Agent (Stage 7F, WordPress-specific)
  -> Architecture Remediation Agent (Stage 5C, existing, generic, UNMODIFIED)
```

This deliberately combines two new WordPress Agents with one
pre-existing generic Agent. The Workflow Framework doesn't care whether
an Agent is "WordPress-specific" or "generic" -- it only ever calls
runAgentWithReport(agentId, context), exactly as it always has.

## Decision policy

The exact same uniform policy the Project Health Check Workflow (Stage
6C) already established -- no new semantics:

```
if agentReport.success === false    -> fail (halt immediately)
otherwise                            -> continue
after the final agent (architecture) -> stop
```

decide() reads only agentReport.success/agentReport.errors --
top-level Agent Report fields, never an embedded Advisor finding or
Generator output.

## Workflow order

Security-first, then performance, then architecture (generic) last --
chosen so the two WordPress-specific concerns are audited before the
broader, language-agnostic architectural check.

## Scope

- plan() steps use exactly { agentId, context } -- no other shape,
  matching this stage's explicit requirement.
- No retries, no re-planning, no branching by agent identity.

## Manual validation performed before the formal suite existed

- Secure plugin -- all three agents ran in the correct order, workflow
  stopped cleanly after the final agent.
- Vulnerable plugin (missing nonce/capability checks, N+1 query,
  orderby => rand) -- confirmed Security Agent found real critical
  findings and escalated to its own dry-run Plugin Generator step;
  Performance Agent found real accumulated warnings and escalated
  similarly; Architecture Agent ran last.
- Mixed plugin -- confirmed the workflow completes successfully with a
  mix of clean and flagged code.
- fail branch -- verified directly via a synthetic failed Agent Report.
- Zero filesystem writes confirmed across all three agents' dry-run
  output directories.
- Embedded Agent Report, Advisor Report, and Generation Report confirmed
  to match their exact real key sets, unmodified, three and four layers
  deep.

## Known limitations

- The generic Architecture Remediation Agent's layer-violation checks
  are JS/import-graph-oriented; when run against PHP source, it may
  correctly find nothing to flag -- an honest, expected interaction
  between a language-agnostic Agent and PHP files, not a defect.
- Same honesty caveat as every other remediation Agent/Workflow in this
  project: no Generator here literally fixes a finding; dry-run steps
  demonstrate orchestration only.

## Future extension points

- A second, genuinely different WordPress Workflow (e.g., an
  escalation-style policy mirroring the Security Audit Workflow's
  "always stop at the final step" rule, applied to WordPress Agents).
- MCP/CLI/VS Code adapters already expose this Workflow automatically,
  with zero further changes needed (confirmed by the existing adapters'
  own listWorkflowCatalog()-based discovery).

## Zero framework modifications required

Every file outside workflows/plugin-health-audit/ and
workflows/index.js (registration only) is unchanged. Full project
regression (1385 tests across every subsystem) passes with zero
failures.

## Usage

```js
import { runWorkflowWithReport } from "./workflows/index.js";

const report = await runWorkflowWithReport("plugin-health-audit", {
  sourceFiles: [{ path: "my-plugin.php", content: "<?php ..." }],
});
```
