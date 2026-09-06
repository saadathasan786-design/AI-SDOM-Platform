---
identifier: AI-SDOM-PRC-0004-ELEMENTOR-MUTATION-PROCEDURE
title: Elementor Document Creation and Mutation Procedure
version: 1.1.0
lifecycle-state: Active
owner: Saadat Hasan
layer: 3
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY
  - AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY
  - AI-SDOM-STD-0001-DOCUMENTATION-STANDARD
  - AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD
  - AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD
  - AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD
  - AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD
  - AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD
  - AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD
tags:
  - elementor
  - external-system-mutation
  - external-system-creation
  - procedures
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-29: governed mutation procedure draft; GPT-5.6 Luna 2026-09-06: governed Elementor document creation extension"
---

# Elementor Document Creation and Mutation Procedure

## 1. Purpose

1.1 This procedure defines the operational method for safely inspecting,
creating, and, where governed, mutating Elementor document content on a
WordPress site through the certified wp-mcp-server adapter.

1.2 This procedure operationalizes the change-management requirements of
[AI-SDOM-GOV-0002] for controlled external WordPress changes, and the
architecture decision of ADR AI-SDOM-ADR-0001, while remaining subject to
[AI-SDOM-ARC-0001] and [AI-SDOM-GOV-0001].

1.3 This procedure SHALL ensure that Elementor document creation and mutation
are performed in a controlled, reversible where applicable, verifiable, and
traceable manner.

1.4 This procedure SHALL NOT redefine governance authority, change
categories, quality-gate criteria, document structure, identifier authority,
or dependency policy defined by their governing documents.

## 2. Scope

2.1 This procedure applies to the `wp_elementor_inspect`,
`wp_elementor_create`, and `wp_elementor_patch` MCP tools of the certified
wp-mcp-server, and to any agent or workflow that invokes them.

2.2 This procedure covers:

- inspection and classification of requested Elementor operations;
- discovery and eligibility checks for new Elementor document creation;
- structured document specification and validation;
- the read-before-write and read-validation safeguards;
- the creation workflow `discover -> specify -> validate -> dry-run ->
  initialize -> verify -> snapshot`;
- the mutation workflow `inspect -> snapshot -> plan -> validate ->
  (dry-run | write -> verify -> rollback)`;
- structural-change gating;
- stale-baseline guarding for mutation;
- verification, rollback where applicable, and escalation;
- traceability of every creation or mutation.

2.3 Initial governed creation scope is deliberately limited to Elementor
Pages using supported element types defined by the implementation contract.
The initial scope SHALL include Container, Heading, Text Editor, Button, and
Image elements only. Additional Elementor element types require explicit
implementation and validation before they are considered supported.

2.4 This procedure does not by itself authorize complete website generation,
design-from-image interpretation, arbitrary Elementor widget coverage,
responsive or global-style automation, Theme Builder construction,
header/footer construction, WooCommerce-specific construction, forms or
popups, theme construction, plugin construction, or automatic deployment.

## 3. Preconditions

### 3.1 Common preconditions

Before any Elementor document creation or mutation, the operator SHALL
confirm:

1. The target site and project are authorized for the operation.
2. The requested operation is within the supported capability scope.
3. Required approval to change the external site has been obtained.
4. Required credentials are available through the certified adapter and are
   not exposed in repository content.

If any mandatory common precondition is not satisfied, the operation SHALL
NOT proceed.

### 3.2 Mutation preconditions

Before an Elementor document mutation, the operator SHALL additionally
confirm:

1. The target page is an Elementor page (`_elementor_edit_mode ===
   "builder"`).
2. The target document reads back as a complete, parseable JSON array. A
   truncated or non-parseable read SHALL block the operation.
3. The target element and property path exist on that element.
4. The intended change is classified as simple non-structural or structural.
5. Required mutation approval has been obtained.

### 3.3 Creation preconditions

Before an Elementor document creation, the operator SHALL additionally
confirm:

1. The target WordPress Page exists and is an eligible page type.
2. The target Page is authorized for the connected project.
3. The target Page is not already an Elementor document.
4. The target Page does not contain meaningful existing page content that
   would be silently replaced by Elementor initialization. An implementation
   MAY impose a stricter empty-content requirement.
5. A supported structured document specification has been supplied.
6. The specification contains only supported element types and valid
   relationships.
7. The generated Elementor document passes all document validation gates.

A creation request that fails any creation precondition SHALL produce zero
WordPress writes.

## 4. Inspection and Discovery

4.1 Before any mutation write, the operator SHALL read the current document
via `wp_elementor_inspect` (or an equivalent full
`GET /wp/v2/pages/{id}?context=edit` read) and record its document SHA-256.

4.2 The read SHALL be validated: `_elementor_data` MUST parse as a complete,
structurally coherent array of elements. A read that fails to parse, or that
is observed to be truncated (for example, a server-returned value that ends
mid-JSON), SHALL cause the operation to abort with a clear error and SHALL
NOT proceed to any write, per ADR AI-SDOM-ADR-0001.

4.3 Before creation, the operator SHALL inspect the target Page sufficiently
to establish that it exists, is eligible, is not already an Elementor
document, and has no meaningful existing content that would be silently
replaced.

4.4 Creation discovery SHALL NOT treat a missing Elementor document as a
malformed document. A Page with no Elementor metadata is an eligible
candidate only if all other creation preconditions are satisfied.

## 5. Snapshot

5.1 Before a mutation write, a baseline snapshot of the current document and
its SHA-256 SHALL be captured (for example, in the Memory store scoped by the
connected site), so the change can be diffed and reversed.

5.2 For creation, the implementation SHALL preserve sufficient pre-creation
state to establish what existed before initialization and to support
verification and controlled recovery if creation fails after a write.

5.3 A successful creation SHALL be eligible for a post-creation snapshot that
records the resulting Elementor document and its canonical document SHA-256.

## 6. Specification and Validation

### 6.1 Mutation validation

6.1.1 The candidate mutation SHALL be validated as a minimal-diff mutation:
the new document MUST alter only the targeted property of the targeted
element, leaving element ids, element order, element counts,
`elType`/`widgetType` identity, `__globals__` keys, and image ids unchanged.

6.1.2 A change that would alter any structural property (element ids, order,
counts, types, global keys, or image ids) SHALL be classified structural and
SHALL NOT be applied unless explicitly allowed via an explicit
`allow_structural` flag on the invoking tool, and SHALL then be reviewed per
[AI-SDOM-GOV-0002].

6.1.3 A stale-baseline guard SHALL be applied: if the caller supplied an
expected document SHA-256 and it does not match the current document, the
write SHALL abort because the document changed since the caller inspected it.

### 6.2 Creation specification

6.2.1 Creation SHALL accept a structured document specification rather than
an unrestricted opaque `_elementor_data` payload.

6.2.2 The initial specification contract SHALL support a document containing
supported Containers and the following supported child elements: Heading,
Text Editor, Button, and Image.

6.2.3 The specification SHALL be validated for:

- supported specification version;
- required document and element fields;
- supported element types;
- unique and valid element identifiers;
- valid parent-child relationships;
- valid element nesting;
- required settings for each supported element type;
- absence of unsupported or malformed element objects.

6.2.4 The implementation SHALL deterministically transform the validated
structured specification into Elementor `_elementor_data`.

### 6.3 Generated-document validation

6.3.1 The generated `_elementor_data` SHALL parse as valid JSON.

6.3.2 The parsed value SHALL be a structurally coherent Elementor element
array.

6.3.3 The implementation SHALL validate generated element identity,
tree relationships, supported element types, required fields, and other
creation invariants before any WordPress write.

6.3.4 Validation failure SHALL occur before the initialization write and SHALL
produce zero WordPress writes.

## 7. Dry-Run

7.1 Dry-run mode SHALL be supported for both creation and mutation and SHALL
send no write request to WordPress.

7.2 For mutation, dry-run SHALL report the document SHA-256 before and after
and the targeted property before and after.

7.3 For creation, dry-run SHALL report the target eligibility, the structured
specification classification, the generated Elementor document summary, and
the expected resulting document hash without initializing the Page.

7.4 A dry-run SHALL NOT create, initialize, modify, or otherwise mutate the
WordPress target.

## 8. Write and Initialization

### 8.1 Mutation write

8.1.1 The mutation write SHALL mutate ONLY the `_elementor_data` meta field of
the target page via `POST /wp/v2/pages/{id}` with body
`{"meta":{"_elementor_data": "<reconstructed json>"}}`. No other page field or
meta SHALL be changed by the mutation operation.

### 8.2 Creation initialization

8.2.1 Creation SHALL initialize the eligible WordPress Page as an Elementor
Page using the validated generated document.

8.2.2 The minimum Elementor initialization metadata established by the
validated creation contract SHALL be:

- `_elementor_edit_mode` = `builder`;
- `_elementor_template_type` = `wp-page`;
- `_elementor_data` = the validated generated Elementor document JSON string.

8.2.3 The initialization write SHALL occur only after specification and
generated-document validation have passed and, when requested, after a
successful dry-run.

8.2.4 The creation implementation SHALL use the authenticated standard
WordPress REST adapter. It SHALL NOT depend on an unverified or unavailable
Elementor document-creation REST endpoint.

8.2.5 Creation SHALL NOT accept arbitrary caller-supplied `_elementor_data`
as an unrestricted bypass of the specification and validation gates.

## 9. Verify and Rollback

### 9.1 Mutation verification

9.1.1 After writing, the operator SHALL re-read the document and compare its
SHA-256 to the expected value, and confirm the targeted property now holds the
intended value.

9.1.2 If verification fails (hash mismatch or target value not applied), the
operator SHALL restore the held pre-write document, then re-read and confirm
restoration.

### 9.2 Creation verification

9.2.1 After initialization, the implementation SHALL re-read the target Page
and confirm:

- `_elementor_edit_mode` is `builder`;
- `_elementor_template_type` is `wp-page`;
- `_elementor_data` is present and parseable;
- the resulting document contains the expected validated structure;
- the resulting document is recognized by `wp_elementor_inspect` as an
  Elementor document;
- the resulting canonical document SHA-256 matches the expected generated
  document hash.

9.2.2 A creation operation SHALL NOT be reported complete until all mandatory
verification checks pass.

9.2.3 If initialization succeeds but mandatory verification fails, the
implementation SHALL perform controlled recovery where the pre-creation state
can be safely restored. If restoration cannot be confirmed, the operation
SHALL escalate to the governance/change-management process and SHALL NOT be
represented as complete.

9.2.4 A successful creation SHALL retain the resulting document snapshot and
verification evidence.

## 10. Traceability Evidence

The operation record SHALL retain, as applicable:

- target site/project and page identifier;
- operation type (`create`, `inspect`, or `patch`);
- for creation, specification version and supported element summary;
- for mutation, element identifier and property path;
- before/after values where applicable;
- document SHA-256 before and after;
- expected generated document hash for creation;
- whether the change was structural and whether it was explicitly allowed;
- snapshot identifier(s);
- verification result;
- any rollback or controlled recovery performed;
- failure and escalation evidence where applicable.

## 11. Error Handling

| Failure | Action |
|---------|--------|
| Non-Elementor page during mutation | Abort; report page is not Elementor |
| Target Page missing or ineligible for creation | Abort; no write |
| Target already contains an Elementor document during creation | Abort; use mutation workflow instead |
| Meaningful existing Page content during creation | Abort; require explicit eligibility/approved handling |
| Unsupported creation specification | Abort; no write |
| Invalid element identifier or relationship | Abort; no write |
| Generated Elementor document malformed/non-parseable | Abort; never write invalid document |
| Truncated / non-parseable existing read | Abort; never write from unreliable data |
| Element or path not found during mutation | Abort with a clear error |
| Stale baseline | Abort; require re-inspection |
| Structural mutation without allow_structural | Refuse; require explicit approval |
| Creation dry-run | Report only; never write |
| Mutation verification failure | Rollback to pre-write document, re-verify restoration |
| Creation verification failure | Controlled recovery where safe; re-verify or escalate |
| Rollback/recovery failure | Escalate; do not mark complete |

## 12. Validation Testing

12.1 The Elementor capability SHALL be validated by automated tests in the
mcp-server:

- `npm test` runs the offline suite (`test/*.test.js`), including Elementor
  unit and contract tests, with no live WordPress connection required;
- `npm run test:live` runs the deliberate live validation test
  (`test-live/elementor-mcp-real-invocation.test.js`), which performs
  read-only `wp_elementor_inspect` calls against the connected WordPress
  site to confirm transformable documents are returned and truncated or
  invalid documents are refused.

12.2 Creation-specific automated tests SHALL cover, at minimum:

- valid structured specification;
- unsupported specification version or element type;
- duplicate or invalid element identifiers;
- invalid parent-child relationships;
- malformed generated document;
- already-Elementor target;
- ineligible target with meaningful existing content;
- dry-run with zero WordPress writes;
- validation failure with zero WordPress writes;
- successful initialization of the Elementor metadata and document;
- read-back verification and canonical document hash matching;
- controlled recovery/escalation when post-write verification fails.

12.3 The existing mutation integrity regression tests SHALL remain mandatory,
including refusal of malformed/truncated baselines and the invariant that
such a baseline produces zero writes and zero snapshots.

12.4 The live validation test SHALL be opt-in: it SHALL NOT be part of the
default offline suite or of CI, and SHALL run only when the operator provides
working WordPress credentials (`WP_BASE_URL`, `WP_USERNAME`,
`WP_APP_PASSWORD`), normally supplied through the local `.env`. Credentials
SHALL NOT be committed to the repository.

12.5 Any live creation validation SHALL use a controlled disposable or
explicitly designated test Page and SHALL NOT be represented as production
capability certification until the applicable governance gates have passed.

12.6 Live validation via automated suites complements, and SHALL NOT replace,
the governed creation or mutation procedure's discovery, validation,
snapshot, write, verify, and rollback/recovery steps
([AI-SDOM-ARC-0001 (Section 7.6)] and [AI-SDOM-ARC-0001 (Section 7.2)]).

## 13. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Constitutional authority and change boundaries |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Repository governance, roles, approval, lifecycle, and records |
| [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY] | Change-management governance operationalized by this procedure |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Controlled-document structure |
| [AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD] | Metadata requirements |
| [AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD] | Cross-reference requirements |
| [AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD] | Version requirements |
| [AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD] | Naming requirements |
| [AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD] | Placement and structure |
| [AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD] | Dependency requirements |
| [AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE] | ADR lifecycle governing this decision |
| [AI-SDOM-PRC-0003-CHANGE-IMPLEMENTATION-PROCEDURE] | Change-implementation workflow for the code that realizes this procedure |
| ADR AI-SDOM-ADR-0001 | Architecture decision this procedure operationalizes (identified descriptively per [AI-SDOM-ARC-0001 (Section 7.2)]) |

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 1.1.0   | 2026-09-06 | Saadat Hasan | Extended the active procedure from governed Elementor document mutation to governed Elementor document creation, adding creation preconditions, structured specification and generated-document validation, dry-run requirements, Elementor initialization, creation verification/recovery, creation evidence, and creation-specific validation tests. | Pending governance review |
| 1.0.0   | 2026-09-03 | Saadat Hasan | First full ratification: Draft 0.1.0 → Active 1.0.0. Recorded the Document Owner (owner: Saadat Hasan) designated by the PRC Domain Maintainer per GOV-0001 Section 3.4. Ratification per GOV-0001 Section 7. | PRC Domain Maintainer (Saadat Hasan) |
| 0.1.0   | 2026-08-29 | —      | Initial Elementor mutation procedure draft | Pending |

## Self-Audit Certification

This document has been reviewed against the applicable architecture,
governance, documentation, metadata, cross-reference, semver, naming,
repository-structure, and dependency-management requirements. The v1.1.0
amendment is documentation-only and does not itself implement the
`wp_elementor_create` capability.

**Status:** Active. Version 1.1.0 amendment is pending governance review and
ratification; the previously ratified 1.0.0 procedure remains the effective
operational procedure until the amendment is approved through the applicable
governance process.

### Self-Audit Log

1. **Front-matter conformance:** Uses the established YAML front-matter model
   (identifier, title, version, lifecycle-state, layer, dependencies, tags,
   ai-assistance), consistent with PRC-0002 and PRC-0003.
2. **Dependency completeness:** Retains ARC-0001, GOV-0001, GOV-0002, and
   STD-0001..STD-0007, each cited in the body, consistent with PRC-0003.
3. **Governance boundary:** Operationalizes governance and standards by
   reference; redefines no authority, category, approval right, or
   pass/fail-gate criterion.
4. **External-system safety boundary:** Retains the existing mutation
   safeguards and adds creation-specific eligibility, specification,
   generated-document validation, zero-write-on-validation-failure,
   initialization, verification, and controlled-recovery requirements.
5. **Integrity regression boundary:** The malformed/truncated document gate
   remains mandatory and is not weakened by the creation extension.
6. **Architectural boundary:** The creation extension operationalizes the
   already-amended ADR AI-SDOM-ADR-0001; it does not create a competing
   architectural decision.
7. **Creation input boundary:** Creation is specified through a structured
   document specification rather than unrestricted raw `_elementor_data`.
8. **Scope boundary:** Complete website generation, arbitrary widget coverage,
   design-from-image, responsive/global style automation, Theme Builder,
   WooCommerce-specific construction, theme/plugin construction, and automatic
   deployment remain outside this procedure.
9. **Lifecycle boundary:** The 1.1.0 amendment is not represented as
   ratified merely because it is present on a branch. Until governance review
   and ratification are complete, the active ratified 1.0.0 procedure remains
   effective.
10. **Implementation boundary:** This amendment does not itself implement or
    expose `wp_elementor_create`; implementation SHALL follow the approved
    procedure through the change-implementation process.

### Amendment Gate Assessment

| Gate | Status | Evidence |
|------|--------|----------|
| Layer dependency compliance | PASS | All formal dependencies remain Layer 0-2 references appropriate for a Layer 3 PRC. |
| Document taxonomy | PASS | PRC identifier, title, and placement remain consistent with the procedure class. |
| Identifier and filename | PASS | Identifier remains AI-SDOM-PRC-0004 and filename remains the canonical lowercase slug. |
| Cross-reference integrity | PASS | Formal references use the established canonical/descriptive forms. |
| Semantic versioning | PASS | Additive capability extension is versioned 1.0.0 → 1.1.0. |
| Dependency declaration | PASS | Existing formal dependencies are retained and referenced. |
| Architecture/governance boundary | PASS | The amendment operationalizes the amended ADR without redefining governance authority. |
| Integrity-gate preservation | PASS | Malformed/truncated document refusal remains mandatory. |
| Creation safety boundary | PASS | Structured specification, validation, zero-write failure behavior, verification, and recovery are defined. |
| Lifecycle/approval state | PENDING | Amendment awaits applicable governance review and ratification. |
