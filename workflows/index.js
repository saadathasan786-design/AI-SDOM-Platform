/**
 * Workflow Framework — public entry point. Stage 6B: foundation only, no
 * real workflows registered here, matching the exact discipline Stage
 * 5B followed for the Agent Framework's own foundation stage.
 *
 * registerWorkflow IS re-exported from day one, avoiding the gap Stage
 * 3M identified in generators/index.js -- the same correction
 * advisors/index.js (Stage 4B) and agents/index.js (Stage 5B) already
 * made.
 */

export { registerWorkflow, getWorkflow, listWorkflows, hasWorkflow } from "./framework/workflow-registry.js";
export { runWorkflow } from "./framework/workflow-executor.js";
export { runWorkflowWithReport } from "./framework/workflow-report.js";
export {
  listWorkflowCatalog,
  getWorkflowMetadata,
  isAvailable,
  checkCompatibility,
} from "./framework/workflow-catalog.js";

import { registerWorkflow } from "./framework/workflow-registry.js";
import { projectHealthCheckWorkflow } from "./project-health-check/project-health-check-workflow.js";
import { securityAuditWorkflow } from "./security-audit/security-audit-workflow.js";
import { pluginHealthAuditWorkflow } from "./plugin-health-audit/plugin-health-audit-workflow.js";
import { releaseReadinessWorkflow } from "./release-readiness/release-readiness-workflow.js";

registerWorkflow(projectHealthCheckWorkflow);
registerWorkflow(securityAuditWorkflow);
registerWorkflow(pluginHealthAuditWorkflow);
registerWorkflow(releaseReadinessWorkflow);
