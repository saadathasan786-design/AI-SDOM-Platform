/**
 * Naming Validator — checks names against WordPress/PHP rules, for use
 * AFTER slug-generator/namespace-manager have derived a name, to catch
 * inputs that produced something unusable (e.g. input was only symbols
 * and produced an empty slug).
 */

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAMESPACE_SEGMENT_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function validateSlug(slug) {
  if (typeof slug !== "string" || slug === "") {
    return { valid: false, reason: "Slug is empty." };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return { valid: false, reason: `"${slug}" is not a valid slug (lowercase letters, numbers, single hyphens only).` };
  }
  return { valid: true };
}

export function validateTextDomain(domain) {
  // WP text domains follow the same rules as slugs.
  return validateSlug(domain);
}

export function validateNamespaceSegment(segment) {
  if (typeof segment !== "string" || segment === "") {
    return { valid: false, reason: "Namespace segment is empty." };
  }
  if (!NAMESPACE_SEGMENT_PATTERN.test(segment)) {
    return {
      valid: false,
      reason: `"${segment}" is not a valid PHP namespace segment (letters, numbers, underscore; cannot start with a digit).`,
    };
  }
  return { valid: true };
}

export function validateProjectName(name) {
  if (typeof name !== "string" || name.trim() === "") {
    return { valid: false, reason: "Project name is empty." };
  }
  if (/[/\\]/.test(name)) {
    return { valid: false, reason: `Project name "${name}" cannot contain path separators.` };
  }
  if (name.length > 100) {
    return { valid: false, reason: "Project name is too long (max 100 characters)." };
  }
  return { valid: true };
}
