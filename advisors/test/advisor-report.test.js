import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAdvisor, _resetForTests } from "../framework/advisor-registry.js";
import { runAdvisorWithReport } from "../framework/advisor-report.js";

test("returns a success report with a correct per-severity summary", async () => {
  _resetForTests();
  registerAdvisor({
    id: "mixed",
    name: "Mixed",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [
      { id: "a", severity: "info", message: "x" },
      { id: "b", severity: "warning", message: "y" },
      { id: "c", severity: "warning", message: "z" },
      { id: "d", severity: "critical", message: "w" },
    ],
  });

  const report = await runAdvisorWithReport("mixed", {});
  assert.equal(report.success, true);
  assert.equal(report.findings.length, 4);
  assert.deepEqual(report.summary, { info: 1, suggestion: 0, warning: 2, critical: 1 });
  assert.equal(report.error, null);
});

test("never throws: a broken advisor produces a failure report instead", async () => {
  _resetForTests();
  registerAdvisor({
    id: "broken",
    name: "Broken",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => {
      throw new Error("analyze() exploded");
    },
  });

  const report = await runAdvisorWithReport("broken", {});
  assert.equal(report.success, false);
  assert.equal(report.findings.length, 0);
  assert.deepEqual(report.summary, { info: 0, suggestion: 0, warning: 0, critical: 0 });
  assert.match(report.error, /analyze\(\) exploded/);
});

test("never throws: an unregistered advisor id also produces a failure report, not an exception", async () => {
  _resetForTests();
  const report = await runAdvisorWithReport("does-not-exist", {});
  assert.equal(report.success, false);
  assert.match(report.error, /Unknown advisor/);
});

test("never throws: a missing required input also produces a failure report", async () => {
  _resetForTests();
  registerAdvisor({
    id: "needs-input",
    name: "Needs Input",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["generationReport"],
    analyze: async () => [],
  });

  const report = await runAdvisorWithReport("needs-input", {});
  assert.equal(report.success, false);
  assert.match(report.error, /requires input "generationReport"/);
});

test("findings with an invalid or missing severity are excluded from the summary count but not from findings itself", async () => {
  _resetForTests();
  registerAdvisor({
    id: "sloppy",
    name: "Sloppy",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [{ id: "a", message: "no severity field" }],
  });

  const report = await runAdvisorWithReport("sloppy", {});
  assert.equal(report.findings.length, 1);
  assert.deepEqual(report.summary, { info: 0, suggestion: 0, warning: 0, critical: 0 });
});

test("includes numeric execution_ms and a valid ISO timestamp regardless of outcome", async () => {
  _resetForTests();
  registerAdvisor({
    id: "timed",
    name: "Timed",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [],
  });

  const report = await runAdvisorWithReport("timed", {});
  assert.equal(typeof report.execution_ms, "number");
  assert.ok(!Number.isNaN(new Date(report.timestamp).getTime()));
});

test("failure isolation: running a broken and a working advisor in parallel, one's failure never affects the other's report", async () => {
  _resetForTests();
  registerAdvisor({
    id: "works",
    name: "Works",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [{ id: "ok", severity: "info", message: "fine" }],
  });
  registerAdvisor({
    id: "fails",
    name: "Fails",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => {
      throw new Error("kaboom");
    },
  });

  const [workingReport, brokenReport] = await Promise.all([
    runAdvisorWithReport("works", {}),
    runAdvisorWithReport("fails", {}),
  ]);

  assert.equal(workingReport.success, true);
  assert.equal(workingReport.findings.length, 1);
  assert.equal(brokenReport.success, false);
  assert.match(brokenReport.error, /kaboom/);
});
