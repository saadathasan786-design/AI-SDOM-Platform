/**
 * WordPress Performance Advisor — second real WordPress-specific
 * Advisor (Stage 7C). Static, regex/pattern-based analysis of common
 * WordPress performance anti-patterns: repeated meta/option lookups,
 * query calls inside loops (N+1), WP_Query without a result limit,
 * WP_Query without no_found_rows, and expensive RAND()-based ordering.
 *
 * IDENTICAL CONTRACT to every existing Advisor: { id, name, version,
 * category, description, inputRequirements: ["sourceFiles"], analyze }.
 * Registered through the existing, unmodified
 * advisors/framework/advisor-registry.js via advisors/index.js -- no
 * Advisor Framework file was touched to build this. This is a
 * completely separate Advisor definition from both the generic
 * Performance Advisor (Stage 4F, JS-focused) and the WordPress Security
 * Advisor (Stage 7B) -- no code is shared between them, matching the
 * exact "separate advisor per domain" precedent Stage 7B established.
 *
 * REPORT SHAPE: uses the EXACT same finding shape every existing
 * Advisor uses -- { id, severity, category, message, recommendation,
 * evidence, location } -- no invented structures.
 *
 * ANALYSIS ONLY: this file never generates, modifies, or writes a file;
 * never invokes a Generator, Agent, or Workflow; never accesses Memory
 * or the Knowledge Graph. Pure function of sourceFiles in, findings out.
 *
 * NO AST PARSING, NO CONTROL-FLOW ANALYSIS, NO EXECUTION SIMULATION, NO
 * WHOLE-PROGRAM REASONING -- exactly matching every existing Advisor's
 * philosophy and this stage's explicit instruction. Loop-body and
 * function-call-argument extraction use the SAME bracket/paren
 * depth-counting-with-string-masking technique already proven in
 * wordpress-security-advisor.js (Stage 7B) and performance-advisor.js
 * (Stage 4F) -- reused here, not reinvented, since PHP strings can
 * contain the same brace/paren-confusing characters JS strings can.
 *
 * CONSOLIDATION NOTE (same precedent as Stage 7B's Security Advisor):
 * the task's 7 numbered detection-scope bullets describe 5 genuinely
 * distinct code patterns, not 7 -- items #1 ("missing transient/cache
 * for expensive repeated operations") and #2 ("repeated
 * get_post_meta()/get_user_meta()/get_option() lookups") are the SAME
 * underlying evidence (a repeated lookup of the identical key/option is
 * exactly the situation a transient/object-cache would address), and
 * items #3 ("N+1 style metadata/query patterns") and #6 ("expensive
 * database usage suitable for caching") are the SAME underlying
 * evidence (a meta/option/query call sitting inside a loop body). Item
 * #7 ("general best-practice violations justified by direct code
 * evidence") is implemented as one concrete, well-documented real
 * WordPress anti-pattern (ORDER BY RAND()) rather than left as an
 * open-ended, unfalsifiable category.
 *
 * TWO FALSE POSITIVES FOUND AND FIXED DURING MANUAL VALIDATION (see
 * docs/WORDPRESS-PERFORMANCE-ADVISOR.md for the full account): (1) a
 * WP_Query call using an explicit, small posts_per_page was still
 * flagging missing no_found_rows -- kept as suggestion-severity (not
 * warning) deliberately, since no_found_rows is still worth considering
 * even for small limits, but this confirms it should read as a
 * "consider" not a "must-fix"; (2) the repeated-meta-lookup check
 * originally fired once per OCCURRENCE rather than once per repeated
 * key, producing noisy duplicate findings for the same underlying
 * issue -- fixed to group by key and emit one finding per repeated key
 * per file, listing every occurrence's line number as evidence.
 *
 * Stage 11B: maskPhpStrings(), extractBalancedParens(), and
 * findLineNumber() are now imported from the shared
 * advisors/framework/php-parsing.js, promoted after being found
 * byte-identical across all three WordPress Advisors. This advisor's
 * own domain-specific detection rules remain entirely separate from the
 * other two WordPress Advisors -- only the generic, domain-agnostic
 * PHP-text-parsing utility is shared. extractBalancedBraces() remains
 * local to this file, since it was never duplicated anywhere else.
 */

import { maskPhpStrings, extractBalancedParens, findLineNumber } from "../framework/php-parsing.js";

const GET_POST_META_KEY_PATTERN = /get_post_meta\s*\(\s*[^,]+,\s*['"]([^'"]+)['"]/g;
const GET_USER_META_KEY_PATTERN = /get_user_meta\s*\(\s*[^,]+,\s*['"]([^'"]+)['"]/g;
const GET_OPTION_KEY_PATTERN = /get_option\s*\(\s*['"]([^'"]+)['"]/g;

const LOOP_PATTERN = /\b(for|foreach|while)\s*\([^)]*\)\s*(\{)/g;
const LOOP_BODY_QUERY_PATTERN = /\b(get_post_meta|get_user_meta|get_option|get_posts|new\s+WP_Query)\s*\(|\$wpdb->(query|get_results|get_row|get_var|get_col)\s*\(/;

const WP_QUERY_CALL_PATTERN = /new\s+WP_Query\s*(\()/g;
const RAND_ORDER_PATTERN = /orderby['"]?\s*=>\s*['"]rand['"]/i;

/** Balanced-brace body extraction -- same masking technique, applied to braces instead of parens. Unique to this advisor, never duplicated elsewhere -- not promoted. */
function extractBalancedBraces(content, openBraceIndex) {
  const masked = maskPhpStrings(content);
  let depth = 0;
  for (let i = openBraceIndex; i < masked.length; i++) {
    if (masked[i] === "{") depth++;
    else if (masked[i] === "}") {
      depth--;
      if (depth === 0) return content.slice(openBraceIndex, i + 1);
    }
  }
  return content.slice(openBraceIndex, Math.min(content.length, openBraceIndex + 2000));
}

function findRepeatedMetaLookups(sourceFiles) {
  const findings = [];
  const scans = [
    { pattern: GET_POST_META_KEY_PATTERN, label: "get_post_meta" },
    { pattern: GET_USER_META_KEY_PATTERN, label: "get_user_meta" },
    { pattern: GET_OPTION_KEY_PATTERN, label: "get_option" },
  ];

  for (const file of sourceFiles) {
    for (const { pattern, label } of scans) {
      pattern.lastIndex = 0;
      const occurrences = new Map();
      let match;
      while ((match = pattern.exec(file.content)) !== null) {
        const key = match[1];
        const line = findLineNumber(file.content, match.index);
        if (!occurrences.has(key)) occurrences.set(key, []);
        occurrences.get(key).push(line);
      }

      for (const [key, lines] of occurrences) {
        if (lines.length < 2) continue;
        findings.push({
          id: "repeated-meta-lookup",
          severity: "suggestion",
          category: "wordpress-caching",
          message: `"${file.path}" calls ${label}(..., '${key}', ...) ${lines.length} times (lines ${lines.join(", ")}) -- consider fetching once and reusing the value, or caching it.`,
          recommendation: {
            message:
              "Repeated lookups of the same meta key or option re-query (or re-hit the object cache) each time. Fetch once into a local variable, or wrap in wp_cache_get()/set() or a transient if the value is genuinely expensive to compute.",
          },
          evidence: { path: file.path, key, occurrences: lines, functionName: label },
          location: { file: file.path, line: lines[0] },
        });
      }
    }
  }
  return findings;
}

function findQueryInLoop(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    LOOP_PATTERN.lastIndex = 0;
    let match;
    while ((match = LOOP_PATTERN.exec(file.content)) !== null) {
      const openBraceIndex = match.index + match[0].length - 1;
      const body = extractBalancedBraces(file.content, openBraceIndex);
      const line = findLineNumber(file.content, match.index);

      const bodyMatch = LOOP_BODY_QUERY_PATTERN.exec(body);
      if (!bodyMatch) continue;

      findings.push({
        id: "query-in-loop",
        severity: "warning",
        category: "wordpress-n-plus-one",
        message: `"${file.path}" has a ${match[1]} loop starting at line ${line} whose body calls ${bodyMatch[0].replace(/\($/, "()")} on every iteration -- a classic N+1 pattern.`,
        recommendation: {
          message:
            "Move the query/meta lookup outside the loop and fetch everything needed in one batched call where possible (e.g. update_meta_cache(), a single WP_Query with the needed post IDs, or get_post_meta() calls after a bulk meta cache prime), rather than querying once per iteration.",
        },
        evidence: { path: file.path, line, loopType: match[1], triggeringText: bodyMatch[0] },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findWpQueryIssues(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    WP_QUERY_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = WP_QUERY_CALL_PATTERN.exec(file.content)) !== null) {
      const openParenIndex = match.index + match[0].length - 1;
      const call = extractBalancedParens(file.content, openParenIndex);
      const line = findLineNumber(file.content, match.index);

      const hasLimit = /\b(posts_per_page|numberposts)\s*['"]?\s*=>/.test(call);
      const hasNoFoundRows = /no_found_rows/.test(call);
      const hasRandOrder = RAND_ORDER_PATTERN.test(call);

      if (!hasLimit) {
        findings.push({
          id: "wp-query-missing-limit",
          severity: "warning",
          category: "wordpress-query-performance",
          message: `"${file.path}" instantiates WP_Query at line ${line} without a "posts_per_page" (or "numberposts") argument, which defaults to the site's configured posts-per-page and may return far more rows than intended.`,
          recommendation: {
            message:
              "Set posts_per_page explicitly (a specific number, or -1 only when you genuinely need every matching post and have confirmed the result set is small) so query cost is predictable.",
          },
          evidence: { path: file.path, line, triggeringText: call.slice(0, 200) },
          location: { file: file.path, line },
        });
      }

      if (!hasNoFoundRows) {
        findings.push({
          id: "wp-query-missing-no-found-rows",
          severity: "suggestion",
          category: "wordpress-query-performance",
          message: `"${file.path}" instantiates WP_Query at line ${line} without "no_found_rows" set -- if this query's results are never paginated, WordPress still runs an extra SQL_CALC_FOUND_ROWS-equivalent count query unnecessarily.`,
          recommendation: {
            message:
              "If pagination links are not needed for this query's results, set 'no_found_rows' => true to skip the extra found-rows count query.",
          },
          evidence: { path: file.path, line, triggeringText: call.slice(0, 200) },
          location: { file: file.path, line },
        });
      }

      if (hasRandOrder) {
        findings.push({
          id: "expensive-random-order",
          severity: "warning",
          category: "wordpress-query-performance",
          message: `"${file.path}" orders a WP_Query at line ${line} by 'rand', which forces MySQL to sort the entire matching result set randomly on every request -- expensive as the table grows.`,
          recommendation: {
            message:
              "Avoid 'orderby' => 'rand' on anything but very small result sets. Consider caching a randomized set of IDs periodically instead of re-randomizing on every request.",
          },
          evidence: { path: file.path, line, triggeringText: call.slice(0, 200) },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

/**
 * Pure analysis function. input.sourceFiles is an array of
 * { path, content }.
 */
export async function analyzeWordPressPerformance({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    return findings;
  }

  findings.push(...findRepeatedMetaLookups(sourceFiles));
  findings.push(...findQueryInLoop(sourceFiles));
  findings.push(...findWpQueryIssues(sourceFiles));

  findings.push({
    id: "wordpress-performance-scan-summary",
    severity: "info",
    category: "summary",
    message: `Scanned ${sourceFiles.length} file(s); ${findings.length} WordPress performance-relevant finding(s) before this summary.`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { fileCount: sourceFiles.length, findingCountBeforeSummary: findings.length },
  });

  return findings;
}

export const wordpressPerformanceAdvisor = {
  id: "wordpress-performance",
  name: "WordPress Performance Advisor",
  version: "1.0.0",
  category: "wordpress-performance",
  description:
    "Static WordPress-specific performance analysis: repeated get_post_meta()/get_user_meta()/" +
    "get_option() lookups suggesting a missing cache, meta/option/query calls inside loops (N+1), " +
    "WP_Query without an explicit result limit, WP_Query without no_found_rows, and expensive " +
    "ORDER BY RAND() usage. Read-only, evidence-based -- analysis only, never generates or modifies " +
    "files.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzeWordPressPerformance,
};
