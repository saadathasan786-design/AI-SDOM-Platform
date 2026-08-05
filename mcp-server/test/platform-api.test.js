import { test } from "node:test";
import assert from "node:assert/strict";
import { registerModule, call, listModules, _resetForTests } from "../platform-api.js";

test("routes a call to the correct module/action handler", async () => {
  _resetForTests();
  registerModule("echo", {
    ping: async (payload) => ({ pong: payload }),
  });

  const result = await call("echo", "ping", { hello: "world" });
  assert.deepEqual(result, { pong: { hello: "world" } });
});

test("throws on unknown module", async () => {
  _resetForTests();
  registerModule("echo", { ping: async () => "ok" });

  await assert.rejects(() => call("nope", "ping"), /Unknown module: nope/);
});

test("throws on unknown action for a known module", async () => {
  _resetForTests();
  registerModule("echo", { ping: async () => "ok" });

  await assert.rejects(() => call("echo", "nope"), /Unknown action "nope" on module "echo"/);
});

test("refuses to register the same module name twice", () => {
  _resetForTests();
  registerModule("echo", { ping: async () => "ok" });

  assert.throws(
    () => registerModule("echo", { ping: async () => "ok2" }),
    /already registered/
  );
});

test("listModules reflects registered modules and their actions", () => {
  _resetForTests();
  registerModule("knowledgeGraph", { build: async () => {} });
  registerModule("memory", { save: async () => {}, list: async () => {} });

  const modules = listModules();
  assert.equal(modules.length, 2);
  const memoryEntry = modules.find((m) => m.name === "memory");
  assert.deepEqual(memoryEntry.actions.sort(), ["list", "save"]);
});
