import { test } from "node:test";
import assert from "node:assert/strict";
import { createCommandHandlers } from "../src/commands.js";
import { createMockVscode } from "./mock-vscode.js";
import { listAdvisorCatalog } from "../../advisors/index.js";

function pickByLabel(label) {
  return (items) => {
    // Context-source picker items have a `.value` field; advisor picker
    // items don't. When shown the context-source list, always pick
    // "Current file" so tests can supply context via activeTextEditor.
    if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
    return items.find((i) => i.label === label);
  };
}

test("Advisor: List Advisors -- uses the real Advisor Catalog, opens a webview, caches state", async () => {
  const { vscodeApi, calls } = createMockVscode({});
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.listAdvisors();

  assert.deepEqual(result, listAdvisorCatalog());
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.equal(calls.createWebviewPanel[0].title, "Registered Advisors");
  assert.ok(calls.createWebviewPanel[0].webview.html.includes("architecture"));
  assert.equal(state.lastReport.kind, "catalog");
});

test("Advisor: Run Advisor -- delegates to the real runAdvisorWithReport(), shows progress, opens a webview", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: pickByLabel("security"),
    activeTextEditor: { document: { fileName: "x.js", getText: () => "eval(x);" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runAdvisor();

  assert.equal(report.advisor, "security");
  assert.equal(report.success, true);
  assert.ok(report.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.equal(calls.withProgress.length, 1);
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.match(calls.createWebviewPanel[0].title, /security/);
  assert.equal(state.lastReport.kind, "single");
  assert.equal(state.lastReport.report.advisor, "security");
});

test("Advisor: Run Advisor -- unknown advisor id surfaces the framework's own error via showErrorMessage, without duplicating validation", async () => {
  // Simulate an unknown advisor by having the quick pick "select" an item
  // not actually in the real catalog (as if a stale/invalid id were passed).
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
      return { label: "not-a-real-advisor" };
    },
    activeTextEditor: { document: { fileName: "x.js", getText: () => "x" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runAdvisor();

  assert.equal(report.success, false);
  assert.match(report.error, /Unknown advisor/);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /Unknown advisor/);
});

test("Advisor: Run Advisor -- user cancelling the advisor picker returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({ showQuickPick: undefined });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.runAdvisor();

  assert.equal(result, null);
  assert.equal(calls.withProgress.length, 0);
  assert.equal(calls.createWebviewPanel.length, 0);
});

test("Advisor: Run Advisor -- user cancelling the context source returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return undefined;
      return items[0];
    },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.runAdvisor();

  assert.equal(result, null);
  assert.equal(calls.withProgress.length, 0);
});

test("Advisor: Run Multiple Advisors -- delegates to the real runAdvisors(), shows a unified report", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items, options) =>
      options.canPickMany ? items.filter((i) => ["architecture", "security"].includes(i.label)) : items[0],
    activeTextEditor: { document: { fileName: "x.js", getText: () => "eval(x);" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runManyAdvisors();

  assert.equal(report.advisorCount, 2);
  assert.deepEqual(report.advisorsRun.sort(), ["architecture", "security"]);
  assert.equal(calls.createWebviewPanel[0].title, "Unified Advisor Report");
  assert.equal(state.lastReport.kind, "unified");
});

test("Advisor: Run Multiple Advisors -- an unknown advisor mixed with real ones is isolated, error surfaced", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items, options) =>
      options.canPickMany ? [{ label: "architecture" }, { label: "not-real" }] : items[0],
    activeTextEditor: { document: { fileName: "x.js", getText: () => "x" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runManyAdvisors();

  assert.equal(report.success, false);
  assert.deepEqual(report.advisorsFailed, ["not-real"]);
  assert.deepEqual(report.advisorsRun, ["architecture"]);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /not-real/);
});

test("Advisor: Run Multiple Advisors -- selecting zero advisors returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items, options) => (options.canPickMany ? [] : items[0]),
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.runManyAdvisors();

  assert.equal(result, null);
  assert.equal(calls.withProgress.length, 0);
});

test("Advisor: Show Last Report -- with no prior run, shows an informational message and returns null", async () => {
  const { vscodeApi, calls } = createMockVscode({});
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const result = await handlers.showLastReport();

  assert.equal(result, null);
  assert.equal(calls.showInformationMessage.length, 1);
  assert.equal(calls.createWebviewPanel.length, 0);
});

test("Advisor: Show Last Report -- redisplays the most recent single-advisor report", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: pickByLabel("security"),
    activeTextEditor: { document: { fileName: "x.js", getText: () => "eval(x);" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  await handlers.runAdvisor();
  const shown = await handlers.showLastReport();

  assert.equal(shown.kind, "single");
  assert.equal(calls.createWebviewPanel.length, 2);
});

test("Advisor: Show Last Report -- redisplays the most recent unified report", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items, options) => (options.canPickMany ? [items[0], items[1]] : items[0]),
    activeTextEditor: { document: { fileName: "x.js", getText: () => "eval(x);" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  await handlers.runManyAdvisors();
  const shown = await handlers.showLastReport();

  assert.equal(shown.kind, "unified");
});
