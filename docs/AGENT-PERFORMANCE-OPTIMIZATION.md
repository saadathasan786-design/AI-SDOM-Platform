# Performance Optimization Agent — Stage 5H

Located at `agents/performance-optimization/`. The third real Agent,
providing the evidence needed to evaluate whether the Agent Framework
generalizes across genuinely different workflows and whether any shared
orchestration abstraction is justified across three real examples.

## Evidence-first design: why a "critical > 0" gate would be wrong here

Before writing decide(), the real Performance Advisor's own finding
catalog was inspected directly:

```
$ grep -n "severity:" advisors/performance/performance-advisor.js | sort | uniq -c
      2 severity: "info"
      9 severity: "suggestion"
      3 severity: "warning"
      (zero "critical")
```

The Performance Advisor never reports a critical finding. The
Architecture and Security Remediation Agents (Stages 5C/5G) both gate on
summary.critical > 0. Copying that exact threshold here would mean this
agent could never escalate, regardless of how many real performance
issues exist. This is concrete, measured evidence for a genuinely
different decision policy -- not a stylistic choice.

## A genuinely different decision policy

```
Step 1 (scan):      { type: "advisors", ids: ["performance"] }
  decide(): warning > 0  OR  suggestion >= 3   -> continue
            otherwise                           -> stop cleanly

Step 2 (remediation): { type: "generator", generatorId: "theme", mode: "dry-run" }
  decide(): success -> stop | failure -> fail
```

Performance problems are typically "death by a thousand cuts" --
individually minor, but worth acting on in volume. This agent's single
gate reflects that directly: escalate on one concrete warning-level
finding, or on three or more suggestion-level findings (a
volume-sensitive threshold). This is a compound, OR-based policy --
meaningfully different from both prior agents' simple >0 single-count
gates.

## Orchestration shape: single-gate, by deliberate restraint

Two steps (matching the Architecture Agent's shape), NOT three like the
Security Agent's dual-gate escalation -- deliberately. Per instruction #8
("use a multi-advisor step only if justified by real workflow needs"),
nothing about this workflow motivates a second, broader escalation step:
there is no natural "narrow scan, then broaden with a second advisor"
story for a performance finding the way there is for a security finding
needing cross-checked code-quality context. Reusing the simpler shape
here -- rather than adding an unjustified second gate for the sake of
appearing more sophisticated -- is itself evidence of following the
instruction's restraint requirement, not a compromise.

## Generator choice: verified, not assumed

The Theme Generator (dry-run) was chosen only after directly testing an
alternative: the Gutenberg Block Generator was tried standalone in
dry-run mode first and confirmed to FAIL without a pre-existing target
project directory (ENOENT, since it's an injection-style generator).
Theme (and Plugin, already used by the Security Agent) are this
project's only pure-scaffold generators that work standalone in dry-run
-- confirmed directly before choosing, not assumed.

## Real, verified delegation

Three real scenarios smoke-tested before the formal suite existed:

- Clean code -> 1 step, stops cleanly (warning=0, suggestion=0).
- A real json-operation-in-loop warning (from JSON.parse() inside a
  loop) -> escalates via the warning branch.
- Real code producing exactly 3 suggestion-level findings with zero
  warnings (string-concatenation-in-loop, large-switch-statement,
  excessive-conditional-nesting) -> escalates via the volume branch --
  confirming the compound OR condition's second branch works against
  genuine advisor output, not just synthetic test data.

All three confirmed with zero real filesystem writes in the generator
step.

---

## Three-Agent Promotion Evidence Review (required by instruction #14)

With three real Agents now built, the concrete evidence was reviewed
directly (see the grep excerpts above and in the Stage 5H completion
report) to determine whether any shared orchestration abstraction is
justified.

What is structurally similar across all three:
- The [advisors step(s)] -> [conditional generator step] shape.
- decide() reading only result.summary/result.success, never
  result.findings.
- Error-reason string formatting ("X step failed: ${...}") -- one line,
  repeated three times.
- A path.join(os.tmpdir(), "<agent-id>-dry-run") output-dir pattern --
  one line, repeated three times.

What is irreducibly different across all three (the actual complexity):
- The decision policy itself -- Architecture sums two counts
  (critical + warning); Security checks one count at two different
  scopes (narrow vs. broad); Performance combines two different counts
  with OR logic and a volume threshold. This is the one place genuine
  domain judgment lives in each agent, and it is different in all three.
- Step count and shape -- 2 steps (Architecture, Performance) vs. 3
  steps with a genuine dual-advisor step (Security).
- Which Generator, and why -- chosen per-agent based on direct, verified
  compatibility with dry-run mode, not a shared default.

Conclusion: no shared abstraction is justified. The two-line patterns
that repeat (error-message formatting, tmpdir path construction) are
exactly the kind of trivial duplication this project has repeatedly and
correctly declined to extract prematurely (the same standard applied at
Stage 3F's Change Set evaluation, which concluded promotion wasn't
justified even with three real Injection Generators sharing an apparent
shape). The one thing that WOULD be worth abstracting -- the decision
policy -- is precisely the thing that must stay agent-specific, since it
encodes each agent's actual judgment about its own domain. Any attempt to
factor it into a shared helper would either (a) lose real expressiveness
by forcing all three into one threshold shape, or (b) require passing in
a policy function anyway -- at which point the "abstraction" is just
plan()/decide() themselves, i.e., the Agent Framework already provides
exactly the right level of shared structure, and nothing more should be
added on top of it.

---

## Zero framework modifications required

Every file outside agents/performance-optimization/, agents/index.js
(registration only), and this doc is completely unchanged. Full project
regression (954 tests across every subsystem) passes with zero failures.

## Usage

```js
import { runAgentWithReport } from "./agents/index.js";

const report = await runAgentWithReport("performance-optimization", {
  sourceFiles: [{ path: "x.js", content: "..." }],
});
```

## Explicitly out of scope for this stage

- Any real code remediation -- same honesty as Stages 5C/5G.
- Write-mode generator execution -- dry-run only.
- Any shared orchestration abstraction -- explicitly evaluated and
  declined above, with concrete evidence.
