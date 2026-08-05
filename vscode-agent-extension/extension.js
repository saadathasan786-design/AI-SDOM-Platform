/**
 * Extension entry point — Stage 5F. Thin wiring only: imports the real
 * "vscode" module and the testable command handlers, registers the four
 * contributed commands, done. Mirrors
 * vscode-advisor-extension/extension.js (Stage 4L) exactly.
 *
 * This file is intentionally as small as possible and contains no logic
 * of its own beyond registration -- everything testable lives in
 * src/commands.js, src/context-loader.js, and src/report-viewer.js,
 * which accept the vscode API as a parameter rather than importing it
 * directly. This file cannot be unit-tested outside a real VS Code
 * extension host, which is why all real logic lives elsewhere -- see
 * docs/AGENT-VSCODE.md for the full testing strategy.
 */

import * as vscode from "vscode";
import { createCommandHandlers } from "./src/commands.js";

export function activate(context) {
  const state = { lastReport: null };
  const handlers = createCommandHandlers(vscode, state);

  context.subscriptions.push(
    vscode.commands.registerCommand("agent.listAgents", handlers.listAgents),
    vscode.commands.registerCommand("agent.checkCompatibility", handlers.checkAgentCompatibility),
    vscode.commands.registerCommand("agent.runAgent", handlers.runAgent),
    vscode.commands.registerCommand("agent.showLastReport", handlers.showLastReport)
  );
}

export function deactivate() {}
