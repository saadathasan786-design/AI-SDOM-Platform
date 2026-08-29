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
        // Ignore non-JSON stdout noise.
      }
    }
  });

  function send(msg) {
    proc.stdin.write(JSON.stringify(msg) + "\n");
  }

  async function waitForResponse(id, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;

    return new Promise((resolve, reject) => {
      const check = () => {
        if (responses.has(id)) {
          resolve(responses.get(id));
          return;
        }

        if (Date.now() >= deadline) {
          reject(
            new Error(
              `Timed out waiting for MCP response ${id}. ` +
                `Received: ${[...responses.keys()].join(", ") || "(none)"}`
            )
          );
          return;
        }

        setTimeout(check, 50);
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

    await waitForResponse("init");

    send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });

    for (const call of toolCalls) {
      send({
        jsonrpc: "2.0",
        id: call.id,
        method: "tools/call",
        params: { name: call.name, arguments: call.arguments ?? {} },
      });
    }

    const expectedIds = new Set(toolCalls.map((call) => call.id));

    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 20000;

      const check = () => {
        const allReceived = [...expectedIds].every((id) => responses.has(id));
        if (allReceived) {
          resolve();
          return;
        }
        if (Date.now() >= deadline) {
          reject(
            new Error(
              `Timed out waiting for MCP responses. Received: ${[...responses.keys()].join(", ")}. Expected: ${[...expectedIds].join(", ")}`
            )
          );
          return;
        }
        setTimeout(check, 50);
      };

      check();
    });

    return run(responses);
  } finally {
    proc.kill();
  }
}

// The two elementor tools must be registered and callable through the real
// server. All calls here are READ-ONLY: no page is mutated, no write occurs.
// Page 17 ("About") reads back a full, parseable _elementor_data; page 12
// ("Home") reads back a server-truncated value that the governing service
// must REFUSE rather than risk corrupting.

test("real MCP invocation: wp_elementor_inspect returns a parseable document for an Elementor page that reads back fully", async () => {
  await withRealServer([{ id: 1, name: "wp_elementor_inspect", arguments: { page_id: 17 } }], (responses) => {
    const response = responses.get(1);
    assert.ok(response);
    assert.equal(response.result.isError, false);
    const summary = JSON.parse(response.result.content[0].text);
    assert.equal(summary.page_id, 17);
    assert.equal(summary.is_elementor, true);
    assert.ok(summary.element_count > 0);
    assert.match(summary.document_sha256, /^[0-9a-f]{64}$/);
  });
});

test("real MCP invocation: wp_elementor_inspect returns a proper MCP error for a page whose _elementor_data reads back truncated (never operates on partial data)", async () => {
  await withRealServer([{ id: 2, name: "wp_elementor_inspect", arguments: { page_id: 12 } }], (responses) => {
    const response = responses.get(2);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /malformed _elementor_data/);
  });
});

test("real MCP invocation: wp_elementor_inspect rejects a missing page_id with a proper MCP error", async () => {
  await withRealServer([{ id: 3, name: "wp_elementor_inspect", arguments: {} }], (responses) => {
    const response = responses.get(3);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /positive integer 'page_id'/);
  });
});
