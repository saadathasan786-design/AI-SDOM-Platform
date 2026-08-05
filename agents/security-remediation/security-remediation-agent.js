/**
 * Security Remediation Agent — Stage 5G. The second real Agent,
 * validating whether the Agent Framework generalizes beyond the
 * Architecture Remediation Agent (Stage 5C).
 *
 * A GENUINELY DIFFERENT ORCHESTRATION PATTERN, using only existing,
 * unmodified framework capabilities:
 *
 *   Step 1 (narrow scan):       { type: "advisors", ids: ["security"] }
 *   Step 2 (broad escalation):  { type: "advisors", ids: ["security", "code-review"] }
 *   Step 3 (remediation):       { type: "generator", generatorId: "plugin", mode: "dry-run" }
 *
 * The Architecture Remediation Agent (Stage 5C) uses ONE advisor step
 * feeding ONE decision gate before an optional generator step. This
 * agent instead uses TWO sequential advisor gates: a fast, narrow
 * single-advisor scan, escalating -- only if genuinely warranted -- to a
 * second, BROADER step running two advisors together in one
 * runAdvisors() call. Multi-id "advisors" steps were already a
 * first-class capability the executor and runAdvisors() supported since
 * Stage 5B/4I; this agent is the first to actually exercise it with more
 * than one id. No new executor capability, no re-planning, and no
 * dynamic plan mutation were needed -- both gates are decided purely via
 * the existing "stop" (halt cleanly) / "continue" (proceed) / "fail"
 * vocabulary, exactly as Stage 5C already used, applied twice instead of
 * once.
 *
 * decide() reads ONLY result.summary/result.success -- the same
 * discipline as Stage 5C's agent -- never iterating result.findings,
 * never invoking an Advisor or Generator itself, never touching raw
 * source code.
 *
 * HONESTY ABOUT THE GENERATOR STEP: as with Stage 5C, no Generator in
 * this project literally repairs a security finding (a hardcoded
 * credential, an eval() call, etc.) -- none exists, and none is
 * introduced here. The dry-run Plugin Generator step demonstrates the
 * orchestration mechanism (an escalated, confirmed security concern
 * triggering a prepared Generator step), deliberately using a DIFFERENT
 * existing Generator than Stage 5C's Theme Generator, to demonstrate the
 * pattern isn't hardcoded to one specific Generator either.
 */

import os from "node:os";
import path from "node:path";
import { decideGeneratorStep } from "../framework/generator-step-decision.js";

const DEFAULT_DRY_RUN_OUTPUT_DIR = path.join(os.tmpdir(), "security-remediation-agent-dry-run");

/**
 * Plain-data plan: all three steps are always present from the start.
 * Whether steps 2 and 3 actually execute is entirely decide()'s call
 * after each prior step completes.
 */
export async function plan(input) {
  return {
    steps: [
      {
        type: "advisors",
        ids: ["security"],
        context: { sourceFiles: input.sourceFiles },
      },
      {
        type: "advisors",
        ids: ["security", "code-review"],
        context: { sourceFiles: input.sourceFiles },
      },
      {
        type: "generator",
        generatorId: "plugin",
        config: { project_name: "Security Remediation Report" },
        options: { outputDir: DEFAULT_DRY_RUN_OUTPUT_DIR, mode: "dry-run" },
      },
    ],
  };
}

function isAdvisorsStep(step) {
  return step.type === "advisors";
}

/**
 * Interprets already-computed step results. Never computes a finding,
 * never assigns a severity, never reads result.findings -- only
 * result.summary/result.success, fields the Advisor/Generator Framework
 * already produced.
 */
export async function decide(step, result) {
  if (isAdvisorsStep(step)) {
    if (!result.success) {
      return {
        action: "fail",
        reason: `Security scan step failed: ${result.advisorsFailed?.join(", ") || "unknown reason"}.`,
      };
    }

    const isNarrowScan = step.ids.length === 1;
    const criticalCount = result.summary.critical;

    if (isNarrowScan) {
      if (criticalCount > 0) {
        return {
          action: "continue",
          reason: `${criticalCount} critical security finding(s) on the initial scan; escalating to a broader combined security + code-review check.`,
        };
      }
      return {
        action: "stop",
        reason: "No critical security findings on the initial scan; nothing urgent to escalate.",
      };
    }

    if (criticalCount > 0) {
      return {
        action: "continue",
        reason: `${criticalCount} critical finding(s) confirmed on the broader check; preparing remediation generator step.`,
      };
    }
    return {
      action: "stop",
      reason: "Broader combined check found no critical issues; stopping without generating remediation artifacts.",
    };
  }

  if (step.type === "generator") {
    return decideGeneratorStep(result);
  }

  return { action: "fail", reason: `Unrecognized step type in decide(): "${step.type}"` };
}

export const securityRemediationAgent = {
  id: "security-remediation",
  name: "Security Remediation Agent",
  version: "1.0.0",
  description:
    "Runs a narrow Security Advisor scan and, only if critical findings are present, escalates to " +
    "a broader combined Security + Code Review check; if that check still confirms critical " +
    "findings, prepares a dry-run Plugin Generator step as a demonstration remediation action. " +
    "Orchestration only -- performs no analysis or generation itself.",
  category: "remediation",
  inputRequirements: ["sourceFiles"],
  requiresAdvisors: ["security", "code-review"],
  requiresGenerators: ["plugin"],
  capabilities: ["invokes-generators"],
  plan,
  decide,
};
