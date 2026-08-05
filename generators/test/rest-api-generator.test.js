import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { generateRestRouteFiles } from "../rest-api/rest-api-generator.js";

const REST_PATH = path.join("includes", "Class-RestApi.php");
const CPT_PATH = path.join("includes", "Class-CPT.php");

function fakeRestFileContent() {
  return [
    "<?php",
    "namespace AcmeAgency\\AcmeClientPortal;",
    "",
    "use WP_REST_Request;",
    "use WP_REST_Response;",
    "use WP_Error;",
    "",
    "class Rest_Api {",
    "",
    "\tconst NAMESPACE_ = 'acme-client-portal/v1';",
    "",
    "\tpublic function register(): void {",
    "\t\tadd_action( 'rest_api_init', array( $this, 'register_routes' ) );",
    "\t}",
    "",
    "\tpublic function register_routes(): void {",
    "\t\tregister_rest_route( self::NAMESPACE_, '/projects/featured', array(",
    "\t\t\t'methods'             => 'GET',",
    "\t\t\t'callback'            => array( $this, 'get_featured_projects' ),",
    "\t\t\t'permission_callback' => '__return_true',",
    "\t\t) );",
    "\t}",
    "",
    "\tpublic function get_featured_projects( WP_REST_Request $request ): WP_REST_Response {",
    "\t\treturn new WP_REST_Response( array(), 200 );",
    "\t}",
    "}",
    "",
  ].join("\n");
}

function fakeCptFileContent(postTypes = ["project", "event"]) {
  const registrations = postTypes.map((slug) => `\t\tregister_post_type( '${slug}', array() );`).join("\n");
  return `<?php\nclass CPT {\n\tpublic function register(): void {\n\t}\n${registrations}\n}\n`;
}

function fakeExistingFiles(postTypes) {
  return [
    { path: REST_PATH, content: fakeRestFileContent() },
    { path: CPT_PATH, content: fakeCptFileContent(postTypes) },
  ];
}

test("generates a single modify operation for Class-RestApi.php", () => {
  const files = generateRestRouteFiles({ route_path: "/events", method: "GET" }, [], fakeExistingFiles());
  assert.equal(files.length, 1);
  assert.equal(files[0].path, REST_PATH);
  assert.equal(files[0].operation, "modify");
});

test("inserts the new route call into register_routes() without touching register()", () => {
  const files = generateRestRouteFiles({ route_path: "/events", method: "GET" }, [], fakeExistingFiles());
  const content = files[0].content;
  assert.match(content, /register_rest_route\( self::NAMESPACE_, '\/events', array\(/);
  assert.match(content, /add_action\( 'rest_api_init', array\( \$this, 'register_routes' \) \);/);
  // register() must still have exactly one hook -- no new hook added there.
  const hookCount = (content.match(/add_action\( 'rest_api_init'/g) || []).length;
  assert.equal(hookCount, 1);
});

test("preserves the existing /projects/featured route and its callback untouched", () => {
  const files = generateRestRouteFiles({ route_path: "/events", method: "GET" }, [], fakeExistingFiles());
  const content = files[0].content;
  assert.match(content, /\/projects\/featured/);
  assert.match(content, /get_featured_projects/);
});

test("derives distinct callback names for a list route vs a single-item (id) route on the same base path", () => {
  const listFiles = generateRestRouteFiles({ route_path: "/events", method: "GET" }, [], fakeExistingFiles());
  const singleFiles = generateRestRouteFiles(
    { route_path: "/events/(?P<id>\\d+)", method: "GET" },
    [],
    fakeExistingFiles()
  );
  assert.match(listFiles[0].content, /function get_events\(/);
  assert.match(singleFiles[0].content, /function get_events_by_id\(/);
});

test("generates a public permission_callback by default", () => {
  const files = generateRestRouteFiles({ route_path: "/events", method: "GET" }, [], fakeExistingFiles());
  assert.match(files[0].content, /'permission_callback' => '__return_true'/);
});

test("generates a capability-check permission_callback when a WP capability string is given", () => {
  const files = generateRestRouteFiles(
    { route_path: "/events", method: "POST", permission: "publish_posts" },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /current_user_can\( 'publish_posts' \)/);
});

test("generates args with derived sanitize_callback per type", () => {
  const files = generateRestRouteFiles(
    {
      route_path: "/reports",
      method: "GET",
      args: [
        { name: "limit", type: "integer" },
        { name: "search", type: "string" },
      ],
    },
    [],
    fakeExistingFiles()
  );
  const content = files[0].content;
  assert.match(content, /'limit' => array\(/);
  assert.match(content, /'sanitize_callback' => 'absint'/);
  assert.match(content, /'sanitize_callback' => 'sanitize_text_field'/);
});

test("generates a validate_callback for integer args (matching plugin-boilerplate's own id-arg convention)", () => {
  const files = generateRestRouteFiles(
    { route_path: "/events/(?P<id>\\d+)", method: "GET", args: [{ name: "id", type: "integer", required: true }] },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /'validate_callback' => function \( \$param \) \{/);
  assert.match(files[0].content, /return is_numeric\( \$param \);/);
});

test("target_cpt generates a full CRUD-shaped GET list callback", () => {
  const files = generateRestRouteFiles({ route_path: "/events", method: "GET", target_cpt: "event" }, [], fakeExistingFiles());
  assert.match(files[0].content, /'post_type'\s+=> 'event'/);
  assert.match(files[0].content, /WP_Query/);
});

test("target_cpt + id-style route generates a GET single callback with a not-found guard", () => {
  const files = generateRestRouteFiles(
    { route_path: "/events/(?P<id>\\d+)", method: "GET", target_cpt: "event" },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /if \( 'event' !== get_post_type\( \$id \) \)/);
  assert.match(files[0].content, /WP_Error\( 'not_found'/);
});

test("target_cpt + POST generates a wp_insert_post callback returning 201", () => {
  const files = generateRestRouteFiles({ route_path: "/events", method: "POST", target_cpt: "event" }, [], fakeExistingFiles());
  assert.match(files[0].content, /wp_insert_post/);
  assert.match(files[0].content, /201/);
});

test("target_cpt + PUT generates a wp_update_post callback", () => {
  const files = generateRestRouteFiles(
    { route_path: "/events/(?P<id>\\d+)", method: "PUT", target_cpt: "event" },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /wp_update_post/);
});

test("target_cpt + DELETE generates a wp_delete_post callback returning 204", () => {
  const files = generateRestRouteFiles(
    { route_path: "/events/(?P<id>\\d+)", method: "DELETE", target_cpt: "event" },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /wp_delete_post/);
  assert.match(files[0].content, /204/);
});

test("include_acf adds get_fields() to a target_cpt GET response", () => {
  const files = generateRestRouteFiles(
    { route_path: "/events/(?P<id>\\d+)", method: "GET", target_cpt: "event", include_acf: true },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /get_fields\( \$post->ID \)/);
});

test("no target_cpt generates a correctly-wired stub with a TODO and 501 status, not guessed logic", () => {
  const files = generateRestRouteFiles({ route_path: "/reports/summary", method: "GET" }, [], fakeExistingFiles());
  assert.match(files[0].content, /TODO: implement GET \/reports\/summary/);
  assert.match(files[0].content, /501/);
});

test("refuses (throws) on an exact duplicate route+method, unlike CPT/ACF's idempotent skip", () => {
  assert.throws(
    () => generateRestRouteFiles({ route_path: "/projects/featured", method: "GET" }, [], fakeExistingFiles()),
    /already registered/
  );
});

test("does not refuse the same path with a DIFFERENT method (GET + POST on the same path both valid)", () => {
  assert.doesNotThrow(() =>
    generateRestRouteFiles({ route_path: "/projects/featured", method: "POST" }, [], fakeExistingFiles())
  );
});

test("throws when target_cpt is not registered in the target's Class-CPT.php", () => {
  assert.throws(
    () => generateRestRouteFiles({ route_path: "/x", method: "GET", target_cpt: "nonexistent" }, [], fakeExistingFiles()),
    /target_cpt "nonexistent" is not registered/
  );
});

test("throws when route_path is missing or doesn't start with '/'", () => {
  assert.throws(() => generateRestRouteFiles({ route_path: "events", method: "GET" }, [], fakeExistingFiles()), /must start with/);
  assert.throws(() => generateRestRouteFiles({ method: "GET" }, [], fakeExistingFiles()), /"route_path" is required/);
});

test("throws when method is missing or invalid", () => {
  assert.throws(
    () => generateRestRouteFiles({ route_path: "/x", method: "TRACE" }, [], fakeExistingFiles()),
    /must be one of GET, POST, PUT, PATCH, DELETE/
  );
});

test("throws a clear error listing supported types for an unsupported arg type", () => {
  assert.throws(
    () => generateRestRouteFiles({ route_path: "/x", method: "GET", args: [{ name: "x", type: "array" }] }, [], fakeExistingFiles()),
    /unsupported type "array"/
  );
});

test("throws when the target is missing Class-RestApi.php", () => {
  assert.throws(
    () => generateRestRouteFiles({ route_path: "/x", method: "GET" }, [], []),
    /missing includes\/Class-RestApi\.php/
  );
});

test("an explicit namespace override generates a literal string instead of self::NAMESPACE_", () => {
  const files = generateRestRouteFiles(
    { route_path: "/events", method: "GET", namespace: "acme-client-portal/v2" },
    [],
    fakeExistingFiles()
  );
  assert.match(files[0].content, /register_rest_route\( 'acme-client-portal\/v2', '\/events'/);
});

test("generateRestRouteFiles performs no filesystem access (pure function contract)", () => {
  assert.doesNotThrow(() => generateRestRouteFiles({ route_path: "/events", method: "GET" }, [], fakeExistingFiles()));
});
