import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { advisorTools, handleAdvisorRun, handleAdvisorRunMany } from "../advisor-tools.js";
import { agentTools, handleAgentRun } from "../agent-tools.js";
import { workflowTools, handleWorkflowRun } from "../workflow-tools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "index.js");

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "mcp-project-root-test-"));
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
// MCP tool metadata / schema updates
// ---------------------------------------------------------------------

test("advisor_run and advisor_runMany tool schemas declare projectRoot alongside context", () => {
  const runTool = advisorTools.find((t) => t.name === "advisor_run");
  assert.ok(runTool.inputSchema.properties.projectRoot);
  assert.equal(runTool.inputSchema.properties.projectRoot.type, "string");

  const runManyTool = advisorTools.find((t) => t.name === "advisor_runMany");
  assert.ok(runManyTool.inputSchema.properties.projectRoot);
});

test("agent_run tool schema declares projectRoot alongside context", () => {
  const runTool = agentTools.find((t) => t.name === "agent_run");
  assert.ok(runTool.inputSchema.properties.projectRoot);
});

test("workflow_run tool schema declares projectRoot alongside context", () => {
  const runTool = workflowTools.find((t) => t.name === "workflow_run");
  assert.ok(runTool.inputSchema.properties.projectRoot);
});

test("required fields are unchanged by this stage -- only 'id'/'ids', never projectRoot or context", () => {
  const advisorRun = advisorTools.find((t) => t.name === "advisor_run");
  assert.deepEqual(advisorRun.inputSchema.required, ["id"]);

  const agentRun = agentTools.find((t) => t.name === "agent_run");
  assert.deepEqual(agentRun.inputSchema.required, ["id"]);

  const workflowRun = workflowTools.find((t) => t.name === "workflow_run");
  assert.deepEqual(workflowRun.inputSchema.required, ["id"]);
});

// ---------------------------------------------------------------------
// projectRoot success -- Advisor
// ---------------------------------------------------------------------

test("handleAdvisorRun: projectRoot against a WordPress plugin produces real findings via real discovery", async () => {
  const root = await makeVulnerablePluginDir();
  const result = await handleAdvisorRun({ id: "wordpress-security", projectRoot: root });
  assert.equal(result.success, true);
  assert.ok(result.findings.some((f) => f.id === "missing-nonce-verification"));
});

test("handleAdvisorRun: projectRoot against a generic JS project succeeds", async () => {
  const root = await makeGenericJsDir();
  const result = await handleAdvisorRun({ id: "architecture", projectRoot: root });
  assert.equal(result.success, true);
});

test("handleAdvisorRun: projectRoot against an unknown project succeeds without error", async () => {
  const root = await makeUnknownDir();
  const result = await handleAdvisorRun({ id: "architecture", projectRoot: root });
  assert.equal(result.success, true);
});

test("handleAdvisorRunMany: projectRoot works identically to handleAdvisorRun's resolution", async () => {
  const root = await makeVulnerablePluginDir();
  const result = await handleAdvisorRunMany({ ids: ["wordpress-security", "wordpress-performance"], projectRoot: root });
  assert.deepEqual(result.advisorsRun.sort(), ["wordpress-security", "wordpress-performance"].sort());
});

// ---------------------------------------------------------------------
// projectRoot success -- Agent / Workflow (full chain)
// ---------------------------------------------------------------------

test("handleAgentRun: projectRoot runs the real Agent -> Advisor -> Generator chain", async () => {
  const root = await makeVulnerablePluginDir();
  const result = await handleAgentRun({ id: "plugin-security-remediation", projectRoot: root });
  assert.equal(result.success, true);
  assert.equal(result.steps[0].result.findings.some((f) => f.id === "missing-nonce-verification"), true);
});

test("handleWorkflowRun: projectRoot runs the real four-layer chain (Workflow -> Agent -> Advisor -> Generator)", async () => {
  const root = await makeVulnerablePluginDir();
  const result = await handleWorkflowRun({ id: "plugin-health-audit", projectRoot: root });
  assert.equal(result.success, true);
  assert.deepEqual(result.steps.map((s) => s.agentId), [
    "plugin-security-remediation",
    "plugin-performance-optimization",
    "architecture-remediation",
  ]);
});

// ---------------------------------------------------------------------
// context success (backward compatibility)
// ---------------------------------------------------------------------

test("handleAdvisorRun: context alone (no projectRoot) behaves exactly as before", async () => {
  const result = await handleAdvisorRun({ id: "security", context: { sourceFiles: [{ path: "a.js", content: "eval(x);" }] } });
  assert.equal(result.success, true);
});

test("handleAgentRun: context alone (no projectRoot) behaves exactly as before", async () => {
  const result = await handleAgentRun({ id: "architecture-remediation", context: { sourceFiles: [] } });
  assert.equal(result.success, true);
});

test("handleWorkflowRun: context alone (no projectRoot) behaves exactly as before", async () => {
  const result = await handleWorkflowRun({ id: "project-health-check", context: { sourceFiles: [] } });
  assert.equal(result.success, true);
});

test("neither context nor projectRoot supplied: preserves current pre-existing behavior exactly (defaults to empty context)", async () => {
  const result = await handleAdvisorRun({ id: "security" });
  assert.equal(result.success, false);
  assert.match(result.error, /requires input "sourceFiles"/);
});

// ---------------------------------------------------------------------
// Mutual exclusivity / structured error responses
// ---------------------------------------------------------------------

test("handleAdvisorRun: supplying both context and projectRoot throws a structured, descriptive error", async () => {
  const root = await makeGenericJsDir();
  await assert.rejects(
    () => handleAdvisorRun({ id: "security", context: { sourceFiles: [] }, projectRoot: root }),
    /Supply either 'context' or 'projectRoot', not both\./
  );
});

test("handleAgentRun: supplying both context and projectRoot throws a structured, descriptive error", async () => {
  const root = await makeGenericJsDir();
  await assert.rejects(
    () => handleAgentRun({ id: "architecture-remediation", context: {}, projectRoot: root }),
    /Supply either 'context' or 'projectRoot', not both\./
  );
});

test("handleWorkflowRun: supplying both context and projectRoot throws a structured, descriptive error", async () => {
  const root = await makeGenericJsDir();
  await assert.rejects(
    () => handleWorkflowRun({ id: "project-health-check", context: {}, projectRoot: root }),
    /Supply either 'context' or 'projectRoot', not both\./
  );
});

// ---------------------------------------------------------------------
// Invalid paths
// ---------------------------------------------------------------------

test("handleAdvisorRun: a non-existent projectRoot throws discoverProject()'s exact error message, unchanged", async () => {
  await assert.rejects(
    () => handleAdvisorRun({ id: "security", projectRoot: "/definitely/does/not/exist/12345" }),
    /does not exist or is not accessible/
  );
});

test("handleAgentRun: a projectRoot pointing at a file, not a directory, throws discoverProject()'s exact error message", async () => {
  const root = await makeGenericJsDir();
  const filePath = path.join(root, "package.json");
  await assert.rejects(() => handleAgentRun({ id: "architecture-remediation", projectRoot: filePath }), /is not a directory/);
});

test("handleWorkflowRun: a non-existent projectRoot throws a structured error", async () => {
  await assert.rejects(
    () => handleWorkflowRun({ id: "project-health-check", projectRoot: "/nope/nope/nope" }),
    /does not exist or is not accessible/
  );
});

// ---------------------------------------------------------------------
// Exact context propagation
// ---------------------------------------------------------------------

test("exact context propagation: the discovered context's sourceFiles paths are exactly what reaches the Advisor's findings, unchanged by any adapter transformation", async () => {
  const root = await makeVulnerablePluginDir();
  const result = await handleAdvisorRun({ id: "wordpress-security", projectRoot: root });
  assert.ok(result.findings.some((f) => f.location?.file === "my-plugin.php"));
});

// ---------------------------------------------------------------------
// Never-throws contract (of the underlying framework functions -- the
// adapter's OWN new validation legitimately throws for shape/mutual
// -exclusivity errors, matching the pre-existing convention already
// established for "requires a non-empty string 'id'")
// ---------------------------------------------------------------------

test("never-throws: once past the adapter's own shape/mutual-exclusivity checks, the underlying framework call never throws -- even for a run against an empty/no-op discovered project", async () => {
  const root = await makeTempDir(); // genuinely empty directory
  const result = await handleAdvisorRun({ id: "security", projectRoot: root });
  assert.equal(typeof result.success, "boolean");
});

// ---------------------------------------------------------------------
// Full end-to-end execution through the real MCP adapter (spawned
// server process, real stdio JSON-RPC framing -- not just calling the
// handler functions in-process)
// ---------------------------------------------------------------------

async function withRealServer(toolCalls, run) {
  const proc = spawn("node", [SERVER_PATH], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const responses = new Map();
  let buffer = "";

  proc.stdout.on("data", (chunk) => {
    buffer += chunk.toString();

    let newlineIndex;

    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);

        if (parsed.id !== undefined) {
          responses.set(parsed.id, parsed);
        }
      } catch {
        // ignore non-JSON stdout noise
      }
    }
  });

  function send(msg) {
    proc.stdin.write(JSON.stringify(msg) + "\n");
  }

  function waitForResponses(ids, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;

      const check = () => {
        const missing = ids.filter((id) => !responses.has(id));

        if (missing.length === 0) {
          resolve();
          return;
        }

        if (Date.now() >= deadline) {
          reject(
            new Error(
              `Timed out waiting for MCP responses: ${missing.join(", ")}`
            )
          );
          return;
        }

        setTimeout(check, 25);
      };

      check();
    });
  }

  try {
    send({
      jsonrpc: "2.0",
      id: "init",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test",
          version: "1.0",
        },
      },
    });

    await waitForResponses(["init"]);

    send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    for (const call of toolCalls) {
      send({
        jsonrpc: "2.0",
        id: call.id,
        method: "tools/call",
        params: {
          name: call.name,
          arguments: call.arguments,
        },
      });
    }

    await waitForResponses(toolCalls.map((call) => call.id));

    return run(responses);
  } finally {
    proc.kill();
  }
}

test("end-to-end: a real spawned MCP server correctly handles advisor_run with projectRoot over real stdio JSON-RPC", async () => {
  const root = await makeVulnerablePluginDir();
  await withRealServer(
    [{ id: 1, name: "advisor_run", arguments: { id: "wordpress-security", projectRoot: root } }],
    (responses) => {
      const response = responses.get(1);
      assert.ok(response, "expected a response for request id 1");
      const parsedResult = JSON.parse(response.result.content[0].text);
      assert.equal(parsedResult.success, true);
      assert.ok(parsedResult.findings.some((f) => f.id === "missing-nonce-verification"));
    }
  );
});

test("end-to-end: a real spawned MCP server returns a structured error (isError:true) for mutually-exclusive context+projectRoot", async () => {
  const root = await makeGenericJsDir();
  await withRealServer(
    [{ id: 1, name: "advisor_run", arguments: { id: "security", context: { sourceFiles: [] }, projectRoot: root } }],
    (responses) => {
      const response = responses.get(1);
      assert.ok(response, "expected a response for request id 1");
      assert.equal(response.result.isError, true);
      assert.match(response.result.content[0].text, /Supply either 'context' or 'projectRoot', not both\./);
    }
  );
});
