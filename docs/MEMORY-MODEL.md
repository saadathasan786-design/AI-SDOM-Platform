# Project & Client Memory — Model v1.0

Implemented by `mcp-server/memory-store.js`, exposed via the `wp_snapshot_project`,
`memory_list_snapshots`, `memory_get_snapshot`, and `memory_diff_snapshots`
MCP tools. This is the Stage 2 Intelligence Layer deliverable: versioned,
diffable storage for facts already verified elsewhere (currently: Knowledge
Graph snapshots).

## What this module does and does not store

**Stores:** point-in-time snapshots of data that came from a real, checkable
source — right now, exclusively output from `buildProjectGraph()` (Stage 1).

**Never stores:** AI reasoning, speculative conclusions, "the agent thinks
X," draft plans, or anything not independently verifiable. This module has
no field for that and no code path that accepts it — `data` is stored
exactly as given, and the only thing this module adds is metadata about
*when* and *from what scope* it was captured, never an interpretation of it.

If a future stage wants to store agent reasoning, that's a different,
explicitly-labeled store — not a field bolted onto this one.

## Unified scope schema

```jsonc
{ "client_id": "acme",  "project_id": "siteA" }   // project, tied to a client
{ "client_id": "acme" }                            // client-level only (no specific project)
{ "project_id": "siteA" }                          // project-level only (no client tracked)
```

At least one of `client_id` / `project_id` must be present — enforced by
`validateScope()`, throws otherwise. There is no separate code path for
"client memory" vs "project memory": both use the exact same functions,
just with a different scope shape.

## Snapshot record shape

```jsonc
{
  "id": "snap_2026-07-28T12-00-00-000Z_a1b2c3d4",
  "timestamp": "2026-07-28T12:00:00.000Z",
  "memory_schema_version": "1.0",       // format of THIS record, not the data inside it
  "source": "knowledge-graph",          // free-text: what produced `data`
  "scope": { "client_id": "acme", "project_id": "siteA" },
  "hash": "sha256 hex of stable-stringified `data`",
  "data_schema_version": "1.0",         // pass-through from data.schema_version, or null
  "data": { /* whatever object was captured, e.g. a Knowledge Graph snapshot */ }
}
```

- **`hash`** is computed over a stable (key-sorted) JSON stringification, so
  identical content always hashes identically regardless of key order.
  Two snapshots with the same hash are content-identical even if their
  `id`/`timestamp` differ.
- **`memory_schema_version`** vs **`data_schema_version`** are deliberately
  separate: the first describes this module's own record format; the
  second is whatever schema version the stored data itself declares (e.g.
  the Knowledge Graph's `schema_version`). They will not always move
  together.

## Storage layout

```
memory/
  <client_id or "_no-client">/
    <project_id or "_client-level">/
      index.json              # array of snapshot metadata (no `data`), append-only
      snapshots/
        snap_<ts>_<hash8>.json   # one full record per snapshot
```

Scope segments are sanitized (`[^a-zA-Z0-9_-]` stripped) before being used
as directory names — a `project_id` like `../../etc` cannot escape the
`memory/` root.

## Diffing

`diffSnapshots({ scope, from_id, to_id })` returns:

```jsonc
{
  "from": { "id": "...", "timestamp": "...", "hash": "..." },
  "to":   { "id": "...", "timestamp": "...", "hash": "..." },
  "unchanged": false,
  "changes": {
    "post_types": { "before": [...], "after": [...] }
    // only keys that actually differ appear here
  }
}
```

The diff is **shallow and generic**: it compares top-level keys of whatever
`data` object was stored, via JSON equality. It has no special knowledge of
the Knowledge Graph's internal shape — it would work identically over any
other verified-fact object a future module hands it. `generated_at` (or any
field always guaranteed to differ) is excluded from the comparison so it
doesn't drown out real changes.

## Rules for consumers

- **Never write speculative data into `data`.** If you're tempted to store
  "the AI recommends X," that does not belong here.
- **Use `wp_snapshot_project`, not `wp_get_project_graph` alone, when the
  snapshot needs to be compared later.** The plain graph tool is stateless;
  only the snapshot tool persists.
- **`listSnapshots` returns metadata only** (no `data` field) — call
  `memory_get_snapshot` with a specific `id` to retrieve the full record.
- **Two identical-content snapshots are still two separate records** — this
  module does not deduplicate on save. If you need "don't save if nothing
  changed," compare hashes yourself before calling save (a future stage may
  add this as an optional flag, but it isn't v1 behavior).

## Explicitly out of scope for v1 (future extension points)

- **Snapshot pruning/retention policy** — snapshots accumulate forever; no
  automatic cleanup. Fine at current expected volume (manual/periodic
  snapshots, not per-request), revisit if volume grows.
- **Deep/structural diffing inside a section** (e.g. "which specific plugin
  version changed" rather than "the whole `plugins` array changed") — v1
  diff shows *that* a section changed and its before/after value; drilling
  into *what specifically* changed within a section is a future
  enhancement, not needed for the current roadmap stage.
- **Automatic dedup-on-save** — see above.
- **Cross-scope queries** ("show me every project for client X") — v1 only
  supports listing within one exact scope; an index-of-scopes would be a
  small addition later if needed.
