import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { advisorTools, resolveContext as advisorResolveContext, handleAdvisorRun } from "../advisor-tools.js";
import { agentTools, resolveContext as agentResolveContext, handleAgentRun } from "../agent-tools.js";
import { workflowTools, resolveContext as workflowResolveContext, handleWorkflowRun } from "../workflow-tools.js";

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "mcp-kg-test-"));
}

async function writeFile(root, relPath, content) {
  const fullPath = path.join(root, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

const EXPECTED_KG_KEYS = [
  "schema_version",
  "generated_at",
  "site",
  "post_types",
  "taxonomies",
  "plugins",
  "active_theme",
  "rest_namespaces",
  "detected",
].sort();

// ---------------------------------------------------------------------
// Tool schema updates
// ---------------------------------------------------------------------

test("advisor_run and advisor_runMany schemas declare includeKnowledgeGraph as an optional boolean", () => {
  const runTool = advisorTools.find((t) => t.name === "advisor_run");
  assert.equal(runTool.inputSchema.properties.includeKnowledgeGraph.type, "boolean");
  assert.ok(!runTool.inputSchema.required.includes("includeKnowledgeGraph"));

  const runManyTool = advisorTools.find((t) => t.name === "advisor_runMany");
  assert.equal(runManyTool.inputSchema.properties.includeKnowledgeGraph.type, "boolean");
});

test("agent_run schema declares includeKnowledgeGraph as an optional boolean", () => {
  const runTool = agentTools.find((t) => t.name === "agent_run");
  assert.equal(runTool.inputSchema.properties.includeKnowledgeGraph.type, "boolean");
});

test("workflow_run schema declares includeKnowledgeGraph as an optional boolean", () => {
  const runTool = workflowTools.find((t) => t.name === "workflow_run");
  assert.equal(runTool.inputSchema.properties.includeKnowledgeGraph.type, "boolean");
});

// ---------------------------------------------------------------------
// Successful Knowledge Graph injection -- exact context propagation
// ---------------------------------------------------------------------

test("advisor-tools resolveContext: includeKnowledgeGraph=true attaches the real buildProjectGraph() shape verbatim as context.knowledgeGraph", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.ok(context.knowledgeGraph);
  assert.deepEqual(Object.keys(context.knowledgeGraph).sort(), EXPECTED_KG_KEYS);
  assert.equal(context.knowledgeGraph.schema_version, "1.0");
});

test("agent-tools resolveContext: includeKnowledgeGraph=true attaches the real Knowledge Graph shape", async () => {
  const context = await agentResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.deepEqual(Object.keys(context.knowledgeGraph).sort(), EXPECTED_KG_KEYS);
});

test("workflow-tools resolveContext: includeKnowledgeGraph=true attaches the real Knowledge Graph shape", async () => {
  const context = await workflowResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.deepEqual(Object.keys(context.knowledgeGraph).sort(), EXPECTED_KG_KEYS);
});

test("exact context propagation: the base context's existing fields are preserved unchanged alongside the new knowledgeGraph field", async () => {
  const sourceFiles = [{ path: "a.js", content: "eval(x);" }];
  const context = await advisorResolveContext({ context: { sourceFiles, customField: "preserved" }, includeKnowledgeGraph: true });
  assert.deepEqual(context.sourceFiles, sourceFiles);
  assert.equal(context.customField, "preserved");
  assert.ok(context.knowledgeGraph);
});

test("includeKnowledgeGraph works together with projectRoot -- the two are orthogonal, not mutually exclusive", async () => {
  const root = await makeTempDir();
  await writeFile(root, "package.json", '{"name":"test"}');
  await writeFile(root, "index.js", "export const a = 1;");

  const context = await advisorResolveContext({ projectRoot: root, includeKnowledgeGraph: true });
  assert.equal(context.projectType, "generic-js");
  assert.deepEqual(context.sourceFiles.map((f) => f.path).sort(), ["index.js", "package.json"]);
  assert.ok(context.knowledgeGraph);
});

// ---------------------------------------------------------------------
// Advisor / Agent / Workflow execution with Knowledge Graph attached
// ---------------------------------------------------------------------

test("handleAdvisorRun succeeds with includeKnowledgeGraph=true -- the advisor's own result is unaffected since it only reads sourceFiles", async () => {
  const result = await handleAdvisorRun({
    id: "security",
    context: { sourceFiles: [{ path: "a.js", content: "eval(x);" }] },
    includeKnowledgeGraph: true,
  });
  assert.equal(result.success, true);
  assert.ok(result.findings.some((f) => f.severity === "critical"));
});

test("handleAgentRun succeeds with includeKnowledgeGraph=true", async () => {
  const result = await handleAgentRun({ id: "architecture-remediation", context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.equal(result.success, true);
});

test("handleWorkflowRun succeeds with includeKnowledgeGraph=true", async () => {
  const result = await handleWorkflowRun({ id: "project-health-check", context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.equal(result.success, true);
});

// ---------------------------------------------------------------------
// Backward compatibility / optional behavior
// ---------------------------------------------------------------------

test("backward compatibility: omitting includeKnowledgeGraph entirely produces no knowledgeGraph field at all", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] } });
  assert.equal("knowledgeGraph" in context, false);
});

test("optional behavior: includeKnowledgeGraph explicitly false produces no knowledgeGraph field", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: false });
  assert.equal("knowledgeGraph" in context, false);
});

test("backward compatibility: handleAdvisorRun's existing behavior is completely unchanged when includeKnowledgeGraph is not supplied", async () => {
  const result = await handleAdvisorRun({ id: "security", context: { sourceFiles: [{ path: "a.js", content: "eval(x);" }] } });
  assert.equal(result.success, true);
  assert.ok(result.findings.some((f) => f.severity === "critical"));
});

test("backward compatibility: mutual exclusivity between context and projectRoot is completely unaffected by this stage's changes", async () => {
  const root = await makeTempDir();
  await assert.rejects(
    () => advisorResolveContext({ context: { sourceFiles: [] }, projectRoot: root }),
    /Supply either 'context' or 'projectRoot', not both\./
  );
});

// ---------------------------------------------------------------------
// Invalid WordPress connection handling / never-throws contract
// ---------------------------------------------------------------------

test("never throws: includeKnowledgeGraph=true with no WordPress connection configured still resolves successfully, with per-section errors inside the graph itself", async () => {
  await assert.doesNotReject(async () => {
    const context = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
    assert.ok(context.knowledgeGraph);
    assert.equal(typeof context.knowledgeGraph.site.error, "string");
  });
});

test("structured error reporting: an invalid WordPress connection surfaces as per-section errors inside context.knowledgeGraph, not a thrown adapter error", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.equal(context.knowledgeGraph.site.data, null);
  assert.equal(typeof context.knowledgeGraph.site.error, "string");
  assert.ok(context.knowledgeGraph.site.error.length > 0);
});

test("handleAdvisorRun with includeKnowledgeGraph=true and no WordPress connection still returns a successful Advisor Report -- the advisor itself never sees or cares about the knowledgeGraph field", async () => {
  const result = await handleAdvisorRun({
    id: "security",
    context: { sourceFiles: [{ path: "a.js", content: "eval(x);" }] },
    includeKnowledgeGraph: true,
  });
  assert.equal(result.success, true);
});

// ---------------------------------------------------------------------
// No caching -- each call rebuilds the graph independently (per this
// stage's explicit "do not introduce caching" requirement)
// ---------------------------------------------------------------------

test("each resolveContext call with includeKnowledgeGraph=true independently rebuilds generated_at (no caching introduced)", async () => {
  const contextA = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  await new Promise((resolve) => setTimeout(resolve, 5));
  const contextB = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.notEqual(contextA.knowledgeGraph.generated_at, contextB.knowledgeGraph.generated_at);
});
