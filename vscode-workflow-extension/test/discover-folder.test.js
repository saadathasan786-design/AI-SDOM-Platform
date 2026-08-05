import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { collectContextFromSource } from "../src/context-loader.js";
import { createMockVscode } from "./mock-vscode.js";

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "vscode-workflow-discover-test-"));
}

async function writeFile(root, relPath, content) {
  const fullPath = path.join(root, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

async function makeVulnerablePluginDir() {
  const root = await makeTempDir();
  await writeFile(
    root,
    "my-plugin.php",
    "<?php\n/**\n * Plugin Name: Test Plugin\n * Version: 1.0.0\n */\nfunction h() { $x = $_POST['x']; }"
  );
  return root;
}

async function makeGenericJsDir() {
  const root = await makeTempDir();
  await writeFile(root, "package.json", '{"name":"generic-test"}');
  await writeFile(root, "index.js", "export const a = 1;");
  return root;
}

async function makeUnknownDir() {
  const root = await makeTempDir();
  await writeFile(root, "notes.txt", "just some notes");
  return root;
}

// ---------------------------------------------------------------------
// Folder picker success
// ---------------------------------------------------------------------

test("Discover from a folder appears as a QuickPick option", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: null, // simulate cancellation to keep this test focused on the option's presence
  });

  await collectContextFromSource(vscodeApi);
  const offeredItems = calls.showQuickPick[0].items;
  assert.ok(offeredItems.some((i) => i.value === "discover-folder"));
  assert.ok(offeredItems.some((i) => i.label === "Discover from a folder"));
});

test("folder discovery against a real WordPress plugin directory returns the exact discoverProject() context, unchanged", async () => {
  const root = await makeVulnerablePluginDir();
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: root }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context.projectType, "wordpress-plugin");
  assert.deepEqual(context.sourceFiles.map((f) => f.path), ["my-plugin.php"]);
  assert.equal(context.wordpressMetadata.pluginHeaders.Name, "Test Plugin");
});

test("folder discovery against a generic JS project succeeds with projectType generic-js", async () => {
  const root = await makeGenericJsDir();
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: root }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context.projectType, "generic-js");
});

test("folder discovery against an unknown/unrecognized project succeeds with projectType unknown, no error", async () => {
  const root = await makeUnknownDir();
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: root }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context.projectType, "unknown");
  assert.equal(calls.showErrorMessage.length, 0);
});

// ---------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------

test("cancelling the folder picker (showOpenDialog returns null) returns null, shows no error, invokes no framework call", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: null,
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
  assert.equal(calls.showErrorMessage.length, 0);
});

test("cancelling the folder picker (empty array response) also returns null cleanly", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
});

test("cancelling the initial source QuickPick itself (before folder selection) returns null", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: null,
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
});

// ---------------------------------------------------------------------
// Invalid folder / error handling
// ---------------------------------------------------------------------

test("a non-existent folder shows the existing error UI (showErrorMessage) and returns null -- the framework is never invoked", async () => {
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: "/definitely/does/not/exist/12345" }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
  assert.equal(calls.showErrorMessage.length, 1);
  assert.match(calls.showErrorMessage[0], /Project discovery failed/);
  assert.match(calls.showErrorMessage[0], /does not exist or is not accessible/);
});

test("a folder path pointing at a file, not a directory, shows the existing error UI and returns null", async () => {
  const root = await makeGenericJsDir();
  const filePath = path.join(root, "package.json");
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: filePath }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.equal(context, null);
  assert.match(calls.showErrorMessage[0], /is not a directory/);
});

// ---------------------------------------------------------------------
// Exact context propagation
// ---------------------------------------------------------------------

test("exact context propagation: the object returned is discoverProject()'s context field, not a copy or reshaped version", async () => {
  const root = await makeVulnerablePluginDir();
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: root }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.deepEqual(Object.keys(context).sort(), ["sourceFiles", "workspaceMetadata", "projectType", "wordpressMetadata"].sort());
  assert.equal(context.workspaceMetadata.root, root);
});

// ---------------------------------------------------------------------
// Backward compatibility -- existing options unchanged
// ---------------------------------------------------------------------

test("backward compatibility: Current file option still works exactly as before", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "current"),
    activeTextEditor: { document: { fileName: "app.js", getText: () => "export const a = 1;" } },
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.deepEqual(context, { sourceFiles: [{ path: "app.js", content: "export const a = 1;" }] });
});

test("backward compatibility: All open editors option still works exactly as before", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "open-editors"),
    textDocuments: [{ fileName: "a.js", getText: () => "const a = 1;" }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.deepEqual(context, { sourceFiles: [{ path: "a.js", content: "const a = 1;" }] });
});

test("backward compatibility: JSON file option still works exactly as before", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "json-file"),
    showOpenDialog: [{ fsPath: "/fake/context.json" }],
    fileContents: { "/fake/context.json": JSON.stringify({ sourceFiles: [{ path: "x.js", content: "eval(x);" }] }) },
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.deepEqual(context, { sourceFiles: [{ path: "x.js", content: "eval(x);" }] });
});

// ---------------------------------------------------------------------
// Mutual exclusivity
// ---------------------------------------------------------------------

test("mutual exclusivity: exactly one branch executes per call -- choosing discover-folder never also reads open editors or a JSON file", async () => {
  const root = await makeGenericJsDir();
  const { vscodeApi, calls } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: root }],
    textDocuments: [{ fileName: "should-not-appear.js", getText: () => "x" }],
  });

  const context = await collectContextFromSource(vscodeApi);
  assert.ok(!context.sourceFiles.some((f) => f.path === "should-not-appear.js"));
  assert.equal(calls.showQuickPick.length, 1);
});

// ---------------------------------------------------------------------
// Never-throws behavior
// ---------------------------------------------------------------------

test("never throws: an empty/no-op discovered folder (nothing found) does not throw, returns a valid context", async () => {
  const root = await makeTempDir(); // genuinely empty
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: root }],
  });

  await assert.doesNotReject(async () => {
    const context = await collectContextFromSource(vscodeApi);
    assert.deepEqual(context.sourceFiles, []);
  });
});

test("never throws: a completely invalid folder path never throws out of collectContextFromSource, only shows an error and returns null", async () => {
  const { vscodeApi } = createMockVscode({
    showQuickPick: (items) => items.find((i) => i.value === "discover-folder"),
    showOpenDialog: [{ fsPath: "/x/y/z/not/real/at/all" }],
  });

  await assert.doesNotReject(() => collectContextFromSource(vscodeApi));
});
