import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "index.js");

async function withRealServer(toolCalls, run) {
   const proc = spawn("node", [SERVER_PATH], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const responses = new Map();
  let buffer = "";
  let stderr = "";

  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  proc.on("error", (err) => {
    console.error("MCP CHILD PROCESS ERROR:", err);
  });

  proc.on("exit", (code, signal) => {
    console.error("MCP CHILD PROCESS EXIT:", { code, signal });
  });

  proc.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.id !== undefined) responses.set(parsed.id, parsed);
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
      clientInfo: { name: "test", version: "1.0" },
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
        if (stderr.trim()) {
      console.error("\n===== MCP SERVER STDERR =====");
      console.error(stderr);
      console.error("===== END MCP SERVER STDERR =====\n");
    }

    console.error("MCP SERVER EXIT STATUS:", {
      exitCode: proc.exitCode,
      signalCode: proc.signalCode,
    });

    proc.kill();
  }
}

test("real MCP invocation: workflow_list returns both real registered workflows through the actual server process", async () => {
  await withRealServer([{ id: 1, name: "workflow_list", arguments: {} }], (responses) => {
    const response = responses.get(1);
    assert.ok(response, "expected a response for request id 1");
    assert.equal(!!response.result.isError, false);
    const catalog = JSON.parse(response.result.content[0].text);
    const ids = catalog.map((w) => w.id);
    assert.ok(ids.includes("project-health-check"));
    assert.ok(ids.includes("security-audit"));
  });
});

test("real MCP invocation: workflow_run executes the real project-health-check workflow through the actual server process, exercising the full four-layer chain", async () => {
  await withRealServer(
    [
      {
        id: 2,
        name: "workflow_run",
        arguments: {
          id: "project-health-check",
          context: {
            sourceFiles: [
              { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';\neval(x);" },
              { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
            ],
          },
        },
      },
    ],
    (responses) => {
      const response = responses.get(2);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.success, true);
      assert.equal(report.steps.length, 3);
      assert.deepEqual(
        report.steps.map((s) => s.agentId),
        ["architecture-remediation", "security-remediation", "performance-optimization"]
      );
      const archAgentReport = report.steps[0].agentReport;
      assert.ok(archAgentReport.steps[0].result.findings.some((f) => f.id === "layer-violation"));
      const generatorStep = archAgentReport.steps.find((s) => s.type === "generator");
      assert.equal(generatorStep.result.mode, "dry-run");
      assert.equal(generatorStep.result.success, true);
    }
  );
});

test("real MCP invocation: workflow_run executes the real security-audit workflow (genuinely different agent order) through the actual server process", async () => {
  await withRealServer(
    [
      {
        id: 3,
        name: "workflow_run",
        arguments: { id: "security-audit", context: { sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] } },
      },
    ],
    (responses) => {
      const response = responses.get(3);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.success, true);
      assert.deepEqual(
        report.steps.map((s) => s.agentId),
        ["security-remediation", "architecture-remediation", "performance-optimization"]
      );
    }
  );
});

test("real MCP invocation: workflow_run with an unknown workflow id returns a proper MCP error, with the report still included", async () => {
  await withRealServer([{ id: 4, name: "workflow_run", arguments: { id: "nonexistent-workflow" } }], (responses) => {
    const response = responses.get(4);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    const report = JSON.parse(response.result.content[0].text);
    assert.equal(report.success, false);
    assert.match(report.errors[0].message, /Unknown workflow/);
  });
});

test("real MCP invocation: workflow_run with a missing id returns a proper MCP error", async () => {
  await withRealServer([{ id: 5, name: "workflow_run", arguments: {} }], (responses) => {
    const response = responses.get(5);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /requires a non-empty string 'id'/);
  });
});

test("real MCP invocation: workflow_checkCompatibility returns compatible:true for both real workflows, isError:false", async () => {
  await withRealServer(
    [
      { id: 6, name: "workflow_checkCompatibility", arguments: { id: "project-health-check" } },
      { id: 7, name: "workflow_checkCompatibility", arguments: { id: "security-audit" } },
    ],
    (responses) => {
      const r1 = responses.get(6);
      const r2 = responses.get(7);
      assert.equal(r1.result.isError, false);
      assert.equal(r2.result.isError, false);
      assert.equal(JSON.parse(r1.result.content[0].text).compatible, true);
      assert.equal(JSON.parse(r2.result.content[0].text).compatible, true);
    }
  );
});

test("real MCP invocation: workflow_checkCompatibility for an unknown workflow returns isError:true with compatible:false", async () => {
  await withRealServer(
    [{ id: 8, name: "workflow_checkCompatibility", arguments: { id: "nonexistent-workflow" } }],
    (responses) => {
      const response = responses.get(8);
      assert.ok(response);
      assert.equal(response.result.isError, true);
      const result = JSON.parse(response.result.content[0].text);
      assert.equal(result.compatible, false);
      assert.match(result.error, /Unknown workflow/);
    }
  );
});

test("real MCP invocation: workflow, agent, and advisor tool calls can all be interleaved in one session without interference", async () => {
  await withRealServer(
    [
      { id: 10, name: "workflow_list", arguments: {} },
      { id: 11, name: "agent_list", arguments: {} },
      { id: 12, name: "advisor_list", arguments: {} },
      {
        id: 13,
        name: "workflow_run",
        arguments: { id: "project-health-check", context: { sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] } },
      },
    ],
    (responses) => {
      assert.ok(responses.get(10));
      assert.ok(responses.get(11));
      assert.ok(responses.get(12));
      assert.ok(responses.get(13));

      const workflowList = JSON.parse(responses.get(10).result.content[0].text);
      const agentList = JSON.parse(responses.get(11).result.content[0].text);
      const advisorList = JSON.parse(responses.get(12).result.content[0].text);
      const runResult = JSON.parse(responses.get(13).result.content[0].text);

      assert.ok(workflowList.some((w) => w.id === "project-health-check"));
      assert.equal(agentList.length, 5);
      assert.equal(advisorList.length, 8);
      assert.equal(runResult.workflow, "project-health-check");
    }
  );
});
