import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "index.js");

async function startServer() {
  const proc = spawn("node", [SERVER_PATH], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const responses = new Map();
  let buffer = "";
  let stderr = "";

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

  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  function send(message) {
    proc.stdin.write(JSON.stringify(message) + "\n");
  }

  async function wait(ms = 100) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForResponse(id, timeoutMs = 5000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const response = responses.get(id);

      if (response) {
        return response;
      }

      if (proc.exitCode !== null || proc.signalCode !== null) {
        throw new Error(
          `MCP server exited before response for '${id}'. ` +
            `exitCode=${proc.exitCode}, signalCode=${proc.signalCode}. ` +
            `stderr=${stderr}`
        );
      }

      await wait(25);
    }

    throw new Error(
      `Timed out waiting for MCP response: ${id}\n` +
        `===== MCP SERVER STDERR =====\n${stderr}\n` +
        `===== END MCP SERVER STDERR =====`
    );
  }

  async function initialize() {
    send({
      jsonrpc: "2.0",
      id: "init",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "mcp-contract-test",
          version: "1.0.0",
        },
      },
    });

    const response = await waitForResponse("init");

    send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    await wait(50);

    return response;
  }

  async function stop() {
    if (!proc.killed) {
      proc.kill();
    }
  }

  return {
    proc,
    responses,
    stderr: () => stderr,
    send,
    wait,
    waitForResponse,
    initialize,
    stop,
  };
}

async function listTools(server) {
  server.send({
    jsonrpc: "2.0",
    id: "tools-list",
    method: "tools/list",
    params: {},
  });

  return server.waitForResponse("tools-list");
}

test("MCP contract: initialize returns a successful JSON-RPC response", async () => {
  const server = await startServer();

  try {
    server.send({
      jsonrpc: "2.0",
      id: "init-contract",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "contract-test",
          version: "1.0.0",
        },
      },
    });

    const response = await server.waitForResponse("init-contract");

    assert.equal(response.jsonrpc, "2.0");
    assert.equal(response.id, "init-contract");
    assert.ok(response.result);
    assert.ok(response.result.protocolVersion);
    assert.ok(response.result.capabilities);
    assert.ok(response.result.serverInfo);
  } finally {
    await server.stop();
  }
});

test("MCP contract: tools/list returns the current registered tool surface", async () => {
  const server = await startServer();

  try {
    await server.initialize();

    const response = await listTools(server);

    assert.equal(response.jsonrpc, "2.0");
    assert.equal(response.id, "tools-list");
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.tools));

    const names = response.result.tools.map((tool) => tool.name);

    const requiredTools = [
      "wp_list_posts",
      "wp_get_post",
      "wp_create_post",
      "wp_update_post",
      "wp_delete_post",
      "wp_list_taxonomy_terms",
      "wp_create_taxonomy_term",
      "wp_upload_media",
      "wp_get_site_settings",
      "wp_get_project_graph",
      "wp_snapshot_project",
      "memory_list_snapshots",
      "memory_get_snapshot",
      "memory_diff_snapshots",
      "wp_rest_request",

      "advisor_list",
      "advisor_run",
      "advisor_runMany",

      "agent_list",
      "agent_run",
      "agent_checkCompatibility",

      "workflow_list",
      "workflow_run",
      "workflow_checkCompatibility",
    ];

    for (const name of requiredTools) {
      assert.ok(
        names.includes(name),
        `expected registered MCP tool '${name}'`
      );
    }

    assert.equal(
      new Set(names).size,
      names.length,
      "MCP tool names must be unique"
    );
  } finally {
    await server.stop();
  }
});

test("MCP contract: every advertised tool has a valid name and input schema", async () => {
  const server = await startServer();

  try {
    await server.initialize();

    const response = await listTools(server);

    assert.ok(Array.isArray(response.result.tools));
    assert.ok(response.result.tools.length > 0);

    for (const tool of response.result.tools) {
      assert.equal(typeof tool.name, "string");
      assert.ok(tool.name.length > 0);

      assert.equal(typeof tool.description, "string");
      assert.ok(tool.description.length > 0);

      assert.ok(tool.inputSchema);
      assert.equal(tool.inputSchema.type, "object");
      assert.ok(tool.inputSchema.properties);
    }
  } finally {
    await server.stop();
  }
});

test("MCP contract: advisor_list can be invoked without WordPress access", async () => {
  const server = await startServer();

  try {
    await server.initialize();

    server.send({
      jsonrpc: "2.0",
      id: "advisor-list-call",
      method: "tools/call",
      params: {
        name: "advisor_list",
        arguments: {},
      },
    });

    const response = await server.waitForResponse("advisor-list-call");

    assert.equal(response.jsonrpc, "2.0");
    assert.equal(response.id, "advisor-list-call");
    assert.ok(response.result);
    assert.equal(response.result.isError, false);
    assert.ok(Array.isArray(response.result.content));
    assert.equal(response.result.content[0].type, "text");

    const advisors = JSON.parse(response.result.content[0].text);

    assert.ok(Array.isArray(advisors));
    assert.equal(advisors.length, 8);
  } finally {
    await server.stop();
  }
});

test("MCP contract: unknown tool returns a structured MCP tool error", async () => {
  const server = await startServer();

  try {
    await server.initialize();

    server.send({
      jsonrpc: "2.0",
      id: "unknown-tool",
      method: "tools/call",
      params: {
        name: "definitely-not-a-real-tool",
        arguments: {},
      },
    });

    const response = await server.waitForResponse("unknown-tool");

    assert.equal(response.jsonrpc, "2.0");
    assert.equal(response.id, "unknown-tool");
    assert.ok(response.result);
    assert.equal(response.result.isError, true);
    assert.ok(Array.isArray(response.result.content));
    assert.equal(response.result.content[0].type, "text");
  } finally {
    await server.stop();
  }
});

test("MCP contract: tools/call preserves structured validation errors for missing required arguments", async () => {
  const server = await startServer();

  try {
    await server.initialize();

    server.send({
      jsonrpc: "2.0",
      id: "missing-id",
      method: "tools/call",
      params: {
        name: "advisor_run",
        arguments: {},
      },
    });

    const response = await server.waitForResponse("missing-id");

    assert.equal(response.jsonrpc, "2.0");
    assert.equal(response.id, "missing-id");
    assert.ok(response.result);
    assert.equal(response.result.isError, true);
    assert.ok(Array.isArray(response.result.content));

    const text = response.result.content[0].text;

    assert.match(text, /requires a non-empty string 'id'/);
  } finally {
    await server.stop();
  }
});

test("MCP contract: unknown JSON-RPC method returns a JSON-RPC error response", async () => {
  const server = await startServer();

  try {
    await server.initialize();

    server.send({
      jsonrpc: "2.0",
      id: "unknown-method",
      method: "definitely/not/a/method",
      params: {},
    });

    const response = await server.waitForResponse("unknown-method");

    assert.equal(response.jsonrpc, "2.0");
    assert.equal(response.id, "unknown-method");
    assert.ok(response.error);
    assert.equal(typeof response.error.code, "number");
    assert.equal(typeof response.error.message, "string");
  } finally {
    await server.stop();
  }
});

test("MCP contract: initialized notification does not produce a spurious response", async () => {
  const server = await startServer();

  try {
    server.send({
      jsonrpc: "2.0",
      id: "init-notification-check",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "contract-test",
          version: "1.0.0",
        },
      },
    });

    const initializeResponse = await server.waitForResponse(
      "init-notification-check"
    );

    assert.ok(initializeResponse);

    server.send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    await server.wait(500);

    assert.equal(
      server.responses.has(undefined),
      false
    );
  } finally {
    await server.stop();
  }
});