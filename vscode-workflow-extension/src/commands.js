/**
 * Command Handlers — Workflow VS Code Extension. Implements exactly the
 * three specified commands: Workflow: List Workflows, Workflow: Run
 * Workflow, Workflow: Check Compatibility.
 *
 * Mirrors vscode-agent-extension/src/commands.js's discipline exactly.
 * Every handler delegates directly to workflows/index.js's own,
 * already-tested functions (listWorkflowCatalog, runWorkflowWithReport,
 * checkCompatibility) -- the SAME functions the MCP integration and CLI
 * already call unmodified. This file contains NO planning logic, NO
 * orchestration logic, NO analysis logic, NO generation logic, NO report
 * construction -- only: collect user input (via vscodeApi), assemble
 * context (via context-loader.js), call the framework, and hand the
 * result to the Report Viewer (report-viewer.js) for display.
 *
 * DEPENDENCY INJECTION: createCommandHandlers(vscodeApi) takes the
 * vscode API as a parameter rather than importing "vscode" directly --
 * the same testing strategy Stage 4L/5F established, reused here without
 * modification to the pattern itself. Unlike the Agent extension, no
 * "show last report" state is kept here, since only three commands are
 * specified for this extension.
 *
 * PERFORMANCE: workflow runs are wrapped in vscodeApi.window.withProgress
 * (VS Code's standard non-blocking progress-notification API), matching
 * Stage 4L/5F's exact rationale -- a UX affordance on top of already-fast
 * execution, not a workaround for slowness.
 */

import { listWorkflowCatalog, runWorkflowWithReport, checkCompatibility } from "../../workflows/index.js";
import { collectContextFromSource } from "./context-loader.js";
import { buildCatalogHtml, buildWorkflowReportHtml, buildCompatibilityHtml } from "./report-viewer.js";

function showWebview(vscodeApi, title, html) {
  const panel = vscodeApi.window.createWebviewPanel("workflowReport", title, vscodeApi.ViewColumn.One, {});
  panel.webview.html = html;
  return panel;
}

/** @param {object} vscodeApi - the real "vscode" module, or a mock for tests */
export function createCommandHandlers(vscodeApi) {
  async function listWorkflows() {
    const catalog = listWorkflowCatalog();
    showWebview(vscodeApi, "Registered Workflows", buildCatalogHtml(catalog));
    return catalog;
  }

  async function checkWorkflowCompatibility() {
    const catalog = listWorkflowCatalog();
    const picked = await vscodeApi.window.showQuickPick(
      catalog.map((entry) => ({ label: entry.id, description: entry.name, detail: entry.description })),
      { placeHolder: "Select a workflow to check compatibility for" }
    );
    if (!picked) return null;

    const result = checkCompatibility(picked.label);
    showWebview(vscodeApi, `Compatibility: ${picked.label}`, buildCompatibilityHtml(result));

    if (result.error) {
      vscodeApi.window.showErrorMessage(`Compatibility check for "${picked.label}" failed: ${result.error}`);
    } else if (!result.compatible) {
      vscodeApi.window.showInformationMessage(`"${picked.label}" is missing agents: ${result.missingAgents.join(", ")}`);
    }

    return result;
  }

  async function runWorkflow() {
    const catalog = listWorkflowCatalog();
    const picked = await vscodeApi.window.showQuickPick(
      catalog.map((entry) => ({ label: entry.id, description: entry.name, detail: entry.description })),
      { placeHolder: "Select a workflow to run" }
    );
    if (!picked) return null;

    const context = await collectContextFromSource(vscodeApi);
    if (context === null) return null;

    const report = await vscodeApi.window.withProgress(
      { location: vscodeApi.ProgressLocation.Notification, title: `Running workflow "${picked.label}"...` },
      () => runWorkflowWithReport(picked.label, context)
    );

    showWebview(vscodeApi, `Workflow Report: ${report.workflow}`, buildWorkflowReportHtml(report));

    if (!report.success) {
      const message = report.errors?.[0]?.message ?? "unknown error";
      vscodeApi.window.showErrorMessage(`Workflow "${picked.label}" failed: ${message}`);
    }

    return report;
  }

  return { listWorkflows, runWorkflow, checkWorkflowCompatibility };
}
