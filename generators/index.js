/**
 * Generators — registration entry point.
 *
 * Anything (future MCP tool, CLI, test) that wants to run a generator
 * should import this file first to ensure generators are registered,
 * then use runGenerator / runGeneratorWithReport.
 */

import { registerGenerator } from "./framework/generator-registry.js";
import { pluginGenerator } from "./plugin/plugin-generator.js";
import { themeGenerator } from "./theme/theme-generator.js";
import { cptTaxonomyGenerator } from "./cpt-taxonomy/cpt-taxonomy-generator.js";
import { acfFieldGroupGenerator } from "./acf/acf-generator.js";
import { restApiGenerator } from "./rest-api/rest-api-generator.js";
import { elementorWidgetGenerator } from "./elementor-widget/elementor-widget-generator.js";
import { gutenbergBlockGenerator } from "./gutenberg-block/gutenberg-block-generator.js";

registerGenerator(pluginGenerator);
registerGenerator(themeGenerator);
registerGenerator(cptTaxonomyGenerator);
registerGenerator(acfFieldGroupGenerator);
registerGenerator(restApiGenerator);
registerGenerator(elementorWidgetGenerator);
registerGenerator(gutenbergBlockGenerator);

export { runGenerator } from "./framework/executor.js";
export { runGeneratorWithReport } from "./framework/generation-report.js";
export { listGenerators, getGenerator } from "./framework/generator-registry.js";
export {
  listCatalog,
  getGeneratorMetadata,
  getVariableManifest,
  supportsMode,
  isAvailable,
  getFrameworkCompatibility,
} from "./framework/catalog.js";
export {
  runPortfolioStarterPack,
  PORTFOLIO_METADATA,
} from "./portfolio-starter-pack/portfolio-starter-pack.js";
