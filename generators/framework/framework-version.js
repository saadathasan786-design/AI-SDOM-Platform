/**
 * Framework Version — the Generator Framework's own version number.
 *
 * A single canonical source, since framework-compatibility checking (the
 * Generator Catalog, Stage 3C) needs one authoritative version to compare
 * every generator's declared `minimumFrameworkVersion` against. This is
 * deliberately NOT per-generator data — a generator has no business
 * declaring what the current framework version is, only what minimum
 * version IT requires.
 *
 * Bump this when a framework change alters what generators can rely on
 * (e.g. the templateDir support added in Stage 3B would have justified a
 * bump had this constant existed then).
 */
export const FRAMEWORK_VERSION = "1.1.0";
// 1.1.0 (Stage 3E): executor gained per-file `operation` ("create"/"modify"/
// "skip") and `analyzeOutputDir` support — what Injection Generators (first:
// CPT + Taxonomy Generator) rely on. 1.0.0-era generators (Plugin, Theme)
// remain fully compatible; they simply never set these fields.
