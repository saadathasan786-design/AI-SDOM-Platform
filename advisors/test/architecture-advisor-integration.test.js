import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runAdvisorWithReport, listAdvisorCatalog, getAdvisorMetadata, isAvailable } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("integration: the Architecture Advisor is registered and discoverable via the real catalog", () => {
  assert.equal(isAvailable("architecture"), true);
  const catalog = listAdvisorCatalog();
  assert.ok(catalog.some((a) => a.id === "architecture"));

  const meta = getAdvisorMetadata("architecture");
  assert.equal(meta.category, "architecture");
  assert.deepEqual(meta.inputRequirements, ["sourceFiles"]);
});

test("integration: clean architecture produces zero critical findings", async () => {
  const sourceFiles = [
    file("generators/framework/a.js", "export const a = 1;"),
    file("generators/plugin/plugin.js", "import '../framework/a.js';\nexport const p = 1;"),
  ];
  const report = await runAdvisorWithReport("architecture", { sourceFiles });
  assert.equal(report.success, true);
  assert.equal(report.summary.critical, 0);
});

test("integration: dependency violation (generator-framework depending on a generator) is reported as critical", async () => {
  const sourceFiles = [
    file("generators/framework/executor.js", "import '../plugin/plugin-generator.js';\nexport const e = 1;"),
    file("generators/plugin/plugin-generator.js", "export const p = 1;"),
  ];
  const report = await runAdvisorWithReport("architecture", { sourceFiles });
  assert.equal(report.success, true);
  assert.equal(report.summary.critical, 1);
  assert.ok(report.findings.some((f) => f.id === "layer-violation"));
});

test("integration: circular dependency is reported as critical through the full report pipeline", async () => {
  const sourceFiles = [
    file("generators/framework/x.js", "import './y.js';\nexport const x = 1;"),
    file("generators/framework/y.js", "import './x.js';\nexport const y = 1;"),
  ];
  const report = await runAdvisorWithReport("architecture", { sourceFiles });
  assert.equal(report.success, true);
  assert.ok(report.findings.some((f) => f.id === "circular-dependency" && f.severity === "critical"));
});

test("integration: layer violation between generators and advisors subsystems is caught end to end", async () => {
  const sourceFiles = [
    file("advisors/framework/advisor-executor.js", "import '../../generators/plugin/plugin-generator.js';\nexport const e = 1;"),
    file("generators/plugin/plugin-generator.js", "export const x = 1;"),
  ];
  const report = await runAdvisorWithReport("architecture", { sourceFiles });
  const violation = report.findings.find((f) => f.id === "layer-violation");
  assert.ok(violation);
  assert.equal(violation.evidence.fromLayer, "advisor-framework");
  assert.equal(violation.evidence.toLayer, "generators");
});

test("integration: malformed input (sourceFiles not an array) is handled gracefully via the defensive guard, not a crash", async () => {
  const report = await runAdvisorWithReport("architecture", { sourceFiles: "not-an-array" });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("integration: malformed input (a file with null content) does not crash -- report wrapper catches any error", async () => {
  const sourceFiles = [file("generators/framework/weird.js", null)];
  const report = await runAdvisorWithReport("architecture", { sourceFiles });
  assert.equal(typeof report.success, "boolean");
  if (!report.success) {
    assert.ok(report.error);
  }
});

test("integration: empty project (zero files) produces a successful report with zero findings, not an error", async () => {
  const report = await runAdvisorWithReport("architecture", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
  assert.deepEqual(report.summary, { info: 0, suggestion: 0, warning: 0, critical: 0 });
});

test("integration: missing required input (no sourceFiles key at all) is reported as failure, never thrown", async () => {
  const report = await runAdvisorWithReport("architecture", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "sourceFiles"/);
});

test("integration: failure handling does not affect a subsequent, valid run against the same advisor", async () => {
  const failedReport = await runAdvisorWithReport("architecture", {});
  assert.equal(failedReport.success, false);

  const goodReport = await runAdvisorWithReport("architecture", {
    sourceFiles: [file("generators/framework/a.js", "export const a = 1;")],
  });
  assert.equal(goodReport.success, true);
});

test("integration: real project source (this repository's own generators/ and advisors/ trees) analyzes successfully with zero critical findings", async () => {
  async function collectSourceFiles(rootDirs) {
    const files = [];
    async function walk(dir, relBase) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "test" || entry.name === "node_modules") continue;
        const abs = path.join(dir, entry.name);
        const rel = relBase ? path.posix.join(relBase, entry.name) : entry.name;
        if (entry.isDirectory()) {
          await walk(abs, rel);
        } else if (entry.name.endsWith(".js")) {
          files.push({ path: rel, content: await fs.readFile(abs, "utf8") });
        }
      }
    }
    for (const dir of rootDirs) {
      await walk(path.join(process.cwd(), "..", dir), dir);
    }
    return files;
  }

  const sourceFiles = await collectSourceFiles(["generators", "advisors"]);
  const report = await runAdvisorWithReport("architecture", { sourceFiles });

  assert.equal(report.success, true);
  assert.equal(report.summary.critical, 0, "this project's real architecture should have zero critical findings");
  assert.ok(report.findings.some((f) => f.id === "module-organization-summary"));
});
