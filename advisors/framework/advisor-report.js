/**
 * Advisor Report — wraps a runAdvisor() call and produces a structured
 * report: success, findings, a per-severity summary count, and timing.
 * Never throws — failures are reported via `report.success === false`
 * and `report.error`, exactly like generation-report.js's own contract.
 *
 * This is what makes multi-advisor execution safe: calling this for
 * several advisors (sequentially or via Promise.all) means one advisor's
 * analyze() throwing can never prevent another's report from coming back
 * — each call is independently wrapped. No separate "multi-advisor
 * executor" module is needed for that guarantee to hold; it falls out of
 * this wrapper never throwing, the same way Stage 3's
 * runGeneratorWithReport() never throwing is what made its own callers
 * safe without extra orchestration code.
 */

import { runAdvisor } from "./advisor-executor.js";
import { emptySeveritySummary, isValidSeverity } from "./severity.js";

function summarize(findings) {
  const summary = emptySeveritySummary();
  for (const finding of findings) {
    if (isValidSeverity(finding?.severity)) {
      summary[finding.severity] += 1;
    }
  }
  return summary;
}

/**
 * Runs a registered advisor and returns a structured Advisor Report
 * instead of the executor's raw result — never throws.
 */
export async function runAdvisorWithReport(id, context = {}) {
  const startedAt = Date.now();

  try {
    const { findings } = await runAdvisor(id, context);
    return {
      advisor: id,
      success: true,
      findings,
      summary: summarize(findings),
      execution_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    return {
      advisor: id,
      success: false,
      findings: [],
      summary: emptySeveritySummary(),
      execution_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}
