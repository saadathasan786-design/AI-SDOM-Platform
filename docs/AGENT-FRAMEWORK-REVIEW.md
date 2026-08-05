# Agent Framework — Final Architecture Review (Stage 5I)

A line-by-line, evidence-based review of the complete Agent Framework
after three real production Agents. No code was changed in this stage --
every finding below was evaluated against "is this a genuine
architectural defect," and none met that bar. This document records the
concrete evidence for each conclusion.

## Method

Every framework file (agent-interface.js, agent-registry.js,
agent-catalog.js, agent-executor.js, agent-report.js, index.js), all
three real Agents, and all three adapters (MCP, CLI, VS Code) were read
in full. Diffs and grep comparisons were run across the three Agents'
decide() functions to find genuine duplication rather than assuming it.

## Findings

### 1. Genuine, verified duplication (concrete evidence)

The generator-step decision block is byte-for-byte identical across all
three real Agents:

```js
if (step.type === "generator") {
  if (!result.success) {
    return { action: "fail", reason: `Remediation generator step failed: ${result.error}` };
  }
  return { action: "stop", reason: "Remediation generator step completed successfully (dry-run)." };
}
```

...and the unrecognized-step-type fallback
(`return { action: "fail", reason: "Unrecognized step type in decide(): ..." };`)
is also identical across all three. This is 6 lines, repeated 3 times --
verified with grep, not assumed.

This is exactly the kind of concrete duplication this project's
promotion discipline exists to catch -- a genuine third repetition with
zero variation. See Promotion Analysis below for the disposition.

### 2. Unused-but-tested framework surface (not a defect)

- The executor's singular "advisor" step type (calling
  runAdvisorWithReport() directly) is fully implemented and was directly
  tested in Stage 5B's own suite, but none of the three real Agents ever
  use it -- all three exclusively use the plural "advisors" type, even
  for single-id cases.
- The "skip" decision action is part of the frozen four-action
  vocabulary, but no real Agent has ever returned it -- all three use
  only continue/stop/fail. Notably, "skip" and "continue" currently
  behave identically at the executor's control-flow level (only
  "stop"/"fail" halt the loop); the only difference is stepsSkipped
  bookkeeping in the report.
- supportedSeverities and configSchema are validated optional fields in
  agent-interface.js that no real Agent declares.

None of these are defects. Each is harmless, already-tested (where
applicable), and part of the frozen Stage 5A/5B design. Three real
examples not exercising a piece of intentionally-general surface is
normal -- it is not evidence the surface is broken, only that it hasn't
yet been needed. Removing any of it now would itself be an unjustified
modification to a frozen stage.

### 3. Minor, harmless inconsistency (not a defect)

The Architecture Remediation Agent (Stage 5C) writes
result.advisorsFailed.join(", ") (no optional chaining), while the
Security and Performance Agents (Stages 5G/5H) both write
result.advisorsFailed?.join(", ") (with optional chaining) -- the
defensive style crept in across later stages. Verified not to be a live
bug: runAdvisors()'s Unified Advisor Report contract unconditionally
includes advisorsFailed as an array (empty or populated) whenever
success can be false, so the field is never actually undefined in this
branch for any of the three agents. This is a stylistic drift, not a
functional inconsistency, and is noted here rather than silently
corrected, per this stage's "no changes unless a genuine defect" scope.

### 4. Naming consistency -- confirmed consistent with precedent

Each adapter type uses its own idiomatic naming convention for the same
underlying capability (agent_list / agent.listAgents / bare list) --
verified to be the exact same pattern already established by the
Advisor adapters (advisor_list / advisor.listAdvisors / bare list), not
a new inconsistency introduced for Agents.

### 5. Dependency direction -- clean, verified

- grep-confirmed: zero imports from agents/ anywhere in advisors/ or
  generators/ -- the dependency direction is strictly one-way (Agents
  depend on Advisors/Generators, never the reverse).
- agents/ imports only from advisors/index.js and generators/index.js
  (public entry points), never internal framework files of either.
- All three adapters (MCP, CLI, VS Code) import only from
  agents/index.js -- zero direct reaches into agents/framework/* from
  any adapter, confirmed by grep.

### 6. Error handling consistency -- confirmed consistent

All three adapters distinguish "genuinely unknown agent" from "known
agent, missing dependencies" using the exact same signal (result.error
truthiness for checkCompatibility, report.success for run) -- verified
directly in each adapter's source.

### 7. Report consistency -- confirmed

Every adapter (MCP, CLI, VS Code) returns/renders the Agent Report's
embedded Advisor/Generator sub-reports unchanged -- verified across all
three adapters' existing test suites (dedicated "framework delegation"
and "unchanged embedded reports" tests already exist in each, from
Stages 5D/5E/5F).

### 8. Registration patterns -- confirmed consistent

All three real Agents' metadata objects use identical field order and
naming (id, name, version, description, category, inputRequirements,
requiresAdvisors, requiresGenerators, capabilities, plan, decide) --
verified by direct comparison.

## Promotion Analysis

One promotion candidate is supported by concrete evidence: extracting
the 6-line generator-step decision block (see Finding 1) into a small,
shared helper (e.g., decideGeneratorStep(result) in a new, optional
agents/framework/decision-helpers.js). This is the strongest kind of
evidence this project's promotion discipline looks for -- verified,
byte-for-byte duplication across three independent, real consumers, with
no sign the pattern needs to vary per Agent (a generator step's outcome
is a domain-agnostic binary: success -> stop, failure -> fail).

This promotion is NOT implemented in this stage. Three reasons:

1. This is explicitly an architecture-review stage, not a feature stage;
   the instruction is to add nothing "unless the review uncovers a
   genuine architectural defect requiring correction." Duplication of
   six working, correct, well-tested lines is not a defect -- nothing is
   broken, incorrect, or unsafe.
2. Stages 1-5H, including all three real Agents' source files, are
   explicitly frozen for this review. Editing them -- even for a
   well-evidenced DRY cleanup -- would itself be a modification outside
   this stage's stated scope.
3. The verification section of this stage asks only to confirm the
   existing suite passes unchanged, consistent with a review producing
   no code changes.

Conclusion: this is a well-evidenced candidate for a future, explicitly
-scoped refactor stage, not an action item for this one. No other
promotion is justified -- the decision POLICY logic (the actual
threshold each Agent uses) was already evaluated in Stage 5H and found
to be irreducibly different across all three Agents; nothing in this
review's deeper line-by-line pass changed that conclusion.

## No framework modifications were made in this stage

Confirmed by running the complete regression suite unchanged (see the
Stage 5I completion report) -- 954 tests, zero failures, zero code
touched outside this documentation file.
