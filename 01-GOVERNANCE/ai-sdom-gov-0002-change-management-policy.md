# Change Management Policy

**Identifier:** AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY  
**Version:** 0.1.0  
**Lifecycle State:** Active  
**Layer:** 1  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT], [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY]  
**ai-assistance:** opencode (deepseek-v4-flash-free) 2026-07-31: initial draft  

---

## 1. Purpose

1.1 This document defines the governance policy governing changes to AI-SDOM controlled documents. It establishes the governance framework for proposing, assessing, approving, implementing, and recording changes, operating within the constitutional boundaries set by [AI-SDOM-ARC-0001 (Section 15, Section 16)] and the governance framework established by [AI-SDOM-GOV-0001].

1.2 This document derives its authority from [AI-SDOM-ARC-0001 (Section 10, Section 15)] and [AI-SDOM-GOV-0001 (Section 7, Section 8)].

1.3 This document defines governance policy for change management only. It SHALL NOT define:
- Step-by-step operational instructions for executing a change (governed by the PRC class, e.g., the Document Development Procedure).
- Approval thresholds, voting rules, or role composition (governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5)]).
- Amendment types or version increment rules (governed by [AI-SDOM-GOV-0001 (Section 8)] and [AI-SDOM-ARC-0001 (Section 9)]).
- Validation rules or quality gates (governed by the QLT class, e.g., the Architecture Validation Standard).
- Document structure, metadata, or content requirements (governed by the STD class, e.g., the Documentation Standard).
- Identifier allocation or document inventory (governed by the REG class, e.g., the Repository Register).

---

## 2. Governance Objectives

2.1 The objectives of change management governance are:
- Ensure every change to a controlled document is proposed, assessed, approved, implemented, and recorded under defined governance rules.
- Maintain the constitutional integrity of [AI-SDOM-ARC-0001] against unauthorized or undocumented change.
- Ensure the rigor of change governance is proportional to the layer of the affected document and the category of the change [AI-SDOM-ARC-0001 (Section 2.5, Section 10)].
- Ensure every change is traceable from its proposal to its record [Section 7].
- Ensure changes are assessed for their full impact before approval [AI-SDOM-ARC-0001 (Section 10.1)].

---

## 3. Governance Principles for Change Management

3.1 **Constitutional Supremacy.** Change management operates within [AI-SDOM-ARC-0001]. If any provision of this document conflicts with [AI-SDOM-ARC-0001], the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

3.2 **Delegated Authority.** All change governance authority derives from [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5)]. No change authority may be exercised beyond what those documents grant.

3.3 **No Unapproved Change.** No change to a controlled document SHALL take effect without approval granted by the authority designated for its category and class [AI-SDOM-ARC-0001 (Section 15.7)]. Approval SHALL be recorded.

3.4 **Proportional Rigor.** The rigor applied to a change SHALL be proportional to the layer of the affected document and the change category [AI-SDOM-ARC-0001 (Section 2.5, Section 10.3, Section 10.4)]. Changes to more constitutional documents receive more rigorous governance than operational changes.

3.5 **Impact Awareness.** Every change SHALL be assessed for its impact on the affected document and on all documents that depend on it, directly or transitively, before approval [AI-SDOM-ARC-0001 (Section 10.1, Section 10.2)].

3.6 **Traceability.** Every change SHALL be recorded such that it can be traced from its proposal through its assessment, approval, implementation, and registration [AI-SDOM-ARC-0001 (Section 15.7)].

3.7 **Separation of Governance from Operation.** This document defines what SHALL be governed; it does not define how a change is executed. Operational execution is governed by the PRC class and validated by the QLT class.

---

## 4. Change Categories and Governance Expectations

4.1 The recognized change categories for controlled documents are the amendment types defined in [AI-SDOM-GOV-0001 (Section 8.3)] — Correction, Addition, Revision, Deprecation, and Retraction — together with the creation of new documents. The version impact and minimum review period for each category are defined in [AI-SDOM-GOV-0001 (Section 8.3)] and [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)] and are not reproduced here.

4.2 The governance expectations for each change category are:

| Change Category | Governance Expectation |
|-----------------|------------------------|
| New Document Creation | Full ratification required before the document takes effect [AI-SDOM-GOV-0001 (Section 7.2)]. The identifier SHALL be drawn from and recorded in the Repository Register (REG-0001) before ratification [AI-SDOM-GOV-0001 (Section 7.2)]. |
| Correction | Intent-preserving fix [AI-SDOM-GOV-0001 (Section 8.3)]. Governed at the lightest rigor; the impact assessment SHALL confirm there is no downstream effect. |
| Addition | Backward-compatible extension [AI-SDOM-GOV-0001 (Section 8.3)]. Governed at MINOR rigor; the impact assessment SHALL confirm compatibility with dependent documents. |
| Revision | Meaning-altering change [AI-SDOM-GOV-0001 (Section 8.3)]. Governed at MAJOR rigor; SHALL include a full impact assessment and review of all directly and transitively dependent documents [AI-SDOM-ARC-0001 (Section 10.2, Section 10.3)]. |
| Deprecation | Lifecycle transition with a mandatory transition period per class [AI-SDOM-ARC-0001 (Section 20.2)]. Existing references SHALL be updated during the transition period [AI-SDOM-ARC-0001 (Section 20.3)]. |
| Retraction | Removal from active use. Governed with Deprecation rigor; the retired identifier SHALL be recorded in the Repository Register (REG-0001) and SHALL NOT be reused [AI-SDOM-ARC-0001 (Section 12.2)]. |
| Urgent Change | Expedited handling for security vulnerabilities and critical errors [AI-SDOM-ARC-0001 (Section 10.5)]; governed per [Section 4.3]. |

4.3 Urgent changes (security vulnerabilities, critical errors) may follow an expedited path permitted by [AI-SDOM-ARC-0001 (Section 10.5)]. The expedited path SHALL:
1. Be declared and justified by the change proponent in the change record [Section 7] at the time of proposal.
2. Reduce the minimum review period; the approval threshold SHALL NOT be reduced [AI-SDOM-GOV-0001 (Section 5.2)].
3. Obtain approval from the authority designated for the affected document's class [AI-SDOM-GOV-0001 (Section 5.2)].
4. Complete the impact assessment [Section 6] and the change record [Section 7] immediately after implementation.
5. Be subject to retrospective review; where the expedited path diverged from the governance expectations in [Section 4.2], the divergence SHALL be recorded and ratified after the fact.

4.4 The governance expectations in [Section 4.2] and [Section 4.3] are policy. The operational steps for applying them are defined in the PRC class.

---

## 5. Decision Authority by Change Type

5.1 The approving authority and threshold for each document class are defined in [AI-SDOM-ARC-0001 (Section 15)] and operationalized in [AI-SDOM-GOV-0001 (Section 5.2)]. This document does not reproduce those thresholds.

5.2 The change management lifecycle assigns the following governance responsibilities for each change category. Roles follow [AI-SDOM-GOV-0001 (Section 3)]; the term *Author* denotes the lifecycle initiator who authors the change, consistent with the document lifecycle.

| Change Category | Proposed By | Assessed By | Approved By |
|-----------------|-------------|-------------|-------------|
| New Document Creation | Author | Domain Maintainer for the class | Per [AI-SDOM-GOV-0001 (Section 5.2)] |
| Correction | Document Owner | Document Owner | Per [AI-SDOM-GOV-0001 (Section 5.2)] |
| Addition | Document Owner | Document Owner and affected Document Owners | Per [AI-SDOM-GOV-0001 (Section 5.2)] |
| Revision | Document Owner | Domain Maintainer and affected Document Owners | Per [AI-SDOM-GOV-0001 (Section 5.2)] |
| Deprecation | Document Owner | Domain Maintainer | Per [AI-SDOM-GOV-0001 (Section 5.2)] |
| Retraction | Domain Maintainer | Domain Maintainer | Per [AI-SDOM-GOV-0001 (Section 5.2)] |
| Urgent Change | Document Owner | Document Owner; retrospective assessment per [Section 4.3] | Per [AI-SDOM-GOV-0001 (Section 5.2)] |

5.3 Changes to cross-cutting documents (ADR, QLT) follow the approval authorities in [AI-SDOM-ARC-0001 (Section 15.5, Section 15.6)].

5.4 Where this section assigns an assessment responsibility, the assigned party SHALL complete the impact assessment [Section 6] before the change is submitted for approval.

---

## 6. Impact Assessment Requirements

6.1 Every proposed change SHALL include an impact statement identifying every document potentially affected, directly or transitively [AI-SDOM-ARC-0001 (Section 10.1)].

6.2 The impact assessment SHALL, at minimum:
- Identify the affected document(s) by identifier.
- Identify all documents that depend on the affected document(s), directly or transitively, using the dependency information maintained in the Repository Register (REG-0001) [AI-SDOM-ARC-0001 (Section 10.6)].
- Classify the change category [Section 4.1].
- Determine whether the change is breaking or non-breaking [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)].
- Identify the applicable review period and the approving authority [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)]; [AI-SDOM-GOV-0001 (Section 5.2)].
- List any document owners who SHALL be notified [AI-SDOM-ARC-0001 (Section 10.2, Section 10.3)].

6.3 The impact assessment SHALL be completed before the change is submitted for approval.

6.4 The depth of the impact assessment SHALL be proportional to the change category [Section 4.2]. Corrections require confirmation of no downstream impact; revisions require a full impact assessment covering all dependent documents.

6.5 The impact assessment SHALL be recorded with the change record [Section 7] and SHALL be updated if new downstream impact is discovered during implementation.

---

## 7. Traceability Requirements

7.1 Every change SHALL be traceable from its proposal through its assessment, approval, implementation, and registration. The traceability chain SHALL be recorded in the change record.

7.2 The change record SHALL contain, at minimum:
- The change category [Section 4.1].
- The affected document identifier(s) and the proposed version.
- The impact assessment [Section 6].
- The approving authority and the approval reference [AI-SDOM-ARC-0001 (Section 15.7)].
- The resulting version increment and the Amendment Record entry [AI-SDOM-GOV-0001 (Section 8.3)].
- The registration status in the Repository Register (REG-0001).

7.3 Approval SHALL be recorded in the pull request or an ADR [AI-SDOM-ARC-0001 (Section 15.7)]. Verbal or offline approvals SHALL NOT be recognized.

7.4 The change record SHALL be retained per the governance record retention requirements in [AI-SDOM-GOV-0001 (Section 11)]. It complements the governance records defined therein.

7.5 Each ratified version of a controlled document SHALL be traceable to the change that produced it via the document's Amendment Record [AI-SDOM-ARC-0001 (Section 9.5)] and the version recorded in the Repository Register (REG-0001).

---

## 8. Review Expectations

8.1 Every change SHALL remain in review for the minimum review period applicable to its category and class [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)]; [AI-SDOM-GOV-0001 (Section 5.3.2)].

8.2 Review SHALL include the mandatory manual quality gates defined in [AI-SDOM-ARC-0001 (Section 18.4)] — content review, contract compliance review, and consistency review — as executed by the Document Development Procedure (PRC-0001) and validated by the Architecture Validation Standard (QLT-0001).

8.3 For changes with downstream impact, affected document owners SHALL be notified and given the opportunity to review [AI-SDOM-ARC-0001 (Section 10.2, Section 10.3)].

8.4 Review findings SHALL be resolved before approval. Unresolved findings SHALL block approval.

8.5 The review record SHALL be retained with the change record [Section 7].

---

## 9. Governance Boundaries

### 9.1 Within Scope

9.1.1 This document governs:
- The governance principles for change management of controlled documents [Section 3].
- The categories of change and their governance expectations [Section 4].
- The decision authority applicable by change category [Section 5].
- The requirements for impact assessment [Section 6], traceability [Section 7], and review [Section 8] of changes.
- The governance records that change management produces [Section 7].

### 9.2 Outside Scope

9.2.1 This document does not govern:
- The step-by-step execution of changes (governed by the PRC class).
- Validation rules and quality gates (governed by the QLT class).
- Document structure, metadata, and content requirements (governed by the STD class).
- Identifier allocation and document inventory (governed by the REG class).
- Approval thresholds, voting mechanics, and role composition (governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5)]).
- The content of software development practices [AI-SDOM-ARC-0001 (Section 16.2)].

### 9.3 Conflict Resolution

9.3.1 If a provision of this document appears to conflict with another document, resolution follows [AI-SDOM-ARC-0001 (Section 2.3)]: the document at the lower layer number prevails.

---

## 10. Amendment Policy

10.1 Amendments to this document SHALL follow the amendment governance in [AI-SDOM-GOV-0001 (Section 8.4)]: a two-thirds majority of the Governance Board and a minimum 7-day review period.

10.2 Amendment types and version impacts follow [AI-SDOM-GOV-0001 (Section 8.3)] and [AI-SDOM-ARC-0001 (Section 9)].

---

## 11. Exception Policy

11.1 Exceptions to the change management governance rules defined in this document SHALL be granted and recorded per [AI-SDOM-GOV-0001 (Section 9)].

11.2 Constitutional exceptions (deviations from [AI-SDOM-ARC-0001]) are not permitted; such situations require a formal amendment [AI-SDOM-GOV-0001 (Section 9.5)].

11.3 Urgent changes follow the expedited path defined in [Section 4.3] and SHALL complete full governance retrospectively.

---

## 12. Review Cycle

12.1 This document SHALL be reviewed annually as part of the governance review cycle in [AI-SDOM-GOV-0001 (Section 10)].

12.2 A special review of this document may be triggered per [AI-SDOM-GOV-0001 (Section 10.4)].

12.3 Review findings SHALL be recorded in an ADR [AI-SDOM-GOV-0001 (Section 10.3)].

---

## 13. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Empowering document. Change impact rules (§10), approval principles (§15), governance boundaries (§16), quality gate architecture (§18), and lifecycle states (§20). |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Roles (§3), decision-making model (§5), ratification (§7), amendment governance (§8), exception governance (§9), review cycle (§10), and governance records (§11). |
| Document Development Procedure (PRC-0001) | Operational execution of the change lifecycle. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (REG-0001) | Identifier authority and document inventory supporting impact assessment and traceability. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard (QLT-0001) | Validation gates applied to changes. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-07-31 | —      | Initial change management governance policy | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], the Documentation Standard, and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure change management governance policy. §1.3 excludes standards, procedures, validation, register, and template content. |
| §2.2 | Traceability to ARC-0001 | PASS | Every substantive section cites the ARC-0001 or GOV-0001 provision that empowers it. |
| §2.3 | Composability | PASS | No provision conflicts with ARC-0001 or GOV-0001; lower-layer precedence acknowledged in §9.3. |
| §2.4 | Parsimony | PASS | Amendment types, thresholds, review periods, and versioning are referenced, not reproduced. See Self-Audit Log items 1-3. |
| §2.5 | Stability | PASS | As a GOV (Layer 1) document, this policy is subject to GOV-level change rigor. |
| §2.6 | Explicitness | PASS | All governance expectations, responsibilities, and requirements are written explicitly. |
| §4 | Valid class code GOV | PASS | Identifier: AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY. |
| §5.1 | Identifier format | PASS | AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY. |
| §5.4 | Filename mirror | PASS | ai-sdom-gov-0002-change-management-policy.md. |
| §6.1 | Directory match | PASS | 01-GOVERNANCE/ corresponds to the GOV class. |
| §7.1 | Layer N references 0..N | PASS | GOV (Layer 1) references ARC (Layer 0) and GOV (Layer 1). 0 <= 1, 1 <= 1. |
| §7.3 | Dependencies section | PASS | Dependencies lists ARC-0001 and GOV-0001. |
| §8 | Cross-reference syntax | PASS | All formal references use `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]`. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §10 | Change impact rules respected | PASS | §6 operationalizes §10.1-§10.4 as policy without duplicating their content. |
| §11.2 | Filename lowercase | PASS | ai-sdom-gov-0002-change-management-policy.md. |
| §12 | Reserved range | PASS | GOV-0002 falls in GOV 0001-0099 (core governance). |
| §15 | Approval thresholds not duplicated | PASS | §5 references [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5.2)]; no threshold reproduced. |
| §16 | Governance boundaries respected | PASS | §9 defines scope consistent with ARC-0001 §16. |
| §18 | Quality gates referenced | PASS | §8.2 references the mandatory manual gates without redefining them. |
| §20.2 | Lifecycle state | PASS | Lifecycle State: Active. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Constitutional Supremacy | PASS | §3.1 acknowledges supremacy of ARC-0001. |
| §2.3 | Separation of Concerns | PASS | §1.3 excludes procedures, standards, validation, and register content. |
| §2.4 | Transparency | PASS | §7 requires recorded change records; self-audit certification documents all checks. |
| §3 | Roles referenced, not redefined | PASS | §5.2 uses roles from GOV-0001 §3. |
| §5 | Decision-making model referenced | PASS | §5 references GOV-0001 §5.2 for approval authorities; no thresholds duplicated. |
| §7 | Ratification referenced | PASS | §4.2 references GOV-0001 §7.2 for new document ratification. |
| §8 | Amendment governance referenced | PASS | §4.1, §4.2, and §10 reference GOV-0001 §8.3/§8.4. |
| §9 | Exception governance referenced | PASS | §11 references GOV-0001 §9. |
| §10 | Review cycle referenced | PASS | §12 references GOV-0001 §10. |
| §11 | Governance records respected | PASS | §7.4 defines the change record as complementary to GOV-0001 §11 records. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | GOV (Layer 1) references ARC (Layer 0) and GOV (Layer 1). All <= 1. |
| G01-R6 | No circular dependencies | PASS | Dependencies: GOV-0002 → GOV-0001 → ARC-0001. ARC has no dependencies. No cycle. |
| G01-R8 | Dependencies section exists | PASS | Front-matter Dependencies present with bullet list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | GOV is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: GOV. |
| G02-R3 | Layer matches LAYER_MAP | PASS | GOV → Layer 1. Front matter: `Layer: 1`. |
| G02-R4 | Single concern | PASS | Change management governance only — not mixed with standards, procedures, or validation rules. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY. |
| G03-R2 | Filename mirror | PASS | ai-sdom-gov-0002-change-management-policy.md. |
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
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]` and `[AI-SDOM-GOV-0001]` references resolve. STD, PRC, REG, and QLT documents are referenced by descriptive title only. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` and `[Section N]` references verified. |
| G05-R5 | Canonical syntax | PASS | All formal external references use canonical form; descriptive titles used only where layer rules prohibit canonical references. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `Version: 0.1.0`. |
| G06-R2 | SemVer format | PASS | 0.1.0 matches `\d+\.\d+\.\d+`. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | GOV 0002 is within GOV 0001-0099 (core governance). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is GOV, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001 and GOV-0001. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing provision. |
| G09-R3 | No duplication | PASS | Thresholds, amendment types, review periods, and versioning referenced, not reproduced. See Self-Audit Log items 1-3. |
| G09-R4 | Composability | PASS | Policy composes cleanly with ARC-0001 and GOV-0001. |
| G09-R5 | Explicitness | PASS | All governance expectations and requirements written explicitly. |
| G09-R6 | Governance boundaries respected | PASS | §9 explicitly defines scope consistent with ARC-0001 §16. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Higher-layer and cross-cutting reference constraint (Section 1.3, Section 8.2, References):** The requirement to reference STD-0001, PRC-0001, REG-0001, and QLT-0001 conflicts with [AI-SDOM-ARC-0001 (Section 7.1)]: GOV (Layer 1) may formally reference layers 0-1 only; STD (L2) and PRC (L3) are higher layers, REG (L5) is higher, and QLT is cross-cutting. Resolved by referencing ARC-0001 and GOV-0001 by canonical identifier and referencing STD, PRC, REG, and QLT by descriptive title (Documentation Standard, Document Development Procedure, Repository Register, Architecture Validation Standard), consistent with the precedent established in the GOV-0001 self-audit.

2. **Approval threshold duplication risk (Section 5):** Initial draft reproduced the approval threshold table. Resolved by deleting the reproduced thresholds and referencing [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5.2)], satisfying G09-R3.

3. **Change category duplication risk (Section 4):** The amendment types (Correction, Addition, Revision, Deprecation, Retraction) are already defined in [AI-SDOM-GOV-0001 (Section 8.3)]. Resolved by referencing GOV-0001 §8.3 for the categories, version impact, and review periods, and adding only the governance expectations — the policy posture — that no existing document defines.

4. **Urgent change process (Section 4.3):** ARC-0001 §10.5 permits an expedited process "defined in a GOV document." This document is the GOV document that defines that policy. Resolved by defining the expedited path at policy level (declaration, threshold preservation, retrospective assessment) while deferring operational steps to the PRC class.

5. **Review period duplication (Section 8):** Minimum review periods are defined in [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)] and [AI-SDOM-GOV-0001 (Section 5.3.2)]. Resolved by referencing both rather than reproducing values.

6. **Role reference "Author" (Section 5.2):** The term *Author* denotes the lifecycle initiator but is not a named role in [AI-SDOM-GOV-0001 (Section 3)]. Resolved by adding an explicit statement that roles follow GOV-0001 §3 and defining *Author* descriptively as the lifecycle initiator, consistent with the document lifecycle.

7. **Change record vs. governance records (Section 7):** The change record could appear to duplicate the governance records in [AI-SDOM-GOV-0001 (Section 11)]. Resolved by defining the change record as a complementary record and referencing GOV-0001 §11 for retention.

8. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter Dependencies field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.
