/**
 * Theme Generator — Variable Manifest.
 *
 * Every variable this generator can substitute into theme-boilerplate/, in
 * one discoverable place. Must stay in sync with the actual replacements
 * applied in theme-generator.js — test/variable-manifest-theme.test.js
 * enforces this the same way it does for the Plugin Generator.
 *
 * Structurally simpler than the Plugin Generator's manifest: no
 * `namespace`/`vendor_slug` entries, because theme-boilerplate/ has no PHP
 * namespace or Composer vendor concept at all (WP themes are procedural,
 * collision-avoided via prefixed constants, not PSR-4).
 */

export const VARIABLE_MANIFEST = [
  {
    variable: "project_name",
    config_field: "project_name",
    required: true,
    default: null,
    description: "Human-readable theme name, shown as 'Theme Name' in style.css and in wp-admin.",
    example: "Acme Portal",
    replaces_literal_token: "Boilerplate Theme",
  },
  {
    variable: "text_domain",
    config_field: "(derived from project_name via toTextDomain)",
    required: false,
    default: null,
    description: "WordPress text domain, used in style.css and every __() / load_theme_textdomain() call.",
    example: "acme-portal",
    replaces_literal_token: "boilerplate-theme",
  },
  {
    variable: "slug",
    config_field: "(derived from project_name via toSlug — same value as text_domain, different literal token replaced)",
    required: false,
    default: null,
    description: "Bare handle/slug used for enqueue handles (e.g. '{slug}-style') and the block pattern category slug.",
    example: "acme-portal",
    replaces_literal_token: "boilerplate",
  },
  {
    variable: "pattern_category_label",
    config_field: "(derived from project_name — reuses the same value as project_name)",
    required: false,
    default: null,
    description: "Human label for the theme's registered block pattern category.",
    example: "Acme Portal",
    replaces_literal_token: "Boilerplate",
  },
  {
    variable: "constant_prefix",
    config_field: "(derived from project_name, upper snake case)",
    required: false,
    default: null,
    description: "Prefix for PHP constants (e.g. {PREFIX}_VERSION, {PREFIX}_DIR, {PREFIX}_URI).",
    example: "ACME_PORTAL",
    replaces_literal_token: "BOILERPLATE_THEME",
  },
  {
    variable: "author",
    config_field: "author",
    required: false,
    default: "Your Name",
    description: "Theme author shown in the style.css header.",
    example: "Jane Smith",
    replaces_literal_token: "Your Name",
  },
  {
    variable: "theme_uri",
    config_field: "theme_uri",
    required: false,
    default: "https://example.com",
    description: "Theme URI and Author URI shown in the style.css header (both use this one value).",
    example: "https://acmeagency.com",
    replaces_literal_token: "https://example.com",
  },
];
