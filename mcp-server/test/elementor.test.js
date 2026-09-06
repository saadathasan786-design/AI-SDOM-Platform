import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { createElementorService, sha256Stable } from "../elementor.js";
import { createMemoryStore } from "../memory-store.js";
import { handleElementorInspect, handleElementorPatch, handleElementorCreate, elementorTools } from "../elementor-tools.js";

function sampleDocument() {
  return [{ id: "c1", elType: "container", settings: { __globals__: { color: "globals/colors?id=astglobalcolor0" } }, elements: [{ id: "c2", elType: "container", settings: {}, elements: [
    { id: "w1", elType: "widget", widgetType: "heading", settings: { title: "Hello", heading_level: "h2" }, elements: [] },
    { id: "w2", elType: "widget", widgetType: "text-editor", settings: { editor: "<p>Innovate Your Workflow</p>" }, elements: [] },
    { id: "w3", elType: "widget", widgetType: "image", settings: { image: { url: "http://x/img.jpg", id: 99, size: "full" } }, elements: [] },
  ] }] }];
}

function makeFakeWpRequest(store) {
  const state = store;
  return async function fakeWpRequest(path, { method = "GET", body } = {}) {
    if (method === "POST" && body?.meta?._elementor_data) state.current = JSON.parse(body.meta._elementor_data);
    return { type: "page", id: 12, status: "publish", meta: { _elementor_edit_mode: "builder", _elementor_template_type: "wp-page", _elementor_data: JSON.stringify(state.current) } };
  };
}

function makeCreationWpRequest({ page, writes }) {
  const state = page;
  return async function fakeCreationRequest(path, { method = "GET", body } = {}) {
    if (method === "POST") {
      writes.count += 1;
      if (body?.meta) for (const [key, value] of Object.entries(body.meta)) state.meta[key] = value;
    }
    return { type: "page", id: state.id, status: state.status, content: state.content, meta: { ...state.meta } };
  };
}

function baseCreationSpecification() {
  return { version: "1.0", elements: [{ id: "hero", type: "Container", elements: [
    { id: "heading", type: "Heading", settings: { title: "Hello AI-SDOM", heading_level: "h1" } },
    { id: "copy", type: "Text Editor", settings: { editor: "<p>Created by AI-SDOM.</p>" } },
    { id: "cta", type: "Button", settings: { button_text: "Contact", link: { url: "/contact/" } } },
    { id: "image", type: "Image", settings: { image: { id: 123, url: "http://example.test/hero.jpg" } } },
  ] }] };
}

function makeIntegrityGateWpRequest(badRaw) {
  let writes = 0;
  return { wpRequest: async (path, { method = "GET" } = {}) => { if (method === "POST") { writes += 1; throw new Error("INTEGRITY-GATE VIOLATION"); } return { type: "page", meta: { _elementor_edit_mode: "builder", _elementor_data: badRaw } }; }, writes: () => writes };
}

function makeCountingWpRequest(store) {
  let writes = 0;
  return { wpRequest: async (path, { method = "GET", body } = {}) => { if (method === "POST" && body?.meta?._elementor_data) { writes += 1; store.current = JSON.parse(body.meta._elementor_data); } return { type: "page", meta: { _elementor_edit_mode: "builder", _elementor_template_type: "wp-page", _elementor_data: JSON.stringify(store.current) } }; }, writes: () => writes };
}

function baselineHash() { return sha256Stable(sampleDocument()); }

test("elementor tools are exposed with the expected names", () => {
  assert.deepEqual(elementorTools.map((t) => t.name), ["wp_elementor_inspect", "wp_elementor_patch", "wp_elementor_create"]);
});

test("wp_elementor_create declares the governed structured input", () => {
  const tool = elementorTools.find((t) => t.name === "wp_elementor_create");
  assert.ok(tool); assert.equal(tool.inputSchema.properties.specification.type, "object"); assert.equal(tool.inputSchema.properties.dry_run.type, "boolean"); assert.deepEqual(tool.inputSchema.required, ["page_id", "specification"]);
});

test("wp_elementor_patch declares the governed safety inputs", () => {
  const tool = elementorTools.find((t) => t.name === "wp_elementor_patch"); const props = tool.inputSchema.properties;
  assert.ok(props.expected_baseline_sha256); assert.equal(props.allow_structural.type, "boolean"); assert.equal(props.dry_run.type, "boolean");
});

test("create initializes an eligible page and verifies the generated Elementor document", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "" }, meta: { _elementor_edit_mode: "", _elementor_template_type: "", _elementor_data: "" } }; const writes = { count: 0 };
  const memory = { saveSnapshot: async ({ data }) => ({ id: "snap-create-test", data }), listSnapshots: async () => [] }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory });
  const res = await service.create({ page_id: 2645, specification: baseCreationSpecification(), scope: { project_id: "creation-test" } });
  assert.equal(res.verified, true); assert.equal(res.page_id, 2645); assert.equal(res.element_count, 5); assert.equal(res.snapshot_id, "snap-create-test"); assert.equal(writes.count, 1); assert.equal(page.meta._elementor_edit_mode, "builder"); assert.equal(page.meta._elementor_template_type, "wp-page"); assert.ok(JSON.parse(page.meta._elementor_data));
});

test("create dry-run generates a document but performs ZERO WordPress writes", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "" }, meta: { _elementor_edit_mode: "", _elementor_template_type: "", _elementor_data: "" } }; const writes = { count: 0 }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory: null });
  const res = await service.create({ page_id: 2645, specification: baseCreationSpecification(), dry_run: true }); assert.equal(res.dry_run, true); assert.equal(res.verified, false); assert.equal(res.element_count, 5); assert.equal(writes.count, 0); assert.equal(page.meta._elementor_edit_mode, "");
});

test("create rejects an already-Elementor page before any write", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "" }, meta: { _elementor_edit_mode: "builder", _elementor_template_type: "wp-page", _elementor_data: "[]" } }; const writes = { count: 0 }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory: null });
  await assert.rejects(() => service.create({ page_id: 2645, specification: baseCreationSpecification() }), /already an Elementor page/); assert.equal(writes.count, 0);
});

test("create rejects a page with meaningful existing content before any write", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "Existing content" }, meta: { _elementor_edit_mode: "", _elementor_template_type: "", _elementor_data: "" } }; const writes = { count: 0 }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory: null });
  await assert.rejects(() => service.create({ page_id: 2645, specification: baseCreationSpecification() }), /meaningful existing content/); assert.equal(writes.count, 0);
});

test("create rejects unsupported element types before any write", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "" }, meta: { _elementor_edit_mode: "", _elementor_template_type: "", _elementor_data: "" } }; const writes = { count: 0 }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory: null }); const spec = baseCreationSpecification(); spec.elements[0].elements.push({ id: "video", type: "Video" });
  await assert.rejects(() => service.create({ page_id: 2645, specification: spec }), /Unsupported element type/); assert.equal(writes.count, 0);
});

test("create rejects duplicate element IDs before any write", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "" }, meta: { _elementor_edit_mode: "", _elementor_template_type: "", _elementor_data: "" } }; const writes = { count: 0 }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory: null }); const spec = baseCreationSpecification(); spec.elements[0].elements[1].id = "heading";
  await assert.rejects(() => service.create({ page_id: 2645, specification: spec }), /Duplicate element id/); assert.equal(writes.count, 0);
});

test("create rejects an invalid child relationship before any write", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "" }, meta: { _elementor_edit_mode: "", _elementor_template_type: "", _elementor_data: "" } }; const writes = { count: 0 }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory: null }); const spec = { version: "1.0", elements: [{ id: "heading", type: "Heading", elements: [{ id: "nested", type: "Text Editor" }] }] };
  await assert.rejects(() => service.create({ page_id: 2645, specification: spec }), /cannot contain child elements/); assert.equal(writes.count, 0);
});

test("create rejects arbitrary _elementor_data input before any write", async () => {
  const page = { id: 2645, status: "draft", content: { raw: "" }, meta: { _elementor_edit_mode: "", _elementor_template_type: "", _elementor_data: "" } }; const writes = { count: 0 }; const service = createElementorService({ wpRequest: makeCreationWpRequest({ page, writes }), memory: null }); const spec = { version: "1.0", elements: [], _elementor_data: "[]" };
  await assert.rejects(() => service.create({ page_id: 2645, specification: spec }), /arbitrary _elementor_data/); assert.equal(writes.count, 0);
});

test("inspect returns element count, is_elementor, and a stable document SHA-256", async () => {
  const state = { current: sampleDocument() }; const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null }); const res = await service.inspect({ page_id: 12 });
  assert.equal(res.element_count, 5); assert.equal(res.is_elementor, true); assert.equal(res.document_sha256, baselineHash());
});

test("simple patch changes only the targeted property and verifies", async () => {
  const state = { current: sampleDocument() }; const service = createElementorService({ wpRequest: makeFakeWpRequest(state), memory: null }); const res = await service.patch({ page_id: 12, element_id: "w2", property_path: "settings.editor", value: "<p>New Copy</p>" });
  assert.equal(res.verified, true); assert.equal(res.structural_changed, false);
});

test("patch on malformed _elementor_data baseline rejects, issues ZERO writes, and persists ZERO snapshots", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "el-malformed-gate-")); const memory = createMemoryStore(tmp); const scope = { project_id: "el-malformed-gate" }; const fake = makeIntegrityGateWpRequest("not valid json {{{"); const service = createElementorService({ wpRequest: fake.wpRequest, memory });
  await assert.rejects(() => service.patch({ page_id: 12, element_id: "w1", property_path: "settings.title", value: "x", scope }), /malformed _elementor_data/); assert.equal(fake.writes(), 0); assert.deepEqual(await memory.listSnapshots({ scope }), []); await fs.rm(tmp, { recursive: true, force: true });
});

test("the same counting harness performs EXACTLY one write and one snapshot on a valid baseline", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "el-counting-contrast-")); const state = { current: sampleDocument() }; const fake = makeCountingWpRequest(state); const memory = createMemoryStore(tmp); const scope = { project_id: "el-counting-contrast" }; const service = createElementorService({ wpRequest: fake.wpRequest, memory });
  const res = await service.patch({ page_id: 12, element_id: "w2", property_path: "settings.editor", value: "<p>Integrity gate ok</p>", scope }); assert.ok(res.verified); assert.equal(fake.writes(), 1); assert.equal((await memory.listSnapshots({ scope })).length, 1); await fs.rm(tmp, { recursive: true, force: true });
});

test("handleElementorCreate validates page_id and specification shape", async () => { const service = { create: async () => ({ ok: true }) }; await assert.rejects(() => handleElementorCreate({ service, args: {} }), /positive integer 'page_id'/); await assert.rejects(() => handleElementorCreate({ service, args: { page_id: 1 } }), /structured 'specification'/); });

test("handleElementorCreate delegates structured specification and dry-run without changing it", async () => { let received; const service = { create: async (args) => { received = args; return { ok: true }; } }; const specification = baseCreationSpecification(); const res = await handleElementorCreate({ service, args: { page_id: 2645, specification, dry_run: true, client_id: "c", project_id: "p" } }); assert.deepEqual(res, { ok: true }); assert.equal(received.page_id, 2645); assert.equal(received.specification, specification); assert.equal(received.dry_run, true); assert.deepEqual(received.scope, { client_id: "c", project_id: "p" }); });

test("handleElementorInspect validates page_id and delegates", async () => { const service = { inspect: async () => ({}) }; await assert.rejects(() => handleElementorInspect({ service, args: { page_id: 0 } }), /positive integer 'page_id'/); });

test("handleElementorPatch requires the four core args", async () => { const service = { patch: async () => ({}) }; await assert.rejects(() => handleElementorPatch({ service, args: {} }), /positive integer 'page_id'/); await assert.rejects(() => handleElementorPatch({ service, args: { page_id: 1, element_id: "x", property_path: "settings.editor" } }), /requires a 'value'/); });
