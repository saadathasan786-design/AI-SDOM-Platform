# Project Type Detection & WordPress Metadata Discovery (Stage 8C)

Extends project-discovery/discover-project.js (Stage 8B) with two new
optional context fields, implemented in the new
project-discovery/project-type-detection.js: projectType and
wordpressMetadata. Still a single discovery mechanism -- these are pure
post-processing steps over the sourceFiles array discoverProject()
already collects, not a second traversal.

## Context shape (Stage 8B fields unchanged, two new additive fields)

```jsonc
{
  "sourceFiles": [...],
  "workspaceMetadata": { "root": "...", "fileCount": 0, "truncated": false },
  "projectType": "wordpress-plugin" | "wordpress-theme" | "wordpress-site" |
                 "generic-php" | "generic-js" | "mixed" | "monorepo" | "unknown",
  "wordpressMetadata": {
    "pluginHeaders": { "Name": "...", "Version": "...", ... },
    "themeHeaders": { ... },
    "wpContentRoot": "path/to/wp-content",
    "readmeHeaders": { "Stable tag": "...", ... },
    "blockJsonFiles": [{ "path": "...", "content": {...} }],
    "composerJson": {...},
    "packageJson": {...}
  }
}
```

Every field under wordpressMetadata is present only when actually
found -- never populated with empty placeholders.

## Backward compatibility

100% preserved: sourceFiles and workspaceMetadata are byte-identical in
shape and meaning to Stage 8B. Every existing Advisor/Agent/Workflow
reads only sourceFiles and ignores unrecognized keys, so the two new
fields are invisible to them. Confirmed by re-running the complete
Stage 8B test suite unchanged except for one exact-shape assertion,
which was correctly updated to include the two new fields (an expected,
stage-mandated change, not a regression).

## Deliberate, honest duplication

PLUGIN_HEADER_PATTERN/THEME_HEADER_PATTERN in project-type-detection.js
are the same regexes already validated by the frozen
wordpress-hooks-core-advisor.js. True import-based reuse is impossible
without modifying that frozen file (its patterns are module-private,
never exported) -- doing so would violate the "don't modify frozen
Advisor code" rule. Duplicating these two small regex literals is
deliberate, documented technical debt, consistent with the exact same
precedent already established across the three WordPress Advisors
themselves (Stage 7D).

## A real bug found and fixed during manual validation

The initial parseReadmeHeaders() implementation treated the
readme.txt's own === Plugin Name === title line (three equals signs) as
a section-break marker meant only for == Section == headings (two
equals signs), causing it to stop parsing before reading any header
field at all. Found via manual validation against a realistic
readme.txt sample BEFORE any formal test was written, and fixed by
distinguishing the three-equals title line (skip) from a genuine
two-equals section heading (stop).

## Project type detection precedence

1. Monorepo -- 2+ independent sub-project manifests (own
   package.json/composer.json, not at the root) -- checked first, since
   correctly identifying "this is several projects" matters more than
   picking one sub-project's type.
2. WordPress site -- a wp-content/ directory exists anywhere.
3. WordPress plugin -- a Plugin Name: header found in any .php file.
4. WordPress theme -- a Theme Name: header found in any .css or .php
   file.
5. Mixed -- both composer.json and package.json present, no WordPress
   signal.
6. Generic PHP / Generic JS -- one manifest type present.
7. Unknown -- none of the above.

## Manual validation performed before the formal suite existed

All eight project types (plugin, theme, site, generic-php, generic-js,
mixed, monorepo, unknown) verified against real, synthetic sample
directories. readme.txt and block.json parsing verified directly (the
readme.txt bug above was found and fixed during this step).
composer.json/package.json parsing into structured objects (not raw
text) verified. Malformed JSON verified to produce an absent field, not
a thrown error, without affecting sibling manifests. False-positive
prevention verified: a generic JS project produces zero
WordPress-specific metadata fields, and a plain-prose mention of
"Plugin Name" in a Markdown file does not trigger plugin detection.

## Zero framework modifications required

Every file outside project-discovery/ is unchanged; no Generator,
Advisor, Agent, Workflow, or adapter file was modified. Full project
regression (1467 tests across every subsystem) passes with zero
failures.

## Explicitly out of scope for this stage

- CLI/MCP/VS Code integration -- no adapter was modified, per this
  stage's explicit instruction.
- Caching, shared-helper extraction across the (now two) consumers of
  the header-parsing pattern -- a single new consumer doesn't yet meet
  this project's own two-real-consumer promotion bar in a way that
  would justify acting now, and doing so would require touching the
  frozen Advisor regardless.
