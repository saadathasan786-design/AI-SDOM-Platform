/**
 * Project Knowledge Graph — Stage 1 (Intelligence Layer, MVP).
 *
 * Aggregates the current state of a connected WordPress project into one
 * versioned JSON shape, so AI agents/advisors can "look before they touch"
 * instead of guessing or re-deriving this on every call.
 *
 * Design notes (read before extending):
 * - `wpRequest` is passed in rather than imported directly, so this module
 *   can be unit-tested with a fake client (see test/knowledge-graph.test.js)
 *   with no real WordPress site needed.
 * - Every section is fetched independently via Promise.allSettled. A site
 *   without WooCommerce, or a user without `activate_plugins` capability,
 *   should degrade that one section to `{ error: ... }` — not fail the
 *   whole graph. Callers should always check `section.error` before reading
 *   `section.data`.
 * - This is intentionally NOT a generic "call any endpoint" abstraction.
 *   It hard-codes the specific sections a v1 knowledge graph needs. If a
 *   6th, 7th, 8th section gets added ad hoc, that's a signal to revisit the
 *   shape — not a reason to add a config-driven plugin system prematurely.
 * - No naming-convention / coding-style detection in this version. That
 *   requires actually reading source files (theme/plugin repo), which this
 *   REST-only module can't do. Left as a documented extension point.
 */

export const SCHEMA_VERSION = "1.0";

// Plugin slugs (as they'd appear in the /wp/v2/plugins `plugin` field,
// formatted "folder/main-file.php") whose presence flips a derived flag.
// Matched by folder-name prefix so version-suffixed forks still match.
const DETECTORS = {
  acf: ["advanced-custom-fields", "advanced-custom-fields-pro", "secure-custom-fields"],
  elementor: ["elementor", "elementor-pro"],
  woocommerce: ["woocommerce"],
};

function matchesDetector(pluginKey, prefixes) {
  const folder = pluginKey.split("/")[0];
  return prefixes.some((p) => folder === p);
}

async function settle(promise) {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Build the knowledge graph for the currently-configured WP site.
 * @param {(path: string, opts?: object) => Promise<any>} wpRequest
 */
export async function buildProjectGraph(wpRequest) {
  const [site, postTypes, taxonomies, plugins, themes, rootIndex] = await Promise.all([
    settle(wpRequest("/wp/v2/settings")),
    settle(wpRequest("/wp/v2/types")),
    settle(wpRequest("/wp/v2/taxonomies")),
    settle(wpRequest("/wp/v2/plugins")),
    settle(wpRequest("/wp/v2/themes", { query: { status: "active" } })),
    settle(wpRequest("")),
  ]);

  const pluginList = Array.isArray(plugins.data) ? plugins.data : [];
  const activePlugins = pluginList.filter((p) => p.status === "active");
  const activePluginKeys = activePlugins.map((p) => p.plugin);

  const detected = {};
  for (const [flag, prefixes] of Object.entries(DETECTORS)) {
    const match = activePluginKeys.find((key) => matchesDetector(key, prefixes));
    detected[flag] = {
      active: Boolean(match),
      plugin: match || null,
    };
  }

  // Root index (`/wp-json`) lists every registered route keyed by path,
  // e.g. "/wp/v2/posts", "/wc/v3/products". Reduce to unique namespaces
  // ("wp/v2", "wc/v3", "boilerplate/v1") so callers get a quick map of
  // "what REST surfaces exist" without 200+ individual route entries.
  let namespaces = [];
  if (rootIndex.data && rootIndex.data.namespaces) {
    namespaces = rootIndex.data.namespaces;
  } else if (rootIndex.data && rootIndex.data.routes) {
    const set = new Set();
    for (const route of Object.keys(rootIndex.data.routes)) {
      const match = route.match(/^\/([^/]+\/v\d+)/);
      if (match) set.add(match[1]);
    }
    namespaces = [...set];
  }

  return {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),

    site: {
      error: site.error,
      data: site.data
        ? {
            title: site.data.title,
            description: site.data.description,
            url: site.data.url,
            timezone: site.data.timezone_string,
          }
        : null,
    },

    post_types: {
      error: postTypes.error,
      data: postTypes.data
        ? Object.values(postTypes.data).map((t) => ({
            slug: t.slug,
            name: t.name,
            rest_base: t.rest_base,
            hierarchical: t.hierarchical,
          }))
        : null,
    },

    taxonomies: {
      error: taxonomies.error,
      data: taxonomies.data
        ? Object.values(taxonomies.data).map((t) => ({
            slug: t.slug,
            name: t.name,
            rest_base: t.rest_base,
            types: t.types,
          }))
        : null,
    },

    // Requires the authenticated user to have `activate_plugins` capability.
    // If it errors (403), `detected.*` flags below will simply all read false
    // rather than crash the whole graph build.
    plugins: {
      error: plugins.error,
      data: plugins.error
        ? null
        : activePlugins.map((p) => ({ plugin: p.plugin, name: p.name, version: p.version })),
    },

    active_theme: {
      error: themes.error,
      data:
        !themes.error && Array.isArray(themes.data) && themes.data[0]
          ? { stylesheet: themes.data[0].stylesheet, name: themes.data[0].name?.rendered }
          : null,
    },

    rest_namespaces: {
      error: rootIndex.error,
      data: rootIndex.error ? null : namespaces,
    },

    detected,
  };
}
