import { test } from "node:test";
import assert from "node:assert/strict";
import { collectContextFromSource } from "../src/context-loader.js";
import { createMockVscode } from "./mock-vscode.js";

test("collectContextFromSource with current file returns sourceFiles from the active editor", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "current"),
    activeTextEditor: { document: { fileName: "app.js", getText: () => "export const a = 1;" } },
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.deepEqual(context, { sourceFiles: [{ path: "app.js", content: "export const a = 1;" }] });
});

test("collectContextFromSource with current file but no active editor shows an error and returns null", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "current"),
    activeTextEditor: null,
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /No active editor/);
});

test("collectContextFromSource with all open editors returns sourceFiles from every open document", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "open-editors"),
    textDocuments: [
      { fileName: "a.js", getText: () => "const a = 1;" },
      { fileName: "b.js", getText: () => "const b = 2;" },
    ],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.deepEqual(context, {
    sourceFiles: [
      { path: "a.js", content: "const a = 1;" },
      { path: "b.js", content: "const b = 2;" },
    ],
  });
});

test("collectContextFromSource with all open editors but nothing open shows an error and returns null", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "open-editors"),
    textDocuments: [],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
  assert.match(calls.showErrorMessage[0], /No open editors/);
});

test("collectContextFromSource with json file loads and parses a real JSON file", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "json-file"),
    showOpenDialog: [{ fsPath: "/fake/context.json" }],
    fileContents: { "/fake/context.json": JSON.stringify({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] }) },
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.deepEqual(context, { sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
});

test("collectContextFromSource with json file and invalid JSON shows a clear error and returns null", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "json-file"),
    showOpenDialog: [{ fsPath: "/fake/bad.json" }],
    fileContents: { "/fake/bad.json": "not valid json {{{" },
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
  assert.match(calls.showErrorMessage[0], /not valid JSON/);
});

test("collectContextFromSource with json file and a missing/unreadable file shows a clear error and returns null", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "json-file"),
    showOpenDialog: [{ fsPath: "/fake/missing.json" }],
    fileReadError: "ENOENT",
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
  assert.match(calls.showErrorMessage[0], /Context file not found/);
});

test("collectContextFromSource returns null when the user cancels the source picker", async () => {
  const { vscodeApi } = createMockVscode({ showQuickPick: undefined });
  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
});

test("collectContextFromSource returns null when the user cancels the file open dialog", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "json-file"),
    showOpenDialog: null,
  });
  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
});
