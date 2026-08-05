# PHP Parsing Utilities — `advisors/framework/php-parsing.js`

## Purpose

Three generic, domain-agnostic PHP-text-parsing helpers: string-literal
masking (so bracket-depth counting isn't confused by a brace/paren that
happens to appear inside a string), balanced-parenthesis call extraction,
and line-number lookup from a character index.

## Ownership

Lives in `advisors/framework/` — owned by the Advisor Framework, since all
three consumers are WordPress-specialization Advisors.

## Public API

- `maskPhpStrings(content)` — masks single/double-quoted string literal
  contents with spaces (preserving length and newlines), handling escaped
  quotes correctly.
- `extractBalancedParens(content, openParenIndex)` — given an opening
  paren's index, returns the substring spanning that call's balanced
  parens, using a masked copy only to find the correct depth-matched
  closing paren; falls back to a bounded window for malformed/unbalanced
  input rather than scanning unbounded.
- `findLineNumber(content, index)` — 1-based line number for a character
  index.

## Consumers

Three real WordPress Advisors: `wordpress-security-advisor.js`,
`wordpress-performance-advisor.js`, `wordpress-hooks-core-advisor.js`.

## Promotion rationale

Promoted in Stage 11B, following the exact same evidence-first precedent
as `source-analysis.js` (Stage 4D). Independently, fresh `diff` confirmed
all three implementations byte-identical (or, for the paren-extraction
function, identical modulo one naming difference —
`wordpress-security-advisor.js` originally called its copy
`extractBalancedCall`).

## Why this extraction boundary was chosen

Only the three generic helpers were extracted. `extractBalancedBraces()`
(unique to `wordpress-performance-advisor.js`, for loop-body extraction)
was never duplicated anywhere else and was deliberately left local.

## Why surrounding logic remained local

Every domain-specific regex pattern and every `find*()` detection function
in all three WordPress Advisors is unique to its own domain (nonce
verification, query-in-loop detection, deprecated-function usage, etc.)
and was never duplicated — promoting it would have been scope creep beyond
what the evidence supported.

## Dependency rules

Zero imports. Never imports Project Discovery, Knowledge Graph, Memory,
adapters, or any subsystem's internals.

## Future extension guidance

A fourth WordPress Advisor needing PHP string-masking or balanced-paren
extraction should import this module directly. Do not add PHP-comment
stripping, heredoc/nowdoc handling, or a real PHP parser here unless a
real, evidenced need arises — the current masking-only approach is a
deliberate, documented trade-off, not an oversight.
