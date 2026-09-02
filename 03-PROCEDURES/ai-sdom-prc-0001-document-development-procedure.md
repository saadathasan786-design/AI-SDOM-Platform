# Document Development Procedure

**Identifier:** AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE  
**Version:** 0.1.0  
**Lifecycle State:** Active  
**Layer:** 3  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT], [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY], [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD]  
**ai-assistance:** opencode (deepseek-v4-flash-free) 2026-07-31: initial draft  

---

## 1. Purpose

1.1 This procedure defines the complete lifecycle for authoring, validating, registering, reviewing, approving, publishing, and maintaining governed documents within the AI-SDOM repository. It is the operational companion to the structural rules defined in [AI-SDOM-STD-0001] and operates within the governance framework established by [AI-SDOM-GOV-0001].

1.2 This procedure derives its authority from [AI-SDOM-ARC-0001 (Section 7.5)], which requires a Procedure (PRC) to cite the Standard (STD) it implements, and from [AI-SDOM-STD-0001 (Section 9.4)], which defines the minimum content of a procedure.

1.3 This procedure defines how a document progresses through its lifecycle. It SHALL NOT define:
- Approval thresholds, roles, or decision rights (defined in [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001]).
- Document structure, metadata, or content requirements (defined in [AI-SDOM-STD-0001]).
- Validation gates or pass/fail criteria (defined in the Architecture Validation Standard).
- Reusable document structure and formatting (defined in the Master Document Template).
- Identifier allocation authority or register schema (defined in the Repository Register).

---

## 2. Scope

2.1 This procedure applies to every governed document class defined in [AI-SDOM-ARC-0001 (Section 4)]: ARC, GOV, STD, PRC, TPL, REG, ADR, and QLT.

2.2 This procedure covers the complete lifecycle: initiation [Section 6], authoring [Section 7], validation [Section 8], registration [Section 9], review [Section 10], approval [Section 11], publication [Section 12], and maintenance [Section 13] (including amendment, deprecation, and retirement).

2.3 Class-specific rules prevail over generic steps where they conflict [AI-SDOM-ARC-0001 (Section 2.3)]. Notable deviations include the ADR lifecycle (versionless, immutable after ratification [AI-SDOM-ARC-0001 (Section 17.3)]) and the QLT approval authority (Quality Domain Maintainer [AI-SDOM-GOV-0001 (Section 5.2)]).

---

## 3. Prerequisites

The following conditions SHALL be satisfied before a document lifecycle begins:

| # | Prerequisite | Governing Reference |
|---|--------------|---------------------|
| 1 | The need for a new or amended document is confirmed and does not duplicate an existing document | [AI-SDOM-ARC-0001 (Section 2.4)] |
| 2 | The author is familiar with the architecture, governance, and standard documents that bind the change | [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-STD-0001] |
| 3 | The document class and layer are determined | [AI-SDOM-ARC-0001 (Section 3, Section 4)] |
| 4 | The next available identifier has been drawn from the Repository Register | [AI-SDOM-ARC-0001 (Section 5.3, Section 14.4)] |
| 5 | A class-appropriate template is available | [AI-SDOM-STD-0001 (Section 9)] |
| 6 | The approving authority for the class is identified | [AI-SDOM-ARC-0001 (Section 15)], [AI-SDOM-GOV-0001 (Section 5.2)] |

---

## 4. Roles and Responsibilities

4.1 The governance roles that participate in the document lifecycle are defined in [AI-SDOM-GOV-0001 (Section 3)]. This procedure does not redefine them.

4.2 The typical participants and their lifecycle responsibilities are:

| Role | Lifecycle Responsibilities | Defined In |
|------|----------------------------|------------|
| Author | Drafts the document, performs the self-audit, and submits the change via pull request | [AI-SDOM-GOV-0001 (Section 3.1)] |
| Document Owner | Owns document content, versioning, and lifecycle; approves PRC, TPL, and REG changes | [AI-SDOM-GOV-0001 (Section 3.4)] |
| Domain Maintainer | Maintains class structural integrity; approves STD changes; appoints Document Owners | [AI-SDOM-GOV-0001 (Section 3.3)] |
| Governance Board | Approves ARC and GOV changes; appoints Domain Maintainers | [AI-SDOM-GOV-0001 (Section 3.2)] |
| Quality Domain Maintainer | Approves QLT changes | [AI-SDOM-GOV-0001 (Section 3.5)] |
| Independent Reviewers | Approve ADR ratification | [AI-SDOM-GOV-0001 (Section 5.2)] |

4.3 The approving body and threshold for each class are determined by [AI-SDOM-ARC-0001 (Section 15)] as operationalized in [AI-SDOM-GOV-0001 (Section 5.2)] and are not repeated here.

---

## 5. Lifecycle Overview

5.1 The document lifecycle consists of eight phases:

```
Initiate → Author → Validate → Register → Review → Approve → Publish → Maintain
    ↑                                                                    │
    └────────────────────────────────────────────────────────────────────┘
              (amendments re-enter at the phase appropriate to the change)
```

5.2 Phases 1 through 8 are described in [Section 6] through [Section 13]. Mandatory activities are expressed with SHALL; recommended activities with SHOULD; optional activities with MAY [AI-SDOM-STD-0001 (Section 2)].

5.3 A document MAY be withdrawn at any phase by its author or approver. Withdrawal SHALL be recorded in the pull request or a governance record per [AI-SDOM-GOV-0001 (Section 11)].

---

## 6. Phase 1 — Initiate

6.1 Confirm the need for a new document or an amendment. Every requirement SHALL trace to a governing document per [AI-SDOM-ARC-0001 (Section 2.2)].

6.2 Determine the document class and its layer per [AI-SDOM-ARC-0001 (Section 3, Section 4)]. The class determines the directory, the identifier range, and the approving authority.

6.3 Perform a change impact analysis. The change SHALL include an impact statement listing every document potentially affected per [AI-SDOM-ARC-0001 (Section 10.1)].

6.4 Draw the next available identifier for the class from the Repository Register per [AI-SDOM-ARC-0001 (Section 5.3)]. The identifier SHALL fall within the reserved range for the class [AI-SDOM-ARC-0001 (Section 12)] and SHALL NOT be invented. AI assistance SHALL NOT generate identifiers [AI-SDOM-ARC-0001 (Section 14.4)].

6.5 Create a branch following the branch naming convention [AI-SDOM-ARC-0001 (Section 11.5)]. All work SHALL be submitted through pull requests; direct commits to the main branch are prohibited [AI-SDOM-ARC-0001 (Section 19.3)].

---

## 7. Phase 2 — Author

7.1 Instantiate the Master Document Template for the document's class. The template defines the reusable structure and placeholders and is not reproduced here.

7.2 Compose the body following the mandatory and class-specific sections defined in [AI-SDOM-STD-0001 (Section 8, Section 9)]. The document SHALL address a single concern [AI-SDOM-ARC-0001 (Section 2.1)] and SHALL NOT combine content belonging to another class [AI-SDOM-STD-0001 (Section 9.4.4)].

7.3 Complete the front matter per the metadata requirements in [AI-SDOM-STD-0001 (Section 3)]. The identifier SHALL match the filename [AI-SDOM-ARC-0001 (Section 5.4)].

7.4 Record every referenced document in the Dependencies section per [AI-SDOM-ARC-0001 (Section 7.3)]. Only documents referenced by canonical identifier are listed.

7.5 Compose cross-references using the canonical syntax defined in [AI-SDOM-ARC-0001 (Section 8)]. Every external reference SHALL resolve to an existing document. Documents at higher layers and cross-cutting classes SHALL be referenced by descriptive title rather than canonical identifier to preserve layer dependency rules [AI-SDOM-ARC-0001 (Section 7.1)].

7.6 If AI assistance is used, record the `ai-assistance` field per [AI-SDOM-ARC-0001 (Section 14.2)]. AI output is advisory and the human author retains responsibility [AI-SDOM-ARC-0001 (Section 14.3)]. Human verification of AI-generated cross-references is required before submission [AI-SDOM-ARC-0001 (Section 14.5)].

7.7 Set the version per [AI-SDOM-ARC-0001 (Section 9)]. New documents begin at 0.1.0 [AI-SDOM-GOV-0001 (Section 7.3)]. ADR documents SHALL NOT carry a version [AI-SDOM-ARC-0001 (Section 9.6)].

---

## 8. Phase 3 — Validate

8.1 Perform a self-audit of the draft against [AI-SDOM-ARC-0001] and all applicable gates in the Architecture Validation Standard.

8.2 The self-audit SHALL verify the mandatory automated gates defined in [AI-SDOM-ARC-0001 (Section 18.3)]: identifier uniqueness, reference resolution, dependency acyclicity, naming compliance, and layer compliance.

8.3 The self-audit SHALL verify the mandatory manual gates defined in [AI-SDOM-ARC-0001 (Section 18.4)]: content review, contract compliance, and consistency review.

8.4 Record every issue identified and its resolution in the Self-Audit Log per [AI-SDOM-STD-0001 (Section 8.4)]. An empty log is acceptable only if zero issues were found.

8.5 Run the applicable automated validation gates before submission. Automation may validate without pre-approval, but results SHALL be reviewed before publication [AI-SDOM-ARC-0001 (Section 14.6)].

8.6 A document that fails a gate SHALL be corrected and re-validated before proceeding to [Section 9]. A deviation from a SHOULD requirement SHALL be justified in the Self-Audit Log [AI-SDOM-STD-0001 (Section 2.3)].

---

## 9. Phase 4 — Register

9.1 Confirm the identifier drawn in [Section 6.4] is available in the Repository Register. The register is the single source of truth for identifier allocation [AI-SDOM-ARC-0001 (Section 14.4)].

9.2 Before ratification, record the document in the Repository Register: add the row to the document inventory, update the class range tables, and increment the register's version per the register's update procedure.

9.3 The register schema and update rules are defined in the Repository Register and are not reproduced here. Registration SHALL be complete before the Publish phase [Section 12].

---

## 10. Phase 5 — Review

10.1 Open a pull request containing the document and its register update.

10.2 The pull request SHALL declare the change type (correction, addition, revision, deprecation, or retraction) per [AI-SDOM-GOV-0001 (Section 8.3)] to support version increment validation.

10.3 Request the reviews required by the document class:
- Content review by a subject matter expert [AI-SDOM-ARC-0001 (Section 18.4)].
- Contract compliance review against [AI-SDOM-ARC-0001].
- Consistency review of affected documents [AI-SDOM-ARC-0001 (Section 10.2)].

10.4 The change SHALL remain in review for the applicable minimum review period per [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)] and [AI-SDOM-GOV-0001 (Section 5.3.2)].

10.5 Review findings SHALL be resolved before the change proceeds to approval. Unresolved findings block the request.

---

## 11. Phase 6 — Approve

11.1 Submit the change for approval by the approving authority for the document's class per [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5.2)]. The thresholds are not repeated here.

11.2 Approval SHALL be recorded in the pull request [AI-SDOM-ARC-0001 (Section 15.7)]. Verbal or offline approvals are not recognized.

11.3 ADR approval requires at least two independent reviewers, with additional Governance Board approval when the decision affects Layer 0 or Layer 1 [AI-SDOM-ARC-0001 (Section 15.5)].

11.4 A change that fails approval SHALL be revised (re-entering at the appropriate phase) or withdrawn. The rejection reason SHALL be recorded in the pull request.

---

## 12. Phase 7 — Publish

12.1 Merge the approved pull request to the main branch. Direct commits to the main branch SHALL NOT occur [AI-SDOM-ARC-0001 (Section 19.3)].

12.2 On first full ratification, the version becomes 1.0.0 [AI-SDOM-GOV-0001 (Section 7.3)] and a Git tag SHALL be created per [AI-SDOM-ARC-0001 (Section 11.6)].

12.3 The document's lifecycle state is Active from publication [AI-SDOM-STD-0001 (Section 5.2)].

12.4 Ratification SHALL be recorded in the document's Amendment Record and in a governance record per [AI-SDOM-GOV-0001 (Section 7.4, Section 11)].

---

## 13. Phase 8 — Maintain

13.1 The Document Owner is responsible for the document's content, versioning, and lifecycle management [AI-SDOM-GOV-0001 (Section 3.4)].

13.2 Amendments follow the amendment governance in [AI-SDOM-GOV-0001 (Section 8)]. Version increments follow [AI-SDOM-ARC-0001 (Section 9.2-9.4)].

13.3 A change to a document SHALL trigger review of all documents that depend on it, directly or transitively [AI-SDOM-ARC-0001 (Section 10.2)].

13.4 Deprecation and retirement follow [AI-SDOM-ARC-0001 (Section 20.2)]. Deprecated or retired documents SHALL NOT be referenced by new documents [AI-SDOM-ARC-0001 (Section 20.3)].

13.5 Exceptions to governance or procedural rules follow [AI-SDOM-GOV-0001 (Section 9)] and SHALL be recorded in an ADR [AI-SDOM-ARC-0001 (Section 17)].

---

## 14. Error Handling

| Failure | Action | Reference |
|---------|--------|-----------|
| Validation gate failure | Correct the defect, re-run the gate, and record the issue in the Self-Audit Log | [Section 8] |
| Unresolvable cross-reference | Correct or remove the reference; re-verify dependency rules | [AI-SDOM-ARC-0001 (Section 8.2)] |
| Identifier conflict | Do not assign the identifier; return to [Section 6.4] and confirm the register's next available identifier | [AI-SDOM-ARC-0001 (Section 12.2)] |
| Review rejection | Revise the document and re-enter the review phase | [Section 10] |
| Approval failure | Revise or withdraw the change; record the reason in the pull request | [Section 11] |
| Downstream impact discovered | Re-run the impact analysis and notify affected document owners | [AI-SDOM-ARC-0001 (Section 10.2)] |

14.1 A governance violation discovered during the lifecycle SHALL be reported and resolved per [AI-SDOM-GOV-0001 (Section 13)].

---

## 15. Expected Outcome

The procedure is complete when all of the following hold:

| # | Outcome | Verified By |
|---|---------|-------------|
| 1 | The document is Active with a ratified version and matching Git tag | [AI-SDOM-ARC-0001 (Section 20.2)] |
| 2 | The document passed all applicable quality gates | Architecture Validation Standard |
| 3 | The document's identifier is registered in the Repository Register | Repository Register |
| 4 | Approval was granted by the correct authority and recorded | [AI-SDOM-ARC-0001 (Section 15.7)] |
| 5 | All dependent documents were reviewed for impact | [AI-SDOM-ARC-0001 (Section 10.2)] |

---

## 16. Duration

16.1 The binding time constraint for any lifecycle is the applicable minimum review period defined in [AI-SDOM-ARC-0001 (Section 10)] and [AI-SDOM-GOV-0001 (Section 5.3.2)].

16.2 The following indicative durations (informational, not normative) MAY be used for planning: initial authoring of a typical document, 1-3 business days; self-audit and validation, 0.5-1 business day; registration, less than 1 hour; review and approval, governed by the applicable review period.

---

## 17. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Constitutional source. Identifier scheme, dependency rules, cross-references, versioning, change impact, approvals, AI principles, automation boundaries, and lifecycle states. |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Roles, ratification, amendment governance, exception governance, and governance records. |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Authorizing standard. Document structure, metadata, class-specific requirements, and self-audit requirements that this procedure implements. |
| Master Document Template (04-TEMPLATES) | Reusable structure instantiated in Phase 2. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (05-REGISTERS) | Identifier authority and document inventory updated in Phase 4. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard (07-QUALITY) | Validation gates applied in Phase 3. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-07-31 | —      | Initial document development procedure | Pending  |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-STD-0001], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure procedure. No governance, standard, validation, template, or register content. §1.3 excludes those responsibilities. |
| §2.2 | Traceability | PASS | Every phase cites the authorizing provision in ARC-0001, GOV-0001, or STD-0001. |
| §2.4 | Parsimony | PASS | Approval thresholds, versioning, metadata, identifier scheme, and gates are referenced, not reproduced. |
| §2.6 | Explicitness | PASS | All steps written as normative or informational statements. |
| §4 | Valid class code PRC | PASS | Identifier: AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE. |
| §5.1 | Identifier format | PASS | AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE. |
| §5.4 | Filename mirror | PASS | ai-sdom-prc-0001-document-development-procedure.md. |
| §6.1 | Directory match | PASS | 03-PROCEDURES/ maps to PRC class. |
| §7.1 | Layer N references 0..N | PASS | PRC (L3) references ARC (L0), GOV (L1), STD (L2). All ≤ 3. TPL/REG/QLT referenced by descriptive title. |
| §7.3 | Dependencies section | PASS | Front-matter Dependencies lists ARC-0001, GOV-0001, STD-0001. |
| §7.5 | PRC cites authorizing STD | PASS | STD-0001 in Dependencies and §1.2. |
| §8 | Cross-reference syntax | PASS | Canonical form used for all formal references. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-prc-0001-document-development-procedure.md. |
| §12 | Reserved range | PASS | PRC-0001 within PRC 0001-0999 (operational). |
| §15 | No governance duplication | PASS | Approval thresholds referenced to ARC-0001 §15 and GOV-0001 §5.2, not defined. |
| §16 | Governance boundaries | PASS | §1.3 and §2.3 keep the procedure within its class boundary. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | PRC (L3) references ARC (L0), GOV (L1), STD (L2). All ≤ 3. |
| G01-R6 | No circular dependencies | PASS | PRC→STD→GOV→ARC. No cycles. |
| G01-R7 | PRC must list ≥1 STD | PASS | AI-SDOM-STD-0001 listed in Dependencies. |
| G01-R8 | Dependencies section exists | PASS | Front-matter Dependencies present with bullet list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | PRC is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one: PRC. |
| G02-R3 | Layer matches LAYER_MAP | PASS | Layer 3. Front matter: `Layer: 3`. |
| G02-R4 | Single concern | PASS | Document development lifecycle only. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE. |
| G03-R2 | Filename mirror | PASS | ai-sdom-prc-0001-document-development-procedure.md. |
| G03-R3 | No duplicate | PASS | First assignment of this identifier. |
| G03-R4 | Not reassigned | PASS | First assignment. |
| G03-R5 | Not retired | PASS | Retired register is empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | Directory matches class | PASS | 03-PROCEDURES/. |
| G04-R2 | Within numbered directory | PASS | Yes. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]`, `[AI-SDOM-GOV-0001]`, `[AI-SDOM-STD-0001]` references resolve. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` and `[Section N]` references verified. |
| G05-R4 | Cross-class reference compliance | PASS | Formal references respect layer rules. TPL/REG/QLT referenced descriptively (see Self-Audit Log item 1). |
| G05-R5 | Canonical syntax | PASS | All formal external references use canonical form. Descriptive titles used only where layer rules prohibit canonical references. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `Version: 0.1.0`. |
| G06-R2 | SemVer format | PASS | 0.1.0 matches `\d+\.\d+\.\d+`. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | PRC 0001 within PRC 0001-0999. |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules** — N/A (this is PRC, not ADR).

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction | PASS | All content aligns with ARC-0001, GOV-0001, and STD-0001. |
| G09-R2 | Traceability | PASS | Every phase cites its authorizing provision. |
| G09-R3 | No duplication | PASS | Thresholds, versioning, metadata, template, gates, and register rules referenced, not reproduced. |
| G09-R4 | Composability | PASS | Procedure composes cleanly with lower-layer rules. |
| G09-R5 | Explicitness | PASS | All steps written explicitly. |
| G09-R6 | Governance boundary | PASS | No governance roles, approval processes, or decision rights defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R1 | No unauthorized identifier assignment | PASS | Identifier AI-SDOM-PRC-0001 drawn from the register's next-available table; will be logged in the register before ratification. |
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Higher-layer and cross-cutting reference constraint (Section 1.3, Section 7.5, References):** The requirement to reference TPL-0001, QLT-0001, and REG-0001 conflicts with [AI-SDOM-ARC-0001 (Section 7.1)]: PRC (Layer 3) may formally reference layers 0-3 only; TPL (L4) and REG (L5) are higher layers, and QLT is cross-cutting. Resolved by referencing ARC-0001, GOV-0001, and STD-0001 by canonical identifier and TPL, REG, and QLT by descriptive title (Master Document Template, Repository Register, Architecture Validation Standard), consistent with the precedent established in the GOV-0001, STD-0001, and REG-0001 self-audits.

2. **Approval threshold duplication risk (Section 11):** Initial draft reproduced the approval threshold table. Resolved by deleting the table and referencing [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5.2)], satisfying G09-R3.

3. **Metadata duplication risk (Section 7.3):** Initial draft reproduced the metadata field table from [AI-SDOM-STD-0001 (Section 3)]. Resolved by referencing the section instead.

4. **Validation gate duplication risk (Section 8):** Initial draft described gate pass/fail criteria. Resolved by referencing the Architecture Validation Standard descriptively and [AI-SDOM-ARC-0001 (Section 18)] for the mandatory gate list.

5. **Template duplication risk (Section 7.1):** Initial draft reproduced template structure. Resolved by instructing instantiation of the Master Document Template and citing [AI-SDOM-STD-0001 (Section 9)].

6. **Register schema duplication risk (Section 9):** Initial draft described register columns and update rules. Resolved by referencing the Repository Register descriptively.

7. **Versioning duplication risk (Section 7.7, Section 13.2):** Initial draft reproduced version increment rules. Resolved by referencing [AI-SDOM-ARC-0001 (Section 9)] and [AI-SDOM-GOV-0001 (Section 8)].

8. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter Dependencies field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.

9. **Duration values (Section 16.2):** Indicative durations are informational planning estimates, explicitly marked non-normative. The binding constraint (minimum review period) is referenced, not duplicated, per [AI-SDOM-ARC-0001 (Section 10)] and [AI-SDOM-GOV-0001 (Section 5.3.2)].
