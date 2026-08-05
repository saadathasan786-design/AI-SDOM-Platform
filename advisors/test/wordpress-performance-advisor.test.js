import { test } from "node:test";
import assert from "node:assert/strict";
import { runAdvisorWithReport } from "../index.js";
import { listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../framework/advisor-catalog.js";
import { analyzeWordPressPerformance, wordpressPerformanceAdvisor } from "../wordpress-performance/wordpress-performance-advisor.js";

function file(path, content) {
  return { path, content };
}

// ---------------------------------------------------------------------
// Registration / discovery / metadata
// ---------------------------------------------------------------------

test("registration: the WordPress Performance Advisor is registered and discoverable", () => {
  assert.equal(isAvailable("wordpress-performance"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "wordpress-performance"));
});

test("discovery: appears alongside all six pre-existing advisors, not replacing any of them", () => {
  const ids = listAdvisorCatalog().map((a) => a.id);
  assert.deepEqual(
    ids.sort(),
    ["accessibility", "architecture", "code-review", "performance", "security", "wordpress-security", "wordpress-performance", "wordpress-hooks-core"].sort()
  );
});

test("metadata: exposes the correct id, category, inputRequirements, and supported severities", () => {
  const meta = getAdvisorMetadata("wordpress-performance");
  assert.equal(meta.id, "wordpress-performance");
  assert.equal(meta.category, "wordpress-performance");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
  assert.deepEqual(meta.supportedSeverities.sort(), ["critical", "info", "suggestion", "warning"].sort());
});

test("definition shape: matches the exact same shape every existing advisor uses", () => {
  assert.equal(wordpressPerformanceAdvisor.id, "wordpress-performance");
  assert.equal(typeof wordpressPerformanceAdvisor.name, "string");
  assert.equal(typeof wordpressPerformanceAdvisor.version, "string");
  assert.equal(typeof wordpressPerformanceAdvisor.analyze, "function");
  assert.deepEqual(wordpressPerformanceAdvisor.inputRequirements, ["sourceFiles"]);
});

test("is a completely separate advisor definition from both the generic Performance Advisor and the WordPress Security Advisor", () => {
  assert.notEqual(wordpressPerformanceAdvisor.id, "performance");
  assert.notEqual(wordpressPerformanceAdvisor.id, "wordpress-security");
});

// ---------------------------------------------------------------------
// Each detection rule -- real, targeted PHP samples
// ---------------------------------------------------------------------

test("detects repeated get_post_meta() lookups of the same key in one file", async () => {
  const content = "<?php\nfunction h($id) {\n  $a = get_post_meta($id, 'x', true);\n  $b = get_post_meta($id, 'x', true);\n}";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "repeated-meta-lookup");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
  assert.equal(finding.evidence.occurrences.length, 2);
});

test("detects repeated get_user_meta() lookups of the same key", async () => {
  const content = "<?php\n$a = get_user_meta($id, 'y', true);\n$b = get_user_meta($id, 'y', true);";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "repeated-meta-lookup" && f.evidence.functionName === "get_user_meta"));
});

test("detects repeated get_option() reads of the same option", async () => {
  const content = "<?php\nif (get_option('z') === 'yes') {}\n$v = get_option('z');";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "repeated-meta-lookup" && f.evidence.functionName === "get_option"));
});

test("does not flag a single (non-repeated) meta/option lookup", async () => {
  const content = "<?php\n$a = get_post_meta($id, 'x', true);\n$b = get_option('y');";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "repeated-meta-lookup"));
});

test("does not double-count different keys as repeated", async () => {
  const content = "<?php\n$a = get_option('x');\n$b = get_option('y');";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "repeated-meta-lookup"));
});

test("detects a get_post_meta() call inside a foreach loop (N+1)", async () => {
  const content = "<?php\nfunction h($ids) {\n  foreach ($ids as $id) {\n    $x = get_post_meta($id, 'k', true);\n  }\n}";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "query-in-loop");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
  assert.equal(finding.evidence.loopType, "foreach");
});

test("detects a new WP_Query() call inside a for loop", async () => {
  const content = "<?php\nfunction h($n) {\n  for ($i = 0; $i < $n; $i++) {\n    $q = new WP_Query( array('post_type' => 'post') );\n  }\n}";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "query-in-loop" && f.evidence.loopType === "for"));
});

test("detects a $wpdb query call inside a while loop", async () => {
  const content = "<?php\nfunction h() {\n  global $wpdb;\n  while ($cond) {\n    $wpdb->get_results('SELECT 1');\n  }\n}";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(findings.some((f) => f.id === "query-in-loop" && f.evidence.loopType === "while"));
});

test("does not flag a loop whose body has no query/meta/option call", async () => {
  const content = "<?php\nfunction h($items) {\n  foreach ($items as $item) {\n    echo esc_html($item);\n  }\n}";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "query-in-loop"));
});

test("does not flag a query call that happens outside any loop", async () => {
  const content = "<?php\nfunction h($id) {\n  $x = get_post_meta($id, 'k', true);\n}\nfunction g($items) {\n  foreach ($items as $i) { echo $i; }\n}";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "query-in-loop"));
});

test("detects a WP_Query missing posts_per_page/numberposts", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'post_type' => 'post' ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "wp-query-missing-limit");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("does not flag WP_Query with posts_per_page set", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'posts_per_page' => 10 ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "wp-query-missing-limit"));
});

test("does not flag WP_Query with numberposts set", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'numberposts' => 10 ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "wp-query-missing-limit"));
});

test("detects a WP_Query missing no_found_rows as a suggestion (not a warning)", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'posts_per_page' => 10 ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "wp-query-missing-no-found-rows");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("does not flag WP_Query with no_found_rows explicitly set", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'posts_per_page' => 10, 'no_found_rows' => true ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "wp-query-missing-no-found-rows"));
});

test("a WP_Query with an explicit, tight limit still gets a suggestion (not warning) for missing no_found_rows -- confirms the 'consider, not must-fix' severity choice found during manual validation", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'posts_per_page' => 5, 'fields' => 'ids' ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "wp-query-missing-limit"));
  const finding = findings.find((f) => f.id === "wp-query-missing-no-found-rows");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("detects orderby => 'rand' in a WP_Query", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'posts_per_page' => 5, 'orderby' => 'rand' ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  const finding = findings.find((f) => f.id === "expensive-random-order");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("does not flag a normal orderby value", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'posts_per_page' => 5, 'orderby' => 'date' ) );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "expensive-random-order"));
});

// ---------------------------------------------------------------------
// Clean code / inefficient code / mixed code / false-positive prevention
// ---------------------------------------------------------------------

test("a genuinely efficient sample plugin produces zero findings besides the summary", async () => {
  const content = `<?php
function my_efficient_render($post_ids) {
    $query = new WP_Query( array(
        'post__in' => $post_ids,
        'posts_per_page' => 10,
        'no_found_rows' => true,
    ) );

    $cached_setting = get_option( 'my_plugin_setting' );

    foreach ( $query->posts as $post ) {
        echo esc_html( $post->post_title );
    }
}

function my_get_meta_once( $post_id ) {
    $value = get_post_meta( $post_id, 'my_key', true );
    return $value;
}`;
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("efficient.php", content)] });
  const nonSummary = findings.filter((f) => f.id !== "wordpress-performance-scan-summary");
  assert.deepEqual(nonSummary, [], `expected zero non-summary findings, got: ${nonSummary.map((f) => f.id).join(", ")}`);
});

test("an intentionally inefficient sample plugin triggers every applicable rule", async () => {
  const content = `<?php
function my_inefficient_render($post_ids) {
    foreach ( $post_ids as $post_id ) {
        $title = get_post_meta( $post_id, 'custom_title', true );
        echo $title;
    }
}

function my_repeated_option_reads() {
    if ( get_option( 'my_setting' ) === 'yes' ) {
        do_thing();
    }
    $value = get_option( 'my_setting' );
    return $value;
}

function my_search() {
    $query = new WP_Query( array(
        'post_type' => 'product',
        'orderby' => 'rand',
    ) );
    return $query;
}`;
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("inefficient.php", content)] });
  const ids = findings.map((f) => f.id);

  assert.ok(ids.includes("repeated-meta-lookup"));
  assert.ok(ids.includes("query-in-loop"));
  assert.ok(ids.includes("wp-query-missing-limit"));
  assert.ok(ids.includes("wp-query-missing-no-found-rows"));
  assert.ok(ids.includes("expensive-random-order"));
  assert.equal(findings.length, 6);
});

test("mixed code: a file with both efficient and inefficient parts only flags the inefficient parts", async () => {
  const content = `<?php
function efficient_part($id) {
  $x = get_post_meta($id, 'k', true);
  echo esc_html($x);
}
function inefficient_part($ids) {
  foreach ($ids as $id) {
    $y = get_post_meta($id, 'j', true);
  }
}`;
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("mixed.php", content)] });
  assert.ok(findings.some((f) => f.id === "query-in-loop"));
  assert.ok(!findings.some((f) => f.id === "repeated-meta-lookup"));
});

test("false-positive prevention: an update_meta_cache() call itself is never mistakenly flagged", async () => {
  const content = `<?php
function h($post_ids) {
  update_meta_cache( 'post', $post_ids );
  foreach ( $post_ids as $post_id ) {
    $title = get_post_meta( $post_id, 'title', true );
    echo esc_html( $title );
  }
}`;
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  assert.ok(!findings.some((f) => f.id === "repeated-meta-lookup" && f.evidence.functionName === "update_meta_cache"));
});

test("multiple files: findings correctly attribute the right file path to each finding", async () => {
  const files = [
    file("a.php", "<?php\nforeach ($ids as $id) { get_post_meta($id, 'k', true); }"),
    file("b.php", "<?php\n$q = new WP_Query( array() );"),
  ];
  const findings = await analyzeWordPressPerformance({ sourceFiles: files });
  const aFindings = findings.filter((f) => f.location?.file === "a.php");
  const bFindings = findings.filter((f) => f.location?.file === "b.php");
  assert.ok(aFindings.length > 0);
  assert.ok(bFindings.length > 0);
});

// ---------------------------------------------------------------------
// Summary generation / report structure (via the real Advisor Framework)
// ---------------------------------------------------------------------

test("summary generation: severity counts are derived exactly like every other advisor, via the unmodified Advisor Framework", async () => {
  const content = "<?php\n$q = new WP_Query( array( 'orderby' => 'rand' ) );";
  const report = await runAdvisorWithReport("wordpress-performance", { sourceFiles: [file("a.php", content)] });

  assert.equal(report.advisor, "wordpress-performance");
  assert.equal(report.success, true);
  assert.deepEqual(report.summary, {
    info: report.findings.filter((f) => f.severity === "info").length,
    suggestion: report.findings.filter((f) => f.severity === "suggestion").length,
    warning: report.findings.filter((f) => f.severity === "warning").length,
    critical: report.findings.filter((f) => f.severity === "critical").length,
  });
});

test("report structure: uses the exact same Advisor Report shape as every other advisor -- no invented fields", async () => {
  const report = await runAdvisorWithReport("wordpress-performance", { sourceFiles: [file("a.php", "<?php\n$x=1;")] });
  assert.deepEqual(
    Object.keys(report).sort(),
    ["advisor", "success", "findings", "summary", "execution_ms", "timestamp", "error"].sort()
  );
});

test("finding structure: every finding uses the exact same shape as every other advisor's findings -- no invented top-level fields", async () => {
  const content = "<?php\n$q = new WP_Query( array() );";
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  const realFinding = findings.find((f) => f.id === "wp-query-missing-limit");
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
function h($ids) {
  foreach ($ids as $id) {
    get_post_meta($id, 'k', true);
  }
  $q = new WP_Query( array( 'orderby' => 'rand' ) );
}
$a = get_option('x');
$b = get_option('x');`;
  const findings = await analyzeWordPressPerformance({ sourceFiles: [file("a.php", content)] });
  const validSeverities = new Set(["info", "suggestion", "warning", "critical"]);
  for (const f of findings) {
    assert.ok(validSeverities.has(f.severity), `unexpected severity: ${f.severity}`);
  }
});

// ---------------------------------------------------------------------
// Never-throws wrapper / malformed input / empty project
// ---------------------------------------------------------------------

test("never-throws: runAdvisorWithReport never throws for this advisor, even with malformed context", async () => {
  const report = await runAdvisorWithReport("wordpress-performance", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("empty project: an empty sourceFiles array produces zero findings without error", async () => {
  const findings = await analyzeWordPressPerformance({ sourceFiles: [] });
  assert.deepEqual(findings, []);

  const report = await runAdvisorWithReport("wordpress-performance", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("malformed input: analyzeWordPressPerformance handles sourceFiles being undefined gracefully (does not throw)", async () => {
  const findings = await analyzeWordPressPerformance({});
  assert.deepEqual(findings, []);
});
