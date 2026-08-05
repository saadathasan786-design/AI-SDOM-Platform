/**
 * Workflow Report — Stage 6B. Wraps runWorkflow() and produces a
 * structured Workflow Report. Never throws -- failures are reported via
 * `report.success === false` and a populated `errors` array, exactly
 * mirroring runAgentWithReport()'s own never-throws contract.
 *
 * Every embedded Agent Report is the REAL, complete, unmodified object
 * runAgentWithReport() produced -- itself already embedding real,
 * unmodified Advisor/Generator reports (Stage 5B). This is now a
 * three-level-deep "return the report unchanged" discipline
 * (Workflow -> Agent -> Advisor/Generator), never restructured, renamed,
 * or filtered at any layer.
 */

import { runWorkflow } from "./workflow-executor.js";

function summarizeSteps(steps) {
  const agentsRun = [];
  let stepsFailed = 0;

  for (const step of steps) {
    agentsRun.push(step.agentId);
    if (step.decision?.action === "fail") stepsFailed++;
  }

  return { agentsRun, stepsFailed };
}

function collectRecommendations(steps) {
  return steps
    .filter((step) => step.decision?.action === "stop" || step.decision?.action === "fail")
    .map((step) => step.decision.reason)
    .filter(Boolean);
}

function emptySummary() {
  return { agentsRun: [], stepsFailed: 0 };
}

/**
 * Runs a registered workflow and returns a structured Workflow Report
 * instead of the executor's raw result -- never throws.
 */
export async function runWorkflowWithReport(id, context = {}) {
  const startedAt = Date.now();

  try {
    const { plan, steps, halted } = await runWorkflow(id, context);
    const summary = summarizeSteps(steps);

    return {
      workflow: id,
      success: summary.stepsFailed === 0,
      plan,
      steps,
      halted,
      summary,
      recommendations: collectRecommendations(steps),
      errors: [],
      execution_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      workflow: id,
      success: false,
      plan: null,
      steps: [],
      halted: null,
      summary: emptySummary(),
      recommendations: [],
      errors: [
        {
          phase: error.phase ?? "unexpected",
          stepIndex: error.stepIndex ?? null,
          message: error.message,
        },
      ],
      execution_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }
}
