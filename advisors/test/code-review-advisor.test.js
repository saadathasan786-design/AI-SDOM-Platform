import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeCodeReview } from "../code-review/code-review-advisor.js";

function file(path, content) {
  return { path, content };
}

test("emits no findings at all for an empty sourceFiles array (insufficient evidence)", async () => {
  const findings = await analyzeCodeReview({ sourceFiles: [] });
  assert.deepEqual(findings, []);
});

test("emits no findings for malformed input (not an array), defensively", async () => {
  const findings = await analyzeCodeReview({ sourceFiles: "not-an-array" });
  assert.deepEqual(findings, []);
});

test("clean codebase: no warnings for a small, well-formed, consistently-named file", async () => {
  const sourceFiles = [
    file(
      "clean.js",
      [
        "/**",
        " * Adds two numbers.",
        " */",
        "export function addNumbers(a, b) {",
        "  return a + b;",
        "}",
      ].join("\n")
    ),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.severity === "warning" || f.severity === "critical"));
});

test("detects naming inconsistency: mixed camelCase and snake_case function names in one file", async () => {
  const sourceFiles = [
    file("mixed.js", "export function getUserData() {}\nexport function fetch_user_profile() {}"),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "naming-inconsistency");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
  assert.deepEqual(finding.evidence.stylesFound.sort(), ["camelCase", "snake_case"]);
});

test("does not flag SCREAMING_SNAKE_CASE constants as a naming inconsistency alongside camelCase functions", async () => {
  const sourceFiles = [file("ok.js", "const MAX_RETRIES = 3;\nexport function getValue() {}")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "naming-inconsistency"));
});

test("does not flag a single consistent naming style", async () => {
  const sourceFiles = [file("ok.js", "export function getA() {}\nexport function getB() {}\nexport function getC() {}")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "naming-inconsistency"));
});

test("detects cross-file duplication for a substantial repeated block", async () => {
  const block = [
    "function longRepeatedHelperNameForClarity() {",
    "  const someValue = computeSomethingMeaningful();",
    "  const anotherValue = computeSomethingElseEntirely();",
    "  const thirdValue = computeYetAnotherThingHereToo();",
    "  return combineTheseValuesTogetherNow(someValue, anotherValue, thirdValue);",
    "}",
    "// a trailing comment line to pad this block further",
  ].join("\n");
  const sourceFiles = [file("a.js", block), file("b.js", block)];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "cross-file-duplication");
  assert.ok(finding);
  assert.equal(finding.evidence.locations.length, 2);
});

test("does not flag duplication within a single file (only cross-file)", async () => {
  const block = [
    "function longRepeatedHelperNameForClarity() {",
    "  const someValue = computeSomethingMeaningful();",
    "  const anotherValue = computeSomethingElseEntirely();",
    "  const thirdValue = computeYetAnotherThingHereToo();",
    "  return combineTheseValuesTogetherNow(someValue, anotherValue, thirdValue);",
    "}",
    "// a trailing comment line to pad this block further",
  ].join("\n");
  const sourceFiles = [file("a.js", block + "\n" + block)];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "cross-file-duplication"));
});

test("does not flag a block of shared import statements as duplication (expected reuse, not a code smell)", async () => {
  const importBlock = [
    "import { a } from './a.js';",
    "import { b } from './b.js';",
    "import {",
    "  c,",
    "  d,",
    "} from './cd.js';",
  ].join("\n");
  const sourceFiles = [file("x.js", importBlock), file("y.js", importBlock)];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "cross-file-duplication"));
});

test("does not flag trivially short/generic blocks (below the minimum length threshold)", async () => {
  const sourceFiles = [
    file("a.js", "},\n},\n},\n},\n},\n},"),
    file("b.js", "},\n},\n},\n},\n},\n},"),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "cross-file-duplication"));
});

test("flags a file with zero fan-in as possible dead code, excluding index.js", async () => {
  const sourceFiles = [
    file("used.js", "export const u = 1;"),
    file("unused.js", "export const un = 1;"),
    file("consumer.js", "import './used.js';\nexport const c = 1;"),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "possible-dead-file" && f.evidence.path === "unused.js");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("does not flag index.js as dead code even with zero fan-in", async () => {
  const sourceFiles = [file("index.js", "export const a = 1;")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "possible-dead-file"));
});

test("flags a file exceeding the long-file line threshold", async () => {
  const longContent = Array.from({ length: 301 }, (_, i) => `// line ${i}`).join("\n");
  const sourceFiles = [file("big.js", longContent)];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "long-file");
  assert.ok(finding);
  assert.equal(finding.evidence.lineCount, 301);
});

test("does not flag a short file as long", async () => {
  const sourceFiles = [file("small.js", "export const a = 1;")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "long-file"));
});

test("flags low documentation coverage when most exports lack a preceding doc comment", async () => {
  const sourceFiles = [
    file(
      "sparse-docs.js",
      [
        "export function a() {}",
        "export function b() {}",
        "export function c() {}",
        "/**",
        " * Documented.",
        " */",
        "export function d() {}",
      ].join("\n")
    ),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "low-documentation-coverage");
  assert.ok(finding);
  assert.equal(finding.evidence.documented, 1);
  assert.equal(finding.evidence.totalExports, 4);
});

test("does not flag good documentation coverage", async () => {
  const sourceFiles = [
    file(
      "well-documented.js",
      ["/**\n * A.\n */", "export function a() {}", "/**\n * B.\n */", "export function b() {}"].join("\n")
    ),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "low-documentation-coverage"));
});

test("does not evaluate documentation coverage for a file with no exports", async () => {
  const sourceFiles = [file("internal.js", "function helper() {}\nhelper();")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "low-documentation-coverage"));
});

test("detects an empty catch block", async () => {
  const sourceFiles = [file("swallow.js", "try {\n  risky();\n} catch (e) {}")];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "empty-catch-block");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
  assert.equal(finding.evidence.count, 1);
});

test("does not flag a catch block that handles the error", async () => {
  const sourceFiles = [file("handled.js", "try {\n  risky();\n} catch (e) {\n  console.error(e);\n}")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "empty-catch-block"));
});

test("detects mixed async style (.then() and async/await in the same file)", async () => {
  const sourceFiles = [
    file("mixed-async.js", "fetch('x').then((r) => r.json());\nasync function y() { await fetch('y'); }"),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "mixed-async-style");
  assert.ok(finding);
  assert.equal(finding.evidence.thenCount, 1);
  assert.equal(finding.evidence.asyncCount, 1);
});

test("does not flag a file using only async/await", async () => {
  const sourceFiles = [file("only-async.js", "async function y() { await fetch('y'); }")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "mixed-async-style"));
});

test("detects high branching complexity above the threshold", async () => {
  const decisionLines = Array.from({ length: 31 }, (_, i) => `if (x === ${i}) { doThing(${i}); }`).join("\n");
  const sourceFiles = [file("complex.js", decisionLines)];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "high-branching-complexity");
  assert.ok(finding);
  assert.ok(finding.evidence.decisionPoints > 30);
});

test("does not flag a simple file as high complexity", async () => {
  const sourceFiles = [file("simple.js", "if (x) { doThing(); }")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "high-branching-complexity"));
});

test("detects TODO/FIXME markers", async () => {
  const sourceFiles = [file("debt.js", "export const a = 1;\n// TODO: revisit\nexport const b = 2;")];
  const findings = await analyzeCodeReview({ sourceFiles });
  const finding = findings.find((f) => f.id === "todo-fixme-markers");
  assert.ok(finding);
  assert.equal(finding.evidence.markers[0].line, 2);
});

test("does not emit a todo-fixme-markers finding when there are none", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];
  const findings = await analyzeCodeReview({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "todo-fixme-markers"));
});

test("always emits exactly one code-size-summary finding with correct aggregate stats", async () => {
  const sourceFiles = [file("a.js", "line1\nline2"), file("b.js", "line1\nline2\nline3\nline4")];
  const findings = await analyzeCodeReview({ sourceFiles });
  const summary = findings.find((f) => f.id === "code-size-summary");
  assert.ok(summary);
  assert.equal(summary.evidence.fileCount, 2);
  assert.equal(summary.evidence.totalLines, 6);
  assert.equal(summary.evidence.averageLinesPerFile, 3);
});

test("every finding includes the required fields: id, severity, category, message, recommendation, evidence", async () => {
  const sourceFiles = [
    file("mixed.js", "export function getUserData() {}\nexport function fetch_user_profile() {}\ntry { x(); } catch (e) {}"),
  ];
  const findings = await analyzeCodeReview({ sourceFiles });
  for (const finding of findings) {
    assert.equal(typeof finding.id, "string");
    assert.equal(typeof finding.severity, "string");
    assert.equal(typeof finding.category, "string");
    assert.equal(typeof finding.message, "string");
    assert.equal(typeof finding.recommendation, "object");
    assert.equal(typeof finding.evidence, "object");
  }
});

test("analyzeCodeReview performs no filesystem access (pure function contract)", async () => {
  await assert.doesNotThrow(async () => {
    await analyzeCodeReview({ sourceFiles: [file("a.js", "export const a = 1;")] });
  });
});
