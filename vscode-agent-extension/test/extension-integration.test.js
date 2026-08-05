import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCommandHandlers } from "../src/commands.js";
import { createMockVscode } from "./mock-vscode.js";
import { listAgentCatalog } from "../../agents/index.js";

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
    "agent.listAgents",
    "agent.checkCompatibility",
    "agent.runAgent",
    "agent.showLastReport",
  ]);

  const titles = manifest.contributes.commands.map((c) => c.title);
  assert.ok(titles.includes("Agent: List Agents"));
  assert.ok(titles.includes("Agent: Check Compatibility"));
  assert.ok(titles.includes("Agent: Run Agent"));
  assert.ok(titles.includes("Agent: Show Last Report"));
});

test("manifest: declares a main entry point and required vscode engine", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8");
  const manifest = JSON.parse(raw);
  assert.equal(manifest.main, "./extension.js");
  assert.ok(manifest.engines.vscode);
});

test("extension.js exists, is wiring only, and references the four commands for registration", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "extension.js"), "utf8");
  assert.match(raw, /agent\.listAgents/);
  assert.match(raw, /agent\.checkCompatibility/);
  assert.match(raw, /agent\.runAgent/);
  assert.match(raw, /agent\.showLastReport/);
  assert.match(raw, /activate/);
  assert.match(raw, /deactivate/);
  assert.ok(!raw.includes("findings.push"));
  assert.ok(!raw.includes("severity"));
});

test("command invocation: full workflow -- list, then check, then run, then show-last-report reflects the run, not the list", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: pickByLabelHelper("architecture-remediation"),
    activeTextEditor: { document: { fileName: "clean.js", getText: () => "export const a = 1;" } },
  });
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  await handlers.listAgents();
  assert.equal(state.lastReport.kind, "catalog");

  await handlers.checkAgentCompatibility();
  assert.equal(state.lastReport.kind, "compatibility");

  const runReport = await handlers.runAgent();
  assert.equal(state.lastReport.kind, "report");
  assert.equal(runReport.agent, "architecture-remediation");

  const shown = await handlers.showLastReport();
  assert.equal(shown.kind, "report");
  assert.equal(shown.report.agent, "architecture-remediation");

  assert.equal(calls.createWebviewPanel.length, 4);
});

test("command invocation: discovery -- Agent: List Agents always reflects the exact live registry, never a stale copy", async () => {
  const { vscodeApi } = createMockVscode({});
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscodeApi, state);

  const firstCall = await handlers.listAgents();
  const secondCall = await handlers.listAgents();

  assert.deepEqual(firstCall, secondCall);
  assert.deepEqual(firstCall, listAgentCatalog());
});

test("framework delegation: the extension never computes findings or decisions itself -- report content comes only from the real Agent Framework", async () => {
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

  const knownArchitectureFindingIds = [
    "circular-dependency",
    "maximum-dependency-depth",
    "layer-violation",
    "cross-subsystem-coupling-observed",
    "registry-without-catalog",
    "unused-framework-module",
    "technical-debt-markers",
    "module-organization-summary",
    "empty-public-entry-point",
    "runnable-script-entry-point",
    "public-entry-point-summary",
  ];
  const validDecisionActions = new Set(["continue", "skip", "stop", "fail"]);

  for (const step of report.steps) {
    assert.ok(validDecisionActions.has(step.decision.action));
    if (step.type === "advisors") {
      for (const finding of step.result.findings) {
        assert.ok(knownArchitectureFindingIds.includes(finding.id), `unexpected finding id: ${finding.id}`);
      }
    }
  }
});

test("framework delegation: the embedded Generation Report in a generator step is the real, unmodified dry-run report", async () => {
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
  const handlers = createCommandHandlers(vscodeApi, { lastReport: null });

  const report = await handlers.runAgent();
  const generatorStep = report.steps.find((s) => s.type === "generator");

  assert.ok(generatorStep);
  assert.equal(generatorStep.result.generator, "theme");
  assert.equal(generatorStep.result.mode, "dry-run");
  assert.deepEqual(
    Object.keys(generatorStep.result).sort(),
    ["generator", "mode", "success", "warnings", "rollback", "files", "no_op", "execution_ms", "timestamp", "error"].sort()
  );
});
