/**
 * Main Plugin File Injector — discovery and bootstrap-injection helpers for
 * a target plugin's MAIN file (the one with the `Plugin Name:` docblock).
 *
 * Promoted into the framework in Stage 3I. The Elementor Widget Generator
 * (3H) needed to find the target's main file (a dynamic filename, unlike
 * `includes/Class-X.php`'s fixed paths) and inject a require_once fallback
 * line, a `use` statement, and a bootstrap instantiation line into it — as
 * local, unexported helpers. The Gutenberg Block Generator (3I) needs the
 * IDENTICAL mechanics. Two real generators needing the same capability is
 * this project's own promotion bar — so this now lives here once, and
 * elementor-widget-generator.js has been refactored to import from here
 * instead of keeping its own copies.
 *
 * Deliberately NOT a PHP parser — same documented limitation as
 * php-class-injector.js. Reliable because every target main file was
 * itself produced by this framework's Plugin Generator with a highly
 * consistent structure (see plugin-boilerplate/plugin-boilerplate.php).
 */

import path from "node:path";

const BOOTSTRAP_MARKER = "add_action( 'plugins_loaded', function () {";

/**
 * Finds the target's main plugin file among already-loaded existing files
 * (from `analyzeOutputDir`) — identified as a root-level file (no
 * directory separator in its path) containing a `Plugin Name:` docblock,
 * since the actual filename varies per generated plugin.
 */
export function findMainPluginFile(existingFiles) {
  return (existingFiles ?? []).find((f) => !f.path.includes(path.sep) && /Plugin Name:/.test(f.content));
}

/**
 * Detects the three facts every main-file injector needs, straight from
 * the file's own content — never guessed or re-derived from config.
 */
export function detectPluginConstants(mainFileContent) {
  const constantMatch = /define\(\s*'([A-Z0-9_]+)_DIR'/.exec(mainFileContent);
  const namespaceMatch = /use\s+([A-Za-z0-9_\\]+)\\Deactivator;/.exec(mainFileContent);
  const textDomainMatch = /Text Domain:\s*([a-z0-9-]+)/.exec(mainFileContent);
  return {
    constantPrefix: constantMatch ? constantMatch[1] : null,
    namespace: namespaceMatch ? namespaceMatch[1] : null,
    textDomain: textDomainMatch ? textDomainMatch[1] : null,
  };
}

/**
 * Inserts a new require_once line into the fallback manual-includes block
 * (the `else` branch used when Composer hasn't been run), right after the
 * last existing require_once line in that block.
 */
export function insertRequireIntoFallbackBlock(mainFileContent, constantPrefix, relativeIncludePath) {
  const marker = "Class-Deactivator.php';";
  const markerIdx = mainFileContent.indexOf(marker);
  if (markerIdx === -1) {
    throw new Error("Could not locate the fallback require_once block in the target's main plugin file.");
  }
  const lineEnd = mainFileContent.indexOf("\n", markerIdx);
  return (
    mainFileContent.slice(0, lineEnd) +
    `\n\trequire_once ${constantPrefix}_DIR . '${relativeIncludePath}';` +
    mainFileContent.slice(lineEnd)
  );
}

/** Inserts a new `use {namespace}\{className};` statement after the existing use-statement block. */
export function insertUseStatement(mainFileContent, namespace, className) {
  const marker = `use ${namespace}\\Deactivator;`;
  const markerIdx = mainFileContent.indexOf(marker);
  if (markerIdx === -1) {
    throw new Error("Could not locate the use-statement block in the target's main plugin file.");
  }
  const lineEnd = markerIdx + marker.length;
  return mainFileContent.slice(0, lineEnd) + `\nuse ${namespace}\\${className};` + mainFileContent.slice(lineEnd);
}

/** Inserts a new line into the `add_action( 'plugins_loaded', function () { ... } )` bootstrap closure. */
export function insertIntoBootstrap(mainFileContent, newLine) {
  const markerIdx = mainFileContent.indexOf(BOOTSTRAP_MARKER);
  if (markerIdx === -1) {
    throw new Error("Could not locate the plugins_loaded bootstrap block in the target's main plugin file.");
  }
  const closeIdx = mainFileContent.indexOf("\n} );", markerIdx + BOOTSTRAP_MARKER.length);
  if (closeIdx === -1) {
    throw new Error("Could not locate the end of the plugins_loaded bootstrap block.");
  }
  return mainFileContent.slice(0, closeIdx) + `\n\t${newLine}` + mainFileContent.slice(closeIdx);
}
