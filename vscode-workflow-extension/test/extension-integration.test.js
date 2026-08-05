import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCommandHandlers } from "../src/commands.js";
import { createMockVscode } from "./mock-vscode.js";
import { listWorkflowCatalog } from "../../workflows/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("manifest: package.json declares exactly the three required commands as contribution points", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8");
  const manifest = JSON.parse(raw);

  const commandIds = manifest.contributes.commands.map((c) => c.command);
  assert.deepEqual(commandIds, ["workflow.listWorkflows", "workflow.runWorkflow", "workflow.checkCompatibility"]);

  const titles = manifest.contributes.commands.map((c) => c.title);
  assert.ok(titles.includes("Workflow: List Workflows"));
  assert.ok(titles.includes("Workflow: Run Workflow"));
  assert.ok(titles.includes("Workflow: Check Compatibility"));
});

test("manifest: declares a main entry point and required vscode engine", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8");
  const manifest = JSON.parse(raw);
  assert.equal(manifest.main, "./extension.js");
  assert.ok(manifest.engines.vscode);
});

test("framework delegation: extension.js contains only wiring -- no analysis, planning, orchestration, or decision-shaped logic", async () => {
  const raw = await fs.readFile(path.join(__dirname, "..", "extension.js"), "utf8");

  assert.match(raw, /workflow\.listWorkflows/);
  assert.match(raw, /workflow\.runWorkflow/);
  assert.match(raw, /workflow\.checkCompatibility/);
  assert.match(raw, /activate/);
  assert.match(raw, /deactivate/);

  assert.ok(!raw.includes("findings"));
  assert.ok(!raw.includes("severity"));
  assert.ok(!raw.includes("decide"));
  assert.ok(!raw.includes("plan("));
  assert.ok(!raw.includes(".steps"));

  const nonCommentLines = raw
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("*") && !line.trim().startsWith("/"));
  assert.ok(nonCommentLines.length < 20, `extension.js should stay small (wiring only), found ${nonCommentLines.length} code lines`);
});

test("command invocation: full workflow -- list, then check, then run, using the real Workflow Framework", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
      return items.find((i) => i.label === "project-health-check");
    },
    activeTextEditor: { document: { fileName: "clean.js", getText: () => "export const a = 1;" } },
  });
  const handlers = createCommandHandlers(vscodeApi);

  const listResult = await handlers.listWorkflows();
  assert.ok(listResult.some((w) => w.id === "project-health-check"));

  const compatResult = await handlers.checkWorkflowCompatibility();
  assert.equal(compatResult.compatible, true);

  const runResult = await handlers.runWorkflow();
  assert.equal(runResult.workflow, "project-health-check");

  assert.equal(calls.createWebviewPanel.length, 3);
});

test("command invocation: discovery -- Workflow: List Workflows always reflects the exact live registry, never a stale copy", async () => {
  const { vscodeApi } = createMockVscode({});
  const handlers = createCommandHandlers(vscodeApi);

  const firstCall = await handlers.listWorkflows();
  const secondCall = await handlers.listWorkflows();

  assert.deepEqual(firstCall, secondCall);
  assert.deepEqual(firstCall, listWorkflowCatalog());
});

test("framework delegation: the extension never computes findings or decisions itself -- report content comes only from the real Workflow Framework, three layers deep", async () => {
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

  const knownAdvisorFindingIds = [
    "dangerous-eval-usage",
    "security-scan-summary",
    "possible-dead-file",
    "low-documentation-coverage",
    "code-size-summary",
    "layer-violation",
    "maximum-dependency-depth",
    "unused-framework-module",
    "module-organization-summary",
    "performance-scan-summary",
  ];
  const validDecisionActions = new Set(["continue", "stop", "fail"]);

  for (const step of report.steps) {
    assert.ok(validDecisionActions.has(step.decision.action));
    for (const agentStep of step.agentReport.steps ?? []) {
      if (agentStep.type === "advisors") {
        for (const finding of agentStep.result.findings) {
          assert.ok(knownAdvisorFindingIds.includes(finding.id), `unexpected finding id: ${finding.id}`);
        }
      }
    }
  }
});

test("framework delegation: the embedded Generation Report in a nested generator step is the real, unmodified dry-run report", async () => {
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
  const secAgentStep = report.steps[0];
  const generatorStep = secAgentStep.agentReport.steps.find((s) => s.type === "generator");

  assert.ok(generatorStep);
  assert.equal(generatorStep.result.generator, "plugin");
  assert.equal(generatorStep.result.mode, "dry-run");
  assert.deepEqual(
    Object.keys(generatorStep.result).sort(),
    ["generator", "mode", "success", "warnings", "rollback", "files", "no_op", "execution_ms", "timestamp", "error"].sort()
  );
});

test("framework delegation: the embedded Agent Report at the top of each workflow step is the real, unmodified Agent Report", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => {
      if (items.some((i) => i.value)) return items.find((i) => i.value === "current");
      return items.find((i) => i.label === "project-health-check");
    },
    activeTextEditor: { document: { fileName: "clean.js", getText: () => "export const a = 1;" } },
  });
  const handlers = createCommandHandlers(vscodeApi);

  const report = await handlers.runWorkflow();

  const expectedAgentReportKeys = [
    "agent",
    "success",
    "plan",
    "steps",
    "halted",
    "summary",
    "recommendations",
    "errors",
    "execution_ms",
    "timestamp",
  ].sort();

  for (const step of report.steps) {
    assert.deepEqual(Object.keys(step.agentReport).sort(), expectedAgentReportKeys);
  }
});
