/**
 * REST API Generator — Variable Manifest.
 */

export const VARIABLE_MANIFEST = [
  {
    variable: "route_path",
    config_field: "route_path",
    required: true,
    default: null,
    description: "The route path, appended to the namespace, e.g. '/events/(?P<id>\\d+)'.",
    example: "/events/(?P<id>\\d+)",
  },
  {
    variable: "method",
    config_field: "method",
    required: true,
    default: null,
    description: "HTTP method: one of GET, POST, PUT, PATCH, DELETE.",
    example: "GET",
  },
  {
    variable: "namespace",
    config_field: "namespace",
    required: false,
    default: "(the target plugin's existing REST namespace, auto-detected)",
    description:
      "REST namespace/version. Defaults to the class's own detected namespace (uses `self::NAMESPACE_` " +
      "in generated code); an explicit override generates a literal string instead.",
    example: "acme-client-portal/v2",
  },
  {
    variable: "permission",
    config_field: "permission",
    required: false,
    default: "public",
    description: "'public' (permission_callback => '__return_true') or a WordPress capability string (e.g. 'edit_posts').",
    example: "edit_posts",
  },
  {
    variable: "callback_name",
    config_field: "callback_name",
    required: false,
    default: "(derived from method + route_path)",
    description: "The PHP callback method name generated for this route.",
    example: "get_event",
  },
  {
    variable: "args",
    config_field: "args",
    required: false,
    default: "[]",
    description:
      "Array of { name, type ('integer'|'string'|'boolean'|'number'), required?, default? }. " +
      "sanitize_callback/validate_callback are derived from type.",
    example: "[{ name: 'id', type: 'integer', required: true }]",
  },
  {
    variable: "target_cpt",
    config_field: "target_cpt",
    required: false,
    default: null,
    description:
      "If provided (and validated against the target's registered post types), generates a full " +
      "CRUD-shaped callback body for that CPT. If omitted, generates a correctly-wired stub with a " +
      "TODO marker instead of guessing business logic.",
    example: "event",
  },
  {
    variable: "include_acf",
    config_field: "include_acf",
    required: false,
    default: false,
    description: "When true (and target_cpt is set), includes ACF field data in GET response(s) via get_fields().",
    example: "true",
  },
];
