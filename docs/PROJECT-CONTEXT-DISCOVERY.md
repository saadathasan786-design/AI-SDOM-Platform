# Project Context Discovery — Core Utility (Stage 8B)

Located at `project-discovery/discover-project.js`. Implements the
minimum viable subset of the Stage 8A design: recursive traversal,
ignore rules, source file collection, and workspaceMetadata only.

## Architecture

This file exists entirely outside every framework. It has no registry,
no executor, no report wrapper, no catalog -- it is a single exported
function, discoverProject(rootPath, limits), that returns a plain
context object of the exact same shape every adapter already assembles
manually today (vscode-agent-extension/src/context-loader.js,
cli/workflow-cli.js's loadContextFile()). The Generator, Advisor, Agent,
and Workflow Frameworks are completely unaware this file exists and
were not modified in any way.

## Usage

```js
import { discoverProject } from "./project-discovery/discover-project.js";

const result = await discoverProject("/path/to/project");
// { success: true, context: { sourceFiles: [...], workspaceMetadata: {...} }, error: null }
// or
// { success: false, context: null, error: "..." }
```

Any existing Advisor/Agent/Workflow can consume result.context directly
via run*WithReport(id, result.context), unchanged.

## Context shape (exactly as scoped for this stage)

```jsonc
{
  "sourceFiles": [{ "path": "relative/path.js", "content": "..." }],
  "workspaceMetadata": {
    "root": "/abs/path",
    "fileCount": 0,
    "truncated": false
  }
}
```

No WordPress detection, no project-type detection, no plugin/theme
metadata -- all explicitly deferred to future stages per Stage 8A.

## Ignore rules

.git, node_modules, vendor, dist, build, .cache, cache, .next, .nuxt,
coverage, .vscode, .idea -- applied at every depth, not just the root.

## Supported extensions (allowlist, not content sniffing)

.js .jsx .mjs .cjs .ts .tsx .php .json .md .css .scss .less .html .htm
.txt .yml .yaml .xml .sql .sh -- per Stage 8A's explicit "allowlist over
sniffing" decision.

## Limits (overridable per call, defaults shown)

```js
{
  maxFileSize: 300 * 1024,      // 300 KB per file
  maxFileCount: 2000,
  maxTotalSize: 20 * 1024 * 1024, // 20 MB total
  maxDepth: 20,
}
```

When any limit is hit, workspaceMetadata.truncated is set to true and
discovery SUCCEEDS with whatever was already collected -- not an error.

## Symlinks

Never followed -- neither symlinked directories nor symlinked files are
included, a conservative default preventing traversal loops and
accidental escapes.

## Error model — never throws

- Invalid/missing root, or a root that isn't a directory -> structured
  failure: { success: false, context: null, error: "..." }.
- Unreadable directories/files (permission errors, races) -> skipped
  individually, not fatal to the overall discovery.
- Malformed input (null/undefined/non-string root) -> structured
  failure, never an exception.

## Manual validation performed before the formal suite existed

- Small JavaScript project -- correct recursive collection,
  node_modules/.git correctly ignored.
- PHP project -- correct collection, vendor/ correctly ignored.
- WordPress plugin -- correct collection; main file's Plugin Name:
  header content correctly captured verbatim (ready for future
  project-type detection, though not parsed at this stage).
- Empty directory -- succeeds with zero files, not truncated.
- Directory containing only ignored folders -- succeeds with zero
  files.
- Directory exceeding traversal limits -- verified all three limit
  types independently (maxFileCount, maxDepth, maxTotalSize), each
  correctly stopping collection and setting truncated: true.
- Oversized single file -- correctly skipped while smaller files are
  kept.
- Invalid root / non-directory root -- correct structured failures.
- Symlinked directory and file -- correctly not followed/included.
- Unreadable file (permission-denied) -- attempted via chmod 000; this
  container runs as root, which bypasses Unix permission checks, so
  this specific scenario could not be empirically forced to fail. The
  try/catch around every fs.stat/fs.readFile/fs.readdir call is in
  place and structurally identical to the pattern already proven
  correct throughout this project's Advisor/Agent/Workflow error
  handling; this is honestly documented as a manual-validation gap
  caused by the environment, not a skipped requirement.
- Malformed input (null, "", a number, undefined) -- all correctly
  produce a structured failure, never an exception.

## Explicitly out of scope for this stage

- WordPress/project-type detection, plugin/theme header parsing --
  Stage 8A defers these to a later stage.
- CLI/MCP/VS Code integration -- no adapter was modified.
- Caching -- no caching layer exists; per Stage 8A, this awaits real
  usage evidence before being considered.
- Shared helper extraction -- not applicable; this is the first and
  only consumer of this code so far.
- Any framework modification -- zero framework files were touched.

## Zero framework modifications required

Every file outside project-discovery/ is unchanged. Full project
regression (1430 tests across every subsystem) passes with zero
failures (one previously-documented transient spawned-process timing
flake in mcp-server, confirmed clean on repeated re-runs, unrelated to
this utility).
