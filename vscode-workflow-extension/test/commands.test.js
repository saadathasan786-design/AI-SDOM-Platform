import { test } from "node:test";
import assert from "node:assert/strict";
import { createCommandHandlers } from "../src/commands.js";
import { createMockVscode } from "./mock-vscode.js";
import { listWorkflowCatalog } from "../../workflows/index.js";

function pickByLabel(label) {
  return (items) => {
    if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
    return items.find((i) => i.label === label);
  };
}

test("Workflow: List Workflows -- uses the real Workflow Catalog, opens a webview", async () => {
  const { vscodeApi, calls } = createMockVscode({});
  const handlers = createCommandHandlers(vscodeApi);

  const result = await handlers.listWorkflows();

  assert.deepEqual(result, listWorkflowCatalog());
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.equal(calls.createWebviewPanel[0].title, "Registered Workflows");
  assert.ok(calls.createWebviewPanel[0].webview.html.includes("project-health-check"));
});

test("Workflow: Check Compatibility -- delegates to the real checkCompatibility(), shows a webview", async () => {
  const { vscodeApi, calls } = createMockVscode({ showQuickPick: pickByLabel("project-health-check") });
  const handlers = createCommandHandlers(vscodeApi);

  const result = await handlers.checkWorkflowCompatibility();

  assert.equal(result.workflow, "project-health-check");
  assert.equal(result.compatible, true);
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.match(calls.createWebviewPanel[0].title, /project-health-check/);
});

test("Workflow: Check Compatibility -- an unknown workflow id surfaces the framework's own error via showErrorMessage", async () => {
  const { vscodeApi, calls } = createMockVscode({ showQuickPick: () => ({ label: "not-a-real-workflow" }) });
  const handlers = createCommandHandlers(vscodeApi);

  const result = await handlers.checkWorkflowCompatibility();

  assert.equal(result.compatible, false);
  assert.match(result.error, /Unknown workflow/);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /Unknown workflow/);
});

test("Workflow: Check Compatibility -- user cancelling the picker returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({ showQuickPick: undefined });
  const handlers = createCommandHandlers(vscodeApi);

  const result = await handlers.checkWorkflowCompatibility();

  assert.equal(result, null);
  assert.equal(calls.createWebviewPanel.length, 0);
});

test("Workflow: Run Workflow -- delegates to the real runWorkflowWithReport(), shows progress, opens a webview, runs all three real agents", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: pickByLabel("project-health-check"),
    activeTextEditor: { document: { fileName: "clean.js", getText: () => "export const a = 1;" } },
  });
  const handlers = createCommandHandlers(vscodeApi);

  const report = await handlers.runWorkflow();

  assert.equal(report.workflow, "project-health-check");
  assert.equal(report.success, true);
  assert.equal(report.steps.length, 3);
  assert.deepEqual(
    report.steps.map((s) => s.agentId),
    ["architecture-remediation", "security-remediation", "performance-optimization"]
  );
  assert.equal(calls.withProgress.length, 1);
  assert.equal(calls.createWebviewPanel.length, 1);
  assert.match(calls.createWebviewPanel[0].title, /project-health-check/);
});

test("Workflow: Run Workflow -- a real eval() finding (via json-file context) exercises the complete four-layer chain", async () => {
  const violationContent = JSON.stringify({
    sourceFiles: [
      { path: "generators/framework/executor.js", content: "import '../plugin/plugin-generator.js';\neval(x);" },
      { path: "generators/plugin/plugin-generator.js", content: "export const p = 1;" },
    ],
  });
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return items.find((i) => i.value === "json-file");
      return items.find((i) => i.label === "security-audit");
    },
    showOpenDialog: [{ fsPath: "/fake/context.json" }],
    fileContents: { "/fake/context.json": violationContent },
  });
  const handlers = createCommandHandlers(vscodeApi);

  const report = await handlers.runWorkflow();

  assert.equal(report.success, true);
  assert.deepEqual(
    report.steps.map((s) => s.agentId),
    ["security-remediation", "architecture-remediation", "performance-optimization"]
  );
  assert.ok(report.steps[0].agentReport.steps[0].result.findings.some((f) => f.id === "dangerous-eval-usage"));
  const generatorStep = report.steps[0].agentReport.steps.find((s) => s.type === "generator");
  assert.equal(generatorStep.result.mode, "dry-run");
});

test("Workflow: Run Workflow -- unknown workflow id surfaces the framework's own error via showErrorMessage, without duplicating validation", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
      return { label: "not-a-real-workflow" };
    },
    activeTextEditor: { document: { fileName: "x.js", getText: () => "x" } },
  });
  const handlers = createCommandHandlers(vscodeApi);

  const report = await handlers.runWorkflow();

  assert.equal(report.success, false);
  assert.match(report.errors[0].message, /Unknown workflow/);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /Unknown workflow/);
});

test("Workflow: Run Workflow -- user cancelling the workflow picker returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({ showQuickPick: undefined });
  const handlers = createCommandHandlers(vscodeApi);

  const result = await handlers.runWorkflow();

  assert.equal(result, null);
  assert.equal(calls.withProgress.length, 0);
  assert.equal(calls.createWebviewPanel.length, 0);
});

test("Workflow: Run Workflow -- user cancelling the context source returns null without calling the framework", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return undefined;
      return items[0];
    },
  });
  const handlers = createCommandHandlers(vscodeApi);

  const result = await handlers.runWorkflow();

  assert.equal(result, null);
  assert.equal(calls.withProgress.length, 0);
});
