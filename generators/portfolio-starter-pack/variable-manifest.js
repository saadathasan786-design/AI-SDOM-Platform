/**
 * Portfolio Starter Pack — Variable Manifest.
 *
 * Documents the combined, flattened config surface across all four
 * composed generators (Theme, Plugin, CPT+Taxonomy, ACF Field Group).
 * Every field here is either passed straight through to one of those
 * generators or used to derive that generator's own config — no new
 * naming/derivation logic is invented; see portfolio-starter-pack.js's
 * `deriveStepConfigs()` for exactly how each field maps.
 */

export const VARIABLE_MANIFEST = [
  {
    variable: "project_name",
    config_field: "project_name",
    required: true,
    default: null,
    description: "Shared identity for both the Theme and Plugin steps.",
    example: "Acme Portfolio",
  },
  {
    variable: "vendor_name",
    config_field: "vendor_name",
    required: false,
    default: "(Plugin Generator's own default: 'Vendor')",
    description: "Passed through to the Plugin step's vendor_name.",
    example: "Acme Agency",
  },
  {
    variable: "author",
    config_field: "author",
    required: false,
    default: "(Theme/Plugin Generators' own default: 'Your Name')",
    description: "Passed through to both the Theme and Plugin steps.",
    example: "Jane Smith",
  },
  {
    variable: "cpt_name",
    config_field: "cpt_name",
    required: false,
    default: "Portfolio Item",
    description: "Passed through to the CPT+Taxonomy step's cpt_name.",
    example: "Portfolio Item",
  },
  {
    variable: "cpt_plural",
    config_field: "cpt_plural",
    required: false,
    default: "(cpt_name + 's', same default rule as the CPT+Taxonomy Generator itself)",
    description: "Passed through to the CPT+Taxonomy step's cpt_plural.",
    example: "Portfolio Items",
  },
  {
    variable: "taxonomy_name",
    config_field: "taxonomy_name",
    required: false,
    default: "(CPT+Taxonomy Generator's own default: '{cpt_name} Category')",
    description: "Passed through to the CPT+Taxonomy step's taxonomy_name.",
    example: "Portfolio Category",
  },
  {
    variable: "acf_group_title",
    config_field: "acf_group_title",
    required: false,
    default: "'{cpt_name} Details'",
    description: "Passed through to the ACF step's group_title.",
    example: "Portfolio Item Details",
  },
  {
    variable: "acf_fields",
    config_field: "acf_fields",
    required: false,
    default: "[{ label: 'Client Name', type: 'text' }, { label: 'Project URL', type: 'url' }, { label: 'Summary', type: 'textarea' }]",
    description: "Passed through to the ACF step's fields array.",
    example: "[{ label: 'Client Name', type: 'text' }]",
  },
  {
    variable: "target_cpt (ACF step)",
    config_field: "(derived from cpt_name via toOptionCase — the SAME derivation the CPT+Taxonomy Generator uses internally)",
    required: false,
    default: null,
    description: "Ensures the ACF step always targets the exact CPT slug the CPT step just created — never independently guessed.",
    example: "portfolio_item",
  },
];
