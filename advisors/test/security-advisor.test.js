import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeSecurity } from "../security/security-advisor.js";

function file(path, content) {
  return { path, content };
}

test("emits no findings at all for an empty sourceFiles array (insufficient evidence)", async () => {
  const findings = await analyzeSecurity({ sourceFiles: [] });
  assert.deepEqual(findings, []);
});

test("emits no findings for malformed input (not an array), defensively", async () => {
  const findings = await analyzeSecurity({ sourceFiles: "not-an-array" });
  assert.deepEqual(findings, []);
});

test("clean codebase: only the summary finding for benign code", async () => {
  const sourceFiles = [file("clean.js", "export function addNumbers(a, b) {\n  return a + b;\n}")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.severity === "critical" || f.severity === "warning"));
  assert.ok(findings.some((f) => f.id === "security-scan-summary"));
});

test("detects eval() usage as critical, with exact triggering text", async () => {
  const sourceFiles = [file("bad.js", "const result = eval(userInput);")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "dangerous-eval-usage");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
  assert.equal(finding.evidence.triggeringText, "eval(");
  assert.equal(finding.location.line, 1);
});

test("detects new Function() usage as critical", async () => {
  const sourceFiles = [file("bad.js", "const fn = new Function('a', 'b', 'return a + b');")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "function-constructor-usage");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
});

test("does not flag RegExp.prototype.exec() as child-process-usage (the real bug found via smoke testing)", async () => {
  const sourceFiles = [
    file("pattern-usage.js", "const PATTERN = /foo/g;\nconst match = PATTERN.exec(someString);"),
  ];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "child-process-usage"));
});

test("detects a bare (non-dotted) exec() call as child-process-usage", async () => {
  const sourceFiles = [file("runner.js", "import { exec } from 'child_process';\nexec('ls -la');")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "child-process-usage" && f.evidence.triggeringText === "exec(");
  assert.ok(finding);
});

test("detects child_process import", async () => {
  const sourceFiles = [file("runner.js", "const { execSync } = require('child_process');")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(findings.some((f) => f.id === "child-process-usage" && f.evidence.triggeringText.includes("child_process")));
});

test("detects unsanitized command construction via template literal interpolation", async () => {
  const sourceFiles = [file("runner.js", "execSync(`rm -rf ${userPath}`);")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "unsanitized-command-construction");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
});

test("detects unsanitized command construction via string concatenation", async () => {
  const sourceFiles = [file("runner.js", "exec('rm -rf ' + userPath);")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(findings.some((f) => f.id === "unsanitized-command-construction"));
});

test("does not flag a bare exec() call with a fixed string argument as unsanitized", async () => {
  const sourceFiles = [file("runner.js", "execSync('ls -la');")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "unsanitized-command-construction"));
});

test("detects a hardcoded credential", async () => {
  const sourceFiles = [file("config.js", "const apiKey = 'sk_live_abcdef1234567890';")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "hardcoded-credential");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
  assert.equal(finding.evidence.keyName, "apiKey");
});

test("does not flag a placeholder credential value", async () => {
  const sourceFiles = [file("config.js", "const password = 'changeme';")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "hardcoded-credential"));
});

test("does not flag a config field DEFINITION (key name describing a field, not an actual secret value)", async () => {
  const sourceFiles = [file("schema.js", "const field = { name: 'password', type: 'text' };")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "hardcoded-credential"));
});

test("detects a hardcoded non-HTTPS URL, excluding localhost", async () => {
  const sourceFiles = [file("client.js", "const url = 'http://api.example.com/data';")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "insecure-http-url");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("does not flag localhost or 127.0.0.1 HTTP URLs", async () => {
  const sourceFiles = [file("client.js", "const url = 'http://localhost:3000/api';\nconst url2 = 'http://127.0.0.1:8080';")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "insecure-http-url"));
});

test("detects disabled SSL verification (rejectUnauthorized: false)", async () => {
  const sourceFiles = [file("client.js", "const agent = new https.Agent({ rejectUnauthorized: false });")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "disabled-ssl-verification");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
  assert.match(finding.recommendation.message, /may be intentional/);
});

test("detects NODE_TLS_REJECT_UNAUTHORIZED=0", async () => {
  const sourceFiles = [file("client.js", "process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(findings.some((f) => f.id === "disabled-ssl-verification"));
});

test("detects Math.random() as a weak-randomness suggestion", async () => {
  const sourceFiles = [file("token.js", "const token = Math.random().toString(36);")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "weak-randomness");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("detects wildcard CORS", async () => {
  const sourceFiles = [file("server.js", "res.setHeader('Access-Control-Allow-Origin', '*');")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "wildcard-cors");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("detects a ReDoS-shaped nested-quantifier regex as a suggestion (low confidence, not warning)", async () => {
  const sourceFiles = [file("validator.js", "const BAD_PATTERN = /(a+)+$/;")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "dangerous-regex-pattern");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("detects an insecure hardcoded /tmp/ path", async () => {
  const sourceFiles = [file("temp.js", "fs.writeFileSync('/tmp/session-data', data);")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "insecure-temp-path");
  assert.ok(finding);
  assert.equal(finding.severity, "suggestion");
});

test("does not flag mkdtemp-based temp handling", async () => {
  const sourceFiles = [file("temp.js", "const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'prefix-'));")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "insecure-temp-path"));
});

test("detects an overly permissive chmod (777)", async () => {
  const sourceFiles = [file("setup.js", "fs.chmodSync(filePath, 0o777);")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "insecure-permission-setting");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("detects a leftover debugger statement", async () => {
  const sourceFiles = [file("app.js", "function handler() {\n  debugger;\n  return true;\n}")];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "leftover-debugger-statement");
  assert.ok(finding);
  assert.equal(finding.severity, "warning");
});

test("detects a security-relevant TODO/FIXME marker, ignoring unrelated ones", async () => {
  const sourceFiles = [
    file(
      "app.js",
      ["// TODO: refactor this later for readability", "// FIXME: sanitize this input before use", "export const a = 1;"].join(
        "\n"
      )
    ),
  ];
  const findings = await analyzeSecurity({ sourceFiles });
  const finding = findings.find((f) => f.id === "security-debt-marker");
  assert.ok(finding);
  assert.equal(finding.evidence.markers.length, 1);
  assert.equal(finding.evidence.markers[0].line, 2);
});

test("does not emit security-debt-marker when no TODO/FIXME mentions security-relevant terms", async () => {
  const sourceFiles = [file("app.js", "// TODO: refactor this later\nexport const a = 1;")];
  const findings = await analyzeSecurity({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "security-debt-marker"));
});

test("always emits exactly one security-scan-summary finding as the last finding", async () => {
  const sourceFiles = [file("a.js", "export const a = 1;")];
  const findings = await analyzeSecurity({ sourceFiles });
  const summaryFindings = findings.filter((f) => f.id === "security-scan-summary");
  assert.equal(summaryFindings.length, 1);
  assert.equal(findings[findings.length - 1].id, "security-scan-summary");
});

test("every finding includes the required fields: id, severity, category, message, recommendation, evidence", async () => {
  const sourceFiles = [
    file("mixed.js", "eval(x);\nconst apiKey = 'sk_live_abcdef1234567890';\ndebugger;"),
  ];
  const findings = await analyzeSecurity({ sourceFiles });
  for (const finding of findings) {
    assert.equal(typeof finding.id, "string");
    assert.equal(typeof finding.severity, "string");
    assert.equal(typeof finding.category, "string");
    assert.equal(typeof finding.message, "string");
    assert.equal(typeof finding.recommendation, "object");
    assert.equal(typeof finding.evidence, "object");
  }
});

test("analyzeSecurity performs no filesystem access (pure function contract)", async () => {
  await assert.doesNotThrow(async () => {
    await analyzeSecurity({ sourceFiles: [file("a.js", "export const a = 1;")] });
  });
});
