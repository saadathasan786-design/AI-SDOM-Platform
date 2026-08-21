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
  const proc = spawn("node", [SERVER_PATH], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const responses = new Map();

  let stdoutBuffer = "";
  let stderrBuffer = "";

  let stdoutClosed = false;
  let stderrClosed = false;

  const waiters = new Map();

  function processStdout() {
    let newlineIndex;

    while ((newlineIndex = stdoutBuffer.indexOf("\n")) >= 0) {
      const line = stdoutBuffer.slice(0, newlineIndex);
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);

      if (!line.trim()) continue;

      let parsed;

      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }

      if (parsed.id === undefined) continue;

      responses.set(parsed.id, parsed);

      const waiter = waiters.get(parsed.id);

      if (waiter) {
        waiters.delete(parsed.id);
        waiter.resolve(parsed);
      }
    }
  }

  proc.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk.toString();
    processStdout();
  });

  proc.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString();
  });

  proc.stdout.on("end", () => {
    stdoutClosed = true;
  });

  proc.stderr.on("end", () => {
    stderrClosed = true;
  });

  proc.on("error", (error) => {
    for (const waiter of waiters.values()) {
      waiter.reject(error);
    }

    waiters.clear();
  });

  proc.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      const error = new Error(
        `MCP server exited unexpectedly with code ${code}, signal ${signal}.\n` +
        `stderr:\n${stderrBuffer}`
      );

      for (const waiter of waiters.values()) {
        waiter.reject(error);
      }

      waiters.clear();
    }
  });

  function send(msg) {
    if (proc.stdin.destroyed) {
      throw new Error("MCP server stdin is closed");
    }

    proc.stdin.write(JSON.stringify(msg) + "\n");
  }

  function waitForResponse(id, timeoutMs = 10000) {
    const existing = responses.get(id);

    if (existing) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(id);

        reject(
          new Error(
            `Timed out waiting for MCP response id ${String(id)}.\n` +
            `stderr:\n${stderrBuffer}\n` +
            `stdoutClosed=${stdoutClosed}, stderrClosed=${stderrClosed}`
          )
        );
      }, timeoutMs);

      waiters.set(id, {
        resolve: (response) => {
          clearTimeout(timer);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  try {
    // The server's readiness banner is intentionally written to stderr.
    // Give the process a short opportunity to finish startup, but do not
    // use a fixed sleep as protocol synchronization.
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 3000);

      const check = () => {
        if (stderrBuffer.includes("wp-mcp-server running on stdio")) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        if (proc.exitCode !== null) {
          clearTimeout(timeout);
          reject(
            new Error(
              `MCP server exited during startup.\n` +
              `code=${proc.exitCode}\n` +
              `stderr:\n${stderrBuffer}`
            )
          );
          return;
        }

        setImmediate(check);
      };

      check();
    });

    // MCP initialization handshake.
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

    await waitForResponse("init");

    send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    // Send tool calls.
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

    // Wait for every requested response rather than sleeping for an
    // arbitrary amount of time.
    await Promise.all(
      toolCalls.map((call) => waitForResponse(call.id))
    );

    return run(responses);
  } finally {
    if (!proc.killed) {
      proc.kill();
    }
  }
}

test("advisor_list returns all registered advisors through the actual server process", async () => {
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
