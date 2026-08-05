/**
 * Command Handlers — Stage 5F. Implements the four contributed commands:
 * Agent: List Agents, Agent: Check Compatibility, Agent: Run Agent,
 * Agent: Show Last Report.
 *
 * Mirrors vscode-advisor-extension/src/commands.js (Stage 4L) exactly in
 * structure and discipline. Every handler delegates directly to
 * agents/index.js's own, already-tested functions (listAgentCatalog,
 * runAgentWithReport, checkCompatibility) -- the SAME functions the MCP
 * integration (Stage 5D) and CLI (Stage 5E) already call unmodified.
 * This file contains NO planning logic, NO decision logic, NO analysis
 * logic, NO generation logic, NO report construction -- only: collect
 * user input (via vscodeApi), assemble context (via context-loader.js),
 * call the framework, and hand the result to the Report Viewer
 * (report-viewer.js) for display.
 *
 * DEPENDENCY INJECTION: createCommandHandlers(vscodeApi, state) takes the
 * vscode API as a parameter rather than importing "vscode" directly --
 * the same testing strategy Stage 4L established, reused here without
 * modification to the pattern itself.
 *
 * PERFORMANCE: agent runs are wrapped in vscodeApi.window.withProgress,
 * matching Stage 4L's exact rationale (a UX affordance on top of
 * already-fast execution, not a workaround for slowness).
 */

import { listAgentCatalog, runAgentWithReport, checkCompatibility } from "../../agents/index.js";
import { collectContextFromSource } from "./context-loader.js";
import { buildAgentReportHtml, buildCatalogHtml, buildCompatibilityHtml } from "./report-viewer.js";

function showWebview(vscodeApi, title, html) {
  const panel = vscodeApi.window.createWebviewPanel("agentReport", title, vscodeApi.ViewColumn.One, {});
  panel.webview.html = html;
  return panel;
}

/**
 * @param {object} vscodeApi - the real "vscode" module, or a mock for tests
 * @param {{ lastReport: null | { kind: "catalog"|"compatibility"|"report", report: object } }} state
 *   UI-only cache state (the most recently shown report), so "Show Last
 *   Report" can redisplay it -- not duplicated Agent data, the
 *   framework's own report object cached for redisplay convenience.
 */
export function createCommandHandlers(vscodeApi, state) {
  async function listAgents() {
    const catalog = listAgentCatalog();
    state.lastReport = { kind: "catalog", report: catalog };
    showWebview(vscodeApi, "Registered Agents", buildCatalogHtml(catalog));
    return catalog;
  }

  async function checkAgentCompatibility() {
    const catalog = listAgentCatalog();
    const picked = await vscodeApi.window.showQuickPick(
      catalog.map((entry) => ({ label: entry.id, description: entry.name, detail: entry.description })),
      { placeHolder: "Select an agent to check compatibility for" }
    );
    if (!picked) return null;

    const result = checkCompatibility(picked.label);
    state.lastReport = { kind: "compatibility", report: result };
    showWebview(vscodeApi, `Compatibility: ${picked.label}`, buildCompatibilityHtml(result));

    if (result.error) {
      vscodeApi.window.showErrorMessage(`Compatibility check for "${picked.label}" failed: ${result.error}`);
    } else if (!result.compatible) {
      vscodeApi.window.showInformationMessage(
        `"${picked.label}" is missing dependencies: ${[...result.missingAdvisors, ...result.missingGenerators].join(", ")}`
      );
    }

    return result;
  }

  async function runAgent() {
    const catalog = listAgentCatalog();
    const picked = await vscodeApi.window.showQuickPick(
      catalog.map((entry) => ({ label: entry.id, description: entry.name, detail: entry.description })),
      { placeHolder: "Select an agent to run" }
    );
    if (!picked) return null;

    const context = await collectContextFromSource(vscodeApi);
    if (context === null) return null;

    const report = await vscodeApi.window.withProgress(
      { location: vscodeApi.ProgressLocation.Notification, title: `Running agent "${picked.label}"...` },
      () => runAgentWithReport(picked.label, context)
    );

    state.lastReport = { kind: "report", report };
    showWebview(vscodeApi, `Agent Report: ${report.agent}`, buildAgentReportHtml(report));

    if (!report.success) {
      const message = report.errors?.[0]?.message ?? "unknown error";
      vscodeApi.window.showErrorMessage(`Agent "${picked.label}" failed: ${message}`);
    }

    return report;
  }

  async function showLastReport() {
    if (!state.lastReport) {
      vscodeApi.window.showInformationMessage("No agent report has been run yet in this session.");
      return null;
    }

    const { kind, report } = state.lastReport;
    if (kind === "report") {
      showWebview(vscodeApi, `Agent Report: ${report.agent}`, buildAgentReportHtml(report));
    } else if (kind === "compatibility") {
      showWebview(vscodeApi, `Compatibility: ${report.agent}`, buildCompatibilityHtml(report));
    } else {
      showWebview(vscodeApi, "Registered Agents", buildCatalogHtml(report));
    }
    return state.lastReport;
  }

  return { listAgents, checkAgentCompatibility, runAgent, showLastReport };
}
