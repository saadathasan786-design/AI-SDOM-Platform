#!/usr/bin/env node
/**
 * Agent CLI — Stage 5E. A thin command-line adapter over the existing
 * Agent Framework (../agents/). Contains NO planning logic, NO decision
 * logic, NO analysis logic, NO generation logic, NO report construction.
 *
 * Mirrors advisor-cli.js (Stage 4K) exactly in structure and discipline:
 * every command delegates directly to agents/index.js's own,
 * already-tested functions (listAgentCatalog, runAgentWithReport,
 * checkCompatibility) and prints their result, formatted or raw
 * depending on --json.
 *
 * TESTABILITY: same pattern as advisor-cli.js -- parseArgs,
 * loadContextFile, the formatters, and main() are all exported for unit
 * testing. The bottom `if (import.meta.url === ...)` guard means
 * importing this file for tests never triggers process.exit() or real
 * stdout/stderr writes.
 *
 * EXIT CODES (documented fully in docs/AGENT-CLI.md), identical
 * philosophy to advisor-cli.js:
 *   0 - success
 *   1 - framework execution failure (a real agent/step error other than
 *       "unknown agent")
 *   2 - invalid command-line usage (missing/malformed args, missing
 *       context file, invalid JSON in the context file, unknown command)
 *   3 - unknown agent id
 *
 * "Unknown agent" vs "framework execution failure" is distinguished the
 * same way advisor-cli.js distinguishes "unknown advisor": checking
 * whether the framework's own error string starts with "Unknown agent:"
 * (the exact, stable prefix getAgent() has used since Stage 5B). This is
 * NOT duplicated validation -- it's reading an already-computed error
 * message to pick an exit code.
 */

import fs from "node:fs/promises";
import { listAgentCatalog, runAgentWithReport, checkCompatibility } from "../agents/index.js";
import { resolveProjectSource } from "../project-discovery/resolve-project-source.js";

export const CLI_VERSION = "1.0.0";

const USAGE = `Usage: agent <command> [options]

Commands:
  list                        List all registered Agents
  run <agent-id>               Run a single Agent
  check <agent-id>             Check an Agent's Advisor/Generator compatibility
  help                        Show this help message

Options:
  --context <file>            Path to a JSON file supplying the agent's context (for run)
  --project-root <path>       Discover context automatically from a project directory (mutually exclusive with --context)
  --json                      Output raw JSON instead of human-readable text

Examples:
  agent list
  agent list --json
  agent run architecture-remediation --context ./context.json
  agent run plugin-security-remediation --project-root ./my-plugin
  agent check architecture-remediation
  agent help`;

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

function isUnknownAgentError(message) {
  return typeof message === "string" && message.startsWith("Unknown agent:");
}

export function classifyRunExitCode(report) {
  if (report.success) return 0;
  const message = report.errors?.[0]?.message;
  return isUnknownAgentError(message) ? 3 : 1;
}

export function classifyCheckExitCode(result) {
  return result.error ? 3 : 0;
}

export function formatHumanCatalog(catalog) {
  const lines = [`Registered Agents (${catalog.length}):`, ""];
  for (const entry of catalog) {
    lines.push(`  ${entry.id} - ${entry.name} [${entry.category}]`);
    lines.push(`    ${entry.description}`);
    lines.push(`    inputs: ${entry.inputRequirements.join(", ") || "(none)"}`);
    lines.push(`    capabilities: ${entry.capabilities.join(", ") || "(none)"}`);
    lines.push(`    requires advisors: ${entry.requiresAdvisors.join(", ") || "(none)"}`);
    lines.push(`    requires generators: ${entry.requiresGenerators.join(", ") || "(none)"}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function formatStepLine(step, index) {
  const lines = [`  Step ${index} (${step.type}):`];
  if (step.type === "advisors") {
    lines.push(`    advisors: ${step.ids?.join(", ")}`);
    lines.push(`    result: ${step.result?.success ? "SUCCESS" : "FAILED"}`);
    for (const f of step.result?.findings ?? []) {
      lines.push(`      [${f.severity.toUpperCase()}] ${f.id}: ${f.message}`);
    }
  } else if (step.type === "generator") {
    lines.push(`    generator: ${step.generatorId} (mode: ${step.options?.mode ?? "write"})`);
    lines.push(`    result: ${step.result?.success ? "SUCCESS" : "FAILED"}`);
  }
  lines.push(`    decision: ${step.decision?.action}${step.decision?.reason ? ` (${step.decision.reason})` : ""}`);
  return lines.join("\n");
}

export function formatHumanReport(report) {
  const lines = [];
  lines.push(`Agent: ${report.agent}`);
  lines.push(`Status: ${report.success ? "SUCCESS" : "FAILED"}`);
  if (!report.success && report.errors.length > 0) {
    lines.push(`Error: ${report.errors[0].message}`);
  }
  lines.push(`Execution time: ${report.execution_ms}ms`);
  lines.push(
    `Summary: advisorsRun=[${report.summary.advisorsRun.join(", ")}] generatorsRun=[${report.summary.generatorsRun.join(", ")}] stepsSkipped=${report.summary.stepsSkipped} stepsFailed=${report.summary.stepsFailed}`
  );
  if (report.steps.length > 0) {
    lines.push("", "Steps:");
    report.steps.forEach((step, i) => lines.push(formatStepLine(step, i)));
  }
  if (report.recommendations.length > 0) {
    lines.push("", "Recommendations:");
    for (const r of report.recommendations) lines.push(`  - ${r}`);
  }
  return lines.join("\n");
}

export function formatHumanCompatibility(result) {
  const lines = [`Agent: ${result.agent}`, `Compatible: ${result.compatible}`];
  if (result.error) {
    lines.push(`Error: ${result.error}`);
  } else {
    lines.push(`Missing advisors: ${result.missingAdvisors.join(", ") || "(none)"}`);
    lines.push(`Missing generators: ${result.missingGenerators.join(", ") || "(none)"}`);
  }
  return lines.join("\n");
}

function formatHumanVersion(info) {
  return [
    `Agent CLI version: ${info.cliVersion}`,
    `Agent Framework version: ${info.agentFrameworkVersion}`,
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
      agentFrameworkVersion:
        "not available -- the Agent Framework has no version/compatibility concept yet, matching the same deliberate Advisor Framework decision (see docs/ADVISOR-FRAMEWORK.md and docs/AGENT-FRAMEWORK.md)",
      supportedCommands: ["list", "run", "check", "version", "help"],
    };
    return { exitCode: 0, output: flags.json ? JSON.stringify(info, null, 2) : formatHumanVersion(info) };
  }

  if (command === "list") {
    const catalog = listAgentCatalog();
    return { exitCode: 0, output: flags.json ? JSON.stringify(catalog, null, 2) : formatHumanCatalog(catalog) };
  }

  if (command === "run") {
    const id = positional[0];
    if (!id) return { exitCode: 2, output: `Error: 'agent run' requires an agent id.\n\n${USAGE}` };

    const { context, error } = await resolveContext(flags);
    if (error) return { exitCode: 2, output: `Error: ${error}` };

    const report = await runAgentWithReport(id, context);
    const exitCode = classifyRunExitCode(report);
    const output = flags.json
      ? JSON.stringify({ command: "run", exitCode, report }, null, 2)
      : formatHumanReport(report);
    return { exitCode, output };
  }

  if (command === "check") {
    const id = positional[0];
    if (!id) return { exitCode: 2, output: `Error: 'agent check' requires an agent id.\n\n${USAGE}` };

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
if (import.meta.url === `file://${process.argv[1]}`) {
  const { exitCode, output } = await main(process.argv.slice(2));
  if (output) {
    if (exitCode === 0) console.log(output);
    else console.error(output);
  }
  process.exit(exitCode);
}
