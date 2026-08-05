/**
 * Agent Framework — public entry point. Stage 5B: foundation only, no
 * real agents registered here, matching the exact discipline Stage 4B
 * followed for the Advisor Framework's own foundation stage.
 *
 * registerAgent IS re-exported from day one, avoiding the gap Stage 3M
 * identified in generators/index.js (which never re-exported
 * registerGenerator) -- the same correction advisors/index.js already
 * made in Stage 4B.
 */

export { registerAgent, getAgent, listAgents, hasAgent } from "./framework/agent-registry.js";
export { runAgent } from "./framework/agent-executor.js";
export { runAgentWithReport } from "./framework/agent-report.js";
export {
  listAgentCatalog,
  getAgentMetadata,
  isAvailable,
  checkCompatibility,
} from "./framework/agent-catalog.js";

import { registerAgent } from "./framework/agent-registry.js";
import { architectureRemediationAgent } from "./architecture-remediation/architecture-remediation-agent.js";
import { securityRemediationAgent } from "./security-remediation/security-remediation-agent.js";
import { performanceOptimizationAgent } from "./performance-optimization/performance-optimization-agent.js";
import { pluginSecurityRemediationAgent } from "./plugin-security-remediation/plugin-security-remediation-agent.js";
import { pluginPerformanceOptimizationAgent } from "./plugin-performance-optimization/plugin-performance-optimization-agent.js";

registerAgent(architectureRemediationAgent);
registerAgent(securityRemediationAgent);
registerAgent(performanceOptimizationAgent);
registerAgent(pluginSecurityRemediationAgent);
registerAgent(pluginPerformanceOptimizationAgent);
