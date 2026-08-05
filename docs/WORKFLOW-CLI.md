# Workflow CLI — Stage 6E

Located at `cli/workflow-cli.js`. A thin command-line adapter over the
existing Workflow Framework (`workflows/`), mirroring agent-cli.js
(Stage 5E) exactly in structure and discipline.

## Architecture

```
Terminal (node cli/workflow-cli.js ... , or `workflow ...` via npm bin)
        |
        v
cli/workflow-cli.js       <- THIN ADAPTER: parse argv, load context file, format output
        |  calls, unmodified
        v
workflows/index.js          <- listWorkflowCatalog, runWorkflowWithReport, checkCompatibility
        |
        v
workflows/framework/*.js    <- registry, executor, report wrapper, catalog
        |
        v
workflows/{project-health-check,security-audit}/  <- the two real Workflows, completely untouched
```

Contains zero planning, orchestration, analysis, generation, or
report-construction logic. Every command is a pure delegation to
workflows/index.js's own, already-tested functions.

## Installation

```bash
cd cli
npm install
```

cli/package.json's bin field now declares advisor, agent, and workflow
commands from the same package.

## Usage

```
workflow <command> [options]

Commands:
  list                        List all registered Workflows
  run <workflow-id>            Run a single Workflow
  check <workflow-id>          Check a Workflow's Agent compatibility
  help                        Show this help message

Options:
  --context <file>            Path to a JSON file supplying the workflow's context (for run)
  --json                      Output raw JSON instead of human-readable text
```

## Commands

### workflow list

Prints every registered workflow's id, name, category, description,
input requirements, capabilities, and declared required Agents --
directly from the real Workflow Catalog.

### workflow run <workflow-id> [--context <file>] [--json]

Loads <file> as JSON (or uses {} if --context is omitted), calls
runWorkflowWithReport(id, context), and prints the resulting Workflow
Report -- including every embedded Agent Report and, nested within
those, every embedded Advisor/Generator report.

### workflow check <workflow-id>

Calls checkCompatibility(id) and prints whether the workflow's declared
Agent dependencies are currently registered.

## Exit codes

Identical philosophy to advisor-cli.js/agent-cli.js:

| Code | Meaning |
|---|---|
| 0 | Successful execution (for check, this includes a KNOWN workflow reporting compatible: false due to missing agents -- a legitimate answer, not a failure) |
| 1 | Framework execution failure (a real workflow/step error other than "unknown workflow") |
| 2 | Invalid command-line usage |
| 3 | Unknown workflow id |

"Unknown workflow" (exit 3) vs. "framework execution failure" (exit 1)
is distinguished by checking whether the framework's own error string
starts with "Unknown workflow:" -- the same technique agent-cli.js uses
for "Unknown agent:". The check command's exit-code nuance uses
result.error exactly as done for the Agent CLI and the Workflow MCP
adapter: a registered workflow with missing dependencies exits 0; only a
genuinely unknown workflow id exits 3.

## Example

```bash
$ workflow run security-audit --context ./violation.json
Workflow: security-audit
Status: SUCCESS
Execution time: 26ms
Summary: agentsRun=[security-remediation, architecture-remediation, performance-optimization] stepsFailed=0

Steps:
  Step 0: Agent "security-remediation"
    agent status: SUCCESS
    advisors: security -> SUCCESS
      [CRITICAL] dangerous-eval-usage: ...
    advisors: security, code-review -> SUCCESS
      ...
    generator: plugin (mode: dry-run) -> SUCCESS
    decision: continue (Agent "security-remediation" completed successfully; proceeding to the next agent.)
  Step 1: Agent "architecture-remediation"
    ...
  Step 2: Agent "performance-optimization"
    ...
    decision: stop (Security audit finished after the Performance Optimization step (completed successfully).)
```

## Testing

Three layers, matching the established discipline: unit tests (parsing,
formatting -- including nested agent/advisor/generator step rendering --
exit-code classification), integration tests (calling main() directly
against the real, unmodified Workflow Framework, including both real
Workflows exercising the complete four-layer chain), and spawned-process
tests (invoking the actual node workflow-cli.js binary as a child
process). A dedicated test confirms zero real filesystem writes occur
anywhere across the entire chain.

## Limitations

- --context must point to a caller-prepared JSON file -- no automatic
  project-directory context assembly, matching the same boundary already
  drawn for the Advisor and Agent CLIs.
- No workflow composition, no automatic fixing -- this CLI only exposes
  the existing Workflow Framework exactly as it is.
