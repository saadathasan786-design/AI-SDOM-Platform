/**
 * Agent Executor — Stage 5B. Generic orchestration only.
 *
 * Implements the Stage 5A execution model exactly:
 *   1. Resolve agent registration (getAgent).
 *   2. Assemble declared inputRequirements from caller-supplied context
 *      -- exactly like the Advisor Executor (Stage 4B): this file never
 *      fetches anything itself.
 *   3. Invoke agent.plan(input) to get an explicit plan.
 *   4. Execute each plan step by delegating ONLY to existing, unmodified
 *      public APIs: runAdvisors(), runAdvisorWithReport(),
 *      runGeneratorWithReport(). No analysis, no generation, no
 *      filesystem access, no Knowledge Graph construction, no Memory
 *      persistence, no MCP invocation happens in this file -- every
 *      actual unit of work is a call to Stage 3/4 code, unchanged.
 *   5. Invoke agent.decide(step, result, priorResults) after each step.
 *   6. Halt when a decision's action is "stop" or "fail".
 *
 * ERROR PHILOSOPHY: this is the RAW executor (mirrors runAdvisor(), not
 * runAdvisorWithReport()) -- it CAN throw, with errors tagged by phase
 * ("planning" | "execution") so the never-throws wrapper
 * (agent-report.js's runAgentWithReport()) can classify them correctly.
 * Advisor/Generator step failures are NOT thrown here -- those already
 * surface via the embedded result's own `success: false` field (Stage
 * 4/3's own never-throws contracts), which is exactly why this executor
 * never needs to inspect or reinterpret step results itself; that
 * judgment belongs entirely to the agent's own decide().
 */

import { getAgent } from "./agent-registry.js";
import { validateDecision } from "./agent-interface.js";
import { runAdvisors, runAdvisorWithReport } from "../../advisors/index.js";
import { runGeneratorWithReport } from "../../generators/index.js";

async function executeStep(step) {
  if (step.type === "advisors") {
    return runAdvisors(step.ids, step.context ?? {});
  }
  if (step.type === "advisor") {
    return runAdvisorWithReport(step.id, step.context ?? {});
  }
  if (step.type === "generator") {
    return runGeneratorWithReport(step.generatorId, step.config ?? {}, step.options ?? {});
  }
  throw new Error(`Unknown plan step type: "${step.type}"`);
}

/**
 * Runs a registered agent's full lifecycle: plan -> execute steps ->
 * decide, halting on "stop"/"fail". CAN throw (see file header) --
 * callers wanting a never-throws contract should use
 * runAgentWithReport() (agent-report.js) instead.
 *
 * @param {string} id - registered agent id
 * @param {object} context - a bag of whatever inputs the caller has
 *   available, matching the agent's own inputRequirements, e.g.
 *   { knowledgeGraph, memoryHistory, sourceFiles, agentCatalog }
 */
export async function runAgent(id, context = {}) {
  const agentDef = getAgent(id);

  const input = {};
  for (const requirement of agentDef.inputRequirements) {
    if (!(requirement in context)) {
      throw new Error(`Agent "${id}" requires input "${requirement}" but it was not provided in the context.`);
    }
    input[requirement] = context[requirement];
  }

  let plan;
  try {
    plan = await agentDef.plan(input);
  } catch (err) {
    const planningError = new Error(`Planning failed for agent "${id}": ${err.message}`);
    planningError.phase = "planning";
    throw planningError;
  }

  if (!plan || !Array.isArray(plan.steps)) {
    const planningError = new Error(`Planning failed for agent "${id}": plan() must return an object with a "steps" array.`);
    planningError.phase = "planning";
    throw planningError;
  }

  const steps = [];
  const priorResults = [];
  let halted = null;

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    let result;

    try {
      result = await executeStep(step);
    } catch (err) {
      const executionError = new Error(`Execution failed at step ${i} ("${step?.type}") for agent "${id}": ${err.message}`);
      executionError.phase = "execution";
      executionError.stepIndex = i;
      throw executionError;
    }

    let decision;
    try {
      decision = await agentDef.decide(step, result, priorResults);
      validateDecision(decision, id, i);
    } catch (err) {
      const decisionError = new Error(`Decision failed at step ${i} for agent "${id}": ${err.message}`);
      decisionError.phase = "execution";
      decisionError.stepIndex = i;
      throw decisionError;
    }

    steps.push({ ...step, result, decision });
    priorResults.push(result);

    if (decision.action === "stop" || decision.action === "fail") {
      halted = decision;
      break;
    }
  }

  return { agent: id, plan, steps, halted };
}
