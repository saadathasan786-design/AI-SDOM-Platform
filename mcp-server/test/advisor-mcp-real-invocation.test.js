import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "index.js");

/**
 * Spawns the real mcp-server process, performs the MCP initialize
 * handshake, sends the given tool calls in order, and returns the parsed
 * JSON-RPC responses keyed by request id. This exercises the actual
 * server binary over real stdio JSON-RPC framing -- not just calling the
 * handler functions in-process (that's what advisor-tools.test.js does).
 */
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
    await new Promise((resolve) => setTimeout(resolve, 500));

    return run(responses);
  } finally {
    proc.kill();
  }
}

test("real MCP invocation: advisor_list returns all five registered advisors through the actual server process", async () => {
  await withRealServer([{ id: 1, name: "advisor_list", arguments: {} }], (responses) => {
    const response = responses.get(1);
    assert.ok(response, "expected a response for request id 1");
    assert.equal(!!response.result.isError, false);
    const catalog = JSON.parse(response.result.content[0].text);
    const ids = catalog.map((a) => a.id);
    assert.ok(ids.includes("architecture"));
    assert.ok(ids.includes("security"));
    assert.equal(catalog.length, 8);
  });
});

test("real MCP invocation: advisor_run executes a real advisor and returns its report through the actual server process", async () => {
  await withRealServer(
    [
      {
        id: 2,
        name: "advisor_run",
        arguments: { id: "security", context: { sourceFiles: [{ path: "x.js", content: "eval(x);" }] } },
      },
    ],
    (responses) => {
      const response = responses.get(2);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.success, true);
      assert.ok(report.findings.some((f) => f.id === "dangerous-eval-usage"));
    }
  );
});

test("real MCP invocation: advisor_run with an unknown advisor id returns a proper MCP error, with the report still included", async () => {
  await withRealServer([{ id: 3, name: "advisor_run", arguments: { id: "nonexistent-advisor" } }], (responses) => {
    const response = responses.get(3);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    const report = JSON.parse(response.result.content[0].text);
    assert.equal(report.success, false);
    assert.match(report.error, /Unknown advisor/);
  });
});

test("real MCP invocation: advisor_run with a missing id returns a proper MCP error", async () => {
  await withRealServer([{ id: 4, name: "advisor_run", arguments: {} }], (responses) => {
    const response = responses.get(4);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /requires a non-empty string 'id'/);
  });
});

test("real MCP invocation: advisor_runMany executes multiple real advisors in parallel through the actual server process", async () => {
  await withRealServer(
    [
      {
        id: 5,
        name: "advisor_runMany",
        arguments: {
          ids: ["architecture", "security", "performance"],
          context: { sourceFiles: [{ path: "x.js", content: "export const a = 1;" }] },
        },
      },
    ],
    (responses) => {
      const response = responses.get(5);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.success, true);
      assert.equal(report.advisorCount, 3);
      assert.deepEqual(report.advisorsFailed, []);
    }
  );
});

test("real MCP invocation: multiple advisor tool calls in one session do not interfere with each other", async () => {
  await withRealServer(
    [
      { id: 10, name: "advisor_list", arguments: {} },
      { id: 11, name: "advisor_run", arguments: { id: "architecture", context: { sourceFiles: [] } } },
      { id: 12, name: "advisor_runMany", arguments: { ids: ["security", "code-review"], context: { sourceFiles: [] } } },
    ],
    (responses) => {
      assert.ok(responses.get(10));
      assert.ok(responses.get(11));
      assert.ok(responses.get(12));

      const listResult = JSON.parse(responses.get(10).result.content[0].text);
      const runResult = JSON.parse(responses.get(11).result.content[0].text);
      const runManyResult = JSON.parse(responses.get(12).result.content[0].text);

      assert.equal(listResult.length, 8);
      assert.equal(runResult.advisor, "architecture");
      assert.equal(runManyResult.advisorCount, 2);
    }
  );
});
