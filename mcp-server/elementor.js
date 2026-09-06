/**
 * Elementor Document Service — governed read, creation, and minimal-diff
 * mutation of Elementor `_elementor_data` via the standard WordPress REST API.
 *
 * Creation deliberately accepts a structured specification and deterministically
 * builds the Elementor document. Callers cannot provide arbitrary `_elementor_data`.
 */

import crypto from "node:crypto";

const PAGE_PATH = (id) => `/wp/v2/pages/${id}`;

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export function sha256Stable(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

const ALLOWED_SETTINGS_PREFIXES = [
  "settings.editor",
  "settings.title",
  "settings.text",
  "settings.description",
  "settings.button_text",
  "settings.placeholder",
  "settings.content",
  "settings.link_text",
  "settings.caption",
  "settings.alternative_text",
  "settings.heading_level",
];

const CREATION_SPEC_VERSION = "1.0";
const SUPPORTED_CREATION_TYPES = new Set(["container", "heading", "text", "button", "image"]);
const WIDGET_TYPES = {
  heading: "heading",
  text: "text-editor",
  button: "button",
  image: "image",
};

function isAllowedNonStructuralPath(path) {
  return ALLOWED_SETTINGS_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}.`));
}

function findElementById(elements, id) {
  for (const el of elements) {
    if (el.id === id) return el;
    if (Array.isArray(el.elements)) {
      const found = findElementById(el.elements, id);
      if (found) return found;
    }
  }
  return undefined;
}

function resolvePath(el, path) {
  const parts = path.split(".");
  let current = el;
  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in current)) return { ok: false };
    current = current[part];
  }
  return { ok: true, value: current };
}

function setPath(el, path, value) {
  const parts = path.split(".");
  const target = parts.pop();
  let current = el;
  for (const part of parts) {
    if (current[part] == null || typeof current[part] !== "object") {
      throw new Error(`Cannot traverse non-object segment '${part}' in path '${path}'.`);
    }
    current = current[part];
  }
  current[target] = value;
}

function structuralFingerprint(elements) {
  const ids = [];
  const counts = { containers: 0, widgets: 0 };
  const globalKeys = new Set();
  const imageIds = new Set();

  function walk(list) {
    for (const el of list) {
      ids.push(el.id);
      if (el.elType === "widget") {
        counts.widgets += 1;
        if (el.widgetType) ids.push(`widget:${el.widgetType}`);
      } else if (el.elType === "container" || el.elType === "section") {
        counts.containers += 1;
      }
      if (el.settings) {
        if (typeof el.settings.__globals__ === "object") {
          Object.keys(el.settings.__globals__).forEach((k) => globalKeys.add(k));
        }
        collectImageIds(el.settings, imageIds);
      }
      if (Array.isArray(el.elements)) walk(el.elements);
    }
  }
  walk(elements);

  const sig = ids.join("|");
  return {
    sig,
    hash: sha256Stable({
      sig,
      counts,
      globalKeys: [...globalKeys].sort(),
      imageIds: [...imageIds].sort(),
    }),
  };
}

function collectImageIds(settings, into) {
  if (!settings || typeof settings !== "object") return;
  for (const [key, value] of Object.entries(settings)) {
    if (key === "__globals__" || key === "_css_classes") continue;
    if (value && typeof value === "object") {
      if (Array.isArray(value)) value.forEach((v) => collectImageIds(v, into));
      else if (value.url) {
        if (value.id) into.add(`${key}:${value.id}`);
        else into.add(`${key}:url:${value.url}`);
      } else collectImageIds(value, into);
    }
  }
}

function countElements(elements) {
  let n = 0;
  for (const el of elements) {
    n += 1;
    if (Array.isArray(el.elements)) n += countElements(el.elements);
  }
  return n;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string.`);
  }
}

function assertPlainObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
}

function validateCreationSpecification(spec) {
  assertPlainObject(spec, "document_specification");

  const allowedTopLevelKeys = new Set(["version", "elements"]);
  const unsupportedKeys = Object.keys(spec).filter((key) => !allowedTopLevelKeys.has(key));
  if (unsupportedKeys.length > 0) {
    throw new Error(
      `Unsupported document_specification field(s): ${unsupportedKeys.join(", ")}. Only 'version' and 'elements' are permitted; arbitrary Elementor data such as '_elementor_data' is not accepted.`,
    );
  }

  if (spec.version !== CREATION_SPEC_VERSION) {
    throw new Error(`Unsupported Elementor creation specification version '${spec.version}'. Expected '${CREATION_SPEC_VERSION}'.`);
  }
  if (!Array.isArray(spec.elements) || spec.elements.length === 0) {
    throw new Error("document_specification.elements must be a non-empty array.");
  }

  const ids = new Set();
  const knownIds = new Set();

  function validateElement(node, path, isRoot) {
    assertPlainObject(node, path);
    assertNonEmptyString(node.id, `${path}.id`);
    if (!/^[A-Za-z0-9_-]+$/.test(node.id)) {
      throw new Error(`${path}.id '${node.id}' contains unsupported characters.`);
    }
    if (ids.has(node.id)) throw new Error(`Duplicate element id '${node.id}' in creation specification.`);
    ids.add(node.id);

    assertNonEmptyString(node.type, `${path}.type`);
    if (!SUPPORTED_CREATION_TYPES.has(node.type)) {
      throw new Error(`Unsupported creation element type '${node.type}' at ${path}.`);
    }
    if (!isRoot && node.type === "container" && path.includes(".children")) {
      // Containers are valid children of the root document or another container.
    }

    if (node.type === "container") {
      if (node.settings !== undefined) assertPlainObject(node.settings, `${path}.settings`);
      if (node.children !== undefined && !Array.isArray(node.children)) {
        throw new Error(`${path}.children must be an array.`);
      }
      for (const [index, child] of (node.children || []).entries()) {
        validateElement(child, `${path}.children[${index}]`, false);
      }
      knownIds.add(node.id);
      return;
    }

    assertPlainObject(node.settings, `${path}.settings`);
    const settings = node.settings;
    const keys = Object.keys(settings);

    if (node.type === "heading") {
      assertNonEmptyString(settings.text, `${path}.settings.text`);
      if (settings.level !== undefined && ![1, 2, 3, 4, 5, 6].includes(settings.level)) {
        throw new Error(`${path}.settings.level must be an integer from 1 to 6.`);
      }
      for (const key of keys) if (!["text", "level"].includes(key)) throw new Error(`Unsupported heading setting '${key}'.`);
    } else if (node.type === "text") {
      assertNonEmptyString(settings.text, `${path}.settings.text`);
      for (const key of keys) if (key !== "text") throw new Error(`Unsupported text setting '${key}'.`);
    } else if (node.type === "button") {
      assertNonEmptyString(settings.text, `${path}.settings.text`);
      if (settings.url !== undefined) assertNonEmptyString(settings.url, `${path}.settings.url`);
      for (const key of keys) if (!["text", "url"].includes(key)) throw new Error(`Unsupported button setting '${key}'.`);
    } else if (node.type === "image") {
      assertNonEmptyString(settings.url, `${path}.settings.url`);
      if (settings.id !== undefined && (!Number.isInteger(settings.id) || settings.id < 0)) {
        throw new Error(`${path}.settings.id must be a non-negative integer when provided.`);
      }
      if (settings.alt !== undefined && typeof settings.alt !== "string") {
        throw new Error(`${path}.settings.alt must be a string when provided.`);
      }
      for (const key of keys) if (!["url", "id", "alt"].includes(key)) throw new Error(`Unsupported image setting '${key}'.`);
    }

    if (node.children !== undefined) throw new Error(`${path}.children is only supported on container elements.`);
    knownIds.add(node.id);
  }

  for (const [index, element] of spec.elements.entries()) {
    validateElement(element, `elements[${index}]`, true);
  }

  return { version: spec.version, element_count: ids.size, root_count: spec.elements.length, ids: [...ids] };
}

function buildCreationDocument(spec) {
  function build(node) {
    if (node.type === "container") {
      return {
        id: node.id,
        elType: "container",
        settings: clone(node.settings || {}),
        elements: (node.children || []).map(build),
      };
    }

    if (node.type === "heading") {
      const settings = { title: node.settings.text };
      if (node.settings.level !== undefined) settings.header_size = `h${node.settings.level}`;
      return { id: node.id, elType: "widget", widgetType: WIDGET_TYPES.heading, settings, elements: [] };
    }

    if (node.type === "text") {
      return { id: node.id, elType: "widget", widgetType: WIDGET_TYPES.text, settings: { editor: node.settings.text }, elements: [] };
    }

    if (node.type === "button") {
      const settings = { text: node.settings.text };
      if (node.settings.url !== undefined) settings.link = { url: node.settings.url, is_external: "", nofollow: "" };
      return { id: node.id, elType: "widget", widgetType: WIDGET_TYPES.button, settings, elements: [] };
    }

    const image = { url: node.settings.url };
    if (node.settings.id !== undefined) image.id = node.settings.id;
    if (node.settings.alt !== undefined) image.alt = node.settings.alt;
    return { id: node.id, elType: "widget", widgetType: WIDGET_TYPES.image, settings: { image }, elements: [] };
  }

  return spec.elements.map(build);
}

function validateGeneratedDocument(document) {
  if (!Array.isArray(document) || document.length === 0) {
    throw new Error("Generated Elementor document must be a non-empty array.");
  }
  const ids = new Set();
  function walk(elements, parentId = null) {
    if (!Array.isArray(elements)) throw new Error(`Generated Elementor children of '${parentId || "root"}' are not an array.`);
    for (const el of elements) {
      if (!el || typeof el !== "object" || Array.isArray(el)) throw new Error("Generated Elementor element must be an object.");
      if (typeof el.id !== "string" || !el.id) throw new Error("Generated Elementor element is missing id.");
      if (ids.has(el.id)) throw new Error(`Generated Elementor document contains duplicate id '${el.id}'.`);
      ids.add(el.id);
      if (!el.elType || !["container", "widget"].includes(el.elType)) throw new Error(`Generated Elementor element '${el.id}' has unsupported elType.`);
      if (!el.settings || typeof el.settings !== "object" || Array.isArray(el.settings)) throw new Error(`Generated Elementor element '${el.id}' has invalid settings.`);
      if (el.elType === "widget" && !Object.values(WIDGET_TYPES).includes(el.widgetType)) {
        throw new Error(`Generated Elementor widget '${el.id}' has unsupported widgetType '${el.widgetType}'.`);
      }
      if (!Array.isArray(el.elements)) throw new Error(`Generated Elementor element '${el.id}' must contain an elements array.`);
      if (el.elType === "widget" && el.elements.length !== 0) throw new Error(`Generated Elementor widget '${el.id}' cannot contain children.`);
      walk(el.elements, el.id);
    }
  }
  walk(document);
  return { element_count: ids.size, root_count: document.length, document_sha256: sha256Stable(document) };
}

export function createElementorService({ wpRequest, memory }) {
  async function readPage(id) {
    return wpRequest(`${PAGE_PATH(id)}?context=edit`);
  }

  function parseDocument(page, id) {
    const editMode = page.meta && page.meta._elementor_edit_mode;
    const raw = page.meta && page.meta._elementor_data;
    if (editMode !== "builder") {
      throw new Error(`Page ${id} is not an Elementor page (meta._elementor_edit_mode = ${JSON.stringify(editMode)}).`);
    }
    if (typeof raw !== "string" || raw.trim() === "") throw new Error(`Page ${id} has no _elementor_data string to inspect.`);
    let data;
    try { data = JSON.parse(raw); } catch (err) { throw new Error(`Page ${id} has malformed _elementor_data (${err.message}).`); }
    if (!Array.isArray(data)) throw new Error(`Page ${id} _elementor_data is not an array of elements.`);
    return data;
  }

  async function inspect({ page_id, element_id }) {
    const page = await readPage(page_id);
    const data = parseDocument(page, page_id);
    const summary = { page_id, element_count: countElements(data), is_elementor: true, document_sha256: sha256Stable(data) };
    if (element_id) {
      const el = findElementById(data, element_id);
      if (!el) throw new Error(`Element '${element_id}' not found in page ${page_id}.`);
      summary.element = { id: el.id, elType: el.elType, widgetType: el.widgetType || null, settings: el.settings || {} };
    }
    return summary;
  }

  function buildPatch(data, element_id, property_path, value) {
    const el = findElementById(data, element_id);
    if (!el) throw new Error(`Element '${element_id}' not found.`);
    const resolved = resolvePath(el, property_path);
    if (!resolved.ok) throw new Error(`Property path '${property_path}' does not exist on element '${element_id}'.`);
    const isStructural = !isAllowedNonStructuralPath(property_path);
    const before = resolved.value;
    const cloned = clone(data);
    setPath(findElementById(cloned, element_id), property_path, value);
    return { cloned, isStructural, before, after: value };
  }

  function assertStructuralGuard(original, candidate, element_id, property_path, allowStructural) {
    const structuralChanged = structuralFingerprint(original).hash !== structuralFingerprint(candidate).hash;
    if (structuralChanged && !allowStructural) {
      throw new Error(`Refusing structural change to '${property_path}' on element '${element_id}' without allow_structural:true. The mutation would alter element ids/order/counts/globals/image ids, which is outside the governed simple-edit safety envelope.`);
    }
    return { structuralChanged };
  }

  async function maybeSnapshot(scope, data, hash) {
    if (!memory || !scope) return null;
    return memory.saveSnapshot({ scope, data: { page_id: scope.page_id, _elementor_data: data, document_sha256: hash }, source: "elementor-document" });
  }

  async function writeDocument(page_id, data) {
    return wpRequest(`${PAGE_PATH(page_id)}?context=edit`, { method: "POST", body: { meta: { _elementor_data: JSON.stringify(data) } } });
  }

  async function initializeElementorDocument(page_id, document) {
    return wpRequest(`${PAGE_PATH(page_id)}?context=edit`, {
      method: "POST",
      body: { meta: { _elementor_edit_mode: "builder", _elementor_template_type: "wp-page", _elementor_data: JSON.stringify(document) } },
    });
  }

  async function create({ page_id, document_specification, dry_run = false, scope }) {
    // DISCOVER: a fresh read is mandatory before any write.
    const page = await readPage(page_id);
    if (!page || page.type !== "page") throw new Error(`Creation target ${page_id} is not a WordPress page.`);
    const editMode = page.meta && page.meta._elementor_edit_mode;
    if (editMode === "builder") throw new Error(`Page ${page_id} is already an Elementor page; creation requires a non-Elementor target.`);
    if (editMode && editMode !== "") throw new Error(`Page ${page_id} has unsupported Elementor edit mode ${JSON.stringify(editMode)}.`);
    const rawContent = page.content && page.content.raw;
    if (typeof rawContent === "string" && rawContent.trim() !== "") throw new Error(`Page ${page_id} has existing WordPress content; refusing Elementor initialization.`);

    // SPECIFY + VALIDATE: only the structured creation contract is accepted.
    const specificationSummary = validateCreationSpecification(document_specification);
    const generated = buildCreationDocument(document_specification);
    const generatedSummary = validateGeneratedDocument(generated);

    const result = {
      page_id,
      dry_run,
      specification_version: document_specification.version,
      specification_summary: specificationSummary,
      generated_document: generatedSummary,
      initialized: false,
      verified: false,
      snapshot_id: null,
    };

    // DRY-RUN: no WordPress write and no snapshot.
    if (dry_run) return result;

    // INITIALIZE: one authenticated write establishes all required Elementor metadata.
    await initializeElementorDocument(page_id, generated);
    result.initialized = true;

    // VERIFY: read back metadata, parse the document, inspect through the governed reader,
    // and require the canonical document hash to match exactly.
    try {
      const reread = await readPage(page_id);
      if (reread.meta?._elementor_edit_mode !== "builder") throw new Error("Elementor edit mode was not initialized as 'builder'.");
      if (reread.meta?._elementor_template_type !== "wp-page") throw new Error("Elementor template type was not initialized as 'wp-page'.");
      const after = parseDocument(reread, page_id);
      const afterSummary = validateGeneratedDocument(after);
      if (afterSummary.document_sha256 !== generatedSummary.document_sha256) {
        throw new Error(`Created document hash mismatch: expected ${generatedSummary.document_sha256} but read back ${afterSummary.document_sha256}.`);
      }
      const inspected = await inspect({ page_id });
      if (!inspected.is_elementor || inspected.document_sha256 !== generatedSummary.document_sha256) {
        throw new Error("Post-creation governed inspection did not confirm the generated document.");
      }
      result.after_sha256 = inspected.document_sha256;
      result.verified = true;
    } catch (err) {
      result.verification_error = err.message;
      throw new Error(`Elementor creation verification failed for page ${page_id}: ${err.message}`);
    }

    const snapshot = await maybeSnapshot(scope, generated, generatedSummary.document_sha256);
    result.snapshot_id = snapshot ? snapshot.id : null;
    return result;
  }

  async function patch({ page_id, element_id, property_path, value, expected_baseline_sha256, allow_structural = false, dry_run = false, scope }) {
    const page = await readPage(page_id);
    const original = parseDocument(page, page_id);
    const currentHash = sha256Stable(original);
    if (expected_baseline_sha256 && expected_baseline_sha256 !== currentHash) {
      throw new Error(`Stale baseline: expected ${expected_baseline_sha256} but current document is ${currentHash}. Re-inspect before writing.`);
    }
    const { cloned, isStructural, before } = buildPatch(original, element_id, property_path, value);
    const structural = assertStructuralGuard(original, cloned, element_id, property_path, allow_structural);
    const snapshot = await maybeSnapshot(scope, original, currentHash);
    const result = { page_id, element_id, property_path, is_structural: isStructural, structural_changed: structural.structuralChanged, before_sha256: currentHash, dry_run, snapshot_id: snapshot ? snapshot.id : null };
    if (dry_run) {
      result.after_sha256 = sha256Stable(cloned);
      result.simulated_value_before = before;
      result.simulated_value_after = value;
      return result;
    }
    await writeDocument(page_id, cloned);
    result.pinned_after_sha256 = sha256Stable(cloned);
    let verified = false;
    let verifyError = null;
    try {
      const reread = await readPage(page_id);
      const after = parseDocument(reread, page_id);
      const afterHash = sha256Stable(after);
      result.after_sha256 = afterHash;
      const rereadTarget = findElementById(after, element_id);
      const rereadValue = rereadTarget ? resolvePath(rereadTarget, property_path) : { ok: false };
      verified = afterHash === result.pinned_after_sha256 && rereadValue.ok && JSON.stringify(rereadValue.value) === JSON.stringify(value);
    } catch (err) { verifyError = err; }
    if (verified) { result.verified = true; return result; }
    const verificationFailure = new Error(verifyError ? `Verification failed for element edit on page ${page_id}: ${verifyError.message}` : `Verification failed for element edit on page ${page_id}: post-write document did not match the intended write (pinned ${result.pinned_after_sha256}).`);
    verificationFailure.verificationError = verifyError || null;
    try {
      const liveNow = await readPage(page_id);
      const liveData = parseDocument(liveNow, page_id);
      const liveHash = sha256Stable(liveData);
      if (liveHash !== result.pinned_after_sha256) throw new Error(`Live document (${liveHash}) no longer matches the document written by this edit (${result.pinned_after_sha256}); a concurrent modification likely occurred after the write. Refusing to overwrite it with the pre-edit rollback.`);
      await writeDocument(page_id, original);
      const rollbackRead = await readPage(page_id);
      const rollbackData = parseDocument(rollbackRead, page_id);
      const rollbackHash = sha256Stable(rollbackData);
      const restored = rollbackHash === currentHash;
      verificationFailure.rollback = { restored, after_rollback_sha256: rollbackHash };
      if (!restored) throw new Error(`Rollback verification failed: expected pre-edit hash ${currentHash} but live document is ${rollbackHash}. The document can no longer be confirmed as restored from the held snapshot.`);
    } catch (rollbackErr) {
      verificationFailure.rollbackFailure = rollbackErr.message;
      throw verificationFailure;
    }
    verificationFailure.message += " (change already rolled back; reported as failed)";
    throw verificationFailure;
  }

  return {
    inspect,
    create,
    patch,
    _internals: { parseDocument, buildPatch, findElementById, structuralFingerprint, validateCreationSpecification, buildCreationDocument, validateGeneratedDocument },
  };
}
