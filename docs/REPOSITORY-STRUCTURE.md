# Repository Structure

## Top-level layout

```
wp-dev-boilerplate/
├── generators/                Generator Framework + 7 real generators
│   ├── framework/               registry, interface, executor, catalog, injectors
│   ├── plugin/, theme/, cpt-taxonomy/, acf-field-group/, rest-api/,
│   │   elementor-widget/, gutenberg-block/, portfolio-starter-pack/
│   └── test/
├── advisors/                  Advisor Framework + 8 real advisors
│   ├── framework/                registry, interface, executor, report,
│   │                              catalog, source-analysis, php-parsing
│   ├── architecture/, code-review/, security/, performance/,
│   │   accessibility/, wordpress-security/, wordpress-performance/,
│   │   wordpress-hooks-core/
│   └── test/
├── agents/                    Agent Framework + 5 real agents
│   ├── framework/                registry, interface, executor, report,
│   │                              catalog, generator-step-decision
│   ├── architecture-remediation/, security-remediation/,
│   │   performance-optimization/, plugin-security-remediation/,
│   │   plugin-performance-optimization/
│   └── test/
├── workflows/                  Workflow Framework + 4 real workflows
│   ├── framework/                 registry, interface, executor, report,
│   │                               catalog, plan-agent-sequence
│   ├── project-health-check/, security-audit/, plugin-health-audit/,
│   │   release-readiness/
│   └── test/
├── framework-shared/           Cross-framework registry/catalog core
│   ├── registry-core.js, catalog-core.js
│   └── test/
├── project-discovery/          Local-filesystem context discovery
│   ├── discover-project.js, project-type-detection.js,
│   │   resolve-project-source.js
│   └── test/
├── cli/                        advisor-cli.js, agent-cli.js, workflow-cli.js
├── mcp-server/                  MCP server: framework tools, WP REST client,
│   │                             Knowledge Graph, Memory Store, Platform API,
│   │                             Elementor service (elementor.js, elementor-tools.js)
│   └── test/
├── 03-PROCEDURES/                Governed procedures (PRC-0002, PRC-0003, PRC-0004)
├── 04-TEMPLATES/                 Governed templates (ADR template)
├── 05-REGISTERS/                 Governed registers (ADR register)
├── 06-DECISIONS/                 Governed decisions (ADRs, e.g. AI-SDOM-ADR-0001)
├── vscode-advisor-extension/    VS Code: run Advisors
├── vscode-agent-extension/       VS Code: run Agents
├── vscode-workflow-extension/     VS Code: run Workflows
├── memory/                       Memory Store's on-disk snapshot data
├── docs/                         All documentation (this file's own directory)
├── theme-boilerplate/            Original WP theme scaffold (Block/FSE theme)
├── plugin-boilerplate/           Original WP plugin scaffold (CPTs, ACF, REST)
├── elementor-widget-boilerplate/
├── gutenberg-block-boilerplate/
└── woocommerce-customizations/
```

## Naming conventions

- Each framework's own directory is plural (`generators/`, `advisors/`,
  `agents/`, `workflows/`); each real component's own directory is
  singular and hyphenated (`architecture-remediation/`,
  `plugin-health-audit/`).
- Each framework's internal machinery lives in a `framework/`
  subdirectory, distinct from the real components registered into it.
- Every subsystem's own tests live in a sibling `test/` directory.
- Cross-framework shared code lives in `framework-shared/` (framework
  layer); adapter-shared code lives in `project-discovery/` (adapter
  layer) — these are two distinct architectural tiers, never merged.

## Where new work belongs

- A new **Generator/Advisor/Agent/Workflow** gets its own directory
  beside its siblings, registered into its framework's `index.js`.
- A capability needed by **two or more real components within one
  framework** may be promoted into that framework's own `framework/`
  directory, following the precedent in `docs/SOURCE-ANALYSIS.md`,
  `docs/PHP-PARSING.md`, `docs/GENERATOR-STEP-DECISION.md`, or
  `docs/PLAN-AGENT-SEQUENCE.md`.
- A capability needed by **two or more frameworks** may be promoted into
  `framework-shared/`, following the precedent in
  `docs/REGISTRY-CORE.md`/`docs/CATALOG-CORE.md`.
- A capability needed by **two or more adapters** may be promoted into
  `project-discovery/` or an equivalent new adapter-shared directory.

See `docs/ENGINEERING-STANDARDS.md` for the full promotion discipline.
