# Project Knowledge Graph — Schema v1.0

Produced by `mcp-server/knowledge-graph.js`, exposed via the `wp_get_project_graph`
MCP tool. This is the Stage 1 Intelligence Layer deliverable: a single JSON
snapshot of a connected WordPress project's current state, so agents/advisors
can inspect before they generate or modify anything.

## Shape

```jsonc
{
  "schema_version": "1.0",
  "generated_at": "2026-07-28T12:00:00.000Z",

  "site": {
    "error": null,               // string | null — present if this section's fetch failed
    "data": {
      "title": "Acme Co",
      "description": "A site",
      "url": "https://acme.local",
      "timezone": "America/New_York"
    }
  },

  "post_types": {
    "error": null,
    "data": [
      { "slug": "post", "name": "Posts", "rest_base": "posts", "hierarchical": false },
      { "slug": "project", "name": "Projects", "rest_base": "projects", "hierarchical": false }
    ]
  },

  "taxonomies": {
    "error": null,
    "data": [
      { "slug": "category", "name": "Categories", "rest_base": "categories", "types": ["post"] }
    ]
  },

  "plugins": {
    "error": null,               // e.g. "WP REST API error 403..." if user lacks activate_plugins cap
    "data": [                    // ACTIVE plugins only — inactive plugins are filtered out
      { "plugin": "elementor/elementor.php", "name": "Elementor", "version": "3.20.0" }
    ]
  },

  "active_theme": {
    "error": null,
    "data": { "stylesheet": "boilerplate-theme", "name": "Boilerplate Theme" }
  },

  "rest_namespaces": {
    "error": null,
    "data": ["wp/v2", "wc/v3", "boilerplate/v1"]
  },

  "detected": {
    "acf":         { "active": true,  "plugin": "advanced-custom-fields-pro/acf.php" },
    "elementor":   { "active": true,  "plugin": "elementor/elementor.php" },
    "woocommerce": { "active": false, "plugin": null }
  }
}
```

## Rules for consumers

- **Always check `section.error` before reading `section.data`.** A `null`
  `data` with a non-null `error` means that section couldn't be fetched
  (missing capability, feature not active, endpoint unavailable) — it does
  NOT mean "this project has none of X." Treat it as "unknown," not "empty."
- **`detected.*` flags are derived only from the active plugins list.** If
  `plugins.error` is set, every `detected.*.active` will read `false` — this
  is a known limitation, not a signal that ACF/Elementor/WooCommerce are
  absent. Check `plugins.error` first if a `detected` flag looks surprising.
- **`plugins.data` contains active plugins only.** Inactive/disabled plugins
  are intentionally excluded — "what's actually running" is more useful to
  an agent than "what's installed."
- **`schema_version` will bump on any breaking shape change.** Consumers
  should branch on this field rather than assume the current shape forever.

## Explicitly out of scope for v1 (future extension points)

- **ACF field group contents** — only whether ACF itself is active is
  detected; the actual field groups on a CPT are not yet enumerated (would
  require a per-post-type schema call, deferred to keep v1 minimal).
- **Coding-convention / naming-style detection** — requires reading actual
  theme/plugin source files, not just REST data. This module is REST-only
  by design; style detection is a separate, later capability.
- **WooCommerce-specific detail** (product count, order volume, etc.) —
  only presence/version is captured; deeper Woo introspection can be added
  as its own section without changing this schema's other parts.
- **Historical diffing** — this is a single point-in-time snapshot. Storing
  and diffing snapshots over time is Stage 2 (Project & Client Memory), not
  this module's job.
