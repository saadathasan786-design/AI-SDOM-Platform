# Version / Release History

This repository's development proceeded as a sequence of numbered stages,
each independently reviewed and regression-tested before the next began.
This is a summary, not a substitute for each subsystem's own doc.

## Stage 1–3: Foundation

Core Boilerplate, Platform API dispatcher, Knowledge Graph MVP, Memory
Store, and the Generator Framework foundation (registry, interface,
executor, catalog) plus the first real generators (plugin, theme,
CPT/taxonomy, ACF field group, REST API, Elementor widget, Gutenberg
block).

## Stage 4: Advisor Framework

Advisor Framework foundation plus five generic real Advisors
(architecture, code-review, security, performance, accessibility). First
shared-utility promotion: `source-analysis.js` (Stage 4D).

## Stage 5: Agent Framework

Agent Framework foundation plus three generic real Agents
(architecture-remediation, security-remediation, performance-optimization).

## Stage 6: Workflow Framework

Workflow Framework foundation plus two generic real Workflows
(project-health-check, security-audit).

## Stage 7: WordPress specialization

Three WordPress-specific Advisors (wordpress-security,
wordpress-performance, wordpress-hooks-core), two WordPress-specific
Agents (plugin-security-remediation, plugin-performance-optimization),
two WordPress-specific Workflows (plugin-health-audit,
release-readiness). Zero framework modification required for any of
these — confirmed at the Stage 7I final review.

## Stage 8: Project Context Discovery

`project-discovery/` built and integrated into CLI, MCP, and two VS Code
extensions (Agent, Workflow). `vscode-advisor-extension` deliberately
scoped out.

## Stage 9: Knowledge Graph & Memory context integration

`context.knowledgeGraph` and `context.memoryHistory` added as MCP-only,
fully optional context fields — zero framework modification required.

## Stage 10: Adapter context resolution refactoring

The duplicated `discoverProject()`-calling core across CLI and MCP,
promoted into `project-discovery/resolve-project-source.js`.

## Stage 11: Advisor Framework maturity review + promotion

Documentation-drift correction (stale registry-count comments) and
`php-parsing.js` promotion from the three WordPress Advisors.

## Stage 12: Agent Framework maturity review + promotion

Documentation-drift correction and `generator-step-decision.js`
promotion from all five real Agents.

## Stage 13: Workflow Framework maturity review + promotion

`plan-agent-sequence.js` promotion from all four real Workflows (found
byte-identical across all four, not merely pairwise).

## Stage 14: Cross-framework registry/catalog promotion

`framework-shared/registry-core.js` and `catalog-core.js` — the first
promotion to genuinely cross framework boundaries, extracting only the
confirmed byte-identical `register/get/has` and `isAvailable()` core
while preserving every framework's own real specialization (Generator's
key fallback and version-compatibility logic; Agent/Workflow's genuinely
different `checkCompatibility()` dependency counts).

## Stage 15: Whole-system certification

Stage 15A: whole-system architecture certification review (production
-freeze recommended). Stage 15B: documentation certification review
(found significant, quantified documentation drift — a stale README, six
undocumented shared utilities, several stale adapter docs, and an entire
missing category of repository-level documentation). Stage 15C: implemented
every correction Stage 15B identified.

## Release v1.0.0 — Production Release

The AI-SDOM Platform v1.0.0 release packages the production-frozen
architecture and implementation certified through Stage 15A, with the
documentation corrections completed through Stage 15C. The release
includes the four framework families (Generator, Advisor, Agent,
Workflow), WordPress specialization, Project Discovery, Knowledge Graph
and Memory integration, CLI and VS Code adapters, MCP integration and
WordPress control capabilities, together with the governed standards,
procedures, templates, registers, and architecture documentation
established throughout the preceding stages.

Release readiness was additionally validated through the merged
production-readiness work, including 185 MCP tests with zero failures,
zero skipped/cancelled tests, and an `npm audit` result reporting zero
vulnerabilities. The post-merge service-business validator path-resolution
fix was subsequently validated on `main` with a green GitHub Actions
check.

This entry records the intended contents and certification basis of the
v1.0.0 production release; the formal Git tag and GitHub Release are
created only after the release-preparation change is merged and the final
release gate passes.

## Current status

Production-frozen at the architecture and implementation level (Stage
15A); documentation brought current as of Stage 15C; v1.0.0 release
preparation in progress. See `docs/PRODUCTION-READINESS.md` for the
current certification summary.
