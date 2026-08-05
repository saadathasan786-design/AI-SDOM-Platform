/**
 * Generation Report — wraps a runGenerator() call and produces a structured
 * report: success, warnings, rollback status, files created/modified/
 * skipped, and execution time. Generic over any registered generator.
 *
 * This sits ON TOP of executor.js, not inside it — the executor's own
 * return shapes and thrown-error contract (tested in Stage 3A) are
 * untouched. This module only interprets those results/errors into one
 * consistent report shape.
 *
 * Stage 3E addition: `files.modified` (alongside the existing `created`/
 * `skipped`) and a top-level `no_op` array, reflecting the executor's new
 * "modify" and "skip" operation types used by Injection Generators. Purely
 * additive — no existing field was renamed or removed.
 */

import { runGenerator } from "./executor.js";

const ROLLBACK_PATTERN = /writing (\d+) file\(s\); all were rolled back/;

function buildReport({ generatorName, mode, startedAt, result, error }) {
  const execution_ms = Date.now() - startedAt;
  const timestamp = new Date().toISOString();

  if (error) {
    const match = ROLLBACK_PATTERN.exec(error.message);
    return {
      generator: generatorName,
      mode,
      success: false,
      warnings: [],
      rollback: match
        ? { occurred: true, files_removed: Number(match[1]) }
        : { occurred: false, files_removed: 0 },
      files: { created: [], modified: [], skipped: [] },
      no_op: [],
      execution_ms,
      timestamp,
      error: error.message,
    };
  }

  const warnings = [];
  let created = [];
  let modified = [];
  let skipped = [];
  const noOp = (result.skipped_no_op ?? []).map((f) => ({ path: f.path, reason: f.reason }));

  if (mode === "write") {
    created = result.files_created ?? [];
    modified = result.files_modified ?? [];
  } else if (mode === "dry-run") {
    skipped = result.conflicts;
    created = (result.files_created ?? []).filter((p) => !result.conflicts.includes(p));
    modified = (result.files_modified ?? []).filter((p) => !result.conflicts.includes(p));
    if (result.conflicts.length > 0) {
      warnings.push(
        `${result.conflicts.length} file(s) already exist and would block a write: ${result.conflicts.join(", ")}`
      );
    }
  } else if (mode === "preview") {
    created = result.files.filter((f) => (f.operation ?? "create") === "create").map((f) => f.path);
    modified = result.files.filter((f) => f.operation === "modify").map((f) => f.path);
  }

  if (noOp.length > 0) {
    warnings.push(
      `${noOp.length} file(s) needed no changes (already up to date): ${noOp.map((f) => f.path).join(", ")}`
    );
  }

  return {
    generator: generatorName,
    mode,
    success: true,
    warnings,
    rollback: { occurred: false, files_removed: 0 },
    files: { created, modified, skipped },
    no_op: noOp,
    execution_ms,
    timestamp,
    error: null,
  };
}

/**
 * Runs a registered generator and returns a structured Generation Report
 * instead of the executor's raw result — never throws; failures are
 * reported via `report.success === false` and `report.error`.
 */
export async function runGeneratorWithReport(name, config, options = {}) {
  const startedAt = Date.now();
  const mode = options.mode ?? "write";
  try {
    const result = await runGenerator(name, config, options);
    return buildReport({ generatorName: name, mode, startedAt, result });
  } catch (error) {
    return buildReport({ generatorName: name, mode, startedAt, error });
  }
}
