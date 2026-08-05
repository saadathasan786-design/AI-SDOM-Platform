/**
 * Context Loader — Workflow VS Code Extension. Reuses the exact same
 * context-loading pattern as vscode-advisor-extension/src/context-loader.js
 * (Stage 4L) and vscode-agent-extension/src/context-loader.js (Stage 5F),
 * since runWorkflowWithReport()'s context shape is identical: a bag of
 * inputs like { sourceFiles: [{path, content}] }. The extension supplies
 * context; the Workflow Framework never fetches it itself. Contains NO
 * analysis -- only collecting { path, content } pairs.
 *
 * Takes the vscode API as a parameter (dependency injection) rather than
 * importing "vscode" directly, so this is testable with a mock UI layer
 * while still being the exact code that runs inside the real extension.
 *
 * Stage 8F: added "Discover from a folder" as a fifth context source,
 * delegating ENTIRELY to the existing, unmodified discoverProject()
 * utility (Stage 8B/8C) -- its returned context object is used
 * completely unchanged, exactly like every other source here. No
 * traversal, filtering, project-type detection, or WordPress metadata
 * logic is duplicated in this file; this mirrors the exact same
 * adapter-side pattern already proven in the CLI (Stage 8D) and MCP
 * (Stage 8E) integrations.
 */

import { discoverProject } from "../../project-discovery/discover-project.js";

export async function collectContextFromSource(vscodeApi) {
  const choice = await vscodeApi.window.showQuickPick(
    [
      { label: "Current file", value: "current" },
      { label: "All open editors", value: "open-editors" },
      { label: "Load context from a JSON file", value: "json-file" },
      { label: "Discover from a folder", value: "discover-folder" },
    ],
    { placeHolder: "Select a context source for the advisor(s) to analyze" }
  );
  if (!choice) return null;

  if (choice.value === "current") {
    const editor = vscodeApi.window.activeTextEditor;
    if (!editor) {
      vscodeApi.window.showErrorMessage("No active editor to use as context. Open a file first.");
      return null;
    }
    return { sourceFiles: [{ path: editor.document.fileName, content: editor.document.getText() }] };
  }

  if (choice.value === "open-editors") {
    const docs = vscodeApi.workspace.textDocuments ?? [];
    if (docs.length === 0) {
      vscodeApi.window.showErrorMessage("No open editors to use as context.");
      return null;
    }
    return { sourceFiles: docs.map((doc) => ({ path: doc.fileName, content: doc.getText() })) };
  }

  if (choice.value === "json-file") {
    const uris = await vscodeApi.window.showOpenDialog({ canSelectMany: false, filters: { JSON: ["json"] } });
    if (!uris || uris.length === 0) return null;

    let raw;
    try {
      raw = await vscodeApi.workspace.fs.readFile(uris[0]);
    } catch {
      vscodeApi.window.showErrorMessage(`Context file not found: "${uris[0].fsPath ?? uris[0]}"`);
      return null;
    }

    const text = typeof raw === "string" ? raw : Buffer.from(raw).toString("utf8");
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      vscodeApi.window.showErrorMessage(`Context file is not valid JSON: ${parseErr.message}`);
      return null;
    }
  }

  if (choice.value === "discover-folder") {
    const uris = await vscodeApi.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false });
    if (!uris || uris.length === 0) return null; // user cancelled the folder picker

    const folderPath = uris[0].fsPath ?? uris[0];
    const result = await discoverProject(folderPath);
    if (!result.success) {
      vscodeApi.window.showErrorMessage(`Project discovery failed: ${result.error}`);
      return null;
    }
    return result.context;
  }

  return null;
}
