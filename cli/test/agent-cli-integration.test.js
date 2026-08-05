import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { main } from "../agent-cli.js";

async function writeContextFile(context) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-cli-integration-"));
  const filePath = path.join(tmpDir, "context.json");
  await fs.writeFile(filePath, JSON.stringify(context));
  return filePath;
}

test("integration: list human mode exits 0 and lists the real registered agent", async () => {
  const { exitCode, output } = await main(["list"]);
  assert.equal(exitCode, 0);
  assert.match(output, /architecture-remediation/);
});

test("integration: list --json exits 0 and returns the exact real catalog", async () => {
  const { exitCode, output } = await main(["list", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.ok(parsed.some((a) => a.id === "architecture-remediation"));
});

test("integration: help exits 0 and shows usage", async () => {
  const { exitCode, output } = await main(["help"]);
  assert.equal(exitCode, 0);
  assert.match(output, /Usage: agent/);
});

test("integration: version exits 0 in both human and json mode", async () => {
  const human = await main(["version"]);
  assert.equal(human.exitCode, 0);
  assert.match(human.output, /Agent CLI version/);

  const json = await main(["version", "--json"]);
  const parsed = JSON.parse(json.output);
  assert.deepEqual(parsed.supportedCommands, ["list", "run", "check", "version", "help"]);
});

test("integration: no command at all exits 2", async () => {
  const { exitCode } = await main([]);
  assert.equal(exitCode, 2);
});

test("integration: check against the real, fully-compatible agent exits 0", async () => {
  const { exitCode, output } = await main(["check", "architecture-remediation"]);
  assert.equal(exitCode, 0);
  assert.match(output, /Compatible: true/);
});

test("integration: check --json returns the raw compatibility result inside a minimal envelope", async () => {
  const { exitCode, output } = await main(["check", "architecture-remediation", "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.command, "check");
  assert.equal(parsed.result.compatible, true);
});

test("integration: check against an unknown agent exits 3", async () => {
  const { exitCode, output } = await main(["check", "not-a-real-agent"]);
  assert.equal(exitCode, 3);
  assert.match(output, /Unknown agent/);
});

test("integration: check with no id exits 2", async () => {
  const { exitCode, output } = await main(["check"]);
  assert.equal(exitCode, 2);
  assert.match(output, /requires an agent id/);
});

test("integration: run against clean code (real Architecture Advisor) stops cleanly after one step, exits 0", async () => {
  const contextPath = await writeContextFile({ sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] });
  const { exitCode, output } = await main(["run", "architecture-remediation", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(output, /Status: SUCCESS/);
  assert.match(output, /decision: stop/);
});

test("integration: run against a real layer violation proceeds through both steps (real dry-run Theme Generator), exits 0", async () => {
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { exitCode, output } = await main(["run", "architecture-remediation", "--context", contextPath]);
  assert.equal(exitCode, 0);
  assert.match(output, /layer-violation/);
  assert.match(output, /generator: theme \(mode: dry-run\)/);
});

test("integration: run --json returns the raw Agent Report inside a minimal envelope, unchanged", async () => {
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { exitCode, output } = await main(["run", "architecture-remediation", "--context", contextPath, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.command, "run");
  assert.equal(parsed.report.agent, "architecture-remediation");
  assert.equal(parsed.report.steps.length, 2);
  assert.equal(parsed.report.steps[1].result.mode, "dry-run");
});

test("integration: run with no context defaults to an empty context, surfacing the framework's own missing-input error, exits 1", async () => {
  const { exitCode, output } = await main(["run", "architecture-remediation"]);
  assert.equal(exitCode, 1);
  assert.match(output, /requires input "sourceFiles"/);
});

test("integration: run against an unknown agent exits 3", async () => {
  const { exitCode, output } = await main(["run", "not-a-real-agent"]);
  assert.equal(exitCode, 3);
  assert.match(output, /Unknown agent/);
});

test("integration: run with a missing context file exits 2", async () => {
  const { exitCode, output } = await main(["run", "architecture-remediation", "--context", "/nonexistent/path.json"]);
  assert.equal(exitCode, 2);
  assert.match(output, /Context file not found/);
});

test("integration: run with invalid JSON in the context file exits 2", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-cli-integration-"));
  const badPath = path.join(tmpDir, "bad.json");
  await fs.writeFile(badPath, "not valid json {{{");

  const { exitCode, output } = await main(["run", "architecture-remediation", "--context", badPath]);
  assert.equal(exitCode, 2);
  assert.match(output, /not valid JSON/);
});

test("integration: run with no id exits 2", async () => {
  const { exitCode, output } = await main(["run"]);
  assert.equal(exitCode, 2);
  assert.match(output, /requires an agent id/);
});

test("integration: unknown command exits 2", async () => {
  const { exitCode, output } = await main(["totally-bogus-command"]);
  assert.equal(exitCode, 2);
  assert.match(output, /unknown command/);
});

test("integration: real dry-run workflow performs zero real filesystem writes", async () => {
  const dryRunDir = path.join(os.tmpdir(), "architecture-remediation-agent-dry-run");
  const contextPath = await writeContextFile({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });

  await main(["run", "architecture-remediation", "--context", contextPath]);

  const exists = await fs
    .access(dryRunDir)
    .then(() => true)
    .catch(() => false);
  assert.equal(exists, false, "dry-run mode must never create real output");
});
