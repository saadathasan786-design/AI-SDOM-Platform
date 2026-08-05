/**
 * Namespace Manager — converts arbitrary input into a valid PHP namespace
 * segment (PascalCase, letters/numbers only, cannot start with a number),
 * and composes vendor+project into a full PSR-4 namespace.
 */

export function toNamespaceSegment(input) {
  const words = String(input ?? "")
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  let segment = words
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("")
    .replace(/[^A-Za-z0-9]/g, "");

  // PHP identifiers cannot start with a digit — prefix if needed.
  if (/^[0-9]/.test(segment)) {
    segment = `N${segment}`;
  }

  return segment;
}

export function buildPsr4Namespace(vendor, project) {
  const vendorSegment = toNamespaceSegment(vendor);
  const projectSegment = toNamespaceSegment(project);
  if (!vendorSegment || !projectSegment) {
    throw new Error("buildPsr4Namespace requires both a non-empty vendor and project name.");
  }
  return `${vendorSegment}\\${projectSegment}`;
}
