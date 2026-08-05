# memory/

Created automatically by `mcp-server/memory-store.js` the first time a
snapshot is saved (via the `wp_snapshot_project` MCP tool). Contains one
subfolder per `client_id`/`project_id` scope, each with:

- `index.json` — lightweight metadata for every snapshot in that scope
- `snapshots/<id>.json` — one full snapshot record per file

This data is meant to be committed to git, the same way ACF local JSON
already is in `plugin-boilerplate/includes/acf-json` — reviewable in a
diff, reproducible on a fresh clone, no "what changed and when" drift.

See `docs/MEMORY-MODEL.md` for the full schema and rules.
