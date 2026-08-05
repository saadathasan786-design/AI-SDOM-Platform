import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { main as advisorMain, parseArgs as advisorParseArgs } from "../advisor-cli.js";
import { main as agentMain, parseArgs as agentParseArgs } from "../agent-cli.js";
import { main as workflowMain, parseArgs as workflowParseArgs } from "../workflow-cli.js";

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "cli-project-root-test-"));
}

async function writeFile(root, relPath, content) {
  const fullPath = path.join(root, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

async function makeVulnerablePluginDir() {
  const root = await makeTempDir();
  await writeFile(
    root,
    "my-plugin.php",
    "<?php\n/**\n * Plugin Name: Test Plugin\n * Version: 1.0.0\n */\nfunction h() { $x = $_POST['x']; }"
  );
  return root;
}

async function makeGenericJsDir() {
  const root = await makeTempDir();
  await writeFile(root, "package.json", '{"name":"generic-test"}');
  await writeFile(root, "index.js", "export const a = 1;");
  return root;
}

async function makeUnknownDir() {
  const root = await makeTempDir();
  await writeFile(root, "notes.txt", "just some notes");
  return root;
}

// ---------------------------------------------------------------------
// parseArgs: --project-root flag parsing
// ---------------------------------------------------------------------

test("advisor-cli parseArgs recognizes --project-root", () => {
  const { flags } = advisorParseArgs(["run", "security", "--project-root", "/some/path"]);
  assert.equal(flags.projectRoot, "/some/path");
  assert.equal(flags.context, null);
});

test("agent-cli parseArgs recognizes --project-root", () => {
  const { flags } = agentParseArgs(["run", "architecture-remediation", "--project-root", "/some/path"]);
  assert.equal(flags.projectRoot, "/some/path");
});

test("workflow-cli parseArgs recognizes --project-root", () => {
  const { flags } = workflowParseArgs(["run", "project-health-check", "--project-root", "/some/path"]);
  assert.equal(flags.projectRoot, "/some/path");
});

// ---------------------------------------------------------------------
// Successful discovery execution -- Advisor
// ---------------------------------------------------------------------

test("advisor-cli: --project-root against a vulnerable WordPress plugin produces real findings via real discovery", async () => {
  const root = await makeVulnerablePluginDir();
  const { exitCode, output } = await advisorMain(["run", "wordpress-security", "--project-root", root, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.report.success, true);
  assert.ok(parsed.report.findings.some((f) => f.id === "missing-nonce-verification"));
});

test("advisor-cli: --project-root works with run-many", async () => {
  const root = await makeVulnerablePluginDir();
  const { exitCode, output } = await advisorMain([
    "run-many",
    "wordpress-security",
    "wordpress-performance",
    "--project-root",
    root,
    "--json",
  ]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.deepEqual(parsed.report.advisorsRun.sort(), ["wordpress-security", "wordpress-performance"].sort());
});

// ---------------------------------------------------------------------
// Successful discovery execution -- Agent
// ---------------------------------------------------------------------

test("agent-cli: --project-root against a vulnerable WordPress plugin runs the real Agent -> Advisor -> Generator chain", async () => {
  const root = await makeVulnerablePluginDir();
  const { exitCode, output } = await agentMain(["run", "plugin-security-remediation", "--project-root", root, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.report.success, true);
  assert.equal(parsed.report.steps[0].result.findings.some((f) => f.id === "missing-nonce-verification"), true);
});

// ---------------------------------------------------------------------
// Successful discovery execution -- Workflow
// ---------------------------------------------------------------------

test("workflow-cli: --project-root against a vulnerable WordPress plugin runs the real four-layer chain (Workflow -> Agent -> Advisor -> Generator)", async () => {
  const root = await makeVulnerablePluginDir();
  const { exitCode, output } = await workflowMain(["run", "plugin-health-audit", "--project-root", root, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.report.success, true);
  assert.deepEqual(parsed.report.steps.map((s) => s.agentId), [
    "plugin-security-remediation",
    "plugin-performance-optimization",
    "architecture-remediation",
  ]);
});

// ---------------------------------------------------------------------
// Generic / unknown projects
// ---------------------------------------------------------------------

test("advisor-cli: --project-root works against a generic (non-WordPress) JS project", async () => {
  const root = await makeGenericJsDir();
  const { exitCode, output } = await advisorMain(["run", "architecture", "--project-root", root, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.report.success, true);
});

test("advisor-cli: --project-root works against an unknown/unrecognized project without error", async () => {
  const root = await makeUnknownDir();
  const { exitCode, output } = await advisorMain(["run", "architecture", "--project-root", root, "--json"]);
  assert.equal(exitCode, 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.report.success, true);
});

// ---------------------------------------------------------------------
// Invalid / missing path
// ---------------------------------------------------------------------

test("advisor-cli: --project-root pointing at a non-existent directory produces a clear error, exit code 2, never crashes", async () => {
  const { exitCode, output } = await advisorMain(["run", "security", "--project-root", "/definitely/does/not/exist/12345"]);
  assert.equal(exitCode, 2);
  assert.match(output, /does not exist or is not accessible/);
});

test("agent-cli: --project-root pointing at a file, not a directory, produces a clear error", async () => {
  const root = await makeGenericJsDir();
  const filePath = path.join(root, "package.json");
  const { exitCode, output } = await agentMain(["run", "architecture-remediation", "--project-root", filePath]);
  assert.equal(exitCode, 2);
  assert.match(output, /is not a directory/);
});

test("workflow-cli: --project-root pointing at a non-existent directory produces a clear error", async () => {
  const { exitCode, output } = await workflowMain(["run", "project-health-check", "--project-root", "/nope/nope/nope"]);
  assert.equal(exitCode, 2);
  assert.match(output, /does not exist or is not accessible/);
});

// ---------------------------------------------------------------------
// Mutually exclusive options
// ---------------------------------------------------------------------

async function writeContextFile(context) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-context-"));
  const filePath = path.join(tmpDir, "context.json");
  await fs.writeFile(filePath, JSON.stringify(context));
  return filePath;
}

test("advisor-cli: supplying both --context and --project-root produces a clear mutual-exclusivity error, exit code 2, never crashes", async () => {
  const contextFile = await writeContextFile({ sourceFiles: [] });
  const projectRoot = await makeGenericJsDir();
  const { exitCode, output } = await advisorMain(["run", "security", "--context", contextFile, "--project-root", projectRoot]);
  assert.equal(exitCode, 2);
  assert.match(output, /mutually exclusive/);
});

test("agent-cli: supplying both --context and --project-root produces a clear mutual-exclusivity error", async () => {
  const contextFile = await writeContextFile({ sourceFiles: [] });
  const projectRoot = await makeGenericJsDir();
  const { exitCode, output } = await agentMain([
    "run",
    "architecture-remediation",
    "--context",
    contextFile,
    "--project-root",
    projectRoot,
  ]);
  assert.equal(exitCode, 2);
  assert.match(output, /mutually exclusive/);
});

test("workflow-cli: supplying both --context and --project-root produces a clear mutual-exclusivity error", async () => {
  const contextFile = await writeContextFile({ sourceFiles: [] });
  const projectRoot = await makeGenericJsDir();
  const { exitCode, output } = await workflowMain([
    "run",
    "project-health-check",
    "--context",
    contextFile,
    "--project-root",
    projectRoot,
  ]);
  assert.equal(exitCode, 2);
  assert.match(output, /mutually exclusive/);
});

// ---------------------------------------------------------------------
// Backward compatibility with --context
// ---------------------------------------------------------------------

test("backward compatibility: --context alone (no --project-root) behaves exactly as before across all three CLIs", async () => {
  const contextFile = await writeContextFile({ sourceFiles: [{ path: "a.js", content: "eval(x);" }] });

  const advisorResult = await advisorMain(["run", "security", "--context", contextFile, "--json"]);
  assert.equal(advisorResult.exitCode, 0);
  assert.equal(JSON.parse(advisorResult.output).report.success, true);

  const agentResult = await agentMain(["run", "architecture-remediation", "--context", contextFile, "--json"]);
  assert.equal(agentResult.exitCode, 0);

  const workflowResult = await workflowMain(["run", "project-health-check", "--context", contextFile, "--json"]);
  assert.equal(workflowResult.exitCode, 0);
});

test("backward compatibility: omitting both --context and --project-root still defaults to an empty context, exactly as before (the security advisor's own inputRequirements then correctly reports a missing-input failure, unrelated to this stage's changes)", async () => {
  const { exitCode, output } = await advisorMain(["run", "security", "--json"]);
  assert.equal(exitCode, 1);
  const parsed = JSON.parse(output);
  assert.equal(parsed.report.success, false);
  assert.match(parsed.report.error, /requires input "sourceFiles"/);
});

// ---------------------------------------------------------------------
// discoverProject failure propagation
// ---------------------------------------------------------------------

test("discoverProject's structured failure (invalid, non-empty root) is propagated verbatim into the CLI's error output", async () => {
  const { output } = await advisorMain(["run", "security", "--project-root", "/tmp/definitely-not-a-real-path-xyz-999"]);
  assert.match(output, /does not exist or is not accessible/);
});

// ---------------------------------------------------------------------
// Exact context shape passed into execution
// ---------------------------------------------------------------------

test("exact context shape: the context passed to runAdvisorWithReport via --project-root has the exact discoverProject() shape, unchanged", async () => {
  const root = await makeVulnerablePluginDir();
  const { output } = await advisorMain(["run", "wordpress-security", "--project-root", root, "--json"]);
  const parsed = JSON.parse(output);
  assert.ok(parsed.report.findings.some((f) => f.location?.file === "my-plugin.php"));
});

// ---------------------------------------------------------------------
// Never-throws behavior
// ---------------------------------------------------------------------

test("never throws: a malformed --project-root value (pointing nowhere) never crashes main(), across all three CLIs", async () => {
  const advisorResult = await advisorMain(["run", "security", "--project-root", "/x/y/z/not/real"]);
  assert.equal(advisorResult.exitCode, 2);

  const agentResult = await agentMain(["run", "architecture-remediation", "--project-root", "/x/y/z/not/real"]);
  assert.equal(agentResult.exitCode, 2);

  const workflowResult = await workflowMain(["run", "project-health-check", "--project-root", "/x/y/z/not/real"]);
  assert.equal(workflowResult.exitCode, 2);
});

// ---------------------------------------------------------------------
// CLI help output
// ---------------------------------------------------------------------

test("help output documents --project-root for all three CLIs", async () => {
  const advisorHelp = await advisorMain(["help"]);
  assert.match(advisorHelp.output, /--project-root/);

  const agentHelp = await agentMain(["help"]);
  assert.match(agentHelp.output, /--project-root/);

  const workflowHelp = await workflowMain(["help"]);
  assert.match(workflowHelp.output, /--project-root/);
});
