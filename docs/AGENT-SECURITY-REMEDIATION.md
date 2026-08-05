# Security Remediation Agent — Stage 5G

Located at `agents/security-remediation/`. The second real Agent,
validating whether the Agent Framework (Stage 5B) generalizes beyond the
Architecture Remediation Agent's (Stage 5C) single-gate pattern.

## A genuinely different orchestration pattern

```
Step 1 (narrow scan):      { type: "advisors", ids: ["security"] }
  decide(): critical > 0?  -> continue (escalate)
            otherwise      -> stop cleanly

Step 2 (broad escalation): { type: "advisors", ids: ["security", "code-review"] }
  decide(): critical > 0 (in the COMBINED report)? -> continue (remediate)
            otherwise                                -> stop cleanly

Step 3 (remediation):      { type: "generator", generatorId: "plugin", mode: "dry-run" }
  decide(): success -> stop | failure -> fail
```

Where the Architecture Remediation Agent uses one advisor step feeding
one decision gate, this agent uses two sequential gates: a fast, narrow
single-advisor scan that only escalates -- to a SECOND step running two
advisors together in one runAdvisors() call -- if the first pass found
something critical. This is the first agent to actually exercise a
multi-id "advisors" step; the capability (runAdvisors() accepting
multiple ids) already existed unmodified since Stage 4I/5B, but the
Architecture Remediation Agent never needed more than one id at a time.

Zero new executor capability, no re-planning, no dynamic plan mutation
were needed -- both gates are decided purely via the existing
"stop"/"continue"/"fail" vocabulary Stage 5C already established, applied
twice instead of once, in a plain-data plan with all three steps present
from the start (verified by a dedicated JSON-serializability test).

## A genuinely different Generator

Uses the Plugin Generator ("plugin"), not the Theme Generator ("theme")
the Architecture Remediation Agent uses -- demonstrating the pattern
isn't hardcoded to one specific Generator either. Same honesty caveat as
Stage 5C: no Generator in this project literally repairs a security
finding; the dry-run Plugin Generator step demonstrates the orchestration
mechanism, not a real fix.

## Evidence discipline: decide() reads only summaries

Both gates read exclusively result.summary.critical/result.success --
never result.findings. A dedicated test proves this directly: the
decision is identical whether a findings array is present in the result
or entirely absent, as long as the summary counts match.

## Real, verified delegation

Smoke-tested against real code before the formal suite existed:

- Clean code -> exactly 1 step runs (narrow scan only), halts with
  "stop", reason: "No critical security findings on the initial scan;
  nothing urgent to escalate."
- A real eval() call (a genuine critical finding the Security Advisor
  already documents) -> escalates through ALL THREE steps: narrow scan
  (1 advisor) -> broad check (2 advisors, confirmed via advisorCount: 2)
  -> dry-run Plugin Generator (confirmed generator: "plugin",
  mode: "dry-run", zero real files created on disk).

A dedicated test also confirms the two gates' decisions are genuinely
independent -- the broad escalation step's reason text differs from the
narrow scan's, evidence its decision is derived from its OWN result, not
copied through from step 1.

## Zero framework modifications required

Every file outside agents/security-remediation/, agents/index.js
(registration only), and this doc is completely unchanged. Full project
regression (925 tests across every subsystem) passes with zero failures.

## Usage

```js
import { runAgentWithReport } from "./agents/index.js";

const report = await runAgentWithReport("security-remediation", {
  sourceFiles: [{ path: "x.js", content: "eval(x);" }],
});

report.steps[0].result;  // narrow scan: real Unified Advisor Report (1 advisor)
report.steps[1]?.result; // broad escalation: real Unified Advisor Report (2 advisors), if reached
report.steps[2]?.result; // remediation: real Generation Report (dry-run), if reached
```

## Explicitly out of scope for this stage

- Any real code remediation -- same honesty as Stage 5C.
- Write-mode generator execution -- dry-run only.
- Agent-of-agent composition, multi-agent execution, re-planning,
  dynamic plan mutation -- none introduced, per instruction.
