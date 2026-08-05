/**
 * Extension entry point — Workflow VS Code Extension. Thin wiring only:
 * imports the real "vscode" module and the testable command handlers,
 * registers the three contributed commands, done. Mirrors
 * vscode-agent-extension/extension.js (Stage 5F) exactly.
 *
 * This file is intentionally as small as possible and contains no logic
 * of its own beyond registration -- everything testable lives in
 * src/commands.js, src/context-loader.js, and src/report-viewer.js,
 * which accept the vscode API as a parameter rather than importing it
 * directly. This file cannot be unit-tested outside a real VS Code
 * extension host, which is why all real logic lives elsewhere -- see
 * docs/WORKFLOW-VSCODE.md for the full testing strategy.
 */

import * as vscode from "vscode";
import { createCommandHandlers } from "./src/commands.js";

export function activate(context) {
  const handlers = createCommandHandlers(vscode);

  context.subscriptions.push(
    vscode.commands.registerCommand("workflow.listWorkflows", handlers.listWorkflows),
    vscode.commands.registerCommand("workflow.runWorkflow", handlers.runWorkflow),
    vscode.commands.registerCommand("workflow.checkCompatibility", handlers.checkWorkflowCompatibility)
  );
}

export function deactivate() {}
