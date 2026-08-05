/**
 * PHP Parsing Utilities — Stage 11B. Promoted from three byte-identical
 * (or, for extractBalancedParens, logically identical modulo naming)
 * implementations independently duplicated across
 * wordpress-security-advisor.js (Stage 7B), wordpress-performance-advisor.js
 * (Stage 7C), and wordpress-hooks-core-advisor.js (Stage 7D).
 *
 * This promotion follows the exact same precedent already established by
 * source-analysis.js (Stage 4D): a shared utility extracted only after
 * real, independent, byte-identical duplication accumulated across
 * multiple real consumers — never speculative, never built ahead of
 * evidence. Three real advisors sharing byte-identical code is the same
 * class of evidence that justified source-analysis.js's own promotion.
 *
 * SCOPE, deliberately minimal: only the three generic, domain-agnostic
 * PHP-text-parsing helpers that were genuinely duplicated. Every
 * domain-specific regex pattern and every find*() detection function in
 * all three WordPress Advisors remains exactly where it was -- those
 * were never duplicated (each advisor's own detection logic is unique
 * to its own domain), so promoting them would be scope creep beyond
 * what the evidence supports.
 *
 * ZERO BEHAVIORAL CHANGE: every function below is copied verbatim
 * (byte-for-byte, including comments) from its most complete prior
 * instance. No regex was altered. No parsing logic was altered. The one
 * naming normalization applied is internal-only: wordpress-security
 * -advisor.js previously called this file's extractBalancedParens()
 * "extractBalancedCall" -- a private, unexported implementation detail
 * never part of any advisor's public analyze() output, so renaming its
 * call site to match the two already-consistent names elsewhere changes
 * nothing observable.
 */

/**
 * Masks single/double-quoted PHP string literal contents with spaces
 * (preserving length and newlines) so bracket-depth counting isn't
 * confused by a brace/paren that happens to appear inside a string.
 */
export function maskPhpStrings(content) {
  let result = "";
  let inString = false;
  let quoteChar = null;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inString) {
      if (ch === "\\" && i + 1 < content.length) {
        result += "  ";
        i++;
        continue;
      }
      if (ch === quoteChar) {
        inString = false;
        quoteChar = null;
        result += " ";
        continue;
      }
      result += ch === "\n" ? "\n" : " ";
      continue;
    }
    if (ch === "'" || ch === '"') {
      inString = true;
      quoteChar = ch;
      result += " ";
      continue;
    }
    result += ch;
  }
  return result;
}

/** Balanced-paren call extraction -- identical technique reused from every WordPress advisor. */
export function extractBalancedParens(content, openParenIndex) {
  const masked = maskPhpStrings(content);
  let depth = 0;
  for (let i = openParenIndex; i < masked.length; i++) {
    if (masked[i] === "(") depth++;
    else if (masked[i] === ")") {
      depth--;
      if (depth === 0) return content.slice(openParenIndex, i + 1);
    }
  }
  return content.slice(openParenIndex, Math.min(content.length, openParenIndex + 1000));
}

export function findLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}
