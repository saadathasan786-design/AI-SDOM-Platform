import { test } from "node:test";
import assert from "node:assert/strict";
import { runAdvisorWithReport } from "../index.js";
import { listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../framework/advisor-catalog.js";
import { analyzeWordPressHooksAndCore, wordpressHooksCoreAdvisor } from "../wordpress-hooks-core/wordpress-hooks-core-advisor.js";

function file(path, content) {
  return { path, content };
}

test("registration: the WordPress Hooks & Core Advisor is registered and discoverable", () => {
  assert.equal(isAvailable("wordpress-hooks-core"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "wordpress-hooks-core"));
});

test("discovery: appears alongside all seven pre-existing advisors, not replacing any of them", () => {
  const ids = listAdvisorCatalog().map((a) => a.id);
  assert.deepEqual(
    ids.sort(),
    [
      "accessibility",
      "architecture",
      "code-review",
      "performance",
      "security",
      "wordpress-security",
      "wordpress-performance",
      "wordpress-hooks-core",
    ].sort()
  );
});

test("metadata: exposes the correct id, category, inputRequirements, and supported severities", () => {
  const meta = getAdvisorMetadata("wordpress-hooks-core");
  assert.equal(meta.id, "wordpress-hooks-core");
  assert.equal(meta.category, "wordpress-hooks-core");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.supportedSeverities.sort(), ["critical", "info", "suggestion", "warning"].sort());
});

test("definition shape: matches the exact same shape every existing advisor uses", () => {
  assert.equal(wordpressHooksCoreAdvisor.id, "wordpress-hooks-core");
  assert.equal(typeof wordpressHooksCoreAdvisor.name, "string");
  assert.equal(typeof wordpressHooksCoreAdvisor.version, "string");
  assert.equal(typeof wordpressHooksCoreAdvisor.analyze, "function");
  assert.deepEqual(wordpressHooksCoreAdvisor.inputRequirements, ["sourceFiles"]);
});

test("detects a deprecated function call", async () => {
  const content = "<?php\nfunction h() {\n  $u = get_currentuserinfo();\n}";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "deprecated-function-usage");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("detects register_activation_hook() not using __FILE__", async () => {
  const content = "<?php\nregister_activation_hook( 'some-file.php', 'my_activate' );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "activation-hook-not-using-file-constant");
  assert.ok(finding);
});

test("does not flag register_activation_hook() correctly using __FILE__", async () => {
  const content = "<?php\nregister_activation_hook( __FILE__, 'my_activate' );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "activation-hook-not-using-file-constant"));
});

test("detects a plugin header missing Version and Text Domain", async () => {
  const content = "<?php\n/**\n * Plugin Name: My Plugin\n */";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "plugin-theme-header-incomplete");
  assert.ok(finding);
});

test("does not flag a complete plugin header", async () => {
  const content = "<?php\n/**\n * Plugin Name: My Plugin\n * Version: 1.0.0\n * Text Domain: my-plugin\n */";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "plugin-theme-header-incomplete"));
});

test("detects __() missing a text domain argument", async () => {
  const content = "<?php\necho __( 'Hello' );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "missing-text-domain"));
});

test("does not flag i18n calls that include a text domain", async () => {
  const content = "<?php\necho __( 'Hello', 'my-domain' );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "missing-text-domain"));
});

test("detects inconsistent text domains across i18n calls in one file", async () => {
  const content = "<?php\n__( 'a', 'domain-one' );\n__( 'b', 'domain-two' );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "inconsistent-text-domain"));
});

test("detects register_post_type() missing recommended args", async () => {
  const content = "<?php\nregister_post_type( 'book', array( 'label' => 'Books' ) );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "register-post-type-missing-recommended-args");
  assert.ok(finding);
  assert.deepEqual(finding.evidence.missing.sort(), ["capability_type", "show_in_rest", "supports"].sort());
});

test("does not flag register_post_type() with all recommended args present", async () => {
  const content =
    "<?php\nregister_post_type( 'book', array( 'show_in_rest' => true, 'capability_type' => 'post', 'supports' => array('title') ) );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "register-post-type-missing-recommended-args"));
});

test("detects register_taxonomy() missing show_in_rest", async () => {
  const content = "<?php\nregister_taxonomy( 'genre', 'book', array( 'label' => 'Genre' ) );";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "register-taxonomy-missing-recommended-args"));
});

test("detects the query_posts() anti-pattern", async () => {
  const content = "<?php\nfunction h() {\n  query_posts( 'category_name=news' );\n}";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "query-posts-anti-pattern"));
});

test("detects a hook callback argument-count mismatch", async () => {
  const content = "<?php\nadd_action( 'save_post', 'my_save_handler', 10, 3 );\nfunction my_save_handler( $post_id ) {}";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "hook-callback-arg-count-mismatch");
  assert.ok(finding);
  assert.equal(finding.evidence.acceptedArgs, 3);
  assert.equal(finding.evidence.declaredParamCount, 1);
});

test("does not flag a hook callback whose declared params match accepted_args", async () => {
  const content = "<?php\nadd_action( 'save_post', 'my_save_handler', 10, 3 );\nfunction my_save_handler( $post_id, $post, $update ) {}";
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "hook-callback-arg-count-mismatch"));
});

test("a genuinely modern, well-written sample plugin produces zero findings besides the summary", async () => {
  const content = `<?php
/**
 * Plugin Name: My Modern Plugin
 * Version: 1.0.0
 * Text Domain: my-modern-plugin
 */

register_activation_hook( __FILE__, 'my_plugin_activate' );
function my_plugin_activate() {}

add_action( 'init', 'my_plugin_register_cpt' );
function my_plugin_register_cpt() {
    register_post_type( 'book', array(
        'label' => __( 'Books', 'my-modern-plugin' ),
        'show_in_rest' => true,
        'capability_type' => 'post',
        'supports' => array( 'title', 'editor' ),
    ) );
    register_taxonomy( 'genre', 'book', array(
        'label' => __( 'Genres', 'my-modern-plugin' ),
        'show_in_rest' => true,
    ) );
}`;
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("modern.php", content)] });
  const nonSummary = findings.filter((f) => f.id !== "wordpress-hooks-core-scan-summary");
  assert.deepEqual(nonSummary, [], `expected zero non-summary findings, got: ${nonSummary.map((f) => f.id).join(", ")}`);
});

test("an intentionally outdated sample plugin triggers multiple applicable rules", async () => {
  const content = `<?php
/**
 * Plugin Name: My Old Plugin
 */
register_activation_hook( 'file.php', 'my_old_activate' );
function my_old_activate() {
    $info = get_currentuserinfo();
}
function my_old_search() {
    query_posts( 'category_name=news' );
}
function my_old_render() {
    echo __( 'Settings saved' );
}`;
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("outdated.php", content)] });
  const ids = findings.map((f) => f.id);
  assert.ok(ids.includes("deprecated-function-usage"));
  assert.ok(ids.includes("activation-hook-not-using-file-constant"));
  assert.ok(ids.includes("plugin-theme-header-incomplete"));
  assert.ok(ids.includes("query-posts-anti-pattern"));
  assert.ok(ids.includes("missing-text-domain"));
});

test("report structure: uses the exact same Advisor Report shape as every other advisor -- no invented fields", async () => {
  const report = await runAdvisorWithReport("wordpress-hooks-core", { sourceFiles: [file("a.php", "<?php\n$x=1;")] });
  assert.deepEqual(
    Object.keys(report).sort(),
    ["advisor", "success", "findings", "summary", "execution_ms", "timestamp", "error"].sort()
  );
});

test("uses only the existing severity vocabulary -- every finding's severity is one of info/suggestion/warning/critical", async () => {
  const content = `<?php
get_currentuserinfo();
query_posts('x');
register_post_type('book', array());
add_action('save_post', 'h', 10, 2);
function h($a) {}
__('str');`;
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [file("a.php", content)] });
  const validSeverities = new Set(["info", "suggestion", "warning", "critical"]);
  for (const f of findings) {
    assert.ok(validSeverities.has(f.severity), `unexpected severity: ${f.severity}`);
  }
});

test("never-throws: runAdvisorWithReport never throws for this advisor, even with malformed context", async () => {
  const report = await runAdvisorWithReport("wordpress-hooks-core", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("empty project: an empty sourceFiles array produces zero findings without error", async () => {
  const findings = await analyzeWordPressHooksAndCore({ sourceFiles: [] });
  assert.deepEqual(findings, []);

  const report = await runAdvisorWithReport("wordpress-hooks-core", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("malformed input: analyzeWordPressHooksAndCore handles sourceFiles being undefined gracefully (does not throw)", async () => {
  const findings = await analyzeWordPressHooksAndCore({});
  assert.deepEqual(findings, []);
});
