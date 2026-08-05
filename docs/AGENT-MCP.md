# Agent MCP Integration — Stage 5D

Located at `mcp-server/agent-tools.js`, wired into `mcp-server/index.js`.
Exposes the Agent Framework (`agents/`) through three MCP tools, following
exactly the same architectural discipline as advisor-tools.js (Stage 4J).

## Architecture

```
MCP Client
        |  JSON-RPC over stdio
        v
mcp-server/index.js       <- tool registration + dispatch (existing pattern, unchanged)
        |  imports
        v
mcp-server/agent-tools.js <- THIN ADAPTER (this stage's new code)
        |  calls, unmodified
        v
agents/index.js            <- listAgentCatalog, runAgentWithReport, checkCompatibility
        |
        v
agents/framework/*.js       <- registry, executor, report wrapper, catalog
        |
        v
agents/architecture-remediation/  <- the one real Agent, completely untouched
```

agent-tools.js contains zero planning logic, zero decision logic, zero
analysis logic, zero generation logic, zero report construction. Every
handler is a direct call to listAgentCatalog(), runAgentWithReport(), or
checkCompatibility(), unmodified.

## Tool reference

### agent_list

No arguments. Returns the real Agent Catalog (listAgentCatalog())
unchanged.

### agent_run

```jsonc
{ "id": "architecture-remediation", "context": { "sourceFiles": [{ "path": "x.js", "content": "..." }] } }
```

Also accepts `projectRoot` (auto-discovers context via Project Discovery,
mutually exclusive with `context`), `includeKnowledgeGraph` (attaches the
live WordPress Knowledge Graph as `context.knowledgeGraph`), and
`memoryScope` (attaches that scope's Memory snapshot history as
`context.memoryHistory`) -- all resolved by the same `resolveContext()`
pattern documented in full in `docs/ADVISOR-MCP.md`, reused identically
here.

Delegates to runAgentWithReport(id, context) unchanged. Returns the full
Agent Report exactly as the framework produces it.

### agent_checkCompatibility

```jsonc
{ "id": "architecture-remediation" }
```

Delegates to checkCompatibility(id) unchanged.

## Error handling — the same convention established in Stage 4J

runAgentWithReport() never throws -- it encodes "unknown agent" as
success: false in an otherwise well-formed report. checkCompatibility()
similarly never throws for an unknown agent id -- it encodes that as a
non-null error field alongside compatible: false. Note the important
distinction: a REGISTERED agent with genuinely missing dependencies also
reports compatible: false, but with error: null -- that's a legitimate
answer, not a failure, and must NOT be surfaced as an MCP error.
mcp-server/index.js's response-shaping logic reflects this exactly:

```js
isError:
  (["advisor_run", "advisor_runMany", "agent_run"].includes(name) && result?.success === false) ||
  (name === "agent_checkCompatibility" && Boolean(result?.error)),
```

Invalid MCP request shape (missing/wrong-typed id) is caught by the thin
adapter-level check in agent-tools.js, surfacing via index.js's existing
top-level try/catch -- the same path every other tool already uses.

## Verified: unchanged embedded Agent Reports

A dedicated test confirms handleAgentRun's two-step real workflow
(Architecture Advisor finding a genuine layer violation, then the
dry-run Theme Generator step) returns the exact same shape
runAgentWithReport() itself produces -- nothing is restructured,
filtered, or renamed at the MCP layer.

## Real MCP invocation testing

A spawned real server process was used for both manual smoke testing and
the formal test suite (agent-mcp-real-invocation.test.js), sending
genuine JSON-RPC over stdio -- not just calling the handler functions
in-process. This confirmed the full real protocol round-trip, including
isError: true correctly firing for an unknown agent on both agent_run
and agent_checkCompatibility, and confirmed agent and advisor tool calls
can be interleaved in one session without interference.

## Usage

```js
// via tools/call, exactly like any other MCP tool:
// { name: "agent_run", arguments: { id: "architecture-remediation", context: {...} } }
```

## Explicitly out of scope

- No Agent-of-agent orchestration through MCP.
- No changes to the Agent, Advisor, or Generator Frameworks.
- Automatic context assembly (`projectRoot`, `includeKnowledgeGraph`,
  `memoryScope`) is documented above -- it was out of scope at this
  document's original writing but has since shipped (Stages 8E/9B/9C);
  see `docs/ADVISOR-MCP.md` for the full mechanism, reused unchanged here.
