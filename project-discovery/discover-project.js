/**
 * Project Context Discovery — Stage 8B. Minimum viable implementation
 * of the Stage 8A design.
 *
 * ARCHITECTURE: this file exists ENTIRELY OUTSIDE every framework. It
 * has no registry, no executor, no report wrapper, no catalog -- it is
 * a single-purpose utility function that walks a directory and returns
 * a plain context object, exactly the same shape any adapter already
 * assembles manually today (see vscode-agent-extension/src/context-loader.js
 * and cli/workflow-cli.js's loadContextFile()). The Generator, Advisor,
 * Agent, and Workflow Frameworks are completely unaware this file
 * exists and remain entirely unmodified -- this utility produces the
 * exact same { sourceFiles: [{ path, content }] } shape those
 * frameworks already accept, unchanged, from any caller.
 *
 * SCOPE (per Stage 8B's explicit instruction): traversal, ignore rules,
 * source file collection, and workspaceMetadata ONLY. No WordPress
 * detection, no project-type detection, no plugin/theme metadata
 * parsing, no adapter integration, no caching, no shared helper
 * extraction -- all explicitly deferred to future, evidence-gated
 * stages per the Stage 8A design.
 *
 * NEVER THROWS: mirrors every run*WithReport() function's own
 * never-throws contract (Advisor/Agent/Workflow Frameworks) -- failures
 * are represented as data ({ success: false, error }), never exceptions.
 * Unreadable files and permission errors are skipped individually, not
 * fatal to the overall discovery.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { detectProjectType, extractWordPressMetadata } from "./project-type-detection.js";

const IGNORED_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  "vendor",
  "dist",
  "build",
  ".cache",
  "cache",
  ".next",
  ".nuxt",
  "coverage",
  ".vscode",
  ".idea",
]);

// A conservative allowlist of text/source extensions -- files outside
// this list are skipped as "not a supported source file" rather than
// attempting content-based binary sniffing, per the Stage 8A design's
// explicit "allowlist over sniffing" decision (simpler, more
// predictable, avoids reading large binary content just to reject it).
const SUPPORTED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".php",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".htm",
  ".txt",
  ".yml",
  ".yaml",
  ".xml",
  ".sql",
  ".sh",
]);

export const DEFAULT_LIMITS = {
  maxFileSize: 300 * 1024, // 300 KB per file
  maxFileCount: 2000,
  maxTotalSize: 20 * 1024 * 1024, // 20 MB total
  maxDepth: 20,
};

/**
 * Recursively walks `dirPath`, collecting supported source files into
 * `state.sourceFiles`, honoring ignore rules, size/count/depth limits,
 * and never following symlinks. Mutates `state` in place; never throws
 * -- individual file/directory errors are caught and skipped.
 */
async function walk(dirPath, rootPath, depth, limits, state) {
  if (state.truncated) return;
  if (depth > limits.maxDepth) {
    state.truncated = true;
    return;
  }

  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    // Unreadable directory (permissions, race condition, etc.) -- skip
    // it silently rather than failing the whole discovery.
    return;
  }

  for (const entry of entries) {
    if (state.truncated) return;
    if (state.sourceFiles.length >= limits.maxFileCount) {
      state.truncated = true;
      return;
    }
    if (state.totalSize >= limits.maxTotalSize) {
      state.truncated = true;
      return;
    }

    const entryPath = path.join(dirPath, entry.name);

    // Never follow symlinks -- a conservative default that prevents
    // traversal loops and accidental escapes outside the intended root.
    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) continue;
      await walk(entryPath, rootPath, depth + 1, limits, state);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

    let stats;
    try {
      stats = await fs.stat(entryPath);
    } catch {
      // Unreadable file (permissions, race condition) -- skip silently.
      continue;
    }

    if (stats.size > limits.maxFileSize) {
      // Oversized file -- skipped, not fatal, matches the "skip
      // individual problems, keep going" discipline used throughout
      // this utility.
      continue;
    }

    let content;
    try {
      content = await fs.readFile(entryPath, "utf8");
    } catch {
      // Unreadable file (permissions, binary content that fails utf8
      // decoding cleanly enough, race condition) -- skip silently.
      continue;
    }

    const relativePath = path.relative(rootPath, entryPath);
    state.sourceFiles.push({ path: relativePath, content });
    state.totalSize += stats.size;
  }
}

/**
 * Discovers a project's source files starting from `rootPath`. Never
 * throws -- always resolves to a structured result:
 *   { success: true, context: { sourceFiles, workspaceMetadata }, error: null }
 *   { success: false, context: null, error: "..." }
 *
 * `limits` may override any of DEFAULT_LIMITS's fields for testing or
 * adapter-specific tuning; unspecified fields fall back to the default.
 */
export async function discoverProject(rootPath, limits = {}) {
  const effectiveLimits = { ...DEFAULT_LIMITS, ...limits };

  if (typeof rootPath !== "string" || rootPath.trim() === "") {
    return { success: false, context: null, error: "A non-empty project root path is required." };
  }

  let rootStats;
  try {
    rootStats = await fs.stat(rootPath);
  } catch {
    return { success: false, context: null, error: `Project root does not exist or is not accessible: "${rootPath}"` };
  }

  if (!rootStats.isDirectory()) {
    return { success: false, context: null, error: `Project root is not a directory: "${rootPath}"` };
  }

  const state = { sourceFiles: [], totalSize: 0, truncated: false };

  await walk(rootPath, rootPath, 0, effectiveLimits, state);

  // Stage 8C: project-type detection and WordPress metadata extraction
  // are pure, read-only post-processing steps over the already
  // -collected sourceFiles array -- no additional traversal, no
  // execution, no evaluation of project code. Both fields are
  // ADDITIVE; every existing component that reads only sourceFiles
  // (every real Advisor/Agent/Workflow today) is unaffected.
  const projectType = detectProjectType(state.sourceFiles);
  const wordpressMetadata = extractWordPressMetadata(state.sourceFiles);

  return {
    success: true,
    context: {
      sourceFiles: state.sourceFiles,
      workspaceMetadata: {
        root: rootPath,
        fileCount: state.sourceFiles.length,
        truncated: state.truncated,
      },
      projectType,
      wordpressMetadata,
    },
    error: null,
  };
}
