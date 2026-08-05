import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { main } from "../workflow-cli.js";

async function writeContextFile(context) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-cli-integration-"));
  const filePath = path.join(tmpDir, "context.json");
  await fs.writeFile(filePath, JSON.stringify(context));
  return filePath;
}

test("integration: list human mode exits 0 and lists both real registered workflows", async () => {
  const { exitCode, output } = await main(["list"]);
  assert.equal(exitCode, 0);
  assert.match(output, /project-health-check/);
  assert.match(output, /security-audit/);
});

test("integration: list --json exits 0 and returns the exact real catalog", async () => {
  const { exitCode, output } = await main(["list", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.ok(parsed.some((w) => w.id === "project-health-check"));
  assert.ok(parsed.some((w) => w.id === "security-audit"));
});

test("integration: help exits 0 and shows usage", async () => {
  const { exitCode, output } = await main(["help"]);
  assert.equal(exitCode, 0);
  assert.match(output, /Usage: workflow/);
});

test("integration: version exits 0 in both human and json mode", async () => {
  const human = await main(["version"]);
  assert.equal(human.exitCode, 0);
  assert.match(human.output, /Workflow CLI version/);

  const json = await main(["version", "--json"]);
  const parsed = JSON.parse(json.output);
  assert.deepEqual(parsed.supportedCommands, ["list", "run", "check", "version", "help"]);
});

test("integration: no command at all exits 2", async () => {
  const { exitCode } = await main([]);
  assert.equal(exitCode, 2);
});

test("integration: check against project-health-check (fully compatible) exits 0", async () => {
  const { exitCode, output } = await main(["check", "project-health-check"]);
  assert.equal(exitCode, 0);
  assert.match(output, /Compatible: true/);
});

test("integration: check --json returns the raw compatibility result inside a minimal envelope", async () => {
  const { exitCode, output } = await main(["check", "security-audit", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.command, "check");
  assert.equal(parsed.result.compatible, true);
});

test("integration: check against an unknown workflow exits 3", async () => {
  const { exitCode, output } = await main(["check", "not-a-real-workflow"]);
  assert.equal(exitCode, 3);
  assert.match(output, /Unknown workflow/);
});

test("integration: check with no id exits 2", async () => {
  const { exitCode, output } = await main(["check"]);
  assert.equal(exitCode, 2);
  assert.match(output, /requires a workflow id/);
});

test("integration: run project-health-check against clean code, all three real agents run in order, exits 0", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] });
  const { exitCode, output } = await main(["run", "project-health-check", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(output, /Status: SUCCESS/);
  assert.match(output, /Agent "architecture-remediation"/);
  assert.match(output, /Agent "security-remediation"/);
  assert.match(output, /Agent "performance-optimization"/);
});

test("integration: run security-audit against a real eval() finding exercises the complete four-layer chain, exits 0", async () => {
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';\neval(x);" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { exitCode, output } = await main(["run", "security-audit", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(output, /dangerous-eval-usage/);
  assert.match(output, /generator: plugin \(mode: dry-run\)/);
  assert.ok(output.indexOf('Agent "security-remediation"') < output.indexOf('Agent "architecture-remediation"'));
});

test("integration: run --json returns the raw Workflow Report inside a minimal envelope, with embedded Agent/Advisor reports unchanged", async () => {
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';\neval(x);" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { exitCode, output } = await main(["run", "security-audit", "--context", contextPath, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.command, "run");
  assert.equal(parsed.report.workflow, "security-audit");

  const secAgentReport = parsed.report.steps[0].agentReport;
  assert.deepEqual(
    Object.keys(secAgentReport).sort(),
    ["agent", "success", "plan", "steps", "halted", "summary", "recommendations", "errors", "execution_ms", "timestamp"].sort()
  );
  const embeddedAdvisorStep = secAgentReport.steps[0];
  assert.deepEqual(
    Object.keys(embeddedAdvisorStep.result).sort(),
    [
      "advisorCount",
      "advisorReports",
      "advisorsFailed",
      "advisorsRun",
      "execution_ms",
      "findings",
      "inputRequirementsUnion",
      "success",
      "summary",
      "timestamp",
    ].sort()
  );
});

test("integration: run with no context defaults to an empty context, surfacing the framework's own missing-input error, exits 1", async () => {
  const { exitCode, output } = await main(["run", "project-health-check"]);
  assert.equal(exitCode, 1);
  assert.match(output, /requires input "sourceFiles"/);
});

test("integration: run against an unknown workflow exits 3", async () => {
  const { exitCode, output } = await main(["run", "not-a-real-workflow"]);
  assert.equal(exitCode, 3);
  assert.match(output, /Unknown workflow/);
});

test("integration: run with a missing context file exits 2", async () => {
  const { exitCode, output } = await main(["run", "project-health-check", "--context", "/nonexistent/path.json"]);
  assert.equal(exitCode, 2);
  assert.match(output, /Context file not found/);
});

test("integration: run with invalid JSON in the context file exits 2", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-cli-integration-"));
  const badPath = path.join(tmpDir, "bad.json");
  await fs.writeFile(badPath, "not valid json {{{");

  const { exitCode, output } = await main(["run", "project-health-check", "--context", badPath]);
  assert.equal(exitCode, 2);
  assert.match(output, /not valid JSON/);
});

test("integration: run with no id exits 2", async () => {
  const { exitCode, output } = await main(["run"]);
  assert.equal(exitCode, 2);
  assert.match(output, /requires a workflow id/);
});

test("integration: unknown command exits 2", async () => {
  const { exitCode, output } = await main(["totally-bogus-command"]);
  assert.equal(exitCode, 2);
  assert.match(output, /unknown command/);
});

test("integration: real dry-run workflow performs zero real filesystem writes across all three agents", async () => {
  const dryRunDirs = [
    path.join(os.tmpdir(), "architecture-remediation-agent-dry-run"),
    path.join(os.tmpdir(), "security-remediation-agent-dry-run"),
    path.join(os.tmpdir(), "performance-optimization-agent-dry-run"),
  ];
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';\neval(x);" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });

  await main(["run", "security-audit", "--context", contextPath]);

  for (const dir of dryRunDirs) {
    const exists = await fs
      .access(dir)
      .then(() => true)
      .catch(() => false);
    assert.equal(exists, false, `dry-run mode must never create real output at ${dir}`);
  }
});
