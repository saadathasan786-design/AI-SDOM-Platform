/**
 * Plugin Performance Optimization Agent — second real WordPress-specific
 * Agent (Stage 7F), validating that the existing Agent Framework
 * supports a second, genuinely different WordPress orchestration policy
 * without any architectural change.
 *
 * IDENTICAL CONTRACT to every existing Agent: { id, name, version,
 * category, description, inputRequirements, requiresAdvisors,
 * requiresGenerators, capabilities, plan, decide }. Registered through
 * the existing, unmodified agents/framework/agent-registry.js via
 * agents/index.js -- no Agent Framework file was touched to build this.
 *
 * ORCHESTRATION SHAPE: the same single-Advisor-step-feeding-one-gate
 * shape as the Plugin Security Remediation Agent (Stage 7E) and the
 * Architecture Remediation Agent (Stage 5C) -- reused deliberately,
 * since nothing about this workflow needs a second escalation step.
 * What genuinely differs between this Agent and the Plugin Security
 * Remediation Agent is the DECISION POLICY, not the shape (see below).
 *
 * DECISION POLICY -- reuses the project's existing severity vocabulary
 * and the exact volume-sensitive policy the generic Performance
 * Optimization Agent (Stage 5H) already demonstrated, invents nothing
 * new:
 *   - critical > 0             -> continue. HONEST NOTE (verified by
 *     direct inspection, mirroring the Plugin Security Remediation
 *     Agent's own analogous discovery, Stage 7E): the WordPress
 *     Performance Advisor's CURRENT rule set never produces "critical"
 *     findings -- only warning, suggestion, and info (confirmed via
 *     grep before writing this policy). This branch is currently
 *     unreachable via the real, unmodified Advisor as it exists today,
 *     kept for the same forward-compatibility and defensive reasons the
 *     Plugin Security Remediation Agent already documented for its own
 *     analogous branch.
 *   - warning >= 2             -> continue (ACCUMULATED warnings, not
 *     an isolated single one -- see the direct policy comparison below
 *     for why this is the genuinely different part).
 *   - suggestion >= 3          -> continue (the same volume-sensitive
 *     threshold the generic Performance Optimization Agent already
 *     validated, Stage 5H).
 *   - otherwise                -> stop, no Generator step.
 * decide() reads ONLY result.summary/result.success -- the same
 * discipline every real Agent in this project already follows; it never
 * inspects result.findings.
 *
 * GENUINE POLICY DIFFERENCE FROM THE PLUGIN SECURITY REMEDIATION AGENT
 * (Stage 7E) -- not merely a different Advisor/Generator pairing, but a
 * different SHAPE OF JUDGMENT, directly comparable:
 *
 *   Plugin Security Remediation Agent: warning >= 1 triggers escalation
 *   -- a SINGLE isolated warning-level security finding (e.g. one
 *   unescaped echo) is treated as meaningful on its own, because a
 *   single real security gap is a real, standalone risk regardless of
 *   how many others exist alongside it.
 *
 *   Plugin Performance Optimization Agent (this file): warning >= 2 is
 *   required -- a SINGLE isolated performance warning (e.g. one N+1
 *   query) is NOT, by itself, treated as meaningful enough to escalate;
 *   only an ACCUMULATION of two or more concrete warning-level findings
 *   (or the same suggestion-level volume threshold already proven for
 *   the generic Performance Agent) crosses this Agent's bar. This
 *   directly reflects the same real-world reasoning the generic
 *   Performance Optimization Agent's own design comment already
 *   established: performance problems are "death by a thousand cuts,"
 *   where a single instance rarely justifies action but an accumulation
 *   does -- whereas a single security gap already justifies action on
 *   its own. This is a genuine, evidence-based difference in judgment,
 *   not a superficial relabeling of the same policy.
 *
 * ANALYSIS-FREE, GENERATION-FREE ORCHESTRATION ONLY: this file performs
 * no analysis and no generation itself. It never inspects raw source
 * code, never invokes another Agent, never invokes a Workflow, never
 * accesses Memory or the Knowledge Graph directly. Its only external
 * calls are runAdvisors() and runGeneratorWithReport() (via the
 * existing Agent Executor, unmodified) -- it does not call them
 * directly itself; it only supplies plan()/decide() for the Agent
 * Framework to execute, exactly like every other real Agent.
 *
 * Uses the Plugin Generator (dry-run only) for the optimization
 * demonstration step. Same honesty caveat as every other remediation
 * Agent: no Generator here literally optimizes a WordPress performance
 * finding; this step demonstrates the orchestration mechanism only.
 */

import os from "node:os";
import path from "node:path";
import { decideGeneratorStep } from "../framework/generator-step-decision.js";

const DEFAULT_DRY_RUN_OUTPUT_DIR = path.join(os.tmpdir(), "plugin-performance-optimization-agent-dry-run");

const ACCUMULATED_WARNING_THRESHOLD = 2;
const SUGGESTION_VOLUME_THRESHOLD = 3;

/**
 * Plain-data plan: both steps are always present from the start. Step 2
 * only actually executes if decide() returns "continue" after step 1.
 */
export async function plan(input) {
  return {
    steps: [
      {
        type: "advisors",
        ids: ["wordpress-performance"],
        context: { sourceFiles: input.sourceFiles },
      },
      {
        type: "generator",
        generatorId: "plugin",
        config: { project_name: "Plugin Performance Optimization Report" },
        options: { outputDir: DEFAULT_DRY_RUN_OUTPUT_DIR, mode: "dry-run" },
      },
    ],
  };
}

/**
 * Interprets already-computed step results. Never computes a finding,
 * never reads result.findings, never invokes an Advisor or Generator
 * itself -- only result.summary/result.success, fields the Advisor and
 * Generator Framework already produced.
 */
export async function decide(step, result) {
  if (step.type === "advisors") {
    if (!result.success) {
      return {
        action: "fail",
        reason: `WordPress Performance scan step failed: ${result.advisorsFailed?.join(", ") || "unknown reason"}.`,
      };
    }

    const { critical, warning, suggestion } = result.summary;
    const hasCriticalFindings = critical > 0;
    const hasAccumulatedWarnings = warning >= ACCUMULATED_WARNING_THRESHOLD;
    const hasSignificantVolume = suggestion >= SUGGESTION_VOLUME_THRESHOLD;

    if (hasCriticalFindings || hasAccumulatedWarnings || hasSignificantVolume) {
      return {
        action: "continue",
        reason:
          `WordPress performance findings meet the accumulated-concern threshold (critical=${critical}, ` +
          `warning=${warning}/${ACCUMULATED_WARNING_THRESHOLD}, suggestion=${suggestion}/${SUGGESTION_VOLUME_THRESHOLD}); ` +
          `preparing optimization generator step.`,
      };
    }

    return {
      action: "stop",
      reason: `WordPress performance findings (critical=${critical}, warning=${warning}, suggestion=${suggestion}) do not yet accumulate enough to warrant optimization.`,
    };
  }

  if (step.type === "generator") {
    return decideGeneratorStep(result, { actionLabel: "Optimization" });
  }

  return { action: "fail", reason: `Unrecognized step type in decide(): "${step.type}"` };
}

export const pluginPerformanceOptimizationAgent = {
  id: "plugin-performance-optimization",
  name: "Plugin Performance Optimization Agent",
  version: "1.0.0",
  description:
    "Runs the WordPress Performance Advisor and, if findings accumulate past a volume-sensitive " +
    "threshold (2+ warning-level findings, or 3+ suggestion-level findings), prepares a dry-run " +
    "Plugin Generator step as a demonstration optimization action. Orchestration only -- performs " +
    "no analysis or generation itself.",
  category: "wordpress-remediation",
  inputRequirements: ["sourceFiles"],
  requiresAdvisors: ["wordpress-performance"],
  requiresGenerators: ["plugin"],
  capabilities: ["invokes-generators"],
  plan,
  decide,
};
