/**
 * WordPress Security Advisor — first real WordPress-specific Advisor
 * (Stage 7A specialization). Static, regex/pattern-based analysis of
 * common WordPress security anti-patterns: missing nonce verification,
 * missing capability checks, REST routes registered without a real
 * permission_callback, unprepared $wpdb queries, unescaped output, and
 * unsanitized request input.
 *
 * IDENTICAL CONTRACT to every existing Advisor (architecture, code-review,
 * security, performance, accessibility): { id, name, version, category,
 * description, inputRequirements: ["sourceFiles"], analyze }. Registered
 * through the existing, unmodified advisors/framework/advisor-registry.js
 * via advisors/index.js -- no Advisor Framework file was touched to build
 * this.
 *
 * REPORT SHAPE: uses the EXACT same finding shape every existing Advisor
 * uses -- { id, severity, category, message, recommendation, evidence,
 * location } -- per this stage's explicit, repeated instruction to
 * "reuse the existing Advisor report format exactly" and "not invent new
 * report structures." Where the task description's field list uses
 * "title"/"description"/"filename", those map onto the EXISTING shape's
 * "message" (a single, human-readable title+description combined, the
 * same convention every existing finding already uses) and
 * "location.file"/"location.line" -- not new top-level fields.
 *
 * ANALYSIS ONLY: this file never generates, modifies, or writes a file,
 * and never invokes a Generator, Agent, or Workflow. It is a pure
 * function of sourceFiles in, findings out -- identical purity contract
 * to every other Advisor.
 *
 * TWO PARENS-BALANCING HELPERS BELOW EXIST BECAUSE OF A REAL, PREVIOUSLY
 * DISCOVERED BUG: Stage 4F's Performance Advisor originally miscounted
 * brace depth when a string literal in the analyzed source happened to
 * contain an unbalanced brace character, corrupting extracted "bodies"
 * (fixed via a maskNonCode() helper). The same risk applies here for
 * PHP function-call argument extraction (register_rest_route(),
 * $wpdb->query(), etc. can span multiple lines and their string
 * arguments may contain parens). maskPhpStrings() applies the identical
 * fix proactively -- masking single/double-quoted string contents to
 * spaces before depth-counting parens -- rather than waiting to
 * rediscover the same bug.
 *
 * CONSOLIDATION NOTE: "missing sanitization of request input" and
 * "direct use of $_GET/$_POST/$_REQUEST without sanitization" (two
 * separate bullets in the task description) are implemented as ONE
 * finding rule (unsanitized-request-input), not two. Both bullets
 * describe the exact same underlying code pattern -- a raw superglobal
 * access with no recognized sanitizing/escaping function on the same
 * line -- and splitting them into two separately-firing rules would
 * double-count the identical evidence for the identical line of code.
 * This mirrors this project's own precedent of consolidating tightly
 * coupled concerns (e.g. CPT+Taxonomy sharing one generator, Stage 3D)
 * rather than manufacturing artificial rule counts.
 *
 * Stage 11B: maskPhpStrings(), extractBalancedParens() (previously named
 * extractBalancedCall() in this file specifically -- a private,
 * unexported implementation detail, never part of this advisor's public
 * analyze() output, so the rename changes nothing observable), and
 * findLineNumber() are now imported from the shared
 * advisors/framework/php-parsing.js, promoted after being found
 * byte-identical (or, for this one, logically identical modulo naming)
 * across all three WordPress Advisors. Zero behavioral change: the
 * imported implementations are byte-for-byte the same code that lived
 * in this file directly before this stage.
 */

import { maskPhpStrings, extractBalancedParens, findLineNumber } from "../framework/php-parsing.js";

const NONCE_VERIFICATION_PATTERN = /\b(wp_verify_nonce|check_admin_referer|check_ajax_referer)\s*\(/;
const CAPABILITY_CHECK_PATTERN = /\bcurrent_user_can\s*\(/;
const POST_USAGE_PATTERN = /\$_POST\s*\[/g;
const REST_ROUTE_CALL_PATTERN = /register_rest_route\s*(\()/g;
const WPDB_QUERY_CALL_PATTERN = /\$wpdb->(query|get_results|get_row|get_var|get_col)\s*(\()/g;
const ECHO_BARE_VARIABLE_PATTERN = /\b(?:echo|print)\s+(\$[A-Za-z_][A-Za-z0-9_]*)\s*;/g;
const SUPERGLOBAL_USAGE_PATTERN = /\$_(GET|POST|REQUEST)\s*\[/;
const SAFE_INPUT_WRAPPER_PATTERN =
  /\b(sanitize_[a-z_]+|absint|intval|floatval|esc_[a-z_]+|wp_kses(?:_[a-z_]+)?|filter_input|filter_var|wp_verify_nonce|isset|empty|array_key_exists)\s*\(/;

function findMissingNonceVerification(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    POST_USAGE_PATTERN.lastIndex = 0;
    const firstPostMatch = POST_USAGE_PATTERN.exec(file.content);
    if (!firstPostMatch) continue;
    if (NONCE_VERIFICATION_PATTERN.test(file.content)) continue;

    const line = findLineNumber(file.content, firstPostMatch.index);
    findings.push({
      id: "missing-nonce-verification",
      severity: "critical",
      category: "wordpress-csrf",
      message: `"${file.path}" processes $_POST data (first seen at line ${line}) but never calls wp_verify_nonce(), check_admin_referer(), or check_ajax_referer() anywhere in the file.`,
      recommendation: {
        message:
          "Form submissions and AJAX/admin-post handlers that change state should verify a nonce before acting on $_POST data, to prevent CSRF (an attacker tricking a logged-in user's browser into submitting the request).",
      },
      evidence: { path: file.path, line, triggeringText: firstPostMatch[0] },
      location: { file: file.path, line },
    });
  }
  return findings;
}

function findMissingCapabilityCheck(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    POST_USAGE_PATTERN.lastIndex = 0;
    const firstPostMatch = POST_USAGE_PATTERN.exec(file.content);
    if (!firstPostMatch) continue;
    if (CAPABILITY_CHECK_PATTERN.test(file.content)) continue;

    const line = findLineNumber(file.content, firstPostMatch.index);
    findings.push({
      id: "missing-capability-check",
      severity: "critical",
      category: "wordpress-authorization",
      message: `"${file.path}" processes $_POST data (first seen at line ${line}) but never calls current_user_can() anywhere in the file.`,
      recommendation: {
        message:
          "State-changing handlers should confirm the current user actually has permission to perform the action (e.g. current_user_can('manage_options')) before acting on submitted data.",
      },
      evidence: { path: file.path, line, triggeringText: firstPostMatch[0] },
      location: { file: file.path, line },
    });
  }
  return findings;
}

function findRestRoutesMissingPermissionCallback(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    REST_ROUTE_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = REST_ROUTE_CALL_PATTERN.exec(file.content)) !== null) {
      const openParenIndex = match.index + match[0].length - 1;
      const call = extractBalancedParens(file.content, openParenIndex);
      const line = findLineNumber(file.content, match.index);

      const hasPermissionCallback = /permission_callback/.test(call);
      const alwaysTrue = /permission_callback['"]?\s*=>\s*['"]__return_true['"]/.test(call);

      if (!hasPermissionCallback) {
        findings.push({
          id: "rest-route-missing-permission-callback",
          severity: "critical",
          category: "wordpress-authorization",
          message: `"${file.path}" registers a REST route at line ${line} with no "permission_callback" key at all -- WordPress will emit a deprecation notice and, on some versions, deny the request, but historically this has also meant the endpoint is effectively open.`,
          recommendation: {
            message:
              "Always declare a permission_callback for every REST route. If the endpoint is genuinely public, set it explicitly to '__return_true' so the intent is unambiguous -- but confirm that's really intended.",
          },
          evidence: { path: file.path, line, triggeringText: call.slice(0, 200) },
          location: { file: file.path, line },
        });
      } else if (alwaysTrue) {
        findings.push({
          id: "rest-route-missing-permission-callback",
          severity: "critical",
          category: "wordpress-authorization",
          message: `"${file.path}" registers a REST route at line ${line} with permission_callback set to '__return_true', meaning the endpoint performs no authorization check at all.`,
          recommendation: {
            message:
              "Confirm this endpoint is genuinely meant to be public with no access restriction. If it reads or writes any non-public data, implement a real permission_callback instead.",
          },
          evidence: { path: file.path, line, triggeringText: call.slice(0, 200) },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findUnpreparedSqlQueries(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    WPDB_QUERY_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = WPDB_QUERY_CALL_PATTERN.exec(file.content)) !== null) {
      const methodName = match[1];
      const openParenIndex = match.index + match[0].length - 1;
      const call = extractBalancedParens(file.content, openParenIndex);
      const line = findLineNumber(file.content, match.index);

      if (call.includes("->prepare(")) continue;

      const argumentPortion = call.slice(1, -1);
      if (!/\$/.test(argumentPortion)) continue;

      findings.push({
        id: "unprepared-sql-query",
        severity: "critical",
        category: "wordpress-sql-injection",
        message: `"${file.path}" calls $wpdb->${methodName}() at line ${line} with what appears to be a variable-built query string, without $wpdb->prepare().`,
        recommendation: {
          message:
            "Any $wpdb query that incorporates a variable should be built with $wpdb->prepare() using placeholders (%s, %d, %f), never by directly interpolating or concatenating values into the SQL string.",
        },
        evidence: { path: file.path, line, triggeringText: call.slice(0, 200) },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findUnescapedOutput(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    ECHO_BARE_VARIABLE_PATTERN.lastIndex = 0;
    let match;
    while ((match = ECHO_BARE_VARIABLE_PATTERN.exec(file.content)) !== null) {
      const line = findLineNumber(file.content, match.index);
      findings.push({
        id: "unescaped-output",
        severity: "warning",
        category: "wordpress-xss",
        message: `"${file.path}" echoes ${match[1]} directly at line ${line} without an escaping function (esc_html(), esc_attr(), esc_url(), wp_kses(), etc.).`,
        recommendation: {
          message:
            "Output that includes any value not fully controlled by the developer should be escaped for its context before printing -- esc_html() for text, esc_attr() for HTML attributes, esc_url() for URLs, wp_kses() for limited HTML.",
        },
        evidence: { path: file.path, line, triggeringText: match[0] },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findUnsanitizedRequestInput(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (!SUPERGLOBAL_USAGE_PATTERN.test(lineText)) continue;
      if (SAFE_INPUT_WRAPPER_PATTERN.test(lineText)) continue;

      const match = SUPERGLOBAL_USAGE_PATTERN.exec(lineText);
      findings.push({
        id: "unsanitized-request-input",
        severity: "warning",
        category: "wordpress-input-validation",
        message: `"${file.path}" uses $_${match[1]} directly at line ${i + 1} without a recognized sanitizing function (sanitize_text_field(), absint(), intval(), esc_url_raw(), etc.) on the same line.`,
        recommendation: {
          message:
            "Request input ($_GET, $_POST, $_REQUEST) should be sanitized immediately at the point of use with a function appropriate to the expected data type before being stored, output, or used in a query.",
        },
        evidence: { path: file.path, line: i + 1, triggeringText: lineText.trim().slice(0, 200) },
        location: { file: file.path, line: i + 1 },
      });
    }
  }
  return findings;
}

/**
 * Pure analysis function. input.sourceFiles is an array of
 * { path, content }.
 */
export async function analyzeWordPressSecurity({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    return findings;
  }

  findings.push(...findMissingNonceVerification(sourceFiles));
  findings.push(...findMissingCapabilityCheck(sourceFiles));
  findings.push(...findRestRoutesMissingPermissionCallback(sourceFiles));
  findings.push(...findUnpreparedSqlQueries(sourceFiles));
  findings.push(...findUnescapedOutput(sourceFiles));
  findings.push(...findUnsanitizedRequestInput(sourceFiles));

  findings.push({
    id: "wordpress-security-scan-summary",
    severity: "info",
    category: "summary",
    message: `Scanned ${sourceFiles.length} file(s); ${findings.length} WordPress security-relevant finding(s) before this summary.`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { fileCount: sourceFiles.length, findingCountBeforeSummary: findings.length },
  });

  return findings;
}

export const wordpressSecurityAdvisor = {
  id: "wordpress-security",
  name: "WordPress Security Advisor",
  version: "1.0.0",
  category: "wordpress-security",
  description:
    "Static WordPress-specific security analysis: missing nonce verification, missing capability " +
    "checks, REST routes registered without a real permission_callback, unprepared $wpdb queries, " +
    "unescaped output, and unsanitized request input ($_GET/$_POST/$_REQUEST). Read-only, " +
    "evidence-based -- analysis only, never generates or modifies files.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzeWordPressSecurity,
};
