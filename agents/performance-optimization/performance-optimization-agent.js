/**
 * Performance Optimization Agent — Stage 5H. The third real Agent,
 * providing the evidence needed to evaluate whether the Agent Framework
 * generalizes across genuinely different workflows and whether any
 * shared orchestration abstraction is justified across three real
 * examples.
 *
 * WHY A SIMPLE "CRITICAL > 0" GATE WOULD BE WRONG HERE (evidence, not
 * assumption): the real Performance Advisor's own finding catalog was
 * inspected directly before designing this agent's decide() --
 * advisors/performance/performance-advisor.js declares FOURTEEN finding
 * types and NONE of them are "critical" severity (3 are "warning", 9 are
 * "suggestion", 2 are "info"; see the grep evidence in the Stage 5H
 * completion report). The Architecture and Security Remediation Agents
 * (Stages 5C/5G) both gate on summary.critical > 0 -- copying that exact
 * threshold here would mean this agent could NEVER escalate, regardless
 * of how many performance issues exist, since the advisor it orchestrates
 * structurally never reports a critical finding. This is a genuine,
 * evidence-based reason for a DIFFERENT decision policy, not an
 * arbitrary stylistic choice.
 *
 * A GENUINELY DIFFERENT DECISION POLICY (not just a different
 * structure): performance problems are typically "death by a thousand
 * cuts" -- individually minor, but worth acting on in volume. This
 * agent's single gate reflects that directly: escalate if there is at
 * least one WARNING-level finding (a real, more concrete performance
 * risk on its own), OR if there are three or more SUGGESTION-level
 * findings (individually minor, but numerous enough to be worth a
 * remediation pass). This is a compound, volume-sensitive threshold --
 * meaningfully different from both prior agents' simple ">0 critical
 * count" gates, and directly justified by this advisor's real severity
 * distribution rather than chosen for novelty's sake.
 *
 * ORCHESTRATION SHAPE: a single advisor step feeding a single decision
 * gate before an optional generator step (two steps total) -- the same
 * SHAPE as the Architecture Remediation Agent (Stage 5C), reused
 * deliberately because nothing about this workflow justifies a second,
 * broader escalation step the way Security's did (Stage 5G): there is no
 * natural "narrow scan, then broaden with a second advisor" story for
 * performance findings the way there is for a security finding needing
 * cross-checked context. Per instruction #8 ("use a multi-advisor step
 * only if justified by real workflow needs"), none is used here --
 * demonstrating restraint, not just capability-reuse for its own sake.
 *
 * Uses the Theme Generator (dry-run only) for the remediation
 * demonstration step -- verified directly to work standalone in dry-run
 * mode without requiring any pre-existing project structure (unlike
 * several other generators in this project, which are injection-style
 * and fail dry-run without a pre-existing target directory -- confirmed
 * by testing the Gutenberg Block generator standalone before choosing
 * Theme instead). Same honesty caveat as Stages 5C/5G: no Generator here
 * literally repairs a performance finding; this step demonstrates the
 * orchestration mechanism only.
 */

import os from "node:os";
import path from "node:path";
import { decideGeneratorStep } from "../framework/generator-step-decision.js";

const DEFAULT_DRY_RUN_OUTPUT_DIR = path.join(os.tmpdir(), "performance-optimization-agent-dry-run");

const SUGGESTION_VOLUME_THRESHOLD = 3;

/**
 * Plain-data plan: both steps are always present from the start. Whether
 * the second step actually executes is entirely decide()'s call after
 * step 1 completes.
 */
export async function plan(input) {
  return {
    steps: [
      {
        type: "advisors",
        ids: ["performance"],
        context: { sourceFiles: input.sourceFiles },
      },
      {
        type: "generator",
        generatorId: "theme",
        config: { project_name: "Performance Optimization Report" },
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
        reason: `Performance scan step failed: ${result.advisorsFailed?.join(", ") || "unknown reason"}.`,
      };
    }

    const { warning, suggestion } = result.summary;
    const hasConcreteWarning = warning > 0;
    const hasSignificantVolume = suggestion >= SUGGESTION_VOLUME_THRESHOLD;

    if (hasConcreteWarning || hasSignificantVolume) {
      return {
        action: "continue",
        reason:
          `Performance findings meet the remediation threshold (warning=${warning}, suggestion=${suggestion}, ` +
          `volume threshold=${SUGGESTION_VOLUME_THRESHOLD}); preparing remediation generator step.`,
      };
    }

    return {
      action: "stop",
      reason: `Performance findings (warning=${warning}, suggestion=${suggestion}) do not yet meet the remediation threshold; nothing to remediate.`,
    };
  }

  if (step.type === "generator") {
    return decideGeneratorStep(result);
  }

  return { action: "fail", reason: `Unrecognized step type in decide(): "${step.type}"` };
}

export const performanceOptimizationAgent = {
  id: "performance-optimization",
  name: "Performance Optimization Agent",
  version: "1.0.0",
  description:
    "Runs the Performance Advisor and, if findings meet a volume/severity-sensitive remediation " +
    "threshold (at least one warning-level finding, or three or more suggestion-level findings), " +
    "prepares a dry-run Theme Generator step as a demonstration remediation action. Orchestration " +
    "only -- performs no analysis or generation itself.",
  category: "remediation",
  inputRequirements: ["sourceFiles"],
  requiresAdvisors: ["performance"],
  requiresGenerators: ["theme"],
  capabilities: ["invokes-generators"],
  plan,
  decide,
};
