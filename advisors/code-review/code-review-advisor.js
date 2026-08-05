/**
 * Code Review Advisor — Stage 4D. The second real Advisor.
 *
 * Analyzes source code quality: naming consistency, cross-file
 * duplication, dead code (zero fan-in files), maintainability (file
 * length, branching complexity), documentation coverage, TODO/FIXME
 * usage, error-handling consistency (empty catch blocks), and API
 * consistency (mixed async styles within one file).
 *
 * PURITY: analyze() never touches the filesystem -- identical contract
 * to the Architecture Advisor (4C). inputRequirements: ["sourceFiles"]
 * is its only input.
 *
 * SHARED WITH THE ARCHITECTURE ADVISOR: dependency-graph building and
 * fan-in computation (for dead-code detection), and TODO/FIXME marker
 * detection -- both now live in advisors/framework/source-analysis.js,
 * promoted in this same stage once this advisor became the second real
 * consumer of logic the Architecture Advisor had built locally. See that
 * module's own header comment for the full promotion reasoning, and
 * docs/CODE-REVIEW-ADVISOR.md for this advisor's framework-sufficiency
 * evaluation.
 *
 * NOT SHARED (deliberately kept local): naming-convention classification,
 * duplication detection, documentation-coverage heuristics, complexity
 * counting, empty-catch detection, and async-style-mixing detection are
 * all this advisor's own domain knowledge -- no other advisor needs them
 * yet, so per this project's promotion discipline they stay here.
 *
 * EVIDENCE DISCIPLINE: identical to the Architecture Advisor -- every
 * finding is derived directly from the given sourceFiles; nothing is
 * speculated, and thresholds (file length, complexity count, doc
 * coverage) are stated explicitly in each finding's evidence so a reader
 * can judge for themselves rather than trust an opaque score.
 */

import path from "node:path";
import { buildDependencyGraph, computeFanIn, findDebtMarkers } from "../framework/source-analysis.js";

const LONG_FILE_LINE_THRESHOLD = 300;
const HIGH_COMPLEXITY_THRESHOLD = 30;
const LOW_DOC_COVERAGE_THRESHOLD = 0.5;
const DUPLICATE_BLOCK_SIZE = 6; // consecutive non-trivial lines
const DUPLICATE_MIN_BLOCK_LENGTH = 100; // filters trivial short matches like "},\n" repeated by coincidence

const FUNCTION_DECLARATION_PATTERN = /\b(?:function\s+([A-Za-z_$][A-Za-z0-9_$]*)|const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\()/g;
const EXPORT_DECLARATION_PATTERN = /^export\s+(?:async\s+)?(?:function|class|const)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;
const EMPTY_CATCH_PATTERN = /catch\s*\([^)]*\)\s*\{\s*\}/g;
const DECISION_POINT_PATTERN = /\b(if|for|while|case)\b\s*\(|\bcase\s+[^:]+:/g;

function classifyName(name) {
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) return "SCREAMING_SNAKE_CASE"; // constants -- not a "callable naming" concern
  if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return "camelCase";
  if (/^[a-z][a-z0-9_]*$/.test(name) && name.includes("_")) return "snake_case";
  return "other";
}

function findNamingInconsistency(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const styles = new Set();
    let match;
    FUNCTION_DECLARATION_PATTERN.lastIndex = 0;
    while ((match = FUNCTION_DECLARATION_PATTERN.exec(file.content)) !== null) {
      const name = match[1] || match[2];
      const style = classifyName(name);
      if (style === "camelCase" || style === "snake_case") styles.add(style);
    }
    if (styles.size > 1) {
      findings.push({
        id: "naming-inconsistency",
        severity: "warning",
        category: "naming-consistency",
        message: `"${file.path}" mixes camelCase and snake_case function/const naming.`,
        recommendation: { message: "Pick one convention for callable names within a file and apply it consistently." },
        evidence: { path: file.path, stylesFound: [...styles] },
        location: { file: file.path },
      });
    }
  }
  return findings;
}

function normalizeLine(line) {
  return line.trim();
}

function isAllImportLines(lines) {
  return lines.every((line) => /^import\b/.test(line) || /^}\s*from\s*['"]/.test(line) || /^[A-Za-z_$][A-Za-z0-9_$]*,?$/.test(line));
}

function findCrossFileDuplication(sourceFiles) {
  const blockLocations = new Map();
  for (const file of sourceFiles) {
    const rawLines = file.content.split("\n");
    const lines = rawLines.map(normalizeLine).filter((l) => l.length > 0 && l !== "{" && l !== "}");
    for (let i = 0; i + DUPLICATE_BLOCK_SIZE <= lines.length; i++) {
      const blockLines = lines.slice(i, i + DUPLICATE_BLOCK_SIZE);
      const block = blockLines.join("\n");
      if (block.length < DUPLICATE_MIN_BLOCK_LENGTH) continue;
      if (isAllImportLines(blockLines)) continue; // shared framework imports across sibling generators are expected reuse, not a code smell
      if (!blockLocations.has(block)) blockLocations.set(block, []);
      blockLocations.get(block).push({ path: file.path, startLine: i + 1 });
    }
  }

  const findings = [];
  const reportedPairs = new Set();
  for (const [block, locations] of blockLocations.entries()) {
    const distinctFiles = new Set(locations.map((l) => l.path));
    if (distinctFiles.size < 2) continue;
    const key = [...distinctFiles].sort().join("|") + "::" + block.slice(0, 20);
    if (reportedPairs.has(key)) continue;
    reportedPairs.add(key);
    findings.push({
      id: "cross-file-duplication",
      severity: "warning",
      category: "duplication",
      message: `A ${DUPLICATE_BLOCK_SIZE}-line block appears identically in ${distinctFiles.size} different file(s).`,
      recommendation: { message: "Consider extracting the shared block into a common helper, if the duplication is intentional business logic rather than coincidental similarity." },
      evidence: { locations, blockPreview: block.split("\n")[0] },
    });
  }
  return findings;
}

function findPossibleDeadFiles(sourceFiles) {
  const graph = buildDependencyGraph(sourceFiles);
  const fanIn = computeFanIn(graph);
  const findings = [];
  for (const [filePath, count] of fanIn.entries()) {
    const isEntryPoint = path.posix.basename(filePath) === "index.js";
    if (!isEntryPoint && count === 0) {
      findings.push({
        id: "possible-dead-file",
        severity: "suggestion",
        category: "dead-code",
        message: `"${filePath}" is not imported by any other analyzed file.`,
        recommendation: { message: "Confirm this is intentional (e.g. consumed externally, or only via re-export not visible here) or consider removing it." },
        evidence: { path: filePath, fanIn: count },
        location: { file: filePath },
      });
    }
  }
  return findings;
}

function findLongFiles(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const lineCount = file.content.split("\n").length;
    if (lineCount > LONG_FILE_LINE_THRESHOLD) {
      findings.push({
        id: "long-file",
        severity: "suggestion",
        category: "maintainability",
        message: `"${file.path}" is ${lineCount} lines long (threshold: ${LONG_FILE_LINE_THRESHOLD}).`,
        recommendation: { message: "Consider splitting into smaller, more focused modules if it covers multiple concerns." },
        evidence: { path: file.path, lineCount, threshold: LONG_FILE_LINE_THRESHOLD },
        location: { file: file.path },
      });
    }
  }
  return findings;
}

function findLowDocumentationCoverage(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const lines = file.content.split("\n");
    let totalExports = 0;
    let documented = 0;

    EXPORT_DECLARATION_PATTERN.lastIndex = 0;
    let match;
    while ((match = EXPORT_DECLARATION_PATTERN.exec(file.content)) !== null) {
      totalExports += 1;
      const lineIndex = file.content.slice(0, match.index).split("\n").length - 1;
      let scan = lineIndex - 1;
      while (scan >= 0 && lines[scan].trim() === "") scan -= 1;
      if (scan >= 0 && lines[scan].trim().endsWith("*/")) documented += 1;
    }

    if (totalExports === 0) continue;
    const coverage = documented / totalExports;
    if (coverage < LOW_DOC_COVERAGE_THRESHOLD) {
      findings.push({
        id: "low-documentation-coverage",
        severity: "suggestion",
        category: "documentation-quality",
        message: `"${file.path}": ${documented}/${totalExports} exported declaration(s) have a preceding doc comment (${Math.round(coverage * 100)}%).`,
        recommendation: { message: `Add JSDoc-style comments above exported declarations; below the ${Math.round(LOW_DOC_COVERAGE_THRESHOLD * 100)}% coverage threshold.` },
        evidence: { path: file.path, documented, totalExports, coverage },
        location: { file: file.path },
      });
    }
  }
  return findings;
}

function findEmptyCatchBlocks(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    EMPTY_CATCH_PATTERN.lastIndex = 0;
    const matches = file.content.match(EMPTY_CATCH_PATTERN);
    if (matches && matches.length > 0) {
      findings.push({
        id: "empty-catch-block",
        severity: "warning",
        category: "error-handling-consistency",
        message: `"${file.path}" has ${matches.length} empty catch block(s).`,
        recommendation: { message: "Silently swallowing errors hides failures. At minimum log the error, or explain in a comment why it's intentionally ignored." },
        evidence: { path: file.path, count: matches.length },
        location: { file: file.path },
      });
    }
  }
  return findings;
}

function findMixedAsyncStyle(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const thenCount = (file.content.match(/\.then\s*\(/g) ?? []).length;
    const asyncCount = (file.content.match(/\basync\s+(?:function|\()/g) ?? []).length;
    if (thenCount > 0 && asyncCount > 0) {
      findings.push({
        id: "mixed-async-style",
        severity: "suggestion",
        category: "api-consistency",
        message: `"${file.path}" mixes .then() chaining (${thenCount}) with async/await (${asyncCount}).`,
        recommendation: { message: "Pick one asynchronous style per file for readability and consistency." },
        evidence: { path: file.path, thenCount, asyncCount },
        location: { file: file.path },
      });
    }
  }
  return findings;
}

function findHighComplexityFiles(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    DECISION_POINT_PATTERN.lastIndex = 0;
    const count = (file.content.match(DECISION_POINT_PATTERN) ?? []).length;
    if (count > HIGH_COMPLEXITY_THRESHOLD) {
      findings.push({
        id: "high-branching-complexity",
        severity: "suggestion",
        category: "complexity",
        message: `"${file.path}" has ${count} decision point(s) (if/for/while/case), above the ${HIGH_COMPLEXITY_THRESHOLD} threshold.`,
        recommendation: { message: "High branching count is a proxy for complexity, not a certainty -- consider whether the file covers too many concerns." },
        evidence: { path: file.path, decisionPoints: count, threshold: HIGH_COMPLEXITY_THRESHOLD },
        location: { file: file.path },
      });
    }
  }
  return findings;
}

/**
 * Pure analysis function. input.sourceFiles is an array of
 * { path, content }.
 */
export async function analyzeCodeReview({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    return findings;
  }

  findings.push(...findNamingInconsistency(sourceFiles));
  findings.push(...findCrossFileDuplication(sourceFiles));
  findings.push(...findPossibleDeadFiles(sourceFiles));
  findings.push(...findLongFiles(sourceFiles));
  findings.push(...findLowDocumentationCoverage(sourceFiles));
  findings.push(...findEmptyCatchBlocks(sourceFiles));
  findings.push(...findMixedAsyncStyle(sourceFiles));
  findings.push(...findHighComplexityFiles(sourceFiles));

  const debtMarkers = findDebtMarkers(sourceFiles);
  if (debtMarkers.length > 0) {
    findings.push({
      id: "todo-fixme-markers",
      severity: "info",
      category: "technical-debt",
      message: `${debtMarkers.length} TODO/FIXME marker(s) found across the analyzed source.`,
      recommendation: { message: "Review and track these deliberately rather than letting them accumulate silently." },
      evidence: { markers: debtMarkers.slice(0, 20), truncated: debtMarkers.length > 20 },
    });
  }

  const totalLines = sourceFiles.reduce((sum, f) => sum + f.content.split("\n").length, 0);
  findings.push({
    id: "code-size-summary",
    severity: "info",
    category: "code-organization",
    message: `Analyzed ${sourceFiles.length} file(s), ${totalLines} total line(s), ${Math.round(totalLines / sourceFiles.length)} average line(s) per file.`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { fileCount: sourceFiles.length, totalLines, averageLinesPerFile: Math.round(totalLines / sourceFiles.length) },
  });

  return findings;
}

export const codeReviewAdvisor = {
  id: "code-review",
  name: "Code Review Advisor",
  version: "1.0.0",
  category: "code-quality",
  description:
    "Analyzes source code quality: naming consistency, cross-file duplication, dead code, " +
    "maintainability, documentation coverage, TODO/FIXME usage, error-handling consistency, API " +
    "consistency, and complexity heuristics. Read-only, evidence-based.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzeCodeReview,
};
