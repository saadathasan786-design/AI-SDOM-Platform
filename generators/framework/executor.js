/**
 * Generator Executor — runs a registered generator's `generate()` against
 * config, in one of three modes:
 *
 * - "preview"  — returns the files that WOULD be produced (path + full
 *                content), writes nothing. For showing the user before
 *                they commit.
 * - "dry-run"  — returns target paths, conflicts, and no-op files, writes
 *                nothing. Cheaper than preview when you only need "what
 *                would happen," not full file contents.
 * - "write"    — actually writes files to `outputDir`. If any individual
 *                write fails partway through, everything already written
 *                in this run is rolled back before the error is re-thrown
 *                — a run either fully succeeds or leaves no trace.
 *
 * `generate(config)` itself MUST be a pure function — no filesystem access
 * inside a generator definition. This executor is the only place file I/O
 * happens, which is what makes preview/dry-run/rollback possible at all.
 *
 * Stage 3E addition — per-file `operation`:
 * Each file a generator returns may declare `operation: "create" | "modify"
 * | "skip"` (defaults to "create" for full backward compatibility with
 * every Stage 3A/3B/3D generator, which never declared this field):
 *   - "create" (default): must NOT already exist. Refused otherwise.
 *     Rollback on later failure deletes it.
 *   - "modify": must ALREADY exist (this is the Injection Generator case —
 *     see cpt-taxonomy-generator.js). Refused if missing. Rollback on
 *     later failure restores the file's original content, not just
 *     deletes it — a "modify" target existed before this run and must
 *     still exist, unchanged, if the run fails.
 *   - "skip": informational only. No existence check, no write, no
 *     conflict, no rollback involvement. For an Injection Generator to
 *     report "nothing to do here, already up to date" without it looking
 *     like an error — see `analyzeOutputDir` below and the CPT+Taxonomy
 *     Generator's idempotency handling.
 *
 * Stage 3E addition — `generatorDef.analyzeOutputDir`:
 * When a generator declares this (boolean `true`), the executor reads the
 * CURRENT contents of `outputDir` (via the same `loadTemplate()` already
 * used for `templateDir`, just pointed at the output location instead of a
 * template source) BEFORE calling `generate()`, and passes the result as a
 * third argument: `generate(config, templateFiles, existingFiles)`. This
 * is how an Injection Generator "analyzes the target project before
 * modification" — the read still happens only in the executor; `generate()`
 * remains pure, just given more to look at.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { getGenerator } from "./generator-registry.js";
import { loadTemplate } from "./template-loader.js";

function validateConfig(configSchema, config) {
  for (const field of configSchema.fields) {
    if (field.required && !(field.name in config)) {
      throw new Error(`Missing required config field: "${field.name}"`);
    }
  }
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} name - registered generator name
 * @param {object} config - config matching the generator's configSchema
 * @param {{ outputDir: string, mode?: "preview"|"dry-run"|"write" }} options
 */
export async function runGenerator(name, config, { outputDir, mode = "write" } = {}) {
  const generatorDef = getGenerator(name);
  validateConfig(generatorDef.configSchema, config);

  // If the generator declares a templateDir, the executor reads it here —
  // this is the ONLY place that read happens.
  const templateFiles = generatorDef.templateDir
    ? await loadTemplate(generatorDef.templateDir, {})
    : [];

  // If the generator declares analyzeOutputDir, the executor reads the
  // TARGET (outputDir) here — same mechanism, different source directory.
  let existingFiles = [];
  if (generatorDef.analyzeOutputDir) {
    if (!outputDir) {
      throw new Error(`Generator "${name}" requires analyzeOutputDir but no outputDir was provided.`);
    }
    try {
      existingFiles = await loadTemplate(outputDir, {});
    } catch (err) {
      throw new Error(
        `Cannot analyze target project at "${outputDir}": ${err.message}. ` +
          `Does this directory exist and contain a project this generator can target?`
      );
    }
  }

  const rawFiles = await generatorDef.generate(config, templateFiles, existingFiles);

  // Split by declared operation. Missing operation = "create" (unchanged
  // behavior for every generator written before Stage 3E).
  const createFiles = [];
  const modifyFiles = [];
  const skipFiles = [];
  for (const file of rawFiles) {
    const op = file.operation || "create";
    if (op === "skip") skipFiles.push(file);
    else if (op === "modify") modifyFiles.push(file);
    else createFiles.push(file);
  }
  const actionableFiles = [...createFiles, ...modifyFiles];

  if (mode === "preview") {
    return { mode, generator: name, files: rawFiles };
  }

  if (!outputDir) {
    throw new Error(`outputDir is required for mode "${mode}".`);
  }

  const conflicts = [];
  for (const file of createFiles) {
    if (await pathExists(path.join(outputDir, file.path))) {
      conflicts.push(file.path);
    }
  }
  for (const file of modifyFiles) {
    if (!(await pathExists(path.join(outputDir, file.path)))) {
      conflicts.push(file.path);
    }
  }

  if (mode === "dry-run") {
    return {
      mode,
      generator: name,
      target_paths: actionableFiles.map((f) => f.path),
      conflicts,
      would_succeed: conflicts.length === 0,
      files_created: createFiles.map((f) => f.path),
      files_modified: modifyFiles.map((f) => f.path),
      skipped_no_op: skipFiles.map((f) => ({ path: f.path, reason: f.reason || null })),
    };
  }

  if (mode !== "write") {
    throw new Error(`Unknown mode: "${mode}" (expected "preview", "dry-run", or "write").`);
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Refusing to write: ${conflicts.length} target file(s) have a problem ` +
        `(${conflicts.join(", ")}). Run mode "dry-run" first to see details.`
    );
  }

  // written entries track previousContent so rollback can distinguish
  // "delete this (it didn't exist before)" from "restore this (it did)".
  const written = [];
  try {
    for (const file of createFiles) {
      const target = path.join(outputDir, file.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.content);
      written.push({ target, previousContent: null });
    }
    for (const file of modifyFiles) {
      const target = path.join(outputDir, file.path);
      const previousContent = await fs.readFile(target, "utf8");
      await fs.writeFile(target, file.content);
      written.push({ target, previousContent });
    }
  } catch (err) {
    await Promise.all(
      written.map(async (w) => {
        if (w.previousContent !== null) {
          await fs.writeFile(w.target, w.previousContent);
        } else {
          await fs.rm(w.target, { force: true });
        }
      })
    );
    throw new Error(
      `Generation failed after writing ${written.length} file(s); all were rolled back. Original error: ${err.message}`
    );
  }

  return {
    mode,
    generator: name,
    files_written: written.map((w) => w.target),
    files_created: createFiles.map((f) => path.join(outputDir, f.path)),
    files_modified: modifyFiles.map((f) => path.join(outputDir, f.path)),
    skipped_no_op: skipFiles.map((f) => ({ path: f.path, reason: f.reason || null })),
  };
}
