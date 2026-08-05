# Repository Architecture

The complete, whole-system architecture, as independently certified in
Stage 15A. This document consolidates that certification into a single,
discoverable artifact — it does not introduce new architecture.

## Subsystem boundaries and layering

Four frameworks, each with the same five-part shape (Registry, Interface,
Executor, Report wrapper, Catalog):

```
framework-shared/  (registry-core.js, catalog-core.js -- zero dependencies)
        ^
        | imported by
        |
  Generator          Advisor          <- zero cross-framework dependency between these two
     ^                  ^
     |                  |
     +------- Agent ----+             <- orchestrates both Advisor and Generator
                 ^
                 |
             Workflow                  <- orchestrates Agent only, never reaches past it
```

Two adapter-shared subsystems, architecturally distinct from
`framework-shared/`:

- **Project Discovery** (`project-discovery/`) — zero framework
  dependencies, imported by all three adapter families.
- **Knowledge Graph** / **Memory** (`mcp-server/knowledge-graph.js`,
  `mcp-server/memory-store.js`) — zero framework dependencies, imported
  by the MCP server only.

Three adapters sit above every framework, importing only each framework's
own public `index.js`, never internals:

```
CLI (cli/)  ──┐
MCP (mcp-server/) ──┼──▶ advisors/index.js, agents/index.js,
VS Code (vscode-*-extension/) ──┘   generators/index.js, workflows/index.js
```

## Dependency direction

Strictly one-directional throughout, confirmed via exhaustive fresh
`import`-statement inspection (Stage 15A):

- `framework-shared/` has zero dependencies; every framework depends on
  it, never the reverse.
- `project-discovery/` has zero framework dependencies; every adapter
  depends on it, never the reverse.
- Generator and Advisor depend on nothing but `framework-shared/`.
- Agent depends on Advisor, Generator, and `framework-shared/`.
- Workflow depends on Agent and `framework-shared/` only — it never
  imports Advisor or Generator directly, even though it transitively
  relies on them through Agent.
- No framework or subsystem imports from any adapter (`cli/`,
  `mcp-server/`, `vscode-*-extension/`) — confirmed via an explicit
  reverse-direction search.

**No circular dependency exists anywhere in the repository.**

## Context lifecycle

```
Project Discovery (local filesystem)
        │
        ▼
   Adapter's own context-assembly function
        │
        ▼
(MCP only) optional Knowledge Graph / Memory layering
        │
        ▼
   run*WithReport(id, context)
        │
        ▼
Framework Executor: filters context down to exactly the
component's declared inputRequirements
        │
        ▼
Real consumer (Advisor.analyze / Agent.plan / Workflow.plan)
```

Context is purely additive: every field ever added (`workspaceMetadata`,
`projectType`, `wordpressMetadata`, `knowledgeGraph`, `memoryHistory`) was
layered on top of the original `sourceFiles`-only shape via spread-merge,
never replacing an existing field. All 17 real components (8 Advisors, 5
Agents, 4 Workflows) declare the identical `inputRequirements:
["sourceFiles"]` — meaning every other field is structurally invisible to
every current real component, confirmed by the executor's own filtering
mechanism, not merely by convention.

## Shared utility placement

| Utility | Tier | Scope |
|---|---|---|
| `source-analysis.js` | Advisor Framework | Advisor-only |
| `php-parsing.js` | Advisor Framework | Advisor-only (WordPress specialization) |
| `generator-step-decision.js` | Agent Framework | Agent-only |
| `plan-agent-sequence.js` | Workflow Framework | Workflow-only |
| `registry-core.js` | `framework-shared/` | All four frameworks |
| `catalog-core.js` | `framework-shared/` | All four frameworks |
| `project-discovery/` | Adapter-shared | CLI, MCP, VS Code |
| Knowledge Graph, Memory | MCP-internal | MCP only |

Every promotion followed the same evidence-first discipline: extract only
after real, byte-identical (or documented-near-identical) duplication
across at least two independent consumers; preserve every genuine
specialization locally; never speculate ahead of evidence.

## Production status

Certified production-ready and architecturally complete as of Stage 15A,
independently re-verified against 1671 passing tests across every
subsystem. See `docs/PRODUCTION-READINESS.md` for the current
certification summary and `docs/VERSION-HISTORY.md` for the complete
stage-by-stage history that produced this architecture.
