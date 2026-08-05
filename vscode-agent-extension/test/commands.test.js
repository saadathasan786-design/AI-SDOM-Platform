import { test } from "node:test";
import assert from "node:assert/strict";
import { createCommandHandlers } from "../src/commands.js";
import { createMockVscode } from "./mock-vscode.js";
import { listAgentCatalog } from "../../agents/index.js";

function pickByLabel(label) {
  return (items) => {
    if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
    return items.find((i) => i.label === label);
  };
}

test("Agent: List Agents -- uses the real Agent Catalog, opens a webview, caches state", async () => {
  const { vscodeApi, calls } = createMockVscode({});
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.listAgents();

  assert.deepEqual(result, listAgentCatalog());
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.equal(calls.createWebviewPanel[0].title, "Registered Agents");
  assert.ok(calls.createWebviewPanel[0].webview.html.includes("architecture-remediation"));
  assert.equal(state.lastReport.kind, "catalog");
});

test("Agent: Check Compatibility -- delegates to the real checkCompatibility(), shows a webview", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: pickByLabel("architecture-remediation"),
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.checkAgentCompatibility();

  assert.equal(result.agent, "architecture-remediation");
  assert.equal(result.compatible, true);
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.match(calls.createWebviewPanel[0].title, /architecture-remediation/);
  assert.equal(state.lastReport.kind, "compatibility");
});

test("Agent: Check Compatibility -- an unknown agent id surfaces the framework's own error via showErrorMessage", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: () => ({ label: "not-a-real-agent" }),
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.checkAgentCompatibility();

  assert.equal(result.compatible, false);
  assert.match(result.error, /Unknown agent/);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /Unknown agent/);
});

test("Agent: Check Compatibility -- user cancelling the picker returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({ showQuickPick: undefined });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.checkAgentCompatibility();

  assert.equal(result, null);
  assert.equal(calls.createWebviewPanel.length, 0);
});

test("Agent: Run Agent -- delegates to the real runAgentWithReport(), shows progress, opens a webview, clean workflow stops after one step", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: pickByLabel("architecture-remediation"),
    activeTextEditor: { document: { fileName: "clean.js", getText: () => "export const a = 1;" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runAgent();

  assert.equal(report.agent, "architecture-remediation");
  assert.equal(report.success, true);
  assert.equal(report.steps.length, 1);
  assert.equal(calls.withProgress.length, 1);
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.match(calls.createWebviewPanel[0].title, /architecture-remediation/);
  assert.equal(state.lastReport.kind, "report");
});

test("Agent: Run Agent -- a real layer violation (via json-file context with multiple files) proceeds through both steps", async () => {
  const violationContent = JSON.stringify({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return items.find((i) => i.value === "json-file");
      return items.find((i) => i.label === "architecture-remediation");
    },
    showOpenDialog: [{ fsPath: "/fake/context.json" }],
    fileContents: { "/fake/context.json": violationContent },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runAgent();

  assert.equal(report.success, true);
  assert.equal(report.steps.length, 2);
  assert.ok(report.steps[0].result.findings.some((f) => f.id === "layer-violation"));
  assert.equal(report.steps[1].result.mode, "dry-run");
});

test("Agent: Run Agent -- unknown agent id surfaces the framework's own error via showErrorMessage, without duplicating validation", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
      return { label: "not-a-real-agent" };
    },
    activeTextEditor: { document: { fileName: "x.js", getText: () => "x" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runAgent();

  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown agent/);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /Unknown agent/);
});

test("Agent: Run Agent -- user cancelling the agent picker returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({ showQuickPick: undefined });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.runAgent();

  assert.equal(result, null);
  assert.equal(calls.withProgress.length, 0);
  assert.equal(calls.createWebviewPanel.length, 0);
});

test("Agent: Run Agent -- user cancelling the context source returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return undefined;
      return items[0];
    },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.runAgent();

  assert.equal(result, null);
  assert.equal(calls.withProgress.length, 0);
});

test("Agent: Show Last Report -- with no prior run, shows an informational message and returns null", async () => {
  const { vscodeApi, calls } = createMockVscode({});
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.showLastReport();

  assert.equal(result, null);
  assert.equal(calls.showInformationMessage.length, 1);
  assert.equal(calls.createWebviewPanel.length, 0);
});

test("Agent: Show Last Report -- redisplays the most recent agent report", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: pickByLabel("architecture-remediation"),
    activeTextEditor: { document: { fileName: "clean.js", getText: () => "export const a = 1;" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  await handlers.runAgent();
  const shown = await handlers.showLastReport();

  assert.equal(shown.kind, "report");
  assert.equal(calls.createWebviewPanel.length, 2);
});

test("Agent: Show Last Report -- redisplays the most recent compatibility check", async () => {
  const { vscodeApi } = createMockVscode({ showQuickPick: pickByLabel("architecture-remediation") });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  await handlers.checkAgentCompatibility();
  const shown = await handlers.showLastReport();

  assert.equal(shown.kind, "compatibility");
});
