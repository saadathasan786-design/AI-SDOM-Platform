import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "index.js");

async function listRegisteredTools() {
  const proc = spawn("node", [SERVER_PATH], { stdio: ["pipe", "pipe", "pipe"] });
  let buffer = "";
  let stderr = "";
  let response;

  const done = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for tools/list response")), 5000);

    proc.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === "tools-list") {
            response = parsed;
            clearTimeout(timeout);
            resolve();
            return;
          }
        } catch {
          // Ignore non-JSON stdout noise.
        }
      }
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", reject);
  });

  proc.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: "init",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "elementor-registration-test", version: "1.0.0" },
    },
  }) + "\n");

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for initialize response. stderr=${stderr}`)), 5000);
    const onData = (chunk) => {
      buffer += chunk.toString();
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === "init") {
            clearTimeout(timer);
            proc.stdout.off("data", onData);
            resolve();
            return;
          }
        } catch {
          // Ignore non-JSON stdout noise.
        }
      }
    };
    proc.stdout.on("data", onData);
  });

  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: "tools-list", method: "tools/list", params: {} }) + "\n");

  try {
    await done;
  } finally {
    proc.kill();
  }

  return response;
}

test("MCP registration: Elementor inspect and patch tools are advertised", async () => {
  const response = await listRegisteredTools();
  assert.equal(response?.jsonrpc, "2.0");
  assert.ok(Array.isArray(response?.result?.tools));

  const names = response.result.tools.map((tool) => tool.name);
  assert.ok(names.includes("wp_elementor_inspect"), "wp_elementor_inspect must remain registered");
  assert.ok(names.includes("wp_elementor_patch"), "wp_elementor_patch must remain registered");
});
