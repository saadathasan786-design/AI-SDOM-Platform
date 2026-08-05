/**
 * Project Health Check Workflow — first real Workflow, validating the
 * Workflow Framework (Stage 6B) with a genuine multi-Agent orchestration
 * chain.
 *
 * SEQUENCE: Architecture Remediation Agent -> Security Remediation Agent
 * -> Performance Optimization Agent, each given the same sourceFiles.
 *
 * DECISION POLICY (transparent, evidence-based, exactly the minimum
 * specified -- no invented semantics):
 *   - if an Agent's report has success: false -> fail, halt immediately
 *   - otherwise -> continue to the next Agent
 *   - after the final Agent (performance-optimization) -> stop
 *
 * The policy reads ONLY agentReport.success (and, for a clearer message
 * only, agentReport.errors[0].message when failure occurs -- still just
 * reading the Agent Report's own top-level fields, never an embedded
 * Advisor finding or Generator output). No richer, non-speculative
 * policy naturally emerged from the three real Agents' report shapes
 * beyond this: each Agent already encapsulates its own judgment about
 * whether its Advisor/Generator findings mattered enough to act on (that
 * is precisely what each Agent's own success already represents), so
 * re-deriving anything from summary.stepsFailed etc. would only restate
 * success in a different form, not add real information -- exactly the
 * kind of restraint this project's evidence-first discipline calls for.
 *
 * ORCHESTRATION ONLY: this file performs no analysis and no generation.
 * It never inspects an embedded Advisor finding or Generator output --
 * only runAgentWithReport()'s own top-level success/errors fields. It
 * never invokes an Advisor or Generator directly; its only external call
 * is runAgentWithReport(), mirroring the frozen Stage 6B executor
 * discipline exactly (this file doesn't call the executor directly
 * either -- it only supplies plan()/decide() for the Workflow Framework
 * to call).
 *
 * Stage 13B: plan()'s body now delegates to the shared
 * planAgentSequence() helper (workflows/framework/plan-agent-sequence.js),
 * promoted after being found byte-identical across all four real
 * Workflows. AGENT_SEQUENCE itself remains local, workflow-specific
 * data, passed into the helper unchanged.
 */

import { planAgentSequence } from "../framework/plan-agent-sequence.js";

const AGENT_SEQUENCE = ["architecture-remediation", "security-remediation", "performance-optimization"];
const FINAL_AGENT_ID = AGENT_SEQUENCE[AGENT_SEQUENCE.length - 1];

/**
 * Plain-data plan: all three steps are always present from the start,
 * in the fixed sequence above, each receiving the same sourceFiles.
 */
export async function plan(input) {
  return planAgentSequence(AGENT_SEQUENCE, input);
}

/**
 * Interprets an already-completed step's Agent Report. Reads only its
 * top-level success/errors fields -- never an embedded Advisor finding,
 * never an embedded Generator report.
 */
export async function decide(step, agentReport) {
  if (!agentReport.success) {
    const detail = agentReport.errors?.[0]?.message ?? "no additional detail provided";
    return {
      action: "fail",
      reason: `Agent "${step.agentId}" reported failure (${detail}); halting the project health check.`,
    };
  }

  if (step.agentId === FINAL_AGENT_ID) {
    return {
      action: "stop",
      reason: "All agents (architecture, security, performance) completed successfully; project health check finished.",
    };
  }

  return {
    action: "continue",
    reason: `Agent "${step.agentId}" completed successfully; proceeding to the next agent.`,
  };
}

export const projectHealthCheckWorkflow = {
  id: "project-health-check",
  name: "Project Health Check Workflow",
  version: "1.0.0",
  description:
    "Runs the Architecture Remediation, Security Remediation, and Performance Optimization Agents in " +
    "sequence against the same sourceFiles, halting immediately if any agent reports failure. " +
    "Orchestration only -- performs no analysis or generation itself, never inspects embedded Advisor " +
    "findings or Generator reports directly.",
  category: "health-check",
  inputRequirements: ["sourceFiles"],
  requiredAgents: [...AGENT_SEQUENCE],
  capabilities: ["chains-agents"],
  plan,
  decide,
};
