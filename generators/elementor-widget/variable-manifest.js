/**
 * Elementor Widget Generator — Variable Manifest.
 */

export const VARIABLE_MANIFEST = [
  {
    variable: "widget_name",
    config_field: "widget_name",
    required: true,
    default: null,
    description: "Human-readable widget name, used to derive slug, title, and class name.",
    example: "Testimonial Card",
  },
  {
    variable: "slug",
    config_field: "slug",
    required: false,
    default: "(derived from widget_name via toOptionCase)",
    description: "Machine slug returned by get_name() — Elementor's internal widget identifier.",
    example: "testimonial_card",
  },
  {
    variable: "title",
    config_field: "title",
    required: false,
    default: "(defaults to widget_name)",
    description: "Human title returned by get_title(), shown in the Elementor panel.",
    example: "Testimonial Card",
  },
  {
    variable: "icon",
    config_field: "icon",
    required: false,
    default: "eicon-info-circle",
    description: "Elementor icon slug returned by get_icon().",
    example: "eicon-testimonial",
  },
  {
    variable: "category",
    config_field: "category",
    required: false,
    default: "general",
    description: "Elementor widget category returned by get_categories().",
    example: "general",
  },
  {
    variable: "keywords",
    config_field: "keywords",
    required: false,
    default: "[]",
    description: "Search keywords for get_keywords() — NOT present in the base boilerplate widget; added by this generator when provided.",
    example: "['testimonial', 'quote', 'review']",
  },
  {
    variable: "widget_class_name",
    config_field: "(derived from the target project's namespace + widget_name)",
    required: false,
    default: null,
    description: "The generated PHP class name, prefixed by the target project's own namespace segment to avoid collisions with other plugins' widgets on the same site (Elementor widgets in this boilerplate are global classes, no PHP namespace).",
    example: "AcmeClientPortal_TestimonialCard_Widget",
  },
  {
    variable: "text_domain",
    config_field: "(auto-detected from the target project's main plugin file — NOT a config input)",
    required: false,
    default: null,
    description: "The target plugin's text domain, detected so generated labels use the correct domain.",
    example: "acme-client-portal",
  },
];
