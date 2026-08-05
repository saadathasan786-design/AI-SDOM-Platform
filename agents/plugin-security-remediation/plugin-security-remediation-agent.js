/**
 * Plugin Security Remediation Agent — first real WordPress-specific
 * Agent (Stage 7E), validating that the existing Agent Framework can
 * orchestrate a WordPress-specific Advisor and Generator without any
 * architectural change.
 *
 * IDENTICAL CONTRACT to every existing Agent: { id, name, version,
 * category, description, inputRequirements, requiresAdvisors,
 * requiresGenerators, capabilities, plan, decide }. Registered through
 * the existing, unmodified agents/framework/agent-registry.js via
 * agents/index.js -- no Agent Framework file was touched to build this.
 *
 * ORCHESTRATION SHAPE: a single wordpress-security Advisor step feeding
 * one decision gate, optionally followed by a dry-run Plugin Generator
 * step -- the EXACT same two-step shape as the Architecture Remediation
 * Agent (Stage 5C), reused deliberately because nothing about this
 * workflow needs a second, broader escalation step the way the generic
 * Security Remediation Agent's (Stage 5G) dual-gate shape did (that
 * agent broadens from a narrow scan to a combined security+code-review
 * check; here, the WordPress Security Advisor is already the complete,
 * single relevant source of evidence for this specific remediation
 * task).
 *
 * DECISION POLICY -- reuses the EXISTING Agent Framework severity
 * vocabulary and philosophy, invents nothing new. This project's real,
 * unmodified severity vocabulary across every Advisor is
 * {info, suggestion, warning, critical} -- there is no separate
 * "high"/"medium" tier anywhere in the framework. Mapped directly:
 *   - "Critical findings"  -> summary.critical > 0
 *   - "High findings"      -> summary.warning > 0 (the next real
 *     severity tier below critical in the existing vocabulary)
 *   - "Medium findings"    -> a configurable VOLUME threshold on
 *     summary.suggestion -- the exact same "individually minor findings
 *     matter in volume" policy the Performance Optimization Agent
 *     (Stage 5H) already established and validated, reused here rather
 *     than inventing a new concept for "medium."
 *
 *     HONEST NOTE (verified by direct inspection, mirroring Stage 5H's
 *     own analogous discovery that the Performance Advisor never
 *     produces "critical" findings): the WordPress Security Advisor's
 *     CURRENT rule set never produces "suggestion"-level findings --
 *     only critical, warning, and info. This means the medium-volume
 *     branch below is currently unreachable via the real, unmodified
 *     WordPress Security Advisor as it exists today. The branch is kept
 *     (rather than removed) because (a) it is directly, correctly
 *     testable and verified via unit tests calling decide() with a
 *     synthetic result, (b) it is forward-compatible should the
 *     WordPress Security Advisor ever add a suggestion-level rule in a
 *     future stage, requiring no change to this Agent, and (c) it
 *     faithfully implements the exact policy shape this stage requires
 *     ("Medium findings -> configurable") using only the framework's
 *     real, existing vocabulary rather than inventing a new one.
 *
 *   - "No meaningful findings" -> none of the above -> stop, no
 *     Generator step.
 * decide() reads ONLY result.summary/result.success -- the same
 * discipline every real Agent in this project already follows; it never
 * inspects result.findings.
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
 * Uses the Plugin Generator (dry-run only) for the remediation
 * demonstration step -- the same generator, same dry-run-only
 * discipline, already used by the generic Security Remediation Agent
 * (Stage 5G). Same honesty caveat as every other remediation Agent: no
 * Generator here literally repairs a WordPress security finding; this
 * step demonstrates the orchestration mechanism only.
 */

import os from "node:os";
import path from "node:path";
import { decideGeneratorStep } from "../framework/generator-step-decision.js";

const DEFAULT_DRY_RUN_OUTPUT_DIR = path.join(os.tmpdir(), "plugin-security-remediation-agent-dry-run");

const MEDIUM_SUGGESTION_VOLUME_THRESHOLD = 3;

/**
 * Plain-data plan: both steps are always present from the start. Step 2
 * only actually executes if decide() returns "continue" after step 1.
 */
export async function plan(input) {
  return {
    steps: [
      {
        type: "advisors",
        ids: ["wordpress-security"],
        context: { sourceFiles: input.sourceFiles },
      },
      {
        type: "generator",
        generatorId: "plugin",
        config: { project_name: "Plugin Security Remediation Report" },
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
        reason: `WordPress Security scan step failed: ${result.advisorsFailed?.join(", ") || "unknown reason"}.`,
      };
    }

    const { critical, warning, suggestion } = result.summary;
    const hasCriticalFindings = critical > 0;
    const hasHighFindings = warning > 0;
    const hasMediumVolume = suggestion >= MEDIUM_SUGGESTION_VOLUME_THRESHOLD;

    if (hasCriticalFindings || hasHighFindings || hasMediumVolume) {
      return {
        action: "continue",
        reason:
          `WordPress security findings meet the remediation threshold (critical=${critical}, warning=${warning}, ` +
          `suggestion=${suggestion}, volume threshold=${MEDIUM_SUGGESTION_VOLUME_THRESHOLD}); preparing remediation generator step.`,
      };
    }

    return {
      action: "stop",
      reason: `No meaningful WordPress security findings (critical=${critical}, warning=${warning}, suggestion=${suggestion}); nothing to remediate.`,
    };
  }

  if (step.type === "generator") {
    return decideGeneratorStep(result);
  }

  return { action: "fail", reason: `Unrecognized step type in decide(): "${step.type}"` };
}

export const pluginSecurityRemediationAgent = {
  id: "plugin-security-remediation",
  name: "Plugin Security Remediation Agent",
  version: "1.0.0",
  description:
    "Runs the WordPress Security Advisor and, if findings meet a critical/high/volume-sensitive " +
    "remediation threshold, prepares a dry-run Plugin Generator step as a demonstration remediation " +
    "action. Orchestration only -- performs no analysis or generation itself.",
  category: "wordpress-remediation",
  inputRequirements: ["sourceFiles"],
  requiresAdvisors: ["wordpress-security"],
  requiresGenerators: ["plugin"],
  capabilities: ["invokes-generators"],
  plan,
  decide,
};
