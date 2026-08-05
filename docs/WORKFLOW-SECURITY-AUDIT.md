# Security Audit Workflow — Second Real Workflow

Located at `workflows/security-audit/`. The second real Workflow,
validating that the Workflow Framework (Stage 6B) generalizes across a
genuinely different orchestration order and decision sequence than the
Project Health Check Workflow.

## Sequence — security-first, the opposite lead-agent from Project Health Check

```
Security Remediation Agent -> Architecture Remediation Agent -> Performance Optimization Agent
```

## Decision policy — genuinely different from Project Health Check's uniform rule

```
Step 1 (Security):      success:false -> fail | otherwise -> continue
Step 2 (Architecture):   success:false -> fail | otherwise -> continue
Step 3 (Performance):    ALWAYS -> stop, regardless of success or failure
```

This is a real, specified difference in decision semantics, not copied
from Project Health Check: Project Health Check's final step still
returns fail if that last agent fails; this workflow's final step
ALWAYS stops, even on failure. Verified directly by a dedicated test
confirming the final step returns stop (never fail) even when given a
synthetic failed Agent Report. decide() reads only
agentReport.success/agentReport.errors -- never an embedded Advisor
finding or Generator output, verified by a test proving identical
decisions whether embedded steps data is present or absent.

## Manual validation performed before the formal suite existed

- Planning -- confirmed the plan produces the correct security-first
  three-step sequence, threading sourceFiles through unchanged, fully
  JSON-serializable.
- Execution and decision flow, fail behavior, stop behavior -- ran the
  real workflow against clean code (all three succeed, stops after step
  3) and against real findings across all three domains simultaneously,
  confirmed the correct security-first execution order; separately
  verified all three decide() branches directly (fail on step 1, fail on
  step 2, and -- critically -- always stop on step 3 even when given a
  failed report).
- Embedded Agent Reports unchanged -- confirmed the Agent Report's key
  set matches exactly, and one level deeper, the embedded Advisor
  Report's key set also matches exactly.
- No Advisor/Generator called directly -- confirmed by grepping the
  workflow's own source file -- zero matches.
- Zero real filesystem writes -- confirmed across all three agents'
  dry-run output directories.

## Real, verified four-layer chain (security-first order)

```
Workflow (security-audit)
  -> Security Remediation Agent     -> Security + Code Review Advisors -> Plugin Generator (dry-run)
  -> Architecture Remediation Agent -> Architecture Advisor -> Theme Generator (dry-run)
  -> Performance Optimization Agent -> Performance Advisor -> Theme Generator (dry-run)
```

Verified end-to-end with the same real, multi-domain source-file set
used for Project Health Check's own verification, confirming the two
workflows correctly produce different step orders from identical input
when run in parallel.

## Zero framework modifications required

Every file outside workflows/security-audit/, workflows/index.js
(registration only), and this doc is completely unchanged. Full project
regression (1060 tests across every subsystem) passes with zero
failures.

## Usage

```js
import { runWorkflowWithReport } from "./workflows/index.js";

const report = await runWorkflowWithReport("security-audit", {
  sourceFiles: [{ path: "x.js", content: "..." }],
});

report.steps[0].agentReport; // real, unmodified Security Remediation Agent Report
report.steps[1].agentReport; // real, unmodified Architecture Remediation Agent Report
report.steps[2].agentReport; // real, unmodified Performance Optimization Agent Report (always the halt point)
```
