/**
 * Path Utilities — the single place a relative path is normalized for
 * embedding into GENERATED OUTPUT or USER-FACING TEXT.
 *
 * This codebase uses the SAME relative path string for two different
 * purposes, and they must stay distinct:
 *
 *   - Filesystem operations (executor.js writing/reading files, generator
 *     file lists, existing-file lookups) use `node:path`'s native,
 *     platform-specific separators — `includes\Class-CPT.php` on Windows,
 *     `includes/Class-CPT.php` on POSIX.
 *   - The SAME path, when embedded into generated PHP/source code,
 *     generated documentation, or a user-facing error/skip message, must
 *     ALWAYS use forward slashes: that text ends up in a PHP string or a
 *     printed message and must be byte-identical no matter which OS ran
 *     the generator.
 *
 * `toForwardSlashes` handles ONLY the second case. On POSIX `node:path`
 * already produces `/`, so it is a no-op; on Windows it rewrites the `\`
 * that `node:path` emits back to `/`. It is safe for the framework's own
 * constructed relative paths (e.g. `includes/Class-CPT.php`,
 * `blocks/feature-card`), which never legitimately contain a backslash.
 */

export function toForwardSlashes(input) {
  return input.replace(/\\/g, "/");
}
