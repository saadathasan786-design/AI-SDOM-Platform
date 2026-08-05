/**
 * Text Domain Manager — derives a WordPress text domain from a project
 * name. A text domain follows the exact same character rules as a plugin
 * slug (lowercase, hyphen-separated), so this deliberately wraps
 * slug-generator.js rather than reimplementing the same regex twice.
 *
 * Kept as its own module — not just an alias — because callers reason
 * about "text domain" as its own WordPress concept (used in
 * __(), _e(), Text Domain: header, load_plugin_textdomain, etc.), distinct
 * from "slug" (used in folder/file naming, plugin basename). Today they
 * compute the same value; if WP's rules for one ever diverge from the
 * other, this is the one place to change it without touching slug callers.
 */

import { toSlug } from "./slug-generator.js";

export function toTextDomain(input) {
  return toSlug(input);
}
