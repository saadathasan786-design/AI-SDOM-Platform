/**
 * Architecture Remediation Agent — Stage 5C. The first real Agent,
 * validating the Agent Framework (Stage 5B) with a genuine orchestration
 * workflow.
 *
 * WORKFLOW:
 *   1. Run the real Architecture Advisor against the given sourceFiles.
 *   2. decide() evaluates the ALREADY-COMPUTED Unified Advisor Report's
 *      summary (never recomputing findings) to decide whether anything
 *      is actionable.
 *   3. If actionable (any critical or warning finding), continue to a
 *      dry-run Generator step (demonstrating "finding triggers generator
 *      step" wiring).
 *   4. If nothing actionable, stop cleanly -- via the framework's
 *      existing "stop" action, which halts the plan before the generator
 *      step ever runs. No re-planning, no framework change needed: both
 *      steps are present in the single, plain-data plan from the start;
 *      "stop" after step 1 is what prevents step 2 from executing.
 *
 * HONESTY ABOUT THE GENERATOR STEP: no Generator in this project literally
 * "fixes" an architecture finding (circular dependency, layer violation,
 * etc.) -- none exists, and none is introduced here, per instruction. The
 * dry-run Theme Generator step is a deliberate, honestly-labeled
 * DEMONSTRATION of the orchestration mechanism (Advisor finding -> a
 * prepared Generator step), not a claim that this Agent can actually
 * repair the specific issue found. See docs/AGENT-ARCHITECTURE-REMEDIATION.md.
 *
 * ORCHESTRATION ONLY: this file performs no analysis (it never inspects
 * individual findings, only the Advisor's own pre-computed summary
 * counts) and no generation (it only prepares a Generator step's config;
 * the actual Generator Framework does everything else, in dry-run mode,
 * unmodified).
 */

import os from "node:os";
import path from "node:path";
import { decideGeneratorStep } from "../framework/generator-step-decision.js";

const DEFAULT_DRY_RUN_OUTPUT_DIR = path.join(os.tmpdir(), "architecture-remediation-agent-dry-run");

/**
 * Plain-data plan: both steps are always present from the start. Whether
 * the second step actually executes is entirely decide()'s call after
 * step 1 completes -- not something plan() predicts or branches on.
 */
export async function plan(input) {
  return {
    steps: [
      {
        type: "advisors",
        ids: ["architecture"],
        context: { sourceFiles: input.sourceFiles },
      },
      {
        type: "generator",
        generatorId: "theme",
        config: { project_name: "Architecture Remediation Report" },
        options: { outputDir: DEFAULT_DRY_RUN_OUTPUT_DIR, mode: "dry-run" },
      },
    ],
  };
}

/**
 * Interprets already-computed step results. Never computes a finding,
 * never assigns a severity -- only reads result.summary/result.success,
 * fields the Advisor/Generator Framework already produced.
 */
export async function decide(step, result) {
  if (step.type === "advisors") {
    if (!result.success) {
      return {
        action: "fail",
        reason: `Architecture Advisor step failed: ${result.advisorsFailed.join(", ") || "unknown reason"}.`,
      };
    }

    const actionableCount = result.summary.critical + result.summary.warning;
    if (actionableCount > 0) {
      return {
        action: "continue",
        reason:
          `${actionableCount} actionable architecture finding(s) found ` +
          `(critical=${result.summary.critical}, warning=${result.summary.warning}); preparing remediation generator step.`,
      };
    }

    return {
      action: "stop",
      reason: "No actionable (critical/warning) architecture findings; nothing to remediate.",
    };
  }

  if (step.type === "generator") {
    return decideGeneratorStep(result);
  }

  return { action: "fail", reason: `Unrecognized step type in decide(): "${step.type}"` };
}

export const architectureRemediationAgent = {
  id: "architecture-remediation",
  name: "Architecture Remediation Agent",
  version: "1.0.0",
  description:
    "Runs the real Architecture Advisor and, if actionable (critical/warning) findings exist, " +
    "prepares a dry-run Theme Generator step as a demonstration remediation action. Orchestration " +
    "only -- performs no analysis or generation itself.",
  category: "remediation",
  inputRequirements: ["sourceFiles"],
  requiresAdvisors: ["architecture"],
  requiresGenerators: ["theme"],
  capabilities: ["invokes-generators"],
  plan,
  decide,
};
