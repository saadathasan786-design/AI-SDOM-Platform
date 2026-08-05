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
} from "../agent-cli.js";

test("parseArgs extracts command, positional args, and --json flag", () => {
  const result = parseArgs(["run", "architecture-remediation", "--json"]);
  assert.equal(result.command, "run");
  assert.deepEqual(result.positional, ["architecture-remediation"]);
  assert.equal(result.flags.json, true);
});

test("parseArgs extracts --context with its value", () => {
  const result = parseArgs(["run", "architecture-remediation", "--context", "./ctx.json"]);
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-cli-test-"));
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-cli-test-"));
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

test("classifyRunExitCode returns 3 for an unknown-agent failure", () => {
  const report = { success: false, errors: [{ message: 'Unknown agent: "x". Registered agents: a, b' }] };
  assert.equal(classifyRunExitCode(report), 3);
});

test("classifyRunExitCode returns 1 for any other framework execution failure", () => {
  const report = { success: false, errors: [{ message: 'Agent "x" requires input "sourceFiles" but it was not provided.' }] };
  assert.equal(classifyRunExitCode(report), 1);
});

test("classifyCheckExitCode returns 0 when error is null, even if compatible is false due to missing deps", () => {
  assert.equal(classifyCheckExitCode({ compatible: false, error: null }), 0);
  assert.equal(classifyCheckExitCode({ compatible: true, error: null }), 0);
});

test("classifyCheckExitCode returns 3 when error is populated (unknown agent)", () => {
  assert.equal(classifyCheckExitCode({ compatible: false, error: 'Unknown agent: "x".' }), 3);
});

test("formatHumanCatalog renders every field for every entry", () => {
  const catalog = [
    {
      id: "test-agent",
      name: "Test Agent",
      category: "test",
      description: "A test description.",
      inputRequirements: ["sourceFiles"],
      capabilities: ["invokes-generators"],
      requiresAdvisors: ["security"],
      requiresGenerators: ["theme"],
    },
  ];
  const output = formatHumanCatalog(catalog);
  assert.match(output, /test-agent/);
  assert.match(output, /Test Agent/);
  assert.match(output, /A test description\./);
  assert.match(output, /sourceFiles/);
  assert.match(output, /invokes-generators/);
  assert.match(output, /security/);
  assert.match(output, /theme/);
});

test("formatHumanCatalog handles an agent with no dependencies or capabilities gracefully", () => {
  const catalog = [
    {
      id: "x",
      name: "X",
      category: "x",
      description: "d",
      inputRequirements: [],
      capabilities: [],
      requiresAdvisors: [],
      requiresGenerators: [],
    },
  ];
  const output = formatHumanCatalog(catalog);
  assert.match(output, /\(none\)/);
});

test("formatHumanReport shows success status, summary, and step details", () => {
  const report = {
    agent: "architecture-remediation",
    success: true,
    errors: [],
    execution_ms: 5,
    summary: { advisorsRun: ["architecture"], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 },
    steps: [
      {
        type: "advisors",
        ids: ["architecture"],
        result: { success: true, findings: [{ id: "x", severity: "info", message: "test finding" }] },
        decision: { action: "stop", reason: "nothing to do" },
      },
    ],
    recommendations: ["nothing to do"],
  };
  const output = formatHumanReport(report);
  assert.match(output, /Status: SUCCESS/);
  assert.match(output, /advisorsRun=\[architecture\]/);
  assert.match(output, /test finding/);
  assert.match(output, /decision: stop \(nothing to do\)/);
  assert.match(output, /Recommendations:/);
});

test("formatHumanReport shows the error message when the report failed", () => {
  const report = {
    agent: "x",
    success: false,
    errors: [{ message: 'Unknown agent: "x".' }],
    execution_ms: 0,
    summary: { advisorsRun: [], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 },
    steps: [],
    recommendations: [],
  };
  const output = formatHumanReport(report);
  assert.match(output, /Status: FAILED/);
  assert.match(output, /Error: Unknown agent/);
});

test("formatHumanReport shows a generator step's mode and result", () => {
  const report = {
    agent: "x",
    success: true,
    errors: [],
    execution_ms: 10,
    summary: { advisorsRun: [], generatorsRun: ["theme"], stepsSkipped: 0, stepsFailed: 0 },
    steps: [
      {
        type: "generator",
        generatorId: "theme",
        options: { mode: "dry-run" },
        result: { success: true },
        decision: { action: "stop" },
      },
    ],
    recommendations: [],
  };
  const output = formatHumanReport(report);
  assert.match(output, /generator: theme \(mode: dry-run\)/);
  assert.match(output, /result: SUCCESS/);
});

test("formatHumanCompatibility shows compatible status and missing dependencies", () => {
  const result = { agent: "x", compatible: false, missingAdvisors: ["security"], missingGenerators: [], error: null };
  const output = formatHumanCompatibility(result);
  assert.match(output, /Compatible: false/);
  assert.match(output, /Missing advisors: security/);
  assert.match(output, /Missing generators: \(none\)/);
});

test("formatHumanCompatibility shows the error for an unknown agent", () => {
  const result = { agent: "x", compatible: false, missingAdvisors: [], missingGenerators: [], error: 'Unknown agent: "x".' };
  const output = formatHumanCompatibility(result);
  assert.match(output, /Error: Unknown agent/);
});
