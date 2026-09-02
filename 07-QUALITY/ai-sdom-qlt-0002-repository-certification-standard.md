# Repository Certification Standard

**Identifier:** AI-SDOM-QLT-0002-REPOSITORY-CERTIFICATION-STANDARD  
**Version:** 0.1.0  
**Lifecycle State:** Active  
**Layer:** X (cross-cutting)  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT], [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY], [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY], [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD], [AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE], [AI-SDOM-REG-0001-REPOSITORY-REGISTER]  
**ai-assistance:** opencode (deepseek-v4-flash-free) 2026-07-31: initial draft

---

## 1. Purpose and Scope

1.1 This standard defines the certification framework that determines when AI-SDOM controlled documents and the repository itself are considered certified for release. It defines the certification levels, certification criteria, mandatory validation gate requirements, certification evidence, certification records, certification exceptions, certification review and renewal, and the certification status lifecycle.

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 18.2)], which requires every quality gate to be documented as a QLT document in 07-QUALITY, and operates within the governance framework established by [AI-SDOM-GOV-0001].

1.3 This standard applies to:
- Every governed document class defined in [AI-SDOM-ARC-0001 (Section 4)].
- Repository releases — versioned, tagged sets of governed documents published per [AI-SDOM-PRC-0001 (Section 12)].

1.4 This standard defines certification rules only. It SHALL NOT define:
- Validation rules and pass/fail criteria for architectural conformance (governed by the Architecture Validation Standard).
- Governance roles, approval thresholds, or decision rights (governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001]).
- Step-by-step operational instructions for performing certification (governed by the PRC class).
- Document structure, metadata, or content requirements (governed by [AI-SDOM-STD-0001]).
- Identifier allocation or document inventory (governed by the Repository Register (REG-0001)).

1.5 Certification status is a distinct concept from the document lifecycle state defined in [AI-SDOM-ARC-0001 (Section 20.2)] and [AI-SDOM-STD-0001 (Section 5)]. Lifecycle state records whether a document is in effect (Active, Deprecated, Retired); certification status records whether a document or repository release is certified for release [Section 3]. The two concepts SHALL NOT be conflated; their relationship is defined by the criteria in [Section 4] and [Section 5].

1.6 **Certification Gate Configuration.** Per [AI-SDOM-ARC-0001 (Section 18.2)] and [AI-SDOM-STD-0001 (Section 9.8.2)], this standard is itself a quality gate with the following configuration:

| Property | Value |
|----------|-------|
| What It Validates | Certification readiness of governed documents and repository releases |
| Pass/Fail Criteria | [Section 4] and [Section 5] |
| Classification | Hybrid — automated execution of the mandatory validation gates referenced in [Section 6]; manual certification review for evidence [Section 7], records [Section 8], and approval |
| Trigger | Pre-release; on certification events [Section 10.1]; periodic audit aligned with the governance review cycle [AI-SDOM-GOV-0001 (Section 10)] |
| Failure Action | Certification denied or demoted; release blocked until the criteria are satisfied [Section 11] |

---

## 2. Certification Principles

2.1 **Validation Precedes Certification.** No document or repository release SHALL attain the Release Candidate or Certified certification level unless all applicable mandatory validation gates defined in the Architecture Validation Standard have passed [Section 6]. Certification SHALL NOT substitute for validation.

2.2 **Evidence-Based Certification.** Certification SHALL be granted only on the basis of recorded evidence [Section 7]. A certification without evidence is void.

2.3 **Traceable Certification.** Every certification SHALL be traceable to the document version or release it certifies, the validation results on which it is based, and the recorded approval [AI-SDOM-ARC-0001 (Section 15.7)].

2.4 **Level Proportionate to Rigor.** Certification levels are ordered and cumulative [Section 3]. A higher certification level SHALL require all validation and evidence of every lower level plus the additional criteria defined for that level [Section 4, Section 5].

2.5 **Constitutional Supremacy.** This standard operates within [AI-SDOM-ARC-0001]. If any provision of this standard conflicts with [AI-SDOM-ARC-0001], the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

2.6 **Prospective Application.** Certification under this standard applies to documents and releases certified after this standard enters into force. Documents ratified before this standard entered into force retain their ratified status per [AI-SDOM-GOV-0001 (Section 7)] and SHALL be certified under this standard before they are released in any subsequent version [Section 11].

2.7 **Single Concern.** This standard addresses certification only. It SHALL NOT reproduce validation rules from the Architecture Validation Standard, governance policies from [AI-SDOM-GOV-0001] or [AI-SDOM-GOV-0002], or procedures from [AI-SDOM-PRC-0001]; it references them per the parsimony principle [AI-SDOM-ARC-0001 (Section 2.4)].

---

## 3. Certification Levels

3.1 Every governed document SHALL have exactly one certification level at any time [Section 4]. A repository release SHALL have exactly one certification level at any time [Section 5].

3.2 The certification levels are:

| Level | Designation | Meaning | Release-Readiness |
|-------|-------------|---------|-------------------|
| 0 | Draft | Working state. Structure or content incomplete; unresolved defects permitted. | Not releasable |
| 1 | Internal Review | Complete enough for internal review. Structural requirements satisfied; known issues recorded and tracked. | Not releasable |
| 2 | Release Candidate | All applicable mandatory validation gates have passed [Section 6]; evidence recorded [Section 7]; pending final approval [AI-SDOM-ARC-0001 (Section 15)]. | Releasable upon approval |
| 3 | Certified | All Release Candidate criteria plus complete certification evidence and record, recorded approval, and Active lifecycle state. | Releasable |

3.3 Certification levels are ordered and cumulative: `Draft < Internal Review < Release Candidate < Certified`. A document or release MAY progress only to the next higher level and only when the criteria for that level are satisfied [Section 4, Section 5].

3.4 A document in the Deprecated or Retired lifecycle state [AI-SDOM-ARC-0001 (Section 20.2)] SHALL NOT attain the Release Candidate or Certified level.

3.5 Certification is version-scoped. A certification SHALL apply to a specific document version or release designation. A change to the certified content or dependencies SHALL invalidate the certification at that version [Section 11].

---

## 4. Certification Criteria for Documents

4.1 A document attains each certification level only when every criterion for that level is satisfied. The criteria are cumulative; a level's criteria include all criteria of every lower level.

| Level | Criteria (all SHALL be satisfied) | Fail Conditions |
|-------|-----------------------------------|-----------------|
| 0 — Draft | Identifier and filename conform to [AI-SDOM-ARC-0001 (Section 5)]; file resides in the directory mapped to its class [AI-SDOM-ARC-0001 (Section 6)]. | Non-conformant identifier, filename, or directory placement. |
| 1 — Internal Review | All Draft criteria; front matter complete per [AI-SDOM-STD-0001 (Section 3)]; mandatory sections present per [AI-SDOM-STD-0001 (Section 8)]; Dependencies section correct per [AI-SDOM-ARC-0001 (Section 7.3)]; no unresolved structural defects. | Missing metadata, missing mandatory section, or unresolved structural defect. |
| 2 — Release Candidate | All Internal Review criteria; all applicable mandatory validation gates defined in the Architecture Validation Standard have passed [Section 6]; version set per [AI-SDOM-ARC-0001 (Section 9)]; Self-Audit Log complete per [AI-SDOM-STD-0001 (Section 8.4)]; document registered in the Repository Register (REG-0001). | Any gate failure, unresolved finding, missing or malformed version, or unregistered document. |
| 3 — Certified | All Release Candidate criteria; certification evidence complete [Section 7]; certification record created [Section 8]; approval recorded per [AI-SDOM-ARC-0001 (Section 15.7)]; lifecycle state Active [AI-SDOM-ARC-0001 (Section 20.2)]. | Missing evidence or record, approval not recorded, or lifecycle state not Active. |

4.2 A document SHALL NOT attain a certification level whose criteria it does not satisfy. A document whose criteria satisfaction changes SHALL be re-evaluated per the certification status lifecycle [Section 11].

4.3 The criteria in [Section 4.1] are the pass/fail criteria of this quality gate. Their verification uses the applicable automated and manual gates of the Architecture Validation Standard together with the certification records required in [Section 8].

---

## 5. Certification Criteria for Repository Releases

5.1 A repository release SHALL attain the Certified level before publication per [AI-SDOM-PRC-0001 (Section 12)].

5.2 A repository release SHALL attain the Certified level only when all of the following criteria are satisfied:

| # | Criterion | Pass | Fail |
|---|-----------|------|------|
| R1 | Document certification | Every governed document included in the release has attained the Certified level [Section 4]. | Any included document below the Certified level. |
| R2 | Mandatory validation gates | All applicable mandatory validation gates defined in the Architecture Validation Standard have passed for the release as a whole [Section 6]. | Any gate failure. |
| R3 | Register currency | The Repository Register (REG-0001) records the released documents, versions, lifecycle states, and dependencies. | Missing or stale register entries. |
| R4 | Versioning and tagging | Release version and Git tag conform to [AI-SDOM-ARC-0001 (Section 9.5, Section 11.6)]. | Missing or mismatched version or tag. |
| R5 | No release-blocking findings | No open release-blocking finding remains unresolved. A finding is release-blocking when it corresponds to a failed mandatory gate [Section 6] or an unresolved review finding [AI-SDOM-GOV-0002 (Section 8.4)]. | Open release-blocking finding. |
| R6 | Evidence and records | Certification evidence [Section 7] and certification records [Section 8] are complete for the release. | Missing evidence or records. |
| R7 | Traceability | Each released document version traces to its change record per [AI-SDOM-GOV-0002 (Section 7)]. | Missing traceability chain. |

5.3 A release-scope exception MAY exclude a non-certified document from a release per [Section 9].

5.4 The repository itself is considered certified for release when the current state of the main branch satisfies the release certification criteria in [Section 5.2].

---

## 6. Mandatory Validation Gate Requirements

6.1 The mandatory validation gates applicable to certification are the gates defined in the Architecture Validation Standard. This standard does not define validation rules; it references them per the parsimony principle [AI-SDOM-ARC-0001 (Section 2.4)].

6.2 A document or repository release SHALL NOT attain the Release Candidate or Certified level unless all applicable mandatory validation gates defined in the Architecture Validation Standard have passed.

6.3 The mandatory automated gates are those listed in [AI-SDOM-ARC-0001 (Section 18.3)]: identifier uniqueness, reference resolution, dependency acyclicity, naming compliance, and layer compliance. The mandatory manual gates are those listed in [AI-SDOM-ARC-0001 (Section 18.4)]: content review, contract compliance, and consistency review.

6.4 This standard SHALL NOT modify the pass/fail criteria of any gate defined in the Architecture Validation Standard. Changes to gate pass/fail criteria are governed by the QLT class and require approval per [AI-SDOM-ARC-0001 (Section 15.6)].

6.5 A gate failure SHALL be recorded as an unresolved finding and SHALL constrain the certification level to no higher than the level whose criteria remain satisfied [Section 11].

---

## 7. Certification Evidence Requirements

7.1 Certification SHALL be supported by recorded evidence. Evidence SHALL be retained per the governance record retention requirements in [AI-SDOM-GOV-0001 (Section 11)].

7.2 The minimum evidence required for the Certified level:

| # | Evidence | Source |
|---|----------|--------|
| 1 | Validation results | Output of the applicable gates defined in the Architecture Validation Standard [AI-SDOM-ARC-0001 (Section 18)] |
| 2 | Self-audit record | Self-Audit Log per [AI-SDOM-STD-0001 (Section 8.4)] |
| 3 | Review record | Review findings and resolutions per [AI-SDOM-GOV-0002 (Section 8)] |
| 4 | Approval record | Recorded approval per [AI-SDOM-ARC-0001 (Section 15.7)] |
| 5 | Registration record | Repository Register (REG-0001) entry |
| 6 | Version and tag evidence | Git tag matching the front-matter version per [AI-SDOM-ARC-0001 (Section 9.5, Section 11.6)] |

7.3 Evidence SHALL be contemporaneous with the certification event. Retrospective evidence SHALL be justified and recorded as a certification exception [Section 9].

7.4 Evidence quality: machine-generated evidence (for example, automated gate output) SHALL be recorded in machine-readable form; human-generated evidence (for example, review findings) SHALL be recorded in human-readable form. Evidence SHALL be sufficient for an independent reviewer to verify the certification without re-executing it.

---

## 8. Certification Records

8.1 Every certification SHALL produce a certification record. The certification record SHALL contain at minimum:
- The certified document identifier(s) or release designation and version.
- The certification level attained and the date of attainment.
- The criteria satisfied, mapped to the evidence [Section 7].
- The applicable validation gate results [Section 6].
- Any certification exception applied [Section 9].
- The recorded approval reference [AI-SDOM-ARC-0001 (Section 15.7)].

8.2 Certification records SHALL be retained per the governance record requirements in [AI-SDOM-GOV-0001 (Section 11)]. They complement and do not replace the governance records defined therein.

8.3 The certification record SHALL reference the Repository Register (REG-0001) entry for the certified document. The register SHALL record the version and lifecycle state of each certified document per its update procedure.

8.4 A dedicated certification register MAY be established as a REG filled-registry entry per [AI-SDOM-ARC-0001 (Section 12)] (REG 1000-9999) when the volume of certification records justifies it. Until such a register exists, certification records SHALL be retained as governance records per [Section 8.2].

---

## 9. Certification Exceptions

9.1 An exception to a certification criterion of this standard is a documented deviation from a requirement of this standard. Certification exceptions SHALL be granted, duration-limited, and recorded per the exception governance in [AI-SDOM-GOV-0001 (Section 9)].

9.2 The recognized certification exception scopes are:

| Scope | Criterion Waived | Required Content |
|-------|------------------|------------------|
| Evidence | An evidence requirement in [Section 7] | The evidence waived, any substituted evidence, and the justification. |
| Release-scope | Release criterion R1 in [Section 5] (exclusion of a non-certified document) | The excluded document and the reason for exclusion. |

9.3 A certification exception SHALL NOT:
- Waive a mandatory validation gate required for merge per [AI-SDOM-ARC-0001 (Section 18.3)].
- Deviate from [AI-SDOM-ARC-0001]. Constitutional exceptions are not permitted; such situations require an amendment to [AI-SDOM-ARC-0001] per [AI-SDOM-GOV-0001 (Section 9.5)].

9.4 A certification exception expires at the end of its granted duration [AI-SDOM-GOV-0001 (Section 9.4)]. Renewal requires a new exception per [AI-SDOM-GOV-0001 (Section 9.4)]. Upon expiry, the certification level SHALL revert to the highest level whose criteria are satisfied without the exception [Section 11].

---

## 10. Certification Review and Renewal

10.1 Certification review SHALL be triggered by:
- Any change to a certified document or release per the change categories in [AI-SDOM-GOV-0002 (Section 4)].
- The annual governance review cycle in [AI-SDOM-GOV-0001 (Section 10)].
- A periodic certification audit of the certification records [Section 8].

10.2 Certification statuses SHALL be reviewed at least annually, aligned with the annual governance review cycle in [AI-SDOM-GOV-0001 (Section 10)].

10.3 Renewal: a certification renewed after review SHALL satisfy the same criteria as the initial certification for the same level [Section 4, Section 5].

10.4 If a certification has not been reviewed within 12 months of the last review, it SHALL revert to the Release Candidate level pending re-review.

10.5 Review findings SHALL be resolved before renewal. Unresolved findings block renewal per [AI-SDOM-GOV-0002 (Section 8.4)].

---

## 11. Certification Status Lifecycle

11.1 The certification status lifecycle is:

```
Draft → Internal Review → Release Candidate → Certified
   ↑            ↑                   ↑               ↑
   └────────────┴───────────────────┴───────────────┘
        (regression: revert to the highest level whose criteria are satisfied)
```

11.2 **Promotion.** A document or release SHALL advance from a lower to the next higher certification level only when the criteria for the higher level are satisfied [Section 4, Section 5].

11.3 **Regression.** A certification SHALL revert to the highest certification level whose criteria remain satisfied when any of the following occurs:
- A change to the certified content or dependencies per [AI-SDOM-GOV-0002 (Section 4)].
- A mandatory validation gate defined in the Architecture Validation Standard fails [Section 6].
- A certification exception expires [Section 9.4].
- The certification review finds non-compliance [Section 10].
- The document's lifecycle state changes to Deprecated or Retired [Section 3.4].

11.4 **Version scoping.** Certification SHALL NOT transfer between versions. A changed document or release SHALL be re-certified at its new version per [Section 10.1]; its certification level SHALL be determined by its satisfaction of the criteria in [Section 4] and [Section 5] at the new version.

11.5 **Recording.** A demotion or promotion SHALL be recorded in the certification record [Section 8] and reflected in the Repository Register (REG-0001) per its update procedure.

---

## 12. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Constitutional basis. Quality gate architecture (§18), dependency rules (§7), governance boundaries (§16), versioning (§9), lifecycle states (§20), and approval principles (§15). |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Approval thresholds (§5.2), exception governance (§9), review cycle (§10), and governance records (§11). |
| [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY] | Change governance. Change categories (§4), traceability (§7), and review expectations (§8) that trigger re-certification. |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Document structure. Metadata (§3), mandatory sections (§8), and Self-Audit Log (§8.4) referenced by the certification criteria. |
| [AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE] | Operational lifecycle. Publication (Phase 7, §12) referenced by the release certification criteria. |
| [AI-SDOM-REG-0001-REPOSITORY-REGISTER] | Record authority. Document inventory and identifier allocation referenced by the certification criteria and records. |
| Architecture Validation Standard (07-QUALITY) | Source of the mandatory validation gates referenced in [Section 6]. Referenced descriptively per the QLT isolation rule [AI-SDOM-ARC-0001 (Section 7.2)]. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-07-31 | —      | Initial repository certification standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001] and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure certification quality standard. §1.4 excludes validation, governance, procedure, structure, and register content. |
| §2.2 | Traceability to ARC-0001 | PASS | Every normative section cites the authorizing ARC-0001, GOV-0001, GOV-0002, STD-0001, PRC-0001, or REG-0001 provision. |
| §2.4 | Parsimony | PASS | Mandatory validation gates referenced, not reproduced [§6]; governance processes referenced, not redefined [§9, §10]. |
| §2.6 | Explicitness | PASS | All certification rules, criteria, and transitions written as normative statements. |
| §4 | Valid class code QLT | PASS | Identifier: AI-SDOM-QLT-0002-REPOSITORY-CERTIFICATION-STANDARD. |
| §5.1 | Identifier format | PASS | AI-SDOM-QLT-0002-REPOSITORY-CERTIFICATION-STANDARD. |
| §5.4 | Filename mirror | PASS | ai-sdom-qlt-0002-repository-certification-standard.md. |
| §6.1 | Directory match | PASS | 07-QUALITY/ corresponds to the QLT class. |
| §7.2 | Cross-cutting reference scope | PASS | QLT-0002 references layered documents only by canonical identifier; the Architecture Validation Standard is referenced descriptively. |
| §7.3 | Dependencies section | PASS | Present, lists ARC-0001, GOV-0001, GOV-0002, STD-0001, PRC-0001, REG-0001. |
| §8 | Cross-reference syntax | PASS | All formal references use `[AI-SDOM-CLASS-NNNN]` canonical form. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-qlt-0002-repository-certification-standard.md. |
| §12 | Reserved range | PASS | QLT-0002 falls in QLT 0001-0099 (gate definitions). |
| §18.2 | QLT gate documentation requirements | PASS | §1.6 specifies what this gate validates, pass/fail criteria, classification, trigger, and failure action. |
| §20.2 | Lifecycle state | PASS | Lifecycle State: Active. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Downward dependency constraint (layered classes) | N/A | QLT is cross-cutting; this rule applies to layered classes only. |
| G01-R2 | Cross-cutting dependency scope | PASS | All dependencies are layered documents (ARC, GOV, STD, PRC, REG). No cross-cutting dependency. |
| G01-R3 | ADR-to-ADR isolation | N/A | This document is QLT, not ADR. |
| G01-R4 | QLT-to-QLT isolation | PASS | Dependencies contains no QLT identifier. The Architecture Validation Standard is referenced by descriptive title only. |
| G01-R5 | ADR-QLT mutual isolation | PASS | No ADR dependency and no ADR-QLT cross-reference. |
| G01-R6 | Acyclicity | PASS | QLT-0002 → ARC-0001/GOV-0001/GOV-0002/STD-0001/PRC-0001/REG-0001; no document references QLT-0002; no cycle. |
| G01-R7 | QLT lists documents it validates | PASS | Dependencies lists ARC-0001, GOV-0001, GOV-0002, STD-0001, PRC-0001, REG-0001 — the documents whose certification readiness this standard validates. |
| G01-R8 | Dependencies section exists | PASS | Front-matter Dependencies present with a bullet list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | QLT is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: QLT. |
| G02-R3 | Layer matches taxonomy | PASS | Cross-cutting class; front matter contains `Layer: X`. |
| G02-R4 | Single concern | PASS | Repository certification only — no validation rules, governance, or procedures mixed in. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-QLT-0002-REPOSITORY-CERTIFICATION-STANDARD. |
| G03-R2 | Filename mirror | PASS | ai-sdom-qlt-0002-repository-certification-standard.md. |
| G03-R3 | No duplicate identifier | PASS | No other document uses this identifier. |
| G03-R4 | Identifier not reassigned | PASS | First assignment. |
| G03-R5 | Not in retired register | PASS | Retired register is empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | Directory matches class | PASS | 07-QUALITY/ maps to the QLT class. |
| G04-R2 | Within numbered directory | PASS | File resides in 07-QUALITY/. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]`, `[AI-SDOM-GOV-0001]`, `[AI-SDOM-GOV-0002]`, `[AI-SDOM-STD-0001]`, `[AI-SDOM-PRC-0001]`, and `[AI-SDOM-REG-0001]` references resolve. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` and `[Section N]` references verified. |
| G05-R4 | Cross-class reference compliance | PASS | Canonical references limited to layered classes per [AI-SDOM-ARC-0001 (Section 7.2)]; the Architecture Validation Standard referenced descriptively. |
| G05-R5 | Canonical syntax | PASS | All formal external references use canonical form. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `Version: 0.1.0`. |
| G06-R2 | SemVer format | PASS | 0.1.0 matches `\d+\.\d+\.\d+`. |
| G06-R5 | QLT version inclusion | PASS | QLT carries a version field, 0.1.0. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | QLT 0002 is within QLT 0001-0099 (gate definitions). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is QLT, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001, GOV-0001, GOV-0002, STD-0001, PRC-0001, and REG-0001. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing provision. |
| G09-R3 | No duplication | PASS | Mandatory validation gates referenced to the Architecture Validation Standard, not reproduced [§6]; governance processes referenced, not redefined [§9, §10]. |
| G09-R4 | Composability | PASS | Certification framework composes cleanly with the lifecycle state model [AI-SDOM-ARC-0001 (Section 20.2)], change governance [AI-SDOM-GOV-0002], and the publish phase [AI-SDOM-PRC-0001 (Section 12)]. |
| G09-R5 | Explicitness | PASS | All certification criteria, levels, transitions, and evidence requirements written explicitly. |
| G09-R6 | Governance boundary respect | PASS | No governance roles, approval thresholds, decision rights, or operational procedures defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R1 | No unauthorized identifier assignment | PASS | Identifier QLT-0002 drawn from the register's next-available table (0002). |
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **QLT-to-QLT isolation (Section 6, Section 12):** The requirement to reference the Architecture Validation Standard by identifier conflicts with [AI-SDOM-ARC-0001 (Section 7.2)] and gate G01-R4, which prohibit a QLT from referencing another QLT. Resolved by referencing the Architecture Validation Standard by descriptive title only and excluding it from the Dependencies section, consistent with the precedent established in the GOV-0001 self-audit.

2. **Certification vs lifecycle state conflation (Section 1.5, Section 3.4):** An early draft risked conflating certification levels with the document lifecycle states defined in [AI-SDOM-ARC-0001 (Section 20.2)]. Resolved by explicitly distinguishing the two concepts in Section 1.5 and constraining Deprecated and Retired documents in Section 3.4.

3. **Validation rule duplication risk (Section 6):** An initial draft described gate pass/fail behavior. Resolved by referencing the mandatory gates in [AI-SDOM-ARC-0001 (Section 18.3, Section 18.4)] and the Architecture Validation Standard descriptively, satisfying G09-R3.

4. **Governance process duplication risk (Section 9, Section 10):** An initial draft assigned exception granting authorities and defined a new review cycle. Resolved by referencing the exception governance in [AI-SDOM-GOV-0001 (Section 9)] and the governance review cycle in [AI-SDOM-GOV-0001 (Section 10)], defining only the certification-specific exception scopes and review triggers.

5. **Gate exception scope (Section 9):** An initial exception type permitted certification despite a failed mandatory gate. This contradicted [AI-SDOM-ARC-0001 (Section 18.3)], which requires mandatory gates to pass before merge. Resolved by removing the gate exception type and prohibiting exceptions that waive mandatory validation gates.

6. **Procedural duplication risk (Section 5):** Release certification criteria risked describing publication steps. Resolved by referencing the publish phase in [AI-SDOM-PRC-0001 (Section 12)] and defining only the pass/fail criteria for release certification.

7. **Retroactive certification of ratified documents (Section 2.6):** ARC-0001 and QLT-0001 were ratified before this standard existed. Resolved by applying the framework prospectively: existing ratified documents retain their ratified status and SHALL be certified before any subsequent release.

8. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter Dependencies field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.
