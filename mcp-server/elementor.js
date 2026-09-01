/**
 * Elementor Document Service — governed read + minimal-diff mutation of an
 * existing Elementor page's `_elementor_data` via the standard WordPress
 * REST API (`GET/POST /wp/v2/pages/{id}` with the writable
 * `meta._elementor_data` field).
 *
 * Rationale (see ADR AI-SDOM-ADR-0001): the Elementor plugin exposes NO
 * authenticated REST endpoint for reading or updating an existing document's
 * `_elementor_data` on the connected test site. The WordPress core
 * `wp/v2/pages/{id}` route is the only supported, verified mutation surface.
 *
 * Safety contract (mirrors generators/framework/executor.js semantics,
 * adapted to a remote REST document):
 *   1. READ   — fresh `?context=edit` read; parse + structurally validate.
 *   2. SNAPSHOT — optional baseline persisted to the Memory store (verify-
 *                facts-only store; elementor baselines are verified facts).
 *   3. PLAN   — build a NEW document object changing ONLY the targeted
 *               property path; all ids/order/shape untouched by default.
 *   4. VALIDATE — structural-diff guard: abort if the change would alter
 *               anything beyond the targeted element's target property,
 *               unless `allow_structural:true`.
 *   5. STALE-GUARD — if `expected_baseline_sha256` given and it does not
 *               match the current document hash, abort (caller's snapshot
 *               is stale).
 *   6. DRY-RUN — if requested, report the computed diff, write nothing.
 *   7. WRITE  — POST only `{"meta":{"_elementor_data": "<json>"}}`.
 *   8. VERIFY — immediate re-read; assert target applied + structure stable.
 *   9. ROLLBACK — on verification failure, re-POST the held pre-write
 *               document (the same write verb used by step 7), then re-verify
 *               restoration; escalate on failure.
 *
 * This file contains NO MCP schema logic — that lives in elementor-tools.js.
 * It is a pure service taking injected dependencies (`wpRequest`, an
 * optional memory store) so it is fully testable without a live site.
 */

import crypto from "node:crypto";

const PAGE_PATH = (id) => `/wp/v2/pages/${id}`;

// Stable stringify: sorts object keys recursively so identical content
// always hashes the same regardless of key insertion order. Matches the
// exact algorithm in memory-store.js's `hashData`.
export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export function sha256Stable(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

// Allowable non-structural property paths for a patch. A "structural" change
// is anything that alters the element tree: element ids, element order,
// elType/widgetType identity, container/widget containment, global keys, or
// image ids. Everything a normal WYSIWYG edit touches lives under these.
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

// Deep-own-path read/write helpers for a dotted path like `settings.editor`.
function resolvePath(el, path) {
  const parts = path.split(".");
  let current = el;
  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in current)) {
      return { ok: false };
    }
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

// Structural fingerprint of a document: order-preserving id sequence with
// elType, plus counts, plus a signature over global keys and image ids.
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
  if (settings && typeof settings === "object") {
    for (const [key, value] of Object.entries(settings)) {
      if (key === "__globals__" || key === "_css_classes") continue;
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          value.forEach((v) => collectImageIds(v, into));
        } else if (value.url) {
          // image settings often look like { url, id, size, alt }
          if (value.id) into.add(`${key}:${value.id}`);
          else into.add(`${key}:url:${value.url}`);
        } else {
          collectImageIds(value, into);
        }
      }
    }
  }
}

export function createElementorService({ wpRequest, memory }) {
  async function readPage(id) {
    const page = await wpRequest(`${PAGE_PATH(id)}?context=edit`);
    return page;
  }

  function parseDocument(page, id) {
    const editMode = page.meta && page.meta._elementor_edit_mode;
    const raw = page.meta && page.meta._elementor_data;
    if (editMode !== "builder") {
      throw new Error(`Page ${id} is not an Elementor page (meta._elementor_edit_mode = ${JSON.stringify(editMode)}).`);
    }
    if (typeof raw !== "string" || raw.trim() === "") {
      throw new Error(`Page ${id} has no _elementor_data string to inspect.`);
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Page ${id} has malformed _elementor_data (${err.message}).`);
    }
    if (!Array.isArray(data)) {
      throw new Error(`Page ${id} _elementor_data is not an array of elements.`);
    }
    return data;
  }

  async function inspect({ page_id, element_id }) {
    const page = await readPage(page_id);
    const data = parseDocument(page, page_id);
    const hash = sha256Stable(data);

    const summary = {
      page_id,
      element_count: countElements(data),
      is_elementor: true,
      document_sha256: hash,
    };

    if (element_id) {
      const el = findElementById(data, element_id);
      if (!el) {
        throw new Error(`Element '${element_id}' not found in page ${page_id}.`);
      }
      summary.element = {
        id: el.id,
        elType: el.elType,
        widgetType: el.widgetType || null,
        settings: el.settings || {},
      };
    }

    return summary;
  }

  function countElements(elements) {
    let n = 0;
    for (const el of elements) {
      n += 1;
      if (Array.isArray(el.elements)) n += countElements(el.elements);
    }
    return n;
  }

  function buildPatch(data, element_id, property_path, value) {
    const el = findElementById(data, element_id);
    if (!el) {
      throw new Error(`Element '${element_id}' not found.`);
    }
    const resolved = resolvePath(el, property_path);
    if (!resolved.ok) {
      throw new Error(`Property path '${property_path}' does not exist on element '${element_id}'.`);
    }

    const isStructural = !isAllowedNonStructuralPath(property_path);
    const before = resolved.value;

    const cloned = JSON.parse(JSON.stringify(data));
    const target = findElementById(cloned, element_id);
    setPath(target, property_path, value);

    return { cloned, isStructural, before, after: value };
  }

  function assertStructuralGuard(original, candidate, element_id, property_path, allowStructural) {
    const origFP = structuralFingerprint(original);
    const candFP = structuralFingerprint(candidate);
    const structuralChanged = origFP.hash !== candFP.hash;

    if (structuralChanged && !allowStructural) {
      throw new Error(
        `Refusing structural change to '${property_path}' on element '${element_id}' without allow_structural:true. ` +
        `The mutation would alter element ids/order/counts/globals/image ids, which is outside the governed simple-edit safety envelope.`
      );
    }
    if (!structuralChanged) return { structuralChanged: false };
    return { structuralChanged: true };
  }

  async function maybeSnapshot(scope, data, hash) {
    if (!memory || !scope) return null;
    return memory.saveSnapshot({
      scope,
      data: { page_id: scope.page_id, _elementor_data: data, document_sha256: hash },
      source: "elementor-document",
    });
  }

  async function writeDocument(page_id, data) {
    return wpRequest(`${PAGE_PATH(page_id)}?context=edit`, {
      method: "POST",
      body: { meta: { _elementor_data: JSON.stringify(data) } },
    });
  }

  async function patch({
    page_id,
    element_id,
    property_path,
    value,
    expected_baseline_sha256,
    allow_structural = false,
    dry_run = false,
    scope,
  }) {
    // 1. READ
    const page = await readPage(page_id);
    const original = parseDocument(page, page_id);
    const currentHash = sha256Stable(original);

    // 5. STALE-GUARD
    if (expected_baseline_sha256 && expected_baseline_sha256 !== currentHash) {
      throw new Error(
        `Stale baseline: expected ${expected_baseline_sha256} but current document is ${currentHash}. ` +
        `Re-inspect before writing.`
      );
    }

    // 2. SNAPSHOT (before write) — taken only AFTER planning and structural
    // validation succeed (steps 3-4), so an invalid mutation request that is
    // refused (e.g. missing element or structural guard) never persists a
    // baseline snapshot.
    // 3. PLAN
    const { cloned, isStructural, before } = buildPatch(original, element_id, property_path, value);

    // 4. VALIDATE structural guard
    const structural = assertStructuralGuard(original, cloned, element_id, property_path, allow_structural);

    const snapshot = await maybeSnapshot(scope, original, currentHash);

    const result = {
      page_id,
      element_id,
      property_path,
      is_structural: isStructural,
      structural_changed: structural.structuralChanged,
      before_sha256: currentHash,
      dry_run,
      snapshot_id: snapshot ? snapshot.id : null,
    };

    // 6. DRY-RUN: report, write nothing
    if (dry_run) {
      result.after_sha256 = sha256Stable(cloned);
      result.simulated_value_before = before;
      result.simulated_value_after = value;
      return result;
    }

    // 7. WRITE
    await writeDocument(page_id, cloned);
    result.pinned_after_sha256 = sha256Stable(cloned);

    // 8. VERIFY
    let verified = false;
    let verifyError = null;
    try {
      const reread = await readPage(page_id);
      const after = parseDocument(reread, page_id);
      const afterHash = sha256Stable(after);
      result.after_sha256 = afterHash;
      const rereadTarget = findElementById(after, element_id);
      const rereadValue = rereadTarget ? resolvePath(rereadTarget, property_path) : { ok: false };
      verified =
        afterHash === result.pinned_after_sha256 &&
        rereadValue.ok &&
        JSON.stringify(rereadValue.value) === JSON.stringify(value);
    } catch (err) {
      // The verification re-read/parse itself failed; treat the write as unverified.
      verifyError = err;
    }

    // 9. VERIFICATION FAILED -> never report as a successful mutation (req 1).
    // Even if the subsequent rollback fully restores the document, the
    // requested edit could not be confirmed, so the operation MUST escalate.
    if (verified) {
      result.verified = true;
      return result;
    }

    const verificationFailure = new Error(
      verifyError
        ? `Verification failed for element edit on page ${page_id}: ${verifyError.message}`
        : `Verification failed for element edit on page ${page_id}: post-write document did not match the intended write (pinned ${result.pinned_after_sha256}).`
    );
    verificationFailure.verificationError = verifyError || null;

    try {
      // 9a. CONCURRENCY GUARD (req 4): before restoring the original, confirm
      // the live document still represents exactly what AI-SDOM wrote (its
      // stable SHA-256 matches the pinned write). If it drifted since the
      // write, a concurrent modification likely occurred and we must NOT
      // blindly overwrite it — escalate instead.
      const liveNow = await readPage(page_id);
      const liveData = parseDocument(liveNow, page_id);
      const liveHash = sha256Stable(liveData);
      if (liveHash !== result.pinned_after_sha256) {
        throw new Error(
          `Live document (${liveHash}) no longer matches the document written by this edit (${result.pinned_after_sha256}); ` +
            `a concurrent modification likely occurred after the write. Refusing to overwrite it with the pre-edit rollback.`
        );
      }

      // 9b. Restore the held pre-write document (safe: live still matches our write).
      await writeDocument(page_id, original);

      // 9c. VERIFY ROLLBACK (req 2): re-read and compare the stable SHA-256
      // against the original pre-write hash. Never assume restoration.
      const rollbackRead = await readPage(page_id);
      const rollbackData = parseDocument(rollbackRead, page_id);
      const rollbackHash = sha256Stable(rollbackData);
      const restored = rollbackHash === currentHash;
      verificationFailure.rollback = { restored, after_rollback_sha256: rollbackHash };
      if (!restored) {
        // 3. ESCALATE as a rollback failure (req 3): restoration could not be verified.
        throw new Error(
          `Rollback verification failed: expected pre-edit hash ${currentHash} but live document is ${rollbackHash}. ` +
            `The document can no longer be confirmed as restored from the held snapshot.`
        );
      }
    } catch (rollbackErr) {
      verificationFailure.rollbackFailure = rollbackErr.message;
      throw verificationFailure;
    }

    // Verification failed, but the guarded rollback succeeded. Still report
    // the operation as failed (reqs 1 & 3) and escalate explicitly.
    verificationFailure.message += ` (change already rolled back; reported as failed)`;
    throw verificationFailure;
  }

  return {
    inspect,
    patch,
    // exposed for tests/introspection
    _internals: { parseDocument, buildPatch, findElementById, structuralFingerprint },
  };
}
