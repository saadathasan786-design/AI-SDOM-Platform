import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseImports,
  resolveInternalImport,
  buildDependencyGraph,
  computeFanIn,
  findDebtMarkers,
} from "../framework/source-analysis.js";

test("parseImports extracts both import and export-from specifiers", () => {
  const content = "import { a } from './a.js';\nexport { b } from './b.js';\nimport './side-effect.js';";
  assert.deepEqual(parseImports(content), ["./a.js", "./b.js", "./side-effect.js"]);
});

test("resolveInternalImport returns null for external (non-relative) specifiers", () => {
  const known = new Set(["a.js"]);
  assert.equal(resolveInternalImport("x.js", "node:path", known), null);
  assert.equal(resolveInternalImport("x.js", "some-package", known), null);
});

test("resolveInternalImport resolves a relative specifier against known paths, with and without .js suffix", () => {
  const known = new Set(["dir/a.js"]);
  assert.equal(resolveInternalImport("dir/b.js", "./a.js", known), "dir/a.js");
  assert.equal(resolveInternalImport("dir/b.js", "./a", known), "dir/a.js");
});

test("resolveInternalImport returns null when it cannot confidently resolve", () => {
  const known = new Set(["dir/a.js"]);
  assert.equal(resolveInternalImport("dir/b.js", "./does-not-exist.js", known), null);
});

test("buildDependencyGraph builds correct edges and excludes external imports", () => {
  const sourceFiles = [
    { path: "a.js", content: "import './b.js';\nimport 'node:path';\nexport const a = 1;" },
    { path: "b.js", content: "export const b = 1;" },
  ];
  const graph = buildDependencyGraph(sourceFiles);
  assert.deepEqual([...graph.get("a.js")], ["b.js"]);
  assert.deepEqual([...graph.get("b.js")], []);
});

test("computeFanIn counts distinct importers per node", () => {
  const graph = new Map([
    ["a.js", new Set(["c.js"])],
    ["b.js", new Set(["c.js"])],
    ["c.js", new Set()],
  ]);
  const fanIn = computeFanIn(graph);
  assert.equal(fanIn.get("c.js"), 2);
  assert.equal(fanIn.get("a.js"), 0);
});

test("findDebtMarkers locates TODO/FIXME with correct file and line", () => {
  const sourceFiles = [{ path: "x.js", content: "a();\n// TODO: fix\nb();\n// FIXME: also this" }];
  const markers = findDebtMarkers(sourceFiles);
  assert.deepEqual(markers, [
    { path: "x.js", line: 2 },
    { path: "x.js", line: 4 },
  ]);
});

test("findDebtMarkers returns an empty array when there are none", () => {
  assert.deepEqual(findDebtMarkers([{ path: "x.js", content: "clean code here" }]), []);
});
