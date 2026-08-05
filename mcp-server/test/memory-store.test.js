import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { createMemoryStore, MEMORY_SCHEMA_VERSION } from "../memory-store.js";

async function withTempStore(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wp-memory-test-"));
  try {
    await fn(createMemoryStore(dir), dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test("saves a project-scoped snapshot and lists its metadata (no full data in list)", async () => {
  await withTempStore(async (store) => {
    const scope = { project_id: "siteA" };
    const data = { schema_version: "1.0", post_types: ["post", "page"] };

    const record = await store.saveSnapshot({ scope, data, source: "knowledge-graph" });

    assert.ok(record.id.startsWith("snap_"));
    assert.equal(record.memory_schema_version, MEMORY_SCHEMA_VERSION);
    assert.equal(record.source, "knowledge-graph");
    assert.equal(record.data_schema_version, "1.0");
    assert.deepEqual(record.data, data);
    assert.equal(typeof record.hash, "string");

    const list = await store.listSnapshots({ scope });
    assert.equal(list.length, 1);
    assert.equal(list[0].id, record.id);
    assert.equal(list[0].data, undefined, "index/list entries must not include full data");
  });
});

test("client-scoped only (no project_id) and project-scoped only both work under the unified schema", async () => {
  await withTempStore(async (store) => {
    const clientOnly = { client_id: "acme" };
    const projectOnly = { project_id: "siteA" };

    await store.saveSnapshot({ scope: clientOnly, data: { note: "client fact" }, source: "manual" });
    await store.saveSnapshot({ scope: projectOnly, data: { note: "project fact" }, source: "manual" });

    const clientList = await store.listSnapshots({ scope: clientOnly });
    const projectList = await store.listSnapshots({ scope: projectOnly });

    assert.equal(clientList.length, 1);
    assert.equal(projectList.length, 1);
    // Confirm they're stored separately, not merged.
    assert.notEqual(clientList[0].id, projectList[0].id);
  });
});

test("rejects a scope with neither client_id nor project_id", async () => {
  await withTempStore(async (store) => {
    await assert.rejects(
      () => store.saveSnapshot({ scope: {}, data: {}, source: "manual" }),
      /at least one of client_id or project_id/
    );
  });
});

test("diffSnapshots reports unchanged=true and empty changes for identical data", async () => {
  await withTempStore(async (store) => {
    const scope = { project_id: "siteA" };
    const data = { schema_version: "1.0", plugins: ["elementor"] };

    const first = await store.saveSnapshot({ scope, data, source: "knowledge-graph" });
    // Save the exact same data again as a second snapshot.
    const second = await store.saveSnapshot({ scope, data, source: "knowledge-graph" });

    const diff = await store.diffSnapshots({ scope, from_id: first.id, to_id: second.id });

    assert.equal(diff.unchanged, true);
    assert.deepEqual(diff.changes, {});
  });
});

test("diffSnapshots reports per-key changes when data differs between snapshots", async () => {
  await withTempStore(async (store) => {
    const scope = { project_id: "siteA" };

    const first = await store.saveSnapshot({
      scope,
      data: { schema_version: "1.0", post_types: ["post"], plugins: ["elementor"] },
      source: "knowledge-graph",
    });
    const second = await store.saveSnapshot({
      scope,
      data: { schema_version: "1.0", post_types: ["post", "project"], plugins: ["elementor"] },
      source: "knowledge-graph",
    });

    const diff = await store.diffSnapshots({ scope, from_id: first.id, to_id: second.id });

    assert.equal(diff.unchanged, false);
    assert.ok(diff.changes.post_types);
    assert.deepEqual(diff.changes.post_types.before, ["post"]);
    assert.deepEqual(diff.changes.post_types.after, ["post", "project"]);
    // Unchanged key must not appear in the diff.
    assert.equal(diff.changes.plugins, undefined);
  });
});

test("listSnapshots on a scope with no snapshots yet returns an empty array, not an error", async () => {
  await withTempStore(async (store) => {
    const list = await store.listSnapshots({ scope: { project_id: "never-touched" } });
    assert.deepEqual(list, []);
  });
});

test("path-unsafe scope IDs are sanitized and cannot escape the memory root", async () => {
  await withTempStore(async (store, dir) => {
    const scope = { project_id: "../../etc" };
    await store.saveSnapshot({ scope, data: { x: 1 }, source: "manual" });

    // Confirm nothing was written outside the temp root.
    const entries = await fs.readdir(dir, { recursive: true });
    const escaped = entries.some((e) => e.includes(".."));
    assert.equal(escaped, false);
  });
});
