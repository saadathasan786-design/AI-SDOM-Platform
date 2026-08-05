# Workflow Framework — Final Architecture Review (Stage 6G)

A line-by-line, evidence-based review of the complete Workflow ecosystem
after two real Workflows and three adapters. No code was changed in this
stage -- every finding below was evaluated against "is this a genuine
architectural defect," and none met that bar. This document records the
concrete evidence for each conclusion.

## Method

Every framework file, both real Workflows, and all three adapters were
read in full. grep and diff comparisons (with entity names normalized,
e.g. "Workflow"->"X", "Agent"->"X") were run directly against the
Generator/Advisor/Agent equivalents to quantify duplication rather than
assume it.

## 1. Architecture Review — strict layering, confirmed by direct inspection

- workflows/framework/workflow-executor.js imports exactly one function
  from a lower layer: runAgentWithReport from agents/index.js. grep
  confirms runAgent, runAdvisors, runAdvisorWithReport, and
  runGeneratorWithReport are never imported or called anywhere in the
  file.
- Neither real Workflow (project-health-check, security-audit) imports
  from advisors/ or generators/, or calls any Advisor/Generator function
  directly -- confirmed by grep, zero matches.
- All three adapters (MCP, CLI, VS Code) import THE EXACT SAME three
  functions, in the exact same order, exclusively from
  workflows/index.js -- confirmed by direct inspection of each adapter's
  import statement. Zero adapter reaches into workflows/framework/
  directly.
- grep confirms zero imports from workflows/ anywhere in agents/,
  advisors/, or generators/ -- the dependency direction is strictly
  one-way: Workflow -> Agent -> Advisor/Generator, exactly as designed.

## 2. Framework Consistency Review — quantified duplication

Registry: near-total literal duplication, confirmed by diff. After
normalizing "Workflow"->"X" in workflow-registry.js and "Agent"->"X" in
agent-registry.js, a direct diff shows EVERY LINE OF ACTUAL CODE IS
BYTE-FOR-BYTE IDENTICAL -- the only differences are in comments. This is
the fourth confirmed instance of this exact pattern (Generator, Advisor,
Agent, now Workflow), each previously identified as near-identical in
Stages 5A/5I/6A.

Catalog: same pattern, genuinely different arity. A normalized diff
shows the catalog's structure matches closely, but with one real,
non-superficial difference: the Agent Catalog's checkCompatibility()
checks TWO dependency types (requiresAdvisors against the Advisor
Catalog, requiresGenerators against the Generator Catalog), while the
Workflow Catalog's checks ONE (requiredAgents against the Agent
Catalog). This is a genuine structural difference reflecting each
layer's real dependency shape, not incidental drift.

Executor: a real, evidence-based simplification, not duplication. grep
confirms the Agent Executor's executeStep() branches on three step
types (advisors/advisor/generator); the Workflow Executor's
executeStep() has NO branching at all, since a Workflow step has exactly
one shape (invoke an Agent). This was designed this way (Stage 6A/6B)
and confirmed correct by inspection -- not a missing feature.

Report wrapper: a genuine, deliberate field-set difference. The Agent
Report's summary includes stepsSkipped (since the Agent Framework's
decision vocabulary includes "skip"); the Workflow Report's summary has
no such field, because the Workflow Framework's vocabulary is
deliberately three actions only (continue/stop/fail, per Stage 6B's
explicit instruction). Confirmed by direct inspection -- not an
oversight.

Unused-but-intentional surface (not a defect): neither real Workflow
declares the optional configuration field -- confirmed by grep, zero
matches in either workflow file. This mirrors the exact same pattern
Stage 5I found for Agents (supportedSeverities/configSchema declared but
unused) -- intentional generality from the frozen interface design, not
dead code, since it costs nothing and remains validated defensively when
present.

Duplication between the two real Workflows' decide() functions: direct
comparison shows the failure-handling block (extracting
agentReport.errors?.[0]?.message, building the "fail" action) and the
"continue" action's reason string are LITERALLY IDENTICAL between
project-health-check and security-audit (~8-10 lines total). However,
the genuinely different part -- the order in which checks run, and the
security-audit's unconditional "always stop at the final step" rule --
is real, irreducible domain policy, confirmed by direct comparison, not
superficial variation. This exactly mirrors the finding pattern Stage
5I established for the three Agents: trivial boilerplate repeats;
genuine decision policy does not.

## 3. API Review

workflows/index.js exports the identical shape to agents/index.js
(registerX, getX, listXs, hasX, runX, runXWithReport, listXCatalog,
getXMetadata, isAvailable, checkCompatibility) -- confirmed by direct
side-by-side inspection of all four index.js files. registerWorkflow is
exported from day one, avoiding the exact gap Stage 3M identified in
generators/index.js (which still lacks registerGenerator) -- a gap
Advisor, Agent, and now Workflow have all correctly avoided repeating.
Nothing unnecessary is exported; nothing is missing relative to the
Agent Framework's own parity bar.

## 4. Dependency Review

Confirmed above (Architecture Review) via direct grep: strictly
one-directional (Workflow -> Agent -> Advisor/Generator), zero reverse
imports, zero framework-internal leakage into any adapter.

## 5. Error Model Review

The "Unknown X:" error-message format is character-for-character
identical in structure across all four registries (verified by direct
grep of all four files side by side) -- only the entity noun changes
(generator/advisor/agent/workflow). All three Workflow adapters use the
identical result.error truthiness check to distinguish "genuinely
unknown workflow" from "known workflow, missing agent dependencies" --
the same convention already established for Agents, confirmed present
in each adapter's own source. runWorkflowWithReport() and
checkCompatibility() both maintain the never-throws contract, already
verified by each adapter's own real-invocation/spawned-process tests
(MCP, CLI, VS Code) passing without exception.

## 6. Adapter Review

Re-confirmed (not merely assumed from prior stages): each adapter's
source contains no .findings/.summary.critical pattern-matching,
threshold logic, or file-writing code -- verified directly for all
three. Organization matches the Advisor/Agent adapters exactly: MCP as a
single *-tools.js file wired into the shared server; CLI as a single
*-cli.js file with the same parseArgs/loadContextFile/classify*/format*/
main shape; VS Code as extension.js (wiring only, confirmed under 20
non-comment lines by a dedicated test) plus
src/commands.js/context-loader.js/report-viewer.js.

## 7. Registry/Catalog Review — the central question of this stage

Direct, quantified evidence (section 2 above) confirms: FOUR
INDEPENDENT REGISTRIES now exist with byte-for-byte-identical code
(after entity-name normalization). This is the strongest form of
evidence this project's promotion discipline looks for, and it was
already identified -- with the same conclusion -- in Stage 6A. This
review reconfirms that conclusion with fresh, direct evidence rather
than assuming Stage 6A's finding still holds.

Recommendation: promotion remains justified in principle, but is
explicitly NOT implemented in this review-only stage, for the same
three reasons Stage 6A gave and that remain valid: (1) this is a review
stage, not a feature stage -- the instruction is zero code changes
absent a genuine defect, and duplicated-but-correct code is not a
defect; (2) all four registries are frozen, working, fully-tested
production code -- refactoring them is optimization, not correction;
(3) the actual refactor deserves its own explicitly-scoped stage with
the full ~1138-test regression suite as its acceptance bar, not a side
effect of a review.

## 8. Technical Debt Review

Genuine, quantified duplication (concrete, worth tracking): the
registry pattern (4 instances, code-identical) and the small
failure/continue-handling blocks duplicated between the two real
Workflows' decide() functions (~8-10 lines).

Intentional generality (not debt): the Workflow interface's unused
configuration field; the catalog's structurally-necessary
one-vs-two-dependency-type difference; the executor's no-branching
executeStep() (a correct simplification, not a gap).

## 9. Promotion Analysis

Per section 7: a registry-factory promotion is justified by concrete
evidence but explicitly declined for this stage, tracked as a
well-evidenced candidate for a future, dedicated refactor stage. No
other promotion (catalog helper, executor helper, report helper) is
justified: each of those three has at least one genuine, evidence-based
structural difference across its instances (catalog's dependency-type
arity, executor's step-branching, report's field set reflecting a
different action vocabulary) that a shared helper would either need to
parameterize away (losing clarity) or fail to unify meaningfully.

## 10. Production Readiness Assessment

The Workflow Framework, both real Workflows, and all three adapters are
assessed as production-ready: 1138 passing tests across the entire
project, zero known defects, verified strict layering, consistent
naming and error handling, clean dependency directions, zero framework
leakage in any direction, and adapter parity across MCP, CLI, and VS
Code -- each independently exercising the complete real four-layer chain
successfully.

## 11. Regression

Confirmed: 1138 tests, zero failures, zero code touched outside this
documentation file (one previously-observed transient spawned-process
timing flake in mcp-server was re-run and confirmed clean, consistent
with the same class of flake noted in Stage 6F).
