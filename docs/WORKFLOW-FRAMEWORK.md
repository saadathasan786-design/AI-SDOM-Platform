# Workflow Framework — Stage 6B (Foundation)

Located at `workflows/`. A completely independent top-level subsystem,
built exactly to the frozen Stage 6A design. Foundation only -- no real
Workflow is implemented or registered here, matching the exact
discipline Stage 5B followed for the Agent Framework's own foundation
stage.

## What's here

- workflows/framework/workflow-interface.js -- validation (required
  metadata, plan()/decide() must be functions, inputRequirements array,
  optional capabilities/requiredAgents/configuration). The decision
  vocabulary is deliberately THREE actions (continue/stop/fail) -- no
  "skip", per this stage's explicit instruction, evidence-backed by
  Stage 5I's review confirming no real Agent ever used "skip" either.
- workflows/framework/workflow-registry.js -- independent Map-backed
  registry, same pattern as generator/advisor/agent-registry.js, sharing
  no code with any of them. The registry-factory promotion Stage 6A
  identified (with concrete evidence: this is a byte-for-byte-similar
  fourth instance) is explicitly deferred to a future dedicated refactor
  stage, per this stage's instruction not to extract a shared factory
  now.
- workflows/framework/workflow-executor.js -- the raw executor
  (runWorkflow, can throw phase-tagged errors: "planning" or
  "execution"). Its ONLY external call is runAgentWithReport() -- it
  never calls runAgent(), runAdvisors(), runAdvisorWithReport(), or
  runGeneratorWithReport(), which would bypass the Agent layer entirely.
  A Workflow's plan step has exactly one shape -- { agentId, context }
  -- so, unlike the Agent Executor, there is no step-type branching.
- workflows/framework/workflow-report.js -- the never-throws wrapper
  (runWorkflowWithReport), producing the Workflow Report exactly as
  designed in Stage 6A: workflow, success, plan, steps, halted, summary,
  recommendations, errors, execution_ms, timestamp. Every embedded Agent
  Report is the real, complete, unmodified object -- verified by a
  dedicated test asserting the embedded report's key set matches
  exactly, three levels deep (Workflow -> Agent -> Advisor/Generator).
- workflows/framework/workflow-catalog.js -- listWorkflowCatalog,
  getWorkflowMetadata, isAvailable, and checkCompatibility (validating a
  workflow's declared requiredAgents against the REAL, live Agent
  Catalog via its existing isAvailable() export -- the same pattern the
  Agent Catalog already established one layer down, not a new facet).
- workflows/index.js -- the public entry point, re-exporting all ten
  required functions, registerWorkflow included from day one.

## Zero modifications to any prior stage

agents/, advisors/, generators/, mcp-server/, cli/, and both VS Code
extensions were not touched. Full regression confirmed: 1010 tests
across every subsystem -- all unchanged, plus 56 new for this stage.
workflows/ only ever READS from agents/index.js (via its existing,
public, unmodified functions), the same read-only integration pattern
already proven at every prior layer.

## Error model (exactly as designed in Stage 6A)

| Phase | Cause | Surfaces as |
|---|---|---|
| planning | workflow.plan() throws, or returns something without a steps array | errors: [{ phase: "planning", ... }], success: false, no steps executed |
| execution | workflow.decide() throws or returns an invalid action | errors: [{ phase: "execution", stepIndex: N, ... }], execution halts at that step |
| (embedded, not thrown) | An Agent step itself fails | Visible in that step's own embedded, unmodified Agent Report (agentReport.success === false) -- the Workflow's decide() is responsible for noticing this and choosing an action; the executor never reinterprets it |
| unexpected | Unknown workflow id, missing required input, or anything else | errors: [{ phase: "unexpected", ... }] |

runWorkflowWithReport() never throws under any of these -- verified by a
dedicated failure-isolation test running a broken and a working workflow
in parallel.

## Real, verified delegation (smoke-tested before the formal suite existed)

A fake workflow chaining two REAL agents (Architecture Remediation +
Security Remediation) was run end-to-end, exercising the full
four-layer stack (Workflow -> Agent -> Advisor/Generator) in one
execution -- confirmed working correctly on the first attempt, including
embedded Agent Reports themselves embedding real, unmodified
Advisor/Generator reports.

## Usage

```js
import { registerWorkflow, runWorkflowWithReport, checkCompatibility } from "./workflows/index.js";

registerWorkflow({
  id: "example-workflow",
  name: "Example Workflow",
  version: "1.0.0",
  description: "...",
  inputRequirements: ["sourceFiles"],
  requiredAgents: ["architecture-remediation", "security-remediation"],
  plan: async (input) => ({
    steps: [
      { agentId: "architecture-remediation", context: { sourceFiles: input.sourceFiles } },
      { agentId: "security-remediation", context: { sourceFiles: input.sourceFiles } },
    ],
  }),
  decide: async (step, agentReport) => {
    if (!agentReport.success) return { action: "fail", reason: "Agent failed." };
    return { action: "continue" };
  },
});

checkCompatibility("example-workflow"); // { compatible: true, missingAgents: [], error: null }

const report = await runWorkflowWithReport("example-workflow", {
  sourceFiles: [{ path: "x.js", content: "eval(x);" }],
});
// report.success, report.steps[0].agentReport (the real, unmodified Agent Report), report.recommendations
```

## Deliberately NOT built in this stage

- Any real Workflow implementation, per instruction.
- Retries, resume, re-planning, workflow composition, batch/multi-workflow
  execution -- all explicitly declined in Stage 6A, none introduced here.
- The registry-factory promotion -- identified with concrete evidence in
  Stage 6A, explicitly deferred to a future dedicated refactor stage.
- MCP/CLI/VS Code integration for Workflows -- a natural next stage once
  this foundation is itself proven with a real Workflow, mirroring
  Stage 5B's own progression toward 5D/5E/5F.

## Stage 14B: shared registry/catalog core

`workflow-registry.js`'s `register`/`get`/`has` and `workflow-catalog.js`'s
`isAvailable()` now delegate to `framework-shared/registry-core.js` and
`framework-shared/catalog-core.js` respectively — the confirmed
byte-identical core shared with the Advisor and Agent Frameworks. See
`docs/REGISTRY-CORE.md` and `docs/CATALOG-CORE.md` for the full promotion
rationale.

## Stage 13B: shared plan-agent-sequence utility

Every Workflow's `plan()` now delegates to the shared
`planAgentSequence()` helper (`workflows/framework/plan-agent-sequence.js`)
rather than each Workflow's own inline agent-sequence mapping. See
`docs/PLAN-AGENT-SEQUENCE.md` for the full promotion rationale. Each
Workflow's own `AGENT_SEQUENCE` constant and `decide()` policy — both of
which genuinely differ workflow-to-workflow — were not touched by this
promotion.
