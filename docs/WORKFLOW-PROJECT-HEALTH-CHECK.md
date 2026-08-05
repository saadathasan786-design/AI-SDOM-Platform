# Project Health Check Workflow — First Real Workflow

Located at `workflows/project-health-check/`. The first real Workflow,
validating the Workflow Framework (Stage 6B) with a genuine four-layer
orchestration chain.

## Sequence

```
Architecture Remediation Agent -> Security Remediation Agent -> Performance Optimization Agent
```

Each agent receives the identical { sourceFiles } context. The sequence
is fixed, plain data, all three steps present in plan() from the start.

## Decision policy — exactly the specified minimum, no invented semantics

```
if agentReport.success === false    -> fail (halt immediately)
otherwise                            -> continue
after the final agent (performance)  -> stop
```

decide() reads only agentReport.success and, for a clearer failure
message only, agentReport.errors[0].message -- both top-level Agent
Report fields, never an embedded Advisor finding or Generator output. No
richer policy was introduced: each Agent already encapsulates its own
judgment about whether its Advisor/Generator findings mattered enough to
act on -- that judgment IS what agentReport.success already represents.
Re-deriving anything from summary.stepsFailed would only restate success
in a different form, not add real information, so nothing beyond the
specified minimum was added.

## Manual validation performed before the formal suite existed

- Planning -- confirmed the plan produces exactly three steps, in the
  fixed sequence, each threading sourceFiles through unchanged, and
  confirmed the plan is fully JSON-serializable.
- Execution and decision flow -- ran the real workflow against clean
  code (all three agents succeed, workflow stops cleanly after step 3)
  and against code with real findings in all three domains
  simultaneously (a real layer violation, a real eval() call, and a real
  json-operation-in-loop warning) -- confirmed all three real Agents ran
  to completion, each internally invoking its own real Advisors and
  dry-run Generator, with the workflow correctly stopping after the
  final agent.
- Stop behavior -- confirmed via decide() called directly with a
  synthetic failed Agent Report, producing the correct fail action.
- Embedded Agent Reports unchanged -- confirmed the Agent Report's key
  set matches exactly (agent, success, plan, steps, halted, summary,
  recommendations, errors, execution_ms, timestamp), and one level
  deeper, the embedded Advisor Report's key set also matches exactly.
- No Advisor/Generator called directly -- confirmed by grepping the
  workflow's own source file for runAdvisor/runGenerator/runAgent( --
  zero matches.
- Zero real filesystem writes -- confirmed none of the three agents'
  dry-run output directories were ever created on disk.

## Real, verified four-layer chain

```
Workflow (project-health-check)
  -> Architecture Remediation Agent -> Architecture Advisor -> Theme Generator (dry-run)
  -> Security Remediation Agent     -> Security + Code Review Advisors -> Plugin Generator (dry-run)
  -> Performance Optimization Agent -> Performance Advisor -> Theme Generator (dry-run)
```

Verified end-to-end with a single real source-file set producing genuine
findings at every layer simultaneously -- the strongest possible
evidence this chain works correctly, not merely that each layer works in
isolation.

## Zero framework modifications required

Every file outside workflows/project-health-check/, workflows/index.js
(registration only), and this doc is completely unchanged. Full project
regression (1033 tests across every subsystem) passes with zero
failures.

## Usage

```js
import { runWorkflowWithReport } from "./workflows/index.js";

const report = await runWorkflowWithReport("project-health-check", {
  sourceFiles: [{ path: "x.js", content: "..." }],
});

report.steps[0].agentReport; // real, unmodified Architecture Remediation Agent Report
report.steps[1].agentReport; // real, unmodified Security Remediation Agent Report
report.steps[2].agentReport; // real, unmodified Performance Optimization Agent Report
report.halted;                // the decision that stopped execution
```

## Explicitly out of scope for this stage

- Any real code remediation -- inherited honestly from all three Agents.
- MCP/CLI/VS Code adapters for Workflows -- a natural next stage now that
  this foundation has a real, working Workflow to expose.
- Any second real Workflow, retries, resume, or workflow composition --
  none introduced, per instruction.
