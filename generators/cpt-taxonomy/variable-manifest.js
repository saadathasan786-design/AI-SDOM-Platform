/**
 * CPT + Taxonomy Generator — Variable Manifest.
 *
 * Unlike the Plugin/Theme Generators, most values here are DERIVED from
 * config rather than substituted from a fixed template — this generator
 * synthesizes new PHP methods matching plugin-boilerplate's style, it
 * doesn't find/replace tokens in a copied file. One entry below
 * (`text_domain`) isn't config-derived at all — it's auto-detected by
 * reading the target project (see "Analyze before modify" in
 * docs/CPT-TAXONOMY-GENERATOR.md).
 */

export const VARIABLE_MANIFEST = [
  {
    variable: "cpt_name",
    config_field: "cpt_name",
    required: true,
    default: null,
    description: "Singular human-readable CPT name, shown in wp-admin labels.",
    example: "Event",
  },
  {
    variable: "cpt_plural",
    config_field: "cpt_plural",
    required: false,
    default: "{cpt_name}s (naive default — override for irregular plurals)",
    description: "Plural CPT name, used in labels and as the basis for rest_base/rewrite slug.",
    example: "Events",
  },
  {
    variable: "cpt_slug",
    config_field: "(derived from cpt_name via toOptionCase)",
    required: false,
    default: null,
    description: "The post_type registration key (WordPress limit: 20 characters).",
    example: "event",
  },
  {
    variable: "taxonomy_name",
    config_field: "taxonomy_name",
    required: false,
    default: "{cpt_name} Category",
    description: "Singular human-readable taxonomy name.",
    example: "Event Category",
  },
  {
    variable: "taxonomy_plural",
    config_field: "taxonomy_plural",
    required: false,
    default: "{cpt_name} Categories, or {taxonomy_name}s if taxonomy_name was overridden",
    description: "Plural taxonomy name, used in labels and rest_base.",
    example: "Event Categories",
  },
  {
    variable: "taxonomy_slug",
    config_field: "(derived from taxonomy_name via toOptionCase)",
    required: false,
    default: null,
    description: "The taxonomy registration key (WordPress limit: 32 characters).",
    example: "event_category",
  },
  {
    variable: "text_domain",
    config_field: "(auto-detected from the target project's existing Class-CPT.php/Class-Taxonomy.php — NOT a config input)",
    required: false,
    default: null,
    description:
      "The target plugin's text domain, read from its existing registered CPT/taxonomy so " +
      "newly injected labels use the correct domain automatically.",
    example: "acme-client-portal",
  },
];
