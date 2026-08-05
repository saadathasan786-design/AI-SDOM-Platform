/**
 * Plugin Health Audit Workflow — first real WordPress Workflow (Stage
 * 7G), validating that the existing, unmodified Workflow Framework can
 * orchestrate WordPress-specific Agents alongside an existing generic
 * Agent without any architectural change.
 *
 * SEQUENCE: Plugin Security Remediation Agent (Stage 7E) -> Plugin
 * Performance Optimization Agent (Stage 7F) -> Architecture Remediation
 * Agent (Stage 5C, existing, generic, UNMODIFIED). This deliberately
 * combines two new WordPress Agents with one pre-existing generic
 * Agent -- the whole point of this stage is to prove the Workflow
 * Framework doesn't care whether an Agent is "WordPress-specific" or
 * "generic"; it only ever calls runAgentWithReport(agentId, context),
 * exactly as it always has.
 *
 * DECISION POLICY -- the exact same uniform "fail on any failure, stop
 * after the final step" policy the Project Health Check Workflow
 * (Stage 6C) already established. No new semantics, no branching by
 * agent identity, no retries, no re-planning:
 *   - if agentReport.success === false -> fail, halt immediately
 *   - otherwise, after step 1 or step 2 -> continue
 *   - otherwise, after the final step (step 3) -> stop
 *
 * decide() reads ONLY agentReport.success and agentReport.errors --
 * top-level Agent Report fields, never an embedded Advisor finding or
 * Generator output. It never invokes an Advisor, Generator, or Agent
 * itself; its only role is interpreting an already-completed step's
 * Agent Report, exactly like every other real Workflow.
 *
 * ORCHESTRATION ONLY: this file performs no analysis and no generation.
 * Its plan() steps are exactly { agentId, context } -- no other shape --
 * matching this stage's explicit requirement and the existing Workflow
 * Framework's single plan-step shape (Stage 6B).
 *
 * Stage 13B: plan()'s body now delegates to the shared
 * planAgentSequence() helper (workflows/framework/plan-agent-sequence.js),
 * promoted after being found byte-identical across all four real
 * Workflows. AGENT_SEQUENCE itself remains local, workflow-specific
 * data, passed into the helper unchanged.
 */

import { planAgentSequence } from "../framework/plan-agent-sequence.js";

const AGENT_SEQUENCE = ["plugin-security-remediation", "plugin-performance-optimization", "architecture-remediation"];
const FINAL_AGENT_ID = AGENT_SEQUENCE[AGENT_SEQUENCE.length - 1];

/**
 * Plain-data plan: all three steps are always present from the start,
 * in this fixed sequence, each receiving the same sourceFiles. Each
 * step is exactly { agentId, context } -- no other shape.
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
      reason: `Agent "${step.agentId}" reported failure (${detail}); halting the plugin health audit.`,
    };
  }

  if (step.agentId === FINAL_AGENT_ID) {
    return {
      action: "stop",
      reason: "All agents (security, performance, architecture) completed successfully; plugin health audit finished.",
    };
  }

  return {
    action: "continue",
    reason: `Agent "${step.agentId}" completed successfully; proceeding to the next agent.`,
  };
}

export const pluginHealthAuditWorkflow = {
  id: "plugin-health-audit",
  name: "Plugin Health Audit Workflow",
  version: "1.0.0",
  description:
    "Runs the Plugin Security Remediation Agent, then the Plugin Performance Optimization Agent, " +
    "then the existing generic Architecture Remediation Agent in sequence against the same " +
    "sourceFiles, halting immediately if any agent reports failure. Orchestration only -- performs " +
    "no analysis or generation itself, never inspects embedded Advisor findings or Generator reports " +
    "directly.",
  category: "wordpress-health-check",
  inputRequirements: ["sourceFiles"],
  requiredAgents: [...AGENT_SEQUENCE],
  capabilities: ["chains-agents"],
  plan,
  decide,
};
