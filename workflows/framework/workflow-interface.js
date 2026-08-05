/**
 * Workflow Interface — Stage 6B. The required shape of any workflow
 * definition.
 *
 * Mirrors agents/framework/agent-interface.js's validation discipline
 * exactly (plain object, checked at registration time) but is a separate
 * implementation for a separate subsystem -- the registry-factory
 * promotion identified in Stage 6A is explicitly deferred to a future
 * dedicated refactor stage, not folded into this foundation build.
 *
 * Required shape:
 * {
 *   id: string,
 *   name: string,
 *   version: string,
 *   description: string,
 *   inputRequirements: string[],   // assembled by the executor from caller context, never fetched
 *   plan: async (input) => { steps: PlanStep[] },
 *     // Planning function: inspects input, returns an EXPLICIT plan data
 *     // structure. Must not perform analysis, generation, or decide on
 *     // an Agent's behalf. A PlanStep has exactly one shape:
 *     // { agentId: string, context: object } -- there is only one kind
 *     // of step in a Workflow (invoke an Agent), unlike the Agent
 *     // Framework's plan steps which vary by type (advisors/generator).
 *   decide: async (step, agentReport, priorResults) => { action: "continue"|"stop"|"fail", reason?: string },
 *     // Inspects an already-completed step's Agent Report and returns a
 *     // decision from a small, fixed vocabulary. Per Stage 6B's explicit
 *     // scope, this vocabulary is THREE actions only (no "skip") --
 *     // evidence-based: no real Agent across three real Agents (Stage
 *     // 5C/5G/5H) ever used "skip" either (confirmed in the Stage 5I
 *     // review), so it is not carried forward speculatively here.
 *     // Must not perform analysis, must not invoke an Advisor or
 *     // Generator directly, must not re-invoke an Agent itself.
 *   category?: string,
 *   capabilities?: string[],
 *   configuration?: object,
 *   requiredAgents?: string[],     // declared agent ids this workflow's plans may reference
 * }
 */

const REQUIRED_FIELDS = ["id", "name", "version", "description", "inputRequirements", "plan", "decide"];
const VALID_DECISION_ACTIONS = new Set(["continue", "stop", "fail"]);

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string" && entry.trim() !== "");
}

export function validateWorkflowDefinition(def) {
  if (!def || typeof def !== "object") {
    throw new Error("Workflow definition must be an object.");
  }

  for (const key of REQUIRED_FIELDS) {
    if (!(key in def)) {
      throw new Error(`Workflow definition missing required field: "${key}"`);
    }
  }

  if (typeof def.id !== "string" || def.id.trim() === "") {
    throw new Error('Workflow "id" must be a non-empty string.');
  }

  if (typeof def.name !== "string" || def.name.trim() === "") {
    throw new Error(`Workflow "${def.id}": "name" must be a non-empty string.`);
  }

  if (typeof def.version !== "string" || def.version.trim() === "") {
    throw new Error(`Workflow "${def.id}": "version" must be a non-empty string.`);
  }

  if (typeof def.description !== "string" || def.description.trim() === "") {
    throw new Error(`Workflow "${def.id}": "description" must be a non-empty string.`);
  }

  if (typeof def.plan !== "function") {
    throw new Error(`Workflow "${def.id}": "plan" must be a function.`);
  }

  if (typeof def.decide !== "function") {
    throw new Error(`Workflow "${def.id}": "decide" must be a function.`);
  }

  if (!isNonEmptyStringArray(def.inputRequirements)) {
    throw new Error(`Workflow "${def.id}": "inputRequirements" must be an array of non-empty strings.`);
  }

  if ("capabilities" in def && !isNonEmptyStringArray(def.capabilities)) {
    throw new Error(`Workflow "${def.id}": "capabilities" must be an array of non-empty strings when provided.`);
  }

  if ("requiredAgents" in def && !isNonEmptyStringArray(def.requiredAgents)) {
    throw new Error(`Workflow "${def.id}": "requiredAgents" must be an array of non-empty strings when provided.`);
  }

  if ("configuration" in def && (typeof def.configuration !== "object" || def.configuration === null)) {
    throw new Error(`Workflow "${def.id}": "configuration" must be an object when provided.`);
  }

  return true;
}

/** Validates a decision object's shape (used by the executor after each workflow.decide() call). */
export function validateDecision(decision, workflowId, stepIndex) {
  if (!decision || typeof decision !== "object") {
    throw new Error(`Workflow "${workflowId}": decide() at step ${stepIndex} must return an object.`);
  }
  if (!VALID_DECISION_ACTIONS.has(decision.action)) {
    throw new Error(
      `Workflow "${workflowId}": decide() at step ${stepIndex} returned an invalid action "${decision.action}" (expected one of ${[...VALID_DECISION_ACTIONS].join(", ")}).`
    );
  }
  return true;
}
