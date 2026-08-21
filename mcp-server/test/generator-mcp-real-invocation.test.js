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

  async function waitForResponse(id, timeoutMs = 15000) {
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
    /*
     * Do not use an arbitrary startup sleep as the synchronization
     * mechanism. Start the MCP handshake immediately.
     */
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

    /*
     * MCP lifecycle notification.
     */
    send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    });

    /*
     * THIS WAS MISSING.
     *
     * Actually send every requested tool invocation.
     */
    for (const call of toolCalls) {
      send({
        jsonrpc: "2.0",
        id: call.id,
        method: "tools/call",
        params: {
          name: call.name,
          arguments: call.arguments ?? {},
        },
      });
    }

    const expectedIds = new Set(toolCalls.map((call) => call.id));

    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 15000;

      const check = () => {
        const allReceived = [...expectedIds].every((id) =>
          responses.has(id)
        );

        if (allReceived) {
          resolve();
          return;
        }

        if (Date.now() >= deadline) {
          reject(
            new Error(
              `Timed out waiting for MCP responses. ` +
                `Received: ${
                  [...responses.keys()].join(", ") || "(none)"
                }. ` +
                `Expected: ${[...expectedIds].join(", ")}`
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

test("real MCP invocation: generator_list returns the real Generator Catalog", async () => {
  await withRealServer([{ id: 1, name: "generator_list", arguments: {} }], (responses) => {
    const response = responses.get(1);
    assert.ok(response);
    assert.equal(response.result.isError, false);
    const catalog = JSON.parse(response.result.content[0].text);
    assert.ok(catalog.some((entry) => entry.id === "plugin"));
    assert.ok(catalog.some((entry) => entry.id === "theme"));
  });
});

test("real MCP invocation: generator_get returns complete plugin metadata", async () => {
  await withRealServer(
    [{ id: 2, name: "generator_get", arguments: { id: "plugin" } }],
    (responses) => {
      const response = responses.get(2);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const metadata = JSON.parse(response.result.content[0].text);
      assert.equal(metadata.id, "plugin");
      assert.equal(metadata.name, "Plugin Generator");
      assert.equal(metadata.frameworkCompatible, true);
    }
  );
});

test("real MCP invocation: generator_run executes the real plugin Generator in preview mode", async () => {
  await withRealServer(
    [
      {
        id: 3,
        name: "generator_run",
        arguments: {
          id: "plugin",
          config: { project_name: "Acme Client Portal" },
          mode: "preview",
        },
      },
    ],
    (responses) => {
      const response = responses.get(3);
      assert.ok(response);
      assert.equal(response.result.isError, false);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.generator, "plugin");
      assert.equal(report.mode, "preview");
      assert.equal(report.success, true);
      assert.ok(report.files.created.includes("acme-client-portal.php"));
    }
  );
});

test("real MCP invocation: generator_run unknown id returns a proper MCP error with the Generation Report", async () => {
  await withRealServer(
    [{ id: 4, name: "generator_run", arguments: { id: "nonexistent-generator", config: {}, mode: "preview" } }],
    (responses) => {
      const response = responses.get(4);
      assert.ok(response);
      assert.equal(response.result.isError, true);
      const report = JSON.parse(response.result.content[0].text);
      assert.equal(report.success, false);
      assert.match(report.error, /Unknown generator/);
    }
  );
});

test("real MCP invocation: generator_run with missing id returns a proper MCP error", async () => {
  await withRealServer([{ id: 5, name: "generator_run", arguments: {} }], (responses) => {
    const response = responses.get(5);
    assert.ok(response);
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /generator_run requires a non-empty string 'id'/);
  });
});

test("real MCP invocation: generator catalog utility tools work through the actual server", async () => {
  await withRealServer(
    [
      { id: 6, name: "generator_getVariableManifest", arguments: { id: "plugin" } },
      { id: 7, name: "generator_supportsMode", arguments: { id: "plugin", mode: "dry-run" } },
      { id: 8, name: "generator_isAvailable", arguments: { id: "plugin" } },
      { id: 9, name: "generator_getFrameworkCompatibility", arguments: { id: "plugin" } },
    ],
    (responses) => {
      assert.ok(responses.get(6));
      assert.ok(responses.get(7));
      assert.ok(responses.get(8));
      assert.ok(responses.get(9));

      const manifest = JSON.parse(responses.get(6).result.content[0].text);
      const supports = JSON.parse(responses.get(7).result.content[0].text);
      const available = JSON.parse(responses.get(8).result.content[0].text);
      const compatibility = JSON.parse(responses.get(9).result.content[0].text);

      assert.ok(Array.isArray(manifest));
      assert.equal(supports, true);
      assert.equal(available, true);
      assert.equal(compatibility.compatible, true);
    }
  );
});
