# AI-SDOM — AI-Assisted WordPress Development Platform

A full-stack WordPress AI development platform: a WordPress boilerplate
codebase plus a layered framework system (Generators, Advisors, Agents,
Workflows) exposed to Claude through a CLI, an MCP server, and VS Code
extensions — giving Claude structured, auditable tools for scaffolding,
analyzing, remediating, and orchestrating work across a WordPress project.

## Production status

The core platform (Stages 1–15) is production-frozen. All four frameworks,
all adapters, Project Discovery, Knowledge Graph and Memory integration, and
every promoted shared utility have been independently, evidence-first
certified — see `docs/PRODUCTION-READINESS.md` for the current certification
summary and `docs/VERSION-HISTORY.md` for the full stage-by-stage history.

## High-level architecture

Four layered frameworks, each with the same five-part shape (Registry,
Interface, Executor, Report wrapper, Catalog), sit beneath three adapters
that expose them to Claude:

```
Workflow Framework   (orchestrates Agents)
        │
   Agent Framework    (orchestrates Advisors + Generators)
        │        │
Advisor Framework   Generator Framework
        │        │
   framework-shared/   (registry-core.js, catalog-core.js — cross-framework core)
```

- **Generator Framework** (`generators/`) — scaffolds real WordPress code
  (plugins, themes, CPTs/taxonomies, ACF field groups, REST routes,
  Elementor widgets, Gutenberg blocks) with preview/dry-run/write modes and
  transactional rollback. Currently registers 7 real generators: `plugin`,
  `theme`, `cpt-taxonomy`, `acf-field-group`, `rest-api`, `elementor-widget`,
  `gutenberg-block`.
- **Advisor Framework** (`advisors/`) — pure, read-only analysis functions
  that inspect source files and return structured findings (architecture,
  code quality, security, performance, accessibility, plus three
  WordPress-specific advisors). Currently registers 8 real advisors.
- **Agent Framework** (`agents/`) — orchestrates one or more Advisors and,
  when warranted, a Generator's dry-run, deciding `continue`/`skip`/`stop`/
  `fail` after each step. Currently registers 5 real agents.
- **Workflow Framework** (`workflows/`) — orchestrates a fixed sequence of
  Agents, deciding `continue`/`stop`/`fail` after each step. Currently
  registers 4 real workflows.
- **`framework-shared/`** — the genuinely cross-framework core (registry
  register/get/has, catalog isAvailable) shared by all four frameworks,
  promoted only after real, byte-identical duplication accumulated across
  them (Stage 14B). Subsystem-specific behavior (e.g. the Generator
  Registry's legacy `id || name` key fallback) stays local to its own
  framework, never folded into this shared core.

## Context subsystems (adapter-owned, framework-unaware)

- **Project Discovery** (`project-discovery/`) — reads a local project
  directory into a `{ sourceFiles, workspaceMetadata, projectType,
  wordpressMetadata }` context object. Used by CLI, MCP, and VS Code.
- **Knowledge Graph** (`mcp-server/knowledge-graph.js`) — aggregates a
  *live* WordPress site's REST API state (settings, post types, taxonomies,
  active plugins/theme) into one versioned object. MCP-only today, since
  only the MCP server has an authenticated WordPress REST client.
- **Memory** (`mcp-server/memory-store.js`) — a file-backed snapshot store
  for verified facts, scoped by `client_id`/`project_id`. MCP-only today,
  for the same reason as Knowledge Graph.

No framework ever fetches any of these itself — every framework's context
is filtered down to exactly its own declared `inputRequirements` before its
`analyze()`/`plan()` runs, so an unused context field (e.g. `knowledgeGraph`
for an advisor that never declared it) is structurally invisible to that
component, not merely unused by convention.

## Adapters

- **CLI** (`cli/`) — `advisor-cli.js`, `agent-cli.js`, `workflow-cli.js`.
  Supports `--context <file>` or `--project-root <dir>` (mutually
  exclusive) to supply input.
- **MCP Server** (`mcp-server/`) — exposes every framework as MCP tools
  (`advisor_run`, `agent_run`, `workflow_run`, etc.), plus real WordPress
  REST API tools (`wp_list_posts`, media uploads, WooCommerce, Knowledge
  Graph, Memory). The only adapter with Knowledge Graph/Memory integration.
- **VS Code extensions** (`vscode-advisor-extension/`,
  `vscode-agent-extension/`, `vscode-workflow-extension/`) — QuickPick-based
  context selection (current file, open editors, JSON file, or — for the
  Agent and Workflow extensions — "Discover from a folder").

## Repository layout

```
wp-dev-boilerplate/
├── generators/              Generator Framework + 7 real generators
├── advisors/                Advisor Framework + 8 real advisors
├── agents/                  Agent Framework + 5 real agents
├── workflows/                Workflow Framework + 4 real workflows
├── framework-shared/         Cross-framework registry/catalog core
├── project-discovery/        Local-filesystem context discovery
├── cli/                      advisor-cli.js, agent-cli.js, workflow-cli.js
├── mcp-server/                MCP server: framework tools + WP REST + KG + Memory
├── vscode-advisor-extension/  VS Code: run Advisors
├── vscode-agent-extension/    VS Code: run Agents
├── vscode-workflow-extension/ VS Code: run Workflows
├── memory/                    Memory Store's on-disk snapshot data
├── docs/                      Per-subsystem docs, architecture, standards
├── theme-boilerplate/         Original WP theme scaffold (Block/FSE theme)
├── plugin-boilerplate/        Original WP plugin scaffold (CPTs, ACF, REST)
├── elementor-widget-boilerplate/
├── gutenberg-block-boilerplate/
└── woocommerce-customizations/
```

## Typical execution flow

1. An adapter (CLI/MCP/VS Code) assembles a `context` object — from a JSON
   file, the current editor, or Project Discovery's `--project-root`/
   "Discover from a folder", optionally layering in Knowledge Graph/Memory
   (MCP only).
2. The adapter calls `run*WithReport(id, context)` on the relevant
   framework's public `index.js`.
3. The framework executor filters `context` down to exactly the
   component's declared `inputRequirements`, then runs it.
4. A structured, never-throws report comes back — an Advisor Report, an
   Agent Report (embedding real Advisor/Generator reports unchanged), or a
   Workflow Report (embedding real Agent Reports unchanged).

## Where to go next

- `docs/REPOSITORY-ARCHITECTURE.md` — the complete, whole-system dependency
  graph and architectural certification.
- `docs/ENGINEERING-STANDARDS.md` — the promotion discipline and
  architectural boundaries this repository follows.
- `docs/CONTRIBUTING.md` — how to add a new Generator/Advisor/Agent/
  Workflow without breaking any existing contract.
- Per-subsystem docs (`docs/ADVISOR-FRAMEWORK.md`, `docs/AGENT-FRAMEWORK.md`,
  etc.) for deep dives into any one layer.
- `docs/SECURITY-CHECKLIST.md` / `docs/PERFORMANCE-CHECKLIST.md` — before
  deploying the underlying WordPress boilerplate to production.
- `mcp-server/README.md` — MCP server setup (Application Passwords,
  WooCommerce Consumer Key/Secret, Local by Flywheel's self-signed SSL).
