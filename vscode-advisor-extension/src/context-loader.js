/**
 * Context Loader — Stage 4L. Assembles a `context` object (the same
 * shape runAdvisorWithReport()/runAdvisors() already accept) from a
 * user's choice of source inside VS Code. Contains NO analysis -- only
 * collecting { path, content } pairs, which is exactly the sourceFiles
 * shape every advisor's own inputRequirements already expects (identical
 * to what the CLI and MCP integrations already pass through unchanged).
 *
 * Takes the vscode API as a parameter (dependency injection) rather than
 * importing "vscode" directly, so this is testable with a mock UI layer
 * while still being the exact code that runs inside the real extension.
 */

export async function collectContextFromSource(vscodeApi) {
  const choice = await vscodeApi.window.showQuickPick(
    [
      { label: "Current file", value: "current" },
      { label: "All open editors", value: "open-editors" },
      { label: "Load context from a JSON file", value: "json-file" },
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

  return null;
}
