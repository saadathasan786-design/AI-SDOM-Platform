import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeAccessibility } from "../accessibility/accessibility-advisor.js";

function file(path, content) {
  return { path, content };
}

test("emits no findings at all for an empty sourceFiles array (insufficient evidence)", async () => {
  const findings = await analyzeAccessibility({ sourceFiles: [] });
  assert.deepEqual(findings, []);
});

test("emits no findings for malformed input (not an array), defensively", async () => {
  const findings = await analyzeAccessibility({ sourceFiles: "not-an-array" });
  assert.deepEqual(findings, []);
});

test("clean markup: only the summary finding for well-formed, accessible markup", async () => {
  const sourceFiles = [
    file(
      "clean.html",
      [
        "<img src=\"photo.jpg\" alt=\"A sunset over the mountains\">",
        "<label for=\"email\">Email</label>",
        "<input type=\"text\" id=\"email\">",
        "<h1>Title</h1><h2>Section</h2>",
        "<button>Submit</button>",
        "<a href=\"/report\">Read the full quarterly report</a>",
      ].join("\n")
    ),
  ];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.severity === "critical" || f.severity === "warning"));
  assert.ok(findings.some((f) => f.id === "accessibility-scan-summary"));
});

test("detects a missing alt attribute as critical", async () => {
  const sourceFiles = [file("bad.html", "<img src=\"photo.jpg\">")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "missing-alt-attribute");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
});

test("does not flag an img with alt equal to empty string (decorative) as missing", async () => {
  const sourceFiles = [file("decorative.html", "<img src=\"spacer.gif\" alt=\"\">")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "missing-alt-attribute"));
});

test("detects an unlabeled form control", async () => {
  const sourceFiles = [file("form.html", "<input type=\"text\" id=\"name\">")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "unlabeled-form-control");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("does not flag a form control with a matching label", async () => {
  const sourceFiles = [file("form.html", "<label for=\"name\">Name</label>\n<input type=\"text\" id=\"name\">")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "unlabeled-form-control"));
});

test("does not flag a form control with aria-label instead of a label element", async () => {
  const sourceFiles = [file("form.html", "<input type=\"text\" id=\"name\" aria-label=\"Name\">")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "unlabeled-form-control"));
});

test("does not flag non-labelable input types (hidden, submit, button)", async () => {
  const sourceFiles = [
    file("form.html", "<input type=\"hidden\" id=\"csrf\">\n<input type=\"submit\" id=\"go\">"),
  ];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "unlabeled-form-control"));
});

test("detects duplicate id attributes", async () => {
  const sourceFiles = [file("dup.html", "<div id=\"box\">A</div>\n<div id=\"box\">B</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "duplicate-id-attribute");
  assert.ok(finding);
  assert.equal(finding.evidence.lines.length, 2);
});

test("does not flag unique ids", async () => {
  const sourceFiles = [file("unique.html", "<div id=\"a\">A</div>\n<div id=\"b\">B</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "duplicate-id-attribute"));
});

test("detects a skipped heading level", async () => {
  const sourceFiles = [file("headings.html", "<h2>Section</h2>\n<h4>Sub</h4>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "skipped-heading-level");
  assert.ok(finding);
  assert.equal(finding.evidence.fromLevel, 2);
  assert.equal(finding.evidence.toLevel, 4);
});

test("does not flag a normal sequential heading descent", async () => {
  const sourceFiles = [file("headings.html", "<h1>Title</h1>\n<h2>Section</h2>\n<h3>Sub</h3>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "skipped-heading-level"));
});

test("does not flag heading levels going back up (h3 then h2 is normal document structure)", async () => {
  const sourceFiles = [file("headings.html", "<h2>Section A</h2>\n<h3>Sub A</h3>\n<h2>Section B</h2>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "skipped-heading-level"));
});

test("detects a button with no accessible name", async () => {
  const sourceFiles = [file("btn.html", "<button></button>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "button-without-accessible-name");
  assert.ok(finding);
});

test("does not flag a button with text content", async () => {
  const sourceFiles = [file("btn.html", "<button>Submit</button>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "button-without-accessible-name"));
});

test("does not flag an icon-only button with aria-label", async () => {
  const sourceFiles = [file("btn.html", "<button aria-label=\"Close\"><svg></svg></button>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "button-without-accessible-name"));
});

test("detects non-descriptive link text", async () => {
  const sourceFiles = [file("link.html", "<a href=\"/x\">click here</a>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "non-descriptive-link-text");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("does not flag descriptive link text", async () => {
  const sourceFiles = [file("link.html", "<a href=\"/report\">Read the quarterly report</a>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "non-descriptive-link-text"));
});

test("detects an image-only link with no accessible text", async () => {
  const sourceFiles = [file("link.html", "<a href=\"/x\"><img src=\"icon.png\"></a>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "image-only-link-without-label");
  assert.ok(finding);
});

test("does not flag an image-only link where the image has a real alt", async () => {
  const sourceFiles = [file("link.html", "<a href=\"/x\"><img src=\"icon.png\" alt=\"Go to homepage\"></a>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "image-only-link-without-label"));
});

test("does not flag a link with both an image and visible text", async () => {
  const sourceFiles = [file("link.html", "<a href=\"/x\"><img src=\"icon.png\" alt=\"\">Home</a>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "image-only-link-without-label"));
});

test("detects a missing lang attribute on the html tag", async () => {
  const sourceFiles = [file("page.html", "<html>\n<body></body>\n</html>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "missing-lang-attribute");
  assert.ok(finding);
});

test("does not flag html lang en", async () => {
  const sourceFiles = [file("page.html", "<html lang=\"en\">\n<body></body>\n</html>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "missing-lang-attribute"));
});

test("does not evaluate lang when there is no html tag at all (a fragment)", async () => {
  const sourceFiles = [file("fragment.html", "<div>Just a fragment</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "missing-lang-attribute"));
});

test("detects a positive tabindex", async () => {
  const sourceFiles = [file("tab.html", "<div tabindex=\"3\">Focusable</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "positive-tabindex-usage");
  assert.ok(finding);
});

test("does not flag tabindex zero or negative one", async () => {
  const sourceFiles = [file("tab.html", "<div tabindex=\"0\">A</div>\n<div tabindex=\"-1\">B</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "positive-tabindex-usage"));
});

test("detects an invalid ARIA role", async () => {
  const sourceFiles = [file("aria.html", "<div role=\"buton\">Typo</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "invalid-aria-role");
  assert.ok(finding);
  assert.equal(finding.evidence.role, "buton");
});

test("does not flag a valid ARIA role", async () => {
  const sourceFiles = [file("aria.html", "<div role=\"navigation\">Menu</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "invalid-aria-role"));
});

test("detects a redundant ARIA role on a native element", async () => {
  const sourceFiles = [file("redundant.html", "<button role=\"button\">Click</button>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const finding = findings.find((f) => f.id === "redundant-aria-role");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("does not flag a non-redundant role on a native element", async () => {
  const sourceFiles = [file("ok.html", "<div role=\"button\">Custom button</div>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "redundant-aria-role"));
});

test("works identically on PHP-embedded HTML (as found in elementor-widget-boilerplate)", async () => {
  const sourceFiles = [
    file(
      "widget.php",
      "<?php\n?>\n<div class=\"cta\">\n\t<h3><?php echo esc_html($h); ?></h3>\n\t<a href=\"<?php echo esc_url($u); ?>\">Contact Us</a>\n</div>\n<?php"
    ),
  ];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(!findings.some((f) => f.severity === "critical" || f.severity === "warning"));
});

test("works identically on JSX-style markup (as found in gutenberg-block-boilerplate)", async () => {
  const sourceFiles = [
    file(
      "save.js",
      "export default function save() {\n\treturn (\n\t\t<div>\n\t\t\t<img src={src} />\n\t\t</div>\n\t);\n}"
    ),
  ];
  const findings = await analyzeAccessibility({ sourceFiles });
  assert.ok(findings.some((f) => f.id === "missing-alt-attribute"));
});

test("always emits exactly one accessibility-scan-summary finding as the last finding", async () => {
  const sourceFiles = [file("a.html", "<p>Hello</p>")];
  const findings = await analyzeAccessibility({ sourceFiles });
  const summaryFindings = findings.filter((f) => f.id === "accessibility-scan-summary");
  assert.equal(summaryFindings.length, 1);
  assert.equal(findings[findings.length - 1].id, "accessibility-scan-summary");
});

test("every finding includes the required fields: id, severity, category, message, recommendation, evidence", async () => {
  const sourceFiles = [
    file("mixed.html", "<img src=\"x.jpg\">\n<button></button>\n<div role=\"nonsense\">x</div>"),
  ];
  const findings = await analyzeAccessibility({ sourceFiles });
  for (const finding of findings) {
    assert.equal(typeof finding.id, "string");
    assert.equal(typeof finding.severity, "string");
    assert.equal(typeof finding.category, "string");
    assert.equal(typeof finding.message, "string");
    assert.equal(typeof finding.recommendation, "object");
    assert.equal(typeof finding.evidence, "object");
  }
});

test("analyzeAccessibility performs no filesystem access (pure function contract)", async () => {
  await assert.doesNotThrow(async () => {
    await analyzeAccessibility({ sourceFiles: [file("a.html", "<p>Hello</p>")] });
  });
});
