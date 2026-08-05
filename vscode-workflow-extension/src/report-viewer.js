/**
 * Report Viewer — Workflow VS Code Extension. Pure presentation of
 * already-computed Workflow Reports (which themselves embed real,
 * unmodified Agent Reports, which themselves embed real, unmodified
 * Advisor/Generator reports) and the Workflow Catalog. Mirrors
 * vscode-agent-extension/src/report-viewer.js's exact discipline (which
 * itself mirrored vscode-advisor-extension/src/report-viewer.js, Stage
 * 4L), extended one layer deeper.
 *
 * Every function here takes data the Workflow Framework already computed
 * and returns an HTML string. NOTHING here recomputes a decision,
 * recomputes a finding, or re-derives anything the framework didn't
 * already produce -- at ANY of the three nested layers. Severity
 * filtering happens client-side, in the embedded <script>, over findings
 * ALREADY present in embedded Advisor steps -- presentation-layer
 * interactivity, not analysis.
 *
 * Deliberately framework-free: imports nothing from vscode or
 * workflows/, so it's testable with zero mocking at all.
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
  .workflow-step { border: 2px solid rgba(127,127,127,0.4); border-radius: 4px; margin: 12px 0; padding: 10px; }
  .agent-step { border: 1px solid rgba(127,127,127,0.3); border-radius: 4px; margin: 8px 0; padding: 8px; background: rgba(127,127,127,0.04); }
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

function renderEmbeddedAdvisorsStep(agentStep) {
  const result = agentStep.result ?? {};
  const status = result.success ? "SUCCESS" : "FAILED";
  const findings = result.findings ?? [];
  const advisorIds = agentStep.ids ?? (agentStep.id ? [agentStep.id] : []);

  return `
    <div>
      <strong>Advisor${advisorIds.length > 1 ? "s" : ""}:</strong> ${escapeHtml(advisorIds.join(", "))} -- ${status}
      ${findings.map(renderFinding).join("\n")}
    </div>`;
}

function renderEmbeddedGeneratorStep(agentStep) {
  const result = agentStep.result ?? {};
  const status = result.success ? "SUCCESS" : "FAILED";
  const errorLine = !result.success && result.error ? `<div><strong>Error:</strong> ${escapeHtml(result.error)}</div>` : "";

  return `
    <div>
      <strong>Generator:</strong> "${escapeHtml(agentStep.generatorId ?? "")}" (mode: ${escapeHtml(result.mode ?? agentStep.options?.mode ?? "write")}) -- ${status}
      ${errorLine}
    </div>`;
}

function renderEmbeddedAgentStep(agentStep) {
  if (agentStep.type === "advisors" || agentStep.type === "advisor") return renderEmbeddedAdvisorsStep(agentStep);
  if (agentStep.type === "generator") return renderEmbeddedGeneratorStep(agentStep);
  return `<div>Step: ${escapeHtml(agentStep.type ?? "unknown")}</div>`;
}

/** Renders one Workflow step: the agent invoked, its embedded Agent Report, and the workflow's decision. */
function renderWorkflowStep(step) {
  const agentReport = step.agentReport ?? {};
  const agentStatus = agentReport.success ? "SUCCESS" : "FAILED";
  const embeddedStepsHtml = (agentReport.steps ?? [])
    .map((s) => `<div class="agent-step">${renderEmbeddedAgentStep(s)}</div>`)
    .join("\n");

  return `
    <div class="workflow-step">
      <h3>Agent: ${escapeHtml(step.agentId ?? "")} -- ${agentStatus}${agentReport.execution_ms !== undefined ? ` (${agentReport.execution_ms}ms)` : ""}</h3>
      ${embeddedStepsHtml}
      ${renderDecision(step.decision)}
    </div>`;
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

/** Builds the HTML for a full Workflow Report (from runWorkflowWithReport()). */
export function buildWorkflowReportHtml(report) {
  const status = report.success ? "SUCCESS" : "FAILED";
  const stepsHtml = (report.steps ?? []).map(renderWorkflowStep).join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Workflow: ${escapeHtml(report.workflow)}</h2>
  <p><strong>Status:</strong> ${status} &nbsp; <strong>Execution time:</strong> ${report.execution_ms}ms</p>
  <p><strong>Summary:</strong> agentsRun=[${escapeHtml((report.summary?.agentsRun ?? []).join(", "))}] stepsFailed=${report.summary?.stepsFailed ?? 0}</p>
  ${renderErrors(report.errors)}
  ${renderFilterBar()}
  <div id="steps">${stepsHtml}</div>
  ${renderRecommendations(report.recommendations)}
  <script>${FILTER_SCRIPT}</script>
</body>
</html>`;
}

/** Builds the HTML for the real Workflow Catalog (from listWorkflowCatalog()). */
export function buildCatalogHtml(catalog) {
  const rows = catalog
    .map(
      (entry) => `
      <div class="workflow-step">
        <h3>${escapeHtml(entry.id)} - ${escapeHtml(entry.name)} <em>[${escapeHtml(entry.category)}]</em></h3>
        <p>${escapeHtml(entry.description)}</p>
        <p><strong>Input requirements:</strong> ${escapeHtml(entry.inputRequirements.join(", ") || "(none)")}</p>
        <p><strong>Capabilities:</strong> ${escapeHtml(entry.capabilities.join(", ") || "(none)")}</p>
        <p><strong>Requires agents:</strong> ${escapeHtml(entry.requiredAgents.join(", ") || "(none)")}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Registered Workflows (${catalog.length})</h2>
  ${rows}
</body>
</html>`;
}

/** Builds the HTML for a compatibility check result (from checkCompatibility()). */
export function buildCompatibilityHtml(result) {
  const statusLine = result.error
    ? `<p><strong>Error:</strong> ${escapeHtml(result.error)}</p>`
    : `<p><strong>Missing agents:</strong> ${escapeHtml(result.missingAgents.join(", ") || "(none)")}</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_STYLE}</style></head>
<body>
  <h2>Compatibility: ${escapeHtml(result.workflow)}</h2>
  <p><strong>Compatible:</strong> ${result.compatible}</p>
  ${statusLine}
</body>
</html>`;
}
