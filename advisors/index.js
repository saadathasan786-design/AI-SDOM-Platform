/**
 * Advisor Framework — public entry point.
 *
 * Unlike generators/index.js, this file registers NO real advisors — this
 * stage (4B) is foundation only. A future stage will import concrete
 * advisor modules here and call registerAdvisor() for each, the same way
 * generators/index.js does for its 7 generators.
 *
 * Note this DOES re-export its registration function (registerAdvisor)
 * from day one — Stage 3M's production-readiness review flagged that
 * generators/index.js never re-exported registerGenerator, creating a
 * gap for external generator authors. That gap is deliberately not
 * repeated here.
 */

export { registerAdvisor, getAdvisor, listAdvisors, hasAdvisor } from "./framework/advisor-registry.js";
export { runAdvisor } from "./framework/advisor-executor.js";
export { runAdvisorWithReport } from "./framework/advisor-report.js";
export { runAdvisors } from "./framework/multi-advisor-executor.js";
export {
  listAdvisorCatalog,
  getAdvisorMetadata,
  getInputRequirements,
  supportsSeverity,
  isAvailable,
} from "./framework/advisor-catalog.js";
export { SEVERITY_LEVELS, isValidSeverity, severityRank, emptySeveritySummary } from "./framework/severity.js";

import { registerAdvisor } from "./framework/advisor-registry.js";
import { architectureAdvisor } from "./architecture/architecture-advisor.js";
import { codeReviewAdvisor } from "./code-review/code-review-advisor.js";
import { securityAdvisor } from "./security/security-advisor.js";
import { performanceAdvisor } from "./performance/performance-advisor.js";
import { accessibilityAdvisor } from "./accessibility/accessibility-advisor.js";
import { wordpressSecurityAdvisor } from "./wordpress-security/wordpress-security-advisor.js";
import { wordpressPerformanceAdvisor } from "./wordpress-performance/wordpress-performance-advisor.js";
import { wordpressHooksCoreAdvisor } from "./wordpress-hooks-core/wordpress-hooks-core-advisor.js";

registerAdvisor(architectureAdvisor);
registerAdvisor(codeReviewAdvisor);
registerAdvisor(securityAdvisor);
registerAdvisor(performanceAdvisor);
registerAdvisor(accessibilityAdvisor);
registerAdvisor(wordpressSecurityAdvisor);
registerAdvisor(wordpressPerformanceAdvisor);
registerAdvisor(wordpressHooksCoreAdvisor);
