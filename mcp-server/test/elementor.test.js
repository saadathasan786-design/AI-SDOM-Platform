import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { createElementorService, sha256Stable } from "../elementor.js";
import { createMemoryStore } from "../memory-store.js";
import { handleElementorInspect, handleElementorPatch, elementorTools } from "../elementor-tools.js";

// A realistic nested document: one outer container -> two inner containers ->
// widgets, including a nested element to prove deep find, plus globals and an
// image widget to prove the structural guard sees them.
function sampleDocument() {
  return [
    {
      id: "c1",
      elType: "container",
      settings: { __globals__: { color: "globals/colors?id=astglobalcolor0" } },
      elements: [
        {
          id: "c2",
          elType: "container",
          settings: {},
          elements: [
            {
              id: "w1",
              elType: "widget",
              widgetType: "heading",
              settings: { title: "Hello", heading_level: "h2" },
              elements: [],
            },
            {
              id: "w2",
              elType: "widget",
              widgetType: "text-editor",
              settings: { editor: "<p>Innovate Your Workflow</p>" },
              elements: [],
            },
            {
              id: "w3",
              elType: "widget",
              widgetType: "image",
              settings: { image: { url: "http://x/img.jpg", id: 99, size: "full" } },
              elements: [],
            },
          ],
        },
      ],
    },
  ];
}

function makeFakeWpRequest(store) {
  // store: a mutable holder so a test can mutate it as if WordPress changed.
  const state = store;
  return async function fakeWpRequest(path, { method = "GET", body } = {}) {
    if (method === "POST" && body && body.meta && body.meta._elementor_data) {
      state.current = JSON.parse(body.meta._elementor_data);
    }
    const page = {
      meta: {
        _elementor_edit_mode: "builder",
        _elementor_data: JSON.stringify(state.current),
      },
    };
    return page;
  };
}

// Write-counting fake used by the integrity-gate regression tests. A real
// validation write must never be issued for a malformed/truncated baseline:
// any POST on a bad baseline throws loudly and is counted, so the tests can
// assert ZERO mutation calls even if the guard is later accidentally removed.
function makeIntegrityGateWpRequest(badRaw) {
  let writes = 0;
  return {
    wpRequest: async function integrityGateRequest(path, { method = "GET", body } = {}) {
      if (method === "POST") {
        writes += 1;
        throw new Error("INTEGRITY-GATE VIOLATION: a mutation write was attempted on an unparseable document");
      }
      return {
        meta: {
          _elementor_edit_mode: "builder",
          _elementor_data: badRaw,
        },
      };
    },
    writes: () => writes,
  };
}

// Write-counting variant of makeFakeWpRequest for the valid-baseline contrast
// test: proves the counter actually fires (1 write / 1 snapshot) whenever the
// parse gate is satisfied, so the zero-write assertion above is meaningful.
function makeCountingWpRequest(store) {
  const state = store;
  let writes = 0;
  return {
    wpRequest: async function countingRequest(path, { method = "GET", body } = {}) {
      if (method === "POST" && body && body.meta && body.meta._elementor_data) {
        writes += 1;
        state.current = JSON.parse(body.meta._elementor_data);
      }
      const page = {
        meta: {
          _elementor_edit_mode: "builder",
          _elementor_data: JSON.stringify(state.current),
        },
      };
      return page;
    },
    writes: () => writes,
  };
}

function baselineHash() {
  return sha256Stable(sampleDocument());
}

// ---------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------

test("elementor tools are exposed with the expected names", () => {
  const names = elementorTools.map((t) => t.name);
  assert.deepEqual(names, ["wp_elementor_inspect", "wp_elementor_patch"]);
});

test("wp_elementor_patch declares the governed safety inputs", () => {
  const tool = elementorTools.find((t) => t.name === "wp_elementor_patch");
  const props = tool.inputSchema.properties;
  assert.ok(props.expected_baseline_sha256, "stale-baseline guard input present");
  assert.equal(props.allow_structural.type, "boolean");
  assert.equal(props.dry_run.type, "boolean");
  const req = tool.inputSchema.required;
  assert.ok(req.includes("page_id") && req.includes("element_id") && req.includes("property_path") && req.includes("value"));
});

// ---------------------------------------------------------------------
// Inspect
// ---------------------------------------------------------------------

test("inspect returns element count, is_elementor, and a stable document SHA-256", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const res = await service.inspect({ page_id: 12 });
  assert.equal(res.page_id, 12);
  // true count: c1,c2,w1,w2,w3 = 5
  assert.equal(res.element_count, 5);
  assert.equal(res.is_elementor, true);
  assert.equal(res.document_sha256, baselineHash());
});

test("inspect with element_id returns that element's settings", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const res = await service.inspect({ page_id: 12, element_id: "w2" });
  assert.equal(res.element.id, "w2");
  assert.equal(res.element.widgetType, "text-editor");
  assert.equal(res.element.settings.editor, "<p>Innovate Your Workflow</p>");
});

test("inspect with a missing element_id throws a clear error", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  await assert.rejects(() => service.inspect({ page_id: 12, element_id: "nope" }), /not found/);
});

test("inspect on a non-Elementor page throws", async () => {
  const service = createElementorService({
    wpRequest: async () => ({ meta: { _elementor_edit_mode: "page", _elementor_data: "[]" } }),
    memory: null,
  });
  await assert.rejects(() => service.inspect({ page_id: 1 }), /not an Elementor page/);
});

test("inspect on malformed _elementor_data throws", async () => {
  const service = createElementorService({
    wpRequest: async () => ({ meta: { _elementor_edit_mode: "builder", _elementor_data: "not json" } }),
    memory: null,
  });
  await assert.rejects(() => service.inspect({ page_id: 1 }), /malformed/);
});

test("inspect on empty _elementor_data throws", async () => {
  const service = createElementorService({
    wpRequest: async () => ({ meta: { _elementor_edit_mode: "builder", _elementor_data: "" } }),
    memory: null,
  });
  await assert.rejects(() => service.inspect({ page_id: 1 }), /no _elementor_data/);
});

// ---------------------------------------------------------------------
// Patch — simple (non-structural) edits
// ---------------------------------------------------------------------

test("simple patch changes only the targeted property and verifies", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const res = await service.patch({
    page_id: 12,
    element_id: "w2",
    property_path: "settings.editor",
    value: "<p>New Copy</p>",
  });
  assert.equal(res.verified, true);
  assert.equal(res.structural_changed, false);
  assert.notEqual(res.after_sha256, baselineHash());
  // target updated in persisted state
  const reread = await service.inspect({ page_id: 12, element_id: "w2" });
  assert.equal(reread.element.settings.editor, "<p>New Copy</p>");
});

test("patch matches the real page-12 baseline hash difference shape (single text edit)", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const before = await service.inspect({ page_id: 12 });
  const res = await service.patch({
    page_id: 12,
    element_id: "w2",
    property_path: "settings.editor",
    value: "<p>Changed</p>",
  });
  const after = await service.inspect({ page_id: 12 });
  assert.equal(before.document_sha256, res.before_sha256);
  assert.equal(after.document_sha256, res.after_sha256);
  assert.notEqual(after.document_sha256, before.document_sha256);
});

test("non-structural edit keeps the structural fingerprint identical", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const { _internals } = service;
  const res = await service.patch({
    page_id: 12,
    element_id: "w1",
    property_path: "settings.title",
    value: "New Title",
  });
  const fpB = _internals.structuralFingerprint(sampleDocument()).hash;
  const fpA = _internals.structuralFingerprint(state.current).hash;
  assert.equal(fpA, fpB);
  assert.equal(res.structural_changed, false);
});

// ---------------------------------------------------------------------
// Patch — structural guard
// ---------------------------------------------------------------------

test("structural change is refused without allow_structural", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  // settings.image.id exists (99) and is a structural path (image id is part
  // of the structural fingerprint); must be refused without allow_structural.
  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w3",
        property_path: "settings.image.id",
        value: 12345,
      }),
    /Refusing structural change/
  );
});

test("structural change IS applied when allow_structural=true", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const fpB = service._internals.structuralFingerprint(JSON.parse(JSON.stringify(state.current))).hash;
  // swap image id -> structural (fingerprint changes), WITHOUT pre-mutating
  // state.current (patch must build the candidate from the untouched doc).
  const res = await service.patch({
    page_id: 12,
    element_id: "w3",
    property_path: "settings.image.id",
    value: 4242,
    allow_structural: true,
  });
  assert.equal(res.structural_changed, true);
  assert.equal(res.is_structural, true);
});

// ---------------------------------------------------------------------
// Stale-baseline guard & dry-run
// ---------------------------------------------------------------------

test("patch aborts on stale expected_baseline_sha256", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const headHash = await service.inspect({ page_id: 12 });
  // mutate the in-memory doc so current no longer matches the stale baseline
  state.current = JSON.parse(JSON.stringify(state.current));
  state.current[0].elements[0].elements[0].settings.title = "Already Changed";
  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w1",
        property_path: "settings.title",
        value: "X",
        expected_baseline_sha256: headHash.document_sha256,
      }),
    /Stale baseline/
  );
});

test("dry_run computes the change and writes nothing", async () => {
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null });
  const before = await service.inspect({ page_id: 12 });
  const res = await service.patch({
    page_id: 12,
    element_id: "w2",
    property_path: "settings.editor",
    value: "<p>Dry</p>",
    dry_run: true,
  });
  assert.equal(res.dry_run, true);
  assert.equal(res.simulated_value_before, "<p>Innovate Your Workflow</p>");
  assert.equal(res.simulated_value_after, "<p>Dry</p>");
  // persisted state untouched
  const after = await service.inspect({ page_id: 12 });
  assert.equal(after.document_sha256, before.document_sha256);
});

// ---------------------------------------------------------------------
// Verify & rollback
// ---------------------------------------------------------------------

test("patch escalates when verification fails because the live document drifted away from what was written (never returns a false success)", async () => {
  // A wpRequest that returns the attempted value on the FIRST write-verify
  // re-read (simulating the write "taking" but the verify re-read returning
  // an unexpected drifted value), then keeps returning the drifted document.
  // Because the live document no longer matches what AI-SDOM wrote, the
  // concurrency guard must refuse to overwrite it, and the operation must
  // escalate rather than report success.
  let calls = 0;
  let writes = 0;
  let current = sampleDocument();
  const service = createElementorService({
    wpRequest: async (path, { method = "GET", body } = {}) => {
      calls += 1;
      if (method === "POST" && body && body.meta && body.meta._elementor_data) {
        writes += 1;
        current = JSON.parse(body.meta._elementor_data);
      }
      // Simulate a mismatch: after the first write, every re-read returns a
      // TAMPERED value different from what was written (external drift).
      if (method !== "POST" && calls >= 3 && current[0].elements[0].elements[1].settings.editor.includes("New")) {
        const tampered = JSON.parse(JSON.stringify(current));
        tampered[0].elements[0].elements[1].settings.editor = "<p>Drifted</p>";
        return {
          meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(tampered) },
        };
      }
      return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(current) } };
    },
    memory: null,
  });

  const before = await service.inspect({ page_id: 12 });

  // Must escalate: verification failed (drift) AND the concurrent-change guard
  // refuses to blindly overwrite the drifted live document.
  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w2",
        property_path: "settings.editor",
        value: "<p>New</p>",
      }),
    (err) => {
      assert.match(err.message, /Verification failed/);
      assert.ok(err.rollbackFailure, "reports the guard/rollback failure");
      return true;
    }
  );

  // The concurrency guard must NOT have issued a rollback write over the
  // concurrently-changed document: only the single intended write POST happened.
  assert.equal(writes, 1, "no rollback write issued over a concurrently-changed document");

  // The drifted live document must NOT have been overwritten by a rollback.
  const after = await service.inspect({ page_id: 12, element_id: "w2" });
  assert.equal(after.element.settings.editor, "<p>Drifted</p>");
  assert.notEqual(after.document_sha256, before.document_sha256, "live doc not restored to pre-write baseline");
});

test("when verification fails but the guarded rollback succeeds, the operation is still reported as failed and restoration is verified by re-read hash", async () => {
  // The write POST "takes" in the store, but the immediate verify re-read
  // returns a corrupted value different from what was written (server-side
  // anomaly), so verification fails. The concurrency guard then re-reads the
  // live document, confirms it still equals exactly what this edit wrote, and
  // performs the rollback. The operation must STILL be reported as failed even
  // though the rollback succeeded, and the rollback must have been VERIFIED by
  // re-reading the doc and comparing its stable SHA-256 to the pre-write hash
  // (never assumed).
  let current = sampleDocument();
  let writes = 0;
  let corruptNextGet = false;
  const service = createElementorService({
    wpRequest: async (path, { method = "GET", body } = {}) => {
      if (method === "POST" && body && body.meta && body.meta._elementor_data) {
        writes += 1;
        current = JSON.parse(body.meta._elementor_data);
        corruptNextGet = writes === 1; // corrupt only the verify re-read of the write
        return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(current) } };
      }
      if (corruptNextGet) {
        corruptNextGet = false;
        const corrupted = JSON.parse(JSON.stringify(current));
        corrupted[0].elements[0].elements[1].settings.editor = "<p>Verify Anomaly</p>";
        return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(corrupted) } };
      }
      return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(current) } };
    },
    memory: null,
  });

  const before = await service.inspect({ page_id: 12 });

  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w2",
        property_path: "settings.editor",
        value: "<p>New</p>",
      }),
    (err) => {
      assert.match(err.message, /Verification failed/, "never reports a false success");
      assert.match(err.message, /reported as failed/, "reports failed even though rollback succeeded");
      assert.ok(err.rollback, "carries the rollback result");
      assert.equal(err.rollback.restored, true, "restoration set to true only after verifying re-read hash");
      assert.equal(
        err.rollback.after_rollback_sha256,
        before.document_sha256,
        "restoration compared against the original pre-write SHA-256"
      );
      return true;
    }
  );

  // Rollback was actually executed (one write POST + one rollback POST)…
  assert.equal(writes, 2, "write POST then rollback POST both issued");
  // …and it genuinely restored the pre-write baseline.
  const after = await service.inspect({ page_id: 12 });
  assert.equal(after.document_sha256, before.document_sha256, "document restored to the exact pre-write hash");
});

test("when the rollback write succeeds but restoration cannot be confirmed, the operation escalates as a rollback failure", async () => {
  // Verification fails (corrupted verify re-read); the concurrency guard sees
  // the live doc still equals this edit's write; the rollback POST restores the
  // original — but the rollback RE-READ returns a document that does NOT equal
  // the original pre-write hash. Restoration can therefore not be confirmed,
  // and the operation must escalate loudly as a rollback failure (req 3),
  // never report the mutation as complete.
  let current = sampleDocument();
  let phase = "start"; // start -> after-write -> after-rollback
  const service = createElementorService({
    wpRequest: async (path, { method = "GET", body } = {}) => {
      if (method === "POST" && body && body.meta && body.meta._elementor_data) {
        current = JSON.parse(body.meta._elementor_data);
        phase = phase === "start" ? "after-write" : "after-rollback";
        return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(current) } };
      }
      if (phase === "after-write") {
        // The immediate post-write verify re-read returns a corrupted doc.
        phase = "guard";
        const corrupted = JSON.parse(JSON.stringify(current));
        corrupted[0].elements[0].elements[1].settings.editor = "<p>Verify Anomaly</p>";
        return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(corrupted) } };
      }
      if (phase === "after-rollback") {
        // The rollback re-read returns a doc that is NOT the original.
        phase = "ended";
        const drifted = JSON.parse(JSON.stringify(current));
        drifted[0].elements[0].elements[1].settings.editor = "<p>Post-Rollback Drift</p>";
        return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(drifted) } };
      }
      return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(current) } };
    },
    memory: null,
  });

  const before = await service.inspect({ page_id: 12 });

  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w2",
        property_path: "settings.editor",
        value: "<p>New</p>",
      }),
    (err) => {
      assert.match(err.message, /Verification failed/);
      assert.ok(err.rollbackFailure, "escalates explicitly as a rollback failure");
      assert.match(err.rollbackFailure, /Rollback verification failed/);
      assert.equal(err.rollback.restored, false, "restoration not claimed when the re-read hash does not match");
      assert.notEqual(err.rollback.after_rollback_sha256, before.document_sha256);
      return true;
    }
  );

  // The underlying document was in fact restored, yet the operation still
  // escalated: elevation is driven by the verification re-read that could not
  // confirm restoration — never by assuming the rollback write succeeded.
  const after = await service.inspect({ page_id: 12 });
  assert.equal(
    after.document_sha256,
    before.document_sha256,
    "escalation is based on the unconfirmed re-read, not on the actual document content"
  );
});

test("patch surfaces an error if verification re-read itself fails, and still rolls back", async () => {
  let current = sampleDocument();
  let getCount = 0;
  let failVerify = false;
  const service = createElementorService({
    wpRequest: async (path, { method = "GET", body } = {}) => {
      if (method === "POST" && body && body.meta && body.meta._elementor_data) {
        current = JSON.parse(body.meta._elementor_data);
        failVerify = true; // arm: the next GET (the verify re-read) must fail
        return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(current) } };
      }
      // GET
      getCount += 1;
      if (failVerify) {
        failVerify = false;
        throw new Error("verify read boom");
      }
      return { meta: { _elementor_edit_mode: "builder", _elementor_data: JSON.stringify(current) } };
    },
    memory: null,
  });
  await assert.rejects(
    () =>
      service.patch({ page_id: 12, element_id: "w2", property_path: "settings.editor", value: "<p>N</p>" }),
    /Verification failed/
  );
});

// ---------------------------------------------------------------------
// Memory integration: baseline snapshot, patch, revert -> hash returns
// ---------------------------------------------------------------------

test("patch snapshots baseline to Memory and a full cycle restores the baseline hash", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "el-mem-test-"));
  const memory = createMemoryStore(tmp);
  const scope = { project_id: "el-cycle-test" };
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory });

  const res = await service.patch({
    page_id: 12,
    element_id: "w2",
    property_path: "settings.editor",
    value: "<p>Cycle Change</p>",
    scope,
  });
  assert.ok(res.snapshot_id, "baseline snapshot persisted");
  assert.equal(res.verified, true);

  // restore via a plain write of the original doc, then confirm the hash
  // returns to the pre-change baseline (proving the snapshot hash is the
  // restore target).
  await service.patch({
    page_id: 12,
    element_id: "w2",
    property_path: "settings.editor",
    value: "<p>Innovate Your Workflow</p>",
    scope,
  });
  const final = await service.inspect({ page_id: 12 });
  assert.equal(final.document_sha256, baselineHash(), "restored content hash equals baseline");
  await fs.rm(tmp, { recursive: true, force: true });
});

test("an invalid or refused mutation request never persists a baseline snapshot", async () => {
  // req 5: the baseline snapshot must only be taken AFTER planning and the
  // structural guard have succeeded. Every refusal below must leave the
  // Memory scope empty (no verified-fact baseline for a change that was
  // never planned/approved).
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "el-no-snapshot-test-"));
  const memory = createMemoryStore(tmp);
  const scope = { project_id: "el-no-snapshot-test" };
  const state = { current: sampleDocument() };
  const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory });

  // structural change refused without allow_structural
  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w3",
        property_path: "settings.image.id",
        value: 999,
        scope,
      }),
    /Refusing structural change/
  );

  // unknown element
  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "missing",
        property_path: "settings.title",
        value: "x",
        scope,
      }),
    /not found/
  );

  // property path does not exist
  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w1",
        property_path: "settings.nonexistent",
        value: "x",
        scope,
      }),
    /does not exist/
  );

  // stale baseline refused before anything is planned
  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w1",
        property_path: "settings.title",
        value: "x",
        expected_baseline_sha256: "deadbeef",
        scope,
      }),
    /Stale baseline/
  );

  const snapshots = await memory.listSnapshots({ scope });
  assert.deepEqual(snapshots, [], "no baseline snapshot persisted for a request that failed planning or structural validation");
  await fs.rm(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------------
// Integrity gate: malformed / truncated _elementor_data baselines must be
// rejected as a HARD precondition failure BEFORE any governed mutation and
// before any Memory snapshot is taken. Regression coverage for the Page 12
// integrity incident (the live document's _elementor_data tail was corrupt,
// e.g. a stray `,...]]`, and must never reach planning/validation/write).
// ---------------------------------------------------------------------

test("patch on a malformed _elementor_data baseline rejects, issues ZERO writes, and persists ZERO snapshots", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "el-malformed-gate-"));
  const memory = createMemoryStore(tmp);
  const scope = { project_id: "el-malformed-gate" };
  const fake = makeIntegrityGateWpRequest("'definitely not serializable json {{{");
  const service = createElementorService({ wpRequest: fake.wpRequest, memory });

  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w1",
        property_path: "settings.title",
        value: "x",
        scope,
      }),
    /malformed _elementor_data/,
    "the parse gate surfaces its clear integrity error instead of attempting the mutation"
  );

  assert.equal(fake.writes(), 0, "ZERO mutation writes issued against the live REST API");
  const snapshots = await memory.listSnapshots({ scope });
  assert.deepEqual(snapshots, [], "ZERO baseline snapshots persisted to Memory");
  await fs.rm(tmp, { recursive: true, force: true });
});

test("patch on a truncated _elementor_data baseline rejects, issues ZERO writes, and persists ZERO snapshots", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "el-truncated-gate-"));
  const memory = createMemoryStore(tmp);
  const scope = { project_id: "el-truncated-gate" };
  // Cut the serialized document mid-termination (missing closing brackets),
  // exacting the real incident tail shape: JSON.parse must throw.
  const truncated = JSON.stringify(sampleDocument()).slice(0, -3);
  const fake = makeIntegrityGateWpRequest(truncated);
  const service = createElementorService({ wpRequest: fake.wpRequest, memory });

  await assert.rejects(
    () =>
      service.patch({
        page_id: 12,
        element_id: "w1",
        property_path: "settings.title",
        value: "x",
        scope,
      }),
    /malformed _elementor_data/,
    "the parse gate surfaces its clear integrity error instead of attempting the mutation"
  );

  assert.equal(fake.writes(), 0, "ZERO mutation writes issued against the live REST API");
  const snapshots = await memory.listSnapshots({ scope });
  assert.deepEqual(snapshots, [], "ZERO baseline snapshots persisted to Memory");
  await fs.rm(tmp, { recursive: true, force: true });
});

test("the same counting harness performs EXACTLY one write and one snapshot on a valid baseline (proves the gate, not the counter, prevents mutation)", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "el-counting-contrast-"));
  const state = { current: sampleDocument() };
  const fake = makeCountingWpRequest(state);
  const memory = createMemoryStore(tmp);
  const scope = { project_id: "el-counting-contrast" };
  const service = createElementorService({ wpRequest: fake.wpRequest, memory });

  const res = await service.patch({
    page_id: 12,
    element_id: "w2",
    property_path: "settings.editor",
    value: "<p>Integrity gate ok</p>",
    scope,
  });

  assert.ok(res.verified, "valid baseline patch resolves and verifies");
  assert.equal(fake.writes(), 1, "EXACTLY one mutation write issued for a valid baseline");
  const snapshots = await memory.listSnapshots({ scope });
  assert.equal(snapshots.length, 1, "EXACTLY one baseline snapshot persisted for a valid baseline");
  await fs.rm(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------------
// Adapter handlers (args validation + delegation)
// ---------------------------------------------------------------------

test("handleElementorInspect validates page_id and delegates", async () => {
  const service = createElementorService({
    wpRequest: async () => ({ meta: { _elementor_edit_mode: "builder", _elementor_data: "[]" } }),
    memory: null,
  });
  await assert.rejects(
    () => handleElementorInspect({ service, args: { page_id: 0 } }),
    /positive integer 'page_id'/
  );
});

test("handleElementorPatch requires the four core args", async () => {
  const service = createElementorService({
    wpRequest: async () => ({ meta: { _elementor_edit_mode: "builder", _elementor_data: "[]" } }),
    memory: null,
  });
  await assert.rejects(
    () => handleElementorPatch({ service, args: {} }),
    /positive integer 'page_id'/
  );
  await assert.rejects(
    () =>
      handleElementorPatch({
        service,
        args: { page_id: 1, element_id: "x", property_path: "settings.editor" },
      }),
    /requires a 'value'/
  );
});
