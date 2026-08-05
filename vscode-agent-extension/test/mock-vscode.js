/**
 * A lightweight mock of the subset of the "vscode" API this extension
 * uses. Real VS Code isn't available in this environment (no extension
 * host to spawn), so this mock is the standard, honest way to test
 * VS Code extension logic without one -- it is only a UI-layer fake;
 * every Advisor Framework call made through it is 100% real and
 * unmodified (see docs/ADVISOR-VSCODE.md's testing strategy section).
 *
 * Configure canned responses via the responses object; every call is
 * recorded in `calls` for assertions.
 */
export function createMockVscode(responses = {}) {
  const calls = {
    showQuickPick: [],
    showOpenDialog: [],
    showErrorMessage: [],
    showInformationMessage: [],
    createWebviewPanel: [],
    withProgress: [],
  };

  const webviewPanels = [];

  const vscodeApi = {
    ViewColumn: { One: 1 },
    ProgressLocation: { Notification: 15 },
    window: {
      activeTextEditor: responses.activeTextEditor ?? null,
      textDocuments: responses.textDocuments ?? [],

      async showQuickPick(items, options) {
        calls.showQuickPick.push({ items, options });
        if (typeof responses.showQuickPick === "function") {
          return responses.showQuickPick(items, options, calls.showQuickPick.length - 1);
        }
        return responses.showQuickPick;
      },

      async showOpenDialog(options) {
        calls.showOpenDialog.push(options);
        return responses.showOpenDialog ?? null;
      },

      showErrorMessage(message) {
        calls.showErrorMessage.push(message);
      },

      showInformationMessage(message) {
        calls.showInformationMessage.push(message);
      },

      createWebviewPanel(viewType, title, viewColumn, options) {
        const panel = { viewType, title, viewColumn, options, webview: { html: "" } };
        calls.createWebviewPanel.push(panel);
        webviewPanels.push(panel);
        return panel;
      },

      async withProgress(options, task) {
        calls.withProgress.push(options);
        return task({ report: () => {} });
      },
    },
    workspace: {
      textDocuments: responses.textDocuments ?? [],
      fs: {
        async readFile(uri) {
          if (responses.fileReadError) throw new Error(responses.fileReadError);
          const content = responses.fileContents?.[uri.fsPath ?? uri] ?? "{}";
          return Buffer.from(content, "utf8");
        },
      },
    },
  };

  return { vscodeApi, calls, webviewPanels };
}
