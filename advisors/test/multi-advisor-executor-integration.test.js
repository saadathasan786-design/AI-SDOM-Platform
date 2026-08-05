import { test } from "node:test";
import assert from "node:assert/strict";
import { runAdvisor, runAdvisorWithReport, runAdvisors, listAdvisorCatalog } from "../index.js";

function file(p, content) {
  return { path: p, content };
}

test("integration: runAdvisors is exposed through the public index.js entry point", () => {
  assert.equal(typeof runAdvisors, "function");
});

test("integration: backward compatibility -- runAdvisor and runAdvisorWithReport still work exactly as before", async () => {
  const result = await runAdvisor("architecture", { sourceFiles: [] });
  assert.equal(result.advisor, "architecture");
  assert.deepEqual(result.findings, []);

  const report = await runAdvisorWithReport("architecture", { sourceFiles: [] });
  assert.equal(report.success, true);
  assert.deepEqual(report.findings, []);
});

test("integration: running all five real advisors together produces a coherent Unified Advisor Report", async () => {
  const sourceFiles = [
    file(
      "problematic.js",
      [
        "export function get_user_data() {}",
        "export function fetchUserProfile() {}",
        "const apiKey = 'sk_live_abcdef1234567890';",
        "try { risky(); } catch (e) {}",
        "for (const a of x) { for (const b of y) { doThing(); } }",
      ].join("\n")
    ),
  ];

  const allIds = listAdvisorCatalog().map((a) => a.id);
  const report = await runAdvisors(allIds, { sourceFiles });

  assert.equal(report.advisorCount, allIds.length);
  assert.deepEqual(report.advisorsFailed, []);
  assert.equal(report.advisorsRun.length, allIds.length);
  assert.ok(report.findings.length > 0);
  assert.equal(
    report.summary.info + report.summary.suggestion + report.summary.warning + report.summary.critical,
    report.findings.length
  );
});

test("integration: mixing a real advisor with an unknown id isolates the failure without affecting the real ones", async () => {
  const sourceFiles = [file("clean.js", "export const a = 1;")];

  const report = await runAdvisors(["architecture", "code-review", "not-a-real-advisor"], { sourceFiles });

  assert.equal(report.success, false);
  assert.deepEqual(report.advisorsRun.sort(), ["architecture", "code-review"]);
  assert.deepEqual(report.advisorsFailed, ["not-a-real-advisor"]);
});

test("integration: all five real advisors share the identical sourceFiles context (no per-advisor re-fetch possible by construction)", async () => {
  const sourceFiles = [file("shared.js", "export const shared = true;")];
  const allIds = listAdvisorCatalog().map((a) => a.id);

  const report = await runAdvisors(allIds, { sourceFiles });

  assert.deepEqual(report.inputRequirementsUnion, ["sourceFiles"]);
  assert.equal(report.advisorsFailed.length, 0);
});

test("integration: findings from different real advisors are correctly distinguishable by their own id fields", async () => {
  const sourceFiles = [
    file("mixed.js", "eval(x);\nexport function get_user() {}\nexport function fetchUser() {}"),
  ];

  const report = await runAdvisors(["security", "code-review"], { sourceFiles });

  assert.ok(report.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.ok(report.findings.some((f) => f.id === "naming-inconsistency"));
});

test("integration: empty sourceFiles across all five real advisors produces a clean, successful Unified Report", async () => {
  const allIds = listAdvisorCatalog().map((a) => a.id);
  const report = await runAdvisors(allIds, { sourceFiles: [] });

  assert.equal(report.success, true);
  assert.deepEqual(report.advisorsFailed, []);
  assert.deepEqual(report.findings, []);
});
