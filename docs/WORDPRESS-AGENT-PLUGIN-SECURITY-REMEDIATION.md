# Plugin Security Remediation Agent — First Real WordPress Agent

Located at `agents/plugin-security-remediation/`. The first real
WordPress-specific Agent, validating that the existing Agent Framework
can orchestrate a WordPress-specific Advisor and Generator without any
architectural change.

## Orchestration shape

```
Step 1: wordpress-security Advisor  -> decide() gate
Step 2 (conditional): Plugin Generator (dry-run only)
```

The exact same two-step shape as the Architecture Remediation Agent
(Stage 5C) -- reused deliberately, since nothing about this workflow
needs the Security Remediation Agent's (Stage 5G) dual-gate escalation:
the WordPress Security Advisor is already the complete, single relevant
source of evidence for this remediation task.

## Decision policy — reuses the existing vocabulary, invents nothing new

```
critical > 0    ("Critical findings")  -> continue
warning > 0     ("High findings")      -> continue
suggestion >= 3 ("Medium findings", volume-sensitive) -> continue
otherwise       ("No meaningful findings") -> stop
```

This project's real severity vocabulary is {info, suggestion, warning,
critical} -- there is no separate "high"/"medium" tier anywhere in the
framework. "Critical" maps directly; "High" maps to warning (the next
real tier below critical); "Medium" reuses the exact volume-sensitive
threshold policy the Performance Optimization Agent (Stage 5H) already
established and validated, rather than inventing a new concept.

## An honest discovery, mirroring Stage 5H's own precedent

Direct inspection confirms the WordPress Security Advisor's CURRENT
rule set never produces suggestion-level findings -- only critical,
warning, and info. This means the medium-volume branch is currently
unreachable via the real, unmodified Advisor as it exists today. The
branch is kept (not removed) because it is directly, correctly testable
via unit tests calling decide() with a synthetic result; it is
forward-compatible should the Advisor ever add a suggestion-level rule;
and it faithfully implements the exact policy shape this stage requires
using only the framework's real vocabulary.

## Manual validation performed before the formal suite existed

- Secure plugin (real nonce check, capability check, sanitization,
  escaping) -- zero findings, agent stops after step 1, no Generator
  step.
- Vulnerable plugin (raw $_POST update, unprepared $wpdb query built
  from a variable, unescaped output) -- real critical findings, agent
  escalates to the dry-run Plugin Generator step.
- Mixed plugin -- confirmed behaves identically to the clean case when
  the code is genuinely secure.
- Zero filesystem writes confirmed for all scenarios.
- Embedded Advisor Report and Generation Report confirmed to match
  their exact real key sets, unmodified.

## Zero framework modifications required

Every file outside agents/plugin-security-remediation/ and
agents/index.js (registration only) that changed did so only to correct
one now-stale hardcoded agent-count assertion (3 -> 4, in mcp-server's
workflow real-invocation test) -- a mechanical, unavoidable test-data
correction directly caused by successfully registering a genuine fourth
Agent.

## Usage

```js
import { runAgentWithReport } from "./agents/index.js";

const report = await runAgentWithReport("plugin-security-remediation", {
  sourceFiles: [{ path: "my-plugin.php", content: "<?php ..." }],
});
```

## Explicitly out of scope for this stage

- No real code remediation -- same honesty as every other remediation
  Agent in this project.
- No second WordPress Agent, no Workflow, no adapter changes.
