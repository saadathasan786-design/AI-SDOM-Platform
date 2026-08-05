# Advisor MCP Integration — Stage 4J

Located at `mcp-server/advisor-tools.js`, wired into `mcp-server/index.js`.
Exposes the completed Advisor Framework (`advisors/`) through three MCP
tools so external AI clients can run Advisors without any of their logic
being duplicated in the MCP layer.

## Architecture

```
MCP Client (Claude, or any MCP-speaking tool)
        |  JSON-RPC over stdio
        v
mcp-server/index.js          <- tool registration + dispatch (existing pattern, unchanged)
        |  imports
        v
mcp-server/advisor-tools.js  <- THIN ADAPTER (this stage's new code)
        |  calls, unmodified
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

advisor-tools.js contains zero analysis logic, zero severity calculation,
zero finding creation, zero report generation. Every handler is a direct
call to an existing, already-tested function in advisors/index.js. The
only code in this file is: (1) three tool definitions (name/description/
inputSchema, matching the exact style of every other tool in
mcp-server/index.js), and (2) a thin MCP-request-shape check (e.g. "was
id given as a non-empty string at all?") -- not duplicated Advisor
validation, but the distinct, necessary adapter-layer responsibility of
checking the incoming wire-format request before calling into the
framework.

## A new cross-subsystem edge — evaluated, not a violation

This integration introduces mcp-server -> advisors, a dependency edge
that didn't exist before Stage 4J. Checked against the Architecture
Advisor's own rules (built in Stage 4C): this classifies as
cross-subsystem-coupling-observed (info severity), not layer-violation
(critical) -- the Architecture Advisor's own design already anticipated
exactly this ("Advisors reading the Knowledge Graph is an anticipated
future integration... worth a deliberate look" -- this is the inverse
direction of that same anticipated integration). Verified directly by
running the real Architecture Advisor against the updated source tree
(mcp-server/, advisors/, generators/): zero layer-violation findings, one
cross-subsystem-coupling-observed info finding for exactly this new edge.

## Tool reference

### advisor_list

No arguments. Returns the real Advisor Catalog (listAdvisorCatalog())
unchanged: an array of { id, name, description, category,
inputRequirements, supportedSeverities }.

### advisor_run

```jsonc
{ "id": "security", "context": { "sourceFiles": [{ "path": "x.js", "content": "eval(x);" }] } }
```

Delegates to runAdvisorWithReport(id, context) unchanged. Returns the
full Advisor Report exactly as the framework produces it -- same shape
as documented in docs/ADVISOR-FRAMEWORK.md.

### advisor_runMany

```jsonc
{ "ids": ["architecture", "security"], "context": { "sourceFiles": [ /* ... */ ] } }
```

Delegates to runAdvisors(ids, context) unchanged. Returns the full
Unified Advisor Report exactly as documented in
docs/MULTI-ADVISOR-EXECUTOR.md.

## Example request/response

Request (tools/call):
```json
{ "name": "advisor_run", "arguments": { "id": "security", "context": { "sourceFiles": [{ "path": "x.js", "content": "eval(x);" }] } } }
```

Response (isError: false, content is the exact, unchanged Advisor Report):
```json
{
  "content": [{ "type": "text", "text": "{ \"advisor\": \"security\", \"success\": true, \"findings\": [ { \"id\": \"dangerous-eval-usage\", \"severity\": \"critical\" } ], \"summary\": { \"info\": 1, \"suggestion\": 0, \"warning\": 0, \"critical\": 1 }, \"execution_ms\": 2, \"timestamp\": \"...\", \"error\": null }" }],
  "isError": false
}
```

Unknown advisor (isError: true, report still fully included):
```json
{
  "content": [{ "type": "text", "text": "{ \"advisor\": \"nonexistent\", \"success\": false, \"findings\": [], \"summary\": { \"info\": 0, \"suggestion\": 0, \"warning\": 0, \"critical\": 0 }, \"execution_ms\": 0, \"timestamp\": \"...\", \"error\": \"Unknown advisor: nonexistent. Registered advisors: architecture, code-review, security, performance, accessibility\" }" }],
  "isError": true
}
```

## Error handling design

Three distinct cases, all handled without duplicating framework logic:

1. Invalid request (missing/wrong-typed id/ids) -- the thin MCP-shape
   check throws; caught by index.js's existing top-level try/catch
   (unchanged, the same path every other tool already uses) -> isError:
   true with a plain error message.
2. Unknown advisor -- runAdvisorWithReport()/runAdvisors() never throw
   (per their existing Stage 4B/4I contract); they encode this as
   success: false in an otherwise well-formed report. A small check
   after the switch statement (result?.success === false for these two
   tool names) maps that onto isError: true, while STILL returning the
   full, unchanged report as content -- satisfying both "return the
   report unchanged" and "must return proper MCP errors."
3. Framework failure (any other internal failure) -- encoded the same
   way as "unknown advisor" (via success: false), handled identically.

No validation is duplicated anywhere: "is this a registered advisor id"
is checked exactly once, inside getAdvisor() (Stage 4B), exactly as
before this integration.

## Integration flow (end to end)

1. MCP client sends tools/call with name: "advisor_run" (or
   advisor_list/advisor_runMany).
2. mcp-server/index.js's existing CallToolRequestSchema handler
   dispatches to handleAdvisorRun() (etc.) in advisor-tools.js.
3. advisor-tools.js does its thin shape check, then calls
   runAdvisorWithReport() from advisors/index.js -- the exact same
   function any other caller (a future CLI, a test) would call.
4. The framework does everything else: registry lookup, input assembly,
   analyze() execution, report wrapping -- completely unaware an MCP
   server exists.
5. The result flows back through advisor-tools.js and index.js unchanged,
   JSON-stringified into the MCP response's content.

## Context assembly: context, projectRoot, includeKnowledgeGraph, memoryScope

`advisor_run`/`advisor_runMany` accept four optional parameters,
resolved by `resolveContext()` in `advisor-tools.js`:

- `context` -- an already-assembled context object, supplied directly by
  the caller. Mutually exclusive with `projectRoot`.
- `projectRoot` -- a directory path; delegates to Project Discovery
  (`resolveProjectSource()`) to build `{ sourceFiles, workspaceMetadata,
  projectType, wordpressMetadata }` automatically. Mutually exclusive
  with `context`.
- `includeKnowledgeGraph` -- if `true`, additionally builds the current
  WordPress site's live Knowledge Graph (via the existing, unmodified
  `buildProjectGraph(wpRequest)`) and attaches it as
  `context.knowledgeGraph`. Off by default; never automatic.
- `memoryScope` -- if supplied (`{ client_id?, project_id? }`, at least
  one required), retrieves that scope's Memory snapshot history (via the
  existing, unmodified `memory.listSnapshots()`) and attaches it as
  `context.memoryHistory`. Omitted by default; never automatic.

`includeKnowledgeGraph` and `memoryScope` are fully orthogonal to each
other and to `context`/`projectRoot` -- any combination is valid. No
current Advisor declares `knowledgeGraph` or `memoryHistory` in its own
`inputRequirements`, so neither field is ever actually consumed by any
real Advisor today; they exist in the context object purely for future
Advisors that might opt in. See `docs/PROJECT-CONTEXT-DISCOVERY.md`,
`docs/KNOWLEDGE-GRAPH-SCHEMA.md`, and `docs/MEMORY-MODEL.md` for the
underlying subsystems' own documentation.

## Limitations

- Knowledge Graph and Memory integration is MCP-only -- neither the CLI
  nor the VS Code extensions have an equivalent, since only the MCP
  server has an authenticated WordPress REST client. This is a
  deliberate, documented architectural asymmetry (Stage 9A), not an
  oversight.
- No Agent behavior, no automatic fixing, no Generator invocation -- this
  stage only exposes read-only Advisor analysis, exactly as scoped.
- Large sourceFiles payloads passed as MCP tool arguments are
  JSON-serialized in both directions; very large projects may hit
  practical message-size limits of the MCP transport -- not addressed
  here, since no real caller has hit this yet.
