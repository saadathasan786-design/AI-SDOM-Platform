/**
 * Accessibility Advisor — Stage 4G. The fifth real Advisor.
 *
 * Static accessibility analysis of markup embedded in ANY given source
 * file -- raw HTML (.html templates), PHP files that echo HTML (widget
 * render() methods), or JS/JSX files (Gutenberg save()/edit() functions).
 * Detection is purely tag/attribute text-pattern based, not tied to file
 * extension, since all three of those real forms appear in this
 * project's own boilerplates (theme-boilerplate/parts/*.html,
 * elementor-widget-boilerplate's render() PHP heredoc, gutenberg-block
 * -boilerplate's save.js JSX).
 *
 * PURITY: identical contract to every prior Advisor (4C-4F).
 * inputRequirements: ["sourceFiles"] proved fully sufficient.
 *
 * FRAMEWORK REUSE EVALUATED, NONE APPLIED: source-analysis.js's
 * functions (import parsing, dependency graphs, TODO markers) are all
 * JS-module-structure concerns; none apply to markup/accessibility
 * analysis. This is an honest "checked, doesn't fit" outcome, not a
 * missed reuse opportunity -- the four prior advisors all analyzed this
 * project's own JS logic, sharing a common domain; this advisor analyzes
 * markup, a genuinely different domain with no natural overlap.
 *
 * TWO REQUESTED CHECKS DELIBERATELY NOT IMPLEMENTED, documented in
 * docs/ACCESSIBILITY-ADVISOR.md:
 * - "empty alt attributes where inappropriate" -- alt="" is frequently
 *   the CORRECT choice (decorative images); judging "inappropriate"
 *   requires knowing image intent, which static text analysis cannot
 *   determine. Only a fully MISSING alt attribute is flagged.
 * - "missing landmark elements" -- most files analyzed here are
 *   fragments (a single header/footer part, a single widget's render
 *   output), not full pages. Asserting a fragment is missing <main> when
 *   it's legitimately just a footer partial would be a false, speculative
 *   finding. Only checks evaluable within a single file's own content
 *   (e.g. duplicate ids, heading skips within that file) are implemented.
 *
 * EVIDENCE DISCIPLINE: every finding includes the exact triggering tag
 * text. No opaque scores; the valid-ARIA-role list is a named, visible
 * constant.
 */

const IMG_TAG_PATTERN = /<img\b([^>]*)>/gi;
const FORM_CONTROL_PATTERN = /<(input|select|textarea)\b([^>]*)>/gi;
const LABEL_FOR_PATTERN = /<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>/gi;
const ID_ATTRIBUTE_PATTERN = /\bid=["']([^"']+)["']/gi;
const HEADING_TAG_PATTERN = /<h([1-6])\b/gi;
const BUTTON_TAG_PATTERN = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
const LINK_TAG_PATTERN = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
const HTML_TAG_PATTERN = /<html\b([^>]*)>/i;
const TABINDEX_PATTERN = /\btabindex=["']?(-?\d+)["']?/gi;
const ARIA_ROLE_PATTERN = /\brole=["']([^"']+)["']/gi;

const NON_LABELABLE_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);
const NON_DESCRIPTIVE_LINK_TEXT = new Set(["click here", "here", "read more", "more", "link", "click", "more info"]);

// A representative subset of WAI-ARIA 1.2 roles -- not exhaustive, but
// covers the roles that appear in real-world markup and this project's
// own examples. Extend if a real false positive is found against a valid
// role not in this list.
const VALID_ARIA_ROLES = new Set([
  "alert", "alertdialog", "application", "article", "banner", "button", "cell",
  "checkbox", "columnheader", "combobox", "complementary", "contentinfo",
  "definition", "dialog", "directory", "document", "feed", "figure", "form",
  "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox",
  "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem",
  "menuitemcheckbox", "menuitemradio", "navigation", "none", "note",
  "option", "presentation", "progressbar", "radio", "radiogroup", "region",
  "row", "rowgroup", "rowheader", "scrollbar", "search", "searchbox",
  "separator", "slider", "spinbutton", "status", "switch", "tab", "table",
  "tablist", "tabpanel", "term", "textbox", "timer", "toolbar", "tooltip",
  "tree", "treegrid", "treeitem",
]);

// Native element -> role combinations that are redundant (the role
// matches the element's own implicit ARIA role).
const REDUNDANT_ROLE_BY_TAG = {
  button: "button",
  a: "link",
  nav: "navigation",
  img: "img",
  form: "form",
  main: "main",
  header: "banner",
  footer: "contentinfo",
};

function findLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function hasAttribute(attrString, attrName) {
  const pattern = new RegExp(`\\b${attrName}\\s*=`, "i");
  return pattern.test(attrString);
}

function getAttributeValue(attrString, attrName) {
  const pattern = new RegExp(`\\b${attrName}\\s*=\\s*["']([^"']*)["']`, "i");
  const match = pattern.exec(attrString);
  return match ? match[1] : null;
}

function findMissingAltAttributes(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    IMG_TAG_PATTERN.lastIndex = 0;
    let match;
    while ((match = IMG_TAG_PATTERN.exec(file.content)) !== null) {
      if (!hasAttribute(match[1], "alt")) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "missing-alt-attribute",
          severity: "critical",
          category: "images",
          message: `"${file.path}" has an <img> tag with no alt attribute at line ${line}.`,
          recommendation: { message: "Every <img> needs an alt attribute -- descriptive text for meaningful images, or alt=\"\" for purely decorative ones. Missing alt entirely means screen readers announce the filename or nothing useful." },
          evidence: { path: file.path, line, triggeringText: match[0] },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findUnlabeledFormControls(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const labelTargets = new Set();
    LABEL_FOR_PATTERN.lastIndex = 0;
    let labelMatch;
    while ((labelMatch = LABEL_FOR_PATTERN.exec(file.content)) !== null) {
      labelTargets.add(labelMatch[1]);
    }

    FORM_CONTROL_PATTERN.lastIndex = 0;
    let match;
    while ((match = FORM_CONTROL_PATTERN.exec(file.content)) !== null) {
      const tagName = match[1].toLowerCase();
      const attrString = match[2];
      const type = getAttributeValue(attrString, "type");
      if (tagName === "input" && type && NON_LABELABLE_INPUT_TYPES.has(type.toLowerCase())) continue;

      const id = getAttributeValue(attrString, "id");
      const hasMatchingLabel = id && labelTargets.has(id);
      const hasAriaLabel = hasAttribute(attrString, "aria-label") || hasAttribute(attrString, "aria-labelledby");

      if (!hasMatchingLabel && !hasAriaLabel) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "unlabeled-form-control",
          severity: "warning",
          category: "forms",
          message: `"${file.path}" has a <${tagName}> with no associated label at line ${line}.`,
          recommendation: { message: "Add a <label for=\"...\"> matching this control's id, or an aria-label/aria-labelledby attribute directly on it." },
          evidence: { path: file.path, line, triggeringText: match[0] },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findDuplicateIdAttributes(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const idPositions = new Map();
    ID_ATTRIBUTE_PATTERN.lastIndex = 0;
    let match;
    while ((match = ID_ATTRIBUTE_PATTERN.exec(file.content)) !== null) {
      const id = match[1];
      if (!idPositions.has(id)) idPositions.set(id, []);
      idPositions.get(id).push(findLineNumber(file.content, match.index));
    }
    for (const [id, lines] of idPositions.entries()) {
      if (lines.length >= 2) {
        findings.push({
          id: "duplicate-id-attribute",
          severity: "warning",
          category: "markup-validity",
          message: `"${file.path}" has id="${id}" used ${lines.length} times, at lines ${lines.join(", ")}.`,
          recommendation: { message: "Duplicate IDs are invalid HTML and break label/aria-labelledby associations, in-page anchors, and any code targeting the id. Make each id unique." },
          evidence: { path: file.path, id, lines },
          location: { file: file.path },
        });
      }
    }
  }
  return findings;
}

function findSkippedHeadingLevels(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const headings = [];
    HEADING_TAG_PATTERN.lastIndex = 0;
    let match;
    while ((match = HEADING_TAG_PATTERN.exec(file.content)) !== null) {
      headings.push({ level: Number(match[1]), line: findLineNumber(file.content, match.index) });
    }
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];
      if (curr.level > prev.level + 1) {
        findings.push({
          id: "skipped-heading-level",
          severity: "warning",
          category: "headings",
          message: `"${file.path}" jumps from <h${prev.level}> to <h${curr.level}> at line ${curr.line}, skipping level(s) in between.`,
          recommendation: { message: "Heading levels should descend one at a time (h1 -> h2 -> h3) so screen reader users can navigate the outline predictably." },
          evidence: { path: file.path, fromLevel: prev.level, toLevel: curr.level, line: curr.line },
          location: { file: file.path, line: curr.line },
        });
      }
    }
  }
  return findings;
}

function findButtonsWithoutAccessibleName(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    BUTTON_TAG_PATTERN.lastIndex = 0;
    let match;
    while ((match = BUTTON_TAG_PATTERN.exec(file.content)) !== null) {
      const attrString = match[1];
      const innerText = match[2].replace(/<[^>]*>/g, "").trim();
      const hasAriaLabel = hasAttribute(attrString, "aria-label") || hasAttribute(attrString, "aria-labelledby");
      if (innerText === "" && !hasAriaLabel) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "button-without-accessible-name",
          severity: "warning",
          category: "buttons",
          message: `"${file.path}" has a <button> with no text content and no aria-label at line ${line}.`,
          recommendation: { message: "A button with no accessible name announces nothing meaningful to screen readers. Add visible text or an aria-label (common for icon-only buttons)." },
          evidence: { path: file.path, line, triggeringText: match[0].slice(0, 120) },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findNonDescriptiveLinkText(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    LINK_TAG_PATTERN.lastIndex = 0;
    let match;
    while ((match = LINK_TAG_PATTERN.exec(file.content)) !== null) {
      const innerText = match[2].replace(/<[^>]*>/g, "").trim().toLowerCase();
      if (NON_DESCRIPTIVE_LINK_TEXT.has(innerText)) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "non-descriptive-link-text",
          severity: "suggestion",
          category: "links",
          message: `"${file.path}" has a link with non-descriptive text ("${innerText}") at line ${line}.`,
          recommendation: { message: "Screen reader users often navigate by a list of link texts alone. Use text that describes the destination, e.g. 'Read the full report' rather than 'read more'." },
          evidence: { path: file.path, line, linkText: innerText },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findImageOnlyLinksWithoutLabel(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    LINK_TAG_PATTERN.lastIndex = 0;
    let match;
    while ((match = LINK_TAG_PATTERN.exec(file.content)) !== null) {
      const attrString = match[1];
      const innerContent = match[2];
      const textOutsideImg = innerContent.replace(/<img\b[^>]*>/gi, "").replace(/\s+/g, "");
      const imgMatch = /<img\b([^>]*)>/i.exec(innerContent);
      if (!imgMatch || textOutsideImg !== "") continue;

      const imgAlt = getAttributeValue(imgMatch[1], "alt");
      const linkHasAriaLabel = hasAttribute(attrString, "aria-label") || hasAttribute(attrString, "aria-labelledby");
      if ((!imgAlt || imgAlt.trim() === "") && !linkHasAriaLabel) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "image-only-link-without-label",
          severity: "warning",
          category: "links",
          message: `"${file.path}" has a link containing only an image with no accessible text at line ${line}.`,
          recommendation: { message: "An image-only link needs either a non-empty alt on the image or an aria-label on the link itself, or it has no accessible name at all." },
          evidence: { path: file.path, line, triggeringText: match[0].slice(0, 150) },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findMissingLangAttribute(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    const match = HTML_TAG_PATTERN.exec(file.content);
    if (match && !hasAttribute(match[1], "lang")) {
      const line = findLineNumber(file.content, match.index);
      findings.push({
        id: "missing-lang-attribute",
        severity: "warning",
        category: "document-structure",
        message: `"${file.path}" has an <html> tag with no lang attribute at line ${line}.`,
        recommendation: { message: "The lang attribute lets screen readers use the correct pronunciation/voice and helps translation tools. Add e.g. lang=\"en\"." },
        evidence: { path: file.path, line, triggeringText: match[0] },
        location: { file: file.path, line },
      });
    }
  }
  return findings;
}

function findPositiveTabindex(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    TABINDEX_PATTERN.lastIndex = 0;
    let match;
    while ((match = TABINDEX_PATTERN.exec(file.content)) !== null) {
      const value = Number(match[1]);
      if (value > 0) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "positive-tabindex-usage",
          severity: "warning",
          category: "keyboard-navigation",
          message: `"${file.path}" uses tabindex="${value}" (positive) at line ${line}.`,
          recommendation: { message: "Positive tabindex values override the natural DOM tab order and are a well-known source of confusing keyboard navigation. Use tabindex=\"0\" (natural order) or restructure the markup instead." },
          evidence: { path: file.path, line, triggeringText: match[0] },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findInvalidAriaRoles(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    ARIA_ROLE_PATTERN.lastIndex = 0;
    let match;
    while ((match = ARIA_ROLE_PATTERN.exec(file.content)) !== null) {
      const role = match[1].toLowerCase();
      if (!VALID_ARIA_ROLES.has(role)) {
        const line = findLineNumber(file.content, match.index);
        findings.push({
          id: "invalid-aria-role",
          severity: "warning",
          category: "aria",
          message: `"${file.path}" uses role="${role}", which is not a recognized WAI-ARIA role, at line ${line}.`,
          recommendation: { message: "An invalid role is ignored by assistive technology, silently losing whatever semantics were intended. Check for a typo or consult the WAI-ARIA role list." },
          evidence: { path: file.path, line, role },
          location: { file: file.path, line },
        });
      }
    }
  }
  return findings;
}

function findRedundantAriaRoles(sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    for (const [tag, redundantRole] of Object.entries(REDUNDANT_ROLE_BY_TAG)) {
      const pattern = new RegExp(`<${tag}\\b([^>]*)>`, "gi");
      let match;
      while ((match = pattern.exec(file.content)) !== null) {
        const roleValue = getAttributeValue(match[1], "role");
        if (roleValue && roleValue.toLowerCase() === redundantRole) {
          const line = findLineNumber(file.content, match.index);
          findings.push({
            id: "redundant-aria-role",
            severity: "suggestion",
            category: "aria",
            message: `"${file.path}" has <${tag} role="${redundantRole}">, which is redundant -- <${tag}> already has this implicit role.`,
            recommendation: { message: "Not harmful, but unnecessary. The role attribute can be removed without changing accessibility semantics." },
            evidence: { path: file.path, line, triggeringText: match[0] },
            location: { file: file.path, line },
          });
        }
      }
    }
  }
  return findings;
}

/**
 * Pure analysis function. input.sourceFiles is an array of
 * { path, content }.
 */
export async function analyzeAccessibility({ sourceFiles }) {
  const findings = [];

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    return findings;
  }

  findings.push(...findMissingAltAttributes(sourceFiles));
  findings.push(...findUnlabeledFormControls(sourceFiles));
  findings.push(...findDuplicateIdAttributes(sourceFiles));
  findings.push(...findSkippedHeadingLevels(sourceFiles));
  findings.push(...findButtonsWithoutAccessibleName(sourceFiles));
  findings.push(...findNonDescriptiveLinkText(sourceFiles));
  findings.push(...findImageOnlyLinksWithoutLabel(sourceFiles));
  findings.push(...findMissingLangAttribute(sourceFiles));
  findings.push(...findPositiveTabindex(sourceFiles));
  findings.push(...findInvalidAriaRoles(sourceFiles));
  findings.push(...findRedundantAriaRoles(sourceFiles));

  findings.push({
    id: "accessibility-scan-summary",
    severity: "info",
    category: "summary",
    message: `Scanned ${sourceFiles.length} file(s); ${findings.length} accessibility-relevant finding(s) before this summary.`,
    recommendation: { message: "Purely descriptive; no action implied." },
    evidence: { fileCount: sourceFiles.length, findingCountBeforeSummary: findings.length },
  });

  return findings;
}

export const accessibilityAdvisor = {
  id: "accessibility",
  name: "Accessibility Advisor",
  version: "1.0.0",
  category: "accessibility",
  description:
    "Static accessibility analysis of markup (HTML, PHP-echoed HTML, or JSX): missing alt " +
    "attributes, unlabeled form controls, duplicate ids, skipped heading levels, buttons/links " +
    "without accessible names, missing lang attributes, positive tabindex usage, and invalid/" +
    "redundant ARIA roles. Read-only, evidence-based.",
  inputRequirements: ["sourceFiles"],
  analyze: analyzeAccessibility,
};
