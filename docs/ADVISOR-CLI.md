# Advisor CLI — Stage 4K

Located at `cli/advisor-cli.js`. A thin command-line adapter over the
existing Advisor Framework (`advisors/`) -- the same role
mcp-server/advisor-tools.js plays for MCP (Stage 4J), now for direct
terminal use. Contains zero analysis logic, zero severity calculation,
zero finding creation, zero report generation.

## Architecture

```
Terminal (node cli/advisor-cli.js ... , or `advisor ...` via npm bin)
        |
        v
cli/advisor-cli.js       <- THIN ADAPTER: parse argv, resolve context
                            (--context file OR --project-root via Project
                            Discovery), format output
        |  calls, unmodified
        v
advisors/index.js         <- listAdvisorCatalog, runAdvisorWithReport, runAdvisors
        |
        v
advisors/framework/*.js   <- registry, executor, report wrapper, multi-advisor executor
        |
        v
advisors/{architecture,code-review,security,performance,accessibility,
          wordpress-security,wordpress-performance,wordpress-hooks-core}/
                           <- the eight real Advisors, completely untouched
```

This is the second independent thin adapter over the identical Advisor
Framework functions (MCP being the first, Stage 4J) -- both built without
any change to advisors/, confirming the framework's functions were
designed generically enough to serve multiple consumer types (an MCP
server, a CLI) without modification.

## Installation

```bash
cd cli
npm install    # no dependencies beyond Node itself currently
npm link       # optional: makes the advisor command available globally
```

Or run directly without installing:

```bash
node cli/advisor-cli.js <command> [options]
```

## Usage

```
advisor <command> [options]

Commands:
  list                        List all registered Advisors
  run <id>                    Run a single Advisor
  run-many <id> [id...]       Run multiple Advisors concurrently
  version                     Show CLI and Advisor Framework version info
  help                        Show this help message

Options:
  --context <file>            Path to a JSON file supplying the advisor's context
  --project-root <dir>        Auto-discover context from a project directory
                               (mutually exclusive with --context)
  --json                      Output raw JSON instead of human-readable text
```

`--project-root` delegates to Project Discovery (via the shared
`resolveProjectSource()` helper, `project-discovery/resolve-project-source.js`)
to build `{ sourceFiles, workspaceMetadata, projectType, wordpressMetadata }`
automatically from a directory, instead of requiring a hand-written JSON
context file. See `docs/PROJECT-CONTEXT-DISCOVERY.md` for what gets
discovered.

## Commands

### advisor list

Prints every registered advisor's id, name, category, description, input
requirements, and supported severities -- directly from the real Advisor
Catalog, no filtering or reshaping.

### advisor run <id> [--context <file> | --project-root <dir>] [--json]

Resolves context from exactly one of `--context` (loads the file as JSON)
or `--project-root` (auto-discovers via Project Discovery) -- or `{}` if
neither is supplied -- then calls runAdvisorWithReport(id, context) and
prints the resulting Advisor Report, either formatted for humans or as
raw JSON. Supplying both flags is a validation error.

### advisor run-many <id> [id...] [--context <file> | --project-root <dir>] [--json]

Same as above but for multiple advisor ids at once, via runAdvisors().
All listed ids share the same context file.

### advisor version

Reports the CLI's own version, the supported command list, and the
Advisor Framework's version -- honestly reported as "not available",
since the Advisor Framework deliberately has no version/compatibility
concept (a Stage 4B decision -- see docs/ADVISOR-FRAMEWORK.md). This CLI
does not invent one; doing so would itself be an unauthorized Advisor
Framework change.

### advisor help

Prints the usage block above with examples.

## JSON mode

--json prints the framework's raw report, wrapped in a minimal CLI
envelope ({ command, exitCode, report }) -- the report object itself is
never restructured, renamed, or filtered. For list/version, --json
prints the raw catalog array / version info object directly (no envelope
needed, since there's no single "report" to wrap).

## Examples

```bash
$ advisor list
Registered Advisors (5):

  architecture - Architecture Advisor [architecture]
    Analyzes module dependency structure for circular dependencies...
    inputs: sourceFiles
    severities: info, suggestion, warning, critical
  ...

$ advisor run security --context ./context.json
Advisor: security
Status: SUCCESS
Execution time: 2ms
Summary: info=1 suggestion=0 warning=0 critical=1

Findings:
  [CRITICAL] dangerous-eval-usage: "x.js" calls eval() at line 1. (x.js:1)
  [INFO] security-scan-summary: Scanned 1 file(s); 1 security-relevant finding(s) before this summary.

$ advisor run-many architecture security --context ./context.json --json
{
  "command": "run-many",
  "exitCode": 0,
  "report": { "success": true, "advisorCount": 2, "advisorsRun": [ "architecture", "security" ] }
}
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Successful execution |
| 1 | Framework execution failure (a real advisor error other than "unknown advisor" -- e.g. a required input was missing from the context) |
| 2 | Invalid command-line usage (missing/malformed args, missing context file, invalid JSON in the context file, unknown command, no command given) |
| 3 | Unknown advisor id(s) -- for run-many, only when every failure in the batch is an unknown-advisor error; a mix of unknown-advisor and genuine framework failures exits 1 |

"Unknown advisor" (exit 3) and "framework execution failure" (exit 1) are
distinguished by checking whether the framework's own error string starts
with "Unknown advisor:" -- the exact, stable prefix getAdvisor() has used
since Stage 4B. This is reading an already-computed error message to pick
an exit code, not duplicated validation.

## Error handling

- Unknown advisor -> exit 3, the framework's own error message printed to stderr.
- Missing context file -> exit 2, `Context file not found: "<path>"` on stderr.
- Invalid JSON -> exit 2, `Context file is not valid JSON: "<path>" (<parse error>)` on stderr.
- Framework execution failure (e.g. a required input never supplied) -> exit 1, the framework's own error message.
- Invalid CLI usage (missing id/ids, unknown command, no command) -> exit 2, a clear message plus the usage block.

## Packaging

cli/package.json declares a bin entry ("advisor": "./advisor-cli.js") so
npm link (or publishing) makes the advisor command available directly.
The script has a #!/usr/bin/env node shebang and is marked executable.

## Testing

Three layers, matching this project's established testing discipline:
unit tests (parsing, formatting, exit-code classification -- pure
functions, no process involved), integration tests (calling main()
directly against the real, unmodified Advisor Framework), and
spawned-process tests (actually invoking node advisor-cli.js ... as a
child process and inspecting real exit codes / stdout / stderr).

## Limitations

- Automatic context discovery (--project-root) covers `sourceFiles`,
  `workspaceMetadata`, `projectType`, and `wordpressMetadata` only -- it
  never includes Knowledge Graph or Memory data, since those require a
  live, authenticated WordPress REST connection this CLI does not have.
  Only the MCP server integration has that (see `docs/ADVISOR-MCP.md`).
- No shell-completion, no colorized output, no interactive/watch mode --
  none were requested, and adding them would risk scope creep beyond
  "thin adapter."
- No Agent behavior, no automatic fixing, no Generator invocation.
