# Agent CLI — Stage 5E

Located at `cli/agent-cli.js`. A thin command-line adapter over the
existing Agent Framework (`agents/`), mirroring advisor-cli.js
(Stage 4K) exactly in structure and discipline.

## Architecture

```
Terminal (node cli/agent-cli.js ... , or `agent ...` via npm bin)
        |
        v
cli/agent-cli.js         <- THIN ADAPTER: parse argv, load context file, format output
        |  calls, unmodified
        v
agents/index.js            <- listAgentCatalog, runAgentWithReport, checkCompatibility
        |
        v
agents/framework/*.js      <- registry, executor, report wrapper, catalog
        |
        v
agents/architecture-remediation/  <- the one real Agent, completely untouched
```

Contains zero planning, decision, analysis, generation, or
report-construction logic. Every command is a pure delegation to
agents/index.js's own, already-tested functions.

## Installation

```bash
cd cli
npm install
```

cli/package.json's bin field now declares both advisor and agent
commands from the same package.

## Usage

```
agent <command> [options]

Commands:
  list                        List all registered Agents
  run <agent-id>               Run a single Agent
  check <agent-id>             Check an Agent's Advisor/Generator compatibility
  help                        Show this help message

Options:
  --context <file>            Path to a JSON file supplying the agent's context (for run)
  --json                      Output raw JSON instead of human-readable text
```

## Commands

### agent list

Prints every registered agent's id, name, category, description, input
requirements, capabilities, and declared Advisor/Generator dependencies --
directly from the real Agent Catalog.

### agent run <agent-id> [--context <file>] [--json]

Loads <file> as JSON (or uses {} if --context is omitted), calls
runAgentWithReport(id, context), and prints the resulting Agent Report.

### agent check <agent-id>

Calls checkCompatibility(id) and prints whether the agent's declared
Advisor/Generator dependencies are currently registered.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Successful execution (for check, this includes a KNOWN agent reporting compatible: false due to missing dependencies -- that's a legitimate answer, not a failure) |
| 1 | Framework execution failure (a real agent/step error other than "unknown agent" -- e.g. a required input was missing from the context) |
| 2 | Invalid command-line usage (missing/malformed args, missing context file, invalid JSON, unknown command, no command given) |
| 3 | Unknown agent id |

"Unknown agent" (exit 3) vs. "framework execution failure" (exit 1) is
distinguished by checking whether the framework's own error string starts
with "Unknown agent:" -- the same technique advisor-cli.js already uses
for "Unknown advisor:".

A genuine nuance for agent check: a REGISTERED agent with missing
dependencies (compatible: false, error: null) exits 0, not 3 -- only a
genuinely UNKNOWN agent id (error populated) exits 3. This distinction is
verified explicitly by dedicated unit and integration tests.

## Example

```bash
$ agent run architecture-remediation --context ./violation.json
Agent: architecture-remediation
Status: SUCCESS
Execution time: 12ms
Summary: advisorsRun=[architecture] generatorsRun=[theme] stepsSkipped=0 stepsFailed=0

Steps:
  Step 0 (advisors):
    advisors: architecture
    result: SUCCESS
      [CRITICAL] layer-violation: "generators/framework/executor.js" (generator-framework) depends on ...
    decision: continue (1 actionable architecture finding(s) found (critical=1, warning=0); preparing remediation generator step.)
  Step 1 (generator):
    generator: theme (mode: dry-run)
    result: SUCCESS
    decision: stop (Remediation generator step completed successfully (dry-run).)

Recommendations:
  - Remediation generator step completed successfully (dry-run).
```

## Testing

Three layers, matching advisor-cli.js's established discipline: unit
tests (parsing, formatting, exit-code classification -- pure functions),
integration tests (calling main() directly against the real, unmodified
Agent Framework, including the real two-step orchestration workflow),
and spawned-process tests (invoking the actual node agent-cli.js binary
as a child process, confirming genuine exit codes and stdout/stderr
routing). A dedicated test confirms the real dry-run workflow performs
zero real filesystem writes.

## Limitations

- --context must point to a caller-prepared JSON file -- no automatic
  project-directory context assembly, matching the same boundary already
  drawn for the Advisor CLI.
- No Agent-of-agent invocation, no automatic fixing -- this CLI only
  exposes the existing Agent Framework exactly as it is.
