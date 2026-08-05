/**
 * Release Readiness Workflow — second real WordPress Workflow (Stage
 * 7H), validating that the existing, unmodified Workflow Framework
 * cleanly supports a second, genuinely different orchestration policy
 * for the exact same three Agents the Plugin Health Audit Workflow
 * (Stage 7G) already uses.
 *
 * SEQUENCE: identical to the Plugin Health Audit Workflow -- Plugin
 * Security Remediation Agent -> Plugin Performance Optimization Agent
 * -> Architecture Remediation Agent (existing, generic, UNMODIFIED).
 * Reusing the same sequence deliberately isolates the DECISION POLICY
 * as the only variable, making the genuine-difference comparison
 * unambiguous.
 *
 * DECISION POLICY -- genuinely different from Plugin Health Audit's
 * uniform "fail on any failure, stop after the last step" policy,
 * mirroring the exact same distinction Stage 6C's Project Health Check
 * Workflow and Stage 6D's Security Audit Workflow already established
 * for the generic Agents:
 *   - Step 1 (Security):     success:false -> fail; otherwise -> continue
 *   - Step 2 (Performance):   success:false -> fail; otherwise -> continue
 *   - Step 3 (Architecture):  ALWAYS -> stop, regardless of success or
 *     failure -- per this workflow's explicit specification. A release
 *     -readiness check has already gathered everything security- and
 *     performance-relevant it needs by the time it reaches the final,
 *     broader architectural pass; that pass's own outcome doesn't need
 *     to escalate to a workflow-level failure the way an earlier
 *     security/performance failure would, since by definition nothing
 *     about a plugin's general architecture blocks a release the way a
 *     genuine security or performance regression would.
 *
 * decide() reads ONLY agentReport.success and agentReport.errors --
 * top-level Agent Report fields, never an embedded Advisor finding or
 * Generator output. It never invokes an Advisor, Generator, or Agent
 * itself; its only role is interpreting an already-completed step's
 * Agent Report, exactly like every other real Workflow.
 *
 * ORCHESTRATION ONLY: this file performs no analysis and no generation.
 * Its plan() steps are exactly { agentId, context } -- no other shape --
 * matching the existing Workflow Framework's single plan-step shape
 * (Stage 6B), unmodified.
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
  if (step.agentId === FINAL_AGENT_ID) {
    // Per this workflow's explicit specification: always stop after the
    // final (Architecture Remediation) step, regardless of its own
    // success or failure -- a genuinely different rule from the earlier
    // two steps, and from Plugin Health Audit's uniform policy.
    const status = agentReport.success ? "completed successfully" : "reported failure";
    return {
      action: "stop",
      reason: `Release readiness check finished after the Architecture Remediation step (${status}).`,
    };
  }

  if (!agentReport.success) {
    const detail = agentReport.errors?.[0]?.message ?? "no additional detail provided";
    return {
      action: "fail",
      reason: `Agent "${step.agentId}" reported failure (${detail}); halting the release readiness check.`,
    };
  }

  return {
    action: "continue",
    reason: `Agent "${step.agentId}" completed successfully; proceeding to the next agent.`,
  };
}

export const releaseReadinessWorkflow = {
  id: "release-readiness",
  name: "Release Readiness Workflow",
  version: "1.0.0",
  description:
    "Runs the Plugin Security Remediation Agent, then the Plugin Performance Optimization Agent, " +
    "then the existing generic Architecture Remediation Agent, halting immediately if either of the " +
    "first two agents reports failure. The final (Architecture Remediation) step always stops the " +
    "check regardless of its own outcome. Orchestration only -- performs no analysis or generation " +
    "itself, never inspects embedded Advisor findings or Generator reports directly.",
  category: "wordpress-release-readiness",
  inputRequirements: ["sourceFiles"],
  requiredAgents: [...AGENT_SEQUENCE],
  capabilities: ["chains-agents"],
  plan,
  decide,
};
