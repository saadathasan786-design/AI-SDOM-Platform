#!/usr/bin/env node
/**
 * Workflow CLI — thin command-line adapter over the existing Workflow
 * Framework (../workflows/). Contains NO planning logic, NO
 * orchestration logic, NO analysis logic, NO generation logic, NO
 * report construction.
 *
 * Mirrors agent-cli.js (Stage 5E) exactly in structure and discipline:
 * every command delegates directly to workflows/index.js's own,
 * already-tested functions (listWorkflowCatalog, runWorkflowWithReport,
 * checkCompatibility) and prints their result, formatted or raw
 * depending on --json.
 *
 * TESTABILITY: same pattern as agent-cli.js -- parseArgs,
 * loadContextFile, the formatters, and main() are all exported for unit
 * testing. The bottom `if (import.meta.url === ...)` guard means
 * importing this file for tests never triggers process.exit() or real
 * stdout/stderr writes.
 *
 * EXIT CODES (identical philosophy to advisor-cli.js/agent-cli.js):
 *   0 - success
 *   1 - framework execution failure (a real workflow/step error other
 *       than "unknown workflow")
 *   2 - invalid command-line usage (missing/malformed args, missing
 *       context file, invalid JSON in the context file, unknown command)
 *   3 - unknown workflow id
 *
 * "Unknown workflow" vs "framework execution failure" is distinguished
 * the same way agent-cli.js distinguishes "unknown agent": checking
 * whether the framework's own error string starts with
 * "Unknown workflow:" (the exact, stable prefix getWorkflow() has used
 * since Stage 6B). This is NOT duplicated validation -- it's reading an
 * already-computed error message to pick an exit code.
 *
 * "workflow check" mirrors "agent check"'s exit-code nuance exactly: a
 * REGISTERED workflow with missing agent dependencies (compatible:
 * false, error: null) exits 0 -- that's a legitimate answer, not a
 * failure. Only a genuinely UNKNOWN workflow id (error populated) exits
 * 3, using result.error exactly as done for the Agent CLI and the
 * Workflow MCP adapter.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listWorkflowCatalog, runWorkflowWithReport, checkCompatibility } from "../workflows/index.js";
import { resolveProjectSource } from "../project-discovery/resolve-project-source.js";

export const CLI_VERSION = "1.0.0";

const USAGE = `Usage: workflow <command> [options]

Commands:
  list                        List all registered Workflows
  run <workflow-id>            Run a single Workflow
  check <workflow-id>          Check a Workflow's Agent compatibility
  help                        Show this help message

Options:
  --context <file>            Path to a JSON file supplying the workflow's context (for run)
  --project-root <path>       Discover context automatically from a project directory (mutually exclusive with --context)
  --json                      Output raw JSON instead of human-readable text

Examples:
  workflow list
  workflow list --json
  workflow run project-health-check --context ./context.json
  workflow run plugin-health-audit --project-root ./my-plugin
  workflow check security-audit
  workflow help`;

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
 * { context } on success or { error } on failure -- never throws.
 *
 * Stage 10B: --project-root's own resolution now delegates to the
 * shared resolveProjectSource() helper
 * (project-discovery/resolve-project-source.js) -- see
 * advisor-cli.js's identical resolveContext() for the full rationale,
 * including why the mutual-exclusivity CHECK stays local (preserving
 * this CLI's own pre-existing error wording) while only --project-root
 * resolution itself is delegated.
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

function isUnknownWorkflowError(message) {
  return typeof message === "string" && message.startsWith("Unknown workflow:");
}

export function classifyRunExitCode(report) {
  if (report.success) return 0;
  const message = report.errors?.[0]?.message;
  return isUnknownWorkflowError(message) ? 3 : 1;
}

export function classifyCheckExitCode(result) {
  return result.error ? 3 : 0;
}

export function formatHumanCatalog(catalog) {
  const lines = [`Registered Workflows (${catalog.length}):`, ""];
  for (const entry of catalog) {
    lines.push(`  ${entry.id} - ${entry.name} [${entry.category}]`);
    lines.push(`    ${entry.description}`);
    lines.push(`    inputs: ${entry.inputRequirements.join(", ") || "(none)"}`);
    lines.push(`    capabilities: ${entry.capabilities.join(", ") || "(none)"}`);
    lines.push(`    requires agents: ${entry.requiredAgents.join(", ") || "(none)"}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function formatFindingLine(f) {
  const location = f.location ? ` (${f.location.file}${f.location.line ? ":" + f.location.line : ""})` : "";
  return `      [${f.severity.toUpperCase()}] ${f.id}: ${f.message}${location}`;
}

function formatAgentStepLine(step, index) {
  const lines = [`  Step ${index}: Agent "${step.agentId}"`];
  const agentReport = step.agentReport ?? {};
  lines.push(`    agent status: ${agentReport.success ? "SUCCESS" : "FAILED"}`);
  for (const agentStep of agentReport.steps ?? []) {
    if (agentStep.type === "advisors" || agentStep.type === "advisor") {
      const ids = agentStep.ids ?? (agentStep.id ? [agentStep.id] : []);
      lines.push(`    advisors: ${ids.join(", ")} -> ${agentStep.result?.success ? "SUCCESS" : "FAILED"}`);
      for (const f of agentStep.result?.findings ?? []) lines.push(formatFindingLine(f));
    } else if (agentStep.type === "generator") {
      lines.push(
        `    generator: ${agentStep.generatorId} (mode: ${agentStep.result?.mode ?? agentStep.options?.mode ?? "write"}) -> ${agentStep.result?.success ? "SUCCESS" : "FAILED"}`
      );
    }
  }
  lines.push(`    decision: ${step.decision?.action}${step.decision?.reason ? ` (${step.decision.reason})` : ""}`);
  return lines.join("\n");
}

export function formatHumanReport(report) {
  const lines = [];
  lines.push(`Workflow: ${report.workflow}`);
  lines.push(`Status: ${report.success ? "SUCCESS" : "FAILED"}`);
  if (!report.success && report.errors.length > 0) {
    lines.push(`Error: ${report.errors[0].message}`);
  }
  lines.push(`Execution time: ${report.execution_ms}ms`);
  lines.push(`Summary: agentsRun=[${report.summary.agentsRun.join(", ")}] stepsFailed=${report.summary.stepsFailed}`);
  if (report.steps.length > 0) {
    lines.push("", "Steps:");
    report.steps.forEach((step, i) => lines.push(formatAgentStepLine(step, i)));
  }
  if (report.recommendations.length > 0) {
    lines.push("", "Recommendations:");
    for (const r of report.recommendations) lines.push(`  - ${r}`);
  }
  return lines.join("\n");
}

export function formatHumanCompatibility(result) {
  const lines = [`Workflow: ${result.workflow}`, `Compatible: ${result.compatible}`];
  if (result.error) {
    lines.push(`Error: ${result.error}`);
  } else {
    lines.push(`Missing agents: ${result.missingAgents.join(", ") || "(none)"}`);
  }
  return lines.join("\n");
}

function formatHumanVersion(info) {
  return [
    `Workflow CLI version: ${info.cliVersion}`,
    `Workflow Framework version: ${info.workflowFrameworkVersion}`,
    `Supported commands: ${info.supportedCommands.join(", ")}`,
  ].join("\n");
}

/**
 * Runs the CLI against the given argv (already stripped of "node
 * script.js") and returns { exitCode, output } WITHOUT calling
 * process.exit() or writing to stdout/stderr itself.
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
      workflowFrameworkVersion:
        "not available -- the Workflow Framework has no version/compatibility concept yet, matching the same deliberate Advisor/Agent Framework decision",
      supportedCommands: ["list", "run", "check", "version", "help"],
    };
    return { exitCode: 0, output: flags.json ? JSON.stringify(info, null, 2) : formatHumanVersion(info) };
  }

  if (command === "list") {
    const catalog = listWorkflowCatalog();
    return { exitCode: 0, output: flags.json ? JSON.stringify(catalog, null, 2) : formatHumanCatalog(catalog) };
  }

  if (command === "run") {
    const id = positional[0];
    if (!id) return { exitCode: 2, output: `Error: 'workflow run' requires a workflow id.\n\n${USAGE}` };

    const { context, error } = await resolveContext(flags);
    if (error) return { exitCode: 2, output: `Error: ${error}` };

    const report = await runWorkflowWithReport(id, context);
    const exitCode = classifyRunExitCode(report);
    const output = flags.json
      ? JSON.stringify({ command: "run", exitCode, report }, null, 2)
      : formatHumanReport(report);
    return { exitCode, output };
  }

  if (command === "check") {
    const id = positional[0];
    if (!id) return { exitCode: 2, output: `Error: 'workflow check' requires a workflow id.\n\n${USAGE}` };

    const result = checkCompatibility(id);
    const exitCode = classifyCheckExitCode(result);
    const output = flags.json
      ? JSON.stringify({ command: "check", exitCode, result }, null, 2)
      : formatHumanCompatibility(result);
    return { exitCode, output };
  }

  return { exitCode: 2, output: `Error: unknown command "${command}".\n\n${USAGE}` };
}

// Only runs when executed directly -- never when imported by tests.
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { exitCode, output } = await main(process.argv.slice(2));
  if (output) {
    if (exitCode === 0) console.log(output);
    else console.error(output);
  }
  process.exit(exitCode);
}
