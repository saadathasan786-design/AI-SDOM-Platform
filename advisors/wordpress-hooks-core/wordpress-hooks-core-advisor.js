/**
 * WordPress Hooks & Core Advisor — third real WordPress-specific
 * Advisor (Stage 7D). Static, regex/pattern-based analysis of common
 * WordPress hook/core-API anti-patterns: deprecated function usage,
 * activation/deactivation hook correctness, incomplete plugin/theme
 * headers, missing/inconsistent text domains, incomplete CPT/taxonomy
 * registration, hook callback argument-count mismatches, and the
 * query_posts() anti-pattern.
 *
 * IDENTICAL CONTRACT to every existing Advisor: { id, name, version,
 * category, description, inputRequirements: ["sourceFiles"], analyze }.
 * Registered through the existing, unmodified
 * advisors/framework/advisor-registry.js via advisors/index.js -- no
 * Advisor Framework file was touched to build this. Completely separate
 * from wordpress-security-advisor.js and wordpress-performance-advisor.js
 * -- no code is shared between any of them at the IMPORT level (see the
 * duplication-quantification note below for why the HELPER CODE is
 * nonetheless intentionally repeated verbatim, not shared).
 *
 * REPORT SHAPE: the EXACT same finding shape every existing Advisor
 * uses -- { id, severity, category, message, recommendation, evidence,
 * location } -- no invented structures.
 *
 * ANALYSIS ONLY: never generates, modifies, or writes a file; never
 * invokes a Generator, Agent, or Workflow. Pure function of sourceFiles
 * in, findings out.
 *
 * NO AST PARSING, NO CONTROL-FLOW ANALYSIS, NO PHP EXECUTION, NO HOOK
 * GRAPH ANALYSIS, NO WHOLE-PROJECT SEMANTIC REASONING -- exactly
 * matching this stage's explicit instruction and every existing
 * Advisor's philosophy.
 *
 * CONSOLIDATION NOTE (same precedent as Stages 7B/7C): the task's 11
 * numbered scope bullets are implemented as 8 concrete rules, not 11.
 * #1 (deprecated functions) and #2 (deprecated hooks) are combined into
 * ONE rule (deprecated-function-usage) -- WordPress's own deprecation
 * mechanism fires from inside the deprecated FUNCTIONS themselves, and
 * there is no separate, reliably-detectable set of deprecated hook
 * NAMES distinct from deprecated function calls that a regex-based
 * Advisor can responsibly flag without inventing a speculative list.
 * #5 (plugin header) and #6 (theme header) are combined into ONE rule
 * (plugin-theme-header-incomplete) -- both are the identical
 * top-of-file docblock header structure, differing only in which
 * marker line ("Plugin Name:" vs "Theme Name:") identifies the file
 * type. #7 (missing/inconsistent text domain) is split into its two
 * genuinely different signals (missing-text-domain,
 * inconsistent-text-domain).
 *
 * ONE ITEM DELIBERATELY NOT IMPLEMENTED, DOCUMENTED AS AN HONEST
 * NON-GOAL: item #8's harder half -- "missing i18n... for user-facing
 * strings where heuristically detectable" as a GENERAL bare-string
 * check. Any bare PHP string literal could be a user-facing label OR
 * an internal identifier, HTML attribute value, array key, or constant
 * -- distinguishing these reliably would require the exact
 * control-flow/semantic reasoning this stage explicitly forbids. The
 * narrower, well-evidenced half of #8 that IS safely detectable
 * (i18n function calls themselves missing their text-domain argument)
 * is implemented as missing-text-domain.
 *
 * Stage 11B: maskPhpStrings(), extractBalancedParens(), and
 * findLineNumber() are now imported from the shared
 * advisors/framework/php-parsing.js, promoted after being found
 * byte-identical across all three WordPress Advisors -- superseding
 * this file's own prior "intentionally repeated verbatim, not shared"
 * note above, which described the pre-promotion state. This advisor's
 * own domain-specific detection rules remain entirely separate from the
 * other two WordPress Advisors -- only the generic, domain-agnostic
 * PHP-text-parsing utility is now shared.
 */

import { maskPhpStrings, extractBalancedParens, findLineNumber } from "../framework/php-parsing.js";

const DEPRECATED_FUNCTIONS = [
  "create_function",
  "get_currentuserinfo",
  "screen_icon",
  "get_settings",
  "like_escape",
  "wp_get_http",
  "wp_tiny_mce",
  "clean_url",
  "attribute_escape",
  "js_escape",
  "get_the_author_description",
  "wp_convert_bytes_to_hr",
];
const DEPRECATED_FUNCTION_CALL_PATTERN = new RegExp(`\\b(${DEPRECATED_FUNCTIONS.join("|")})\\s*\\(`, "g");

const ACTIVATION_HOOK_CALL_PATTERN = /register_(activation|deactivation)_hook\s*(\()/g;

const PLUGIN_HEADER_MARKER_PATTERN = /^\s*\*?\s*Plugin Name:\s*(.+)$/m;
const THEME_HEADER_MARKER_PATTERN = /^\s*\*?\s*Theme Name:\s*(.+)$/m;
const HEADER_VERSION_PATTERN = /^\s*\*?\s*Version:\s*(.+)$/m;
const HEADER_TEXT_DOMAIN_PATTERN = /^\s*\*?\s*Text Domain:\s*(.+)$/m;

const I18N_CALL_PATTERN = /\b(__|_e|esc_html__|esc_attr__|esc_html_e|esc_attr_e)\s*(\()/g;

const REGISTER_POST_TYPE_CALL_PATTERN = /register_post_type\s*(\()/g;
const REGISTER_TAXONOMY_CALL_PATTERN = /register_taxonomy\s*(\()/g;

const QUERY_POSTS_CALL_PATTERN = /\bquery_posts\s*\(/g;

const ADD_HOOK_CALL_PATTERN = /\b(add_action|add_filter)\s*\(\s*['"][^'"]+['"]\s*,\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*,\s*\d+\s*,\s*(\d+)\s*\)/g;
const FUNCTION_DEFINITION_PATTERN = /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/g;

function findDeprecatedFunctionUsage(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    DEPRECATED_FUNCTION_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = DEPRECATED_FUNCTION_CALL_PATTERN.exec(file.content)) !== null) {
      const line = findLineNumber(file.content, match.index);
      findings.push({
        id: "deprecated-function-usage",
        severity: "warning",
        category: "wordpress-deprecated-api",
        message: `"${file.path}" calls ${match[1]}() at line ${line}, a deprecated WordPress function/API.`,
        recommendation: {
          message: `Replace ${match[1]}() with its current, non-deprecated WordPress equivalent (see the WordPress developer reference for the recommended replacement).`,
        },
        evidence: { path: file.path, line, functionName: match[1] },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findActivationHookIssues(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    ACTIVATION_HOOK_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = ACTIVATION_HOOK_CALL_PATTERN.exec(file.content)) !== null) {
      const hookType = match[1];
      const openParenIndex = match.index + match[0].length - 1;
      const call = extractBalancedParens(file.content, openParenIndex);
      const line = findLineNumber(file.content, match.index);

      if (/^\(\s*__FILE__\s*,/.test(call)) continue;

      findings.push({
        id: "activation-hook-not-using-file-constant",
        severity: "suggestion",
        category: "wordpress-hook-correctness",
        message: `"${file.path}" calls register_${hookType}_hook() at line ${line} without __FILE__ as its first argument.`,
        recommendation: {
          message: `register_${hookType}_hook() should be called with __FILE__ as the first argument (called from the plugin's own main file) so WordPress reliably associates the hook with this plugin.`,
        },
        evidence: { path: file.path, line, triggeringText: call.slice(0, 200) },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findHeaderIssues(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const pluginMatch = PLUGIN_HEADER_MARKER_PATTERN.exec(file.content);
    const themeMatch = THEME_HEADER_MARKER_PATTERN.exec(file.content);
    const headerMatch = pluginMatch || themeMatch;
    if (!headerMatch) continue;

    const headerType = pluginMatch ? "Plugin" : "Theme";
    const line = findLineNumber(file.content, headerMatch.index);
    const missing = [];
    if (!HEADER_VERSION_PATTERN.test(file.content)) missing.push("Version");
    if (!HEADER_TEXT_DOMAIN_PATTERN.test(file.content)) missing.push("Text Domain");

    if (missing.length === 0) continue;

    findings.push({
      id: "plugin-theme-header-incomplete",
      severity: "suggestion",
      category: "wordpress-metadata",
      message: `"${file.path}" has a ${headerType} header (line ${line}) missing recommended field(s): ${missing.join(", ")}.`,
      recommendation: {
        message: `Include ${missing.join(" and ")} in the ${headerType.toLowerCase()} header comment -- Version helps users and update checkers track releases, Text Domain is required for translation tools to associate strings with this ${headerType.toLowerCase()}.`,
      },
      evidence: { path: file.path, line, missing },
      location: { file: file.path, line },
    });
  }
  return findings;
}

function findTextDomainIssues(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    I18N_CALL_PATTERN.lastIndex = 0;
    let match;
    const domainsSeen = new Map();

    while ((match = I18N_CALL_PATTERN.exec(file.content)) !== null) {
      const functionName = match[1];
      const openParenIndex = match.index + match[0].length - 1;
      const call = extractBalancedParens(file.content, openParenIndex);
      const line = findLineNumber(file.content, match.index);

      const args = call.slice(1, -1);
      const commaSplit = args.split(",");

      if (commaSplit.length < 2 || commaSplit[1].trim() === "") {
        findings.push({
          id: "missing-text-domain",
          severity: "suggestion",
          category: "wordpress-i18n",
          message: `"${file.path}" calls ${functionName}() at line ${line} without a text domain argument.`,
          recommendation: {
            message: `Pass your plugin/theme's text domain as the final argument to ${functionName}() so translation tools can correctly extract and associate this string.`,
          },
          evidence: { path: file.path, line, functionName },
          location: { file: file.path, line },
        });
        continue;
      }

      const domainMatch = commaSplit[1].match(/^\s*['"]([^'"]+)['"]\s*$/);
      if (domainMatch) {
        const domain = domainMatch[1];
        if (!domainsSeen.has(domain)) domainsSeen.set(domain, line);
      }
    }

    if (domainsSeen.size > 1) {
      const domains = [...domainsSeen.keys()];
      findings.push({
        id: "inconsistent-text-domain",
        severity: "suggestion",
        category: "wordpress-i18n",
        message: `"${file.path}" uses ${domainsSeen.size} different text domains (${domains.join(", ")}) across its i18n calls.`,
        recommendation: {
          message: "A single plugin/theme should consistently use exactly one text domain across all translatable strings.",
        },
        evidence: { path: file.path, domains },
        location: { file: file.path, line: domainsSeen.get(domains[0]) },
      });
    }
  }
  return findings;
}

function findRegistrationArgIssues(sourceFiles, pattern, id, recommendedKeys, label) {
  const findings = [];
  for (const file of sourceFiles) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(file.content)) !== null) {
      const openParenIndex = match.index + match[0].length - 1;
      const call = extractBalancedParens(file.content, openParenIndex);
      const line = findLineNumber(file.content, match.index);

      const missing = recommendedKeys.filter((key) => !new RegExp(`\\b${key}\\b`).test(call));
      if (missing.length === 0) continue;

      findings.push({
        id,
        severity: "suggestion",
        category: "wordpress-registration-completeness",
        message: `"${file.path}" calls ${label} at line ${line} without recommended argument(s): ${missing.join(", ")}.`,
        recommendation: {
          message: `Consider setting ${missing.join(" and ")} explicitly rather than relying on ${label}'s defaults.`,
        },
        evidence: { path: file.path, line, missing },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findQueryPostsAntiPattern(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    QUERY_POSTS_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = QUERY_POSTS_CALL_PATTERN.exec(file.content)) !== null) {
      const line = findLineNumber(file.content, match.index);
      findings.push({
        id: "query-posts-anti-pattern",
        severity: "warning",
        category: "wordpress-core-misuse",
        message: `"${file.path}" calls query_posts() at line ${line}, which the WordPress developer handbook explicitly discourages -- it overwrites the main query and commonly breaks pagination.`,
        recommendation: {
          message: "Use a new WP_Query instance (or pre_get_posts to modify the main query) instead of query_posts().",
        },
        evidence: { path: file.path, line },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findHookCallbackArgCountMismatches(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const functionParamCounts = new Map();
    FUNCTION_DEFINITION_PATTERN.lastIndex = 0;
    let defMatch;
    while ((defMatch = FUNCTION_DEFINITION_PATTERN.exec(file.content)) !== null) {
      const name = defMatch[1];
      const params = defMatch[2].trim();
      const paramCount = params === "" ? 0 : params.split(",").length;
      functionParamCounts.set(name, paramCount);
    }

    ADD_HOOK_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = ADD_HOOK_CALL_PATTERN.exec(file.content)) !== null) {
      const hookFunction = match[1];
      const callbackName = match[2];
      const acceptedArgs = parseInt(match[3], 10);
      const line = findLineNumber(file.content, match.index);

      if (!functionParamCounts.has(callbackName)) continue;
      const declaredParamCount = functionParamCounts.get(callbackName);

      if (declaredParamCount < acceptedArgs) {
        findings.push({
          id: "hook-callback-arg-count-mismatch",
          severity: "warning",
          category: "wordpress-hook-correctness",
          message: `"${file.path}" registers ${callbackName}() via ${hookFunction}() at line ${line} declaring accepted_args=${acceptedArgs}, but ${callbackName}() only declares ${declaredParamCount} parameter(s).`,
          recommendation: {
            message: `Update ${callbackName}()'s signature to accept ${acceptedArgs} parameter(s), or lower the accepted_args value passed to ${hookFunction}() to match.`,
          },
          evidence: { path: file.path, line, callbackName, acceptedArgs, declaredParamCount },
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
export async function analyzeWordPressHooksAndCore({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    return findings;
  }

  findings.push(...findDeprecatedFunctionUsage(sourceFiles));
  findings.push(...findActivationHookIssues(sourceFiles));
  findings.push(...findHeaderIssues(sourceFiles));
  findings.push(...findTextDomainIssues(sourceFiles));
  findings.push(
    ...findRegistrationArgIssues(
      sourceFiles,
      REGISTER_POST_TYPE_CALL_PATTERN,
      "register-post-type-missing-recommended-args",
      ["show_in_rest", "capability_type", "supports"],
      "register_post_type()"
    )
  );
  findings.push(
    ...findRegistrationArgIssues(
      sourceFiles,
      REGISTER_TAXONOMY_CALL_PATTERN,
      "register-taxonomy-missing-recommended-args",
      ["show_in_rest"],
      "register_taxonomy()"
    )
  );
  findings.push(...findQueryPostsAntiPattern(sourceFiles));
  findings.push(...findHookCallbackArgCountMismatches(sourceFiles));

  findings.push({
    id: "wordpress-hooks-core-scan-summary",
    severity: "info",
    category: "summary",
    message: `Scanned ${sourceFiles.length} file(s); ${findings.length} WordPress hooks/core-relevant finding(s) before this summary.`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { fileCount: sourceFiles.length, findingCountBeforeSummary: findings.length },
  });

  return findings;
}

export const wordpressHooksCoreAdvisor = {
  id: "wordpress-hooks-core",
  name: "WordPress Hooks & Core Advisor",
  version: "1.0.0",
  category: "wordpress-hooks-core",
  description:
    "Static WordPress-specific hooks and core-API analysis: deprecated function usage, " +
    "activation/deactivation hook correctness, incomplete plugin/theme headers, missing or " +
    "inconsistent text domains, incomplete register_post_type()/register_taxonomy() argument sets, " +
    "the query_posts() anti-pattern, and hook callback argument-count mismatches. Read-only, " +
    "evidence-based -- analysis only, never generates or modifies files.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzeWordPressHooksAndCore,
};
