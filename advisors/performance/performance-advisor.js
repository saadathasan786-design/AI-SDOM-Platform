/**
 * Performance Advisor — Stage 4F. The fourth real Advisor.
 *
 * Static performance analysis of project source: nested loop complexity,
 * expensive operations inside loops (regex compilation, JSON operations,
 * synchronous I/O, collection lookups), duplicate file reads, large
 * switch statements, excessive conditional nesting, oversized
 * modules/functions, inefficient object cloning, string concatenation in
 * loops, and redundant imports.
 *
 * PURITY: identical contract to every prior Advisor (4C/4D/4E).
 * inputRequirements: ["sourceFiles"] proved fully sufficient -- no second
 * input was ever needed.
 *
 * REUSES source-analysis.js's parseImports() for the redundant-import
 * check -- the fourth real consumer of that module, no new promotion
 * needed (already justified in Stage 4D).
 *
 * LOOP-BODY EXTRACTION is this advisor's own new technique (not shared --
 * no other advisor currently needs "find loop body substrings"). It uses
 * bracket-counting from each for(/while( occurrence to find the loop's
 * brace-delimited body, which several checks below then scan within.
 * Single-statement loops without braces are intentionally not analyzed --
 * extracting their single-statement "body" reliably via text scanning
 * alone is disproportionately fragile, and every loop in this project's
 * own real source already uses braces.
 *
 * THREE CHECKS FROM THE REQUESTED SCOPE ARE DELIBERATELY MERGED OR
 * OMITTED, documented in docs/PERFORMANCE-ADVISOR.md:
 * - "repeated path normalization" is not implemented as its own check --
 *   reliably detecting redundant (not just frequent) path normalization
 *   without semantic analysis was evaluated and found too speculative
 *   (parallel to the Security Advisor's decision to skip path-traversal
 *   detection for the same reason).
 * - "obvious algorithmic inefficiencies" is not a separate check -- it's
 *   folded into nested-loop-complexity, the one concrete, checkable proxy
 *   for this category available without real complexity analysis.
 * - "repeated expensive calculations" is not separate -- covered by the
 *   loop-body checks below (regex/JSON/sync-IO/collection-lookup inside
 *   a loop), which are the concrete, checkable instances of this.
 *
 * EVIDENCE DISCIPLINE: every finding includes the exact triggering text
 * or a specific count. No opaque scores; thresholds are named constants.
 */

import { parseImports } from "../framework/source-analysis.js";

const LOOP_START_PATTERN = /\b(for|while)\s*\(/g;
const FUNCTION_START_PATTERN = /\b(?:function\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\(|function\s*\(|[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;

const NEW_REGEXP_PATTERN = /new\s+RegExp\s*\(/g;
const JSON_OPERATION_PATTERN = /JSON\.(parse|stringify)\s*\(/g;
const SYNC_IO_PATTERN = /\bfs\.\w*Sync\s*\(/g;
const FS_READ_CALL_PATTERN = /\bfs\.readFile(?:Sync)?\s*\(\s*['"]([^'"]+)['"]/g;
const SWITCH_START_PATTERN = /\bswitch\s*\(/g;
const CASE_LABEL_PATTERN = /\bcase\s+[^:]+:/g;
const CLONE_VIA_JSON_PATTERN = /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/g;
const STRING_CONCAT_ASSIGN_PATTERN = /\b[A-Za-z_$][A-Za-z0-9_$]*\s*\+=\s*(['"`])/g;
const COLLECTION_LOOKUP_PATTERN = /\.(includes|indexOf|find)\s*\(/g;

const LARGE_SWITCH_CASE_THRESHOLD = 10;
const CONDITIONAL_NESTING_THRESHOLD = 4;
const OVERSIZED_MODULE_LINE_THRESHOLD = 300;
const OVERSIZED_FUNCTION_LINE_THRESHOLD = 80;

function findLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

/**
 * Replaces the CONTENTS of string literals, template literal text (but
 * NOT ${...} interpolation, which is real code), and comments with spaces
 * -- preserving exact character positions/length -- so brace/paren
 * counting never miscounts a brace character that's actually just text
 * inside a string.
 *
 * This fixes a real bug found via smoke testing: this very file's OWN
 * source contains lines like `content[i] === "{"` -- a string literal
 * holding exactly one brace character. Naive counting treated that as a
 * real opening brace with no matching close, causing extracted loop/
 * function bodies to run all the way to the end of the file. See
 * docs/PERFORMANCE-ADVISOR.md for the full account.
 */
function maskNonCode(content) {
  const chars = content.split("");
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch === "/" && chars[i + 1] === "/") {
      while (i < chars.length && chars[i] !== "\n") {
        chars[i] = " ";
        i++;
      }
    } else if (ch === "/" && chars[i + 1] === "*") {
      chars[i] = " ";
      chars[i + 1] = " ";
      i += 2;
      while (i < chars.length - 1 && !(chars[i] === "*" && chars[i + 1] === "/")) {
        if (chars[i] !== "\n") chars[i] = " ";
        i++;
      }
      if (i < chars.length - 1) {
        chars[i] = " ";
        chars[i + 1] = " ";
        i += 2;
      }
    } else if (ch === "'" || ch === '"') {
      const quote = ch;
      chars[i] = " ";
      i++;
      while (i < chars.length && chars[i] !== quote) {
        if (chars[i] === "\\") {
          chars[i] = " ";
          i++;
          if (i < chars.length) {
            chars[i] = " ";
            i++;
          }
          continue;
        }
        if (chars[i] !== "\n") chars[i] = " ";
        i++;
      }
      if (i < chars.length) {
        chars[i] = " ";
        i++;
      }
    } else if (ch === "`") {
      chars[i] = " ";
      i++;
      while (i < chars.length && chars[i] !== "`") {
        if (chars[i] === "\\") {
          chars[i] = " ";
          i++;
          if (i < chars.length) {
            chars[i] = " ";
            i++;
          }
          continue;
        }
        if (chars[i] === "$" && chars[i + 1] === "{") {
          // Real code inside ${...} -- leave untouched, including its braces.
          i += 2;
          let depth = 1;
          while (i < chars.length && depth > 0) {
            if (chars[i] === "{") depth++;
            else if (chars[i] === "}") depth--;
            i++;
          }
          continue;
        }
        if (chars[i] !== "\n") chars[i] = " ";
        i++;
      }
      if (i < chars.length) {
        chars[i] = " ";
        i++;
      }
    } else {
      i++;
    }
  }
  return chars.join("");
}

/** Finds the index just after the brace-matched block starting at openBraceIndex (which must be "{"). */
function findMatchingBraceEnd(maskedContent, openBraceIndex) {
  let depth = 1;
  let i = openBraceIndex + 1;
  while (i < maskedContent.length && depth > 0) {
    if (maskedContent[i] === "{") depth++;
    else if (maskedContent[i] === "}") depth--;
    i++;
  }
  return i;
}

/**
 * Extracts brace-delimited loop bodies. Single-statement (braceless)
 * loops are skipped -- see file header for why. Loop/brace detection runs
 * against a masked buffer (string/comment contents replaced with spaces)
 * so a literal "{" or "}" inside a string is never miscounted as a real
 * code brace; the returned `text` is sliced from the ORIGINAL content so
 * downstream pattern checks see real code.
 */
function extractLoopBodies(content) {
  const masked = maskNonCode(content);
  const bodies = [];
  LOOP_START_PATTERN.lastIndex = 0;
  let match;
  while ((match = LOOP_START_PATTERN.exec(masked)) !== null) {
    const parenStart = match.index + match[0].length - 1;
    let depth = 1;
    let i = parenStart + 1;
    while (i < masked.length && depth > 0) {
      if (masked[i] === "(") depth++;
      else if (masked[i] === ")") depth--;
      i++;
    }
    while (i < masked.length && /\s/.test(masked[i])) i++;
    if (masked[i] !== "{") continue;
    const bodyStart = i;
    const bodyEnd = findMatchingBraceEnd(masked, bodyStart);
    bodies.push({ loopIndex: match.index, bodyStart, bodyEnd, text: content.slice(bodyStart, bodyEnd) });
  }
  return bodies;
}

function extractFunctionBodies(content) {
  const masked = maskNonCode(content);
  const bodies = [];
  FUNCTION_START_PATTERN.lastIndex = 0;
  let match;
  while ((match = FUNCTION_START_PATTERN.exec(masked)) !== null) {
    let i = match.index + match[0].length;
    while (i < masked.length && masked[i] !== "{" && masked[i] !== ";" && masked[i] !== "\n") i++;
    if (masked[i] !== "{") continue;
    const bodyStart = i;
    const bodyEnd = findMatchingBraceEnd(masked, bodyStart);
    bodies.push({ functionIndex: match.index, bodyStart, bodyEnd, text: content.slice(bodyStart, bodyEnd) });
  }
  return bodies;
}

function countPatternMatches(pattern, text) {
  pattern.lastIndex = 0;
  return (text.match(pattern) ?? []).length;
}

function findNestedLoopComplexity(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const bodies = extractLoopBodies(file.content);
    for (const body of bodies) {
      LOOP_START_PATTERN.lastIndex = 0;
      if (LOOP_START_PATTERN.test(body.text)) {
        const line = findLineNumber(file.content, body.loopIndex);
        findings.push({
          id: "nested-loop-complexity",
          severity: "suggestion",
          category: "algorithmic-complexity",
          message: `"${file.path}" has a loop nested inside another loop, starting at line ${line}.`,
          recommendation: { message: "This is a low-confidence structural signal, not a confirmed problem: nested loops over small or independently-bounded collections (e.g. 'for each file, scan its matches') are common and usually fine. Worth a second look only if both loops scale with the same potentially-large input." },
          evidence: { path: file.path, line },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findExpensiveOperationsInLoops(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const bodies = extractLoopBodies(file.content);
    for (const body of bodies) {
      const loopLine = findLineNumber(file.content, body.loopIndex);

      if (countPatternMatches(NEW_REGEXP_PATTERN, body.text) > 0) {
        findings.push({
          id: "regex-compiled-in-loop",
          severity: "warning",
          category: "repeated-compilation",
          message: `"${file.path}" constructs a new RegExp() inside a loop starting at line ${loopLine}.`,
          recommendation: { message: "Compile the RegExp once outside the loop and reuse it, unless the pattern itself must vary per iteration." },
          evidence: { path: file.path, line: loopLine },
          location: { file: file.path, line: loopLine },
        });
      }

      if (countPatternMatches(JSON_OPERATION_PATTERN, body.text) > 0) {
        findings.push({
          id: "json-operation-in-loop",
          severity: "warning",
          category: "serialization",
          message: `"${file.path}" calls JSON.parse/JSON.stringify inside a loop starting at line ${loopLine}.`,
          recommendation: { message: "Serialization cost scales with payload size; if the same data is parsed/stringified repeatedly, consider doing it once outside the loop." },
          evidence: { path: file.path, line: loopLine },
          location: { file: file.path, line: loopLine },
        });
      }

      if (countPatternMatches(SYNC_IO_PATTERN, body.text) > 0) {
        findings.push({
          id: "sync-io-in-loop",
          severity: "warning",
          category: "synchronous-io",
          message: `"${file.path}" calls a synchronous fs.*Sync() function inside a loop starting at line ${loopLine}.`,
          recommendation: { message: "Synchronous I/O inside a loop blocks the event loop once per iteration. Prefer batching, or the async equivalent with Promise.all where order doesn't matter." },
          evidence: { path: file.path, line: loopLine },
          location: { file: file.path, line: loopLine },
        });
      }

      if (countPatternMatches(COLLECTION_LOOKUP_PATTERN, body.text) > 0) {
        findings.push({
          id: "collection-lookup-in-loop",
          severity: "suggestion",
          category: "algorithmic-complexity",
          message: `"${file.path}" calls .includes()/.indexOf()/.find() inside a loop starting at line ${loopLine}.`,
          recommendation: { message: "If this searches the same collection repeatedly across iterations, it may be an O(n^2) pattern -- consider a Set/Map for O(1) lookups instead." },
          evidence: { path: file.path, line: loopLine },
          location: { file: file.path, line: loopLine },
        });
      }

      if (countPatternMatches(STRING_CONCAT_ASSIGN_PATTERN, body.text) > 0) {
        findings.push({
          id: "string-concatenation-in-loop",
          severity: "suggestion",
          category: "string-building",
          message: `"${file.path}" uses += string concatenation inside a loop starting at line ${loopLine}.`,
          recommendation: { message: "Repeated += concatenation can be less efficient than collecting into an array and joining once, for large iteration counts." },
          evidence: { path: file.path, line: loopLine },
          location: { file: file.path, line: loopLine },
        });
      }
    }
  }
  return findings;
}

function findSyncIoUsage(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    SYNC_IO_PATTERN.lastIndex = 0;
    let match;
    while ((match = SYNC_IO_PATTERN.exec(file.content)) !== null) {
      const line = findLineNumber(file.content, match.index);
      findings.push({
        id: "sync-io-usage",
        severity: "suggestion",
        category: "synchronous-io",
        message: `"${file.path}" calls a synchronous fs.*Sync() function at line ${line}.`,
        recommendation: { message: "Synchronous I/O blocks the event loop for the duration of the call. Fine for short-lived scripts/CLIs; worth reconsidering in a long-running server process." },
        evidence: { path: file.path, line, triggeringText: match[0] },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findDuplicateFileReads(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const pathCounts = new Map();
    FS_READ_CALL_PATTERN.lastIndex = 0;
    let match;
    while ((match = FS_READ_CALL_PATTERN.exec(file.content)) !== null) {
      const targetPath = match[1];
      pathCounts.set(targetPath, (pathCounts.get(targetPath) ?? 0) + 1);
    }
    for (const [targetPath, count] of pathCounts.entries()) {
      if (count >= 2) {
        findings.push({
          id: "duplicate-file-read",
          severity: "suggestion",
          category: "redundant-io",
          message: `"${file.path}" reads "${targetPath}" ${count} times.`,
          recommendation: { message: "Read once and reuse the result, rather than re-reading the same file repeatedly." },
          evidence: { path: file.path, targetPath, count },
          location: { file: file.path },
        });
      }
    }
  }
  return findings;
}

function findLargeSwitchStatements(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const masked = maskNonCode(file.content);
    SWITCH_START_PATTERN.lastIndex = 0;
    let match;
    while ((match = SWITCH_START_PATTERN.exec(masked)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      let depth = 1;
      let i = parenStart + 1;
      while (i < masked.length && depth > 0) {
        if (masked[i] === "(") depth++;
        else if (masked[i] === ")") depth--;
        i++;
      }
      while (i < masked.length && /\s/.test(masked[i])) i++;
      if (masked[i] !== "{") continue;
      const bodyEnd = findMatchingBraceEnd(masked, i);
      const body = file.content.slice(i, bodyEnd);
      const caseCount = countPatternMatches(CASE_LABEL_PATTERN, body);
      if (caseCount > LARGE_SWITCH_CASE_THRESHOLD) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "large-switch-statement",
          severity: "suggestion",
          category: "code-structure",
          message: `"${file.path}" has a switch statement with ${caseCount} case(s) at line ${line} (threshold: ${LARGE_SWITCH_CASE_THRESHOLD}).`,
          recommendation: { message: "A very large switch can be a sign the logic would be clearer (and sometimes faster to dispatch) as a lookup table/Map of handlers." },
          evidence: { path: file.path, line, caseCount, threshold: LARGE_SWITCH_CASE_THRESHOLD },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findExcessiveConditionalNesting(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const masked = maskNonCode(file.content);
    let depth = 0;
    let maxDepthSeen = 0;
    let maxDepthLine = null;
    for (let i = 0; i < masked.length; i++) {
      const ch = masked[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth = Math.max(0, depth - 1);
      else if (masked.startsWith("if", i) && /\bif\s*\(/.test(masked.slice(i, i + 6))) {
        if (depth > maxDepthSeen) {
          maxDepthSeen = depth;
          maxDepthLine = findLineNumber(file.content, i);
        }
      }
    }
    if (maxDepthSeen >= CONDITIONAL_NESTING_THRESHOLD) {
      findings.push({
        id: "excessive-conditional-nesting",
        severity: "suggestion",
        category: "code-structure",
        message: `"${file.path}" has an if-statement nested ${maxDepthSeen} brace-level(s) deep, at or near line ${maxDepthLine} (threshold: ${CONDITIONAL_NESTING_THRESHOLD}).`,
        recommendation: { message: "Deep nesting is harder to reason about and can indicate missed early-return opportunities. Consider flattening with guard clauses." },
        evidence: { path: file.path, line: maxDepthLine, depth: maxDepthSeen, threshold: CONDITIONAL_NESTING_THRESHOLD },
        location: { file: file.path, line: maxDepthLine },
      });
    }
  }
  return findings;
}

function findOversizedModules(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const lineCount = file.content.split("\n").length;
    if (lineCount > OVERSIZED_MODULE_LINE_THRESHOLD) {
      findings.push({
        id: "oversized-module",
        severity: "info",
        category: "module-size",
        message: `"${file.path}" is ${lineCount} lines (threshold: ${OVERSIZED_MODULE_LINE_THRESHOLD}).`,
        recommendation: { message: "Larger modules take longer to parse and load. If it covers multiple concerns, splitting may help both load time and maintainability." },
        evidence: { path: file.path, lineCount, threshold: OVERSIZED_MODULE_LINE_THRESHOLD },
        location: { file: file.path },
      });
    }
  }
  return findings;
}

function findOversizedFunctions(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const bodies = extractFunctionBodies(file.content);
    for (const body of bodies) {
      const lineCount = body.text.split("\n").length;
      if (lineCount > OVERSIZED_FUNCTION_LINE_THRESHOLD) {
        const line = findLineNumber(file.content, body.functionIndex);
        findings.push({
          id: "oversized-function",
          severity: "suggestion",
          category: "function-size",
          message: `"${file.path}" has a function starting at line ${line} spanning ${lineCount} lines (threshold: ${OVERSIZED_FUNCTION_LINE_THRESHOLD}).`,
          recommendation: { message: "Very large functions are harder to optimize and reason about in isolation. Consider extracting logically independent sections." },
          evidence: { path: file.path, line, lineCount, threshold: OVERSIZED_FUNCTION_LINE_THRESHOLD },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findInefficientObjectCloning(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    CLONE_VIA_JSON_PATTERN.lastIndex = 0;
    let match;
    while ((match = CLONE_VIA_JSON_PATTERN.exec(file.content)) !== null) {
      const line = findLineNumber(file.content, match.index);
      findings.push({
        id: "inefficient-object-cloning",
        severity: "suggestion",
        category: "serialization",
        message: `"${file.path}" clones an object via JSON.parse(JSON.stringify(...)) at line ${line}.`,
        recommendation: { message: "This idiom is slower than necessary and silently drops functions/undefined/Dates. Prefer structuredClone() (Node 17+) or a purpose-built deep-clone utility." },
        evidence: { path: file.path, line, triggeringText: match[0] },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findRedundantImports(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const specifiers = parseImports(file.content);
    const counts = new Map();
    for (const specifier of specifiers) counts.set(specifier, (counts.get(specifier) ?? 0) + 1);
    for (const [specifier, count] of counts.entries()) {
      if (count >= 2) {
        findings.push({
          id: "redundant-import",
          severity: "info",
          category: "code-structure",
          message: `"${file.path}" imports "${specifier}" ${count} separate times.`,
          recommendation: { message: "ES modules are deduplicated by the engine, so this has no runtime performance cost -- but consolidating into one import statement improves clarity." },
          evidence: { path: file.path, specifier, count },
          location: { file: file.path },
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
export async function analyzePerformance({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    return findings;
  }

  findings.push(...findNestedLoopComplexity(sourceFiles));
  findings.push(...findExpensiveOperationsInLoops(sourceFiles));
  findings.push(...findSyncIoUsage(sourceFiles));
  findings.push(...findDuplicateFileReads(sourceFiles));
  findings.push(...findLargeSwitchStatements(sourceFiles));
  findings.push(...findExcessiveConditionalNesting(sourceFiles));
  findings.push(...findOversizedModules(sourceFiles));
  findings.push(...findOversizedFunctions(sourceFiles));
  findings.push(...findInefficientObjectCloning(sourceFiles));
  findings.push(...findRedundantImports(sourceFiles));

  findings.push({
    id: "performance-scan-summary",
    severity: "info",
    category: "summary",
    message: `Scanned ${sourceFiles.length} file(s); ${findings.length} performance-relevant finding(s) before this summary.`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { fileCount: sourceFiles.length, findingCountBeforeSummary: findings.length },
  });

  return findings;
}

export const performanceAdvisor = {
  id: "performance",
  name: "Performance Advisor",
  version: "1.0.0",
  category: "performance",
  description:
    "Static performance analysis: nested loop complexity, expensive operations inside loops " +
    "(regex compilation, JSON operations, synchronous I/O, collection lookups), duplicate file " +
    "reads, large switch statements, excessive conditional nesting, oversized modules/functions, " +
    "inefficient object cloning, string concatenation in loops, and redundant imports. Read-only, " +
    "evidence-based.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzePerformance,
};
