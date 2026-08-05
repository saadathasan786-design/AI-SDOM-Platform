import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registerAdvisor,
  _resetForTests as _resetRegistryForTests,
} from "../framework/advisor-registry.js";
import {
  runAdvisor,
  runAdvisorWithReport,
  listAdvisorCatalog,
  getAdvisorMetadata,
  isAvailable,
  supportsSeverity,
  SEVERITY_LEVELS,
} from "../index.js";

function reset() {
  _resetRegistryForTests();
}

test("integration: advisor registration is visible through the public index.js catalog immediately", () => {
  reset();
  registerAdvisor({
    id: "security-basics",
    name: "Security Basics Advisor",
    version: "1.0.0",
    description: "Flags obviously risky patterns in a generation report.",
    category: "security",
    inputRequirements: ["generationReport"],
    analyze: async ({ generationReport }) => {
      const findings = [];
      if (generationReport.files?.modified?.length > 0) {
        findings.push({
          id: "modified-files-present",
          severity: "info",
          message: `${generationReport.files.modified.length} file(s) were modified.`,
        });
      }
      return findings;
    },
  });

  const catalog = listAdvisorCatalog();
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, "security-basics");
  assert.equal(catalog[0].category, "security");

  const meta = getAdvisorMetadata("security-basics");
  assert.deepEqual(meta.inputRequirements, ["generationReport"]);
  assert.equal(isAvailable("security-basics"), true);
});

test("integration: execution against a realistic generationReport-shaped input produces findings", async () => {
  reset();
  registerAdvisor({
    id: "security-basics",
    name: "Security Basics Advisor",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["generationReport"],
    analyze: async ({ generationReport }) => {
      const findings = [];
      for (const path of generationReport.files.modified) {
        findings.push({ id: "modified", severity: "info", message: `Modified: ${path}` });
      }
      return findings;
    },
  });

  const fakeGenerationReport = {
    generator: "cpt-taxonomy",
    mode: "write",
    success: true,
    files: { created: [], modified: ["includes/Class-CPT.php", "includes/Class-Taxonomy.php"], skipped: [] },
  };

  const result = await runAdvisor("security-basics", { generationReport: fakeGenerationReport });
  assert.equal(result.findings.length, 2);
});

test("integration: report generation via runAdvisorWithReport wraps execution with severity summary", async () => {
  reset();
  registerAdvisor({
    id: "counts-things",
    name: "Counts Things",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [
      { id: "a", severity: "warning", message: "one" },
      { id: "b", severity: "critical", message: "two" },
    ],
  });

  const report = await runAdvisorWithReport("counts-things", {});
  assert.equal(report.success, true);
  assert.equal(report.summary.warning, 1);
  assert.equal(report.summary.critical, 1);
});

test("integration: catalog discovery correctly reflects severity support declared per advisor", () => {
  reset();
  registerAdvisor({
    id: "critical-only",
    name: "Critical Only",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    supportedSeverities: ["critical"],
    analyze: async () => [],
  });
  registerAdvisor({
    id: "all-levels",
    name: "All Levels",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [],
  });

  assert.equal(supportsSeverity("critical-only", "info"), false);
  assert.equal(supportsSeverity("critical-only", "critical"), true);
  for (const level of SEVERITY_LEVELS) {
    assert.equal(supportsSeverity("all-levels", level), true);
  }
});

test("integration: failure isolation across multiple advisors run together (some fail, some succeed)", async () => {
  reset();
  registerAdvisor({
    id: "reliable-1",
    name: "Reliable 1",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [{ id: "ok1", severity: "info", message: "fine" }],
  });
  registerAdvisor({
    id: "unreliable",
    name: "Unreliable",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => {
      throw new Error("this advisor is broken");
    },
  });
  registerAdvisor({
    id: "reliable-2",
    name: "Reliable 2",
    version: "1.0.0",
    description: "test",
    inputRequirements: [],
    analyze: async () => [{ id: "ok2", severity: "warning", message: "also fine" }],
  });

  const ids = ["reliable-1", "unreliable", "reliable-2"];
  const reports = await Promise.all(ids.map((id) => runAdvisorWithReport(id, {})));

  assert.equal(reports[0].success, true);
  assert.equal(reports[1].success, false);
  assert.equal(reports[2].success, true);
  assert.equal(reports[0].findings.length, 1);
  assert.equal(reports[2].findings.length, 1);
  assert.match(reports[1].error, /this advisor is broken/);
});

test("integration: report wrapping never throws even for a completely unregistered advisor id", async () => {
  reset();
  const report = await runAdvisorWithReport("totally-unknown-id", {});
  assert.equal(report.success, false);
  assert.equal(report.advisor, "totally-unknown-id");
  assert.match(report.error, /Unknown advisor/);
});

test("integration: multiple advisors targeting different input requirements can run against one shared context", async () => {
  reset();
  registerAdvisor({
    id: "report-reader",
    name: "Report Reader",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["generationReport"],
    analyze: async ({ generationReport }) => [
      { id: "r", severity: "info", message: `report success=${generationReport.success}` },
    ],
  });
  registerAdvisor({
    id: "graph-reader",
    name: "Graph Reader",
    version: "1.0.0",
    description: "test",
    inputRequirements: ["knowledgeGraph"],
    analyze: async ({ knowledgeGraph }) => [
      { id: "g", severity: "info", message: `namespaces=${knowledgeGraph.rest_namespaces.data.length}` },
    ],
  });

  const sharedContext = {
    generationReport: { success: true },
    knowledgeGraph: { rest_namespaces: { data: ["wp/v2", "acme/v1"] } },
  };

  const [reportFindings, graphFindings] = await Promise.all([
    runAdvisor("report-reader", sharedContext),
    runAdvisor("graph-reader", sharedContext),
  ]);

  assert.match(reportFindings.findings[0].message, /success=true/);
  assert.match(graphFindings.findings[0].message, /namespaces=2/);
});
