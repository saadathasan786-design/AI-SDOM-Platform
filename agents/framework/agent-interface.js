/**
 * Agent Interface — Stage 5B. The required shape of any agent definition.
 *
 * Mirrors advisor-interface.js's validation discipline exactly (plain
 * object, checked at registration time, no forced class hierarchy) but
 * is a separate implementation for a separate subsystem -- the same
 * "don't share code across frameworks without a proven third consumer"
 * reasoning already applied when advisors/ was built alongside
 * generators/ (see docs/ADVISOR-FRAMEWORK.md), now applied a second time
 * for agents/.
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
 *     // structure. Must not perform analysis, generation, or I/O.
 *   decide: async (step, result, priorResults) => { action: "continue"|"skip"|"stop"|"fail", reason?: string },
 *     // Inspects an already-completed step's result and returns a decision
 *     // from a small, fixed vocabulary. Must not perform analysis or I/O.
 *   category?: string,
 *   capabilities?: string[],
 *   supportedSeverities?: string[],
 *   configSchema?: object,
 *   requiresAdvisors?: string[],     // declared advisor ids this agent's plans may reference
 *   requiresGenerators?: string[],   // declared generator ids this agent's plans may reference
 * }
 */

const REQUIRED_FIELDS = ["id", "name", "version", "description", "inputRequirements", "plan", "decide"];
const VALID_DECISION_ACTIONS = new Set(["continue", "skip", "stop", "fail"]);

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string" && entry.trim() !== "");
}

export function validateAgentDefinition(def) {
  if (!def || typeof def !== "object") {
    throw new Error("Agent definition must be an object.");
  }

  for (const key of REQUIRED_FIELDS) {
    if (!(key in def)) {
      throw new Error(`Agent definition missing required field: "${key}"`);
    }
  }

  if (typeof def.id !== "string" || def.id.trim() === "") {
    throw new Error('Agent "id" must be a non-empty string.');
  }

  if (typeof def.name !== "string" || def.name.trim() === "") {
    throw new Error(`Agent "${def.id}": "name" must be a non-empty string.`);
  }

  if (typeof def.version !== "string" || def.version.trim() === "") {
    throw new Error(`Agent "${def.id}": "version" must be a non-empty string.`);
  }

  if (typeof def.description !== "string" || def.description.trim() === "") {
    throw new Error(`Agent "${def.id}": "description" must be a non-empty string.`);
  }

  if (typeof def.plan !== "function") {
    throw new Error(`Agent "${def.id}": "plan" must be a function.`);
  }

  if (typeof def.decide !== "function") {
    throw new Error(`Agent "${def.id}": "decide" must be a function.`);
  }

  if (!isNonEmptyStringArray(def.inputRequirements)) {
    throw new Error(`Agent "${def.id}": "inputRequirements" must be an array of non-empty strings.`);
  }

  if ("capabilities" in def && !isNonEmptyStringArray(def.capabilities)) {
    throw new Error(`Agent "${def.id}": "capabilities" must be an array of non-empty strings when provided.`);
  }

  if ("requiresAdvisors" in def && !isNonEmptyStringArray(def.requiresAdvisors)) {
    throw new Error(`Agent "${def.id}": "requiresAdvisors" must be an array of non-empty strings when provided.`);
  }

  if ("requiresGenerators" in def && !isNonEmptyStringArray(def.requiresGenerators)) {
    throw new Error(`Agent "${def.id}": "requiresGenerators" must be an array of non-empty strings when provided.`);
  }

  if ("supportedSeverities" in def && !isNonEmptyStringArray(def.supportedSeverities)) {
    throw new Error(`Agent "${def.id}": "supportedSeverities" must be an array of non-empty strings when provided.`);
  }

  if ("configSchema" in def && (typeof def.configSchema !== "object" || def.configSchema === null)) {
    throw new Error(`Agent "${def.id}": "configSchema" must be an object when provided.`);
  }

  return true;
}

/** Validates a decision object's shape (used by the executor after each agent.decide() call). */
export function validateDecision(decision, agentId, stepIndex) {
  if (!decision || typeof decision !== "object") {
    throw new Error(`Agent "${agentId}": decide() at step ${stepIndex} must return an object.`);
  }
  if (!VALID_DECISION_ACTIONS.has(decision.action)) {
    throw new Error(
      `Agent "${agentId}": decide() at step ${stepIndex} returned an invalid action "${decision.action}" (expected one of ${[...VALID_DECISION_ACTIONS].join(", ")}).`
    );
  }
  return true;
}
