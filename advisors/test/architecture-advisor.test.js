import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeArchitecture } from "../architecture/architecture-advisor.js";

function file(path, content) {
  return { path, content };
}

test("emits no findings at all for an empty sourceFiles array (insufficient evidence, not a false alarm)", async () => {
  const findings = await analyzeArchitecture({ sourceFiles: [] });
  assert.deepEqual(findings, []);
});

test("clean architecture: no circular dependencies, no layer violations reported for a simple valid DAG", async () => {
  const sourceFiles = [
    file("generators/framework/a.js", "export const a = 1;"),
    file("generators/framework/b.js", "import { a } from './a.js';\nexport const b = a + 1;"),
    file("generators/plugin/plugin.js", "import { b } from '../framework/b.js';\nexport const plugin = b;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "circular-dependency"));
  assert.ok(!findings.some((f) => f.id === "layer-violation"));
});

test("detects a direct two-file circular dependency", async () => {
  const sourceFiles = [
    file("generators/framework/x.js", "import { y } from './y.js';\nexport const x = 1;"),
    file("generators/framework/y.js", "import { x } from './x.js';\nexport const y = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const cycleFindings = findings.filter((f) => f.id === "circular-dependency");
  assert.equal(cycleFindings.length, 1);
  assert.equal(cycleFindings[0].severity, "critical");
});

test("detects a longer, indirect circular dependency (A to B to C to A)", async () => {
  const sourceFiles = [
    file("generators/framework/a.js", "import { c } from './c.js';\nexport const a = 1;"),
    file("generators/framework/b.js", "import { a } from './a.js';\nexport const b = 1;"),
    file("generators/framework/c.js", "import { b } from './b.js';\nexport const c = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const cycleFindings = findings.filter((f) => f.id === "circular-dependency");
  assert.equal(cycleFindings.length, 1);
  assert.ok(cycleFindings[0].evidence.cycle.length >= 3);
});

test("does not report the same cycle twice when traversal visits it from multiple entry points", async () => {
  const sourceFiles = [
    file("generators/framework/entry.js", "import './x.js';\nexport const e = 1;"),
    file("generators/framework/x.js", "import { y } from './y.js';\nexport const x = 1;"),
    file("generators/framework/y.js", "import { x } from './x.js';\nexport const y = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const cycleFindings = findings.filter((f) => f.id === "circular-dependency");
  assert.equal(cycleFindings.length, 1, "the x<->y cycle should be reported exactly once");
});

test("detects a layer violation: generator-framework depending on a specific generator", async () => {
  const sourceFiles = [
    file("generators/framework/executor.js", "import { pluginGenerator } from '../plugin/plugin-generator.js';\nexport const e = 1;"),
    file("generators/plugin/plugin-generator.js", "export const pluginGenerator = {};"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const violations = findings.filter((f) => f.id === "layer-violation");
  assert.equal(violations.length, 1);
  assert.equal(violations[0].severity, "critical");
  assert.equal(violations[0].evidence.fromLayer, "generator-framework");
  assert.equal(violations[0].evidence.toLayer, "generators");
});

test("detects a layer violation: a generator depending on an advisor (cross-subsystem)", async () => {
  const sourceFiles = [
    file("generators/plugin/plugin-generator.js", "import { x } from '../../advisors/architecture/architecture-advisor.js';\nexport const p = 1;"),
    file("advisors/architecture/architecture-advisor.js", "export const x = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const violations = findings.filter((f) => f.id === "layer-violation");
  assert.equal(violations.length, 1);
  assert.equal(violations[0].evidence.fromLayer, "generators");
  assert.equal(violations[0].evidence.toLayer, "advisors");
});

test("does not flag a normal generator to generator-framework dependency (the correct, allowed direction)", async () => {
  const sourceFiles = [
    file("generators/plugin/plugin-generator.js", "import { toSlug } from '../framework/slug-generator.js';\nexport const p = 1;"),
    file("generators/framework/slug-generator.js", "export function toSlug() {}"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "layer-violation"));
});

test("reports an informational (not critical) finding for cross-subsystem coupling involving mcp-server", async () => {
  const sourceFiles = [
    file("advisors/framework/advisor-executor.js", "import { x } from '../../mcp-server/knowledge-graph.js';\nexport const e = 1;"),
    file("mcp-server/knowledge-graph.js", "export const x = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const crossFindings = findings.filter((f) => f.id === "cross-subsystem-coupling-observed");
  assert.equal(crossFindings.length, 1);
  assert.equal(crossFindings[0].severity, "info");
});

test("computes the longest dependency chain correctly", async () => {
  const sourceFiles = [
    file("generators/framework/a.js", "export const a = 1;"),
    file("generators/framework/b.js", "import './a.js';\nexport const b = 1;"),
    file("generators/framework/c.js", "import './b.js';\nexport const c = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const depthFinding = findings.find((f) => f.id === "maximum-dependency-depth");
  assert.ok(depthFinding);
  assert.equal(depthFinding.evidence.depth, 2);
  assert.deepEqual(depthFinding.evidence.chain, ["generators/framework/c.js", "generators/framework/b.js", "generators/framework/a.js"]);
});

test("flags a registry file with no matching catalog (neither prefixed nor bare)", async () => {
  const sourceFiles = [file("generators/framework/thing-registry.js", "export const r = 1;")];
  const findings = await analyzeArchitecture({ sourceFiles });
  const orphanFindings = findings.filter((f) => f.id === "registry-without-catalog");
  assert.equal(orphanFindings.length, 1);
  assert.equal(orphanFindings[0].severity, "suggestion");
});

test("does not flag a registry with a prefixed catalog (advisors convention)", async () => {
  const sourceFiles = [
    file("advisors/framework/advisor-registry.js", "export const r = 1;"),
    file("advisors/framework/advisor-catalog.js", "export const c = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "registry-without-catalog"));
});

test("does not flag a registry with a bare catalog.js (generators convention)", async () => {
  const sourceFiles = [
    file("generators/framework/generator-registry.js", "export const r = 1;"),
    file("generators/framework/catalog.js", "export const c = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "registry-without-catalog"));
});

test("flags an unused framework module (zero fan-in), excluding index.js itself", async () => {
  const sourceFiles = [
    file("generators/framework/used.js", "export const u = 1;"),
    file("generators/framework/unused.js", "export const un = 1;"),
    file("generators/plugin/plugin-generator.js", "import '../framework/used.js';\nexport const p = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const unusedFindings = findings.filter((f) => f.id === "unused-framework-module");
  assert.equal(unusedFindings.length, 1);
  assert.equal(unusedFindings[0].evidence.path, "generators/framework/unused.js");
});

test("detects TODO/FIXME markers with correct file and line number", async () => {
  const sourceFiles = [file("generators/framework/x.js", "export const x = 1;\n// TODO: fix this later\nexport const y = 2;")];
  const findings = await analyzeArchitecture({ sourceFiles });
  const debtFinding = findings.find((f) => f.id === "technical-debt-markers");
  assert.ok(debtFinding);
  assert.equal(debtFinding.evidence.markers[0].line, 2);
});

test("does not emit a technical-debt-markers finding when there are none", async () => {
  const sourceFiles = [file("generators/framework/x.js", "export const x = 1;")];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "technical-debt-markers"));
});

test("always emits exactly one module-organization-summary finding with correct per-layer counts", async () => {
  const sourceFiles = [
    file("generators/framework/a.js", "export const a = 1;"),
    file("generators/plugin/b.js", "export const b = 1;"),
    file("advisors/framework/c.js", "export const c = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  const summary = findings.find((f) => f.id === "module-organization-summary");
  assert.ok(summary);
  assert.deepEqual(summary.evidence.perLayerCounts, { "generator-framework": 1, generators: 1, "advisor-framework": 1 });
});

test("flags an index.js with zero exports and no top-level await as a warning (potentially broken API)", async () => {
  const sourceFiles = [file("generators/index.js", "const x = 1;")];
  const findings = await analyzeArchitecture({ sourceFiles });
  const emptyFinding = findings.find((f) => f.id === "empty-public-entry-point");
  assert.ok(emptyFinding);
  assert.equal(emptyFinding.severity, "warning");
});

test("classifies a zero-export index.js with a top-level await as a runnable script, not a warning", async () => {
  const sourceFiles = [file("mcp-server/index.js", "const x = 1;\nawait x.connect();")];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "empty-public-entry-point"));
  const scriptFinding = findings.find((f) => f.id === "runnable-script-entry-point");
  assert.ok(scriptFinding);
  assert.equal(scriptFinding.severity, "info");
});

test("reports a public-entry-point-summary for an index.js with real exports", async () => {
  const sourceFiles = [file("generators/index.js", "export const a = 1;\nexport function b() {}")];
  const findings = await analyzeArchitecture({ sourceFiles });
  const summary = findings.find((f) => f.id === "public-entry-point-summary");
  assert.ok(summary);
  assert.equal(summary.evidence.exportCount, 2);
});

test("ignores external non-relative imports entirely, no crash, no phantom edges", async () => {
  const sourceFiles = [
    file("generators/framework/x.js", "import path from 'node:path';\nimport fs from 'node:fs/promises';\nexport const x = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "circular-dependency"));
  assert.ok(!findings.some((f) => f.id === "layer-violation"));
});

test("silently ignores an import that cannot be confidently resolved, rather than guessing", async () => {
  const sourceFiles = [
    file("generators/framework/x.js", "import { y } from './does-not-exist-in-sourcefiles.js';\nexport const x = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  assert.ok(!findings.some((f) => f.id === "layer-violation"));
});

test("every finding includes the required fields: id, severity, category, message, recommendation, evidence", async () => {
  const sourceFiles = [
    file("generators/framework/x.js", "import { y } from './y.js';\nexport const x = 1;"),
    file("generators/framework/y.js", "import { x } from './x.js';\nexport const y = 1;"),
  ];
  const findings = await analyzeArchitecture({ sourceFiles });
  for (const finding of findings) {
    assert.equal(typeof finding.id, "string");
    assert.equal(typeof finding.severity, "string");
    assert.equal(typeof finding.category, "string");
    assert.equal(typeof finding.message, "string");
    assert.equal(typeof finding.recommendation, "object");
    assert.equal(typeof finding.evidence, "object");
  }
});

test("analyzeArchitecture performs no filesystem access (pure function contract)", async () => {
  await assert.doesNotThrow(async () => {
    await analyzeArchitecture({ sourceFiles: [file("a.js", "export const a = 1;")] });
  });
});
