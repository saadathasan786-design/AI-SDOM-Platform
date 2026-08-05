import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, "..", "agent-cli.js");

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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-cli-spawn-"));
  const filePath = path.join(tmpDir, "context.json");
  await fs.writeFile(filePath, JSON.stringify(context));
  return filePath;
}

test("spawned process: agent list exits 0 and prints the real registered agent to stdout", async () => {
  const { exitCode, stdout } = await runCli(["list"]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /architecture-remediation/);
});

test("spawned process: agent list --json exits 0 and prints valid, parseable JSON to stdout", async () => {
  const { exitCode, stdout } = await runCli(["list", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(stdout);
  assert.ok(parsed.some((a) => a.id === "architecture-remediation"));
});

test("spawned process: agent check exits 0 for the real, compatible agent", async () => {
  const { exitCode, stdout } = await runCli(["check", "architecture-remediation"]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /Compatible: true/);
});

test("spawned process: agent check exits 3 for an unknown agent", async () => {
  const { exitCode, stderr } = await runCli(["check", "not-a-real-agent"]);
  assert.equal(exitCode, 3);
  assert.match(stderr, /Unknown agent/);
});

test("spawned process: agent run against clean code exits 0 and stops cleanly", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] });
  const { exitCode, stdout } = await runCli(["run", "architecture-remediation", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /decision: stop/);
});

test("spawned process: agent run against a real violation exits 0 and runs the real dry-run generator step", async () => {
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { exitCode, stdout } = await runCli(["run", "architecture-remediation", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /layer-violation/);
  assert.match(stdout, /mode: dry-run/);
});

test("spawned process: agent run --json exits 0 with a valid, parseable report envelope", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] });
  const { exitCode, stdout } = await runCli(["run", "architecture-remediation", "--context", contextPath, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.report.agent, "architecture-remediation");
});

test("spawned process: agent run against an unknown agent exits 3 with the error on stderr", async () => {
  const { exitCode, stderr } = await runCli(["run", "not-a-real-agent"]);
  assert.equal(exitCode, 3);
  assert.match(stderr, /Unknown agent/);
});

test("spawned process: agent run with a missing context file exits 2", async () => {
  const { exitCode, stderr } = await runCli(["run", "architecture-remediation", "--context", "/nonexistent/path.json"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /Context file not found/);
});

test("spawned process: agent run with invalid JSON in the context file exits 2", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-cli-spawn-"));
  const badPath = path.join(tmpDir, "bad.json");
  await fs.writeFile(badPath, "not valid json {{{");

  const { exitCode, stderr } = await runCli(["run", "architecture-remediation", "--context", badPath]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /not valid JSON/);
});

test("spawned process: agent run with no id exits 2", async () => {
  const { exitCode, stderr } = await runCli(["run"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /requires an agent id/);
});

test("spawned process: agent check with no id exits 2", async () => {
  const { exitCode, stderr } = await runCli(["check"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /requires an agent id/);
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
