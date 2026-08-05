/**
 * Workflow Executor — Stage 6B. Generic orchestration only.
 *
 * Implements the Stage 6A execution model exactly:
 *   1. Resolve workflow registration (getWorkflow).
 *   2. Assemble declared inputRequirements from caller-supplied context
 *      -- exactly like the Agent Executor (Stage 5B): this file never
 *      fetches anything itself.
 *   3. Invoke workflow.plan(input) to get an explicit plan.
 *   4. Execute each plan step by delegating ONLY to
 *      runAgentWithReport() -- the ONLY function this file may call from
 *      a lower layer. It must NEVER call runAgent(), runAdvisors(),
 *      runAdvisorWithReport(), runGeneratorWithReport(), or any other
 *      lower-level subsystem directly -- doing so would bypass the
 *      Agent layer entirely, exactly the layering violation Stage 6A's
 *      entire design exists to prevent.
 *   5. Invoke workflow.decide(step, agentReport, priorResults) after
 *      each step.
 *   6. Halt when a decision's action is "stop" or "fail".
 *
 * A Workflow's plan step has exactly ONE shape -- { agentId, context }
 * -- unlike the Agent Executor's plan steps, which vary by type
 * (advisors/advisor/generator). There is only one kind of thing a
 * Workflow step can do: invoke an Agent. This is why executeStep()
 * below has no type-branching, unlike
 * agents/framework/agent-executor.js's equivalent.
 *
 * ERROR PHILOSOPHY: this is the RAW executor (mirrors runAgent(), not
 * runAgentWithReport()) -- it CAN throw, with errors tagged by phase
 * ("planning" | "execution") so the never-throws wrapper
 * (workflow-report.js's runWorkflowWithReport()) can classify them
 * correctly. Agent step failures are NOT thrown here -- those already
 * surface via the embedded Agent Report's own success: false field
 * (Stage 5B's own never-throws contract), which is exactly why this
 * executor never needs to inspect or reinterpret step results itself;
 * that judgment belongs entirely to the workflow's own decide().
 */

import { getWorkflow } from "./workflow-registry.js";
import { validateDecision } from "./workflow-interface.js";
import { runAgentWithReport } from "../../agents/index.js";

async function executeStep(step) {
  return runAgentWithReport(step.agentId, step.context ?? {});
}

/**
 * Runs a registered workflow's full lifecycle: plan -> execute steps ->
 * decide, halting on "stop"/"fail". CAN throw (see file header) --
 * callers wanting a never-throws contract should use
 * runWorkflowWithReport() (workflow-report.js) instead.
 *
 * @param {string} id - registered workflow id
 * @param {object} context - a bag of whatever inputs the caller has
 *   available, matching the workflow's own inputRequirements, e.g.
 *   { knowledgeGraph, memoryHistory, sourceFiles }
 */
export async function runWorkflow(id, context = {}) {
  const workflowDef = getWorkflow(id);

  const input = {};
  for (const requirement of workflowDef.inputRequirements) {
    if (!(requirement in context)) {
      throw new Error(`Workflow "${id}" requires input "${requirement}" but it was not provided in the context.`);
    }
    input[requirement] = context[requirement];
  }

  let plan;
  try {
    plan = await workflowDef.plan(input);
  } catch (err) {
    const planningError = new Error(`Planning failed for workflow "${id}": ${err.message}`);
    planningError.phase = "planning";
    throw planningError;
  }

  if (!plan || !Array.isArray(plan.steps)) {
    const planningError = new Error(`Planning failed for workflow "${id}": plan() must return an object with a "steps" array.`);
    planningError.phase = "planning";
    throw planningError;
  }

  const steps = [];
  const priorResults = [];
  let halted = null;

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    let agentReport;

    try {
      agentReport = await executeStep(step);
    } catch (err) {
      const executionError = new Error(`Execution failed at step ${i} (agent "${step?.agentId}") for workflow "${id}": ${err.message}`);
      executionError.phase = "execution";
      executionError.stepIndex = i;
      throw executionError;
    }

    let decision;
    try {
      decision = await workflowDef.decide(step, agentReport, priorResults);
      validateDecision(decision, id, i);
    } catch (err) {
      const decisionError = new Error(`Decision failed at step ${i} for workflow "${id}": ${err.message}`);
      decisionError.phase = "execution";
      decisionError.stepIndex = i;
      throw decisionError;
    }

    steps.push({ ...step, agentReport, decision });
    priorResults.push(agentReport);

    if (decision.action === "stop" || decision.action === "fail") {
      halted = decision;
      break;
    }
  }

  return { workflow: id, plan, steps, halted };
}
