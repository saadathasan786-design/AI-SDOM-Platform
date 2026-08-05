/**
 * Constant Case Manager — converts input into upper SNAKE_CASE (for PHP
 * constant prefixes, e.g. `ACME_PORTAL_VERSION`) and lower snake_case (for
 * option/meta-key prefixes, e.g. `acme_portal_version`).
 *
 * Promoted into the framework in Stage 3D. The Plugin Generator (3B) had a
 * local, unexported `toConstantCase()` for exactly this derivation; the
 * Theme Generator (3D) needs the identical thing. Two real generators
 * needing the same capability is the framework's own stated promotion
 * bar ("a framework capability should only be promoted after at least two
 * generators demonstrate the need") — so this now lives here once,
 * instead of being duplicated a second time. plugin-generator.js has been
 * refactored to import from here rather than keep its private copy.
 */

export function toConstantCase(input) {
  return String(input ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function toOptionCase(input) {
  return toConstantCase(input).toLowerCase();
}
