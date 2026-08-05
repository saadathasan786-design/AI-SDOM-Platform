/**
 * Multi-Advisor Executor — Stage 4I. Implements the Stage 4A section 11 design.
 *
 * Runs multiple advisors concurrently against ONE shared context and
 * produces a Unified Advisor Report combining their results.
 *
 * === Why this needs no new fetching capability (no architectural blocker) ===
 *
 * advisor-executor.js (Stage 4B) deliberately never fetches inputs
 * itself -- the caller supplies a `context` object containing whatever it
 * already has, and the executor only picks out the keys a given advisor's
 * inputRequirements declares. This module inherits that same contract
 * exactly: runAdvisors(ids, context) takes ONE caller-supplied context,
 * identical in shape to what runAdvisor/runAdvisorWithReport already
 * accept.
 *
 * This is what makes "fetch every required input exactly once" and "no
 * duplicated Knowledge Graph builds / Generation Report loading / Memory
 * retrieval / Catalog queries" true BY CONSTRUCTION, not by new
 * deduplication logic: since every advisor in the batch reads from the
 * SAME single context object the caller already assembled, nothing is
 * ever fetched more than once -- there is only ever one fetch, done once,
 * by the caller, before calling runAdvisors() at all. No I/O of any kind
 * happens inside this module.
 *
 * === Failure isolation ===
 *
 * Each advisor is run via the existing, already-proven
 * runAdvisorWithReport() (Stage 4B) -- never runAdvisor() directly --
 * which already never throws. Running N of them via Promise.all means one
 * advisor's internal failure can never prevent the others' promises from
 * resolving; Promise.all only rejects if a promise itself rejects, and
 * runAdvisorWithReport()'s contract guarantees it never does.
 *
 * === Ordering ===
 *
 * Promise.all resolves to an array in the same order as the input
 * promises array, regardless of actual completion timing -- so mapping
 * uniqueIds to promises and awaiting them together gives deterministic,
 * input-order results with no extra bookkeeping needed.
 *
 * === Duplicate advisor IDs ===
 *
 * Deduplicated via [...new Set(ids)], preserving first-occurrence order.
 * Running the same advisor's pure analyze() twice against the identical
 * shared context would always produce identical results -- pure waste,
 * not a meaningful re-check -- so this is deduplicated rather than run
 * twice.
 */

import { getAdvisor } from "./advisor-registry.js";
import { runAdvisorWithReport } from "./advisor-report.js";
import { emptySeveritySummary } from "./severity.js";

/**
 * Computes the union of inputRequirements across the given advisor ids.
 * Never throws: an unknown advisor id is simply skipped here (its own
 * runAdvisorWithReport() call surfaces that as an isolated per-advisor
 * failure during execution, not a whole-batch crash during this
 * bookkeeping step).
 */
function computeInputRequirementsUnion(ids) {
  const union = new Set();
  for (const id of ids) {
    try {
      const def = getAdvisor(id);
      for (const requirement of def.inputRequirements) union.add(requirement);
    } catch {
      // Unknown advisor id -- handled as an isolated failure at execution time.
    }
  }
  return [...union];
}

/**
 * Runs multiple advisors concurrently against one shared context.
 *
 * @param {string[]} ids - advisor ids to run (duplicates are deduplicated)
 * @param {object} context - the SAME shape runAdvisor/runAdvisorWithReport
 *   accept: a bag of whatever inputs the caller already has, e.g.
 *   { generationReport, knowledgeGraph, memoryHistory, sourceFiles, catalogMetadata }
 * @returns {Promise<object>} a Unified Advisor Report -- never throws
 */
export async function runAdvisors(ids, context = {}) {
  const startedAt = Date.now();
  const uniqueIds = [...new Set(ids)];

  const inputRequirementsUnion = computeInputRequirementsUnion(uniqueIds);

  const advisorReports = await Promise.all(uniqueIds.map((id) => runAdvisorWithReport(id, context)));

  const advisorsRun = [];
  const advisorsFailed = [];
  const findings = [];
  const summary = emptySeveritySummary();

  advisorReports.forEach((report, index) => {
    const id = uniqueIds[index];
    if (report.success) {
      advisorsRun.push(id);
      findings.push(...report.findings);
      for (const level of Object.keys(summary)) {
        summary[level] += report.summary?.[level] ?? 0;
      }
    } else {
      advisorsFailed.push(id);
    }
  });

  return {
    success: advisorsFailed.length === 0,
    advisorCount: uniqueIds.length,
    advisorsRun,
    advisorsFailed,
    findings,
    summary,
    advisorReports,
    inputRequirementsUnion,
    execution_ms: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };
}
