# Documentation Standards

Conventions this repository's documentation follows, consolidated from
existing practice.

## One document per real component

Every real Generator, Advisor, Agent, and Workflow has its own dedicated
`docs/` file, named after the component (e.g. `SECURITY-ADVISOR.md`,
`AGENT-ARCHITECTURE-REMEDIATION.md`). A new component should get a new
doc following the same naming pattern before it is considered complete.

## One document per promoted shared utility

Every promoted shared utility has its own dedicated doc (e.g.
`PHP-PARSING.md`, `REGISTRY-CORE.md`), each covering, at minimum:

- Purpose
- Ownership
- Public API
- Consumers
- Promotion rationale
- Why the extraction boundary was chosen
- Why surrounding logic remained local
- Dependency rules
- Future extension guidance

A promotion is not complete until its doc exists — this was itself a
finding of Stage 15B (six promoted utilities existed in code with zero
corresponding documentation) corrected in Stage 15C.

## Per-adapter documentation

Each framework has one doc per adapter (e.g. `ADVISOR-CLI.md`,
`ADVISOR-MCP.md`, `ADVISOR-VSCODE.md`), covering architecture, the tool/
command reference, error handling, and context assembly (including
Project Discovery, Knowledge Graph, and Memory integration where
applicable).

## Never describe shipped functionality as future work

A "Limitations" or "Explicitly out of scope" section describing a
capability as unbuilt must be corrected the moment that capability ships.
Stage 15B found several such stale sections (describing automatic
context assembly and Knowledge Graph/Memory integration as future work
years after both shipped); Stage 15C corrected them. Future stages should
check every "future work" or "out of scope" note against current
implementation before treating a document as current.

## Cross-referencing

Prefer linking to another doc's own authoritative section over
duplicating its content — e.g. `AGENT-MCP.md`'s context-assembly section
points to `ADVISOR-MCP.md`'s fuller explanation rather than repeating it,
since all three MCP tool files share the identical mechanism.

## Repository-level documentation

Five repository-wide documents exist alongside the per-subsystem docs:
`REPOSITORY-ARCHITECTURE.md`, `REPOSITORY-STRUCTURE.md`,
`ENGINEERING-STANDARDS.md`, `DOCUMENTATION-STANDARDS.md` (this file),
`CONTRIBUTING.md`, `VERSION-HISTORY.md`, and `PRODUCTION-READINESS.md`.
The repository-root `README.md` is the primary entry point and should
always accurately reflect the platform's current, real scope — not the
state of any earlier point in its development.

## Terminology consistency

- "Advisor"/"Agent"/"Workflow"/"Generator" (capitalized) refer to the
  framework or a registered component; lowercase forms refer to the
  general concept.
- "Framework" refers to one of the four layered systems
  (Generator/Advisor/Agent/Workflow); "subsystem" is used more broadly
  for Project Discovery, Knowledge Graph, and Memory, none of which are
  frameworks in this sense.
- "Adapter" refers to CLI, MCP, or a VS Code extension — never to a
  framework or subsystem.
