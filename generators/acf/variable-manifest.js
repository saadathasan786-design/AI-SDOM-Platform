/**
 * ACF Field Group Generator — Variable Manifest.
 *
 * Like the CPT+Taxonomy Generator, most values here are DERIVED from
 * config or AUTO-DETECTED from the target project, not substituted from a
 * fixed template — this generator synthesizes a new PHP method matching
 * plugin-boilerplate's Class-ACF.php style.
 */

export const VARIABLE_MANIFEST = [
  {
    variable: "group_title",
    config_field: "group_title",
    required: true,
    default: null,
    description: "Human-readable ACF field group title, shown in wp-admin.",
    example: "Event Details",
  },
  {
    variable: "group_key",
    config_field: "(derived from group_title via toOptionCase)",
    required: false,
    default: null,
    description: "ACF field group key (acf_add_local_field_group's 'key'), e.g. 'group_event_details'.",
    example: "group_event_details",
  },
  {
    variable: "target_cpt",
    config_field: "target_cpt",
    required: true,
    default: null,
    description:
      "The post_type slug this field group attaches to via a location rule. Must already be " +
      "registered in the target project's Class-CPT.php — validated against it, not assumed.",
    example: "event",
  },
  {
    variable: "fields",
    config_field: "fields",
    required: true,
    default: null,
    description:
      "Array of { label (required), name (optional, derived from label), type (required, one of " +
      "the supported ACF field types) }.",
    example: "[{ label: 'Event Date', type: 'date_picker' }]",
  },
  {
    variable: "field_key",
    config_field: "(derived per-field from target_cpt + field name, matching plugin-boilerplate's own convention)",
    required: false,
    default: null,
    description: "Each field's ACF key, e.g. 'field_event_event_date' (prefixed by the TARGET CPT slug, not the group slug).",
    example: "field_event_event_date",
  },
];
