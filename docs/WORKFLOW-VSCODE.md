# Workflow VS Code Extension

Located at `vscode-workflow-extension/`. A thin UI adapter exposing the
existing Workflow Framework (`workflows/`) directly inside VS Code,
mirroring vscode-agent-extension/ (Stage 5F) exactly in structure and
discipline, itself derived from vscode-advisor-extension/ (Stage 4L).

## Architecture

```
VS Code Command Palette
        |
        v
extension.js                <- THIN WIRING ONLY: imports the real "vscode"
        |                       module, registers 3 commands, done.
        v
src/commands.js             <- Command handler LOGIC. Takes vscodeApi as a
        |                       parameter (dependency injection).
        |
        +--> src/context-loader.js   <- IDENTICAL to the Advisor/Agent
        |                               extensions' context loader (current
        |                               file / open editors / JSON file).
        |
        +--> src/report-viewer.js    <- pure HTML generation, presentation only
        |
        v
workflows/index.js            <- listWorkflowCatalog, runWorkflowWithReport, checkCompatibility
        |
        v
workflows/framework/*.js      <- registry, executor, report wrapper, catalog
        |
        v
workflows/{project-health-check,security-audit}/  <- the two real Workflows, completely untouched
        |
        v
agents/ -> advisors/ + generators/ (dry-run)       <- the full existing chain, completely untouched
```

src/commands.js, src/context-loader.js, and src/report-viewer.js contain
zero planning, orchestration, analysis, generation, or
report-construction logic. Every command delegates directly to
listWorkflowCatalog(), runWorkflowWithReport(), or checkCompatibility().

## Commands — exactly three, per specification

| Command | Palette title |
|---|---|
| workflow.listWorkflows | Workflow: List Workflows |
| workflow.runWorkflow | Workflow: Run Workflow |
| workflow.checkCompatibility | Workflow: Check Compatibility |

Unlike the Agent extension (which has a fourth "Show Last Report"
command), this extension exposes exactly the three commands specified --
no additional state-caching command was added, since none was requested.

### Workflow: List Workflows

Opens a webview listing both real registered workflows with id, name,
description, category, input requirements, capabilities, and declared
required Agents -- directly from listWorkflowCatalog().

### Workflow: Run Workflow

Prompts for a workflow via QuickPick, then a context source (current
file / all open editors / a JSON file -- identical to the Advisor/Agent
extensions), calls runWorkflowWithReport(id, context) (wrapped in
vscode.window.withProgress), and opens the Report Viewer.

### Workflow: Check Compatibility

Prompts for a workflow via QuickPick, calls checkCompatibility(id),
shows the result in a webview. A genuinely unknown workflow id surfaces
as an error message; a known workflow with missing agent dependencies is
shown plainly (not treated as an error).

## Report Viewer — three nested layers, none restructured

A webview (presentation only -- src/report-viewer.js) rendering the full
Workflow Report:

- Execution summary, per-workflow-step breakdown (each showing which
  Agent ran and its status).
- Each workflow step's EMBEDDED Agent Report is rendered inline --
  itself showing its own embedded Advisor findings (real, unmodified)
  and embedded Generator results (real, unmodified, including dry-run
  mode).
- Decision history at both the workflow level (which agent to run next)
  visible per step.
- Errors, recommendations, client-side severity filtering (same pattern
  as the Advisor/Agent extensions) -- filtering happens over findings
  already embedded three layers deep, never recomputing anything.

## Security: webview content is safely escaped

Every dynamic value inserted into the generated HTML -- at ALL THREE
nested layers (workflow metadata, embedded Agent Report status,
embedded Advisor findings, embedded Generator errors, decisions, errors,
recommendations, compatibility results) -- passes through the same
escapeHtml() helper used by the Advisor and Agent extensions. Verified
by dedicated XSS-prevention tests covering: workflow catalog metadata
(id, name, description, requiredAgents), nested finding messages,
decision reasons, top-level errors, recommendations, an embedded
Generator step's error message, and compatibility check output
(including missing agents and the error field).

## Testing strategy (identical pattern to Stage 4L/5F)

Real VS Code isn't available in this environment, so the same
dependency-injection + mock-vscode pattern is reused unmodified. A
dedicated "framework delegation" test confirms extension.js contains
only wiring (under 20 non-comment lines, no analysis/decision-shaped
tokens present) and that returned findings only ever contain ids the
real Advisors document, decision actions only ever come from the
framework's fixed vocabulary, and every embedded Agent Report matches
its exact documented key set.

## Zero framework modifications required

workflows/framework/, workflows/project-health-check/,
workflows/security-audit/, agents/, advisors/, generators/, Memory,
Knowledge Graph, MCP, and CLI were not touched.

## Limitations

- Same as the Advisor/Agent extensions: no real VS Code extension host
  was available to validate end-to-end in this environment.
- No "Show Last Report" command (unlike the Agent extension) -- not
  requested for this extension, so not added.
- No workflow composition, no automatic fixing.
