/**
 * Command Handlers — Stage 4L. Implements the four contributed commands:
 * Advisor: List Advisors, Run Advisor, Run Multiple Advisors, Show Last
 * Report.
 *
 * Every handler delegates directly to advisors/index.js's own,
 * already-tested functions (listAdvisorCatalog, runAdvisorWithReport,
 * runAdvisors) -- the SAME functions the MCP integration (Stage 4J) and
 * CLI (Stage 4K) already call unmodified. This file contains NO analysis
 * logic, NO severity calculation, NO finding creation, NO report
 * generation -- only: collect user input (via vscodeApi), assemble
 * context (via context-loader.js), call the framework, and hand the
 * result to the Report Viewer (report-viewer.js) for display.
 *
 * DEPENDENCY INJECTION: createCommandHandlers(vscodeApi, state) takes the
 * vscode API as a parameter rather than importing "vscode" directly. This
 * is what makes this file testable without a real VS Code process --
 * tests supply a mock vscodeApi and call these handlers directly, while
 * the Advisor Framework calls inside remain 100% real and unmodified.
 * extension.js (the real entry point) is the only place that imports the
 * real "vscode" module and passes it in.
 *
 * PERFORMANCE: each advisor run is wrapped in vscodeApi.window.withProgress
 * (VS Code's standard non-blocking progress-notification API) so the UI
 * stays responsive and gives feedback during execution, rather than
 * appearing frozen. The underlying advisor calls are already fast,
 * regex-based static analysis (no long synchronous CPU loops), so this is
 * a UX affordance on top of already-quick execution, not a workaround for
 * a slow framework.
 */

import { listAdvisorCatalog, runAdvisorWithReport, runAdvisors } from "../../advisors/index.js";
import { collectContextFromSource } from "./context-loader.js";
import { buildCatalogHtml, buildSingleReportHtml, buildUnifiedReportHtml } from "./report-viewer.js";

function showWebview(vscodeApi, title, html) {
  const panel = vscodeApi.window.createWebviewPanel("advisorReport", title, vscodeApi.ViewColumn.One, {});
  panel.webview.html = html;
  return panel;
}

/**
 * @param {object} vscodeApi - the real "vscode" module, or a mock for tests
 * @param {{ lastReport: null | { kind: "single"|"unified"|"catalog", report: object } }} state
 *   a plain object holding UI-only cache state (the most recently shown
 *   report), so "Show Last Report" can redisplay it. This is NOT
 *   duplicated Advisor data -- it's the framework's own report object,
 *   cached for redisplay convenience, same as any "show me that again" UI.
 */
export function createCommandHandlers(vscodeApi, state) {
  async function listAdvisors() {
    const catalog = listAdvisorCatalog();
    state.lastReport = { kind: "catalog", report: catalog };
    showWebview(vscodeApi, "Registered Advisors", buildCatalogHtml(catalog));
    return catalog;
  }

  async function runAdvisor() {
    const catalog = listAdvisorCatalog();
    const picked = await vscodeApi.window.showQuickPick(
      catalog.map((entry) => ({ label: entry.id, description: entry.name, detail: entry.description })),
      { placeHolder: "Select an advisor to run" }
    );
    if (!picked) return null;

    const context = await collectContextFromSource(vscodeApi);
    if (context === null) return null;

    const report = await vscodeApi.window.withProgress(
      { location: vscodeApi.ProgressLocation.Notification, title: `Running advisor "${picked.label}"...` },
      () => runAdvisorWithReport(picked.label, context)
    );

    state.lastReport = { kind: "single", report };
    showWebview(vscodeApi, `Advisor Report: ${report.advisor}`, buildSingleReportHtml(report));

    if (!report.success) {
      vscodeApi.window.showErrorMessage(`Advisor "${picked.label}" failed: ${report.error}`);
    }

    return report;
  }

  async function runManyAdvisors() {
    const catalog = listAdvisorCatalog();
    const picked = await vscodeApi.window.showQuickPick(
      catalog.map((entry) => ({ label: entry.id, description: entry.name, detail: entry.description })),
      { placeHolder: "Select advisors to run", canPickMany: true }
    );
    if (!picked || picked.length === 0) return null;

    const context = await collectContextFromSource(vscodeApi);
    if (context === null) return null;

    const ids = picked.map((item) => item.label);
    const report = await vscodeApi.window.withProgress(
      { location: vscodeApi.ProgressLocation.Notification, title: `Running ${ids.length} advisor(s)...` },
      () => runAdvisors(ids, context)
    );

    state.lastReport = { kind: "unified", report };
    showWebview(vscodeApi, "Unified Advisor Report", buildUnifiedReportHtml(report));

    if (!report.success) {
      vscodeApi.window.showErrorMessage(`Some advisors failed: ${report.advisorsFailed.join(", ")}`);
    }

    return report;
  }

  async function showLastReport() {
    if (!state.lastReport) {
      vscodeApi.window.showInformationMessage("No advisor report has been run yet in this session.");
      return null;
    }

    const { kind, report } = state.lastReport;
    if (kind === "single") {
      showWebview(vscodeApi, `Advisor Report: ${report.advisor}`, buildSingleReportHtml(report));
    } else if (kind === "unified") {
      showWebview(vscodeApi, "Unified Advisor Report", buildUnifiedReportHtml(report));
    } else {
      showWebview(vscodeApi, "Registered Advisors", buildCatalogHtml(report));
    }
    return state.lastReport;
  }

  return { listAdvisors, runAdvisor, runManyAdvisors, showLastReport };
}
