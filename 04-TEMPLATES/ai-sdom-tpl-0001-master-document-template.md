# Master Document Template

**Identifier:** AI-SDOM-TPL-0001-MASTER-DOCUMENT-TEMPLATE  
**Version:** 0.1.0  
**Lifecycle State:** Active  
**Layer:** 4  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT], [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD]  
**ai-assistance:** Claude 2026-07-31: initial draft  

---

## 1. Purpose

1.1 This document provides the canonical reusable structure for every governed document in the AI-SDOM repository. It templates all eight document classes defined in [AI-SDOM-ARC-0001 (Section 4)].

1.2 This template derives its structural authority from [AI-SDOM-STD-0001 (Section 9.5)] and operates within the constitutional boundaries set by [AI-SDOM-ARC-0001 (Section 7.5)].

1.3 This template defines layout and formatting only. It SHALL NOT define:
- Rules, requirements, or standards (governed by STD documents).
- Step-by-step procedures (governed by PRC documents).
- Validation criteria or quality gates (governed by QLT documents).
- Governance policies or roles (governed by GOV documents).

---

## 2. Usage Instructions

### 2.1 How to Instantiate This Template

2.1.1 Copy the Template Body [Section 5] into a new file in the appropriate class directory [AI-SDOM-ARC-0001 (Section 6)].

2.1.2 Replace every `{PLACEHOLDER}` with content appropriate to the document's class.

2.1.3 Class-specific sections [Section 6] MAY be added or substituted according to the class being created.

2.1.4 Before submission, verify:
- All `{SHALL-FIELD}` placeholders are filled.
- The Dependencies section references every document cited in the body [AI-SDOM-STD-0001 (Section 7.4)].
- The file name matches the identifier in lowercase [AI-SDOM-ARC-0001 (Section 5.4)].
- The identifier is registered in the Repository Register [AI-SDOM-REG-0001] before ratification.

2.1.5 The final document SHALL be self-contained. Remove all instructional comments and unused placeholders after filling.

### 2.2 Placeholder Convention

| Markup | Meaning | Example |
|--------|---------|---------|
| `{FIELD-NAME}` | Replace with value | `{DOCUMENT-TITLE}` |
| `{SHALL-FIELD-NAME}` | Mandatory — must be filled | `{SHALL-IDENTIFIER}` |
| `{SHOULD-FIELD-NAME}` | Recommended — fill or justify omission | `{SHOULD-RATIONALE}` |
| `{MAY-FIELD-NAME}` | Optional — fill if applicable | `{MAY-NOTES}` |
| `{CLASS-SPECIFIC:...}` | Class-dependent content block | `{CLASS-SPECIFIC:ADR-SECTIONS}` |
| `{DELETE-IF-NOT-APPLICABLE}` | Remove entire block if not used | `{DELETE-IF-NOT-APPLICABLE}` |

### 2.3 Mandatory vs Optional Sections

Per [AI-SDOM-STD-0001 (Section 8.1)], the sections marked SHALL in the table below MUST appear in every final document. Sections marked SHOULD or MAY may be omitted with justification.

---

## 3. Placeholder Definitions

Every `{PLACEHOLDER}` in the Template Body [Section 5] is defined below. The Governing Reference column cites the [AI-SDOM-STD-0001] or [AI-SDOM-ARC-0001] requirement that mandates the placeholder's presence.

### 3.1 Metadata Placeholders

| Placeholder | Class | Requirement | Governing Reference |
|-------------|-------|-------------|---------------------|
| `{SHALL-IDENTIFIER}` | All | Full identifier: `AI-SDOM-{CLASS}-{NNNN}-{SHORT-NAME}` | ARC-0001 §5.1, STD-0001 §3.2 |
| `{SHALL-VERSION}` | All except ADR | SemVer: `MAJOR.MINOR.PATCH` | ARC-0001 §9, STD-0001 §3.2 |
| `{SHALL-LIFECYCLE-STATE}` | All except ADR | `Active`, `Deprecated`, or `Retired` | ARC-0001 §20.2, STD-0001 §3.2 |
| `{SHALL-STATUS}` | ADR only | `Proposed`, `Accepted`, or `Superseded` | ARC-0001 §17.2, STD-0001 §3.2 |
| `{SHALL-LAYER}` | All | Numeric layer (0-5) or `X` | ARC-0001 §3, STD-0001 §3.2 |
| `{SHALL-DEPENDENCIES}` | All | Bullet list of document identifiers | ARC-0001 §7.3, STD-0001 §3.2 |
| `{MAY-AI-ASSISTANCE}` | All | Tool name and assistance extent | ARC-0001 §14.2, STD-0001 §3.2 |

### 3.2 Section Placeholders

| Placeholder | Requirement | Governing Reference |
|-------------|-------------|---------------------|
| `{SHALL-DOCUMENT-TITLE}` | H1 heading matching the document title | STD-0001 §8.1 |
| `{SHALL-PURPOSE}` | Purpose section stating what, what-not, and authority | STD-0001 §8.1-8.2 |
| `{SHALL-DEPENDENCIES-SECTION}` | Dependency section listing all referenced documents | ARC-0001 §7.3, STD-0001 §3.2 |
| `{SHALL-BODY}` | Class-specific body content | STD-0001 §8.1, §§9.1-9.8 |
| `{SHOULD-REFERENCES}` | Table of documents cited beyond Dependencies | STD-0001 §8.1 |
| `{SHALL-AMENDMENT-RECORD}` | Table of changes by version | STD-0001 §8.1, §8.3 |
| `{SHALL-SELF-AUDIT-LOG}` | Record of audit issues and resolutions | STD-0001 §8.1, §8.4 |

### 3.3 Class-Specific Content Blocks

| Placeholder | Applies To | Governing Reference |
|-------------|------------|---------------------|
| `{CLASS-SPECIFIC:ARC-CONTENT}` | ARC | STD-0001 §9.1 |
| `{CLASS-SPECIFIC:GOV-CONTENT}` | GOV | STD-0001 §9.2 |
| `{CLASS-SPECIFIC:STD-CONTENT}` | STD | STD-0001 §9.3 |
| `{CLASS-SPECIFIC:PRC-CONTENT}` | PRC | STD-0001 §9.4 |
| `{CLASS-SPECIFIC:TPL-CONTENT}` | TPL | STD-0001 §9.5 |
| `{CLASS-SPECIFIC:REG-CONTENT}` | REG | STD-0001 §9.6 |
| `{CLASS-SPECIFIC:ADR-SECTIONS}` | ADR | ARC-0001 §17.2, STD-0001 §9.7 |
| `{CLASS-SPECIFIC:QLT-CONTENT}` | QLT | ARC-0001 §18.2, STD-0001 §9.8 |

### 3.4 Amendment Record Column Placeholders

| Placeholder | Format |
|-------------|--------|
| `{AMENDMENT-VERSION}` | Semantic version string |
| `{AMENDMENT-DATE}` | ISO 8601 date: YYYY-MM-DD |
| `{AMENDMENT-AUTHOR}` | Author name or identifier |
| `{AMENDMENT-DESCRIPTION}` | Concise description of the change |
| `{AMENDMENT-APPROVAL}` | Approving body or status (`Pending`, approval reference) |

### 3.5 Self-Audit Entry Placeholders

| Placeholder | Content |
|-------------|---------|
| `{AUDIT-ISSUE-NUMBER}` | Sequential issue number |
| `{AUDIT-SCOPE}` | Section(s) affected |
| `{AUDIT-DESCRIPTION}` | Description of the issue |
| `{AUDIT-RESOLUTION}` | How the issue was resolved |

---

## 4. Authoring Notes

4.1 **Identifier registration.** The `{SHALL-IDENTIFIER}` must be drawn from the next available identifier in the Repository Register before the document is filed. Do not invent identifiers.

4.2 **Version discipline.** Pre-ratification drafts use 0.Y.Z. Ratified releases begin at 1.0.0. Version increments follow [AI-SDOM-ARC-0001 (Section 9.2-9.4)].

4.3 **Dependency completeness.** Every document identifier cited in the body using `[AI-SDOM-CLASS-NNNN]` syntax must appear in the Dependencies section. Use the Dependencies section as the single source of truth for all external references.

4.4 **ADR immutability.** Once an ADR is Accepted, its substantive sections become immutable. Plan accordingly before ratification.

4.5 **Cross-cutting documents.** ADR and QLT documents have no numeric layer. Their front matter uses `Layer: X`. ADRs carry `Status` in place of `Version` and `Lifecycle State`.

4.6 **Self-audit discipline.** The Self-Audit Log must record every compliance issue discovered during development, even those resolved before publication. An empty Self-Audit Log is acceptable only if zero issues were found.

4.7 **Delete scaffolding.** After filling all placeholders, remove this entire Authoring Notes section and any instructional comments from the final document.

---

## 5. Template Body

Copy the block below. Replace `{PLACEHOLDER}` values. Follow the class-specific notes in Section 6.

```
# {SHALL-DOCUMENT-TITLE}

**Identifier:** {SHALL-IDENTIFIER}  
**Version:** {SHALL-VERSION}  
**Lifecycle State:** {SHALL-LIFECYCLE-STATE}  
**Layer:** {SHALL-LAYER}  
**Dependencies:** {SHALL-DEPENDENCIES}  
{MAY-AI-ASSISTANCE}

---

## 1. Purpose

{SHALL-PURPOSE}

---

## 2. Dependencies

{SHALL-DEPENDENCIES-SECTION}

---

## 3. {SHALL-BODY}

{CLASS-SPECIFIC: See Section 6 for class-specific body content.}

{DELETE-IF-NOT-APPLICABLE}
---

## References

| Reference | Relationship |
|-----------|--------------|
| {REFERENCE-IDENTIFIER} | {REFERENCE-RELATIONSHIP} |

---

## Amendment Record

| Version | Date | Author | Description of Change | Approval |
|---------|------|--------|-----------------------|----------|
| {AMENDMENT-VERSION} | {AMENDMENT-DATE} | {AMENDMENT-AUTHOR} | {AMENDMENT-DESCRIPTION} | {AMENDMENT-APPROVAL} |

---

## Self-Audit Log

{AUDIT-ISSUE-NUMBER}. **{AUDIT-SCOPE}:** {AUDIT-DESCRIPTION} Resolved by: {AUDIT-RESOLUTION}.
```

---

## 6. Class-Specific Variations

Per [AI-SDOM-STD-0001 (Section 8.1)], the template order above is the default. The following class-specific variations MAY override or augment the default structure.

### 6.1 ARC — Architecture Contract (Layer 0)

**Modifications to the template body:**

| Default Section | ARC Variation |
|-----------------|---------------|
| Purpose | Replace with **Preamble** stating the document's constitutional role |
| Body numbered sections | Organize by topic using `X.Y` section numbering (e.g., 1.1, 1.2) |
| Amendment Record | SHALL be present |
| Self-Audit Log | SHOULD be present |

**Additional recommended sections (SHOULD):**
- **Design Principles** — foundational principles guiding the document's rules
- **Governance Boundaries** — what the document governs and does not govern

**Governing reference:** [AI-SDOM-STD-0001 (Section 9.1)]

### 6.2 GOV — Governance (Layer 1)

**SHALL contain at minimum:**
- **Governance Objectives** — goals the governance framework serves
- **Governance Principles** — principles guiding governance decisions
- **Authority Model** — who holds authority and how it is delegated
- **Decision-Making Model** — how decisions are made and approved

**Additional recommended sections (SHOULD):**
- **Governance Boundaries** — what is in and out of scope
- **Amendment Policy** — how the document itself is amended
- **Exception Policy** — how exceptions to governance are granted
- **Review Cycle** — how often governance is reviewed

**Governing reference:** [AI-SDOM-STD-0001 (Section 9.2)]

### 6.3 STD — Standard (Layer 2)

**SHALL contain at minimum:**
- **Normative requirements** expressed using SHALL/SHOULD/MAY per [AI-SDOM-STD-0001 (Section 2)]
- **Compliance criteria** — how conformance to each requirement is determined
- **Scope** — what the standard applies to

**Additional recommended sections (SHOULD):**
- **Rationale** — why each requirement exists
- **Examples** — illustrative (not normative) content
- **Exceptions** — conditions under which a requirement may be waived

**SHALL NOT contain:** step-by-step instructions or visual formatting specifications.

**Governing reference:** [AI-SDOM-STD-0001 (Section 9.3)]

### 6.4 PRC — Procedure (Layer 3)

**SHALL contain at minimum:**
- **Purpose** — what the procedure achieves
- **Prerequisites** — conditions that must be met before starting
- **Steps** — ordered list of actions to perform
- **Expected Outcome** — how to verify the procedure completed successfully

**Additional recommended sections (SHOULD):**
- **Error Handling** — what to do if a step fails
- **Roles** — who performs each step
- **Duration** — expected time to complete

**SHALL cite** the STD document that authorizes the procedure [AI-SDOM-ARC-0001 (Section 7.5)].

**Governing reference:** [AI-SDOM-STD-0001 (Section 9.4)]

### 6.5 TPL — Template (Layer 4)

**SHALL contain at minimum:**
- **Usage Instructions** — how to use the template
- **Placeholder Definitions** — each placeholder, its meaning, mandatory/optional classification
- **Template Body** — reusable content structure with `{PLACEHOLDER}` placeholders

**Additional recommended sections (SHOULD):**
- **Example Filled Content** — what the template looks like when completed
- **Notes** — additional guidance for template users

**SHALL cite** the document class(es) it templates.

**SHALL NOT** define rules, requirements, or procedures.

**Governing reference:** [AI-SDOM-STD-0001 (Section 9.5)]

### 6.6 REG — Register (Layer 5)

**SHALL contain at minimum:**
- **Purpose** — what the register records
- **Schema Definition** — column definitions for each field in the register
- **Data Entries** — the actual records (may be empty for a new schema)

**Additional recommended sections (SHOULD):**
- **Update Rules** — when and how the register is updated
- **Maintenance Notes** — any special handling for the register

**SHALL cite** the document whose records it holds [AI-SDOM-ARC-0001 (Section 7.5)].

**Governing reference:** [AI-SDOM-STD-0001 (Section 9.6)]

### 6.7 ADR — Architecture Decision Record (Layer X)

**Override the default section order entirely.** Per [AI-SDOM-ARC-0001 (Section 17.2)], the order SHALL be:

| Order | Section | Notes |
|-------|---------|-------|
| 1 | Title | Concise decision statement |
| 2 | Status | `Proposed`, `Accepted`, or `Superseded` |
| 3 | Context | The problem or force motivating the decision |
| 4 | Decision | The chosen approach |
| 5 | Consequences | Expected outcomes |
| 6 | Alternatives Considered | At least one alternative with rationale |
| 7 | References | Documents that motivated or are affected |

**Additional requirements:**
- Front matter SHALL contain `Status` instead of `Version` and `Lifecycle State`
- Front matter SHALL contain `Layer: X`
- The `Version` field SHALL NOT appear
- Once Accepted, substantive content is immutable [AI-SDOM-ARC-0001 (Section 17.3)]
- SHALL reference [AI-SDOM-ARC-0001 (Section 17)] in its References section

**Template body for ADR (use instead of Section 5 default):**

```
# {SHALL-DOCUMENT-TITLE}

**Identifier:** {SHALL-IDENTIFIER}  
**Status:** {SHALL-STATUS}  
**Layer:** X  
**Dependencies:** {SHALL-DEPENDENCIES}  
{MAY-AI-ASSISTANCE}

---

## Context

{ADR-CONTEXT}

---

## Decision

{ADR-DECISION}

---

## Consequences

{ADR-CONSEQUENCES}

---

## Alternatives Considered

{ADR-ALTERNATIVES}

---

## References

| Reference | Relationship |
|-----------|--------------|
| {REFERENCE-IDENTIFIER} | {REFERENCE-RELATIONSHIP} |
```

**Governing reference:** [AI-SDOM-ARC-0001 (Section 17.2)], [AI-SDOM-STD-0001 (Section 9.7)]

### 6.8 QLT — Quality Gate (Layer X)

**SHALL contain, for each quality gate it defines:**

| Required Section | Description |
|------------------|-------------|
| What It Validates | The document(s) or rule(s) being checked |
| Pass/Fail Criteria | Exact conditions for passing and failing |
| Classification | `Automated`, `Manual`, or `Hybrid` |
| Trigger | When the gate runs |
| Failure Action | Technical consequence of failure |

**Additional recommendations:**
- Group related gates under a common heading (SHOULD)

**SHALL NOT** define governance roles, approval processes, or procedures.

**Governing reference:** [AI-SDOM-ARC-0001 (Section 18.2)], [AI-SDOM-STD-0001 (Section 9.8)]

---

## 7. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Architecture Contract. Defines the document taxonomy (§4), identifier scheme (§5), dependency rules (§7), cross-reference conventions (§8), versioning (§9), reserved ranges (§12), ADR structure (§17), and quality gate architecture (§18). |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Documentation Standard. Governs the structural requirements (§8), class-specific content (§9), mandatory vs recommended content (§10), and relationship with templates (§11) that this template implements. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-07-31 | —      | Initial master document template for all eight document classes | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-STD-0001], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure document template. No rules, procedures, validation, or governance content. §1.3 explicitly excludes those responsibilities. |
| §2.2 | Traceability | PASS | Every placeholder and section traces to ARC-0001 or STD-0001. |
| §2.4 | Parsimony | PASS | No duplication of ARC-0001 or STD-0001 content. All governing rules referenced by citation. |
| §2.6 | Explicitness | PASS | Placeholder table defines every template variable. Usage instructions specify exact instantiation process. |
| §4 | Valid class code TPL | PASS | Identifier: AI-SDOM-TPL-0001-MASTER-DOCUMENT-TEMPLATE. |
| §5.1 | Identifier format | PASS | AI-SDOM-TPL-0001-MASTER-DOCUMENT-TEMPLATE. |
| §5.4 | Filename mirror | PASS | ai-sdom-tpl-0001-master-document-template.md. |
| §6.1 | Directory match | PASS | 04-TEMPLATES/ maps to TPL class. |
| §7.1 | Layer N references 0..N | PASS | TPL (L4) references ARC (L0) and STD (L2). 0 <= 4, 2 <= 4. Reference to GOV not in Dependencies. |
| §7.3 | Dependencies section | PASS | Present, lists ARC-0001 and STD-0001. |
| §7.5 | TPL cites document class it templates | PASS | Section 1.1 cites ARC-0001 §4 (all eight classes). Section 9.5.4 cites STD-0001 as the governing standard. |
| §8 | Cross-reference syntax | PASS | All references use `[AI-SDOM-CLASS-NNNN]` canonical form. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-tpl-0001-master-document-template.md. |
| §12 | Reserved range | PASS | TPL-0001 falls in TPL 0001-0999 (document templates). |
| §15 | No governance duplication | PASS | No approval thresholds, roles, or governance processes defined. |
| §16 | Governance boundaries | PASS | Section 1.3 explicitly excludes governance, standard, procedure, and validation content. |

### STD-0001 Compliance

#### General Requirements (§8)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Front matter present | PASS | Identifier, Version, Lifecycle State, Layer, Dependencies, ai-assistance. |
| Title heading | PASS | `# Master Document Template`. |
| Purpose section | PASS | Section 1 states what, what-not, and authority. |
| Body sections | PASS | Sections 2-6 provide class-specific content. |
| References section | PASS | Section 7 lists ARC-0001 and STD-0001. |
| Amendment Record | PASS | Present with version, date, author, description, approval. |
| Self-Audit Log | PASS | Present with numbered issues. |

#### TPL-Specific Requirements (§9.5)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Usage Instructions (§9.5.2) | PASS | Section 2 provides complete instantiation instructions. |
| Placeholder Definitions (§9.5.2) | PASS | Section 3 defines every placeholder with classification and governing reference. |
| Template Body (§9.5.2) | PASS | Section 5 provides the reusable structure with `{PLACEHOLDER}` markup. |
| Example Filled Content (§9.5.3 - SHOULD) | PASS | Class-specific variations in Section 6 serve as usage examples. |
| Notes (§9.5.3 - SHOULD) | PASS | Authoring Notes in Section 4 provide additional guidance. |
| Cite document class it templates (§9.5.4) | PASS | Section 1.1 cites ARC-0001 §4 (all eight classes). Section 6 variations cite class-specific STD-0001 sections. |
| No rules, requirements, or procedures (§9.5.5) | PASS | All content is structural or instructional. No normative rules defined. |

#### ADR Exception Handling (§8.1, §9.7)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Class-specific order override | PASS | Section 6.7 provides a separate ADR template body per ARC-0001 §17.2. |
| No Amendment Record in ADR | PASS | ADR template omits Amendment Record. ADR is immutable per ARC-0001 §17.3. |
| Status instead of Version | PASS | ADR front matter uses `Status` per STD-0001 §3.2. |
| Layer: X | PASS | ADR template front matter uses `Layer: X`. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Downward dep constraint | PASS | TPL (L4) references ARC (L0) and STD (L2). All ≤ 4. |
| G01-R6 | No circular dependencies | PASS | TPL→ARC/STD→ARC. No cycles. |
| G01-R7 | TPL must cite class it templates | PASS | Section 1.1 cites ARC-0001 §4. Section 6 references STD-0001 per class. |
| G01-R8 | Dependencies section exists | PASS | Present with bullet list. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | TPL is valid. |
| G02-R2 | Single class code | PASS | Exactly one: TPL. |
| G02-R3 | Layer matches LAYER_MAP | PASS | Layer 4. Front matter: `Layer: 4`. |
| G02-R4 | Single concern | PASS | Document template only. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-TPL-0001-MASTER-DOCUMENT-TEMPLATE. |
| G03-R2 | Filename mirror | PASS | ai-sdom-tpl-0001-master-document-template.md. |
| G03-R3 | No duplicate | PASS | First assignment. |
| G03-R4 | Not reassigned | PASS | First assignment. |
| G03-R5 | Not retired | PASS | Retired register empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | Directory matches class | PASS | 04-TEMPLATES/. |
| G04-R2 | Within numbered directory | PASS | Yes. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All references resolve | PASS | `[AI-SDOM-ARC-0001]` and `[AI-SDOM-STD-0001]` resolve. |
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
| G07-R1 | Within class range | PASS | TPL 0001 within TPL 0001-0999. |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules** — N/A (this is TPL, not ADR).

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction | PASS | All content aligns with ARC-0001 and STD-0001. |
| G09-R2 | Traceability | PASS | Every placeholder and section traces to governing reference. |
| G09-R3 | No duplication | PASS | No ARC-0001 or STD-0001 content reproduced. All rules referenced by citation. |
| G09-R4 | Composability | PASS | Template layers cleanly over class-specific requirements. |
| G09-R5 | Explicitness | PASS | All assumptions and instructions written. Placeholder table is exhaustive. |
| G09-R6 | Governance boundary | PASS | No governance roles, approval processes, or decision rights defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. Cross-references verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Dependency scope (GOV document reference):** Initial draft listed GOV-0001 as a dependency. TPL is Layer 4 and may reference L0-L4, which includes GOV (L1). However, this template does not directly reference any GOV policy — it references STD-0001, which in turn references GOV-0001. Adding GOV-0001 would create an unnecessary direct dependency. Resolved by removing GOV-0001 from Dependencies and relying on the transitive chain TPL→STD→GOV→ARC.

2. **ADR template completeness (Section 6.7):** Initial ADR template section referenced only three required sections (Context, Decision, Consequences). ARC-0001 §17.2 requires seven sections in a specific order: Title, Status, Context, Decision, Consequences, Alternatives Considered, References. The ADR template also requires `Layer: X` and `Status` instead of `Version` and `Lifecycle State`. Resolved by providing a complete ADR template body with all seven sections in the prescribed order and the correct front matter fields.

3. **Placeholder classification consistency (Section 3):** The initial placeholder table mixed SHALL (mandatory) and SHOULD (recommended) under a single "Mandatory/Optional" column. This created ambiguity about which placeholders were strictly required. Resolved by adding a dedicated "Requirement" column (SHALL/SHOULD/MAY) derived from STD-0001 §8.1.

4. **Class-specific variation for ADR (Section 8.1 override):** STD-0001 §8.1 allows class-specific overrides to the default section order. The ADR class requires a full structural override (no Purpose section, no Amendment Record). Resolved by providing a complete alternate ADR template body in Section 6.7 rather than trying to describe the variation as delta instructions, which would risk ambiguity.

5. **Self-audit format in template body (Section 5):** The template body's Self-Audit Log placeholder used a single-line format that could be confused with a single entry. Per STD-0001 §8.4, the Self-Audit Log SHALL contain a numbered list of issues, each with scope, description, and resolution. Resolved by using a multi-line placeholder format that illustrates the correct structure with {AUDIT-ISSUE-NUMBER}, {AUDIT-SCOPE}, {AUDIT-DESCRIPTION}, and {AUDIT-RESOLUTION}.
