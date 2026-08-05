/**
 * Report Viewer — Stage 5F. Pure presentation of already-computed Agent
 * Reports and the Agent Catalog, mirroring
 * vscode-advisor-extension/src/report-viewer.js's exact discipline
 * (Stage 4L), adapted for Agents.
 *
 * Every function here takes data the Agent Framework already computed
 * (which itself embeds the REAL, unmodified Advisor/Generator reports)
 * and returns an HTML string. NOTHING here recomputes a decision,
 * recomputes a finding, or re-derives anything the framework didn't
 * already produce. Severity filtering happens client-side, in the
 * embedded <script>, over findings ALREADY present in embedded Advisor
 * report steps -- presentation-layer interactivity, not analysis.
 *
 * Deliberately framework-free: imports nothing from vscode or agents/,
 * so it's testable with zero mocking at all -- same as the Advisor
 * extension's report-viewer.js.
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
  .step { border: 1px solid rgba(127,127,127,0.3); border-radius: 4px; margin: 10px 0; padding: 10px; }
  .finding { border-left: 4px solid #888; margin: 6px 0; padding: 4px 8px; background: rgba(127,127,127,0.08); }
  .finding.critical { border-color: #e51400; }
  .finding.warning { border-color: #e5a000; }
  .finding.suggestion { border-color: #3794ff; }
  .finding.info { border-color: #888; }
  .severity-tag { font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
  .decision { margin-top: 8px; padding: 6px; border-radius: 3px; background: rgba(127,127,127,0.1); }
  .decision.continue, .decision.stop { border-left: 3px solid #3794ff; }
  .decision.fail { border-left: 3px solid #e51400; }
  .error-block { border-left: 4px solid #e51400; padding: 6px 10px; margin: 6px 0; background: rgba(229,20,0,0.08); }
  .filter-bar { margin-bottom: 12px; }
  .filter-bar label { margin-right: 10px; }
  details { margin-top: 4px; }
  summary { cursor: pointer; }
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

function renderDecision(decision) {
  if (!decision) return "";
  const action = escapeHtml(decision.action ?? "");
  const reason = decision.reason ? `: ${escapeHtml(decision.reason)}` : "";
  return `<div class="decision ${action}"><strong>Decision:</strong> ${action}${reason}</div>`;
}

function renderAdvisorsStep(step) {
  const result = step.result ?? {};
  const status = result.success ? "SUCCESS" : "FAILED";
  const findings = result.findings ?? [];
  const advisorIds = step.ids ?? (step.id ? [step.id] : []);

  return `
    <div class="step">
      <h3>Step: Advisor${advisorIds.length > 1 ? "s" : ""} (${escapeHtml(advisorIds.join(", "))})</h3>
      <p><strong>Status:</strong> ${status}${result.execution_ms !== undefined ? ` &nbsp; <strong>Time:</strong> ${result.execution_ms}ms` : ""}</p>
      ${findings.map(renderFinding).join("\n")}
      ${renderDecision(step.decision)}
    </div>`;
}

function renderGeneratorStep(step) {
  const result = step.result ?? {};
  const status = result.success ? "SUCCESS" : "FAILED";
  const errorLine = !result.success && result.error ? `<p><strong>Error:</strong> ${escapeHtml(result.error)}</p>` : "";

  return `
    <div class="step">
      <h3>Step: Generator "${escapeHtml(step.generatorId ?? "")}" (mode: ${escapeHtml(result.mode ?? step.options?.mode ?? "write")})</h3>
      <p><strong>Status:</strong> ${status}${result.execution_ms !== undefined ? ` &nbsp; <strong>Time:</strong> ${result.execution_ms}ms` : ""}</p>
      ${errorLine}
      ${renderDecision(step.decision)}
    </div>`;
}

function renderStep(step) {
  if (step.type === "advisors" || step.type === "advisor") return renderAdvisorsStep(step);
  if (step.type === "generator") return renderGeneratorStep(step);
  return `<div class="step"><h3>Step: ${escapeHtml(step.type ?? "unknown")}</h3>${renderDecision(step.decision)}</div>`;
}

function renderErrors(errors) {
  if (!errors || errors.length === 0) return "";
  const blocks = errors
    .map(
      (e) =>
        `<div class="error-block"><strong>[${escapeHtml(e.phase ?? "unknown")}]</strong> ${escapeHtml(e.message)}${
          e.stepIndex !== undefined && e.stepIndex !== null ? ` (step ${e.stepIndex})` : ""
        }</div>`
    )
    .join("\n");
  return `<h3>Errors</h3>${blocks}`;
}

function renderRecommendations(recommendations) {
  if (!recommendations || recommendations.length === 0) return "";
  const items = recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("\n");
  return `<h3>Recommendations</h3><ul>${items}</ul>`;
}

/** Builds the HTML for a full Agent Report (from runAgentWithReport()). */
export function buildAgentReportHtml(report) {
  const status = report.success ? "SUCCESS" : "FAILED";
  const stepsHtml = (report.steps ?? []).map(renderStep).join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Agent: ${escapeHtml(report.agent)}</h2>
  <p><strong>Status:</strong> ${status} &nbsp; <strong>Execution time:</strong> ${report.execution_ms}ms</p>
  <p><strong>Summary:</strong> advisorsRun=[${escapeHtml((report.summary?.advisorsRun ?? []).join(", "))}] generatorsRun=[${escapeHtml((report.summary?.generatorsRun ?? []).join(", "))}] stepsSkipped=${report.summary?.stepsSkipped ?? 0} stepsFailed=${report.summary?.stepsFailed ?? 0}</p>
  ${renderErrors(report.errors)}
  ${renderFilterBar()}
  <div id="steps">${stepsHtml}</div>
  ${renderRecommendations(report.recommendations)}
  <script>${FILTER_SCRIPT}</script>
</body>
</html>`;
}

/** Builds the HTML for the real Agent Catalog (from listAgentCatalog()). */
export function buildCatalogHtml(catalog) {
  const rows = catalog
    .map(
      (entry) => `
      <div class="step">
        <h3>${escapeHtml(entry.id)} - ${escapeHtml(entry.name)} <em>[${escapeHtml(entry.category)}]</em></h3>
        <p>${escapeHtml(entry.description)}</p>
        <p><strong>Input requirements:</strong> ${escapeHtml(entry.inputRequirements.join(", ") || "(none)")}</p>
        <p><strong>Capabilities:</strong> ${escapeHtml(entry.capabilities.join(", ") || "(none)")}</p>
        <p><strong>Requires advisors:</strong> ${escapeHtml(entry.requiresAdvisors.join(", ") || "(none)")}</p>
        <p><strong>Requires generators:</strong> ${escapeHtml(entry.requiresGenerators.join(", ") || "(none)")}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Registered Agents (${catalog.length})</h2>
  ${rows}
</body>
</html>`;
}

/** Builds the HTML for a compatibility check result (from checkCompatibility()). */
export function buildCompatibilityHtml(result) {
  const statusLine = result.error
    ? `<p><strong>Error:</strong> ${escapeHtml(result.error)}</p>`
    : `<p><strong>Missing advisors:</strong> ${escapeHtml(result.missingAdvisors.join(", ") || "(none)")}</p>
       <p><strong>Missing generators:</strong> ${escapeHtml(result.missingGenerators.join(", ") || "(none)")}</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Compatibility: ${escapeHtml(result.agent)}</h2>
  <p><strong>Compatible:</strong> ${result.compatible}</p>
  ${statusLine}
</body>
</html>`;
}
