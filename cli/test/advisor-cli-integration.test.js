import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { main } from "../advisor-cli.js";

async function writeContextFile(context) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-integration-"));
  const filePath = path.join(tmpDir, "context.json");
  await fs.writeFile(filePath, JSON.stringify(context));
  return filePath;
}

test("integration: list human mode exits 0 and lists all five real advisors", async () => {
  const { exitCode, output } = await main(["list"]);
  assert.equal(exitCode, 0);
  for (const id of ["architecture", "code-review", "security", "performance", "accessibility"]) {
    assert.match(output, new RegExp(id));
  }
});

test("integration: list --json exits 0 and returns the exact real catalog", async () => {
  const { exitCode, output } = await main(["list", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.length, 8);
  assert.ok(parsed.every((a) => typeof a.id === "string"));
});

test("integration: version exits 0 in both human and json mode", async () => {
  const human = await main(["version"]);
  assert.equal(human.exitCode, 0);
  assert.match(human.output, /Advisor CLI version/);

  const json = await main(["version", "--json"]);
  assert.equal(json.exitCode, 0);
  const parsed = JSON.parse(json.output);
  assert.equal(parsed.cliVersion, "1.0.0");
  assert.deepEqual(parsed.supportedCommands, ["list", "run", "run-many", "version", "help"]);
});

test("integration: help exits 0 and shows usage", async () => {
  const { exitCode, output } = await main(["help"]);
  assert.equal(exitCode, 0);
  assert.match(output, /Usage: advisor/);
});

test("integration: no command at all exits 2", async () => {
  const { exitCode } = await main([]);
  assert.equal(exitCode, 2);
});

test("integration: run against a real advisor with real findings, human mode", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
  const { exitCode, output } = await main(["run", "security", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(output, /Status: SUCCESS/);
  assert.match(output, /dangerous-eval-usage/);
});

test("integration: run against a real advisor, json mode returns the raw report inside a minimal envelope", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
  const { exitCode, output } = await main(["run", "security", "--context", contextPath, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.command, "run");
  assert.equal(parsed.exitCode, 0);
  assert.equal(parsed.report.advisor, "security");
  assert.equal(parsed.report.success, true);
  assert.ok(parsed.report.findings.some((f) => f.id === "dangerous-eval-usage"));
});

test("integration: run with no context defaults to an empty context, surfacing the framework's own missing-input error", async () => {
  const { exitCode, output } = await main(["run", "security"]);
  assert.equal(exitCode, 1);
  assert.match(output, /requires input "sourceFiles"/);
});

test("integration: run against an unknown advisor exits 3", async () => {
  const { exitCode, output } = await main(["run", "not-a-real-advisor"]);
  assert.equal(exitCode, 3);
  assert.match(output, /Unknown advisor/);
});

test("integration: run with a missing context file exits 2", async () => {
  const { exitCode, output } = await main(["run", "security", "--context", "/nonexistent/path.json"]);
  assert.equal(exitCode, 2);
  assert.match(output, /Context file not found/);
});

test("integration: run with invalid JSON in the context file exits 2", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-integration-"));
  const badPath = path.join(tmpDir, "bad.json");
  await fs.writeFile(badPath, "not valid json {{{");

  const { exitCode, output } = await main(["run", "security", "--context", badPath]);
  assert.equal(exitCode, 2);
  assert.match(output, /not valid JSON/);
});

test("integration: run with no id exits 2", async () => {
  const { exitCode, output } = await main(["run"]);
  assert.equal(exitCode, 2);
  assert.match(output, /requires an advisor id/);
});

test("integration: run-many against multiple real advisors, human mode", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
  const { exitCode, output } = await main(["run-many", "architecture", "security", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(output, /Advisors run: architecture, security/);
  assert.match(output, /dangerous-eval-usage/);
});

test("integration: run-many json mode returns the raw Unified Advisor Report inside a minimal envelope", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
  const { exitCode, output } = await main(["run-many", "architecture", "security", "--context", contextPath, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.command, "run-many");
  assert.equal(parsed.report.advisorCount, 2);
  assert.deepEqual(parsed.report.advisorsRun.sort(), ["architecture", "security"]);
});

test("integration: run-many with an unknown advisor mixed with real ones exits 3", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [] });
  const { exitCode, output } = await main(["run-many", "architecture", "not-real", "--context", contextPath]);
  assert.equal(exitCode, 3);
  assert.match(output, /Advisors failed: not-real/);
});

test("integration: run-many with no ids exits 2", async () => {
  const { exitCode, output } = await main(["run-many"]);
  assert.equal(exitCode, 2);
  assert.match(output, /requires at least one advisor id/);
});

test("integration: unknown command exits 2", async () => {
  const { exitCode, output } = await main(["totally-bogus-command"]);
  assert.equal(exitCode, 2);
  assert.match(output, /unknown command/);
});
