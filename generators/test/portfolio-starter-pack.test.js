import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveStepConfigs } from "../portfolio-starter-pack/portfolio-starter-pack.js";

test("derives sensible defaults from just project_name", () => {
  const configs = deriveStepConfigs({ project_name: "Acme Portfolio" });

  assert.equal(configs.theme.project_name, "Acme Portfolio");
  assert.equal(configs.plugin.project_name, "Acme Portfolio");
  assert.equal(configs.cpt.cpt_name, "Portfolio Item");
  assert.equal(configs.cpt.cpt_plural, "Portfolio Items");
  assert.equal(configs.acf.group_title, "Portfolio Item Details");
  assert.equal(configs.acf.target_cpt, "portfolio_item");
  assert.equal(configs.acf.fields.length, 3);
});

test("target_cpt always matches the CPT step's own slug derivation, even with a custom cpt_name", () => {
  const configs = deriveStepConfigs({ project_name: "Acme Portfolio", cpt_name: "Case Study" });
  assert.equal(configs.cpt.cpt_name, "Case Study");
  assert.equal(configs.acf.target_cpt, "case_study");
});

test("passes through vendor_name and author only when provided (not forcing empty overrides)", () => {
  const withValues = deriveStepConfigs({ project_name: "X", vendor_name: "Acme Agency", author: "Jane" });
  assert.equal(withValues.plugin.vendor_name, "Acme Agency");
  assert.equal(withValues.plugin.author, "Jane");
  assert.equal(withValues.theme.author, "Jane");

  const withoutValues = deriveStepConfigs({ project_name: "X" });
  assert.ok(!("vendor_name" in withoutValues.plugin));
  assert.ok(!("author" in withoutValues.plugin));
  assert.ok(!("author" in withoutValues.theme));
});

test("respects explicit cpt_plural, taxonomy_name, acf_group_title, and acf_fields overrides", () => {
  const configs = deriveStepConfigs({
    project_name: "X",
    cpt_name: "Case Study",
    cpt_plural: "Case Studies",
    taxonomy_name: "Industry",
    acf_group_title: "Case Study Info",
    acf_fields: [{ label: "Industry Name", type: "text" }],
  });

  assert.equal(configs.cpt.cpt_plural, "Case Studies");
  assert.equal(configs.cpt.taxonomy_name, "Industry");
  assert.equal(configs.acf.group_title, "Case Study Info");
  assert.deepEqual(configs.acf.fields, [{ label: "Industry Name", type: "text" }]);
});

test("default acf_fields cover Client Name, Project URL, and Summary", () => {
  const configs = deriveStepConfigs({ project_name: "X" });
  const labels = configs.acf.fields.map((f) => f.label);
  assert.deepEqual(labels, ["Client Name", "Project URL", "Summary"]);
});
