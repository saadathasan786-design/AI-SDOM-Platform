import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, "..", "advisor-cli.js");

/** Spawns the real CLI as a subprocess and captures exit code, stdout, stderr. */
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-spawn-"));
  const filePath = path.join(tmpDir, "context.json");
  await fs.writeFile(filePath, JSON.stringify(context));
  return filePath;
}

test("spawned process: advisor list exits 0 and prints all five real advisors to stdout", async () => {
  const { exitCode, stdout } = await runCli(["list"]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /architecture/);
  assert.match(stdout, /security/);
});

test("spawned process: advisor list --json exits 0 and prints valid, parseable JSON to stdout", async () => {
  const { exitCode, stdout } = await runCli(["list", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.length, 8);
});

test("spawned process: advisor version exits 0", async () => {
  const { exitCode, stdout } = await runCli(["version"]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /Advisor CLI version/);
});

test("spawned process: advisor help exits 0", async () => {
  const { exitCode, stdout } = await runCli(["help"]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /Usage: advisor/);
});

test("spawned process: advisor run against a real advisor exits 0 with real findings", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
  const { exitCode, stdout } = await runCli(["run", "security", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /dangerous-eval-usage/);
});

test("spawned process: advisor run --json exits 0 with a valid, parseable report envelope", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
  const { exitCode, stdout } = await runCli(["run", "security", "--context", contextPath, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.report.advisor, "security");
});

test("spawned process: advisor run-many against multiple real advisors exits 0", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "x.js", content: "export const a = 1;" }] });
  const { exitCode, stdout } = await runCli(["run-many", "architecture", "code-review", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(stdout, /Advisors run: architecture, code-review/);
});

test("spawned process: advisor run against an unknown advisor exits 3 with the error on stderr", async () => {
  const { exitCode, stderr } = await runCli(["run", "not-a-real-advisor"]);
  assert.equal(exitCode, 3);
  assert.match(stderr, /Unknown advisor/);
});

test("spawned process: advisor run with a missing context file exits 2 with the error on stderr", async () => {
  const { exitCode, stderr } = await runCli(["run", "security", "--context", "/nonexistent/path.json"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /Context file not found/);
});

test("spawned process: advisor run with invalid JSON in the context file exits 2", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-spawn-"));
  const badPath = path.join(tmpDir, "bad.json");
  await fs.writeFile(badPath, "not valid json {{{");

  const { exitCode, stderr } = await runCli(["run", "security", "--context", badPath]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /not valid JSON/);
});

test("spawned process: advisor run with no id exits 2", async () => {
  const { exitCode, stderr } = await runCli(["run"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /requires an advisor id/);
});

test("spawned process: advisor run-many with no ids exits 2", async () => {
  const { exitCode, stderr } = await runCli(["run-many"]);
  assert.equal(exitCode, 2);
  assert.match(stderr, /requires at least one advisor id/);
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
