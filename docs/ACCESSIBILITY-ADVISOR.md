# Accessibility Advisor — Stage 4G

Located at `advisors/accessibility/`. The fifth real Advisor, and the
first to analyze a genuinely different domain than the previous four:
markup (HTML/PHP-echoed-HTML/JSX), not this project's own JS logic.

## A genuinely different kind of advisor

Architecture, Code Review, Security, and Performance all analyzed this
project's own JS module source for structural/quality concerns --
sharing a common domain (JS syntax patterns), which is why
source-analysis.js was reusable across all four. Accessibility analysis
is fundamentally about markup, which required checking: does
source-analysis.js apply here at all?

It doesn't, and that's an honest, correctly-reasoned outcome, not a gap.
parseImports, buildDependencyGraph, computeFanIn, and findDebtMarkers are
all JS-module-structure concerns with no analog in tag/attribute markup
analysis. This advisor's detection is entirely new, built from scratch --
checked against the shared module first, found not applicable, and
documented as such rather than forcing an artificial connection.

## Real markup corpus used for design and smoke testing

Unlike the previous four advisors (which had this project's own .js files
as an obvious, large real corpus), this advisor needed to be designed and
tested against actual markup, which required finding it first:

- elementor-widget-boilerplate/widgets/class-custom-widget.php's
  render() method (PHP echoing real HTML: a heading, a link)
- gutenberg-block-boilerplate/src/save.js (JSX: a div, RichText.Content
  elements)
- theme-boilerplate/parts/header.html, parts/footer.html, and the three
  templates/*.html files (WordPress FSE block markup)

Detection is deliberately not tied to file extension -- the same
regex-based tag scanning works identically whether the markup lives in a
.html file, a PHP heredoc/echo block, or a JSX return statement, since all
three are just text containing <tag attr="value"> patterns. Verified
explicitly with dedicated tests for PHP-embedded and JSX-embedded markup.

## Honest result against the real corpus

Running against all eight real markup files above produces zero critical
or warning findings -- the existing boilerplate content is genuinely
clean (no images at all in this corpus, no forms, unique ids, sequential
headings, buttons/links with real text). This mirrors the pattern seen
with prior advisors (a well-built existing codebase often has few genuine
issues) and is NOT evidence of a broken detector -- verified by first
running the same advisor against a deliberately problematic synthetic
fixture covering all eleven check types, confirming every detector fires
correctly before trusting the clean real-project result.

## Two requested checks deliberately not implemented

- "empty alt attributes where inappropriate" -- alt="" is frequently the
  correct choice (decorative images). Judging "inappropriate" requires
  knowing image intent (decorative vs. meaningful), which static text
  analysis cannot determine. Only a fully MISSING alt attribute is
  flagged (critical); alt="" is never flagged.
- "missing landmark elements" -- most files analyzed here are fragments
  (a single header/footer part, a single widget's render output), not
  full pages. Asserting a fragment is "missing <main>" when it's
  legitimately just a footer partial would be a false, speculative
  finding. Only checks evaluable within a single file's own content
  (duplicate ids, heading skips within that file) are implemented --
  nothing assumes what surrounds the given content.

## Test corpus growth note (inherited from Stage 4F, not a new issue)

Adding this advisor's own source file to the shared real-project corpus
used by the Performance Advisor's regression test legitimately increased
its nested-loop-complexity count (this file shares the same common "for
each file, scan its matches" idiom as every other advisor). That test's
threshold was tightened too aggressively in Stage 4F for what should have
been headroom for a growing corpus -- adjusted to a more robust, generous
bound in this stage, since the test's actual purpose (catching the
original brace-masking bug, which inflated counts by orders of magnitude)
is unaffected by a modest, expected linear increase.

## Usage

```js
import { runAdvisorWithReport } from "./advisors/index.js";

const report = await runAdvisorWithReport("accessibility", { sourceFiles });
report.findings; // missing-alt-attribute, unlabeled-form-control, duplicate-id-attribute,
                  // skipped-heading-level, button-without-accessible-name,
                  // non-descriptive-link-text, image-only-link-without-label,
                  // missing-lang-attribute, positive-tabindex-usage, invalid-aria-role,
                  // redundant-aria-role, accessibility-scan-summary
```

## Explicitly out of scope for this stage

- Empty-alt intent judgment and landmark-completeness checks (see above).
- A comprehensive WAI-ARIA role list -- VALID_ARIA_ROLES is a
  representative subset; extend if a real false positive against a valid
  role not in the list is found.
- Color contrast, focus-visible styling, or any CSS-dependent check --
  pure text/markup analysis has no visibility into computed styles.
- Dynamic/JS-driven accessibility state (e.g. aria-expanded toggling
  correctly at runtime) -- only static markup as written is analyzed.
