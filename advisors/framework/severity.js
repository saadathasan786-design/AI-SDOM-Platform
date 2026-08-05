/**
 * Severity — the single, unified severity vocabulary every Advisor uses,
 * regardless of domain (security, performance, SEO, accessibility, etc.).
 *
 * Deliberately one shared scale, not a per-domain system: this is what
 * makes a multi-advisor aggregate report meaningfully sortable/filterable
 * across categories. Inventing separate scales per advisor category would
 * break comparison the moment two categories' findings need to sit side
 * by side in one combined view.
 *
 * Ordered ascending by urgency — index position IS the rank.
 */

export const SEVERITY_LEVELS = ["info", "suggestion", "warning", "critical"];

export function isValidSeverity(level) {
  return SEVERITY_LEVELS.includes(level);
}

/** Numeric rank for sorting/comparison; higher = more urgent. -1 if invalid. */
export function severityRank(level) {
  return SEVERITY_LEVELS.indexOf(level);
}

/** Builds a zero-initialized { info: 0, suggestion: 0, warning: 0, critical: 0 } summary shape. */
export function emptySeveritySummary() {
  return Object.fromEntries(SEVERITY_LEVELS.map((level) => [level, 0]));
}
