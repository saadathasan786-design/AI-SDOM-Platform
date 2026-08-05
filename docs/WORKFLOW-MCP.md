# Workflow MCP Integration

Located at `mcp-server/workflow-tools.js`, wired into `mcp-server/index.js`.
Exposes the Workflow Framework (`workflows/`) through three MCP tools,
following exactly the same architectural discipline as advisor-tools.js
(Stage 4J) and agent-tools.js (Stage 5D).

## Architecture

```
MCP Client
        |  JSON-RPC over stdio
        v
mcp-server/index.js         <- tool registration + dispatch (existing pattern, unchanged)
        |  imports
        v
mcp-server/workflow-tools.js <- THIN ADAPTER (this stage's new code)
        |  calls, unmodified
        v
workflows/index.js            <- listWorkflowCatalog, runWorkflowWithReport, checkCompatibility
        |
        v
workflows/framework/*.js       <- registry, executor, report wrapper, catalog
        |
        v
workflows/{project-health-check,security-audit}/  <- the two real Workflows, completely untouched
        |
        v
agents/ -> advisors/ + generators/ (dry-run)       <- the full existing chain, completely untouched
```

workflow-tools.js contains zero planning logic, zero decision logic,
zero analysis logic, zero generation logic, zero report construction.
Every handler is a direct call to listWorkflowCatalog(),
runWorkflowWithReport(), or checkCompatibility(), unmodified.

## Tool reference

### workflow_list

No arguments. Returns the real Workflow Catalog (listWorkflowCatalog())
unchanged.

### workflow_run

```jsonc
{ "id": "project-health-check", "context": { "sourceFiles": [{ "path": "x.js", "content": "..." }] } }
```

Also accepts `projectRoot` (auto-discovers context via Project Discovery,
mutually exclusive with `context`), `includeKnowledgeGraph`, and
`memoryScope` -- all resolved by the same `resolveContext()` pattern
documented in full in `docs/ADVISOR-MCP.md`, reused identically here.

Delegates to runWorkflowWithReport(id, context) unchanged. Returns the
full Workflow Report exactly as the framework produces it -- including
every embedded Agent Report and, nested within those, every embedded
Advisor/Generator report, all unchanged.

### workflow_checkCompatibility

```jsonc
{ "id": "project-health-check" }
```

Delegates to checkCompatibility(id) unchanged.

## Error handling — the same convention established in Stage 4J/5D

runWorkflowWithReport() never throws -- it encodes "unknown workflow" as
success: false in an otherwise well-formed report. checkCompatibility()
similarly never throws for an unknown workflow id -- it encodes that as
a non-null error field alongside compatible: false. A REGISTERED
workflow with genuinely missing agent dependencies also reports
compatible: false, but with error: null -- a legitimate answer, not a
failure, and correctly NOT surfaced as an MCP error.
mcp-server/index.js's response-shaping logic reflects this exactly:

```js
isError:
  (["advisor_run", "advisor_runMany", "agent_run", "workflow_run"].includes(name) && result?.success === false) ||
  (["agent_checkCompatibility", "workflow_checkCompatibility"].includes(name) && Boolean(result?.error)),
```

## Verified: unchanged embedded reports, three levels deep

Dedicated tests confirm handleWorkflowRun's real execution (Security
Audit Workflow finding a genuine eval() call) returns the exact shape
each layer's own framework produces -- the Workflow Report, the embedded
Agent Report, and the embedded Advisor Report all match their documented
key sets exactly, with zero restructuring at any layer.

## Real MCP invocation testing

A spawned real server process was used for both manual smoke testing and
the formal test suite (workflow-mcp-real-invocation.test.js), sending
genuine JSON-RPC over stdio. This confirmed the complete real chain --
Workflow -> Workflow Framework -> real Workflows -> real Agents -> real
Advisors -> real Generators (dry-run) -- executes correctly through
actual transport, including both real Workflows (with their genuinely
different agent orders) running successfully, and confirmed workflow,
agent, and advisor tool calls can be freely interleaved in one session.

## Usage

```js
// via tools/call, exactly like any other MCP tool:
// { name: "workflow_run", arguments: { id: "security-audit", context: {...} } }
```

## Explicitly out of scope

- No workflow composition through MCP, no retries or resume support.
- No changes to any Workflow, the Workflow Framework, the Agent
  Framework, the Advisor Framework, or the Generator Framework.
- Automatic context assembly (`projectRoot`, `includeKnowledgeGraph`,
  `memoryScope`) is documented above -- it was out of scope at this
  document's original writing but has since shipped (Stages 8E/9B/9C);
  see `docs/ADVISOR-MCP.md` for the full mechanism, reused unchanged here.
