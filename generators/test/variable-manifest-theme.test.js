import { test } from "node:test";
import assert from "node:assert/strict";
import { VARIABLE_MANIFEST } from "../theme/variable-manifest.js";
import { generateThemeFiles } from "../theme/theme-generator.js";

test("every manifest entry has the required documentation fields", () => {
  for (const entry of VARIABLE_MANIFEST) {
    assert.equal(typeof entry.variable, "string");
    assert.equal(typeof entry.description, "string");
    assert.equal(typeof entry.replaces_literal_token, "string");
    assert.ok(entry.variable.length > 0);
  }
});

test("manifest's project_name entry is marked required with no default", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "project_name");
  assert.equal(entry.required, true);
  assert.equal(entry.default, null);
});

test("every literal token the manifest documents is actually substituted by generateThemeFiles", () => {
  // Tokens must appear in an order where more specific ones precede
  // substrings of themselves (the file itself explains why); build the
  // fake content in that same safe order rather than joining the raw
  // manifest tokens naively.
  const fakeFile = {
    path: "style.css",
    content: [
      "BOILERPLATE_THEME_VERSION",
      "boilerplate-theme",
      "Boilerplate Theme",
      "boilerplate-style",
      "Boilerplate",
      "Your Name",
      "https://example.com",
    ].join("\n"),
  };

  const result = generateThemeFiles(
    { project_name: "Acme Portal", author: "Jane Smith", theme_uri: "https://acmeagency.com" },
    [fakeFile]
  );

  const outputContent = result[0].content;
  for (const entry of VARIABLE_MANIFEST) {
    // "boilerplate" (bare) is intentionally still a substring of
    // "BOILERPLATE_THEME_VERSION"'s already-replaced output only if case
    // matched, which it doesn't (upper vs lower) — safe to check directly.
    assert.ok(
      !outputContent.includes(entry.replaces_literal_token),
      `manifest token "${entry.replaces_literal_token}" (variable "${entry.variable}") was not substituted`
    );
  }
});
