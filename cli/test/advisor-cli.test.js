import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  parseArgs,
  loadContextFile,
  classifyRunExitCode,
  classifyRunManyExitCode,
  formatHumanCatalog,
  formatHumanReport,
  formatHumanUnifiedReport,
} from "../advisor-cli.js";

test("parseArgs extracts command, positional args, and --json flag", () => {
  const result = parseArgs(["run", "security", "--json"]);
  assert.equal(result.command, "run");
  assert.deepEqual(result.positional, ["security"]);
  assert.equal(result.flags.json, true);
});

test("parseArgs extracts --context with its value", () => {
  const result = parseArgs(["run", "security", "--context", "./ctx.json"]);
  assert.deepEqual(result.positional, ["security"]);
  assert.equal(result.flags.context, "./ctx.json");
});

test("parseArgs collects multiple positional ids for run-many", () => {
  const result = parseArgs(["run-many", "architecture", "security", "performance", "--json"]);
  assert.deepEqual(result.positional, ["architecture", "security", "performance"]);
});

test("parseArgs with no argv at all returns undefined command and empty positional/flags", () => {
  const result = parseArgs([]);
  assert.equal(result.command, undefined);
  assert.deepEqual(result.positional, []);
  assert.equal(result.flags.json, false);
  assert.equal(result.flags.context, null);
});

test("loadContextFile parses a valid JSON file correctly", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-test-"));
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-test-"));
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
  assert.equal(classifyRunExitCode({ success: true }), 0);
});

test("classifyRunExitCode returns 3 for an unknown-advisor failure", () => {
  assert.equal(classifyRunExitCode({ success: false, error: 'Unknown advisor: "x". Registered advisors: a, b' }), 3);
});

test("classifyRunExitCode returns 1 for any other framework execution failure", () => {
  assert.equal(classifyRunExitCode({ success: false, error: 'Advisor "x" requires input "sourceFiles" but it was not provided.' }), 1);
});

test("classifyRunManyExitCode returns 0 when the whole batch succeeds", () => {
  assert.equal(classifyRunManyExitCode({ success: true, advisorReports: [] }), 0);
});

test("classifyRunManyExitCode returns 3 when every failure is an unknown-advisor error", () => {
  const report = {
    success: false,
    advisorReports: [
      { success: true },
      { success: false, error: 'Unknown advisor: "x". Registered advisors: a' },
    ],
  };
  assert.equal(classifyRunManyExitCode(report), 3);
});

test("classifyRunManyExitCode returns 1 when at least one failure is a genuine framework failure", () => {
  const report = {
    success: false,
    advisorReports: [
      { success: false, error: 'Unknown advisor: "x". Registered advisors: a' },
      { success: false, error: 'Advisor "y" requires input "sourceFiles" but it was not provided.' },
    ],
  };
  assert.equal(classifyRunManyExitCode(report), 1);
});

test("formatHumanCatalog renders every field for every entry", () => {
  const catalog = [
    {
      id: "test-advisor",
      name: "Test Advisor",
      category: "test",
      description: "A test description.",
      inputRequirements: ["sourceFiles"],
      supportedSeverities: ["info", "critical"],
    },
  ];
  const output = formatHumanCatalog(catalog);
  assert.match(output, /test-advisor/);
  assert.match(output, /Test Advisor/);
  assert.match(output, /A test description\./);
  assert.match(output, /sourceFiles/);
  assert.match(output, /info, critical/);
});

test("formatHumanCatalog handles an advisor with no input requirements gracefully", () => {
  const catalog = [
    {
      id: "x",
      name: "X",
      category: "x",
      description: "d",
      inputRequirements: [],
      supportedSeverities: ["info"],
    },
  ];
  const output = formatHumanCatalog(catalog);
  assert.match(output, /\(none\)/);
});

test("formatHumanReport shows success status, summary, and findings with location", () => {
  const report = {
    advisor: "security",
    success: true,
    error: null,
    execution_ms: 5,
    summary: { info: 1, suggestion: 0, warning: 0, critical: 1 },
    findings: [
      {
        id: "dangerous-eval-usage",
        severity: "critical",
        message: "found eval",
        location: { file: "x.js", line: 3 },
      },
    ],
  };
  const output = formatHumanReport(report);
  assert.match(output, /Status: SUCCESS/);
  assert.match(output, /CRITICAL/);
  assert.match(output, /dangerous-eval-usage/);
  assert.match(output, /x\.js:3/);
});

test("formatHumanReport shows the error message when the report failed", () => {
  const report = {
    advisor: "x",
    success: false,
    error: "Unknown advisor: \"x\".",
    execution_ms: 0,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 0 },
    findings: [],
  };
  const output = formatHumanReport(report);
  assert.match(output, /Status: FAILED/);
  assert.match(output, /Error: Unknown advisor/);
});

test("formatHumanUnifiedReport shows per-advisor breakdown and combined summary", () => {
  const report = {
    success: true,
    advisorsRun: ["architecture", "security"],
    advisorsFailed: [],
    execution_ms: 10,
    summary: { info: 1, suggestion: 0, warning: 0, critical: 1 },
    advisorReports: [
      { advisor: "architecture", success: true, execution_ms: 3, findings: [] },
      {
        advisor: "security",
        success: true,
        execution_ms: 5,
        findings: [{ id: "dangerous-eval-usage", severity: "critical", message: "found eval" }],
      },
    ],
  };
  const output = formatHumanUnifiedReport(report);
  assert.match(output, /Advisors run: architecture, security/);
  assert.match(output, /Overall status: SUCCESS/);
  assert.match(output, /architecture: SUCCESS/);
  assert.match(output, /security: SUCCESS/);
  assert.match(output, /dangerous-eval-usage/);
});

test("formatHumanUnifiedReport lists failed advisors separately", () => {
  const report = {
    success: false,
    advisorsRun: ["architecture"],
    advisorsFailed: ["not-real"],
    execution_ms: 5,
    summary: { info: 0, suggestion: 0, warning: 0, critical: 0 },
    advisorReports: [
      { advisor: "architecture", success: true, execution_ms: 2, findings: [] },
      { advisor: "not-real", success: false, error: "Unknown advisor: \"not-real\".", execution_ms: 0, findings: [] },
    ],
  };
  const output = formatHumanUnifiedReport(report);
  assert.match(output, /Advisors failed: not-real/);
  assert.match(output, /not-real: FAILED \(Unknown advisor/);
});
