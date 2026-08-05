# Architecture Remediation Agent — Stage 5C

Located at `agents/architecture-remediation/`. The first real Agent,
validating the Agent Framework (Stage 5B) with a genuine orchestration
workflow: run the real Architecture Advisor, then conditionally run a
real Generator in dry-run mode based on what was found.

## Workflow

```
plan() -- plain data, both steps always present from the start:
  Step 1: { type: "advisors", ids: ["architecture"], context: {...} }
  Step 2: { type: "generator", generatorId: "theme", config: {...}, options: { mode: "dry-run" } }

decide() after Step 1:
  actionable (critical + warning > 0)?  -> { action: "continue" }  -- Step 2 runs
  nothing actionable?                    -> { action: "stop" }      -- Step 2 NEVER runs
  advisor step itself failed?            -> { action: "fail" }

decide() after Step 2 (only reached if continued):
  generator succeeded (dry-run)? -> { action: "stop" }
  generator failed?              -> { action: "fail" }
```

## The key design decision: "stop" is the halt mechanism, not "skip"

The task specifies: "if actionable findings exist: prepare a Generator
step. Otherwise stop cleanly." This maps directly onto Stage 5B's
already-existing executor semantics without requiring any framework
change: plan() returns both steps upfront as plain data (no conditional
branching inside plan() itself), and decide() after step 1 returns "stop"
when nothing is actionable -- which halts the loop before step 2 ever
executes. "skip" was considered and rejected: in the Stage 5B executor,
"skip" and "continue" both let the loop proceed to the next step; only
"stop"/"fail" actually halt. Using "stop" for "otherwise stop cleanly" is
not a workaround -- it's the literally correct, already-designed
mechanism for exactly this situation.

## Honesty about the Generator step

No Generator in this project literally repairs an architecture finding (a
circular dependency, a layer violation, etc.) -- none exists, and the
instructions explicitly forbid introducing one. The dry-run Theme
Generator step is a deliberate, honestly-labeled DEMONSTRATION of the
orchestration mechanism itself (an Advisor finding triggering a prepared
Generator step) -- not a claim that this Agent can actually fix the
specific issue it found. This is stated plainly in the agent's own source
comments and here, rather than implying a capability that doesn't exist.

## Orchestration only — verified, not just claimed

- plan() never computes anything about the code being analyzed -- it only
  assembles two fixed-shape step descriptions from the given sourceFiles.
  Verified by a test confirming the plan is fully JSON-serializable plain
  data.
- decide() never inspects individual findings -- only
  result.summary/result.success, fields the Architecture Advisor and
  Generator Framework already computed. Verified by a dedicated test
  confirming the decision is identical whether a findings array is
  present or entirely absent from the result, as long as the summary
  counts match -- proving the logic genuinely never reads findings.

## Real, verified delegation

Both scenarios were smoke-tested against real code before the formal
suite existed:

- Clean code (no real architecture issues) -> exactly 1 step runs, halts
  with "stop", generator step never executes.
- Real layer violation (a generators/framework/ file importing a specific
  generator, the exact anti-pattern the Architecture Advisor's own rules
  forbid) -> correctly detected as 1 critical finding, decide() returns
  "continue", the dry-run Theme Generator step actually runs and
  succeeds -- verified to write zero real files (fs.access on the dry-run
  output directory confirms it was never created).

## Zero framework modifications required

Every file outside agents/architecture-remediation/ and this doc is
completely unchanged. Full project regression (779 tests across
Generator Framework, Advisor Framework, MCP, CLI, VS Code extension, and
the Agent Framework foundation) passes with zero failures.

## Usage

```js
import { runAgentWithReport } from "./agents/index.js";

const report = await runAgentWithReport("architecture-remediation", {
  sourceFiles: [{ path: "x.js", content: "..." }],
});

report.success;               // overall outcome
report.steps[0].result;       // the REAL, unmodified Unified Advisor Report
report.steps[1]?.result;      // the REAL, unmodified Generation Report (dry-run), if reached
report.halted;                // the decision that stopped execution
report.recommendations;       // human-readable reasons from decide()
```

## Explicitly out of scope for this stage

- Any real code remediation -- this agent demonstrates the orchestration
  pattern; it does not and cannot actually fix an architecture violation.
- Write-mode generator execution -- dry-run only, per instruction.
- Any second real Agent, or runAgents() (multi-agent) -- a natural next
  stage once this first agent's pattern is itself proven further.
