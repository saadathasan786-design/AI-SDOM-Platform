# Adapter Context Resolution Refactoring — Stage 10B

Extracts the narrow, evidence-based duplication identified in Stage 10A
into `project-discovery/resolve-project-source.js`, migrating all three
CLI files and all three MCP tool files to use it.

## Helper responsibility

`resolveProjectSource({ context, projectRoot })` does exactly three
things, and nothing else:

1. Validates that `context` and `projectRoot` are not both supplied.
2. If `projectRoot` is supplied, calls the existing, unmodified
   `discoverProject()`.
3. Translates the result into a neutral shape:
   `{ ok: true, context }` or `{ ok: false, error }`.

It never throws. It never loads a JSON file. It never touches Knowledge
Graph or Memory.

## Dependency direction

`resolveProjectSource()` depends on exactly one thing:
`discoverProject()` (`project-discovery/discover-project.js`) -- the
same, single import this module has, confirmed by a dedicated test
asserting the file's import list contains exactly one line. Nothing
depends on `resolveProjectSource()` except the six adapter files that
were migrated to use it. No framework imports it; it imports no
framework.

## Adapter ownership

Each adapter keeps full ownership of everything the helper does not do:

- **CLI** keeps its own mutual-exclusivity check, with its own
  pre-existing, byte-for-byte error wording
  ("--context and --project-root are mutually exclusive; specify only
  one."), and its own loadContextFile() JSON-loading logic -- the
  helper's own internal mutual-exclusivity check is deliberately never
  reached from CLI's call sites (CLI calls resolveProjectSource({
  projectRoot }) only, after its own check already passed), preserving
  CLI's own wording exactly.
- **MCP** delegates its entire mutual-exclusivity check to the helper
  directly, since MCP's own pre-existing wording ("Supply either
  'context' or 'projectRoot', not both.") was already byte-identical
  to the helper's -- confirmed during migration, not assumed. MCP keeps
  its own Knowledge Graph loading, Memory loading, context merging, and
  throw-based error convention entirely unchanged, wrapping the
  helper's neutral result in one `if (!resolved.ok) throw new
  Error(resolved.error);` line.

## Why Knowledge Graph and Memory remain outside the helper

Stage 10A's own responsibility analysis found zero cross-adapter
duplication for either: only MCP ever calls buildProjectGraph() or
memory-store.js's listSnapshots(). Moving logic that only one adapter
family uses into a "shared" module would be relocation, not
deduplication -- Stage 10A's Section 4 (Common Abstraction Analysis)
explicitly found no genuine shared behavior there to justify it. Each
MCP file therefore keeps its own Knowledge Graph and Memory handling
exactly where it already was.

## A real behavioral difference found and correctly preserved

During migration, CLI's and MCP's pre-existing mutual-exclusivity error
wording were found to differ ("--context and --project-root are
mutually exclusive; specify only one." vs. "Supply either 'context'
or 'projectRoot', not both."). The helper adopts MCP's wording (since
that's what all three MCP files' pre-existing behavior already used),
and CLI's own local check is deliberately kept in place rather than
routed through the helper's own check, to avoid any change to CLI's
own, separately-tested, pre-existing output. This was caught during
migration -- a formal test failed immediately -- and fixed before
proceeding, not discovered afterward.

## What was NOT touched

discoverProject(), buildProjectGraph(), memory-store.js, every
framework file, every VS Code extension, every CLI flag, every MCP tool
schema, and the public behavior of every adapter -- all confirmed
unchanged via the complete regression suite requiring zero test
assertion changes anywhere.

## Line count evidence

```
CLI resolveContext():  24 -> 24 lines each (unchanged total, since CLI
                        kept its own necessary mutual-exclusivity
                        wrapper; the discoverProject() call itself is
                        now centralized in resolve-project-source.js,
                        removed from all three CLI files' direct
                        imports)
MCP resolveContext():  28 -> 19 lines each (9 lines saved per file,
                        27 lines total, since MCP fully delegates both
                        the mutual-exclusivity check and projectRoot
                        resolution)
```

The `discoverProject()` import itself -- previously present in all six
files -- now exists in exactly one file
(`project-discovery/resolve-project-source.js`), confirmed via `grep`.
