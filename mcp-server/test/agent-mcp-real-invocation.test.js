import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "index.js");

async function withRealServer(toolCalls, run) {
  const proc = spawn("node", [SERVER_PATH], { stdio: ["pipe", "pipe", "pipe"] });
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
        if (parsed.id !== undefined) responses.set(parsed.id, parsed);
      } catch {
        // ignore non-JSON stdout noise
      }
    }
  });

  function send(msg) {
    proc.stdin.write(JSON.stringify(msg) + "\n");
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    send({
      jsonrpc: "2.0",
      id: "init",
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } },
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    await new Promise((resolve) => setTimeout(resolve, 200));

    for (const call of toolCalls) {
      send({ jsonrpc: "2.0", id: call.id, method: "tools/call", params: { name: call.name, arguments: call.arguments } });
    }
    await new Promise((resolve) => setTimeout(resolve, 700));

    return run(responses);
  } finally {
    proc.kill();
  }
}

test("real MCP invocation: agent_list returns the real registered agent through the actual server process", async () => {
  await withRealServer([{ id: 1, name: "agent_list", arguments: {} }], (responses) => {
    const response = responses.get(1);
    assert.ok(response, "expected a response for request id 1");
    assert.equal(!!response.result.isError, false);
    const catalog = JSON.parse(response.result.content[0].text);
    assert.ok(catalog.some((a) => a.id === "architecture-remediation"));
  });
});

test("real MCP invocation: agent_run executes the real agent (clean workflow, stops after one step) through the actual server process", async () => {
  await withRealServer(
    [
      {
        id: 2,
        name: "agent_run",
        arguments: {
          id: "architecture-remediation",
          context: { sourceFiles: [{ path: "clean.js", content: "export const a = 1;" }] },
        },
      },
    ],
    (responses) => {
      const response = responses.get(2);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.success, true);
      assert.equal(report.steps.length, 1);
      assert.equal(report.halted.action, "stop");
    }
  );
});

test("real MCP invocation: agent_run executes the real two-step workflow when a real violation is present", async () => {
  await withRealServer(
    [
      {
        id: 3,
        name: "agent_run",
        arguments: {
          id: "architecture-remediation",
          context: {
            sourceFiles: [
              { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';" },
              { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
            ],
          },
        },
      },
    ],
    (responses) => {
      const response = responses.get(3);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.success, true);
      assert.equal(report.steps.length, 2);
      assert.equal(report.steps[1].result.mode, "dry-run");
      assert.equal(report.steps[1].result.success, true);
    }
  );
});

test("real MCP invocation: agent_run with an unknown agent id returns a proper MCP error, with the report still included", async () => {
  await withRealServer([{ id: 4, name: "agent_run", arguments: { id: "nonexistent-agent" } }], (responses) => {
    const response = responses.get(4);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    const report = JSON.parse(response.result.content[0].text);
    assert.equal(report.success, false);
    assert.match(report.errors[0].message, /Unknown agent/);
  });
});

test("real MCP invocation: agent_run with a missing id returns a proper MCP error", async () => {
  await withRealServer([{ id: 5, name: "agent_run", arguments: {} }], (responses) => {
    const response = responses.get(5);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /requires a non-empty string 'id'/);
  });
});

test("real MCP invocation: agent_checkCompatibility returns compatible:true for the real agent, isError:false", async () => {
  await withRealServer(
    [{ id: 6, name: "agent_checkCompatibility", arguments: { id: "architecture-remediation" } }],
    (responses) => {
      const response = responses.get(6);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const result = JSON.parse(response.result.content[0].text);
      assert.equal(result.compatible, true);
    }
  );
});

test("real MCP invocation: agent_checkCompatibility for an unknown agent returns isError:true with compatible:false", async () => {
  await withRealServer([{ id: 7, name: "agent_checkCompatibility", arguments: { id: "nonexistent-agent" } }], (responses) => {
    const response = responses.get(7);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    const result = JSON.parse(response.result.content[0].text);
    assert.equal(result.compatible, false);
    assert.match(result.error, /Unknown agent/);
  });
});

test("real MCP invocation: multiple agent tool calls in one session do not interfere with each other, or with advisor tool calls", async () => {
  await withRealServer(
    [
      { id: 10, name: "agent_list", arguments: {} },
      { id: 11, name: "agent_checkCompatibility", arguments: { id: "architecture-remediation" } },
      { id: 12, name: "advisor_list", arguments: {} },
      { id: 13, name: "agent_run", arguments: { id: "architecture-remediation", context: { sourceFiles: [] } } },
    ],
    (responses) => {
      assert.ok(responses.get(10));
      assert.ok(responses.get(11));
      assert.ok(responses.get(12));
      assert.ok(responses.get(13));

      const agentList = JSON.parse(responses.get(10).result.content[0].text);
      const compat = JSON.parse(responses.get(11).result.content[0].text);
      const advisorList = JSON.parse(responses.get(12).result.content[0].text);
      const runResult = JSON.parse(responses.get(13).result.content[0].text);

      assert.ok(agentList.some((a) => a.id === "architecture-remediation"));
      assert.equal(compat.compatible, true);
      assert.equal(advisorList.length, 8);
      assert.equal(runResult.agent, "architecture-remediation");
    }
  );
});
