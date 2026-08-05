import { test } from "node:test";
import assert from "node:assert/strict";
import { VARIABLE_MANIFEST } from "../plugin/variable-manifest.js";
import { generatePluginFiles } from "../plugin/plugin-generator.js";

test("every manifest entry has the required documentation fields", () => {
  for (const entry of VARIABLE_MANIFEST) {
    assert.equal(typeof entry.variable, "string");
    assert.equal(typeof entry.description, "string");
    assert.equal(typeof entry.replaces_literal_token, "string");
    assert.ok(entry.variable.length > 0);
    assert.ok(entry.description.length > 0);
  }
});

test("manifest's project_name entry is marked required with no default", () => {
  const entry = VARIABLE_MANIFEST.find((e) => e.variable === "project_name");
  assert.equal(entry.required, true);
  assert.equal(entry.default, null);
});

test("every literal token the manifest documents is actually substituted by generatePluginFiles", () => {
  const fakeFile = {
    path: "plugin-boilerplate.php",
    content: VARIABLE_MANIFEST.map((e) => e.replaces_literal_token).join("\n"),
  };

  const result = generatePluginFiles(
    {
      project_name: "Acme Client Portal",
      vendor_name: "Acme Agency",
      author: "Jane Smith",
      plugin_uri: "https://acmeagency.com",
    },
    [fakeFile]
  );

  const outputContent = result[0].content;
  for (const entry of VARIABLE_MANIFEST) {
    assert.ok(
      !outputContent.includes(entry.replaces_literal_token),
      `manifest token "${entry.replaces_literal_token}" (variable "${entry.variable}") was not substituted`
    );
  }
});
