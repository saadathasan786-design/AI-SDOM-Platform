# wp-mcp-server

A minimal MCP server that lets Claude read/write your WordPress site through
the built-in WP REST API, using an **Application Password** for auth. Works
against Local by Flywheel sites and live sites alike — just point it at a
different `WP_BASE_URL`.

## Why Application Passwords (not a custom auth plugin)

WordPress core has shipped Application Passwords since 5.6. No extra plugin
needed. Each app/tool gets its own revocable password, scoped to one WP user
account, and every request is logged like normal REST traffic. This is the
lowest-friction, most maintainable way to let an external tool (Claude) act
as a WP admin.

## Setup

1. In Local by Flywheel, start your site and open WP Admin.
2. Go to **Users → Profile → Application Passwords**, enter a name like
   `claude-mcp`, click **Add New Application Password**, and copy the
   generated password (spaces included).
3. In this folder:
   ```bash
   npm install
   cp .env.example .env
   ```
4. Fill in `.env`:
   - `WP_BASE_URL` — your Local site URL, e.g. `https://mysite.local`
   - `WP_USERNAME` — your admin username
   - `WP_APP_PASSWORD` — the password from step 2
   - `WP_ALLOW_SELF_SIGNED=true` (Local's cert is self-signed — keep this
     `false`/unset for any live site)

## Registering it with Claude Desktop

Add this to your Claude Desktop MCP config (Settings → Developer → Edit
Config), adjusting the path to where you cloned this boilerplate:

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/absolute/path/to/wp-dev-boilerplate/mcp-server/index.js"]
    }
  }
}
```

Restart Claude Desktop. You should see `wordpress` listed as an available
MCP server with tools like `wp_list_posts`, `wp_create_post`,
`wp_upload_media`, etc.

## Project Knowledge Graph

`wp_get_project_graph` builds one snapshot of the connected site's post
types, taxonomies, active plugins, active theme, REST namespaces, and
derived flags (ACF / Elementor / WooCommerce detected). See
`docs/KNOWLEDGE-GRAPH-SCHEMA.md` for the full shape and consumer rules.

Call this before generating or modifying anything on a project you haven't
inspected yet in the current session — the point is to look before you
touch, not to re-derive project state from memory or assumptions.

Run `npm test` in this folder to run the knowledge-graph unit tests (fixture
data, no live WP site required).

## Project & Client Memory

`wp_snapshot_project` builds a Knowledge Graph and persists it to
`memory/` in one step, scoped by optional `client_id`/`project_id`.
`memory_list_snapshots`, `memory_get_snapshot`, and `memory_diff_snapshots`
retrieve and compare stored snapshots. See `docs/MEMORY-MODEL.md` for the
full schema — this store keeps verified facts only, never AI reasoning or
speculative conclusions.

## Governed Elementor document editing

`wp_elementor_inspect` and `wp_elementor_patch` are a governed, reversible way
to read and edit the Elementor content of an existing page through the
standard WP REST API (`GET/POST /wp/v2/pages/{id}` with the writable
`meta._elementor_data` field). The Elementor plugin itself exposes no REST
endpoint to read or update an existing document's `_elementor_data` on this
site, so this is the supported surface (see ADR AI-SDOM-ADR-0001 and
PRC AI-SDOM-PRC-0004).

- `wp_elementor_inspect` reads the document, returns its stable SHA-256, and
  optionally the settings of one element. Read-only.
- `wp_elementor_patch` performs the governed inspect -> snapshot -> validate
  -> (dry-run | write -> verify -> rollback) cycle for a single property of a
  single element. Use `dry_run: true` to preview without writing, and pass the
  `expected_baseline_sha256` from a prior inspect to guard against stale
  writes.

Safety guards enforced by the service (`mcp-server/elementor.js`):

- **Read validation** — a page whose `_elementor_data` does not read back as a
  complete, parseable array (e.g. a server-truncated value) is refused; the
  tool never operates on partial data.
- **Minimal-diff / structural guard** — only the targeted property of the
  targeted element changes; any change to element ids, order, counts, types,
  `__globals__` keys, or image ids is refused unless `allow_structural` is
  explicit.
- **Stale-baseline guard** — a write whose expected SHA-256 does not match the
  current document aborts.
- **Dry-run** — reports the computed change without writing.
- **Verify + rollback** — after writing, the document is re-read and its hash
  checked; on mismatch the pre-write document is restored.

Run `npm test` in this folder to run the unit and read-only live-invocation
tests for this capability.

## Extending it

- **WooCommerce**: install/activate WooCommerce, then use `wp_rest_request`
  with paths like `/wc/v3/products` — the WooCommerce REST API is namespaced
  separately from core (`/wc/v3/...`) and needs its own **Consumer
  Key/Secret** (WooCommerce → Settings → Advanced → REST API) rather than an
  Application Password. Swap the auth header in `wp-client.js` for
  `wc/v3` calls, or run a second client instance.
- **wp-cli via SSH**: Local exposes a shell per site (right-click site →
  "Open Site Shell"). If you need `wp-cli` power (search-replace, cron,
  transients) rather than REST-shaped operations, add a `wp_cli` tool that
  shells out to `wp <command>` inside that site's PHP container instead of
  hitting REST.
- **Binary media uploads**: the `wp_upload_media` tool above is JSON-based
  for simplicity. For real files, POST raw bytes to `/wp/v2/media` with a
  `Content-Disposition: attachment; filename="x.jpg"` header instead of a
  JSON body — swap that in `wp-client.js` when you need it.

## Security notes

- Never commit `.env`.
- Use a dedicated WP user (not your personal admin account) for the
  Application Password where possible, so you can restrict/revoke access
  cleanly.
- Only set `WP_ALLOW_SELF_SIGNED=true` for local dev.
