/**
 * Security Audit Workflow — second real Workflow, validating that the
 * Workflow Framework (Stage 6B) generalizes across a genuinely different
 * orchestration order and decision sequence than the Project Health
 * Check Workflow.
 *
 * SEQUENCE: Security Remediation Agent -> Architecture Remediation Agent
 * -> Performance Optimization Agent. Security-first ordering (the
 * opposite lead-agent choice from Project Health Check, which starts
 * with Architecture) -- a deliberate, evidence-based difference in
 * emphasis: this workflow treats a security finding as the thing worth
 * knowing about earliest, not merely a different generator/agent choice
 * for its own sake.
 *
 * DECISION POLICY -- genuinely different from Project Health Check's
 * uniform "fail on any failure, stop after the last step" policy:
 *   - Step 1 (Security):     success:false -> fail; otherwise -> continue
 *   - Step 2 (Architecture): success:false -> fail; otherwise -> continue
 *   - Step 3 (Performance):  ALWAYS -> stop, regardless of success or
 *     failure -- per this workflow's explicit specification. Unlike
 *     steps 1-2, a Performance Optimization failure at the FINAL step
 *     does not need to escalate as a workflow-level failure the same
 *     way an earlier security/architecture failure would; the audit has
 *     already gathered everything it set out to gather by that point.
 *     This is a real, specified difference in decision semantics, not
 *     copied from Project Health Check's "fail overrides stop even at
 *     the final step" behavior -- and it is implemented exactly as
 *     specified, with no additional invented semantics beyond it.
 *
 * decide() reads ONLY agentReport.success and agentReport.errors --
 * top-level Agent Report fields. It never inspects an embedded Advisor
 * finding, never inspects an embedded Generator report, and never
 * invokes an Advisor, Generator, or Agent itself. Its only role is
 * interpreting an already-completed step's Agent Report.
 *
 * ORCHESTRATION ONLY: this file performs no analysis and no generation.
 *
 * Stage 13B: plan()'s body now delegates to the shared
 * planAgentSequence() helper (workflows/framework/plan-agent-sequence.js),
 * promoted after being found byte-identical across all four real
 * Workflows. AGENT_SEQUENCE itself remains local, workflow-specific
 * data, passed into the helper unchanged.
 */

import { planAgentSequence } from "../framework/plan-agent-sequence.js";

const AGENT_SEQUENCE = ["security-remediation", "architecture-remediation", "performance-optimization"];
const FINAL_AGENT_ID = AGENT_SEQUENCE[AGENT_SEQUENCE.length - 1];

/**
 * Plain-data plan: all three steps are always present from the start,
 * in this fixed, security-first sequence, each receiving the same
 * sourceFiles.
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
    // final (Performance Optimization) step, regardless of its own
    // success or failure -- a genuinely different rule from the earlier
    // two steps, and from Project Health Check's uniform policy.
    const status = agentReport.success ? "completed successfully" : "reported failure";
    return {
      action: "stop",
      reason: `Security audit finished after the Performance Optimization step (${status}).`,
    };
  }

  if (!agentReport.success) {
    const detail = agentReport.errors?.[0]?.message ?? "no additional detail provided";
    return {
      action: "fail",
      reason: `Agent "${step.agentId}" reported failure (${detail}); halting the security audit.`,
    };
  }

  return {
    action: "continue",
    reason: `Agent "${step.agentId}" completed successfully; proceeding to the next agent.`,
  };
}

export const securityAuditWorkflow = {
  id: "security-audit",
  name: "Security Audit Workflow",
  version: "1.0.0",
  description:
    "Runs the Security Remediation Agent first, then Architecture Remediation, then Performance " +
    "Optimization, halting immediately if either of the first two agents reports failure. The final " +
    "(Performance Optimization) step always stops the audit regardless of its own outcome. " +
    "Orchestration only -- performs no analysis or generation itself, never inspects embedded Advisor " +
    "findings or Generator reports directly.",
  category: "security-audit",
  inputRequirements: ["sourceFiles"],
  requiredAgents: [...AGENT_SEQUENCE],
  capabilities: ["chains-agents"],
  plan,
  decide,
};
