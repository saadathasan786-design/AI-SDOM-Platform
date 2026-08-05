/**
 * Portfolio Starter Pack — Stage 3J. The first Solution Generator.
 *
 * Composes FOUR existing generators — Theme, Plugin, CPT+Taxonomy, ACF
 * Field Group — in sequence, via the same `runGeneratorWithReport()` every
 * other caller uses. Zero generation logic, template processing, or
 * naming logic is duplicated here: every actual file this produces is
 * written by one of those four generators' own existing code, unchanged.
 * This module only sequences calls and derives each step's config from a
 * shared, flattened input.
 *
 * === Why this is NOT registered via registerGenerator() ===
 *
 * Every generator built in Stages 3B–3I fits one contract: a single
 * `generate(config, templateFiles, existingFiles)` call, one executor
 * write phase, atomic. A Solution Generator structurally cannot fit that
 * shape: CPT+Taxonomy's `analyzeOutputDir` step needs to read the
 * Plugin's REAL, already-written files — which only exist after the
 * Plugin step has ACTUALLY WRITTEN THEM TO DISK. This is inherently
 * multi-step, multi-directory (theme output ≠ plugin output), sequential,
 * with real writes between steps. Forcing this into `registerGenerator()`
 * would mean either lying about its shape (giving it a fake `generate()`
 * that secretly does something else) or weakening the registry's
 * single-pass contract for every other generator. Neither is acceptable.
 *
 * So this stays its own module, with its own run function
 * (`runPortfolioStarterPack`) and its own metadata object
 * (`PORTFOLIO_METADATA`, matching the same conceptual shape the Catalog
 * uses — id/name/description/category/configSchema/variableManifest —
 * for discoverability) rather than forcing a fit that doesn't exist.
 *
 * === Idempotency strategy (see docs/PORTFOLIO-STARTER-PACK.md) ===
 *
 * Rather than inventing new idempotency behavior, this orchestrator
 * relies ENTIRELY on what each underlying generator already provides:
 * - Theme/Plugin (Scaffold Generators) refuse to overwrite existing
 *   output. So before calling either, this orchestrator checks whether
 *   its target directory already has content and SKIPS that step
 *   entirely if so — never even invoking the generator, so it never hits
 *   that refusal.
 * - CPT+Taxonomy/ACF (Injection Generators) already skip silently when
 *   their identity already exists. This orchestrator just calls them
 *   plainly, every time — their own idempotency does the rest.
 *
 * === Rollback strategy (a deliberate, documented choice) ===
 *
 * This orchestrator does NOT implement its own whole-sequence "undo
 * everything if a later step fails" rollback. Each individual generator's
 * OWN atomic rollback (restore-on-modify-failure, delete-on-create-failure)
 * is preserved completely unchanged — that guarantee is never bypassed.
 * On top of that, this orchestrator relies on RESUMABILITY rather than a
 * competing undo mechanism: if step 3 fails, steps 1–2's output is left in
 * place (it's valid, complete, and safe), the failure is reported clearly
 * with which step and why, and re-running the whole Starter Pack after
 * fixing the issue will skip the already-completed steps (idempotency,
 * above) and retry only what's left. This is simpler, avoids inventing a
 * second, competing notion of "transaction" on top of the framework's
 * existing one, and matches how a human operator would actually recover.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runGeneratorWithReport } from "../framework/generation-report.js";
import { toOptionCase } from "../framework/constant-case-manager.js";
import { VARIABLE_MANIFEST } from "./variable-manifest.js";

async function dirHasContent(dir) {
  try {
    const entries = await fs.readdir(dir);
    return entries.length > 0;
  } catch {
    return false;
  }
}

/**
 * Maps the Starter Pack's flattened config onto each underlying
 * generator's own config shape. No naming/derivation logic is invented
 * here beyond what's needed to keep the CPT and ACF steps pointed at each
 * other correctly (`target_cpt` must match the CPT step's own derived
 * slug, computed via the exact same `toOptionCase()` the CPT+Taxonomy
 * Generator itself uses internally).
 */
export function deriveStepConfigs(config) {
  const cptName = config.cpt_name || "Portfolio Item";
  const cptPlural = config.cpt_plural || `${cptName}s`;
  const cptSlug = toOptionCase(cptName);

  return {
    theme: {
      project_name: config.project_name,
      ...(config.author ? { author: config.author } : {}),
    },
    plugin: {
      project_name: config.project_name,
      ...(config.vendor_name ? { vendor_name: config.vendor_name } : {}),
      ...(config.author ? { author: config.author } : {}),
    },
    cpt: {
      cpt_name: cptName,
      cpt_plural: cptPlural,
      ...(config.taxonomy_name ? { taxonomy_name: config.taxonomy_name } : {}),
      ...(config.taxonomy_plural ? { taxonomy_plural: config.taxonomy_plural } : {}),
    },
    acf: {
      group_title: config.acf_group_title || `${cptName} Details`,
      target_cpt: cptSlug,
      fields: config.acf_fields || [
        { label: "Client Name", type: "text" },
        { label: "Project URL", type: "url" },
        { label: "Summary", type: "textarea" },
      ],
    },
  };
}

async function runSequence(config, { themeOutputDir, pluginOutputDir }) {
  const stepConfigs = deriveStepConfigs(config);
  const steps = [];

  if (await dirHasContent(themeOutputDir)) {
    steps.push({ generator: "theme", skipped: true, success: true, reason: "Theme output directory already has content." });
  } else {
    const report = await runGeneratorWithReport("theme", stepConfigs.theme, { outputDir: themeOutputDir, mode: "write" });
    steps.push({ generator: "theme", skipped: false, ...report });
    if (!report.success) return { steps, failedAt: "theme" };
  }

  if (await dirHasContent(pluginOutputDir)) {
    steps.push({ generator: "plugin", skipped: true, success: true, reason: "Plugin output directory already has content." });
  } else {
    const report = await runGeneratorWithReport("plugin", stepConfigs.plugin, { outputDir: pluginOutputDir, mode: "write" });
    steps.push({ generator: "plugin", skipped: false, ...report });
    if (!report.success) return { steps, failedAt: "plugin" };
  }

  // CPT+Taxonomy and ACF are Injection Generators with their own real
  // idempotency (skip-by-identity) — called plainly every time, no
  // pre-check needed; see file header.
  const cptReport = await runGeneratorWithReport("cpt-taxonomy", stepConfigs.cpt, { outputDir: pluginOutputDir, mode: "write" });
  steps.push({ generator: "cpt-taxonomy", skipped: false, ...cptReport });
  if (!cptReport.success) return { steps, failedAt: "cpt-taxonomy" };

  const acfReport = await runGeneratorWithReport("acf-field-group", stepConfigs.acf, { outputDir: pluginOutputDir, mode: "write" });
  steps.push({ generator: "acf-field-group", skipped: false, ...acfReport });
  if (!acfReport.success) return { steps, failedAt: "acf-field-group" };

  return { steps, failedAt: null };
}

function buildStarterPackReport({ mode, startedAt, steps, failedAt, note }) {
  const success = failedAt === null;
  const failedStep = success ? null : steps.find((s) => s.generator === failedAt);
  return {
    starter_pack: "portfolio",
    mode,
    success,
    steps,
    failed_step: failedAt,
    error: success ? null : failedStep?.error ?? null,
    execution_ms: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    ...(note ? { note } : {}),
  };
}

/**
 * Runs the Portfolio Starter Pack: Theme → Plugin → CPT+Taxonomy → ACF
 * Field Group, in that order, against the real target directories.
 *
 * @param {object} config - see VARIABLE_MANIFEST
 * @param {{ theme_output_dir: string, plugin_output_dir: string, mode?: "preview"|"dry-run"|"write" }} options
 */
export async function runPortfolioStarterPack(config, options) {
  const { theme_output_dir: themeOutputDir, plugin_output_dir: pluginOutputDir, mode = "write" } = options;
  if (!themeOutputDir || !pluginOutputDir) {
    throw new Error("runPortfolioStarterPack requires both theme_output_dir and plugin_output_dir.");
  }
  const startedAt = Date.now();

  if (mode === "write") {
    const { steps, failedAt } = await runSequence(config, { themeOutputDir, pluginOutputDir });
    return buildStarterPackReport({ mode, startedAt, steps, failedAt });
  }

  // preview / dry-run: run the REAL sequence against a disposable scratch
  // copy, so later steps can correctly analyze earlier steps' (or
  // pre-existing real target) output — nothing is written to the real
  // target. If the real directories already exist, their current state is
  // copied into the scratch location first, so the preview/dry-run
  // accurately reflects re-running against a real, partially-composed
  // target (e.g. correctly showing the CPT/ACF steps as no-ops if already
  // present there).
  const scratchRoot = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-starter-pack-"));
  const scratchTheme = path.join(scratchRoot, "theme");
  const scratchPlugin = path.join(scratchRoot, "plugin");
  try {
    if (await dirHasContent(themeOutputDir)) {
      await fs.cp(themeOutputDir, scratchTheme, { recursive: true });
    }
    if (await dirHasContent(pluginOutputDir)) {
      await fs.cp(pluginOutputDir, scratchPlugin, { recursive: true });
    }

    const { steps, failedAt } = await runSequence(config, { themeOutputDir: scratchTheme, pluginOutputDir: scratchPlugin });

    if (mode === "preview") {
      // Read back the full resulting file tree from the scratch copy so
      // the caller sees exactly what content would result, without it
      // ever touching the real target.
      for (const step of steps) {
        if (step.skipped || !step.success) continue;
        const allPaths = [...(step.files?.created ?? []), ...(step.files?.modified ?? [])];
        step.preview_files = await Promise.all(
          allPaths.map(async (absPath) => ({
            path: absPath,
            content: await fs.readFile(absPath, "utf8"),
          }))
        );
      }
    }

    return buildStarterPackReport({
      mode,
      startedAt,
      steps,
      failedAt,
      note:
        "Computed by running the full sequence against a disposable scratch copy " +
        "(seeded from the real target's current state, if any). Nothing was written " +
        "to theme_output_dir or plugin_output_dir.",
    });
  } finally {
    await fs.rm(scratchRoot, { recursive: true, force: true });
  }
}

export const PORTFOLIO_METADATA = {
  id: "portfolio-starter-pack",
  name: "Portfolio Starter Pack",
  version: "1.0.0",
  category: "solution",
  description:
    "Composes the Theme, Plugin, CPT+Taxonomy, and ACF Field Group Generators into a complete " +
    "portfolio website: a theme, a plugin with a Portfolio Item CPT and taxonomy, and an ACF " +
    "field group attached to it. Orchestrates existing generators via runGeneratorWithReport — " +
    "duplicates no generation logic.",
  composedGenerators: ["theme", "plugin", "cpt-taxonomy", "acf-field-group"],
  variableManifest: VARIABLE_MANIFEST,
  configSchema: {
    fields: [
      { name: "project_name", type: "string", required: true, description: "Shared identity for the Theme and Plugin steps." },
      { name: "vendor_name", type: "string", required: false, description: "Passed through to the Plugin step." },
      { name: "author", type: "string", required: false, description: "Passed through to the Theme and Plugin steps." },
      { name: "cpt_name", type: "string", required: false, description: "Defaults to 'Portfolio Item'." },
      { name: "cpt_plural", type: "string", required: false, description: "Defaults to cpt_name + 's'." },
      { name: "taxonomy_name", type: "string", required: false, description: "Defaults to '{cpt_name} Category'." },
      { name: "acf_group_title", type: "string", required: false, description: "Defaults to '{cpt_name} Details'." },
      { name: "acf_fields", required: false, description: "Defaults to Client Name / Project URL / Summary." },
    ],
  },
};

export { VARIABLE_MANIFEST };
