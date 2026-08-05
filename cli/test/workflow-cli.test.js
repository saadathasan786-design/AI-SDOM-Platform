import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  parseArgs,
  loadContextFile,
  classifyRunExitCode,
  classifyCheckExitCode,
  formatHumanCatalog,
  formatHumanReport,
  formatHumanCompatibility,
} from "../workflow-cli.js";

test("parseArgs extracts command, positional args, and --json flag", () => {
  const result = parseArgs(["run", "project-health-check", "--json"]);
  assert.equal(result.command, "run");
  assert.deepEqual(result.positional, ["project-health-check"]);
  assert.equal(result.flags.json, true);
});

test("parseArgs extracts --context with its value", () => {
  const result = parseArgs(["run", "project-health-check", "--context", "./ctx.json"]);
  assert.equal(result.flags.context, "./ctx.json");
});

test("parseArgs with no argv at all returns undefined command and empty positional/flags", () => {
  const result = parseArgs([]);
  assert.equal(result.command, undefined);
  assert.deepEqual(result.positional, []);
  assert.equal(result.flags.json, false);
  assert.equal(result.flags.context, null);
});

test("loadContextFile parses a valid JSON file correctly", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-cli-test-"));
  const filePath = path.join(tmpDir, "ctx.json");
  await fs.writeFile(filePath, JSON.stringify({ sourceFiles: [] }));

  const context = await loadContextFile(filePath);
  assert.deepEqual(context, { sourceFiles: [] });
});

test("loadContextFile throws a clear, distinguishable error for a missing file", async () => {
  await assert.rejects(
    () => loadContextFile("/definitely/does/not/exist.json"),
    (err) => {
      assert.match(err.message, /Context file not found/);
      assert.equal(err.code, "MISSING_CONTEXT_FILE");
      return true;
    }
  );
});

test("loadContextFile throws a clear, distinguishable error for invalid JSON", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-cli-test-"));
  const filePath = path.join(tmpDir, "bad.json");
  await fs.writeFile(filePath, "not valid json {{{");

  await assert.rejects(
    () => loadContextFile(filePath),
    (err) => {
      assert.match(err.message, /not valid JSON/);
      assert.equal(err.code, "INVALID_CONTEXT_JSON");
      return true;
    }
  );
});

test("classifyRunExitCode returns 0 for a successful report", () => {
  assert.equal(classifyRunExitCode({ success: true, errors: [] }), 0);
});

test("classifyRunExitCode returns 3 for an unknown-workflow failure", () => {
  const report = { success: false, errors: [{ message: 'Unknown workflow: "x". Registered workflows: a, b' }] };
  assert.equal(classifyRunExitCode(report), 3);
});

test("classifyRunExitCode returns 1 for any other framework execution failure", () => {
  const report = { success: false, errors: [{ message: 'Workflow "x" requires input "sourceFiles" but it was not provided.' }] };
  assert.equal(classifyRunExitCode(report), 1);
});

test("classifyCheckExitCode returns 0 when error is null, even if compatible is false due to missing deps", () => {
  assert.equal(classifyCheckExitCode({ compatible: false, error: null }), 0);
  assert.equal(classifyCheckExitCode({ compatible: true, error: null }), 0);
});

test("classifyCheckExitCode returns 3 when error is populated (unknown workflow)", () => {
  assert.equal(classifyCheckExitCode({ compatible: false, error: 'Unknown workflow: "x".' }), 3);
});

test("formatHumanCatalog renders every field for every entry", () => {
  const catalog = [
    {
      id: "test-workflow",
      name: "Test Workflow",
      category: "test",
      description: "A test description.",
      inputRequirements: ["sourceFiles"],
      capabilities: ["chains-agents"],
      requiredAgents: ["architecture-remediation"],
    },
  ];
  const output = formatHumanCatalog(catalog);
  assert.match(output, /test-workflow/);
  assert.match(output, /Test Workflow/);
  assert.match(output, /A test description\./);
  assert.match(output, /sourceFiles/);
  assert.match(output, /chains-agents/);
  assert.match(output, /architecture-remediation/);
});

test("formatHumanCatalog handles a workflow with no dependencies or capabilities gracefully", () => {
  const catalog = [
    {
      id: "x",
      name: "X",
      category: "x",
      description: "d",
      inputRequirements: [],
      capabilities: [],
      requiredAgents: [],
    },
  ];
  const output = formatHumanCatalog(catalog);
  assert.match(output, /\(none\)/);
});

test("formatHumanReport shows success status, summary, and agent step details including nested advisor findings", () => {
  const report = {
    workflow: "project-health-check",
    success: true,
    errors: [],
    execution_ms: 5,
    summary: { agentsRun: ["architecture-remediation"], stepsFailed: 0 },
    steps: [
      {
        agentId: "architecture-remediation",
        agentReport: {
          success: true,
          steps: [
            {
              type: "advisors",
              ids: ["architecture"],
              result: { success: true, findings: [{ id: "layer-violation", severity: "critical", message: "test finding" }] },
            },
          ],
        },
        decision: { action: "stop", reason: "nothing to do" },
      },
    ],
    recommendations: ["nothing to do"],
  };
  const output = formatHumanReport(report);
  assert.match(output, /Status: SUCCESS/);
  assert.match(output, /agentsRun=\[architecture-remediation\]/);
  assert.match(output, /Agent "architecture-remediation"/);
  assert.match(output, /agent status: SUCCESS/);
  assert.match(output, /test finding/);
  assert.match(output, /decision: stop \(nothing to do\)/);
  assert.match(output, /Recommendations:/);
});

test("formatHumanReport shows the error message when the report failed", () => {
  const report = {
    workflow: "x",
    success: false,
    errors: [{ message: 'Unknown workflow: "x".' }],
    execution_ms: 0,
    summary: { agentsRun: [], stepsFailed: 0 },
    steps: [],
    recommendations: [],
  };
  const output = formatHumanReport(report);
  assert.match(output, /Status: FAILED/);
  assert.match(output, /Error: Unknown workflow/);
});

test("formatHumanReport shows a generator step's mode and result nested inside an agent step", () => {
  const report = {
    workflow: "x",
    success: true,
    errors: [],
    execution_ms: 10,
    summary: { agentsRun: ["architecture-remediation"], stepsFailed: 0 },
    steps: [
      {
        agentId: "architecture-remediation",
        agentReport: {
          success: true,
          steps: [{ type: "generator", generatorId: "theme", result: { success: true, mode: "dry-run" } }],
        },
        decision: { action: "stop" },
      },
    ],
    recommendations: [],
  };
  const output = formatHumanReport(report);
  assert.match(output, /generator: theme \(mode: dry-run\)/);
  assert.match(output, /-> SUCCESS/);
});

test("formatHumanCompatibility shows compatible status and missing agents", () => {
  const result = { workflow: "x", compatible: false, missingAgents: ["security-remediation"], error: null };
  const output = formatHumanCompatibility(result);
  assert.match(output, /Compatible: false/);
  assert.match(output, /Missing agents: security-remediation/);
});

test("formatHumanCompatibility shows the error for an unknown workflow", () => {
  const result = { workflow: "x", compatible: false, missingAgents: [], error: 'Unknown workflow: "x".' };
  const output = formatHumanCompatibility(result);
  assert.match(output, /Error: Unknown workflow/);
});
