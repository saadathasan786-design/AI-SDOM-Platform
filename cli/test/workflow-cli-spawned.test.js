import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, "..", "workflow-cli.js");

function runCli(args) {
  return new Promise((resolve) => {
    const proc = spawn("node", [CLI_PATH, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

async function writeContextFile(context) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-cli-spawn-"));
  const filePath = path.join(tmpDir, "context.json");
  await fs.writeFile(filePath, JSON.stringify(context));
  return filePath;
}

test("spawned process: workflow list exits 0 and prints both real registered workflows to stdout", async () => {
  const { exitCode, stdout } = await runCli(["list"]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /project-health-check/);
  assert.match(stdout, /security-audit/);
});

test("spawned process: workflow list --json exits 0 and prints valid, parseable JSON to stdout", async () => {
  const { exitCode, stdout } = await runCli(["list", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(stdout);
  assert.ok(parsed.some((w) => w.id === "project-health-check"));
});

test("spawned process: workflow check exits 0 for a real, compatible workflow", async () => {
  const { exitCode, stdout } = await runCli(["check", "project-health-check"]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /Compatible: true/);
});

test("spawned process: workflow check exits 3 for an unknown workflow", async () => {
  const { exitCode, stderr } = await runCli(["check", "not-a-real-workflow"]);
  assert.equal(exitCode, 3);
  assert.match(stderr, /Unknown workflow/);
});

test("spawned process: workflow run against clean code exits 0 and runs all three agents in order", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] });
  const { exitCode, stdout } = await runCli(["run", "project-health-check", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /Agent "architecture-remediation"/);
  assert.match(stdout, /Agent "security-remediation"/);
  assert.match(stdout, /Agent "performance-optimization"/);
});

test("spawned process: workflow run exercises the complete real four-layer chain (Workflow -> Agent -> Advisor -> Generator, dry-run)", async () => {
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';\neval(x);" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { exitCode, stdout } = await runCli(["run", "security-audit", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /dangerous-eval-usage/);
  assert.match(stdout, /layer-violation/);
  assert.match(stdout, /mode: dry-run/);
});

test("spawned process: workflow run --json exits 0 with a valid, parseable report envelope", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] });
  const { exitCode, stdout } = await runCli(["run", "project-health-check", "--context", contextPath, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.report.workflow, "project-health-check");
});

test("spawned process: workflow run against an unknown workflow exits 3 with the error on stderr", async () => {
  const { exitCode, stderr } = await runCli(["run", "not-a-real-workflow"]);
  assert.equal(exitCode, 3);
  assert.match(stderr, /Unknown workflow/);
});

test("spawned process: workflow run with a missing context file exits 2", async () => {
  const { exitCode, stderr } = await runCli(["run", "project-health-check", "--context", "/nonexistent/path.json"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /Context file not found/);
});

test("spawned process: workflow run with invalid JSON in the context file exits 2", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-cli-spawn-"));
  const badPath = path.join(tmpDir, "bad.json");
  await fs.writeFile(badPath, "not valid json {{{");

  const { exitCode, stderr } = await runCli(["run", "project-health-check", "--context", badPath]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /not valid JSON/);
});

test("spawned process: workflow run with no id exits 2", async () => {
  const { exitCode, stderr } = await runCli(["run"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /requires a workflow id/);
});

test("spawned process: workflow check with no id exits 2", async () => {
  const { exitCode, stderr } = await runCli(["check"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /requires a workflow id/);
});

test("spawned process: unknown command exits 2", async () => {
  const { exitCode, stderr } = await runCli(["totally-bogus-command"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /unknown command/);
});

test("spawned process: no arguments at all exits 2", async () => {
  const { exitCode } = await runCli([]);
  assert.equal(exitCode, 2);
});

test("spawned process: exit code 0 output goes to stdout, non-zero exit codes go to stderr", async () => {
  const successResult = await runCli(["list"]);
  assert.ok(successResult.stdout.length > 0);
  assert.equal(successResult.stderr.length, 0);

  const failureResult = await runCli(["run", "not-real"]);
  assert.ok(failureResult.stderr.length > 0);
  assert.equal(failureResult.stdout.length, 0);
});

test("spawned process: zero real filesystem writes occur across the entire chain", async () => {
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

  await runCli(["run", "security-audit", "--context", contextPath]);

  for (const dir of dryRunDirs) {
    const exists = await fs
      .access(dir)
      .then(() => true)
      .catch(() => false);
    assert.equal(exists, false, `dry-run mode must never create real output at ${dir}`);
  }
});
