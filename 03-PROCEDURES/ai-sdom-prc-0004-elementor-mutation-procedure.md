---
identifier: AI-SDOM-PRC-0004-ELEMENTOR-MUTATION-PROCEDURE
title: Elementor Document Mutation Procedure
version: 1.0.0
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
  - procedures
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-29: governed mutation procedure draft"
---

# Elementor Document Mutation Procedure

## 1. Purpose

1.1 This procedure defines the operational method for safely inspecting and,
where governed, mutating the Elementor document content of an existing
WordPress page through the certified wp-mcp-server adapter.

1.2 This procedure operationalizes the change-management requirements of
[AI-SDOM-GOV-0002] for mutations of an external WordPress site, and the
architecture decision of ADR AI-SDOM-ADR-0001, while remaining subject to
[AI-SDOM-ARC-0001] and [AI-SDOM-GOV-0001].

1.3 This procedure SHALL ensure that any Elementor document mutation is
performed in a controlled, reversible, verifiable, and traceable manner.

1.4 This procedure SHALL NOT redefine governance authority, change
categories, quality-gate criteria, document structure, identifier authority,
or dependency policy defined by their governing documents.

## 2. Scope

2.1 This procedure applies to the `wp_elementor_inspect` and
`wp_elementor_patch` MCP tools of the certified wp-mcp-server, and to any
agent or workflow that invokes them.

2.2 This procedure covers:

- inspection and classification of the requested edit;
- the read-before-write and read-validation safeguards;
- the inspect -> snapshot -> validate -> (dry-run | write -> verify ->
  rollback) workflow;
- structural-change gating;
- stale-baseline guarding;
- verification and rollback;
- traceability of every mutation.

## 3. Preconditions

Before any Elementor document mutation, the operator SHALL confirm:

1. The target page is an Elementor page (`_elementor_edit_mode === "builder"`).
2. The target document reads back as a complete, parseable JSON array (a
   truncated or non-parseable read SHALL block the operation).
3. The target element and property path exist on that element.
4. The intended change is classified (simple non-structural vs structural).
5. Required approval to mutate the external site has been obtained.

If any mandatory precondition is not satisfied, the mutation SHALL NOT
proceed.

## 4. Inspection

4.1 Before any write, the operator SHALL read the current document via
`wp_elementor_inspect` (or an equivalent full `GET /wp/v2/pages/{id}?context=edit`
read) and record its document SHA-256.

4.2 The read SHALL be validated: `_elementor_data` MUST parse as a complete,
structurally coherent array of elements. A read that fails to parse, or that
is observed to be truncated (for example, a server-returned value that ends
mid-JSON), SHALL cause the operation to abort with a clear error and SHALL
NOT proceed to any write, per ADR AI-SDOM-ADR-0001.

## 5. Snapshot

5.1 Before writing, a baseline snapshot of the current document and its SHA-256
SHALL be captured (for example, in the Memory store scoped by the connected
site), so the change can be diffed and reversed.

## 6. Validation

6.1 The candidate change SHALL be validated as a minimal-diff mutation: the
new document MUST alter only the targeted property of the targeted element,
leaving element ids, element order, element counts, `elType`/`widgetType`
identity, `__globals__` keys, and image ids unchanged.

6.2 A change that would alter any structural property (element ids, order,
counts, types, global keys, or image ids) SHALL be classified structural and
SHALL NOT be applied unless explicitly allowed via an explicit
`allow_structural` flag on the invoking tool, and SHALL then be reviewed per
[AI-SDOM-GOV-0002].

6.3 A stale-baseline guard SHALL be applied: if the caller supplied an
expected document SHA-256 and it does not match the current document, the
write SHALL abort, because the document changed since the caller inspected it.

## 7. Dry-Run

7.1 A dry-run mode SHALL be supported and, where practical, performed before any
write: the change is computed and reported (document SHA-256 before/after,
targeted property before/after) without sending any write to WordPress.

## 8. Write

8.1 The write SHALL mutate ONLY the `_elementor_data` meta field of the target
page via `POST /wp/v2/pages/{id}` with body
`{"meta":{"_elementor_data": "<reconstructed json>"}}`. No other page field or
meta SHALL be changed.

## 9. Verify and Rollback

9.1 After writing, the operator SHALL re-read the document and compare its
SHA-256 to the expected value, and confirm the targeted property now holds the
intended value.

9.2 If verification fails (hash mismatch or target value not applied), the
operator SHALL restore the held pre-write document, then re-read and confirm
restoration.

9.3 If restoration cannot be confirmed, the operator SHALL escalate to the
governance/change-management process and SHALL NOT represent the mutation as
complete.

## 10. Traceability Evidence

The mutation record SHALL retain, as applicable:

- target page identifier and element identifier;
- property path and before/after values;
- document SHA-256 before and after;
- whether the change was structural and whether it was explicitly allowed;
- snapshot identifier;
- verification result and any rollback performed.

## 11. Error Handling

| Failure | Action |
|---------|--------|
| Non-Elementor page | Abort; report page is not Elementor |
| Truncated / non-parseable read | Abort; never write from unreliable data |
| Element or path not found | Abort with a clear error |
| Stale baseline | Abort; require re-inspection |
| Structural change without allow_structural | Refuse; require explicit approval |
| Verification failure | Rollback to pre-write document, re-verify restoration |
| Rollback failure | Escalate; do not mark complete |

## 12. Validation Testing

12.1 The Elementor capability SHALL be validated by the automated test
suites in the mcp-server:

- `npm test` runs the offline suite (`test/*.test.js`), including the
  Elementor unit and contract tests, with no live WordPress connection
  required;
- `npm run test:live` runs the deliberate live validation test
  (`test-live/elementor-mcp-real-invocation.test.js`), which performs
  read-only `wp_elementor_inspect` calls against the connected WordPress
  site to confirm transformable documents are returned and truncated or
  invalid documents are refused.

12.2 The live validation test SHALL be opt-in: it SHALL NOT be part of the
default offline suite or of CI, and SHALL run only when the operator
provides working WordPress credentials (`WP_BASE_URL`, `WP_USERNAME`,
`WP_APP_PASSWORD`), normally supplied through the local `.env`. Credentials
SHALL NOT be committed to the repository.

12.3 Live validation via this automated suite complements, and SHALL NOT
replace, the governed mutation procedure's read-before-write, snapshot,
verify, and rollback steps ([AI-SDOM-ARC-0001 (Section 7.6)] and
[AI-SDOM-ARC-0001 (Section 7.2)]).

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
| 1.0.0   | 2026-09-03 | Saadat Hasan | First full ratification: Draft 0.1.0 → Active 1.0.0. Recorded the Document Owner (owner: Saadat Hasan) designated by the PRC Domain Maintainer per GOV-0001 Section 3.4. Ratification per GOV-0001 Section 7. | PRC Domain Maintainer (Saadat Hasan) |
| 0.1.0   | 2026-08-29 | —      | Initial Elementor mutation procedure draft | Pending |

## Self-Audit Certification

This document has been reviewed against the applicable architecture,
governance, documentation, metadata, cross-reference, semver, naming,
repository-structure, and dependency-management requirements.

**Status:** Active. First full ratification completed (0.1.0 Draft → 1.0.0 Active).

### Self-Audit Log

1. **Front-matter conformance:** Uses the established YAML front-matter model
   (identifier, title, version, lifecycle-state, layer, dependencies, tags,
   ai-assistance), consistent with PRC-0002 and PRC-0003.
2. **Dependency completeness:** Declares ARC-0001, GOV-0001, GOV-0002, and
   STD-0001..STD-0007, each cited in the body, consistent with PRC-0003.
3. **Governance boundary:** Operationalizes governance and standards by
   reference; redefines no authority, category, approval right, or
   pass/fail-gate criterion.
4. **External-site mutation focus:** Adds operational safeguards specific to
   mutating a live WordPress site (read-truncation refusal, structural gating,
   stale-baseline guard, verify + rollback) that PRC-0003 does not carry,
   without duplicating PRC-0003's change workspace/PR/merge workflow.
5. **ADR reference boundary:** ADR AI-SDOM-ADR-0001 is referenced
   descriptively (not by canonical ADR-to-ADR citation) per
   [AI-SDOM-ARC-0001 (Section 7.2)].
6. **Lifecycle state:** The document was held as a Draft until the repository's
   validation and ratification process was completed; this was resolved by the
   ratification recorded in item 7.
7. **Ratification (version 1.0.0):** The 0.1.0 Draft was reviewed, validated
   against all applicable gates, and ratified to 1.0.0 Active per GOV-0001
   Section 7. The transition 0.1.0 → 1.0.0 is the ratification transition (not
   a MAJOR/MINOR/PATCH increment) per the Semantic Versioning Standard Section
   8.2. The Document Owner was designated by the PRC Domain Maintainer per
   GOV-0001 Section 3.4 and recorded in the front-matter `owner` field.
8. **Merge ordering dependency (governance bootstrap):** This ratification
   relies on the PRC Domain Maintainer role established by the first amendment
   to [AI-SDOM-GOV-0001] (initial Board constitution and Domain Maintainer
   appointments, GOV-0001 version 0.2.0). This amendment SHALL be merged before
   the present ratification so that the documented approval authority (the
   Designated PRC Domain Maintainer) exists. Until that prior change is merged,
   this procedure's recorded approval SHALL be read as pending the
   establishment of the role.

### Initial Gate Assessment

| Gate | Status | Evidence |
|------|--------|----------|
| Layer dependency compliance | PASS | All formal dependencies are Layer 0-2 references appropriate for a Layer 3 PRC. |
| Document taxonomy | PASS | PRC identifier, title, and placement are consistent with the procedure class. |
| Identifier and filename | PASS | Identifier is AI-SDOM-PRC-0004 and filename mirrors the canonical lowercase slug. |
| Cross-reference integrity | PASS | Formal references use the canonical form; ADR referenced descriptively. |
| Semantic versioning | PASS | Procedure version is 1.0.0. |
| Dependency declaration | PASS | Declared dependencies are referenced by the procedure. |
| Architecture/governance boundary | PASS | Governing rules are operationalized by reference rather than redefined. |
| Quality validation | PASS | All applicable mandatory validation gates passed prior to ratification. |
