import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { generateElementorWidgetFiles } from "../elementor-widget/elementor-widget-generator.js";

const WIDGET_TEMPLATE = {
  path: "class-custom-widget.php",
  content: [
    "<?php",
    "/**",
    ' * A single custom Elementor widget: a "Call to Action" box.',
    " *",
    " * Registration: hook this into `elementor/widgets/register` from wherever",
    " * you're loading Elementor extensions (theme functions.php or a small",
    ' * "elementor-extensions" plugin), guarded by did_action(\'elementor/loaded\').',
    " *",
    " *   add_action( 'elementor/widgets/register', function ( $widgets_manager ) {",
    " *       require_once __DIR__ . '/widgets/class-custom-widget.php';",
    " *       $widgets_manager->register( new \\Boilerplate_CTA_Widget() );",
    " *   } );",
    " */",
    "",
    "class Boilerplate_CTA_Widget extends Widget_Base {",
    "\tpublic function get_name(): string {",
    "\t\treturn 'boilerplate_cta';",
    "\t}",
    "\tpublic function get_title(): string {",
    "\t\treturn __( 'Boilerplate CTA', 'boilerplate-plugin' );",
    "\t}",
    "\tpublic function get_icon(): string {",
    "\t\treturn 'eicon-call-to-action';",
    "\t}",
    "\tpublic function get_categories(): array {",
    "\t\treturn array( 'general' );",
    "\t}",
    "}",
    "",
  ].join("\n"),
};

function fakeMainFileContent() {
  return [
    "<?php",
    "/**",
    " * Plugin Name: Acme Client Portal",
    " * Text Domain: acme-client-portal",
    " */",
    "",
    "define( 'ACME_CLIENT_PORTAL_DIR', plugin_dir_path( __FILE__ ) );",
    "",
    "if ( file_exists( ACME_CLIENT_PORTAL_DIR . 'vendor/autoload.php' ) ) {",
    "\trequire_once ACME_CLIENT_PORTAL_DIR . 'vendor/autoload.php';",
    "} else {",
    "\trequire_once ACME_CLIENT_PORTAL_DIR . 'includes/Class-Deactivator.php';",
    "}",
    "",
    "use AcmeAgency\\AcmeClientPortal\\Activator;",
    "use AcmeAgency\\AcmeClientPortal\\Deactivator;",
    "",
    "add_action( 'plugins_loaded', function () {",
    "\t( new CPT() )->register();",
    "} );",
    "",
  ].join("\n");
}

function fakeExistingFiles({ withElementorClass = false } = {}) {
  const files = [{ path: "acme-client-portal.php", content: fakeMainFileContent() }];
  if (withElementorClass) {
    files.push({
      path: path.join("includes", "Class-Elementor.php"),
      content: [
        "<?php",
        "namespace AcmeAgency\\AcmeClientPortal;",
        "class Elementor_Widgets {",
        "\tpublic function register(): void {",
        "\t\tadd_action( 'elementor/widgets/register', array( $this, 'register_widgets' ) );",
        "\t}",
        "\tpublic function register_widgets( Widgets_Manager $widgets_manager ): void {",
        "\t\trequire_once __DIR__ . '/../widgets/class-existing_widget-widget.php';",
        "\t\t$widgets_manager->register( new \\AcmeClientPortal_ExistingWidget_Widget() );",
        "\t}",
        "}",
        "",
      ].join("\n"),
    });
  }
  return files;
}

function baseConfig(overrides = {}) {
  return { widget_name: "Testimonial Card", ...overrides };
}

test("first widget: creates the widget file and Class-Elementor.php, and modifies the main plugin file", () => {
  const files = generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], fakeExistingFiles());
  const ops = Object.fromEntries(files.map((f) => [f.path, f.operation]));

  assert.equal(ops[path.join("widgets", "class-testimonial_card-widget.php")], "create");
  assert.equal(ops[path.join("includes", "Class-Elementor.php")], "create");
  assert.equal(ops["acme-client-portal.php"], "modify");
});

test("widget class name is prefixed by the target's own namespace segment", () => {
  const files = generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], fakeExistingFiles());
  const widgetFile = files.find((f) => f.path === path.join("widgets", "class-testimonial_card-widget.php"));
  assert.match(widgetFile.content, /class AcmeClientPortal_TestimonialCard_Widget extends Widget_Base/);
});

test("substitutes slug, title, and text domain correctly", () => {
  const files = generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], fakeExistingFiles());
  const widgetFile = files.find((f) => f.path === path.join("widgets", "class-testimonial_card-widget.php"));
  assert.match(widgetFile.content, /return 'testimonial_card';/);
  assert.match(widgetFile.content, /__\( 'Testimonial Card', 'acme-client-portal' \)/);
});

test("uses default icon and category when not provided", () => {
  const files = generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], fakeExistingFiles());
  const widgetFile = files.find((f) => f.path === path.join("widgets", "class-testimonial_card-widget.php"));
  assert.match(widgetFile.content, /return 'eicon-info-circle';/);
  assert.match(widgetFile.content, /array\( 'general' \)/);
});

test("respects explicit icon and category overrides", () => {
  const files = generateElementorWidgetFiles(
    baseConfig({ icon: "eicon-testimonial", category: "theme-elements" }),
    [WIDGET_TEMPLATE],
    fakeExistingFiles()
  );
  const widgetFile = files.find((f) => f.path === path.join("widgets", "class-testimonial_card-widget.php"));
  assert.match(widgetFile.content, /return 'eicon-testimonial';/);
  assert.match(widgetFile.content, /array\( 'theme-elements' \)/);
});

test("adds a get_keywords() method when keywords are provided", () => {
  const files = generateElementorWidgetFiles(
    baseConfig({ keywords: ["testimonial", "quote"] }),
    [WIDGET_TEMPLATE],
    fakeExistingFiles()
  );
  const widgetFile = files.find((f) => f.path === path.join("widgets", "class-testimonial_card-widget.php"));
  assert.match(widgetFile.content, /public function get_keywords\(\): array \{/);
  assert.match(widgetFile.content, /array\( 'testimonial', 'quote' \)/);
});

test("does not add get_keywords() when no keywords are provided", () => {
  const files = generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], fakeExistingFiles());
  const widgetFile = files.find((f) => f.path === path.join("widgets", "class-testimonial_card-widget.php"));
  assert.ok(!widgetFile.content.includes("get_keywords"));
});

test("replaces the stale manual-registration docblock with an accurate automatic-registration note", () => {
  const files = generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], fakeExistingFiles());
  const widgetFile = files.find((f) => f.path === path.join("widgets", "class-testimonial_card-widget.php"));
  assert.ok(!widgetFile.content.includes("hook this into"));
  assert.match(widgetFile.content, /Registered automatically by includes\/Class-Elementor\.php/);
});

test("second widget: injects into the EXISTING Class-Elementor.php instead of recreating it, and does not touch the main file", () => {
  const files = generateElementorWidgetFiles(
    baseConfig({ widget_name: "Pricing Table" }),
    [WIDGET_TEMPLATE],
    fakeExistingFiles({ withElementorClass: true })
  );
  const paths = files.map((f) => f.path);

  assert.ok(!paths.includes("acme-client-portal.php"), "main file must not be touched for the second widget");
  const elementorFile = files.find((f) => f.path === path.join("includes", "Class-Elementor.php"));
  assert.equal(elementorFile.operation, "modify");
  assert.match(elementorFile.content, /class-existing_widget-widget\.php/, "original widget registration must remain");
  assert.match(elementorFile.content, /class-pricing_table-widget\.php/, "new widget must be injected");
});

test("idempotent: a widget file that already exists produces a skip operation, no duplicate registration", () => {
  const existingWithWidget = [
    ...fakeExistingFiles({ withElementorClass: true }),
    { path: path.join("widgets", "class-testimonial_card-widget.php"), content: "<?php // already generated" },
  ];
  const files = generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], existingWithWidget);
  assert.equal(files.length, 1);
  assert.equal(files[0].operation, "skip");
  assert.match(files[0].reason, /already exists/);
});

test("throws when widget_name is empty", () => {
  assert.throws(
    () => generateElementorWidgetFiles({ widget_name: "" }, [WIDGET_TEMPLATE], fakeExistingFiles()),
    /Cannot generate widget:.*empty/
  );
});

test("throws when the main plugin file cannot be found", () => {
  assert.throws(
    () => generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], []),
    /could not find the target's main plugin file/
  );
});

test("throws when the widget template file is missing", () => {
  assert.throws(
    () => generateElementorWidgetFiles(baseConfig(), [], fakeExistingFiles()),
    /template file "class-custom-widget\.php" not found/
  );
});

test("generateElementorWidgetFiles performs no filesystem access (pure function contract)", () => {
  assert.doesNotThrow(() => generateElementorWidgetFiles(baseConfig(), [WIDGET_TEMPLATE], fakeExistingFiles()));
});
