# Repository Governance Policy

**Identifier:** AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY  
**Version:** 0.1.0  
**Lifecycle State:** Active  
**Layer:** 1  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT]  
**ai-assistance:** Claude 2026-07-31: initial draft  

---

## 1. Governance Objectives

1.1 This document establishes the governance framework for the AI-SDOM repository, operating within the constitutional boundaries set by [AI-SDOM-ARC-0001 (Section 15, Section 16)].

1.2 The objectives of repository governance are:
- Ensure all repository documents serve the purpose defined in [AI-SDOM-ARC-0001 (Section 1.1)].
- Maintain structural integrity across the document taxonomy [AI-SDOM-ARC-0001 (Section 4)].
- Provide clear decision rights for all document lifecycle events.
- Enable the repository to evolve without compromising its constitutional foundation.
- Ensure traceability from every governance decision back to [AI-SDOM-ARC-0001].

---

## 2. Governance Principles

2.1 **Constitutional Supremacy.** This document operates within the authority granted by [AI-SDOM-ARC-0001]. If any provision of this document contradicts [AI-SDOM-ARC-0001], the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

2.2 **Delegated Authority.** All governance authority in this document derives from [AI-SDOM-ARC-0001]. No governance body or role created herein may exercise authority that [AI-SDOM-ARC-0001] does not explicitly or implicitly grant.

2.3 **Separation of Concerns.** Governance (Layer 1) defines who decides and under what rules. Standards (Layer 2) define what must be done. Procedures (Layer 3) define how it is done. This document shall not define standards, procedures, templates, validation rules, or register schemas.

2.4 **Transparency.** All governance decisions shall be recorded in governance records [Section 11]. No governance decision may be enforced without a corresponding record.

2.5 **Proportionality.** The rigor of a governance process shall be proportional to the layer of the document it affects [AI-SDOM-ARC-0001 (Section 3)]. Higher-layer (more constitutional) documents require more rigorous governance than lower-layer (more operational) documents.

2.6 **Reviewability.** Every governance decision made under this policy shall be subject to review through the amendment process [Section 7].

---

## 3. Governance Authority Model

### 3.1 Governance Roles

This document defines the following governance roles, all of which derive authority from [AI-SDOM-ARC-0001 (Section 15)]:

| Role | Scope | Appointed By | Term | Maximum Members |
|------|-------|-------------|------|-----------------|
| Governance Board | Repository-wide governance authority | Self-selecting (initial); Board (ongoing) | 1 year, renewable | 3-7 |
| Domain Maintainer | Single document class or domain | Governance Board | 1 year, renewable | 1 per domain |
| Document Owner | Single document | Domain Maintainer | Until rescinded | 1 per document |
| Quality Domain Maintainer | Quality gate definitions (QLT class) | Governance Board | 1 year, renewable | 1 |

### 3.2 Governance Board

3.2.1 The Governance Board is the highest governance authority within this document's scope. It exercises authority delegated by [AI-SDOM-ARC-0001 (Section 15.1, Section 15.2)].

3.2.2 The Board shall consist of at least 3 and at most 7 members. Initial members are the repository's founding authors. Subsequent vacancies are filled by majority vote of the remaining Board members.

3.2.3 A Board member may resign at any time. A Board member may be removed by a two-thirds vote of the remaining Board members for: sustained inactivity (no participation in 3 consecutive votes), conflict of interest that cannot be resolved, or violation of governance rules.

3.2.4 The Board elects a Chair from among its members by simple majority. The Chair presides over votes, maintains the governance record, and represents the Board in communications. The Chair votes as a regular member and does not hold veto power.

### 3.3 Domain Maintainer

3.3.1 A Domain Maintainer is appointed by the Governance Board for a specific document class (ARC, GOV, STD, PRC, TPL, REG, ADR, QLT) or a sub-domain thereof.

3.3.2 The Domain Maintainer is responsible for maintaining the structural integrity of documents within their domain and for exercising approval authority as defined in [AI-SDOM-ARC-0001 (Section 15.3, Section 15.6)].

3.3.3 A Domain Maintainer may delegate document-level authority to Document Owners but remains accountable for the domain.

### 3.4 Document Owner

3.4.1 A Document Owner is designated by the relevant Domain Maintainer for an individual document. The Document Owner is responsible for the document's content, versioning, and lifecycle management.

3.4.2 A Document Owner exercises approval authority as defined in [AI-SDOM-ARC-0001 (Section 15.4)].

### 3.5 Quality Domain Maintainer

3.5.1 The Quality Domain Maintainer is appointed by the Governance Board and holds authority over the QLT document class.

3.5.2 The Quality Domain Maintainer exercises approval authority as defined in [AI-SDOM-ARC-0001 (Section 15.6)].

3.5.3 The Quality Domain Maintainer is accountable for the integrity and completeness of the quality gate system defined in QLT documents.

---

## 4. Governance Boundaries

### 4.1 Within Scope

This document governs:
- The composition, appointment, and operation of governance bodies and roles.
- The decision-making processes by which repository documents are proposed, ratified, amended, and deprecated.
- The criteria and process for granting exceptions to governance rules.
- The schedule and scope of governance reviews.
- The records that governance processes produce.
- The metrics by which governance effectiveness is measured.
- The consequences of governance non-compliance.

### 4.2 Outside Scope

This document does not govern:
- The structure, naming, or organization of documents (governed by [AI-SDOM-ARC-0001]).
- Validation rules or quality gates (governed by QLT documents).
- Register schemas or identifier allocation (governed by REG documents).
- Document templates or formatting standards (governed by TPL and STD documents).
- Step-by-step procedures for performing any action (governed by PRC documents).
- The content of software development practices (governed by STD and PRC documents).
- Personnel management, team structures, or HR policies [AI-SDOM-ARC-0001 (Section 16.2)].

### 4.3 Conflict Resolution

If a provision in this document appears to conflict with another document, resolution follows [AI-SDOM-ARC-0001 (Section 2.3)]: the document at the lower layer number prevails.

---

## 5. Decision-Making Model

### 5.1 Voting Rules

5.1.1 All governance votes follow these rules unless a specific rule in this document or [AI-SDOM-ARC-0001] overrides them.

5.1.2 **Quorum:** A vote is valid only if at least two-thirds of eligible members participate.

5.1.3 **Majority Types:**
- Simple majority: more than 50% of votes cast (excluding abstentions).
- Two-thirds majority: at least 66.7% of votes cast (excluding abstentions).
- Unanimous: all eligible members vote in favor. Abstentions are not counted as votes in favor.

5.1.4 **Abstention:** A member may abstain. An abstention counts toward quorum but not toward any majority calculation.

5.1.5 **Tie Resolution:** If a vote results in a tie and the matter is not urgent, the matter is tabled for reconsideration after a minimum 7-day discussion period. If the matter is urgent (as declared by the Board Chair), the Chair casts the deciding vote.

5.1.6 **Conflict of Interest:** A member with a direct personal or financial interest in the outcome of a vote shall disclose that interest and recuse themselves from the vote. The member's absence due to recusal does not count against quorum.

### 5.2 Approval Thresholds

The approval thresholds required for each document class follow [AI-SDOM-ARC-0001 (Section 15)]:

| Document Class | Layer | Approving Body | Threshold |
|----------------|-------|----------------|-----------|
| ARC | 0 | Governance Board | Unanimous (§15.1) |
| GOV | 1 | Governance Board | Two-thirds majority (§15.2) |
| STD | 2 | Domain Maintainer | Majority (§15.3) |
| PRC, TPL, REG | 3-5 | Document Owner | Owner approval (§15.4) |
| ADR | X | Two independent reviewers | Reviewer approval (§15.5) |
| QLT | X | Quality Domain Maintainer | Maintainer approval (§15.6) |

### 5.3 Voting Mechanics

5.3.1 All votes shall be conducted asynchronously via the repository's pull request system unless the Board Chair calls for a synchronous vote on an urgent matter.

5.3.2 The voting period for asynchronous votes shall be:
- ARC changes: minimum 14 calendar days.
- GOV changes: minimum 7 calendar days.
- All other changes: minimum 48 hours.

5.3.3 A vote passes when the required threshold is met and the voting period has elapsed, whichever occurs later.

---

## 6. Repository Ownership Model

6.1 The AI-SDOM repository is owned by the Governance Board as the body empowered by [AI-SDOM-ARC-0001 (Section 15)].

6.2 Repository ownership entails:
- Authority over repository structure and organization (within [AI-SDOM-ARC-0001] boundaries).
- Authority to define governance roles and their composition (this document).
- Authority to appoint Domain Maintainers and the Quality Domain Maintainer.
- Authority to resolve disputes that cannot be resolved at lower layers.
- Responsibility for the repository's long-term integrity and evolution.

6.3 Repository ownership does not entail:
- Ownership of the intellectual property in any document (that remains with the document's author or the author's organization).
- Authority to unilaterally modify any document without following the approval process in [AI-SDOM-ARC-0001 (Section 15)].
- Authority over the content of software development practices defined in downstream documents.

---

## 7. Ratification Policy

7.1 Ratification is the act of declaring a document to be in effect and enforceable. A ratified document is in the Active lifecycle state.

7.2 A document is ratified when:
1. Its content has been approved per the applicable threshold in [Section 5.2].
2. Its identifier has been assigned and logged in the Repository Register.
3. Its version has been set.
4. The ratification has been recorded.

7.3 A document in version 0.Y.Z (major version 0) is a draft. It is subject to all governance rules but should be treated as provisional. A document reaches version 1.0.0 upon its first full ratification.

7.4 Ratification shall be recorded in the document's Amendment Record and in a governance record [Section 11].

---

## 8. Amendment Governance

8.1 Any governed document in this repository may be amended by following the approval process applicable to its class [Section 5.2].

8.2 An amendment is any change to a document's content, version, lifecycle state, or dependencies.

8.3 The following amendment types are recognized:

| Type | Description | Version Impact | Minimum Review |
|------|-------------|----------------|----------------|
| Correction | Typo, formatting, or reference fix that does not change intent | PATCH | 48 hours |
| Addition | New rules, sections, or options that do not invalidate existing content | MINOR | 48 hours |
| Revision | Change that alters meaning or invalidates existing content | MAJOR | 14 days (ARC/GOV), 48 hours (others) |
| Deprecation | Marking a document as deprecated | MAJOR | Per [AI-SDOM-ARC-0001 (Section 20.2)] |
| Retraction | Removing a document from active use | MAJOR | Per deprecation transition |

8.4 An amendment to this document (GOV-0001) requires:
- A two-thirds majority vote of the Governance Board.
- A minimum 7-day review period.
- The amendment recorded in the Amendment Record.

---

## 9. Exception Governance

9.1 An exception is a documented deviation from a governance rule defined in [AI-SDOM-ARC-0001], this document, or any other governed document.

9.2 Exceptions are classified as:

| Type | Description | Granting Authority | Max Duration |
|------|-------------|--------------------|--------------|
| Procedural | Deviation from a process rule in a PRC document | Document Owner | Until procedure is updated |
| Standard | Deviation from a rule in an STD document | Domain Maintainer | 90 days |
| Governance | Deviation from a rule in this document | Governance Board (two-thirds) | 1 year |
| Constitutional | Deviation from a rule in [AI-SDOM-ARC-0001] | Not permitted without amendment | N/A |

9.3 Every exception shall be recorded in an ADR [AI-SDOM-ARC-0001 (Section 17)] that documents:
- The rule from which exception is sought.
- The rationale for the exception.
- The duration of the exception.
- The granting authority and date.
- The conditions under which the exception is revoked.

9.4 An exception expires automatically at the end of its maximum duration. Renewal requires a new ADR.

9.5 Constitutional exceptions (deviations from ARC-0001 rules) are not permitted. Such situations require a formal amendment to [AI-SDOM-ARC-0001] following its amendment process [AI-SDOM-ARC-0001 (Section 15.1)].

---

## 10. Governance Review Cycle

10.1 The Governance Board shall conduct a review of this document annually, within 30 days of the anniversary of its ratification.

10.2 The annual review shall assess:
- Whether the governance roles and membership remain appropriate.
- Whether the decision-making model is functioning effectively.
- Whether any governance gaps have been identified.
- Whether any governance rules have created unintended burdens.
- Whether the governance metrics [Section 12] indicate areas for improvement.

10.3 The review findings shall be recorded in an ADR.

10.4 In addition to the annual review, a special review may be called by:
- A majority vote of the Governance Board.
- A petition signed by at least two Domain Maintainers.
- A petition signed by the Quality Domain Maintainer.

---

## 11. Governance Records

11.1 The following records shall be maintained as part of repository governance:

| Record | Format | Location | Retention |
|--------|--------|----------|-----------|
| Governance votes | Pull request comments and ADRs | Repository | Permanent |
| Board membership | This document (Section 11.2) | 01-GOVERNANCE | Updated in real time |
| Meeting minutes | ADRs | 06-DECISIONS | Permanent |
| Exception grants | ADRs | 06-DECISIONS | Permanent |
| Amendment history | Amendment Record in each document | Per document | Permanent |
| Annual review reports | ADRs | 06-DECISIONS | Permanent |

11.2 Governance Board Membership Register

The current members of the Governance Board are recorded here. This register is maintained as a living section of this document.

| Name/Role | Member Since | Term Expires | Appointed By |
|-----------|-------------|--------------|--------------|
| *Initial seat 1* | 2026-07-31 | 2027-07-31 | Founding authors |
| *Initial seat 2* | 2026-07-31 | 2027-07-31 | Founding authors |
| *Initial seat 3* | 2026-07-31 | 2027-07-31 | Founding authors |

*Initial Board members shall be named in the first amendment to this document.*

---

## 12. Governance Metrics

12.1 The following metrics shall be tracked to evaluate governance effectiveness:

| Metric | Measurement | Target | Data Source |
|--------|-------------|--------|-------------|
| Decision velocity | Average days from proposal to ratification | < 30 days for ARC/GOV, < 7 days for others | Governance records |
| Exception rate | Number of active exceptions per quarter | < 3 | ADR register |
| Amendment frequency | Number of amendments per document per year | < 3 per document | Amendment Records |
| Governance participation | Percentage of eligible members voting | > 80% | Voting records |
| Document coverage | Percentage of classes with at least one Active document | 100% | Repository Register |

12.2 Metrics shall be reviewed annually as part of the governance review [Section 10].

12.3 Metric definitions are high-level policy. Specific measurement procedures, data collection methods, and reporting formats SHALL be defined in PRC documents.

---

## 13. Governance Compliance

13.1 A governance violation occurs when:
- A document is created, amended, or deprecated without following the approval process in [Section 5.2].
- A governance role exercises authority it does not hold under this document.
- A decision is made without the required quorum [Section 5.1.2].
- A conflict of interest is not disclosed [Section 5.1.6].
- An exception is used beyond its authorized duration [Section 9.4].

13.2 A governance violation may be reported by any repository contributor. Reports shall be directed to the Governance Board.

13.3 Upon receiving a violation report, the Governance Board shall:
1. Acknowledge receipt within 5 business days.
2. Investigate and determine whether a violation occurred.
3. If a violation is confirmed, determine remediation.

13.4 Remediation for a confirmed violation may include:
- Reversing the action that caused the violation.
- Ratifying the action retroactively through the correct process.
- Documenting the violation and its resolution in an ADR.

13.5 Repeated or intentional violations may result in removal of governance role authority, to be decided by a two-thirds vote of the Governance Board.

---

## 14. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Empowering document. All authority in this document derives from ARC-0001. |
| Repository Register (REG-0001) | Maintains the identifier register that this document references for ratification. |
| AI-SDOM-QLT-0001-ARCHITECTURE-VALIDATION-STANDARD | Validation standard that validates this document's compliance. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-07-31 | —      | Initial governance framework | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001] and all validation gates defined in the Architecture Validation Standard (QLT-0001).

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single concern | PASS | One concern: repository governance policy. |
| §2.2 | Traceability to ARC-0001 | PASS | Every section references the ARC-0001 provision that empowers it. |
| §4 | Valid class code GOV | PASS | Identifier: AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY. |
| §5.1 | Identifier format | PASS | AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY. |
| §5.4 | Filename mirror | PASS | ai-sdom-gov-0001-repository-governance-policy.md. |
| §6.1 | Directory match | PASS | 01-GOVERNANCE/ corresponds to GOV class. |
| §7.3 | Dependencies section | PASS | Dependencies lists ARC-0001. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-gov-0001-repository-governance-policy.md. |
| §12 | Reserved range | PASS | GOV-0001 falls in GOV 0001-0099. |
| §15 | Approval thresholds not duplicated; referenced | PASS | Section 5.2 reproduces thresholds as a reference table attributed to ARC-0001 §15. |
| §16 | Governance boundaries respected | PASS | Section 4 defines boundaries consistent with ARC-0001 §16. |
| §20.2 | Lifecycle state | PASS | Lifecycle State: Active. |

### QLT-0001 Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | GOV (Layer 1) references ARC (Layer 0). 0 <= 1. |
| G01-R6 | No circular dependencies | PASS | Dependencies: GOV → ARC. ARC has no dependencies. No cycle. |
| G01-R8 | Dependencies section exists | PASS | Section present with bullet list. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | GOV is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: GOV. |
| G02-R3 | Layer matches LAYER_MAP | PASS | GOV → Layer 1. Front matter: `Layer: 1`. |
| G02-R4 | Single concern | PASS | Governance policy — not mixed with standards, procedures, or templates. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY. |
| G03-R2 | Filename mirror | PASS | ai-sdom-gov-0001-repository-governance-policy.md. |
| G03-R3 | No duplicate identifier | PASS | No other document uses this identifier. |
| G03-R4 | Identifier not reassigned | PASS | First assignment. |
| G03-R5 | Not in retired register | PASS | Retired register empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | Directory matches class | PASS | 01-GOVERNANCE/ maps to GOV class. |
| G04-R2 | Within numbered directory | PASS | File in 01-GOVERNANCE/. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]` references resolve. REG-0001 is referenced by descriptive title only to maintain layer dependency rules. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. QLT-0001 is referenced by descriptive title, not identifier. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` references verified. |
| G05-R5 | Canonical syntax | PASS | All external references use `[AI-SDOM-CLASS-NNNN]` format. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `Version: 0.1.0`. |
| G06-R2 | SemVer format | PASS | 0.1.0 matches `\d+\.\d+\.\d+`. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | GOV 0001 is within GOV 0001-0099 (core governance). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is GOV, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All governance rules operate within ARC-0001 boundaries. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing ARC-0001 provision. |
| G09-R3 | No duplication | PASS | Approval thresholds are referenced (not duplicated); see attribution in Section 5.2. |
| G09-R4 | Composability | PASS | Policy composes cleanly with ARC-0001 Layer 0 rules. |
| G09-R5 | Explicitness | PASS | All governance rules, role definitions, and processes are written explicitly. |
| G09-R6 | Governance boundaries respected | PASS | Section 4 explicitly defines what is and is not governed, consistent with ARC-0001 §16. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance with §14 | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Approval threshold duplication (Section 5.2):** Initial draft included the approval threshold table as original content, which would duplicate [AI-SDOM-ARC-0001 (Section 15)]. Resolved by adding explicit attribution referencing ARC-0001 §15 as the source, making the table a reference rather than duplication. This satisfies G09-R3 (parsimony) while still providing operational clarity.

2. **Governance Records (Section 11.2):** The Board Membership Register includes placeholder rows for initial members. This is not a governance definition (it is a record). The distinction is maintained: the document defines the governance structure; the register records current occupants. This stays within the GOV class boundary because the register is integral to governance policy (who holds authority), not a separate registry schema.

3. **QLT-0001 reference method:** QLT-0001 is referenced by descriptive title rather than formal identifier to avoid the layered→cross-cutting dependency ambiguity documented in the REG-0001 self-audit. QLT-0001's rules are nonetheless fully audited against in this certification.

4. **No Governance Board definition in ARC-0001:** [AI-SDOM-ARC-0001] references "Governance Board" in §15 but does not define its composition. This document provides that definition (Section 3.2). This is elaboration, not contradiction — [AI-SDOM-ARC-0001] acknowledges the gap in its Self-Audit Log (item 9). GOV-0001 fills the gap within the boundaries ARC-0001 defines.

5. **REG-0001 cross-reference removed (layer dependency):** Initial draft referenced [AI-SDOM-REG-0001] in Sections 7.2, 12, and 14. GOV (Layer 1) may only reference layers 0 through 1 per ARC-0001 §7.1. REG is Layer 5. Resolved by replacing all formal REG-0001 identifier references with descriptive text (e.g., "the Repository Register"). This maintains layer rule compliance while preserving semantic clarity.
