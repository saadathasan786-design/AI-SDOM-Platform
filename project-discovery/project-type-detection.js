/**
 * WordPress Metadata & Project-Type Detection — Stage 8C. Extends the
 * Stage 8B discoverProject() utility's output with OPTIONAL metadata
 * fields, exactly per the Stage 8A design. This file is a pure
 * post-processing step over an already-collected sourceFiles array --
 * it performs NO additional filesystem traversal, NO execution, NO
 * evaluation, and NO loading of project code. It only reads the
 * already-collected file contents as text/JSON.
 *
 * ARCHITECTURE: still entirely outside every framework -- no registry,
 * no executor, no report wrapper. discoverProject() (Stage 8B) remains
 * the single discovery mechanism; this file is called BY it as a final
 * step, not a second, competing traversal.
 *
 * BACKWARD COMPATIBILITY: every field this file adds is OPTIONAL and
 * additive. The context object's required field remains exactly
 * sourceFiles (Stage 8B), unchanged in shape and meaning. Any existing
 * component that reads only sourceFiles -- which is every real
 * Advisor/Agent/Workflow in this project today -- is completely
 * unaffected, since none of them inspect unrecognized keys.
 *
 * DELIBERATE, HONEST DUPLICATION (per this stage's explicit
 * instruction): PLUGIN_HEADER_PATTERN and THEME_HEADER_PATTERN below
 * are the SAME regexes already validated by
 * advisors/wordpress-hooks-core/wordpress-hooks-core-advisor.js's own
 * PLUGIN_HEADER_MARKER_PATTERN/THEME_HEADER_MARKER_PATTERN. True import
 * -based reuse is impossible without modifying that frozen file (its
 * patterns are module-private consts, never exported) -- doing so would
 * violate this project's "do not modify frozen Advisor code" rule.
 * Duplicating the two small regex literals here is deliberate,
 * documented technical debt, not an oversight -- consistent with the
 * exact same honest-duplication precedent already established across
 * the three WordPress Advisors themselves (Stage 7D's own
 * maskPhpStrings()/findLineNumber() duplication).
 */

const PLUGIN_HEADER_PATTERN = /^\s*\*?\s*Plugin Name:\s*(.+)$/m;
const THEME_HEADER_PATTERN = /^\s*\*?\s*Theme Name:\s*(.+)$/m;

// A small, conservative set of standard WordPress plugin/theme header
// fields -- the same style of key: value docblock line the frozen
// WordPress Hooks & Core Advisor already parses individual fields from
// (Version, Text Domain), generalized here to capture the full known
// set into one object rather than checking each field's presence/absence
// individually (this file's job is metadata COLLECTION, not correctness
// analysis -- that remains the Advisor's job, unchanged).
const HEADER_FIELD_PATTERNS = {
  Name: /^\s*\*?\s*Plugin Name:\s*(.+)$/m,
  ThemeName: /^\s*\*?\s*Theme Name:\s*(.+)$/m,
  Version: /^\s*\*?\s*Version:\s*(.+)$/m,
  TextDomain: /^\s*\*?\s*Text Domain:\s*(.+)$/m,
  Description: /^\s*\*?\s*Description:\s*(.+)$/m,
  Author: /^\s*\*?\s*Author:\s*(.+)$/m,
  RequiresAtLeast: /^\s*\*?\s*Requires at least:\s*(.+)$/m,
  RequiresPHP: /^\s*\*?\s*Requires PHP:\s*(.+)$/m,
  License: /^\s*\*?\s*License:\s*(.+)$/m,
};

function extractHeaderFields(content) {
  const headers = {};
  for (const [key, pattern] of Object.entries(HEADER_FIELD_PATTERNS)) {
    const match = pattern.exec(content);
    if (match) headers[key] = match[1].trim();
  }
  return headers;
}

/** Parses a WordPress readme.txt's top "Key: Value" header block (before the first == Section == heading; the top === Title === line is skipped, not treated as a section break). */
function parseReadmeHeaders(content) {
  const headers = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^===/.test(trimmed)) continue; // the "=== Plugin Name ===" title line -- skip, don't stop
    if (/^==[^=]/.test(trimmed)) break; // a real "== Section ==" heading -- stop here
    const match = /^([A-Za-z][A-Za-z ]*):\s*(.+)$/.exec(trimmed);
    if (match) headers[match[1].trim()] = match[2].trim();
  }
  return headers;
}

/** Safely parses JSON content; returns null (never throws) on malformed input. */
function safeParseJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function basename(filePath) {
  const segments = filePath.split("/");
  return segments[segments.length - 1];
}

function depthOf(filePath) {
  return filePath.split("/").length;
}

/** Picks the root-most (shallowest path) match when multiple candidates exist. */
function pickRootMost(files) {
  if (files.length === 0) return null;
  return files.slice().sort((a, b) => depthOf(a.path) - depthOf(b.path))[0];
}

/**
 * Extracts optional WordPress-related metadata from an already
 * -collected sourceFiles array. Pure, read-only, never throws --
 * malformed JSON or missing files simply result in absent fields.
 */
export function extractWordPressMetadata(sourceFiles) {
  const metadata = {};

  const pluginFile = sourceFiles.find((f) => f.path.endsWith(".php") && PLUGIN_HEADER_PATTERN.test(f.content));
  if (pluginFile) {
    metadata.pluginHeaders = extractHeaderFields(pluginFile.content);
  }

  const themeFile = sourceFiles.find(
    (f) => (f.path.endsWith(".css") || f.path.endsWith(".php")) && THEME_HEADER_PATTERN.test(f.content)
  );
  if (themeFile) {
    metadata.themeHeaders = extractHeaderFields(themeFile.content);
  }

  const wpContentFile = sourceFiles.find((f) => f.path.split("/").includes("wp-content"));
  if (wpContentFile) {
    const segments = wpContentFile.path.split("/");
    const idx = segments.indexOf("wp-content");
    metadata.wpContentRoot = segments.slice(0, idx + 1).join("/");
  }

  const readmeFile = sourceFiles.find((f) => basename(f.path).toLowerCase() === "readme.txt");
  if (readmeFile) {
    metadata.readmeHeaders = parseReadmeHeaders(readmeFile.content);
  }

  const blockJsonFiles = sourceFiles.filter((f) => basename(f.path) === "block.json");
  if (blockJsonFiles.length > 0) {
    metadata.blockJsonFiles = blockJsonFiles
      .map((f) => ({ path: f.path, content: safeParseJson(f.content) }))
      .filter((entry) => entry.content !== null);
  }

  const composerFiles = sourceFiles.filter((f) => basename(f.path) === "composer.json");
  const rootComposer = pickRootMost(composerFiles);
  if (rootComposer) {
    const parsed = safeParseJson(rootComposer.content);
    if (parsed !== null) metadata.composerJson = parsed;
  }

  const packageFiles = sourceFiles.filter((f) => basename(f.path) === "package.json");
  const rootPackage = pickRootMost(packageFiles);
  if (rootPackage) {
    const parsed = safeParseJson(rootPackage.content);
    if (parsed !== null) metadata.packageJson = parsed;
  }

  return metadata;
}

/**
 * Detects a single project-type classification from an already
 * -collected sourceFiles array. Pure, read-only, never throws.
 */
export function detectProjectType(sourceFiles) {
  const composerFiles = sourceFiles.filter((f) => basename(f.path) === "composer.json");
  const packageFiles = sourceFiles.filter((f) => basename(f.path) === "package.json");

  const pluginFiles = sourceFiles.filter((f) => f.path.endsWith(".php") && PLUGIN_HEADER_PATTERN.test(f.content));
  const themeFiles = sourceFiles.filter(
    (f) => (f.path.endsWith(".css") || f.path.endsWith(".php")) && THEME_HEADER_PATTERN.test(f.content)
  );

  // Monorepo: 2+ independent sub-project roots (each with its own
  // package.json/composer.json NOT at the overall root) -- takes
  // precedence, since correctly identifying "this is several projects"
  // matters more than picking one sub-project's type.
  const nonRootManifests = [...composerFiles, ...packageFiles].filter((f) => depthOf(f.path) > 1);
  const distinctManifestDirs = new Set(nonRootManifests.map((f) => f.path.split("/").slice(0, -1).join("/")));
  if (distinctManifestDirs.size >= 2) {
    return "monorepo";
  }

  const hasWpContent = sourceFiles.some((f) => f.path.split("/").includes("wp-content"));
  if (hasWpContent) {
    return "wordpress-site";
  }

  if (pluginFiles.length > 0) {
    return "wordpress-plugin";
  }

  if (themeFiles.length > 0) {
    return "wordpress-theme";
  }

  const hasComposer = composerFiles.length > 0;
  const hasPackage = packageFiles.length > 0;

  if (hasComposer && hasPackage) {
    return "mixed";
  }
  if (hasComposer) {
    return "generic-php";
  }
  if (hasPackage) {
    return "generic-js";
  }

  return "unknown";
}
