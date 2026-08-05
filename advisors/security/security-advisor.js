/**
 * Security Advisor — Stage 4E. The third real Advisor.
 *
 * Static security analysis of project source: dangerous eval/Function
 * usage, unsanitized command construction, hardcoded credentials,
 * insecure HTTP/SSL patterns, weak randomness, wildcard CORS, ReDoS-prone
 * regex, insecure temp paths, overly permissive file modes, leftover
 * debugger statements, and security-relevant TODO/FIXME markers.
 *
 * PURITY: identical contract to the Architecture (4C) and Code Review
 * (4D) Advisors. inputRequirements: ["sourceFiles"] is the only input --
 * proven sufficient by implementation; no second input was ever needed.
 *
 * REUSES source-analysis.js (promoted in Stage 4D): findDebtMarkers() for
 * the security-debt-marker check below. This is now the THIRD real
 * consumer of that module -- no new promotion needed, it was already
 * justified.
 *
 * TWO CHECKS DELIBERATELY NOT IMPLEMENTED (see docs/SECURITY-ADVISOR.md
 * for the full reasoning): generic "unsafe filesystem writes" and "path
 * traversal" detection. A draft path-traversal regex (flagging template
 * literals containing both ".." and "${...}") was tested against this
 * repository's OWN real source during design and produced predictable
 * false positives on legitimate PHP-code-generation strings in
 * elementor-widget-generator.js / gutenberg-block-generator.js (e.g. a
 * generated PHP require_once line embedding a fully validated, internally
 * -computed path via template interpolation -- not attacker input).
 * Rather than ship a noisy or wrong check, per this project's evidence
 * discipline, these two categories are left unimplemented and documented.
 *
 * EVIDENCE DISCIPLINE: every finding includes the exact triggering text.
 * No opaque scores; thresholds (string length, etc.) are named constants
 * visible in each finding's evidence.
 */

import { findDebtMarkers } from "../framework/source-analysis.js";

const EVAL_PATTERN = /\beval\s*\(/g;
const FUNCTION_CONSTRUCTOR_PATTERN = /\bnew\s+Function\s*\(/g;
const CHILD_PROCESS_IMPORT_PATTERN = /require\(\s*['"]child_process['"]\s*\)|from\s+['"]child_process['"]/g;
// Deliberately excludes dotted calls (e.g. "somePattern.exec(str)") via a
// negative lookbehind. RegExp.prototype.exec() is an extremely common,
// completely safe JS idiom -- and a first version of this pattern (without
// the lookbehind) matched it 14 times in THIS project's own real source
// during smoke testing, all false positives. Distinguishing "a regex
// object's .exec()" from "a child_process handle's .exec()" isn't
// reliably solvable via regex alone, so this narrows to bare (non-dotted)
// calls only -- the actual shape of a directly-imported child_process
// function call (`import { exec } from 'child_process'; exec(cmd)`).
// Known limitation: a dotted call on an explicitly child_process-derived
// handle (e.g. `child_process.exec(...)`) would not be caught by this
// narrowed pattern -- see docs/SECURITY-ADVISOR.md.
const EXEC_CALL_PATTERN = /(?<!\.)\b(exec|execSync|spawn|spawnSync)\s*\(/g;
const UNSANITIZED_EXEC_PATTERN = /(?<!\.)\b(?:exec|execSync)\s*\(\s*(`[^`]*\$\{[^}]*\}[^`]*`|[^,)]*\+\s*[^,)]*)/g;
const CREDENTIAL_KEY_PATTERN = /\b(password|secret|api[_-]?key|apikey|access[_-]?key|auth[_-]?token)\s*[:=]\s*['"]([^'"]{8,})['"]/gi;
const PLACEHOLDER_VALUES = new Set(["changeme", "your-api-key", "xxxxxxxx", "placeholder", "example", "test", ""]);
const INSECURE_HTTP_PATTERN = /['"]http:\/\/(?!localhost|127\.0\.0\.1)[^'"]+['"]/g;
const DISABLED_SSL_PATTERN = /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?/g;
const WEAK_RANDOMNESS_PATTERN = /Math\.random\s*\(\s*\)/g;
const WILDCARD_CORS_PATTERN = /Access-Control-Allow-Origin['"]?\s*[:=,]\s*['"]\*['"]/g;
const REDOS_PATTERN = /\([^()]*[+*][^()]*\)[+*]/g;
const INSECURE_TEMP_PATH_PATTERN = /['"]\/tmp\/[a-zA-Z0-9_-]+['"]/g;
const INSECURE_PERMISSION_PATTERN = /chmod(?:Sync)?\s*\([^,]+,\s*(?:0o?777|['"]?0?777['"]?)\s*\)/g;
const DEBUGGER_STATEMENT_PATTERN = /\bdebugger\s*;/g;
const SECURITY_KEYWORD_PATTERN = /\b(security|sanitiz|validat|escape|auth|permission|vulnerab|xss|injection|csrf|exploit)/i;

function findLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function scanPattern(sourceFiles, pattern, build) {
  const findings = [];
  for (const file of sourceFiles) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(file.content)) !== null) {
      findings.push(build(file, match, findLineNumber(file.content, match.index)));
    }
  }
  return findings;
}

function findEvalUsage(sourceFiles) {
  return scanPattern(sourceFiles, EVAL_PATTERN, (file, match, line) => ({
    id: "dangerous-eval-usage",
    severity: "critical",
    category: "code-execution",
    message: `"${file.path}" calls eval() at line ${line}.`,
    recommendation: { message: "eval() executes arbitrary strings as code; avoid it. If dynamic evaluation is genuinely required, use a narrow, explicit alternative." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findFunctionConstructorUsage(sourceFiles) {
  return scanPattern(sourceFiles, FUNCTION_CONSTRUCTOR_PATTERN, (file, match, line) => ({
    id: "function-constructor-usage",
    severity: "critical",
    category: "code-execution",
    message: `"${file.path}" uses the Function constructor at line ${line}.`,
    recommendation: { message: "new Function() has the same code-injection risk as eval(). Avoid constructing functions from strings at runtime." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findChildProcessUsage(sourceFiles) {
  const importFindings = scanPattern(sourceFiles, CHILD_PROCESS_IMPORT_PATTERN, (file, match, line) => ({
    id: "child-process-usage",
    severity: "info",
    category: "code-execution",
    message: `"${file.path}" imports child_process at line ${line}.`,
    recommendation: { message: "Not inherently unsafe; worth being aware of when reviewing how it's used." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
  const callFindings = scanPattern(sourceFiles, EXEC_CALL_PATTERN, (file, match, line) => ({
    id: "child-process-usage",
    severity: "info",
    category: "code-execution",
    message: `"${file.path}" calls ${match[1]}() at line ${line}.`,
    recommendation: { message: "Confirm the command and arguments are not built from unsanitized input." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
  return [...importFindings, ...callFindings];
}

function findUnsanitizedCommandConstruction(sourceFiles) {
  return scanPattern(sourceFiles, UNSANITIZED_EXEC_PATTERN, (file, match, line) => ({
    id: "unsanitized-command-construction",
    severity: "critical",
    category: "command-injection",
    message: `"${file.path}" builds a shell command via string interpolation/concatenation at line ${line}.`,
    recommendation: { message: "Building shell commands from interpolated or concatenated strings risks command injection if any part derives from untrusted input. Prefer passing arguments as an array (e.g. execFile) instead of a shell string." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findHardcodedCredentials(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    CREDENTIAL_KEY_PATTERN.lastIndex = 0;
    let match;
    while ((match = CREDENTIAL_KEY_PATTERN.exec(file.content)) !== null) {
      const value = match[2];
      if (PLACEHOLDER_VALUES.has(value.toLowerCase())) continue;
      const line = findLineNumber(file.content, match.index);
      findings.push({
        id: "hardcoded-credential",
        severity: "critical",
        category: "secrets",
        message: `"${file.path}" assigns what looks like a hardcoded credential to "${match[1]}" at line ${line}.`,
        recommendation: { message: "Move credentials to environment variables or a secrets manager; never commit them to source." },
        evidence: { path: file.path, line, keyName: match[1] },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findInsecureHttpUrls(sourceFiles) {
  return scanPattern(sourceFiles, INSECURE_HTTP_PATTERN, (file, match, line) => ({
    id: "insecure-http-url",
    severity: "suggestion",
    category: "transport-security",
    message: `"${file.path}" has a hardcoded non-HTTPS URL at line ${line}.`,
    recommendation: { message: "Prefer HTTPS for any URL that isn't strictly local development." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findDisabledSslVerification(sourceFiles) {
  return scanPattern(sourceFiles, DISABLED_SSL_PATTERN, (file, match, line) => ({
    id: "disabled-ssl-verification",
    severity: "critical",
    category: "transport-security",
    message: `"${file.path}" disables SSL/TLS certificate verification at line ${line}.`,
    recommendation: { message: "This may be intentional for local development against self-signed certificates (as documented elsewhere in this project) -- confirm it never reaches a production code path." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findWeakRandomness(sourceFiles) {
  return scanPattern(sourceFiles, WEAK_RANDOMNESS_PATTERN, (file, match, line) => ({
    id: "weak-randomness",
    severity: "suggestion",
    category: "cryptography",
    message: `"${file.path}" uses Math.random() at line ${line}.`,
    recommendation: { message: "Math.random() is not cryptographically secure. If this value is used for anything security-sensitive (tokens, IDs used for access), use crypto.randomBytes() instead." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findWildcardCors(sourceFiles) {
  return scanPattern(sourceFiles, WILDCARD_CORS_PATTERN, (file, match, line) => ({
    id: "wildcard-cors",
    severity: "warning",
    category: "transport-security",
    message: `"${file.path}" sets a wildcard CORS origin at line ${line}.`,
    recommendation: { message: "A wildcard CORS origin allows any site to make cross-origin requests. Restrict to specific known origins where possible." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findDangerousRegex(sourceFiles) {
  return scanPattern(sourceFiles, REDOS_PATTERN, (file, match, line) => ({
    id: "dangerous-regex-pattern",
    severity: "suggestion",
    category: "denial-of-service",
    message: `"${file.path}" contains a regex pattern with nested quantifiers at line ${line}, a shape that CAN (not always does) cause ReDoS (catastrophic backtracking).`,
    recommendation: { message: "Nested quantifiers like (a+)+ can cause exponential backtracking, but many are safe (e.g. a required literal separator between repetitions prevents ambiguous matching). This is a low-confidence heuristic -- manually confirm whether the specific pattern is actually ambiguous before treating this as urgent." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findInsecureTempPaths(sourceFiles) {
  return scanPattern(sourceFiles, INSECURE_TEMP_PATH_PATTERN, (file, match, line) => ({
    id: "insecure-temp-path",
    severity: "suggestion",
    category: "insecure-temp-file-handling",
    message: `"${file.path}" references a hardcoded, predictable path under /tmp/ at line ${line}.`,
    recommendation: { message: "Predictable temp file names can be a symlink-race or collision risk. Prefer a randomized, uniquely-generated temp directory (e.g. fs.mkdtemp)." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findInsecurePermissions(sourceFiles) {
  return scanPattern(sourceFiles, INSECURE_PERMISSION_PATTERN, (file, match, line) => ({
    id: "insecure-permission-setting",
    severity: "warning",
    category: "file-permissions",
    message: `"${file.path}" sets an overly permissive file mode (777-equivalent) at line ${line}.`,
    recommendation: { message: "777 grants read/write/execute to everyone. Use the narrowest permission set that the file's actual use requires." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findLeftoverDebuggerStatements(sourceFiles) {
  return scanPattern(sourceFiles, DEBUGGER_STATEMENT_PATTERN, (file, match, line) => ({
    id: "leftover-debugger-statement",
    severity: "warning",
    category: "debug-code",
    message: `"${file.path}" contains a debugger; statement at line ${line}.`,
    recommendation: { message: "Remove debugger statements before shipping -- they pause execution when developer tools are open." },
    evidence: { path: file.path, line, triggeringText: match[0] },
    location: { file: file.path, line },
  }));
}

function findSecurityDebtMarkers(sourceFiles) {
  const allMarkers = findDebtMarkers(sourceFiles);
  const securityRelevant = allMarkers.filter((marker) => {
    const file = sourceFiles.find((f) => f.path === marker.path);
    const line = file.content.split("\n")[marker.line - 1] ?? "";
    return SECURITY_KEYWORD_PATTERN.test(line);
  });
  if (securityRelevant.length === 0) return [];
  return [
    {
      id: "security-debt-marker",
      severity: "info",
      category: "technical-debt",
      message: `${securityRelevant.length} TODO/FIXME marker(s) mentioning security-relevant terms found.`,
      recommendation: { message: "Review and prioritize these -- a security-flagged TODO is more time-sensitive than a general one." },
      evidence: { markers: securityRelevant.slice(0, 20), truncated: securityRelevant.length > 20 },
    },
  ];
}

/**
 * Pure analysis function. input.sourceFiles is an array of
 * { path, content }.
 */
export async function analyzeSecurity({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    return findings;
  }

  findings.push(...findEvalUsage(sourceFiles));
  findings.push(...findFunctionConstructorUsage(sourceFiles));
  findings.push(...findChildProcessUsage(sourceFiles));
  findings.push(...findUnsanitizedCommandConstruction(sourceFiles));
  findings.push(...findHardcodedCredentials(sourceFiles));
  findings.push(...findInsecureHttpUrls(sourceFiles));
  findings.push(...findDisabledSslVerification(sourceFiles));
  findings.push(...findWeakRandomness(sourceFiles));
  findings.push(...findWildcardCors(sourceFiles));
  findings.push(...findDangerousRegex(sourceFiles));
  findings.push(...findInsecureTempPaths(sourceFiles));
  findings.push(...findInsecurePermissions(sourceFiles));
  findings.push(...findLeftoverDebuggerStatements(sourceFiles));
  findings.push(...findSecurityDebtMarkers(sourceFiles));

  findings.push({
    id: "security-scan-summary",
    severity: "info",
    category: "summary",
    message: `Scanned ${sourceFiles.length} file(s); ${findings.length} security-relevant finding(s) before this summary.`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { fileCount: sourceFiles.length, findingCountBeforeSummary: findings.length },
  });

  return findings;
}

export const securityAdvisor = {
  id: "security",
  name: "Security Advisor",
  version: "1.0.0",
  category: "security",
  description:
    "Static security analysis: dangerous eval/Function usage, unsanitized command construction, " +
    "hardcoded credentials, insecure HTTP/SSL patterns, weak randomness, wildcard CORS, " +
    "ReDoS-prone regex, insecure temp paths, permissive file modes, leftover debugger statements, " +
    "and security-relevant TODO/FIXME markers. Read-only, evidence-based.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzeSecurity,
};
