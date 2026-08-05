/**
 * Project & Client Memory — Stage 2 (Intelligence Layer).
 *
 * Stores VERIFIED FACTS ONLY: point-in-time snapshots of data that came from
 * a real source (e.g. a Knowledge Graph build against a live REST API).
 * This module has no concept of "AI reasoning" or "conclusions" — it never
 * accepts or stores speculative fields. Callers decide what counts as a
 * verified fact; this module just persists and diffs whatever object it's
 * given, unchanged.
 *
 * Unified schema: a single `scope = { client_id, project_id }` shape covers
 * both project-scoped and client-scoped data. At least one of the two must
 * be set. There is no separate "client memory" code path — a client-level
 * fact is just a scope with `project_id` omitted.
 *
 * Design notes:
 * - `createMemoryStore(rootDir)` is a factory, not a module-level singleton,
 *   so tests can point it at a throwaway temp directory (same DI pattern
 *   knowledge-graph.js uses for `wpRequest`).
 * - Storage is flat JSON files, git-trackable — one `index.json` per scope
 *   (metadata only, for fast listing) plus one file per full snapshot.
 * - Diffing is intentionally shallow: top-level key comparison on whatever
 *   `data` object was stored. This module knows nothing about the Knowledge
 *   Graph's internal shape — it would work identically over any other
 *   verified-fact object a future module hands it.
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const MEMORY_SCHEMA_VERSION = "1.0";

function safeSegment(value) {
  const cleaned = String(value ?? "").replace(/[^a-zA-Z0-9_-]/g, "_");
  return cleaned || "_";
}

function validateScope(scope) {
  if (!scope || (!scope.client_id && !scope.project_id)) {
    throw new Error(
      "scope requires at least one of client_id or project_id (unified project/client schema)."
    );
  }
}

// Stable stringify: sorts object keys recursively so identical content
// always hashes the same, regardless of key insertion order.
function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function hashData(data) {
  return crypto.createHash("sha256").update(stableStringify(data)).digest("hex");
}

// Shallow, per-top-level-key diff. Deliberately generic — no knowledge of
// what "data" represents beyond "an object with keys."
function diffData(fromData, toData) {
  const keys = new Set([
    ...Object.keys(fromData || {}),
    ...Object.keys(toData || {}),
  ]);
  const changes = {};
  for (const key of keys) {
    if (key === "generated_at") continue; // always differs; not a meaningful change
    const before = fromData ? fromData[key] : undefined;
    const after = toData ? toData[key] : undefined;
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes[key] = { before, after };
    }
  }
  return changes;
}

export function createMemoryStore(rootDir) {
  function scopeDir(scope) {
    validateScope(scope);
    return path.join(
      rootDir,
      safeSegment(scope.client_id || "_no-client"),
      safeSegment(scope.project_id || "_client-level")
    );
  }

  async function readIndex(dir) {
    try {
      const text = await fs.readFile(path.join(dir, "index.json"), "utf8");
      return JSON.parse(text);
    } catch (err) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
  }

  async function writeIndex(dir, index) {
    await fs.writeFile(path.join(dir, "index.json"), JSON.stringify(index, null, 2));
  }

  /**
   * @param {{ scope: {client_id?: string, project_id?: string}, data: object, source: string }} input
   * @returns {Promise<object>} the full stored record, including `data`
   */
  async function saveSnapshot({ scope, data, source = "unknown" }) {
    validateScope(scope);
    const dir = scopeDir(scope);
    await fs.mkdir(path.join(dir, "snapshots"), { recursive: true });

    const hash = hashData(data);
    const timestamp = new Date().toISOString();
    const id = `snap_${timestamp.replace(/[:.]/g, "-")}_${hash.slice(0, 8)}`;

    const record = {
      id,
      timestamp,
      memory_schema_version: MEMORY_SCHEMA_VERSION,
      source,
      scope,
      hash,
      data_schema_version: data && data.schema_version ? data.schema_version : null,
      data,
    };

    await fs.writeFile(
      path.join(dir, "snapshots", `${id}.json`),
      JSON.stringify(record, null, 2)
    );

    const { data: _omit, ...meta } = record;
    const index = await readIndex(dir);
    index.push(meta);
    await writeIndex(dir, index);

    return record;
  }

  /**
   * @param {{ scope: object }} input
   * @returns {Promise<object[]>} metadata only (no `data`), newest last
   */
  async function listSnapshots({ scope }) {
    validateScope(scope);
    return readIndex(scopeDir(scope));
  }

  /**
   * @param {{ scope: object, id: string }} input
   * @returns {Promise<object>} the full stored record, including `data`
   */
  async function getSnapshot({ scope, id }) {
    validateScope(scope);
    const file = path.join(scopeDir(scope), "snapshots", `${safeSegment(id)}.json`);
    const text = await fs.readFile(file, "utf8");
    return JSON.parse(text);
  }

  /**
   * @param {{ scope: object, from_id: string, to_id: string }} input
   */
  async function diffSnapshots({ scope, from_id, to_id }) {
    const [from, to] = await Promise.all([
      getSnapshot({ scope, id: from_id }),
      getSnapshot({ scope, id: to_id }),
    ]);
    return {
      from: { id: from.id, timestamp: from.timestamp, hash: from.hash },
      to: { id: to.id, timestamp: to.timestamp, hash: to.hash },
      unchanged: from.hash === to.hash,
      changes: from.hash === to.hash ? {} : diffData(from.data, to.data),
    };
  }

  return { saveSnapshot, listSnapshots, getSnapshot, diffSnapshots };
}
