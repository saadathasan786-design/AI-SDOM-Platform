# Agent VS Code Extension — Stage 5F

Located at `vscode-agent-extension/`. A thin UI adapter exposing the
existing Agent Framework (`agents/`) directly inside VS Code, mirroring
vscode-advisor-extension/ (Stage 4L) exactly in structure and discipline.

## Architecture

```
VS Code Command Palette
        |
        v
extension.js                <- THIN WIRING ONLY: imports the real "vscode"
        |                       module, registers 4 commands, done.
        v
src/commands.js             <- Command handler LOGIC. Takes vscodeApi as a
        |                       parameter (dependency injection) -- the
        |                       exact same testing strategy Stage 4L
        |                       established, reused unmodified.
        |
        +--> src/context-loader.js   <- IDENTICAL to the Advisor extension's
        |                               context loader (current file / open
        |                               editors / JSON file) -- reused as-is,
        |                               since runAgentWithReport()'s context
        |                               shape is identical.
        |
        +--> src/report-viewer.js    <- pure HTML generation, presentation only
        |
        v
agents/index.js               <- listAgentCatalog, runAgentWithReport, checkCompatibility
        |
        v
agents/framework/*.js         <- registry, executor, report wrapper, catalog
        |
        v
agents/architecture-remediation/  <- the one real Agent, completely untouched
```

src/commands.js, src/context-loader.js, and src/report-viewer.js contain
zero planning, decision, analysis, generation, or report-construction
logic. Every command delegates directly to listAgentCatalog(),
runAgentWithReport(), or checkCompatibility().

## Commands

| Command | Palette title |
|---|---|
| agent.listAgents | Agent: List Agents |
| agent.checkCompatibility | Agent: Check Compatibility |
| agent.runAgent | Agent: Run Agent |
| agent.showLastReport | Agent: Show Last Report |

Four commands, mirroring the Advisor extension's four exactly -- a
deliberate, non-speculative reuse of an already-proven command set,
adapted only where the underlying framework genuinely differs (a
checkCompatibility command replaces "Run Multiple Advisors," since the
Agent Framework has no runAgents() plural function to expose -- there is
nothing to build a multi-agent command around yet).

### Agent: List Agents

Opens a webview listing every real registered agent (currently one:
architecture-remediation) with id, name, description, category, input
requirements, capabilities, and declared Advisor/Generator dependencies --
directly from listAgentCatalog().

### Agent: Check Compatibility

Prompts for an agent via QuickPick, calls checkCompatibility(id), shows
the result in a webview. Surfaces a genuinely unknown agent id as an
error message; a known agent with missing dependencies is shown plainly
(not treated as an error), matching the same distinction already
established for the MCP (Stage 5D) and CLI (Stage 5E) integrations.

### Agent: Run Agent

Prompts for an agent via QuickPick, then a context source (current file /
all open editors / a JSON file -- identical to the Advisor extension),
calls runAgentWithReport(id, context) (wrapped in
vscode.window.withProgress), and opens the Report Viewer.

### Agent: Show Last Report

Redisplays whichever result (catalog, compatibility check, or full agent
report) was most recently shown -- a UI-only cache of the framework's own
already-computed data.

## Report Viewer

A webview (presentation only -- src/report-viewer.js) rendering the full
Agent Report:

- Execution summary -- status, execution time, advisors/generators run,
  steps skipped/failed.
- Step-by-step execution -- one block per plan step, in order.
- Embedded Advisor reports -- each advisors step renders the REAL
  findings from the embedded Unified Advisor Report, unchanged.
- Embedded Generator reports -- each generator step shows the REAL
  Generation Report's mode (e.g. dry-run) and success/failure, unchanged.
- Decision history -- each step's decide() outcome (continue, skip,
  stop, or fail) and reason, shown directly beneath that step.
- Errors -- planning/execution/unexpected failures, if any.
- Recommendations -- the agent's own decide()-sourced reasons.
- Client-side filtering only -- the same severity checkbox filter as the
  Advisor extension, operating on findings already embedded in advisor
  steps; no analysis happens in the browser.

## Security: webview content is safely escaped

Every dynamic value inserted into the generated HTML -- finding messages,
decision reasons, error messages, recommendations, agent/advisor/
generator metadata -- passes through the same escapeHtml() helper used
by the Advisor extension. Verified explicitly by dedicated XSS-prevention
tests injecting <script>/<img onerror> payloads into every rendered
field (findings, decisions, errors, recommendations, catalog metadata,
and compatibility results) and confirming none of them appear unescaped
in the output.

## Testing strategy (identical to Stage 4L)

Real VS Code isn't available in this environment, so the same
dependency-injection + mock-vscode pattern from Stage 4L is reused
unmodified: test/mock-vscode.js is a lightweight fake UI layer; every
Agent Framework call made through it is 100% real and unmodified,
verified explicitly by "framework delegation" tests asserting that
returned findings only ever contain ids the real Architecture Advisor
documents, and that decision actions only ever come from the framework's
own fixed vocabulary (continue/skip/stop/fail). A dedicated test also
confirms the embedded Generation Report's key set matches exactly what
generation-report.js itself produces -- nothing added, renamed, or
removed.

## Zero framework modifications required

agents/, advisors/, generators/, cli/, and mcp-server/ were not touched.
Full regression (895 tests across every subsystem) passes with zero
failures.

## Limitations

- Same as the Advisor extension: no real VS Code extension host was
  available to validate end-to-end in this environment; testing relies
  on the documented mock-vscode pattern.
- No multi-agent command (runAgents() doesn't exist in the Agent
  Framework yet -- see docs/AGENT-FRAMEWORK.md), so there is no
  "Run Multiple Agents" analog to the Advisor extension's corresponding
  command. Not a gap -- nothing to expose yet.
- No Agent-of-agent invocation, no automatic fixing.
