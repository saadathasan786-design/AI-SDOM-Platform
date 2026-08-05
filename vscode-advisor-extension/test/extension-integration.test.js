import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCommandHandlers } from "../src/commands.js";
import { createMockVscode } from "./mock-vscode.js";
import { listAdvisorCatalog } from "../../advisors/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function pickByLabelHelper(label) {
  return (items) => {
    if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
    return items.find((i) => i.label === label);
  };
}

test("manifest: package.json declares all four required commands as contribution points", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8");
  const manifest = JSON.parse(raw);

  const commandIds = manifest.contributes.commands.map((c) => c.command);
  assert.deepEqual(commandIds, [
    "advisor.listAdvisors",
    "advisor.runAdvisor",
    "advisor.runManyAdvisors",
    "advisor.showLastReport",
  ]);

  const titles = manifest.contributes.commands.map((c) => c.title);
  assert.ok(titles.includes("Advisor: List Advisors"));
  assert.ok(titles.includes("Advisor: Run Advisor"));
  assert.ok(titles.includes("Advisor: Run Multiple Advisors"));
  assert.ok(titles.includes("Advisor: Show Last Report"));
});

test("manifest: declares a main entry point and required vscode engine", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8");
  const manifest = JSON.parse(raw);
  assert.equal(manifest.main, "./extension.js");
  assert.ok(manifest.engines.vscode);
});

test("extension.js exists and references the four commands for registration", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "extension.js"), "utf8");
  assert.match(raw, /advisor\.listAdvisors/);
  assert.match(raw, /advisor\.runAdvisor/);
  assert.match(raw, /advisor\.runManyAdvisors/);
  assert.match(raw, /advisor\.showLastReport/);
  assert.match(raw, /activate/);
  assert.match(raw, /deactivate/);
});

test("command invocation: full workflow -- list, then run, then show-last-report reflects the run, not the list", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.label === "code-review") ?? items[0],
    activeTextEditor: {
      document: { fileName: "app.js", getText: () => "export function get_user() {}\nexport function fetchUser() {}" },
    },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  await handlers.listAdvisors();
  assert.equal(state.lastReport.kind, "catalog");

  const runReport = await handlers.runAdvisor();
  assert.equal(state.lastReport.kind, "single");
  assert.equal(runReport.advisor, "code-review");

  const shown = await handlers.showLastReport();
  assert.equal(shown.kind, "single");
  assert.equal(shown.report.advisor, "code-review");

  assert.equal(calls.createWebviewPanel.length, 3);
  assert.equal(calls.createWebviewPanel[0].title, "Registered Advisors");
  assert.match(calls.createWebviewPanel[1].title, /code-review/);
  assert.match(calls.createWebviewPanel[2].title, /code-review/);
});

test("command invocation: discovery -- Advisor: List Advisors always reflects the exact live registry, never a stale copy", async () => {
  const { vscodeApi } = createMockVscode({});
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const firstCall = await handlers.listAdvisors();
  const secondCall = await handlers.listAdvisors();

  assert.deepEqual(firstCall, secondCall);
  assert.deepEqual(firstCall, listAdvisorCatalog());
});

test("command invocation: run-many followed by show-last-report shows the unified report, not a single-advisor one", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items, options) =>
      options?.canPickMany ? items.filter((i) => ["architecture", "performance"].includes(i.label)) : items[0],
    activeTextEditor: { document: { fileName: "x.js", getText: () => "for (const a of x) { for (const b of y) { z(); } }" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  await handlers.runManyAdvisors();
  const shown = await handlers.showLastReport();

  assert.equal(shown.kind, "unified");
  assert.deepEqual(shown.report.advisorsRun.sort(), ["architecture", "performance"]);
});

test("framework delegation: the extension never computes findings itself -- report.findings come only from the real advisor", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: pickByLabelHelper("security"),
    activeTextEditor: { document: { fileName: "x.js", getText: () => "eval(x); const apiKey = 'sk_live_abcdef1234567890';" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const report = await handlers.runAdvisor();

  const knownSecurityFindingIds = [
    "dangerous-eval-usage",
    "hardcoded-credential",
    "security-scan-summary",
    "function-constructor-usage",
    "child-process-usage",
  ];
  for (const finding of report.findings) {
    assert.ok(knownSecurityFindingIds.includes(finding.id), `unexpected finding id: ${finding.id}`);
  }
});
