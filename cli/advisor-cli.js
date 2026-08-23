#!/usr/bin/env node
/**
 * Advisor CLI — Stage 4K. A thin command-line adapter over the existing
 * Advisor Framework (../advisors/). Contains NO analysis logic, NO
 * severity calculation, NO finding creation, NO report generation.
 *
 * Every command below delegates directly to advisors/index.js's own,
 * already-tested functions (listAdvisorCatalog, runAdvisorWithReport,
 * runAdvisors) and prints their result, formatted or raw depending on
 * --json. This is the SAME role mcp-server/advisor-tools.js plays for
 * MCP (Stage 4J) -- a second, independent thin adapter over the identical
 * framework functions, with zero framework changes required for either.
 *
 * TESTABILITY: this file is both an importable module (parseArgs,
 * loadContextFile, the formatters, and main() are all exported for unit
 * testing) and a runnable script. The bottom `if (import.meta.url === ...)`
 * guard means importing this file for tests never triggers process.exit()
 * or real stdout/stderr writes -- only actually running it as
 * `node advisor-cli.js ...` does.
 *
 * EXIT CODES (documented fully in docs/ADVISOR-CLI.md):
 *   0 - success
 *   1 - framework execution failure (a real advisor/report error other
 *       than "unknown advisor")
 *   2 - invalid command-line usage (missing/malformed args, missing
 *       context file, invalid JSON in the context file, unknown command)
 *   3 - unknown advisor id(s)
 *
 * "Unknown advisor" vs "framework execution failure" distinction: since
 * runAdvisorWithReport()/runAdvisors() never throw and encode ALL
 * failures identically as `success: false` + an `error` string, this CLI
 * distinguishes them by checking whether that string starts with
 * "Unknown advisor:" (the exact, stable prefix getAdvisor() has used
 * since Stage 4B). This is NOT duplicated validation -- it's reading an
 * already-computed error message to pick an appropriate exit code, the
 * same way any CLI adapter maps a library's error into a process exit
 * status.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAdvisorCatalog, runAdvisorWithReport, runAdvisors } from "../advisors/index.js";
import { resolveProjectSource } from "../project-discovery/resolve-project-source.js";

export const CLI_VERSION = "1.0.0";

const USAGE = `Usage: advisor <command> [options]

Commands:
  list                        List all registered Advisors
  run <id>                    Run a single Advisor
  run-many <id> [id...]       Run multiple Advisors concurrently
  version                     Show CLI and Advisor Framework version info
  help                        Show this help message

Options:
  --context <file>            Path to a JSON file supplying the advisor's context
  --project-root <path>       Discover context automatically from a project directory (mutually exclusive with --context)
  --json                      Output raw JSON instead of human-readable text

Examples:
  advisor list
  advisor list --json
  advisor run security --context ./context.json
  advisor run security --project-root ./my-plugin
  advisor run-many architecture security --context ./context.json --json
  advisor version
  advisor help`;

/** Parses argv (already stripped of "node script.js") into command/positional/flags. */
export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const flags = { json: false, context: null, projectRoot: null };
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (token === "--json") {
      flags.json = true;
    } else if (token === "--context") {
      flags.context = rest[i + 1];
      i++;
    } else if (token === "--project-root") {
      flags.projectRoot = rest[i + 1];
      i++;
    } else if (!token.startsWith("--")) {
      positional.push(token);
    }
  }
  return { command, positional, flags };
}

/**
 * Loads and parses a JSON context file. Throws a distinguishable error
 * for a missing file vs. invalid JSON, both mapped to exit code 2
 * (invalid usage) by the caller.
 */
export async function loadContextFile(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    const error = new Error(`Context file not found: "${filePath}"`);
    error.code = "MISSING_CONTEXT_FILE";
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch (parseErr) {
    const error = new Error(`Context file is not valid JSON: "${filePath}" (${parseErr.message})`);
    error.code = "INVALID_CONTEXT_JSON";
    throw error;
  }
}

/**
 * Resolves the context to run against from either --context or
 * --project-root, enforcing mutual exclusivity between them. Returns
 * { context } on success or { error } on failure -- never throws, and
 * never calls discoverProject() and loadContextFile() together.
 *
 * Stage 10B: --project-root's own resolution now delegates to the
 * shared resolveProjectSource() helper
 * (project-discovery/resolve-project-source.js) -- the exact same
 * ~6-line core previously duplicated byte-for-byte across all three CLI
 * files and all three MCP tool files. The mutual-exclusivity CHECK
 * itself stays local to this file (rather than also delegating to the
 * helper's own internal check) specifically to preserve this CLI's
 * pre-existing, byte-for-byte error message wording, which differs
 * from MCP's own pre-existing wording -- confirmed during migration
 * validation. --context's own JSON-file-loading remains entirely local
 * to this file, exactly as Stage 10A's evidence found no cross-adapter
 * duplication to justify moving it: MCP's `context` is already a
 * parsed object (no file to load), so the shared helper deliberately
 * never touches file I/O.
 */
async function resolveContext(flags) {
  if (flags.context && flags.projectRoot) {
    return { error: "--context and --project-root are mutually exclusive; specify only one." };
  }

  if (flags.projectRoot) {
    const resolved = await resolveProjectSource({ projectRoot: flags.projectRoot });
    if (!resolved.ok) {
      return { error: resolved.error };
    }
    return { context: resolved.context };
  }

  if (flags.context) {
    try {
      const context = await loadContextFile(flags.context);
      return { context };
    } catch (err) {
      return { error: err.message };
    }
  }

  return { context: {} };
}

function isUnknownAdvisorError(message) {
  return typeof message === "string" && message.startsWith("Unknown advisor:");
}

export function classifyRunExitCode(report) {
  if (report.success) return 0;
  return isUnknownAdvisorError(report.error) ? 3 : 1;
}

export function classifyRunManyExitCode(report) {
  if (report.success) return 0;
  const failedReports = report.advisorReports.filter((r) => !r.success);
  const allUnknown = failedReports.length > 0 && failedReports.every((r) => isUnknownAdvisorError(r.error));
  return allUnknown ? 3 : 1;
}

export function formatHumanCatalog(catalog) {
  const lines = [`Registered Advisors (${catalog.length}):`, ""];
  for (const entry of catalog) {
    lines.push(`  ${entry.id} - ${entry.name} [${entry.category}]`);
    lines.push(`    ${entry.description}`);
    lines.push(`    inputs: ${entry.inputRequirements.join(", ") || "(none)"}`);
    lines.push(`    severities: ${entry.supportedSeverities.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function formatFindingLine(f) {
  const location = f.location ? ` (${f.location.file}${f.location.line ? ":" + f.location.line : ""})` : "";
  return `  [${f.severity.toUpperCase()}] ${f.id}: ${f.message}${location}`;
}

export function formatHumanReport(report) {
  const lines = [];
  lines.push(`Advisor: ${report.advisor}`);
  lines.push(`Status: ${report.success ? "SUCCESS" : "FAILED"}`);
  if (!report.success) lines.push(`Error: ${report.error}`);
  lines.push(`Execution time: ${report.execution_ms}ms`);
  lines.push(
    `Summary: info=${report.summary.info} suggestion=${report.summary.suggestion} warning=${report.summary.warning} critical=${report.summary.critical}`
  );
  if (report.findings.length > 0) {
    lines.push("", "Findings:");
    for (const f of report.findings) lines.push(formatFindingLine(f));
  }
  return lines.join("\n");
}

export function formatHumanUnifiedReport(report) {
  const lines = [];
  lines.push(`Advisors run: ${report.advisorsRun.join(", ") || "(none)"}`);
  if (report.advisorsFailed.length > 0) lines.push(`Advisors failed: ${report.advisorsFailed.join(", ")}`);
  lines.push(`Overall status: ${report.success ? "SUCCESS" : "FAILED"}`);
  lines.push(`Total execution time: ${report.execution_ms}ms`);
  lines.push(
    `Combined summary: info=${report.summary.info} suggestion=${report.summary.suggestion} warning=${report.summary.warning} critical=${report.summary.critical}`
  );
  lines.push("", "Per-advisor results:");
  for (const advisorReport of report.advisorReports) {
    const status = advisorReport.success ? "SUCCESS" : `FAILED (${advisorReport.error})`;
    lines.push(`  ${advisorReport.advisor}: ${status} (${advisorReport.execution_ms}ms)`);
    for (const f of advisorReport.findings) lines.push(`  ${formatFindingLine(f)}`);
  }
  return lines.join("\n");
}

function formatHumanVersion(info) {
  return [
    `Advisor CLI version: ${info.cliVersion}`,
    `Advisor Framework version: ${info.advisorFrameworkVersion}`,
    `Supported commands: ${info.supportedCommands.join(", ")}`,
  ].join("\n");
}

/**
 * Runs the CLI against the given argv (already stripped of "node
 * script.js") and returns { exitCode, output } WITHOUT calling
 * process.exit() or writing to stdout/stderr itself -- so this can be
 * called directly in unit tests. Only the script-runner guard at the
 * bottom of this file actually exits the process / prints.
 */
export async function main(argv) {
  const { command, positional, flags } = parseArgs(argv);

  if (!command) {
    return { exitCode: 2, output: `Error: no command given.\n\n${USAGE}` };
  }

  if (command === "help") {
    return { exitCode: 0, output: USAGE };
  }

  if (command === "version") {
    const info = {
      cliVersion: CLI_VERSION,
      advisorFrameworkVersion:
        "not available -- the Advisor Framework has no version/compatibility concept yet (a deliberate Stage 4B decision, see docs/ADVISOR-FRAMEWORK.md)",
      supportedCommands: ["list", "run", "run-many", "version", "help"],
    };
    return { exitCode: 0, output: flags.json ? JSON.stringify(info, null, 2) : formatHumanVersion(info) };
  }

  if (command === "list") {
    const catalog = listAdvisorCatalog();
    return { exitCode: 0, output: flags.json ? JSON.stringify(catalog, null, 2) : formatHumanCatalog(catalog) };
  }

  if (command === "run") {
    const id = positional[0];
    if (!id) return { exitCode: 2, output: `Error: 'advisor run' requires an advisor id.\n\n${USAGE}` };

    const { context, error } = await resolveContext(flags);
    if (error) return { exitCode: 2, output: `Error: ${error}` };

    const report = await runAdvisorWithReport(id, context);
    const exitCode = classifyRunExitCode(report);
    const output = flags.json
      ? JSON.stringify({ command: "run", exitCode, report }, null, 2)
      : formatHumanReport(report);
    return { exitCode, output };
  }

  if (command === "run-many") {
    if (positional.length === 0) {
      return { exitCode: 2, output: `Error: 'advisor run-many' requires at least one advisor id.\n\n${USAGE}` };
    }

    const { context, error } = await resolveContext(flags);
    if (error) return { exitCode: 2, output: `Error: ${error}` };

    const report = await runAdvisors(positional, context);
    const exitCode = classifyRunManyExitCode(report);
    const output = flags.json
      ? JSON.stringify({ command: "run-many", exitCode, report }, null, 2)
      : formatHumanUnifiedReport(report);
    return { exitCode, output };
  }

  return { exitCode: 2, output: `Error: unknown command "${command}".\n\n${USAGE}` };
}

// Only runs when executed directly (e.g. `node advisor-cli.js ...` or via
// the npm bin symlink) -- never when imported by tests.
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { exitCode, output } = await main(process.argv.slice(2));
  if (output) {
    if (exitCode === 0) console.log(output);
    else console.error(output);
  }
  process.exit(exitCode);
}
