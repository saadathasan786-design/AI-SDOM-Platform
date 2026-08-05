import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { advisorTools, resolveContext as advisorResolveContext, handleAdvisorRun } from "../advisor-tools.js";
import { agentTools, resolveContext as agentResolveContext, handleAgentRun } from "../agent-tools.js";
import { workflowTools, resolveContext as workflowResolveContext, handleWorkflowRun } from "../workflow-tools.js";
import { createMemoryStore } from "../memory-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The exact same real memory/ directory resolveContext()'s internal
// memory instance points at (mcp-server/../memory) -- necessary to
// exercise the real, actual integration path end-to-end, since
// resolveContext() does not accept an injectable store. Every scope
// used below is uniquely test-prefixed and removed in the after() hook
// to avoid permanently polluting the repository's checked-in memory/
// directory.
const REAL_MEMORY_DIR = path.join(__dirname, "..", "..", "memory");
const realMemory = createMemoryStore(REAL_MEMORY_DIR);

const TEST_SCOPE_PREFIX = "stage9c-test-" + Date.now();
const usedScopeProjectIds = [];

function uniqueScope(suffix) {
  const project_id = `${TEST_SCOPE_PREFIX}-${suffix}`;
  usedScopeProjectIds.push(project_id);
  return { project_id };
}

after(async () => {
  for (const project_id of usedScopeProjectIds) {
    const dir = path.join(REAL_MEMORY_DIR, "_no-client", project_id);
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "mcp-memory-test-"));
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

test("advisor_run and advisor_runMany schemas declare memoryScope as an optional object", () => {
  const runTool = advisorTools.find((t) => t.name === "advisor_run");
  assert.equal(runTool.inputSchema.properties.memoryScope.type, "object");
  assert.ok(!runTool.inputSchema.required.includes("memoryScope"));

  const runManyTool = advisorTools.find((t) => t.name === "advisor_runMany");
  assert.equal(runManyTool.inputSchema.properties.memoryScope.type, "object");
});

test("agent_run schema declares memoryScope as an optional object", () => {
  const runTool = agentTools.find((t) => t.name === "agent_run");
  assert.equal(runTool.inputSchema.properties.memoryScope.type, "object");
});

test("workflow_run schema declares memoryScope as an optional object", () => {
  const runTool = workflowTools.find((t) => t.name === "workflow_run");
  assert.equal(runTool.inputSchema.properties.memoryScope.type, "object");
});

// ---------------------------------------------------------------------
// Successful Memory injection -- empty store / with real snapshots
// ---------------------------------------------------------------------

test("Memory only: an empty Memory Store scope produces an empty memoryHistory array, not an error", async () => {
  const scope = uniqueScope("empty");
  const context = await advisorResolveContext({ context: { sourceFiles: [] }, memoryScope: scope });
  assert.deepEqual(context.memoryHistory, []);
  assert.ok(!("knowledgeGraph" in context));
});

test("Memory only: a scope with real saved snapshots returns their metadata verbatim as memoryHistory", async () => {
  const scope = uniqueScope("real-snapshot");
  const saved = await realMemory.saveSnapshot({ scope, data: { hello: "world" }, source: "stage9c-test" });

  const context = await advisorResolveContext({ context: { sourceFiles: [] }, memoryScope: scope });
  assert.equal(context.memoryHistory.length, 1);
  assert.equal(context.memoryHistory[0].id, saved.id);
  assert.equal(context.memoryHistory[0].source, "stage9c-test");
  assert.ok(!("data" in context.memoryHistory[0]), "listSnapshots returns metadata only, never data -- confirmed unchanged");
});

test("agent-tools resolveContext: Memory injection works identically", async () => {
  const scope = uniqueScope("agent-memory");
  const context = await agentResolveContext({ context: { sourceFiles: [] }, memoryScope: scope });
  assert.deepEqual(context.memoryHistory, []);
});

test("workflow-tools resolveContext: Memory injection works identically", async () => {
  const scope = uniqueScope("workflow-memory");
  const context = await workflowResolveContext({ context: { sourceFiles: [] }, memoryScope: scope });
  assert.deepEqual(context.memoryHistory, []);
});

// ---------------------------------------------------------------------
// Coexistence with Knowledge Graph
// ---------------------------------------------------------------------

test("Knowledge Graph only: memoryScope omitted produces no memoryHistory field", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.ok("knowledgeGraph" in context);
  assert.ok(!("memoryHistory" in context));
});

test("both Memory and Knowledge Graph together: both fields present, base context preserved", async () => {
  const scope = uniqueScope("both");
  const context = await advisorResolveContext({
    context: { sourceFiles: [{ path: "a.js", content: "x" }] },
    includeKnowledgeGraph: true,
    memoryScope: scope,
  });
  assert.deepEqual(Object.keys(context.knowledgeGraph).sort(), EXPECTED_KG_KEYS);
  assert.deepEqual(context.memoryHistory, []);
  assert.deepEqual(context.sourceFiles, [{ path: "a.js", content: "x" }]);
});

test("neither Memory nor Knowledge Graph supplied: neither field present, exactly as before Stage 9B/9C", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] } });
  assert.ok(!("knowledgeGraph" in context));
  assert.ok(!("memoryHistory" in context));
});

test("all three optional sources combined: projectRoot + includeKnowledgeGraph + memoryScope all work together", async () => {
  const root = await makeTempDir();
  await fs.writeFile(path.join(root, "package.json"), '{"name":"test"}');
  const scope = uniqueScope("all-three");

  const context = await advisorResolveContext({ projectRoot: root, includeKnowledgeGraph: true, memoryScope: scope });
  assert.equal(context.projectType, "generic-js");
  assert.ok("knowledgeGraph" in context);
  assert.deepEqual(context.memoryHistory, []);
});

// ---------------------------------------------------------------------
// Advisor / Agent / Workflow execution with Memory attached
// ---------------------------------------------------------------------

test("handleAdvisorRun succeeds with memoryScope supplied -- the advisor's own result is unaffected since it only reads sourceFiles", async () => {
  const scope = uniqueScope("advisor-exec");
  const result = await handleAdvisorRun({
    id: "security",
    context: { sourceFiles: [{ path: "a.js", content: "eval(x);" }] },
    memoryScope: scope,
  });
  assert.equal(result.success, true);
  assert.ok(result.findings.some((f) => f.severity === "critical"));
});

test("handleAgentRun succeeds with memoryScope supplied", async () => {
  const scope = uniqueScope("agent-exec");
  const result = await handleAgentRun({ id: "architecture-remediation", context: { sourceFiles: [] }, memoryScope: scope });
  assert.equal(result.success, true);
});

test("handleWorkflowRun succeeds with memoryScope supplied", async () => {
  const scope = uniqueScope("workflow-exec");
  const result = await handleWorkflowRun({ id: "project-health-check", context: { sourceFiles: [] }, memoryScope: scope });
  assert.equal(result.success, true);
});

test("handleAdvisorRun succeeds with both memoryScope and includeKnowledgeGraph supplied together", async () => {
  const scope = uniqueScope("advisor-both-exec");
  const result = await handleAdvisorRun({
    id: "security",
    context: { sourceFiles: [{ path: "a.js", content: "eval(x);" }] },
    memoryScope: scope,
    includeKnowledgeGraph: true,
  });
  assert.equal(result.success, true);
});

// ---------------------------------------------------------------------
// Backward compatibility / optional behavior
// ---------------------------------------------------------------------

test("backward compatibility: omitting memoryScope entirely produces no memoryHistory field at all", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] } });
  assert.equal("memoryHistory" in context, false);
});

test("backward compatibility: handleAdvisorRun's existing behavior is completely unchanged when neither includeKnowledgeGraph nor memoryScope is supplied", async () => {
  const result = await handleAdvisorRun({ id: "security", context: { sourceFiles: [{ path: "a.js", content: "eval(x);" }] } });
  assert.equal(result.success, true);
  assert.ok(result.findings.some((f) => f.severity === "critical"));
});

test("backward compatibility: mutual exclusivity between context and projectRoot is completely unaffected by Memory integration", async () => {
  const root = await makeTempDir();
  await assert.rejects(
    () => advisorResolveContext({ context: { sourceFiles: [] }, projectRoot: root }),
    /Supply either 'context' or 'projectRoot', not both\./
  );
});

test("backward compatibility: Knowledge Graph integration from Stage 9B still works completely unaffected", async () => {
  const context = await advisorResolveContext({ context: { sourceFiles: [] }, includeKnowledgeGraph: true });
  assert.deepEqual(Object.keys(context.knowledgeGraph).sort(), EXPECTED_KG_KEYS);
});

// ---------------------------------------------------------------------
// Structured error handling / missing identifiers
// ---------------------------------------------------------------------

test("missing project/client identifiers: an empty memoryScope object throws memory-store.js's own pre-existing, unmodified validation error", async () => {
  await assert.rejects(
    () => advisorResolveContext({ context: { sourceFiles: [] }, memoryScope: {} }),
    /scope requires at least one of client_id or project_id/
  );
});

test("this validation error propagates naturally to handleAdvisorRun as a structured, catchable rejection (never an unhandled crash)", async () => {
  await assert.rejects(
    () => handleAdvisorRun({ id: "security", context: { sourceFiles: [] }, memoryScope: {} }),
    /scope requires at least one of client_id or project_id/
  );
});

test("a memoryScope with only client_id (no project_id) is valid, per memory-store.js's own unmodified rule", async () => {
  const scope = { client_id: `${TEST_SCOPE_PREFIX}-client-only` };
  const context = await advisorResolveContext({ context: { sourceFiles: [] }, memoryScope: scope });
  assert.deepEqual(context.memoryHistory, []);
  await fs.rm(path.join(REAL_MEMORY_DIR, scope.client_id), { recursive: true, force: true }).catch(() => {});
});

// ---------------------------------------------------------------------
// Never-throws contract (of the underlying framework calls -- the
// adapter's own scope-validation error is a legitimate, structured
// throw, matching the pre-existing convention already established for
// mutual exclusivity and "requires a non-empty string 'id'")
// ---------------------------------------------------------------------

test("never-throws: once past scope validation, retrieving Memory for a genuinely empty/missing-snapshots scope never throws", async () => {
  const scope = uniqueScope("never-throws-empty");
  await assert.doesNotReject(() => advisorResolveContext({ context: { sourceFiles: [] }, memoryScope: scope }));
});

test("never-throws: the underlying Advisor/Agent/Workflow execution never throws even when Memory and Knowledge Graph are both attached", async () => {
  const scope = uniqueScope("never-throws-both");
  await assert.doesNotReject(() =>
    handleAdvisorRun({
      id: "security",
      context: { sourceFiles: [] },
      memoryScope: scope,
      includeKnowledgeGraph: true,
    })
  );
});
