# Advisor VS Code Extension — Stage 4L

Located at `vscode-advisor-extension/`. A thin UI adapter exposing the
existing Advisor Framework (`advisors/`) directly inside VS Code -- the
third independent adapter over the identical framework functions
(alongside the MCP integration, Stage 4J, and the CLI, Stage 4K), built
with zero Advisor Framework changes.

## Architecture

```
VS Code Command Palette
        |
        v
extension.js                <- THIN WIRING ONLY: imports the real "vscode"
        |                       module, registers 4 commands, done.
        v
src/commands.js             <- Command handler LOGIC. Takes vscodeApi as a
        |                       parameter (dependency injection) rather than
        |                       importing "vscode" directly -- this is what
        |                       makes it testable without a real VS Code
        |                       process.
        |
        +--> src/context-loader.js   <- assembles { sourceFiles: [...] } from
        |                               the user's chosen source (current file,
        |                               open editors, or a JSON file)
        |
        +--> src/report-viewer.js    <- pure HTML generation, presentation only
        |
        v
advisors/index.js            <- listAdvisorCatalog, runAdvisorWithReport, runAdvisors
        |
        v
advisors/framework/*.js      <- registry, executor, report wrapper, multi-advisor executor
        |
        v
advisors/{architecture,code-review,security,performance,accessibility}/
                              <- the five real Advisors, completely untouched
```

src/commands.js, src/context-loader.js, and src/report-viewer.js contain
zero analysis logic, zero severity calculation, zero finding creation,
zero report generation. Every command delegates directly to
listAdvisorCatalog(), runAdvisorWithReport(), or runAdvisors() -- the
same three functions the MCP integration and CLI already call unmodified.

## Why extension.js stays untested (and why that's fine)

extension.js imports the real "vscode" module, which only resolves
inside a real VS Code extension host -- no such host exists in this
environment (no VS Code binary to spawn, no @vscode/test-electron
download attempted). Rather than skip testing, the standard,
well-established pattern for testable VS Code extensions was followed:
keep extension.js reduced to pure wiring (register four commands,
nothing else -- verified by a manifest/wiring test that reads the file's
source directly), and put every piece of actual logic in modules that
accept the vscode API as a PARAMETER instead of importing it.
test/mock-vscode.js provides a lightweight fake implementing the exact
subset of the API used (showQuickPick, showOpenDialog, showErrorMessage,
showInformationMessage, createWebviewPanel, withProgress,
activeTextEditor, workspace.textDocuments, workspace.fs.readFile) -- this
is a UI-layer fake only; every Advisor Framework call made through it is
the real, unmodified framework, verified explicitly by a dedicated
"framework delegation" test asserting that returned findings only ever
contain ids the real Security Advisor is documented to produce.

## Installation

```bash
cd vscode-advisor-extension
npm install
```

To actually run inside VS Code (outside this environment): open the
folder in VS Code and press F5 to launch an Extension Development Host,
or package with `vsce package` and install the resulting .vsix.

## Available commands

| Command | Palette title |
|---|---|
| advisor.listAdvisors | Advisor: List Advisors |
| advisor.runAdvisor | Advisor: Run Advisor |
| advisor.runManyAdvisors | Advisor: Run Multiple Advisors |
| advisor.showLastReport | Advisor: Show Last Report |

### Advisor: List Advisors

Opens a webview listing every advisor from the real Advisor Catalog: id,
name, description, category, input requirements, supported severities --
read directly from listAdvisorCatalog(), no duplicated metadata anywhere
in the extension.

### Advisor: Run Advisor

1. Shows a QuickPick of every real registered advisor (id/name/description).
2. Shows a QuickPick for the context source: Current file, All open
   editors, or Load context from a JSON file.
3. Calls runAdvisorWithReport(id, context) (wrapped in
   vscode.window.withProgress for a non-blocking progress notification).
4. Opens the Report Viewer with the result.

### Advisor: Run Multiple Advisors

Same as above but with a multi-select QuickPick (canPickMany: true),
delegating to runAdvisors(ids, context) and showing the Unified Advisor
Report.

### Advisor: Show Last Report

Redisplays whichever report (catalog listing, single-advisor, or unified)
was most recently shown in this session -- a UI-only cache of the
framework's own already-computed report object, not duplicated advisor
data.

## Report Viewer

A webview (presentation only -- see src/report-viewer.js) supporting:

- Filtering by severity -- checkboxes for info/suggestion/warning/critical;
  client-side JS shows/hides .finding elements by their data-severity
  attribute. This filters the DOM, it does not recompute anything.
- Grouping by advisor -- the Unified Report view renders one
  advisor-group div per advisor, each showing that advisor's own findings.
- Expanding evidence -- each finding's evidence object is shown in a
  collapsible details/summary block, pretty-printed JSON.
- Viewing recommendations -- each finding's recommendation.message is
  displayed directly beneath it.

All HTML is escaped (escapeHtml()) before insertion, since findings can
contain arbitrary source-derived text (e.g. a finding's message might
quote a snippet of analyzed code) -- verified by a dedicated
XSS-prevention test.

(Screenshot placeholder -- a real screenshot would show the webview
rendering a report with the severity filter bar at the top and
color-coded finding cards below; not capturable in this text-only
environment.)

## Extension workflow

```
User: Cmd+Shift+P -> "Advisor: Run Advisor"
  -> QuickPick: pick "security"
  -> QuickPick: pick "Current file"
  -> [progress notification while runAdvisorWithReport() executes]
  -> Webview opens showing the real Advisor Report
  -> (later) Cmd+Shift+P -> "Advisor: Show Last Report" reopens the same report
```

## Error handling

- Unknown advisor -- surfaces via the framework's own success:false +
  error message, shown both in the Report Viewer and via
  vscode.window.showErrorMessage. No validation is duplicated; "is this a
  registered advisor" is checked exactly once, inside getAdvisor()
  (Stage 4B), exactly as it is for the MCP and CLI integrations.
- Invalid context (malformed JSON file, missing file) -- caught in
  context-loader.js with a clear showErrorMessage, before the framework
  is ever called -- a thin adapter-level shape check, not duplicated
  Advisor validation.
- Framework failure (e.g. a required input never supplied) -- same
  success:false path as "unknown advisor," displayed identically.

## Performance

Every advisor call is wrapped in vscode.window.withProgress, VS Code's
standard non-blocking progress-notification API, so the UI shows
feedback and stays responsive during execution. The underlying advisor
calls are fast, regex-based static analysis with no long synchronous CPU
loops, so this is a UX affordance on top of already-quick execution
rather than a workaround for slowness.

## Testing strategy

Four layers: unit tests for the pure report-viewer.js (no vscode
dependency at all), tests for context-loader.js (mock vscode + real
file-content assembly logic), integration tests for commands.js (mock
vscode UI + the real, unmodified Advisor Framework, covering all four
commands plus cancellation and error paths), and extension-level
integration tests (manifest verification, multi-command workflows, and
an explicit "framework delegation" check that returned findings only
ever contain ids the real advisors are documented to produce).

## Limitations

- No real VS Code extension host was available to run this extension
  end-to-end in this environment -- testing relies on the documented
  mock-vscode pattern described above, standard for VS Code extension
  development but not a substitute for manual verification inside a real
  VS Code instance before publishing.
- package.json uses "type": "module" for consistency with the rest of
  this project's ESM codebase; real Marketplace publishing would likely
  need bundling (webpack/esbuild) to satisfy VS Code's extension host
  module loading conventions -- not attempted here, since this stage's
  scope is the adapter's logic and architecture, not marketplace
  packaging.
- No Agent behavior, no automatic fixing, no Generator invocation.
- Context source selection is limited to current file / open editors / a
  JSON file -- no workspace-wide file-picker or .gitignore-aware
  directory walk, matching the same "expose, don't extend" boundary drawn
  for the MCP and CLI integrations.
