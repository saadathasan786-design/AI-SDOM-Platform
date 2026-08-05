import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProjectGraph, SCHEMA_VERSION } from "../knowledge-graph.js";

// Fixture responses shaped like real WP REST output, keyed by path so the
// fake client can route without needing a real site.
const FIXTURES = {
  "/wp/v2/settings": {
    title: "Acme Co",
    description: "A site",
    url: "https://acme.local",
    timezone_string: "America/New_York",
  },
  "/wp/v2/types": {
    post: { slug: "post", name: "Posts", rest_base: "posts", hierarchical: false },
    page: { slug: "page", name: "Pages", rest_base: "pages", hierarchical: true },
    project: { slug: "project", name: "Projects", rest_base: "projects", hierarchical: false },
  },
  "/wp/v2/taxonomies": {
    category: { slug: "category", name: "Categories", rest_base: "categories", types: ["post"] },
    project_category: {
      slug: "project_category",
      name: "Project Categories",
      rest_base: "project-categories",
      types: ["project"],
    },
  },
  "/wp/v2/plugins": [
    { plugin: "advanced-custom-fields-pro/acf.php", name: "ACF PRO", version: "6.3.0", status: "active" },
    { plugin: "elementor/elementor.php", name: "Elementor", version: "3.20.0", status: "active" },
    { plugin: "woocommerce/woocommerce.php", name: "WooCommerce", version: "9.0.0", status: "active" },
    { plugin: "hello-dolly/hello.php", name: "Hello Dolly", version: "1.7.2", status: "inactive" },
  ],
  "/wp/v2/themes": [{ stylesheet: "boilerplate-theme", name: { rendered: "Boilerplate Theme" } }],
  "": {
    namespaces: ["wp/v2", "wc/v3", "boilerplate/v1"],
  },
};

function makeFakeWpRequest(overrides = {}) {
  return async (path) => {
    if (path in overrides) {
      const val = overrides[path];
      if (val instanceof Error) throw val;
      return val;
    }
    if (path in FIXTURES) return FIXTURES[path];
    throw new Error(`No fixture for path: ${path}`);
  };
}

test("builds a full graph with correct schema version and shape", async () => {
  const graph = await buildProjectGraph(makeFakeWpRequest());

  assert.equal(graph.schema_version, SCHEMA_VERSION);
  assert.ok(graph.generated_at);
  assert.equal(graph.site.data.title, "Acme Co");
  assert.equal(graph.post_types.data.length, 3);
  assert.equal(graph.taxonomies.data.length, 2);
  assert.equal(graph.active_theme.data.stylesheet, "boilerplate-theme");
  assert.deepEqual(graph.rest_namespaces.data, ["wp/v2", "wc/v3", "boilerplate/v1"]);
});

test("derives ACF / Elementor / WooCommerce detected flags from active plugins only", async () => {
  const graph = await buildProjectGraph(makeFakeWpRequest());

  assert.equal(graph.detected.acf.active, true);
  assert.equal(graph.detected.acf.plugin, "advanced-custom-fields-pro/acf.php");
  assert.equal(graph.detected.elementor.active, true);
  assert.equal(graph.detected.woocommerce.active, true);

  // Inactive plugin (Hello Dolly) must not appear in the active plugins list.
  assert.ok(!graph.plugins.data.some((p) => p.plugin.startsWith("hello-dolly")));
});

test("degrades gracefully when a section errors (e.g. missing capability or inactive feature)", async () => {
  const graph = await buildProjectGraph(
    makeFakeWpRequest({
      "/wp/v2/plugins": new Error("WP REST API error 403 on GET /wp/v2/plugins: forbidden"),
    })
  );

  assert.equal(graph.plugins.data, null);
  assert.match(graph.plugins.error, /403/);

  // Detected flags must all read false, not throw, when plugin list is unavailable.
  assert.equal(graph.detected.acf.active, false);
  assert.equal(graph.detected.elementor.active, false);
  assert.equal(graph.detected.woocommerce.active, false);

  // Other independent sections must still succeed.
  assert.equal(graph.site.error, null);
  assert.equal(graph.post_types.error, null);
});

test("handles a site with no custom taxonomies/CPTs (default WP install)", async () => {
  const graph = await buildProjectGraph(
    makeFakeWpRequest({
      "/wp/v2/types": {
        post: { slug: "post", name: "Posts", rest_base: "posts", hierarchical: false },
        page: { slug: "page", name: "Pages", rest_base: "pages", hierarchical: true },
      },
      "/wp/v2/plugins": [],
    })
  );

  assert.equal(graph.post_types.data.length, 2);
  assert.equal(graph.plugins.data.length, 0);
  assert.equal(graph.detected.acf.active, false);
});
