/**
 * Plugin Generator — Variable Manifest.
 *
 * Every variable this generator can substitute into plugin-boilerplate/,
 * in one discoverable place. If a future maintainer adds a new
 * substitution, add it here too — this manifest is what
 * docs/PLUGIN-GENERATOR.md and any future "list supported variables"
 * tooling reads from, so it must stay in sync with the actual
 * replacements applied in plugin-generator.js.
 */

export const VARIABLE_MANIFEST = [
  {
    variable: "project_name",
    config_field: "project_name",
    required: true,
    default: null,
    description: "Human-readable plugin name, shown in the WP admin plugin list and plugin header.",
    example: "Acme Client Portal",
    replaces_literal_token: "Boilerplate Plugin",
  },
  {
    variable: "text_domain",
    config_field: "(derived from project_name via toTextDomain)",
    required: false,
    default: null,
    description: "WordPress text domain and plugin slug.",
    example: "acme-client-portal",
    replaces_literal_token: "boilerplate-plugin",
  },
  {
    variable: "namespace",
    config_field: "(derived from vendor_name + project_name via buildPsr4Namespace)",
    required: false,
    default: null,
    description: "PSR-4 PHP namespace used throughout includes/.",
    example: "AcmeAgency\\AcmeClientPortal",
    replaces_literal_token: "Boilerplate\\Plugin",
  },
  {
    variable: "constant_prefix",
    config_field: "(derived from project_name, upper snake case)",
    required: false,
    default: null,
    description: "Prefix for PHP constants (e.g. {PREFIX}_VERSION, {PREFIX}_DIR).",
    example: "ACME_CLIENT_PORTAL",
    replaces_literal_token: "BOILERPLATE_PLUGIN",
  },
  {
    variable: "option_prefix",
    config_field: "(derived from project_name, lower snake case)",
    required: false,
    default: null,
    description: "Prefix for wp_options keys stored by the plugin.",
    example: "acme_client_portal",
    replaces_literal_token: "boilerplate_plugin",
  },
  {
    variable: "vendor_slug",
    config_field: "vendor_name",
    required: false,
    default: "Vendor",
    description: "Composer vendor segment, e.g. 'acme-agency/acme-client-portal'.",
    example: "acme-agency",
    replaces_literal_token: "yourname",
  },
  {
    variable: "author",
    config_field: "author",
    required: false,
    default: "Your Name",
    description: "Plugin author shown in the plugin header.",
    example: "Jane Smith",
    replaces_literal_token: "Your Name",
  },
  {
    variable: "plugin_uri",
    config_field: "plugin_uri",
    required: false,
    default: "https://example.com",
    description: "Plugin URI shown in the plugin header.",
    example: "https://acmeagency.com",
    replaces_literal_token: "https://example.com",
  },
];
