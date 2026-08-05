import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAdvisor, _resetForTests } from "../framework/advisor-registry.js";
import { runAdvisors } from "../framework/multi-advisor-executor.js";

function reliableAdvisor(id, findings = []) {
  return {
    id,
    name: `Reliable ${id}`,
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => findings,
  };
}

function brokenAdvisor(id, message = "boom") {
  return {
    id,
    name: `Broken ${id}`,
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => {
      throw new Error(message);
    },
  };
}

test("multiple successful advisors: aggregates findings, summary, and advisorsRun correctly", async () => {
  _resetForTests();
  registerAdvisor(reliableAdvisor("a", [{ id: "f1", severity: "info", message: "x" }]));
  registerAdvisor(reliableAdvisor("b", [{ id: "f2", severity: "warning", message: "y" }, { id: "f3", severity: "critical", message: "z" }]));

  const report = await runAdvisors(["a", "b"], {});

  assert.equal(report.success, true);
  assert.equal(report.advisorCount, 2);
  assert.deepEqual(report.advisorsRun, ["a", "b"]);
  assert.deepEqual(report.advisorsFailed, []);
  assert.equal(report.findings.length, 3);
  assert.deepEqual(report.summary, { info: 1, suggestion: 0, warning: 1, critical: 1 });
});

test("one advisor failure: isolated, the other still runs and contributes findings", async () => {
  _resetForTests();
  registerAdvisor(reliableAdvisor("good", [{ id: "f1", severity: "info", message: "x" }]));
  registerAdvisor(brokenAdvisor("bad"));

  const report = await runAdvisors(["good", "bad"], {});

  assert.equal(report.success, false);
  assert.deepEqual(report.advisorsRun, ["good"]);
  assert.deepEqual(report.advisorsFailed, ["bad"]);
  assert.equal(report.findings.length, 1);
  assert.equal(report.advisorReports.length, 2);
  assert.equal(report.advisorReports[1].success, false);
  assert.match(report.advisorReports[1].error, /boom/);
});

test("multiple advisor failures: all isolated independently, successes still counted", async () => {
  _resetForTests();
  registerAdvisor(reliableAdvisor("good", [{ id: "f1", severity: "suggestion", message: "x" }]));
  registerAdvisor(brokenAdvisor("bad1", "first failure"));
  registerAdvisor(brokenAdvisor("bad2", "second failure"));

  const report = await runAdvisors(["good", "bad1", "bad2"], {});

  assert.equal(report.success, false);
  assert.deepEqual(report.advisorsRun, ["good"]);
  assert.deepEqual(report.advisorsFailed, ["bad1", "bad2"]);
  assert.equal(report.summary.suggestion, 1);
});

test("empty advisor list: succeeds vacuously with zero everything", async () => {
  _resetForTests();
  const report = await runAdvisors([], {});

  assert.equal(report.success, true);
  assert.equal(report.advisorCount, 0);
  assert.deepEqual(report.advisorsRun, []);
  assert.deepEqual(report.advisorsFailed, []);
  assert.deepEqual(report.findings, []);
  assert.deepEqual(report.summary, { info: 0, suggestion: 0, warning: 0, critical: 0 });
  assert.deepEqual(report.advisorReports, []);
});

test("duplicate advisor IDs are deduplicated, not run twice", async () => {
  _resetForTests();
  let callCount = 0;
  registerAdvisor({
    id: "counted",
    name: "Counted",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => {
      callCount++;
      return [];
    },
  });

  const report = await runAdvisors(["counted", "counted", "counted"], {});

  assert.equal(callCount, 1);
  assert.equal(report.advisorCount, 1);
  assert.deepEqual(report.advisorsRun, ["counted"]);
});

test("deterministic ordering: advisorReports order always matches the input id order, regardless of internal completion timing", async () => {
  _resetForTests();
  registerAdvisor({
    id: "slow",
    name: "Slow",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return [];
    },
  });
  registerAdvisor(reliableAdvisor("fast", []));

  const report = await runAdvisors(["slow", "fast"], {});
  assert.deepEqual(
    report.advisorReports.map((r) => r.advisor),
    ["slow", "fast"]
  );

  const reportReversed = await runAdvisors(["fast", "slow"], {});
  assert.deepEqual(
    reportReversed.advisorReports.map((r) => r.advisor),
    ["fast", "slow"]
  );
});

test("shared input gathering: every advisor receives the exact same context object, nothing re-fetched", async () => {
  _resetForTests();
  const seenContexts = [];
  registerAdvisor({
    id: "needs-report",
    name: "Needs Report",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["generationReport"],
    analyze: async (input) => {
      seenContexts.push(input.generationReport);
      return [];
    },
  });
  registerAdvisor({
    id: "also-needs-report",
    name: "Also Needs Report",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["generationReport"],
    analyze: async (input) => {
      seenContexts.push(input.generationReport);
      return [];
    },
  });

  const sharedReport = { success: true, id: "shared-instance" };
  await runAdvisors(["needs-report", "also-needs-report"], { generationReport: sharedReport });

  assert.equal(seenContexts.length, 2);
  assert.equal(seenContexts[0], sharedReport);
  assert.equal(seenContexts[1], sharedReport);
});

test("input requirements union is computed correctly across advisors with different needs", async () => {
  _resetForTests();
  registerAdvisor({
    id: "needs-a",
    name: "A",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["sourceFiles"],
    analyze: async () => [],
  });
  registerAdvisor({
    id: "needs-b",
    name: "B",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["knowledgeGraph"],
    analyze: async () => [],
  });

  const report = await runAdvisors(["needs-a", "needs-b"], { sourceFiles: [], knowledgeGraph: {} });
  assert.deepEqual(report.inputRequirementsUnion.sort(), ["knowledgeGraph", "sourceFiles"]);
});

test("input requirements union computation never throws for an unknown advisor id, even though execution will still isolate it", async () => {
  _resetForTests();
  registerAdvisor(reliableAdvisor("real", []));

  const report = await runAdvisors(["real", "does-not-exist"], {});
  assert.deepEqual(report.advisorsFailed, ["does-not-exist"]);
});

test("severity aggregation sums correctly across multiple advisors with overlapping severity levels", async () => {
  _resetForTests();
  registerAdvisor(reliableAdvisor("a", [
    { id: "1", severity: "warning", message: "x" },
    { id: "2", severity: "warning", message: "y" },
  ]));
  registerAdvisor(reliableAdvisor("b", [
    { id: "3", severity: "warning", message: "z" },
    { id: "4", severity: "critical", message: "w" },
  ]));

  const report = await runAdvisors(["a", "b"], {});
  assert.deepEqual(report.summary, { info: 0, suggestion: 0, warning: 3, critical: 1 });
});

test("timing: execution_ms is a non-negative number and timestamp is a valid ISO date, regardless of outcome", async () => {
  _resetForTests();
  registerAdvisor(reliableAdvisor("a", []));
  registerAdvisor(brokenAdvisor("b"));

  const report = await runAdvisors(["a", "b"], {});
  assert.equal(typeof report.execution_ms, "number");
  assert.ok(report.execution_ms >= 0);
  assert.ok(!Number.isNaN(new Date(report.timestamp).getTime()));
});

test("never-throws guarantee: runAdvisors itself never rejects, even with all-failing advisors", async () => {
  _resetForTests();
  registerAdvisor(brokenAdvisor("bad1"));
  registerAdvisor(brokenAdvisor("bad2"));

  await assert.doesNotReject(async () => {
    const report = await runAdvisors(["bad1", "bad2"], {});
    assert.equal(report.success, false);
    assert.equal(report.advisorsRun.length, 0);
    assert.equal(report.advisorsFailed.length, 2);
  });
});

test("never-throws guarantee: a completely unknown advisor list never rejects", async () => {
  _resetForTests();
  await assert.doesNotReject(async () => {
    const report = await runAdvisors(["nonexistent-1", "nonexistent-2"], {});
    assert.equal(report.success, false);
    assert.deepEqual(report.advisorsFailed, ["nonexistent-1", "nonexistent-2"]);
  });
});

test("advisorReports contains the full individual report shape for each advisor, not a stripped-down version", async () => {
  _resetForTests();
  registerAdvisor(reliableAdvisor("a", [{ id: "f1", severity: "info", message: "x" }]));

  const report = await runAdvisors(["a"], {});
  const individualReport = report.advisorReports[0];
  assert.equal(individualReport.advisor, "a");
  assert.equal(individualReport.success, true);
  assert.ok(Array.isArray(individualReport.findings));
  assert.ok(individualReport.summary);
  assert.equal(typeof individualReport.execution_ms, "number");
  assert.equal(typeof individualReport.timestamp, "string");
  assert.equal(individualReport.error, null);
});
