/**
 * PHP Class Injector — string-anchored insertion helpers for adding a new
 * method (and its corresponding hook line) into an existing PHP class that
 * follows plugin-boilerplate's convention: one `register(): void` method
 * hooking one or more `register_{slug}_*()` methods.
 *
 * Promoted into the framework in Stage 3F. The CPT + Taxonomy Generator
 * (3E) had these as local, unexported helpers; the ACF Field Group
 * Generator (3F) needs the identical mechanics (find `register(): void {
 * ... }`, insert a hook line before its close; find the class's final
 * closing brace, insert a new method before it). Two real Injection
 * Generators needing the same capability is the framework's own stated
 * promotion bar — so this now lives here once, and
 * cpt-taxonomy-generator.js has been refactored to import from here
 * instead of keeping its own copy.
 *
 * Deliberately NOT a PHP parser — targeted string search, reliable because
 * every target file was itself produced by this framework's Plugin
 * Generator with a highly consistent structure. See
 * docs/CPT-TAXONOMY-GENERATOR.md for the documented limitation.
 */

const REGISTER_METHOD_MARKER = "public function register(): void {";

/**
 * Insert text into ANY named method's body, just before its closing brace.
 * `methodMarker` is the exact method-signature string to search for, e.g.
 * "public function register_routes(): void {".
 *
 * This generalizes what was originally `insertHookIntoRegisterMethod`
 * (hardcoded to `register(): void`) — promoted further in Stage 3G, once
 * the REST API Generator needed to insert into `register_routes()`
 * instead of `register()`. `insertHookIntoRegisterMethod` below is now a
 * thin wrapper over this, kept for backward compatibility with the
 * CPT+Taxonomy and ACF generators, which still only ever target
 * `register()` and don't need the more general form.
 */
export function insertBeforeMethodClose(source, methodMarker, textToInsert) {
  const markerIdx = source.indexOf(methodMarker);
  if (markerIdx === -1) {
    throw new Error(
      `Could not locate "${methodMarker}" — this file's structure doesn't match the expected ` +
        "plugin-boilerplate convention. Was it hand-edited in an incompatible way?"
    );
  }
  const closeIdx = source.indexOf("\n\t}", markerIdx + methodMarker.length);
  if (closeIdx === -1) {
    throw new Error(`Could not locate the end of the method starting with "${methodMarker}".`);
  }
  return source.slice(0, closeIdx) + "\n\t\t" + textToInsert + source.slice(closeIdx);
}

/**
 * Insert a new hook line into an existing `register(): void { ... }`
 * method body, just before its closing brace. Thin wrapper over
 * `insertBeforeMethodClose` — see its docs above.
 */
export function insertHookIntoRegisterMethod(source, hookLine) {
  return insertBeforeMethodClose(source, REGISTER_METHOD_MARKER, hookLine);
}

/**
 * Insert a new method's full text just before a class's final closing
 * brace, separated by a blank line to match the boilerplate's own spacing.
 * Trims any trailing blank lines already present before the class close
 * first, so repeated insertions don't compound extra blank lines each time
 * (a genuine bug found in Stage 3G when three routes were injected back to
 * back — this fix benefits every Injection Generator using this helper).
 */
export function insertMethodBeforeClassClose(source, methodText) {
  const lastBraceIdx = source.lastIndexOf("\n}");
  if (lastBraceIdx === -1) {
    throw new Error("Could not locate the closing brace of the class.");
  }
  const before = source.slice(0, lastBraceIdx).replace(/\n+$/, "");
  return before + "\n\n" + methodText + source.slice(lastBraceIdx);
}
