import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advisorTools,
  handleAdvisorList,
  handleAdvisorRun,
  handleAdvisorRunMany,
} from "../advisor-tools.js";
import { listAdvisorCatalog } from "../../advisors/index.js";

function file(path, content) {
  return { path, content };
}

test("advisorTools declares exactly the three required tools with correct names", () => {
  const names = advisorTools.map((t) => t.name);
  assert.deepEqual(names, ["advisor_list", "advisor_run", "advisor_runMany"]);
});

test("advisor_run declares id as required in its inputSchema", () => {
  const tool = advisorTools.find((t) => t.name === "advisor_run");
  assert.deepEqual(tool.inputSchema.required, ["id"]);
});

test("advisor_runMany declares ids as required in its inputSchema", () => {
  const tool = advisorTools.find((t) => t.name === "advisor_runMany");
  assert.deepEqual(tool.inputSchema.required, ["ids"]);
});

test("handleAdvisorList returns exactly what listAdvisorCatalog returns -- no duplication, no reshaping", async () => {
  const fromHandler = await handleAdvisorList();
  const fromCatalogDirectly = listAdvisorCatalog();
  assert.deepEqual(fromHandler, fromCatalogDirectly);
});

test("handleAdvisorList returns every required field: id, name, description, category, supportedSeverities, inputRequirements", async () => {
  const result = await handleAdvisorList();
  assert.ok(result.length > 0);
  for (const entry of result) {
    assert.equal(typeof entry.id, "string");
    assert.equal(typeof entry.name, "string");
    assert.equal(typeof entry.description, "string");
    assert.equal(typeof entry.category, "string");
    assert.ok(Array.isArray(entry.supportedSeverities));
    assert.ok(Array.isArray(entry.inputRequirements));
  }
});

test("handleAdvisorList lists all five real registered advisors", async () => {
  const result = await handleAdvisorList();
  const ids = result.map((a) => a.id);
  assert.ok(ids.includes("architecture"));
  assert.ok(ids.includes("code-review"));
  assert.ok(ids.includes("security"));
  assert.ok(ids.includes("performance"));
  assert.ok(ids.includes("accessibility"));
});

test("handleAdvisorRun runs a real advisor and returns its exact Advisor Report shape", async () => {
  const sourceFiles = [file("bad.js", "eval(x);")];
  const result = await handleAdvisorRun({ id: "security", context: { sourceFiles } });

  assert.equal(result.advisor, "security");
  assert.equal(result.success, true);
  assert.ok(Array.isArray(result.findings));
  assert.ok(result.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.ok(result.summary);
  assert.equal(typeof result.execution_ms, "number");
  assert.equal(typeof result.timestamp, "string");
});

test("handleAdvisorRun on an unknown advisor id returns success:false with a clear error, never throwing", async () => {
  const result = await handleAdvisorRun({ id: "not-a-real-advisor", context: {} });
  assert.equal(result.success, false);
  assert.match(result.error, /Unknown advisor/);
});

test("handleAdvisorRun throws a clear error when id is missing (invalid request shape)", async () => {
  await assert.rejects(() => handleAdvisorRun({ context: {} }), /requires a non-empty string 'id'/);
});

test("handleAdvisorRun throws a clear error when id is not a string", async () => {
  await assert.rejects(() => handleAdvisorRun({ id: 42 }), /requires a non-empty string 'id'/);
});

test("handleAdvisorRun defaults context to an empty object when omitted", async () => {
  const result = await handleAdvisorRun({ id: "security" });
  assert.equal(result.success, false);
  assert.match(result.error, /requires input "sourceFiles"/);
});

test("handleAdvisorRun on empty sourceFiles produces a clean, successful report", async () => {
  const result = await handleAdvisorRun({ id: "architecture", context: { sourceFiles: [] } });
  assert.equal(result.success, true);
  assert.deepEqual(result.findings, []);
});

test("handleAdvisorRunMany runs multiple real advisors concurrently and returns the exact Unified Advisor Report shape", async () => {
  const sourceFiles = [file("mixed.js", "eval(x);\nexport function get_user() {}\nexport function fetchUser() {}")];
  const result = await handleAdvisorRunMany({ ids: ["security", "code-review"], context: { sourceFiles } });

  assert.equal(result.success, true);
  assert.equal(result.advisorCount, 2);
  assert.deepEqual(result.advisorsRun.sort(), ["code-review", "security"]);
  assert.deepEqual(result.advisorsFailed, []);
  assert.ok(result.findings.some((f) => f.id === "dangerous-eval-usage"));
  assert.ok(result.findings.some((f) => f.id === "naming-inconsistency"));
  assert.ok(result.summary);
  assert.ok(Array.isArray(result.advisorReports));
  assert.equal(typeof result.execution_ms, "number");
});

test("handleAdvisorRunMany isolates a failure (unknown advisor mixed with real ones)", async () => {
  const result = await handleAdvisorRunMany({ ids: ["architecture", "not-real", "security"], context: { sourceFiles: [] } });
  assert.equal(result.success, false);
  assert.deepEqual(result.advisorsRun.sort(), ["architecture", "security"]);
  assert.deepEqual(result.advisorsFailed, ["not-real"]);
});

test("handleAdvisorRunMany runs advisors concurrently (loose timing sanity check)", async () => {
  const sourceFiles = [file("a.js", "export const a = 1;")];
  const allIds = (await handleAdvisorList()).map((a) => a.id);

  const start = Date.now();
  const result = await handleAdvisorRunMany({ ids: allIds, context: { sourceFiles } });
  const elapsed = Date.now() - start;

  assert.equal(result.advisorCount, allIds.length);
  assert.ok(elapsed < 2000, `expected concurrent execution to be fast, took ${elapsed}ms`);
});

test("handleAdvisorRunMany throws a clear error when ids is missing (invalid request shape)", async () => {
  await assert.rejects(() => handleAdvisorRunMany({ context: {} }), /requires 'ids' to be an array/);
});

test("handleAdvisorRunMany throws a clear error when ids is not an array", async () => {
  await assert.rejects(() => handleAdvisorRunMany({ ids: "architecture" }), /requires 'ids' to be an array/);
});

test("handleAdvisorRunMany defaults context to an empty object when omitted", async () => {
  const result = await handleAdvisorRunMany({ ids: ["security"] });
  assert.equal(result.advisorReports[0].success, false);
  assert.match(result.advisorReports[0].error, /requires input "sourceFiles"/);
});

test("handleAdvisorRunMany with an empty ids array succeeds vacuously", async () => {
  const result = await handleAdvisorRunMany({ ids: [] });
  assert.equal(result.success, true);
  assert.equal(result.advisorCount, 0);
});

test("handleAdvisorRunMany deduplicates repeated advisor ids (delegating to the framework's own dedup behavior)", async () => {
  const result = await handleAdvisorRunMany({ ids: ["security", "security"], context: { sourceFiles: [] } });
  assert.equal(result.advisorCount, 1);
});
