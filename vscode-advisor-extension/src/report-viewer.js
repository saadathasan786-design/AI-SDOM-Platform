/**
 * Report Viewer — Stage 4L. Pure presentation of already-computed
 * Advisor Reports / Unified Advisor Reports / the Advisor Catalog.
 *
 * Every function here takes data the Advisor Framework already computed
 * and returns an HTML string. NOTHING here recomputes severity, creates
 * findings, or re-derives anything the framework didn't already produce.
 * Filtering by severity and grouping by advisor happen client-side, in
 * the embedded <script>, over the SAME findings array already present in
 * the page -- this is presentation-layer interactivity (show/hide DOM
 * nodes), not analysis.
 *
 * Deliberately framework-free: this module imports nothing from vscode
 * or advisors/, so it's testable with zero mocking at all.
 */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const BASE_STYLE = `
  body { font-family: var(--vscode-font-family, sans-serif); padding: 12px; }
  .finding { border-left: 4px solid #888; margin: 8px 0; padding: 6px 10px; background: rgba(127,127,127,0.08); }
  .finding.critical { border-color: #e51400; }
  .finding.warning { border-color: #e5a000; }
  .finding.suggestion { border-color: #3794ff; }
  .finding.info { border-color: #888; }
  .severity-tag { font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
  .advisor-group { margin-bottom: 18px; }
  .advisor-group h3 { margin-bottom: 4px; }
  details { margin-top: 4px; }
  summary { cursor: pointer; }
  .filter-bar { margin-bottom: 12px; }
  .filter-bar label { margin-right: 10px; }
  pre.evidence { background: rgba(127,127,127,0.1); padding: 6px; overflow-x: auto; }
`;

const FILTER_SCRIPT = `
  function applySeverityFilter() {
    const checked = Array.from(document.querySelectorAll('.severity-filter:checked')).map(el => el.value);
    document.querySelectorAll('.finding').forEach(el => {
      el.style.display = checked.includes(el.dataset.severity) ? '' : 'none';
    });
  }
  document.querySelectorAll('.severity-filter').forEach(el => el.addEventListener('change', applySeverityFilter));
`;

function renderFilterBar() {
  const levels = ["info", "suggestion", "warning", "critical"];
  const boxes = levels
    .map((level) => `<label><input type="checkbox" class="severity-filter" value="${level}" checked> ${level}</label>`)
    .join("");
  return `<div class="filter-bar">${boxes}</div>`;
}

function renderFinding(finding) {
  const location = finding.location
    ? ` <em>(${escapeHtml(finding.location.file)}${finding.location.line ? ":" + finding.location.line : ""})</em>`
    : "";
  const recommendation = finding.recommendation?.message
    ? `<div><strong>Recommendation:</strong> ${escapeHtml(finding.recommendation.message)}</div>`
    : "";
  const evidence = finding.evidence
    ? `<details><summary>Evidence</summary><pre class="evidence">${escapeHtml(JSON.stringify(finding.evidence, null, 2))}</pre></details>`
    : "";
  return `
    <div class="finding ${escapeHtml(finding.severity)}" data-severity="${escapeHtml(finding.severity)}">
      <span class="severity-tag">${escapeHtml(finding.severity)}</span> <strong>${escapeHtml(finding.id)}</strong>${location}
      <div>${escapeHtml(finding.message)}</div>
      ${recommendation}
      ${evidence}
    </div>`;
}

function renderSummaryLine(summary) {
  return `info=${summary.info} suggestion=${summary.suggestion} warning=${summary.warning} critical=${summary.critical}`;
}

/** Builds the HTML for a single Advisor Report (from runAdvisorWithReport()). */
export function buildSingleReportHtml(report) {
  const status = report.success ? "SUCCESS" : "FAILED";
  const errorBlock = report.success ? "" : `<p><strong>Error:</strong> ${escapeHtml(report.error)}</p>`;
  const findingsHtml = report.findings.map(renderFinding).join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Advisor: ${escapeHtml(report.advisor)}</h2>
  <p><strong>Status:</strong> ${status} &nbsp; <strong>Execution time:</strong> ${report.execution_ms}ms</p>
  <p><strong>Summary:</strong> ${renderSummaryLine(report.summary)}</p>
  ${errorBlock}
  ${renderFilterBar()}
  <div id="findings">${findingsHtml}</div>
  <script>${FILTER_SCRIPT}</script>
</body>
</html>`;
}

/** Builds the HTML for a Unified Advisor Report (from runAdvisors()), grouped by advisor. */
export function buildUnifiedReportHtml(report) {
  const status = report.success ? "SUCCESS" : "FAILED";
  const failedLine =
    report.advisorsFailed.length > 0 ? `<p><strong>Failed:</strong> ${escapeHtml(report.advisorsFailed.join(", "))}</p>` : "";

  const groups = report.advisorReports
    .map((advisorReport) => {
      const advisorStatus = advisorReport.success ? "SUCCESS" : `FAILED (${escapeHtml(advisorReport.error)})`;
      const findingsHtml = advisorReport.findings.map(renderFinding).join("\n");
      return `
        <div class="advisor-group">
          <h3>${escapeHtml(advisorReport.advisor)} - ${advisorStatus} (${advisorReport.execution_ms}ms)</h3>
          ${findingsHtml || "<p><em>No findings.</em></p>"}
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Unified Advisor Report</h2>
  <p><strong>Status:</strong> ${status} &nbsp; <strong>Advisors run:</strong> ${escapeHtml(report.advisorsRun.join(", ") || "(none)")} &nbsp; <strong>Total time:</strong> ${report.execution_ms}ms</p>
  <p><strong>Combined summary:</strong> ${renderSummaryLine(report.summary)}</p>
  ${failedLine}
  ${renderFilterBar()}
  <div id="findings">${groups}</div>
  <script>${FILTER_SCRIPT}</script>
</body>
</html>`;
}

/** Builds the HTML for the real Advisor Catalog (from listAdvisorCatalog()). */
export function buildCatalogHtml(catalog) {
  const rows = catalog
    .map(
      (entry) => `
      <div class="advisor-group">
        <h3>${escapeHtml(entry.id)} - ${escapeHtml(entry.name)} <em>[${escapeHtml(entry.category)}]</em></h3>
        <p>${escapeHtml(entry.description)}</p>
        <p><strong>Input requirements:</strong> ${escapeHtml(entry.inputRequirements.join(", ") || "(none)")}</p>
        <p><strong>Supported severities:</strong> ${escapeHtml(entry.supportedSeverities.join(", "))}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Registered Advisors (${catalog.length})</h2>
  ${rows}
</body>
</html>`;
}
