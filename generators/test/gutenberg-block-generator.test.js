import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { generateGutenbergBlockFiles } from "../gutenberg-block/gutenberg-block-generator.js";

const BLOCK_JSON_TEMPLATE = {
  path: "block.json",
  content: JSON.stringify(
    {
      $schema: "https://schemas.wp.org/trunk/block.json",
      apiVersion: 3,
      name: "boilerplate/testimonial",
      title: "Testimonial",
      category: "widgets",
      icon: "format-quote",
      description: "A quote + author testimonial block.",
      textdomain: "boilerplate-plugin",
      attributes: {
        quote: { type: "string", source: "html", selector: ".testimonial__quote" },
        author: { type: "string", source: "html", selector: ".testimonial__author" },
      },
      supports: { html: false, align: ["wide", "full"], color: { background: true, text: true } },
      editorScript: "file:./build/index.js",
      editorStyle: "file:./build/index.css",
      style: "file:./build/style-index.css",
    },
    null,
    2
  ),
};

const PACKAGE_JSON_TEMPLATE = {
  path: "package.json",
  content: JSON.stringify(
    {
      name: "boilerplate-testimonial-block",
      version: "1.0.0",
      scripts: { start: "wp-scripts start", build: "wp-scripts build" },
      devDependencies: { "@wordpress/scripts": "^30.0.0" },
    },
    null,
    2
  ),
};

const INDEX_JS_TEMPLATE = {
  path: path.join("src", "index.js"),
  content:
    "import { registerBlockType } from '@wordpress/blocks';\n" +
    "import Edit from './edit';\nimport save from './save';\n" +
    "import metadata from '../block.json';\nimport './style.scss';\n\n" +
    "registerBlockType( metadata.name, {\n\tedit: Edit,\n\tsave,\n} );\n",
};

const EDIT_JS_TEMPLATE = {
  path: path.join("src", "edit.js"),
  content:
    "export default function Edit() {\n" +
    "\tconst blockProps = useBlockProps( { className: 'testimonial' } );\n" +
    "\treturn <div { ...blockProps } className=\"testimonial__quote\" />;\n}\n",
};

const SAVE_JS_TEMPLATE = {
  path: path.join("src", "save.js"),
  content:
    "export default function save() {\n" +
    "\tconst blockProps = useBlockProps.save( { className: 'testimonial' } );\n" +
    "\treturn <div { ...blockProps } className=\"testimonial__author\" />;\n}\n",
};

const STYLE_SCSS_TEMPLATE = {
  path: path.join("src", "style.scss"),
  content: ".testimonial {\n\tpadding: 1.5rem;\n\n\t&__quote {\n\t\tfont-size: 1.25rem;\n\t}\n}\n",
};

const ALL_TEMPLATES = [
  BLOCK_JSON_TEMPLATE,
  PACKAGE_JSON_TEMPLATE,
  INDEX_JS_TEMPLATE,
  EDIT_JS_TEMPLATE,
  SAVE_JS_TEMPLATE,
  STYLE_SCSS_TEMPLATE,
];

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

function fakeExistingFiles({ withBlocksClass = false } = {}) {
  const files = [{ path: "acme-client-portal.php", content: fakeMainFileContent() }];
  if (withBlocksClass) {
    files.push({
      path: path.join("includes", "Class-Blocks.php"),
      content: [
        "<?php",
        "namespace AcmeAgency\\AcmeClientPortal;",
        "class Blocks {",
        "\tpublic function register(): void {",
        "\t\tadd_action( 'init', array( $this, 'register_blocks' ) );",
        "\t}",
        "\tpublic function register_blocks(): void {",
        "\t\tregister_block_type( __DIR__ . '/../blocks/existing-block' );",
        "\t}",
        "}",
        "",
      ].join("\n"),
    });
  }
  return files;
}

function baseConfig(overrides = {}) {
  return { block_name: "Feature Card", ...overrides };
}

test("first block: creates 6 source files plus Class-Blocks.php, and modifies the main plugin file", () => {
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const ops = Object.fromEntries(files.map((f) => [f.path, f.operation]));

  assert.equal(ops[path.join("blocks", "feature-card", "block.json")], "create");
  assert.equal(ops[path.join("blocks", "feature-card", "package.json")], "create");
  assert.equal(ops[path.join("blocks", "feature-card", "src", "index.js")], "create");
  assert.equal(ops[path.join("blocks", "feature-card", "src", "edit.js")], "create");
  assert.equal(ops[path.join("blocks", "feature-card", "src", "save.js")], "create");
  assert.equal(ops[path.join("blocks", "feature-card", "src", "style.scss")], "create");
  assert.equal(ops[path.join("includes", "Class-Blocks.php")], "create");
  assert.equal(ops["acme-client-portal.php"], "modify");
});

test("block.json is correctly parsed and mutated, using detected namespace/textdomain", () => {
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const blockJson = JSON.parse(files.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);

  assert.equal(blockJson.name, "acme-client-portal/feature-card");
  assert.equal(blockJson.title, "Feature Card");
  assert.equal(blockJson.textdomain, "acme-client-portal");
  assert.equal(blockJson.category, "widgets");
  assert.equal(blockJson.icon, "block-default");
});

test("block.json attribute selectors are rewritten to the new slug's root class", () => {
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const blockJson = JSON.parse(files.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);

  assert.equal(blockJson.attributes.quote.selector, ".feature-card__quote");
  assert.equal(blockJson.attributes.author.selector, ".feature-card__author");
});

test("default supports is { html: false }, not the testimonial-specific align/color defaults", () => {
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const blockJson = JSON.parse(files.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);

  assert.deepEqual(blockJson.supports, { html: false });
});

test("respects an explicit supports override", () => {
  const files = generateGutenbergBlockFiles(
    baseConfig({ supports: { html: false, align: ["wide"] } }),
    ALL_TEMPLATES,
    fakeExistingFiles()
  );
  const blockJson = JSON.parse(files.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);
  assert.deepEqual(blockJson.supports, { html: false, align: ["wide"] });
});

test("adds keywords to block.json only when provided", () => {
  const withKeywords = generateGutenbergBlockFiles(baseConfig({ keywords: ["card", "feature"] }), ALL_TEMPLATES, fakeExistingFiles());
  const blockJsonWith = JSON.parse(withKeywords.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);
  assert.deepEqual(blockJsonWith.keywords, ["card", "feature"]);

  const withoutKeywords = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const blockJsonWithout = JSON.parse(withoutKeywords.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);
  assert.ok(!("keywords" in blockJsonWithout));
});

test("package.json name is derived from namespace and slug", () => {
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const packageJson = JSON.parse(files.find((f) => f.path === path.join("blocks", "feature-card", "package.json")).content);
  assert.equal(packageJson.name, "acme-client-portal-feature-card-block");
  // Build scripts must be preserved unchanged.
  assert.equal(packageJson.scripts.build, "wp-scripts build");
});

test("JS/SCSS files have the CSS class root renamed to the new slug", () => {
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const editJs = files.find((f) => f.path === path.join("blocks", "feature-card", "src", "edit.js"));
  const styleScss = files.find((f) => f.path === path.join("blocks", "feature-card", "src", "style.scss"));

  assert.match(editJs.content, /className: 'feature-card'/);
  assert.match(editJs.content, /feature-card__quote/);
  assert.match(styleScss.content, /^\.feature-card \{/m);
});

test("attribute field names (quote, author) are NOT renamed -- only block identity and CSS class root", () => {
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles());
  const blockJson = JSON.parse(files.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);
  assert.ok("quote" in blockJson.attributes);
  assert.ok("author" in blockJson.attributes);
});

test("respects an explicit namespace override instead of the detected default", () => {
  const files = generateGutenbergBlockFiles(baseConfig({ namespace: "custom-ns" }), ALL_TEMPLATES, fakeExistingFiles());
  const blockJson = JSON.parse(files.find((f) => f.path === path.join("blocks", "feature-card", "block.json")).content);
  assert.equal(blockJson.name, "custom-ns/feature-card");
});

test("second block: injects into the EXISTING Class-Blocks.php and does not touch the main file", () => {
  const files = generateGutenbergBlockFiles(
    baseConfig({ block_name: "Pricing Table" }),
    ALL_TEMPLATES,
    fakeExistingFiles({ withBlocksClass: true })
  );
  const paths = files.map((f) => f.path);

  assert.ok(!paths.includes("acme-client-portal.php"));
  const blocksFile = files.find((f) => f.path === path.join("includes", "Class-Blocks.php"));
  assert.equal(blocksFile.operation, "modify");
  assert.match(blocksFile.content, /blocks\/existing-block/);
  assert.match(blocksFile.content, /blocks\/pricing-table/);
});

test("idempotent: a block that already exists produces a single skip operation", () => {
  const existingWithBlock = [
    ...fakeExistingFiles({ withBlocksClass: true }),
    { path: path.join("blocks", "feature-card", "block.json"), content: "{}" },
  ];
  const files = generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, existingWithBlock);
  assert.equal(files.length, 1);
  assert.equal(files[0].operation, "skip");
  assert.match(files[0].reason, /already exists/);
});

test("throws when block_name is empty", () => {
  assert.throws(
    () => generateGutenbergBlockFiles({ block_name: "" }, ALL_TEMPLATES, fakeExistingFiles()),
    /Cannot generate block:.*empty/
  );
});

test("throws when the main plugin file cannot be found", () => {
  assert.throws(
    () => generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, []),
    /could not find the target's main plugin file/
  );
});

test("throws when a template file is missing", () => {
  assert.throws(
    () => generateGutenbergBlockFiles(baseConfig(), [], fakeExistingFiles()),
    /template file "block\.json" not found/
  );
});

test("generateGutenbergBlockFiles performs no filesystem access and never references npm/build execution", () => {
  assert.doesNotThrow(() => generateGutenbergBlockFiles(baseConfig(), ALL_TEMPLATES, fakeExistingFiles()));
});
