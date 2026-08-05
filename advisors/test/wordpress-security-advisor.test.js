import { test } from "node:test";
import assert from "node:assert/strict";
import { runAdvisorWithReport } from "../index.js";
import { listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../framework/advisor-catalog.js";
import { analyzeWordPressSecurity, wordpressSecurityAdvisor } from "../wordpress-security/wordpress-security-advisor.js";

function file(path, content) {
  return { path, content };
}

// ---------------------------------------------------------------------
// Registration / discovery / metadata
// ---------------------------------------------------------------------

test("registration: the WordPress Security Advisor is registered and discoverable", () => {
  assert.equal(isAvailable("wordpress-security"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "wordpress-security"));
});

test("discovery: appears alongside all six pre-existing advisors, not replacing any of them", () => {
  const ids = listAdvisorCatalog().map((a) => a.id);
  assert.deepEqual(
    ids.sort(),
    ["accessibility", "architecture", "code-review", "performance", "security", "wordpress-security", "wordpress-performance", "wordpress-hooks-core"].sort()
  );
});

test("metadata: exposes the correct id, category, inputRequirements, and supported severities", () => {
  const meta = getAdvisorMetadata("wordpress-security");
  assert.equal(meta.id, "wordpress-security");
  assert.equal(meta.category, "wordpress-security");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.supportedSeverities.sort(), ["critical", "info", "suggestion", "warning"].sort());
});

test("definition shape: matches the exact same shape every existing advisor uses", () => {
  assert.equal(wordpressSecurityAdvisor.id, "wordpress-security");
  assert.equal(typeof wordpressSecurityAdvisor.name, "string");
  assert.equal(typeof wordpressSecurityAdvisor.version, "string");
  assert.equal(typeof wordpressSecurityAdvisor.analyze, "function");
  assert.deepEqual(wordpressSecurityAdvisor.inputRequirements, ["sourceFiles"]);
});

// ---------------------------------------------------------------------
// Each detection rule -- real, targeted PHP samples
// ---------------------------------------------------------------------

test("detects missing nonce verification: $_POST usage with no wp_verify_nonce/check_admin_referer/check_ajax_referer anywhere in the file", async () => {
  const content = "<?php\nfunction h() {\n  $x = $_POST['x'];\n  update_option('y', $x);\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "missing-nonce-verification");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
  assert.equal(finding.location.line, 3);
});

test("does not flag missing nonce verification when wp_verify_nonce() is present anywhere in the file", async () => {
  const content = "<?php\nfunction h() {\n  if (!wp_verify_nonce($_POST['n'], 'a')) wp_die();\n  $x = $_POST['x'];\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "missing-nonce-verification"));
});

test("does not flag missing nonce verification when check_admin_referer() is present", async () => {
  const content = "<?php\nfunction h() {\n  check_admin_referer('a');\n  $x = $_POST['x'];\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "missing-nonce-verification"));
});

test("detects missing capability check: $_POST usage with no current_user_can() anywhere in the file", async () => {
  const content = "<?php\nfunction h() {\n  $x = $_POST['x'];\n  update_option('y', $x);\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "missing-capability-check");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
});

test("does not flag missing capability check when current_user_can() is present anywhere in the file", async () => {
  const content = "<?php\nfunction h() {\n  if (!current_user_can('manage_options')) wp_die();\n  $x = $_POST['x'];\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "missing-capability-check"));
});

test("detects a REST route with no permission_callback key at all", async () => {
  const content = `<?php
register_rest_route('ns/v1', '/items', array(
  'methods' => 'GET',
  'callback' => 'my_cb',
));`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "rest-route-missing-permission-callback");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
  assert.match(finding.message, /no "permission_callback" key at all/);
});

test("detects a REST route with permission_callback set to __return_true", async () => {
  const content = `<?php
register_rest_route('ns/v1', '/items', array(
  'methods' => 'GET',
  'callback' => 'my_cb',
  'permission_callback' => '__return_true',
));`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "rest-route-missing-permission-callback");
  assert.ok(finding);
  assert.match(finding.message, /__return_true/);
});

test("does not flag a REST route with a real permission_callback", async () => {
  const content = `<?php
register_rest_route('ns/v1', '/items', array(
  'methods' => 'GET',
  'callback' => 'my_cb',
  'permission_callback' => function() { return current_user_can('read'); },
));`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "rest-route-missing-permission-callback"));
});

test("detects an unprepared $wpdb query built from a variable", async () => {
  const content = `<?php
function h() {
  global $wpdb;
  $term = $_GET['term'];
  $r = $wpdb->get_results("SELECT * FROM t WHERE name = '" . $term . "'");
}`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "unprepared-sql-query");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
  assert.match(finding.message, /get_results/);
});

test("does not flag a $wpdb query that uses $wpdb->prepare()", async () => {
  const content = `<?php
function h() {
  global $wpdb;
  $id = absint($_GET['id']);
  $r = $wpdb->get_results($wpdb->prepare("SELECT * FROM t WHERE id = %d", $id));
}`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "unprepared-sql-query"));
});

test("does not flag a fully static $wpdb query with no variables", async () => {
  const content = `<?php
function h() {
  global $wpdb;
  $r = $wpdb->get_results("SELECT * FROM my_table WHERE active = 1");
}`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "unprepared-sql-query"));
});

test("detects unescaped output: a bare variable echoed directly", async () => {
  const content = "<?php\nfunction h() {\n  $name = get_the_title();\n  echo $name;\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "unescaped-output");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
  assert.equal(finding.location.line, 4);
});

test("does not flag output wrapped in esc_html()", async () => {
  const content = "<?php\nfunction h() {\n  $name = get_the_title();\n  echo esc_html($name);\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "unescaped-output"));
});

test("detects unsanitized $_GET usage on a line with no recognized sanitizing function", async () => {
  const content = "<?php\nfunction h() {\n  $term = $_GET['term'];\n}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "unsanitized-request-input");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
  assert.match(finding.message, /\$_GET/);
});

test("detects unsanitized $_POST and $_REQUEST usage as the same rule id", async () => {
  const content = "<?php\n$a = $_POST['a'];\n$b = $_REQUEST['b'];";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const unsanitized = findings.filter((f) => f.id === "unsanitized-request-input");
  assert.equal(unsanitized.length, 2);
});

test("does not flag $_GET/$_POST/$_REQUEST wrapped in a recognized sanitizing function on the same line", async () => {
  const content = "<?php\n$a = sanitize_text_field($_POST['a']);\n$b = absint($_GET['b']);\n$c = intval($_REQUEST['c']);";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "unsanitized-request-input"));
});

test("does not flag isset()/empty()/array_key_exists() guards over a superglobal as unsanitized (false-positive fix found via manual validation)", async () => {
  const content = "<?php\nif (isset($_POST['x'])) {}\nif (empty($_GET['y'])) {}\nif (array_key_exists('z', $_REQUEST)) {}";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "unsanitized-request-input"));
});

test("does not flag a raw superglobal value passed directly into wp_verify_nonce() (the correct idiomatic pattern)", async () => {
  const content = "<?php\nif (!wp_verify_nonce($_POST['my_nonce'], 'a')) wp_die();";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "unsanitized-request-input"));
});

// ---------------------------------------------------------------------
// Clean code / mixed code / multiple findings / summary
// ---------------------------------------------------------------------

test("a fully secure sample plugin produces zero findings besides the summary", async () => {
  const content = `<?php
function my_secure_handler() {
    if ( ! wp_verify_nonce( $_POST['my_nonce'], 'my_action' ) ) {
        wp_die( 'Invalid nonce' );
    }
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Unauthorized' );
    }
    $name = sanitize_text_field( $_POST['name'] );
    echo esc_html( $name );

    global $wpdb;
    $results = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}my_table WHERE id = %d", $name ) );
}

add_action( 'rest_api_init', function() {
    register_rest_route( 'my-plugin/v1', '/items', array(
        'methods' => 'GET',
        'callback' => 'my_get_items',
        'permission_callback' => function() {
            return current_user_can( 'read' );
        },
    ) );
} );`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("secure.php", content)] });
  const nonSummary = findings.filter((f) => f.id !== "wordpress-security-scan-summary");
  assert.deepEqual(nonSummary, [], `expected zero non-summary findings, got: ${nonSummary.map((f) => f.id).join(", ")}`);
});

test("an intentionally vulnerable plugin triggers every applicable rule with multiple findings", async () => {
  const content = `<?php
function my_insecure_handler() {
    $name = $_POST['name'];
    update_option( 'my_setting', $name );
}

function my_search_handler() {
    global $wpdb;
    $term = $_GET['term'];
    $results = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}my_table WHERE name = '" . $term . "'" );
    echo $results;
}

add_action( 'rest_api_init', function() {
    register_rest_route( 'my-plugin/v1', '/delete', array(
        'methods' => 'POST',
        'callback' => 'my_delete_item',
    ) );
    register_rest_route( 'my-plugin/v1', '/public', array(
        'methods' => 'GET',
        'callback' => 'my_public_item',
        'permission_callback' => '__return_true',
    ) );
} );`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("vuln.php", content)] });
  const ids = findings.map((f) => f.id);

  assert.ok(ids.includes("missing-nonce-verification"));
  assert.ok(ids.includes("missing-capability-check"));
  assert.ok(ids.includes("unprepared-sql-query"));
  assert.ok(ids.includes("unescaped-output"));
  assert.ok(ids.includes("unsanitized-request-input"));
  assert.equal(ids.filter((id) => id === "rest-route-missing-permission-callback").length, 2);
  assert.ok(findings.length > 6);
});

test("mixed code: a file with some secure and some insecure patterns produces only the findings for the insecure parts", async () => {
  const content = `<?php
function secure_part() {
  if (!current_user_can('manage_options')) wp_die();
  if (!wp_verify_nonce($_POST['n'], 'a')) wp_die();
  $x = sanitize_text_field($_POST['x']);
  echo esc_html($x);
}
function insecure_part() {
  echo $_GET['q'];
}`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("mixed.php", content)] });
  // The whole FILE has both nonce and capability checks present somewhere,
  // so the file-level nonce/capability rules correctly don't fire (they
  // check "anywhere in the file", matching the documented, honest
  // file-level scope of these two rules).
  assert.ok(!findings.some((f) => f.id === "missing-nonce-verification"));
  assert.ok(!findings.some((f) => f.id === "missing-capability-check"));
  // But the raw $_GET usage on its own line is still flagged.
  assert.ok(findings.some((f) => f.id === "unsanitized-request-input"));
});

test("multiple files: findings correctly attribute the right file path to each finding", async () => {
  const files = [
    file("a.php", "<?php\necho $_GET['x'];"),
    file("b.php", "<?php\necho $unescaped;"),
  ];
  const findings = await analyzeWordPressSecurity({ sourceFiles: files });
  const aFindings = findings.filter((f) => f.evidence?.path === "a.php" || f.location?.file === "a.php");
  const bFindings = findings.filter((f) => f.evidence?.path === "b.php" || f.location?.file === "b.php");
  assert.ok(aFindings.length > 0);
  assert.ok(bFindings.length > 0);
});

// ---------------------------------------------------------------------
// Summary generation / report structure (via the real Advisor Framework)
// ---------------------------------------------------------------------

test("summary generation: severity counts are derived exactly like every other advisor, via the unmodified Advisor Framework", async () => {
  const content = "<?php\necho $_GET['x'];\n$y = $_POST['y'];\n";
  const report = await runAdvisorWithReport("wordpress-security", { sourceFiles: [file("a.php", content)] });

  assert.equal(report.advisor, "wordpress-security");
  assert.equal(report.success, true);
  assert.deepEqual(report.summary, {
    info: report.findings.filter((f) => f.severity === "info").length,
    suggestion: report.findings.filter((f) => f.severity === "suggestion").length,
    warning: report.findings.filter((f) => f.severity === "warning").length,
    critical: report.findings.filter((f) => f.severity === "critical").length,
  });
});

test("report structure: uses the exact same Advisor Report shape as every other advisor -- no invented fields", async () => {
  const report = await runAdvisorWithReport("wordpress-security", { sourceFiles: [file("a.php", "<?php\n$x=1;")] });
  assert.deepEqual(
    Object.keys(report).sort(),
    ["advisor", "success", "findings", "summary", "execution_ms", "timestamp", "error"].sort()
  );
});

test("finding structure: every finding uses the exact same shape as every other advisor's findings -- no invented top-level fields (no title/description/filename)", async () => {
  const content = "<?php\necho $_GET['x'];";
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const realFinding = findings.find((f) => f.id === "unsanitized-request-input");
  assert.ok(realFinding);
  assert.equal(typeof realFinding.id, "string");
  assert.equal(typeof realFinding.severity, "string");
  assert.equal(typeof realFinding.category, "string");
  assert.equal(typeof realFinding.message, "string");
  assert.equal(typeof realFinding.recommendation.message, "string");
  assert.equal(typeof realFinding.location.file, "string");
  assert.equal(typeof realFinding.location.line, "number");
  assert.deepEqual(
    Object.keys(realFinding).sort(),
    ["id", "severity", "category", "message", "recommendation", "evidence", "location"].sort()
  );
});

test("uses only the existing severity vocabulary -- every finding's severity is one of info/suggestion/warning/critical", async () => {
  const content = `<?php
function h() {
  $x = $_POST['x'];
  echo $x;
  global $wpdb;
  $wpdb->query("DELETE FROM t WHERE id = " . $x);
}
register_rest_route('ns', '/r', array('permission_callback' => '__return_true'));`;
  const findings = await analyzeWordPressSecurity({ sourceFiles: [file("a.php", content)] });
  const validSeverities = new Set(["info", "suggestion", "warning", "critical"]);
  for (const f of findings) {
    assert.ok(validSeverities.has(f.severity), `unexpected severity: ${f.severity}`);
  }
});

// ---------------------------------------------------------------------
// Never-throws wrapper / malformed input / empty project
// ---------------------------------------------------------------------

test("never-throws: runAdvisorWithReport never throws for this advisor, even with malformed context", async () => {
  const report = await runAdvisorWithReport("wordpress-security", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("empty project: an empty sourceFiles array produces zero findings without error", async () => {
  const findings = await analyzeWordPressSecurity({ sourceFiles: [] });
  assert.deepEqual(findings, []);

  const report = await runAdvisorWithReport("wordpress-security", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("malformed input: analyzeWordPressSecurity handles sourceFiles being undefined gracefully (does not throw)", async () => {
  const findings = await analyzeWordPressSecurity({});
  assert.deepEqual(findings, []);
});
