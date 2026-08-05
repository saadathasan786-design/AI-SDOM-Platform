/**
 * Agent Report — Stage 5B. Wraps runAgent() and produces a structured
 * Agent Report. Never throws -- failures are reported via
 * `report.success === false` and a populated `errors` array, exactly
 * mirroring runAdvisorWithReport()'s and runGeneratorWithReport()'s own
 * never-throws contracts.
 *
 * Every embedded Advisor Report / Unified Advisor Report / Generation
 * Report is the REAL, complete, unmodified object each respective
 * framework produced -- never restructured, renamed, or filtered. This
 * mirrors the exact "return the report unchanged" discipline already
 * established by the Advisor MCP/CLI/VS Code integrations (Stages
 * 4J-4L).
 */

import { runAgent } from "./agent-executor.js";

function summarizeSteps(steps) {
  const advisorsRun = [];
  const generatorsRun = [];
  let stepsSkipped = 0;
  let stepsFailed = 0;

  for (const step of steps) {
    if (step.type === "advisors") advisorsRun.push(...step.ids);
    if (step.type === "advisor") advisorsRun.push(step.id);
    if (step.type === "generator") generatorsRun.push(step.generatorId);
    if (step.decision?.action === "skip") stepsSkipped++;
    if (step.decision?.action === "fail") stepsFailed++;
  }

  return { advisorsRun, generatorsRun, stepsSkipped, stepsFailed };
}

function collectRecommendations(steps) {
  return steps
    .filter((step) => step.decision?.action === "stop" || step.decision?.action === "fail")
    .map((step) => step.decision.reason)
    .filter(Boolean);
}

function emptySummary() {
  return { advisorsRun: [], generatorsRun: [], stepsSkipped: 0, stepsFailed: 0 };
}

/**
 * Runs a registered agent and returns a structured Agent Report instead
 * of the executor's raw result -- never throws.
 */
export async function runAgentWithReport(id, context = {}) {
  const startedAt = Date.now();

  try {
    const { plan, steps, halted } = await runAgent(id, context);
    const summary = summarizeSteps(steps);

    return {
      agent: id,
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
      agent: id,
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
