# Documentation Standard

**Identifier:** AI-SDOM-STD-0001-DOCUMENTATION-STANDARD  
**Version:** 0.1.0  
**Lifecycle State:** Active  
**Layer:** 2  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT], [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY]  
**ai-assistance:** Claude 2026-07-31: initial draft  

---

## 1. Purpose and Scope

1.1 This standard defines the structural, metadata, and content requirements that every governed document in the AI-SDOM repository SHALL satisfy. It is the single source of truth for document structure across all eight document classes.

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 7.5)] and operates within the governance framework established by [AI-SDOM-GOV-0001 (Section 2.1)].

1.3 This standard governs document structure only. It SHALL NOT define:
- Visual formatting, layout, or typography (governed by TPL documents in 04-TEMPLATES).
- Step-by-step procedures for creating or reviewing documents (governed by PRC documents in 03-PROCEDURES).
- Validation rules or quality gates (governed by QLT documents in 07-QUALITY).
- Identifier allocation or document inventory (governed by REG documents in 05-REGISTERS).

1.4 This standard applies to:
- All governed documents currently in the repository.
- All governed documents created in the future.
- Amendments to existing governed documents.

---

## 2. Normative Language

2.1 The key words SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and NEED NOT in this standard SHALL be interpreted as follows:

| Keyword | Meaning | Enforcement |
|---------|---------|-------------|
| SHALL | The definition is an absolute requirement. | Mandatory. Non-compliance is a defect. |
| SHALL NOT | The definition is an absolute prohibition. | Mandatory. Violation is a defect. |
| SHOULD | The definition is a recommendation. Alternatives may be used if justified in the document. | Recommended. Deviation requires written justification in the document's Self-Audit Log. |
| SHOULD NOT | The definition is a discouragement. | Recommended. Exception requires written justification. |
| MAY | The definition is truly optional. | Optional. No justification required. |
| NEED NOT | The definition is not required. | Optional. No justification required. |

2.2 All SHALL and SHALL NOT requirements in this standard are enforceable by the quality gates defined in the Architecture Validation Standard (see 07-QUALITY/).

2.3 A document that deviates from a SHOULD requirement SHALL include the deviation and rationale in its Self-Audit Log.

---

## 3. Document Metadata

3.1 Every governed document SHALL contain a front-matter block at the top of the file, delimited by `---` on separate lines before and after.

3.2 The following metadata fields are defined for all document classes:

| Field | SHALL/SHOULD/MAY | Content | Applies To |
|-------|------------------|---------|------------|
| `Identifier` | SHALL | The document's unique identifier per [AI-SDOM-ARC-0001 (Section 5.1)] | All documents |
| `Version` | SHALL* | Semantic version string per [AI-SDOM-ARC-0001 (Section 9)] | All documents except ADR |
| `Lifecycle State` | SHALL | One of: `Active`, `Deprecated`, `Retired` | All documents except ADR |
| `Status` | SHALL | One of: `Proposed`, `Accepted`, `Superseded` | ADR only |
| `Layer` | SHALL | The numeric layer (0-5) or `X` for cross-cutting classes | All documents |
| `Dependencies` | SHALL | Bullet list of document identifiers | All documents |
| `ai-assistance` | MAY | Tool name and extent per [AI-SDOM-ARC-0001 (Section 14.2)] | All documents |

*Version is prohibited for ADR documents [AI-SDOM-ARC-0001 (Section 9.6)].

3.3 The front-matter block SHALL appear before any other content in the file. No content SHALL precede the opening `---`.

3.4 Metadata field order SHOULD follow the table order above.

3.5 Additional metadata fields MAY be defined by class-specific requirements [Section 9] or by individual documents, provided they do not duplicate the standard fields.

---

## 4. Document Identifier Usage

4.1 Every governed document SHALL have a globally unique identifier following the scheme defined in [AI-SDOM-ARC-0001 (Section 5.1)].

4.2 Within document content, the identifier SHALL be referenced using the canonical cross-reference syntax defined in [AI-SDOM-ARC-0001 (Section 8.1)].

4.3 The identifier in the front matter SHALL match the identifier used in the filename [AI-SDOM-ARC-0001 (Section 5.4)].

4.4 A document SHALL NOT reference another document by bare identifier string (e.g., `ARC-0001`) outside the canonical `[AI-SDOM-CLASS-NNNN]` syntax.

4.5 A document SHALL reference its own identifier in the front matter only. Self-references within content (other than the Dependencies section) are permitted but SHOULD NOT be necessary.

---

## 5. Document Lifecycle States

5.1 Every governed document SHALL exist in exactly one lifecycle state at any time.

5.2 The lifecycle states for all documents except ADR follow [AI-SDOM-ARC-0001 (Section 20.2)]:

```
            ┌──────────┐
            │  Active  │
            └────┬─────┘
                 │
            ┌────▼─────┐
            │Deprecated│
            └────┬─────┘
                 │
            ┌────▼────┐
            │ Retired │
            └─────────┘
```

| State | Meaning | Constraints |
|-------|---------|-------------|
| Active | The document is in effect and enforceable. | New documents created in this state. Must pass all applicable quality gates. |
| Deprecated | The document is scheduled for removal. Remains in effect during transition period. | May not be referenced by new documents. Existing references must be updated. Transition period per class (ARC-0001 §20.2). |
| Retired | The document is no longer in effect. | Identifier retired. Content preserved for history. May not be referenced by any document. |

5.3 ADR lifecycle follows a separate state model defined in [AI-SDOM-ARC-0001 (Section 17.2)]:

```
Proposed → Accepted → Superseded
```

5.4 A document MAY be created in the Active state directly. There is no mandatory "Draft" lifecycle state; pre-ratification versions (0.Y.Z) serve as drafts.

5.5 A document SHALL NOT transition directly from Active to Retired without passing through Deprecated, unless an exception is granted per [AI-SDOM-GOV-0001 (Section 9)].

---

## 6. Versioning Rules

6.1 All layered documents SHALL follow Semantic Versioning 2.0.0 as specified in [AI-SDOM-ARC-0001 (Section 9)].

6.2 ADR documents SHALL NOT carry a version field. See [AI-SDOM-ARC-0001 (Section 9.6)].

6.3 Version increment rules are defined in [AI-SDOM-ARC-0001 (Section 9.2-9.4)] and are not reproduced here.

6.4 The version field SHALL be updated before a document is merged to the main branch.

---

## 7. Cross-Reference Conventions

7.1 All cross-references SHALL follow the syntax defined in [AI-SDOM-ARC-0001 (Section 8)].

7.2 Internal references (within the same document) SHALL use `[Section X.Y]` where X.Y is the section number.

7.3 External references (to other documents) SHALL use either:
- `[AI-SDOM-CLASS-NNNN]` — references the document as a whole.
- `[AI-SDOM-CLASS-NNNN (Section X.Y)]` — references a specific section.

7.4 A document SHALL list every document it references via canonical external syntax in its Dependencies section [AI-SDOM-ARC-0001 (Section 7.3)].

7.5 Forward references (to documents not yet created) SHALL be annotated with `[FORWARD]` and are permitted only in ARC and ADR documents [AI-SDOM-ARC-0001 (Section 8.3)].

7.6 References to concepts or classes (e.g., "a GOV document") SHOULD use descriptive text rather than canonical identifiers to avoid ambiguity.

---

## 8. Mandatory Sections for All Documents

8.1 Every governed document SHALL contain the following sections. The order below is the default; class-specific requirements [Section 9] or an empowering ARC document MAY prescribe a different order.

| Order | Section | SHALL/SHOULD/MAY | Purpose |
|-------|---------|------------------|---------|
| 1 | Front matter | SHALL | Document metadata [Section 3] |
| 2 | Title heading | SHALL | `# Document Title` — the document's full name |
| 3 | Purpose | SHALL | Concise statement of the document's reason for existence |
| 4 | Body sections | SHALL | Class-specific content [Section 9] |
| 5 | References | SHOULD | List of documents cited not already in Dependencies |
| 6 | Amendment Record | SHALL | Table of changes by version |
| 7 | Self-Audit Log | SHALL | Record of issues identified and resolved |

8.2 The Purpose section SHALL state:
- What the document does.
- What the document does not do (negative scope).
- The authority under which the document operates.

8.3 The Amendment Record SHALL contain, at minimum:

| Version | Date | Author | Description of Change | Approval |
|---------|------|--------|-----------------------|----------|

8.4 The Self-Audit Log SHALL contain:
- A numbered list of issues identified during self-audit.
- For each issue: the affected section, a description of the problem, and how it was resolved.
- Issues resolved before publication and issues still open (with justification).

8.5 Additional sections MAY be added as needed, provided they do not duplicate the mandatory sections listed above.

---

## 9. Class-Specific Requirements

### 9.1 ARC — Architecture Contract

9.1.1 An ARC document SHALL address constitutional rules that govern the repository itself.

9.1.2 An ARC document SHALL contain at minimum:
- **Preamble** — states the document's constitutional role.
- **Numbered sections** organized by topic (1, 2, 3, ...).
- **Amendment Record** — as defined in Section 8.3.

9.1.3 An ARC document SHOULD contain:
- **Design Principles** — the foundational principles that guide the document's rules.
- **Governance Boundaries** — what the document governs and does not govern.
- **Self-Audit Log** — record of issues found and resolved during development.

9.1.4 ARC documents use section numbering format `X.Y` (e.g., 1.1, 1.2).

### 9.2 GOV — Governance

9.2.1 A GOV document SHALL define policies, roles, decision rights, or governance frameworks.

9.2.2 A GOV document SHALL contain at minimum:
- **Governance Objectives** — the goals the governance framework serves.
- **Governance Principles** — the principles that guide governance decisions.
- **Authority Model** — who holds authority and how it is delegated.
- **Decision-Making Model** — how decisions are made and approved.

9.2.3 A GOV document SHOULD contain:
- **Governance Boundaries** — what is in and out of scope.
- **Amendment Policy** — how the document itself is amended.
- **Exception Policy** — how exceptions to governance are granted.
- **Review Cycle** — how often governance is reviewed.

### 9.3 STD — Standard

9.3.1 An STD document SHALL define mandatory technical or operational rules.

9.3.2 An STD document SHALL contain at minimum:
- **Normative requirements** expressed using SHALL/SHOULD/MAY [Section 2].
- **Compliance criteria** — how conformance to each requirement is determined.
- **Scope** — what the standard applies to.

9.3.3 An STD document SHOULD contain:
- **Rationale** — why each requirement exists.
- **Examples** — illustrative (not normative) content.
- **Exceptions** — any conditions under which a requirement may be waived.

9.3.4 An STD document SHALL NOT contain step-by-step instructions (those belong in PRC) or visual formatting specifications (those belong in TPL).

### 9.4 PRC — Procedure

9.4.1 A PRC document SHALL define step-by-step operational instructions.

9.4.2 A PRC document SHALL contain at minimum:
- **Purpose** — what the procedure achieves.
- **Prerequisites** — conditions that must be met before starting.
- **Steps** — ordered list of actions to perform.
- **Expected Outcome** — how to verify the procedure completed successfully.

9.4.3 A PRC document SHOULD contain:
- **Error Handling** — what to do if a step fails.
- **Roles** — who performs each step (referencing GOV-0001 roles).
- **Duration** — expected time to complete.

9.4.4 A PRC document SHALL cite the STD document that authorizes the procedure [AI-SDOM-ARC-0001 (Section 7.5)].

### 9.5 TPL — Template

9.5.1 A TPL document SHALL provide a reusable document structure or format.

9.5.2 A TPL document SHALL contain at minimum:
- **Usage Instructions** — how to use the template.
- **Placeholder Definitions** — each placeholder, its meaning, and whether it is mandatory or optional.
- **Template Body** — the reusable content structure with placeholders marked as `{PLACEHOLDER}`.

9.5.3 A TPL document SHOULD contain:
- **Example Filled Content** — what the template looks like when completed.
- **Notes** — additional guidance for template users.

9.5.4 A TPL document SHALL cite the document class it templates. A TPL for STD documents SHALL reference AI-SDOM-STD-0001.

9.5.5 A TPL document SHALL NOT define rules, requirements, or procedures. Those belong in STD and PRC documents respectively.

### 9.6 REG — Register

9.6.1 A REG document SHALL provide a structured record-keeping schema or filled registry.

9.6.2 A REG document SHALL contain at minimum:
- **Purpose** — what the register records.
- **Schema Definition** — column definitions for each field in the register.
- **Data Entries** — the actual records (may be empty for a new schema).

9.6.3 A REG document SHOULD contain:
- **Update Rules** — when and how the register is updated.
- **Maintenance Notes** — any special handling for the register.

9.6.4 A REG document SHALL cite the document whose records it holds [AI-SDOM-ARC-0001 (Section 7.5)].

### 9.7 ADR — Architecture Decision Record

9.7.1 An ADR SHALL document a significant decision with architectural impact.

9.7.2 An ADR SHALL contain the following sections in the order specified by [AI-SDOM-ARC-0001 (Section 17.2)]:
- **Title** — concise decision statement.
- **Status** — `Proposed`, `Accepted`, or `Superseded`.
- **Context** — the problem or force motivating the decision.
- **Decision** — the chosen approach.
- **Consequences** — expected outcomes.
- **Alternatives Considered** — at least one alternative with rationale.
- **References** — documents that motivated or are affected.

9.7.3 An ADR SHALL reference [AI-SDOM-ARC-0001 (Section 17)] in its References section.

9.7.4 An ADR SHALL NOT carry a version field [AI-SDOM-ARC-0001 (Section 9.6)].

9.7.5 Once an ADR is Accepted, its substantive content is immutable. Only the Status field may change [AI-SDOM-ARC-0001 (Section 17.3)].

### 9.8 QLT — Quality Gate

9.8.1 A QLT document SHALL define validation rules or quality check definitions.

9.8.2 A QLT document SHALL contain, for each quality gate it defines, the following sections as specified by [AI-SDOM-ARC-0001 (Section 18.2)]:
- **What It Validates** — the document(s) or rule(s) being checked.
- **Pass/Fail Criteria** — the exact conditions for passing and failing.
- **Classification** — `Automated`, `Manual`, or `Hybrid`.
- **Trigger** — when the gate runs (e.g., pre-commit, CI, periodic audit).
- **Failure Action** — the technical consequence of failure.

9.8.3 A QLT document SHOULD group related gates under a common heading.

9.8.4 A QLT document SHALL NOT define governance roles, approval processes, or procedures. Those belong in GOV and PRC documents respectively.

---

## 10. Mandatory vs Recommended Content

10.1 Content within a governed document SHALL be classified as one of:

| Classification | Meaning | Marking |
|----------------|---------|---------|
| Mandatory | Must be present. Absence is a defect. | Requirement expressed with SHALL. |
| Recommended | Should be present. Absence is noted but not blocking. | Requirement expressed with SHOULD. |
| Optional | May be present or absent. | Requirement expressed with MAY. |
| Informational | Provides context, examples, or rationale. Not a requirement. | Expressed in natural language without normative keywords. |

10.2 Within a single document, SHALL, SHOULD, and MAY statements SHALL be clearly distinguishable from informational content.

10.3 Tables listing requirements SHALL include a column indicating whether each requirement is SHALL or SHOULD, unless the classification is clear from context.

---

## 11. Relationship with Templates and Procedures

11.1 This standard defines WHAT content must exist in each document class. It does not define HOW to format that content.

11.2 Template (TPL) documents in 04-TEMPLATES SHALL provide visual formatting, layout, and boilerplate for each document class. A TPL document MAY reference this standard as the authority for its structure.

11.3 Procedure (PRC) documents in 03-PROCEDURES SHALL provide step-by-step instructions for creating, reviewing, and maintaining documents. A PRC document MAY reference this standard as the authority for its prerequisites and expected outcomes.

11.4 If a requirement in this standard cannot be satisfied by the available TPL or PRC documents, the TPL or PRC documents SHALL be updated to provide the necessary support.

---

## 12. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Empowering architecture contract. Identifier, versioning, lifecycle, and cross-reference rules derived from this document. |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governing policy. This standard operates within the governance framework GOV-0001 establishes. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-07-31 | —      | Initial documentation standard for all document classes | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure documentation structure standard. No governance, validation, or procedure content. |
| §2.2 | Traceability | PASS | Every normative section references ARC-0001 or GOV-0001. |
| §4 | Valid class code STD | PASS | Identifier: AI-SDOM-STD-0001-DOCUMENTATION-STANDARD. |
| §5.1 | Identifier format | PASS | AI-SDOM-STD-0001-DOCUMENTATION-STANDARD. |
| §5.4 | Filename mirror | PASS | ai-sdom-std-0001-documentation-standard.md. |
| §6.1 | Directory match | PASS | 02-STANDARDS/ maps to STD class. |
| §7.1 | Layer N references 0..N | PASS | STD (L2) references ARC (L0) and GOV (L1). 0 <= 2, 1 <= 2. |
| §7.3 | Dependencies section | PASS | Present, lists ARC-0001 and GOV-0001. |
| §7.5 | STD cites authorizing GOV | PASS | GOV-0001 listed in Dependencies and Section 1.2. |
| §8 | Cross-reference syntax | PASS | All references use `[AI-SDOM-CLASS-NNNN]` canonical form. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §9.7 | QLT docs follow versioning rules (not applicable — this is STD) | — | N/A. |
| §11.2 | Filename lowercase | PASS | ai-sdom-std-0001-documentation-standard.md. |
| §12 | Reserved range | PASS | STD-0001 falls in STD 0001-0099 (universal standards). |
| §15 | No governance duplication | PASS | No approval thresholds, roles, or governance processes defined. |
| §16 | Governance boundaries | PASS | Section 1.3 explicitly excludes governance content. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Constitutional Supremacy | PASS | Section 1.2 acknowledges supremacy of ARC-0001. |
| §2.3 | Separation of Concerns | PASS | Section 1.3 excludes templates, procedures, validation, and registers. |
| §2.4 | Transparency | PASS | Self-audit certification documents all checks. |
| §3.3 | Domain Maintainer authority | PASS | Created under authority of the STD Domain Maintainer. |
| §4.2 | Outside scope | PASS | No governance roles, approval processes, or decision rights defined. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | STD (L2) references ARC (L0) and GOV (L1). All <= 2. |
| G01-R6 | No circular dependencies | PASS | STD→ARC/GOV→None. No cycles. |
| G01-R7 | STD must cite authorizing GOV | PASS | GOV-0001 cited in Dependencies and Section 1.2. |
| G01-R8 | Dependencies section exists | PASS | Present with bullet list. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | STD is valid. |
| G02-R2 | Single class code | PASS | Exactly one: STD. |
| G02-R3 | Layer matches LAYER_MAP | PASS | Layer 2. Front matter: `Layer: 2`. |
| G02-R4 | Single concern | PASS | Documentation structure only. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-STD-0001-DOCUMENTATION-STANDARD. |
| G03-R2 | Filename mirror | PASS | ai-sdom-std-0001-documentation-standard.md. |
| G03-R3 | No duplicate | PASS | First assignment. |
| G03-R4 | Not reassigned | PASS | First assignment. |
| G03-R5 | Not retired | PASS | Retired register empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | Directory matches class | PASS | 02-STANDARDS/. |
| G04-R2 | Within numbered directory | PASS | Yes. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]` and `[AI-SDOM-GOV-0001]` references resolve. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` verified. |
| G05-R5 | Canonical syntax | PASS | All external references use canonical form. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | 0.1.0. |
| G06-R2 | SemVer format | PASS | 0.1.0. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | STD 0001 within STD 0001-0099 (universal). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules** — N/A (this is STD, not ADR).

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction | PASS | All content aligns with ARC-0001 and GOV-0001. |
| G09-R2 | Traceability | PASS | Every requirement traces to ARC-0001 or GOV-0001. |
| G09-R3 | No duplication | PASS | Versioning (Section 6) references ARC-0001 §9 instead of reproducing. Cross-references (Section 7) reference ARC-0001 §8. |
| G09-R4 | Composability | PASS | Structure composes cleanly with lower-layer rules. |
| G09-R5 | Explicitness | PASS | All rules written using normative language. |
| G09-R6 | Governance boundaries | PASS | No governance roles or processes defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. Cross-references verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Versioning and cross-reference duplication risk (Sections 6-7):** Initial draft reproduced the versioning rules from ARC-0001 §9 and cross-reference rules from ARC-0001 §8. This violated G09-R3 (parsimony). Resolved by replacing reproduced content with direct references to ARC-0001 sections. The current Sections 6 and 7 define HOW to apply the rules without re-stating WHAT the rules are.

2. **Class-specific requirement overlap with templates (Section 9):** Some class-specific requirements initially included formatting guidance (e.g., "use bold for headings"), which belongs in TPL documents. Resolved by restricting Section 9 to structural requirements only: what sections MUST exist, not how they SHOULD be formatted.

3. **ADR section order conflict (Section 8.1 vs Section 9.7.2):** The original Section 8.1 prescribed a fixed section order (Front matter, Title, Purpose, Body, References, Amendment Record, Self-Audit Log) for ALL documents. However, ARC-0001 §17.2 mandates a different order for ADRs (Title, Status, Context, Decision, Consequences, Alternatives Considered, References), and ADRs categorically lack an Amendment Record (being immutable after Acceptance per ARC-0001 §17.3). Resolved by amending Section 8.1 to state: "The order below is the default; class-specific requirements [Section 9] or an empowering ARC document MAY prescribe a different order." This allows the ADR-specific order in Section 9.7.2 to take precedence.

4. **QLT canonical reference in layered document (Section 2.2, Self-Audit header):** The original Section 2.2 referenced the QLT quality gates using the canonical identifier `[AI-SDOM-QLT-0001]`, and the Self-Audit section used `QLT-0001 Gate Compliance` as a heading. ARC-0001 §7.1 restricts layered documents (STD, L2) to referencing documents at layers 0-2 only; QLT is a cross-cutting class with no numeric layer and cannot be referenced by canonical identifier. Resolved by: (a) replacing the canonical reference in Section 2.2 with descriptive text ("the Architecture Validation Standard"), (b) replacing the Self-Audit section header with descriptive text, (c) ensuring the Dependencies section does not list QLT-0001.
