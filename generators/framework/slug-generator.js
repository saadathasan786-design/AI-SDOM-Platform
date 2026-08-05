/**
 * Slug Generator — converts arbitrary input ("Acme Client Portal") into a
 * WordPress-safe slug ("acme-client-portal": lowercase, hyphen-separated,
 * no leading/trailing/duplicate hyphens).
 *
 * This is the one place slug logic lives. text-domain-manager.js wraps this
 * rather than reimplementing it, since a WP text domain follows the exact
 * same character rules as a plugin/theme slug.
 */

export function toSlug(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
