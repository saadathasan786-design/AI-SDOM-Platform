import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { discoverProject } from "../discover-project.js";

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "project-discovery-test-"));
}

async function writeFile(root, relPath, content) {
  const fullPath = path.join(root, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

// ---------------------------------------------------------------------
// Recursion / basic collection
// ---------------------------------------------------------------------

test("recursively collects source files from nested directories", async () => {
  const root = await makeTempDir();
  await writeFile(root, "a.js", "a");
  await writeFile(root, "src/b.js", "b");
  await writeFile(root, "src/nested/c.js", "c");

  const result = await discoverProject(root);
  assert.equal(result.success, true);
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path).sort(), ["a.js", "src/b.js", "src/nested/c.js"].sort());
});

test("returns relative paths, not absolute paths", async () => {
  const root = await makeTempDir();
  await writeFile(root, "x.js", "content");

  const result = await discoverProject(root);
  assert.equal(result.context.sourceFiles[0].path, "x.js");
  assert.ok(!path.isAbsolute(result.context.sourceFiles[0].path));
});

test("preserves exact file content", async () => {
  const root = await makeTempDir();
  await writeFile(root, "a.js", "export const x = 1;\n// comment");

  const result = await discoverProject(root);
  assert.equal(result.context.sourceFiles[0].content, "export const x = 1;\n// comment");
});

// ---------------------------------------------------------------------
// Ignore rules
// ---------------------------------------------------------------------

test("ignores node_modules, vendor, .git, dist, build, and common cache folders", async () => {
  const root = await makeTempDir();
  await writeFile(root, "src/index.js", "real");
  await writeFile(root, "node_modules/pkg/index.js", "ignored");
  await writeFile(root, "vendor/lib/index.php", "<?php ignored");
  await writeFile(root, ".git/config", "ignored");
  await writeFile(root, "dist/bundle.js", "ignored");
  await writeFile(root, "build/output.js", "ignored");
  await writeFile(root, "cache/tmp.js", "ignored");
  await writeFile(root, ".cache/tmp.js", "ignored");

  const result = await discoverProject(root);
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path), ["src/index.js"]);
});

test("ignore rules apply at any depth, not just the root", async () => {
  const root = await makeTempDir();
  await writeFile(root, "packages/a/node_modules/pkg/index.js", "ignored");
  await writeFile(root, "packages/a/src/real.js", "real");

  const result = await discoverProject(root);
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path), ["packages/a/src/real.js"]);
});

// ---------------------------------------------------------------------
// Supported extensions / binary exclusion
// ---------------------------------------------------------------------

test("collects a wide range of supported source extensions", async () => {
  const root = await makeTempDir();
  const files = ["a.js", "b.jsx", "c.ts", "d.tsx", "e.php", "f.json", "g.md", "h.css", "i.html", "j.yml", "k.sql"];
  for (const f of files) await writeFile(root, f, "content");

  const result = await discoverProject(root);
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path).sort(), files.sort());
});

test("excludes files with unsupported/binary extensions", async () => {
  const root = await makeTempDir();
  await writeFile(root, "keep.js", "real");
  await writeFile(root, "logo.png", "binary junk");
  await writeFile(root, "archive.zip", "binary junk");
  await writeFile(root, "font.woff2", "binary junk");
  await writeFile(root, "video.mp4", "binary junk");

  const result = await discoverProject(root);
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path), ["keep.js"]);
});

// ---------------------------------------------------------------------
// Size limits
// ---------------------------------------------------------------------

test("excludes files larger than maxFileSize while keeping smaller ones", async () => {
  const root = await makeTempDir();
  await writeFile(root, "small.js", "x".repeat(10));
  await writeFile(root, "large.js", "x".repeat(1000));

  const result = await discoverProject(root, { maxFileSize: 500 });
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path), ["small.js"]);
});

test("stops collecting once maxTotalSize is reached and sets truncated:true", async () => {
  const root = await makeTempDir();
  for (let i = 0; i < 10; i++) {
    await writeFile(root, `file${i}.js`, "x".repeat(20));
  }

  const result = await discoverProject(root, { maxTotalSize: 50 });
  assert.equal(result.context.workspaceMetadata.truncated, true);
  assert.ok(result.context.sourceFiles.length < 10);
});

// ---------------------------------------------------------------------
// Max file count
// ---------------------------------------------------------------------

test("stops collecting once maxFileCount is reached and sets truncated:true", async () => {
  const root = await makeTempDir();
  for (let i = 0; i < 20; i++) {
    await writeFile(root, `file${i}.js`, "x");
  }

  const result = await discoverProject(root, { maxFileCount: 5 });
  assert.equal(result.context.sourceFiles.length, 5);
  assert.equal(result.context.workspaceMetadata.truncated, true);
});

test("does not set truncated:true when file count is under the limit", async () => {
  const root = await makeTempDir();
  await writeFile(root, "a.js", "x");
  await writeFile(root, "b.js", "x");

  const result = await discoverProject(root, { maxFileCount: 100 });
  assert.equal(result.context.workspaceMetadata.truncated, false);
});

// ---------------------------------------------------------------------
// Max depth
// ---------------------------------------------------------------------

test("stops descending beyond maxDepth and sets truncated:true", async () => {
  const root = await makeTempDir();
  await writeFile(root, "shallow.js", "found");
  await writeFile(root, "a/b/c/d/e/f/deep.js", "not found");

  const result = await discoverProject(root, { maxDepth: 2 });
  assert.ok(!result.context.sourceFiles.some((f) => f.path.includes("deep.js")));
  assert.equal(result.context.workspaceMetadata.truncated, true);
});

test("files within maxDepth are still collected", async () => {
  const root = await makeTempDir();
  await writeFile(root, "a/b/shallow-enough.js", "found");

  const result = await discoverProject(root, { maxDepth: 5 });
  assert.ok(result.context.sourceFiles.some((f) => f.path === "a/b/shallow-enough.js"));
});

// ---------------------------------------------------------------------
// Symlink handling
// ---------------------------------------------------------------------

test("does not follow symbolic links to directories", async () => {
  const root = await makeTempDir();
  await writeFile(root, "real-dir/real.js", "real content");
  await fs.symlink(path.join(root, "real-dir"), path.join(root, "symlinked-dir"));

  const result = await discoverProject(root);
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path), ["real-dir/real.js"]);
});

test("does not include symlinked files", async () => {
  const root = await makeTempDir();
  await writeFile(root, "real.js", "real content");
  await fs.symlink(path.join(root, "real.js"), path.join(root, "linked.js"));

  const result = await discoverProject(root);
  assert.deepEqual(result.context.sourceFiles.map((f) => f.path), ["real.js"]);
});

// ---------------------------------------------------------------------
// Invalid root / empty directory
// ---------------------------------------------------------------------

test("invalid root (does not exist) returns a structured failure, never throws", async () => {
  const result = await discoverProject("/definitely/does/not/exist/12345");
  assert.equal(result.success, false);
  assert.equal(result.context, null);
  assert.match(result.error, /does not exist or is not accessible/);
});

test("root that is a file, not a directory, returns a structured failure", async () => {
  const root = await makeTempDir();
  await writeFile(root, "afile.js", "x");

  const result = await discoverProject(path.join(root, "afile.js"));
  assert.equal(result.success, false);
  assert.match(result.error, /is not a directory/);
});

test("empty directory succeeds with zero files and truncated:false", async () => {
  const root = await makeTempDir();

  const result = await discoverProject(root);
  assert.equal(result.success, true);
  assert.deepEqual(result.context.sourceFiles, []);
  assert.equal(result.context.workspaceMetadata.fileCount, 0);
  assert.equal(result.context.workspaceMetadata.truncated, false);
});

test("directory containing only ignored folders succeeds with zero files", async () => {
  const root = await makeTempDir();
  await writeFile(root, "node_modules/pkg/index.js", "ignored");
  await writeFile(root, ".git/config", "ignored");

  const result = await discoverProject(root);
  assert.equal(result.success, true);
  assert.deepEqual(result.context.sourceFiles, []);
});

// ---------------------------------------------------------------------
// Exact context structure
// ---------------------------------------------------------------------

test("exact context structure: sourceFiles, workspaceMetadata, projectType, wordpressMetadata -- no extra fields (updated for Stage 8C's additive fields)", async () => {
  const root = await makeTempDir();
  await writeFile(root, "a.js", "x");

  const result = await discoverProject(root);
  assert.deepEqual(Object.keys(result.context).sort(), ["sourceFiles", "workspaceMetadata", "projectType", "wordpressMetadata"].sort());
  assert.deepEqual(Object.keys(result.context.workspaceMetadata).sort(), ["root", "fileCount", "truncated"].sort());
});

test("exact result envelope structure: success, context, error -- no extra fields", async () => {
  const root = await makeTempDir();
  const result = await discoverProject(root);
  assert.deepEqual(Object.keys(result).sort(), ["success", "context", "error"].sort());
});

test("workspaceMetadata.root matches the given root path exactly", async () => {
  const root = await makeTempDir();
  const result = await discoverProject(root);
  assert.equal(result.context.workspaceMetadata.root, root);
});

test("workspaceMetadata.fileCount matches sourceFiles.length exactly", async () => {
  const root = await makeTempDir();
  await writeFile(root, "a.js", "x");
  await writeFile(root, "b.js", "x");
  await writeFile(root, "c.js", "x");

  const result = await discoverProject(root);
  assert.equal(result.context.workspaceMetadata.fileCount, result.context.sourceFiles.length);
  assert.equal(result.context.workspaceMetadata.fileCount, 3);
});

test("each sourceFiles entry has exactly path and content, no extra fields", async () => {
  const root = await makeTempDir();
  await writeFile(root, "a.js", "x");

  const result = await discoverProject(root);
  assert.deepEqual(Object.keys(result.context.sourceFiles[0]).sort(), ["path", "content"].sort());
});

// ---------------------------------------------------------------------
// Never-throws contract / malformed input
// ---------------------------------------------------------------------

test("never throws: null root produces a structured failure", async () => {
  const result = await discoverProject(null);
  assert.equal(result.success, false);
  assert.match(result.error, /non-empty project root path is required/);
});

test("never throws: empty string root produces a structured failure", async () => {
  const result = await discoverProject("");
  assert.equal(result.success, false);
});

test("never throws: non-string root (number) produces a structured failure", async () => {
  const result = await discoverProject(42);
  assert.equal(result.success, false);
});

test("never throws: undefined root produces a structured failure", async () => {
  const result = await discoverProject(undefined);
  assert.equal(result.success, false);
});

// ---------------------------------------------------------------------
// Unreadable files -- skipped, not fatal (see completion report for the
// honest note about permission-based testing limitations in this
// container environment, which typically runs as root)
// ---------------------------------------------------------------------

test("discovery does not abort when a good file exists alongside no issues (baseline for the try/catch paths exercised elsewhere)", async () => {
  const root = await makeTempDir();
  await writeFile(root, "good.js", "real content");

  const result = await discoverProject(root);
  assert.equal(result.success, true);
  assert.ok(result.context.sourceFiles.some((f) => f.path === "good.js"));
});
