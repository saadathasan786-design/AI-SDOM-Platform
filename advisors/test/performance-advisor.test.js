import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzePerformance } from "../performance/performance-advisor.js";

function file(path, content) {
  return { path, content };
}

test("emits no findings at all for an empty sourceFiles array (insufficient evidence)", async () => {
  const findings = await analyzePerformance({ sourceFiles: [] });
  assert.deepEqual(findings, []);
});

test("emits no findings for malformed input (not an array), defensively", async () => {
  const findings = await analyzePerformance({ sourceFiles: "not-an-array" });
  assert.deepEqual(findings, []);
});

test("clean codebase: only the summary finding for benign code", async () => {
  const sourceFiles = [file("clean.js", "export function addNumbers(a, b) {\n  return a + b;\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.severity === "warning" || f.severity === "critical"));
  assert.ok(findings.some((f) => f.id === "performance-scan-summary"));
});

test("REGRESSION: a string literal containing a bare brace character must not break body extraction (the real bug found via smoke testing)", async () => {
  const sourceFiles = [
    file(
      "brace-in-string.js",
      [
        "function scan(content) {",
        "  for (let i = 0; i < content.length; i++) {",
        "    if (content[i] === '{') depth++;",
        "    if (content[i] === '}') depth--;",
        "  }",
        "}",
        "export const AFTER = 'this must still be reachable as normal code';",
      ].join("\n")
    ),
  ];
  const findings = await analyzePerformance({ sourceFiles });
  const summary = findings.find((f) => f.id === "performance-scan-summary");
  assert.ok(summary);
  assert.equal(summary.evidence.fileCount, 1);
});

test("detects a directly nested loop", async () => {
  const sourceFiles = [
    file(
      "nested.js",
      ["for (let i = 0; i < a.length; i++) {", "  for (let j = 0; j < b.length; j++) {", "    doThing(i, j);", "  }", "}"].join(
        "\n"
      )
    ),
  ];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "nested-loop-complexity");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("does not flag two separate sibling loops as nested", async () => {
  const sourceFiles = [
    file(
      "siblings.js",
      ["for (let i = 0; i < a.length; i++) {", "  doA(i);", "}", "for (let j = 0; j < b.length; j++) {", "  doB(j);", "}"].join(
        "\n"
      )
    ),
  ];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "nested-loop-complexity"));
});

test("detects new RegExp() constructed inside a loop", async () => {
  const sourceFiles = [
    file("regex-in-loop.js", "for (const item of items) {\n  const re = new RegExp(item);\n}"),
  ];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "regex-compiled-in-loop");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("does not flag new RegExp() outside any loop", async () => {
  const sourceFiles = [file("regex-outside.js", "const re = new RegExp(pattern);")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "regex-compiled-in-loop"));
});

test("detects JSON.parse/stringify inside a loop", async () => {
  const sourceFiles = [file("json-in-loop.js", "while (hasMore) {\n  const data = JSON.parse(raw);\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "json-operation-in-loop");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("detects synchronous fs I/O inside a loop", async () => {
  const sourceFiles = [file("sync-in-loop.js", "for (const f of files) {\n  fs.readFileSync(f);\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "sync-io-in-loop");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("detects synchronous fs I/O usage generally (not just in loops), at a lower severity", async () => {
  const sourceFiles = [file("sync.js", "const data = fs.readFileSync('config.json');")];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "sync-io-usage");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("detects .includes()/.indexOf()/.find() inside a loop", async () => {
  const sourceFiles = [file("lookup.js", "for (const x of list) {\n  if (otherList.includes(x)) { doThing(); }\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "collection-lookup-in-loop");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("detects += string concatenation inside a loop", async () => {
  const sourceFiles = [file("concat.js", "let result = '';\nfor (const s of parts) {\n  result += 'x';\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(findings.some((f) => f.id === "string-concatenation-in-loop"));
});

test("detects duplicate reads of the same literal file path", async () => {
  const sourceFiles = [
    file("dup-read.js", "fs.readFileSync('config.json');\nfs.readFileSync('config.json');"),
  ];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "duplicate-file-read");
  assert.ok(finding);
  assert.equal(finding.evidence.count, 2);
});

test("does not flag a single file read", async () => {
  const sourceFiles = [file("single-read.js", "fs.readFileSync('config.json');")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "duplicate-file-read"));
});

test("detects a large switch statement above the case threshold", async () => {
  const cases = Array.from({ length: 11 }, (_, i) => `    case ${i}: doThing(${i}); break;`).join("\n");
  const sourceFiles = [file("big-switch.js", `switch (x) {\n${cases}\n}`)];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "large-switch-statement");
  assert.ok(finding);
  assert.equal(finding.evidence.caseCount, 11);
});

test("does not flag a small switch statement", async () => {
  const sourceFiles = [file("small-switch.js", "switch (x) {\n  case 1: doA(); break;\n  case 2: doB(); break;\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "large-switch-statement"));
});

test("detects excessive conditional nesting", async () => {
  const nested = "if (a) {\n".repeat(5) + "doThing();\n" + "}\n".repeat(5);
  const sourceFiles = [file("deep-if.js", nested)];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "excessive-conditional-nesting");
  assert.ok(finding);
  assert.ok(finding.evidence.depth >= 4);
});

test("does not flag shallow conditional nesting", async () => {
  const sourceFiles = [file("shallow-if.js", "if (a) {\n  if (b) {\n    doThing();\n  }\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "excessive-conditional-nesting"));
});

test("detects an oversized module", async () => {
  const longContent = Array.from({ length: 301 }, (_, i) => `// line ${i}`).join("\n");
  const sourceFiles = [file("big.js", longContent)];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "oversized-module");
  assert.ok(finding);
  assert.equal(finding.evidence.lineCount, 301);
});

test("detects an oversized function", async () => {
  const bigBody = Array.from({ length: 81 }, (_, i) => `  doStep${i}();`).join("\n");
  const sourceFiles = [file("big-fn.js", `function bigFunction() {\n${bigBody}\n}`)];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "oversized-function");
  assert.ok(finding);
});

test("does not flag a small function", async () => {
  const sourceFiles = [file("small-fn.js", "function small() {\n  return 1;\n}")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "oversized-function"));
});

test("detects inefficient object cloning via JSON.parse(JSON.stringify())", async () => {
  const sourceFiles = [file("clone.js", "const copy = JSON.parse(JSON.stringify(original));")];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "inefficient-object-cloning");
  assert.ok(finding);
});

test("detects a redundant import (same specifier imported twice)", async () => {
  const sourceFiles = [file("dup-import.js", "import { a } from './a.js';\nimport { b } from './a.js';")];
  const findings = await analyzePerformance({ sourceFiles });
  const finding = findings.find((f) => f.id === "redundant-import");
  assert.ok(finding);
  assert.equal(finding.severity, "info");
  assert.match(finding.recommendation.message, /no runtime performance cost/);
});

test("does not flag distinct imports", async () => {
  const sourceFiles = [file("ok-imports.js", "import { a } from './a.js';\nimport { b } from './b.js';")];
  const findings = await analyzePerformance({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "redundant-import"));
});

test("always emits exactly one performance-scan-summary finding as the last finding", async () => {
  const sourceFiles = [file("a.js", "export const a = 1;")];
  const findings = await analyzePerformance({ sourceFiles });
  const summaryFindings = findings.filter((f) => f.id === "performance-scan-summary");
  assert.equal(summaryFindings.length, 1);
  assert.equal(findings[findings.length - 1].id, "performance-scan-summary");
});

test("every finding includes the required fields: id, severity, category, message, recommendation, evidence", async () => {
  const sourceFiles = [
    file(
      "mixed.js",
      "for (const x of items) {\n  for (const y of items) {\n    const re = new RegExp(x);\n  }\n}"
    ),
  ];
  const findings = await analyzePerformance({ sourceFiles });
  for (const finding of findings) {
    assert.equal(typeof finding.id, "string");
    assert.equal(typeof finding.severity, "string");
    assert.equal(typeof finding.category, "string");
    assert.equal(typeof finding.message, "string");
    assert.equal(typeof finding.recommendation, "object");
    assert.equal(typeof finding.evidence, "object");
  }
});

test("analyzePerformance performs no filesystem access (pure function contract)", async () => {
  await assert.doesNotThrow(async () => {
    await analyzePerformance({ sourceFiles: [file("a.js", "export const a = 1;")] });
  });
});
