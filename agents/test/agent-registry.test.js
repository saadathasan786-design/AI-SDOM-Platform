import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registerAgent,
  getAgent,
  listAgents,
  hasAgent,
  _resetForTests,
} from "../framework/agent-registry.js";

function validDef(overrides = {}) {
  return {
    id: "sample-agent",
    name: "Sample Agent",
    version: "1.0.0",
    description: "A sample agent.",
    inputRequirements: [],
    plan: async () => ({ steps: [] }),
    decide: async () => ({ action: "continue" }),
    ...overrides,
  };
}

test("registers and retrieves a valid agent", () => {
  _resetForTests();
  registerAgent(validDef());
  const def = getAgent("sample-agent");
  assert.equal(def.id, "sample-agent");
  assert.equal(def.name, "Sample Agent");
});

test("rejects an invalid definition at registration time (delegates to agent-interface)", () => {
  _resetForTests();
  assert.throws(() => registerAgent({ id: "bad" }), /missing required field/);
});

test("refuses to register the same agent id twice", () => {
  _resetForTests();
  registerAgent(validDef());
  assert.throws(() => registerAgent(validDef()), /already registered/);
});

test("getAgent throws a helpful error listing registered agents for an unknown id", () => {
  _resetForTests();
  registerAgent(validDef());
  assert.throws(() => getAgent("nonexistent"), /Unknown agent: "nonexistent".*sample-agent/);
});

test("hasAgent reports registration status without throwing", () => {
  _resetForTests();
  registerAgent(validDef());
  assert.equal(hasAgent("sample-agent"), true);
  assert.equal(hasAgent("nonexistent"), false);
});

test("listAgents returns metadata for all registered agents, without exposing plan/decide functions", () => {
  _resetForTests();
  registerAgent(validDef());
  registerAgent(validDef({ id: "other-agent" }));

  const list = listAgents();
  assert.equal(list.length, 2);
  assert.ok(list.every((a) => typeof a.plan === "undefined" && typeof a.decide === "undefined"));
});

test("two agents with different ids can coexist", () => {
  _resetForTests();
  registerAgent(validDef({ id: "first" }));
  registerAgent(validDef({ id: "second" }));
  assert.equal(listAgents().length, 2);
});
