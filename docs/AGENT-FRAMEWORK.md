# Agent Framework — Stage 5B (Foundation)

Located at `agents/`. A completely independent top-level subsystem, built
exactly to the frozen Stage 5A design. Foundation only -- no real Agent is
implemented or registered here, matching the exact discipline Stage 4B
followed for the Advisor Framework's own foundation stage.

## What's here

- agents/framework/agent-interface.js -- validation (required metadata,
  plan()/decide() must be functions, inputRequirements array, optional
  capabilities/requiresAdvisors/requiresGenerators/supportedSeverities/
  configSchema, plus validateDecision() checking a decision's action is
  one of continue/skip/stop/fail).
- agents/framework/agent-registry.js -- independent Map-backed registry,
  same pattern as generator-registry.js/advisor-registry.js, sharing no
  code with either (per Stage 5A's explicit "don't prematurely abstract"
  instruction).
- agents/framework/agent-executor.js -- the raw executor (runAgent, can
  throw phase-tagged errors: "planning" or "execution"). Delegates every
  actual unit of work to existing, unmodified functions: runAdvisors(),
  runAdvisorWithReport() (from advisors/index.js), and
  runGeneratorWithReport() (from generators/index.js). Contains zero
  analysis, zero generation, zero filesystem access, zero Knowledge
  Graph/Memory/MCP code.
- agents/framework/agent-report.js -- the never-throws wrapper
  (runAgentWithReport), producing the Unified Agent Report exactly as
  designed in Stage 5A: agent, success, plan, steps, halted, summary,
  recommendations, errors, execution_ms, timestamp. Every embedded
  Advisor/Generator report is the real, complete, unmodified object --
  verified by a dedicated test asserting the embedded report's key set
  matches exactly.
- agents/framework/agent-catalog.js -- listAgentCatalog,
  getAgentMetadata, isAvailable, and checkCompatibility (the one
  genuinely new facet Stage 5A identified: validating an agent's declared
  requiresAdvisors/requiresGenerators against the REAL, live
  Advisor/Generator Catalogs via their existing isAvailable() exports --
  a read-only cross-subsystem query, never a mutation).
- agents/index.js -- the public entry point, re-exporting all ten
  required functions, registerAgent included from day one (avoiding the
  gap Stage 3M identified in generators/index.js).

## Zero modifications to any prior stage

generators/, advisors/, mcp-server/, cli/, and vscode-advisor-extension/
were not touched. Full regression confirmed: Generator Framework
288/288, Advisor Framework 278/278, MCP 42/42, CLI 51/51, VS Code
extension 36/36 -- all unchanged. agents/ only ever READS from
advisors/index.js and generators/index.js (via their existing, public,
unmodified functions), the same read-only integration pattern already
proven three times over by the MCP/CLI/VS Code adapters.

## Error model (exactly as designed in Stage 5A)

| Phase | Cause | Surfaces as |
|---|---|---|
| planning | agent.plan() throws, or returns something without a steps array | errors: [{ phase: "planning", ... }], success: false, no steps executed |
| execution | A plan step references an unknown step type, or agent.decide() throws/returns an invalid action | errors: [{ phase: "execution", stepIndex: N, ... }], execution halts at that step |
| (embedded, not thrown) | An Advisor/Generator step itself fails | Visible in that step's own embedded, unmodified report (result.success === false) -- the Agent's decide() is responsible for noticing this and choosing an action; the executor never reinterprets it |
| unexpected | Unknown agent id, missing required input, or anything else | errors: [{ phase: "unexpected", ... }] |

runAgentWithReport() never throws under any of these -- verified by a
dedicated failure-isolation test running a broken and a working agent in
parallel.

## Usage

```js
import { registerAgent, runAgentWithReport, checkCompatibility } from "./agents/index.js";

registerAgent({
  id: "example-agent",
  name: "Example Agent",
  version: "1.0.0",
  description: "...",
  inputRequirements: ["sourceFiles"],
  requiresAdvisors: ["security"],
  plan: async (input) => ({
    steps: [{ type: "advisors", ids: ["security"], context: { sourceFiles: input.sourceFiles } }],
  }),
  decide: async (step, result) => {
    if (result.summary.critical > 0) return { action: "stop", reason: "Critical findings found." };
    return { action: "continue" };
  },
});

checkCompatibility("example-agent"); // { compatible: true, missingAdvisors: [], missingGenerators: [], error: null }

const report = await runAgentWithReport("example-agent", {
  sourceFiles: [{ path: "x.js", content: "eval(x);" }],
});
// report.success, report.steps[0].result (the real, unmodified Unified Advisor Report), report.recommendations
```

## Deliberately NOT built in this stage

- Any real Agent implementation, per instruction.
- runAgents() (plural, multi-agent) -- Stage 5A explicitly deferred this
  until a real multi-agent need is demonstrated, mirroring the same
  Stage 4B to 4I precedent for Advisors.
- Agent-of-agent composition -- explicitly declined for now in Stage 5A,
  pending real evidence.
- MCP/CLI/VS Code integration for Agents -- a natural next stage once
  this foundation is itself proven, mirroring Stage 4B to 4J/4K/4L's
  progression.

## Stage 14B: shared registry/catalog core

`agent-registry.js`'s `register`/`get`/`has` and `agent-catalog.js`'s
`isAvailable()` now delegate to `framework-shared/registry-core.js` and
`framework-shared/catalog-core.js` respectively — the confirmed
byte-identical core shared with the Advisor and Workflow Frameworks. See
`docs/REGISTRY-CORE.md` and `docs/CATALOG-CORE.md` for the full promotion
rationale. `agent-catalog.js`'s own `checkCompatibility()` (checking both
Advisor and Generator dependency availability) was not touched by this
promotion — it remains genuinely different from Workflow's own
`checkCompatibility()`, which checks only Agent dependencies, reflecting
each subsystem's real dependency graph.

## Stage 12B: shared generator-step decision utility

Every Agent whose plan ends in a generator step now calls the shared
`decideGeneratorStep()` helper (`agents/framework/generator-step-decision.js`)
rather than each Agent's own inline fail/stop logic. See
`docs/GENERATOR-STEP-DECISION.md` for the full promotion rationale. Each
Agent's own advisor-step decision logic — which genuinely differs
agent-to-agent — was not touched by this promotion.
