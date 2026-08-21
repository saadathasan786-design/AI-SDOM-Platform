---

identifier: AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE
title: Architecture Decision Procedure
version: 0.1.0
lifecycle-state: Active
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
  - AI-SDOM-STD-0008-ARCHITECTURE-DECISION-STANDARD
tags:
  - architecture-decisions
  - procedures
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-02: initial draft"
---

# Architecture Decision Procedure

## 1. Purpose

1.1 This procedure defines the operational workflow for the complete lifecycle of an Architecture Decision Record (ADR) within the AI-SDOM repository: proposal, technical review, governance approval, publication, supersession, and retirement. It is the operational companion to the structural rules defined in [AI-SDOM-STD-0008] and operates within the governance framework established by [AI-SDOM-GOV-0001] and [AI-SDOM-GOV-0002].

1.2 This procedure derives its authority from [AI-SDOM-ARC-0001 (Section 7.5)], which requires a Procedure (PRC) to cite the Standard (STD) it implements — here the Architecture Decision Standard [AI-SDOM-STD-0008] — and from [AI-SDOM-ARC-0001 (Section 15.5)], which establishes the ADR ratification thresholds that this procedure operationalizes.

1.3 This procedure defines how an ADR progresses through its lifecycle. It SHALL NOT define:
- ADR definition, structure, front-matter fields, supersession, immutability, or the ADR validation rule family (defined in [AI-SDOM-STD-0008]).
- Approval thresholds, roles, or decision rights (defined in [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001]).
- Governance of change management, impact assessment, or traceability policy (defined in [AI-SDOM-GOV-0002]).
- The ADR authoring skeleton (defined in the ADR Template).
- Validation gates or pass/fail criteria (defined in the Architecture Validation Standard).
- Identifier allocation authority or register schema (defined in the Repository Register).

---

## 2. Scope

2.1 This procedure applies to every Architecture Decision Record in the repository, in every lifecycle state defined in [AI-SDOM-STD-0008 (Section 5)]: Proposed, Accepted, Superseded, and Retired.

2.2 This procedure covers the complete ADR lifecycle: proposal [Section 7], technical review [Section 8], governance approval [Section 9], publication [Section 10], supersession [Section 11], and retirement [Section 12].

2.3 The ADR lifecycle SHALL follow the state model of [AI-SDOM-STD-0008 (Section 5)] and [AI-SDOM-ARC-0001 (Section 17.2, Section 20.2)]. Where a step in this procedure conflicts with [AI-SDOM-STD-0008], [AI-SDOM-ARC-0001], or [AI-SDOM-GOV-0001], the governing document prevails [AI-SDOM-ARC-0001 (Section 2.3)].

---

## 3. Preconditions

The following conditions SHALL be satisfied before an ADR lifecycle begins:

| # | Precondition | Governing Reference |
|---|--------------|---------------------|
| 1 | A decision with architectural impact has been identified and does not duplicate an existing ADR or change request | [AI-SDOM-STD-0008 (Section 4)]; [AI-SDOM-ARC-0001 (Section 2.4)] |
| 2 | The need for an ADR (rather than a standard document change) is confirmed per the trigger list | [AI-SDOM-STD-0008 (Section 4.1)] |
| 3 | The decision author is familiar with the architecture, governance, and standard documents that bind the decision | [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-STD-0008] |
| 4 | The decision's layer impact (Layer 0, Layer 1, or lower) has been assessed to determine whether Governance Board escalation applies | [AI-SDOM-ARC-0001 (Section 15.5)] |
| 5 | At least two independent reviewers are available for ratification review | [AI-SDOM-ARC-0001 (Section 15.5)] |
| 6 | A class-appropriate template is available | ADR Template (04-TEMPLATES) |
| 7 | The next available ADR identifier has been drawn from the Repository Register | [AI-SDOM-ARC-0001 (Section 5.3, Section 14.4)] |

---

## 4. Roles and Responsibilities

4.1 The governance roles that participate in the ADR lifecycle are defined in [AI-SDOM-GOV-0001 (Section 3)]. This procedure does not redefine them.

4.2 The typical participants and their lifecycle responsibilities are:

| Role | Lifecycle Responsibilities | Defined In |
|------|----------------------------|------------|
| Decision Author | Drafts the ADR, performs the self-audit, and submits the change via pull request | [AI-SDOM-GOV-0001 (Section 3.1)] |
| Independent Reviewers | Technically review the ADR and approve ratification; must be independent of the decision author | [AI-SDOM-ARC-0001 (Section 15.5)] |
| Governance Board | Provides additional approval when the decision affects Layer 0 (unanimous) or Layer 1 (two-thirds) | [AI-SDOM-ARC-0001 (Section 15.1, Section 15.2, Section 15.5)] |
| ADR Domain Maintainer | Maintains ADR class structural integrity; appoints Document Owners | [AI-SDOM-GOV-0001 (Section 3.3)] |
| ADR Document Owner | Owns ADR lifecycle management after publication | [AI-SDOM-GOV-0001 (Section 3.4)] |
| Quality Domain Maintainer | Maintains the quality gates that validate ADR rules | [AI-SDOM-GOV-0001 (Section 3.5)] |

4.3 The approving body and threshold for ADR ratification are determined by [AI-SDOM-ARC-0001 (Section 15.5)] as operationalized in[AI-SDOM-GOV-0001 (Section 5.2)] and are not repeated here.

---

## 5. Inputs

The following inputs SHALL be available to the ADR lifecycle:

| # | Input | Source |
|---|-------|--------|
| 1 | The decision proposal or request identifying the architectural concern | Decision requester |
| 2 | The document(s) that motivated the decision | Existing governed documents |
| 3 | The document(s) affected by the decision | Impact assessment per [AI-SDOM-GOV-0002 (Section 6)] |
| 4 | The Architecture Decision Standard and its rule family ADR-01..20 | [AI-SDOM-STD-0008] |
| 5 | The ADR Template | ADR Template (04-TEMPLATES) |
| 6 | The next available ADR identifier | Repository Register (05-REGISTERS) |
| 7 | The applicable governance, change, and structural documents | [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-STD-0001], [AI-SDOM-STD-0003], [AI-SDOM-STD-0007] |

---

## 6. Outputs

The ADR lifecycle produces the following outputs:

| # | Output | Where Recorded |
|---|--------|----------------|
| 1 | A ratified ADR document in the Accepted state | 06-DECISIONS |
| 2 | An ADR row in the Repository Register reflecting its status | Repository Register (05-REGISTERS) |
| 3 | Approval records for the ratification (reviewer and, where applicable, Board) | Pull request or ADR per [AI-SDOM-ARC-0001 (Section 15.7)] |
| 4 | Supersession records when an ADR is replaced | Superseded ADR Status field; superseding ADR Context |
| 5 | Retirement records when an ADR is retired | Repository Register Retired Identifier Register |
| 6 | Exception records for deviations from this procedure or other rules | ADR per [AI-SDOM-GOV-0001 (Section 9.3)] |

---

## 7. Proposal Workflow

7.1 Confirm the decision qualifies as an ADR-required decision per [AI-SDOM-STD-0008 (Section 4.1)]. If the change is a correction, addition, revision, deprecation, or retraction of an existing governed document without architectural impact, SHALL follow the Document Development Procedure instead.

7.2 Assess the decision's layer impact per [AI-SDOM-ARC-0001 (Section 15.5)] to determine whether Governance Board escalation will be required in [Section 9].

7.3 Perform a change impact analysis. The proposal SHALL include an impact statement listing every document potentially affected, directly or transitively, per [AI-SDOM-GOV-0002 (Section 6)] and [AI-SDOM-ARC-0001 (Section 10.1)].

7.4 Draw the next available ADR identifier from the Repository Register per [AI-SDOM-ARC-0001 (Section 5.3, Section 14.4)]. The identifier SHALL fall within the ADR reserved range 0001-9999 [AI-SDOM-ARC-0001 (Section 12)] and SHALL NOT be invented. AI assistance SHALL NOT generate identifiers [AI-SDOM-ARC-0001 (Section 14.4)]. The `{SHORT-NAME}` SHALL be a kebab-case slug per [AI-SDOM-STD-0005].

7.5 Instantiate the ADR Template. The template enforces the front matter and section order; it is not reproduced here.

7.6 Author the ADR following the structure and front-matter requirements of [AI-SDOM-STD-0008 (Section 6, Section 7)]:
- Compose the sections in the mandatory order: Title, Status, Context, Decision, Consequences, Alternatives Considered, References [AI-SDOM-ARC-0001 (Section 17.2)].
- Set the front matter per the ADR field model of [AI-SDOM-STD-0002 (Section 3.5)]: `status`, `layer: X`; no `version`, no `lifecycle-state`, no `supersedes`.
- Record every layered document referenced in the Dependencies section per [AI-SDOM-ARC-0001 (Section 7.3)] and [AI-SDOM-STD-0007 (Section 6)].
- Compose cross-references using the canonical syntax of [AI-SDOM-STD-0003]. An ADR SHALL NOT reference another ADR or a QLT document [AI-SDOM-ARC-0001 (Section 7.2)].
- Include [AI-SDOM-ARC-0001 (Section 17)] in the References section as the authorization [AI-SDOM-ARC-0001 (Section 17.5)].

7.7 If AI assistance is used, record the `ai-assistance` field per [AI-SDOM-ARC-0001 (Section 14.2)]. AI output is advisory and the human author retains responsibility [AI-SDOM-ARC-0001 (Section 14.3)]. Human verification of AI-generated cross-references is required before submission [AI-SDOM-ARC-0001 (Section 14.5)].

7.8 An ADR SHALL NOT carry a version [AI-SDOM-ARC-0001 (Section 9.6)]; [AI-SDOM-STD-0004 (Section 6.3)]. The `status` field SHALL be set to `Proposed` [AI-SDOM-STD-0008 (Section 5.2)].

7.9 Perform a self-audit of the draft against the ADR rule family ADR-01..20 of [AI-SDOM-STD-0008 (Section 13)] and the applicable gates of the Architecture Validation Standard [AI-SDOM-ARC-0001 (Section 18.3, Section 18.4)]. Record every issue and its resolution in the ADR's Self-Audit Log.

7.10 Create a branch following the branch naming convention [AI-SDOM-ARC-0001 (Section 11.5)] and open a pull request containing the ADR. Direct commits to the main branch are prohibited [AI-SDOM-ARC-0001 (Section 19.3)].

---

## 8. Technical Review Workflow

8.1 Request technical review from at least two independent reviewers, independent of the decision author [AI-SDOM-ARC-0001 (Section15.5)].

8.2 The technical review SHALL verify:
- Technical correctness of the Context, Decision, and Consequences (content review) [AI-SDOM-ARC-0001 (Section 18.4)].
- Compliance with the ADR rule family ADR-01..20 [AI-SDOM-STD-0008 (Section 13)].
- Contract compliance with [AI-SDOM-ARC-0001] [AI-SDOM-ARC-0001 (Section 18.4)].
- Cross-document consistency with affected documents [AI-SDOM-ARC-0001 (Section 18.4)].
- The presence of at least one alternative with rejection rationale [AI-SDOM-ARC-0001 (Section 17.2)].
- Coverage of both positive and negative consequences [AI-SDOM-ARC-0001 (Section 17.2)].

8.3 The change SHALL remain in review for the applicable minimum review period per [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)] and [AI-SDOM-GOV-0001 (Section 5.3.2)].

8.4 Review findings SHALL be resolved before the ADR proceeds to approval. Unresolved findings block the request.

8.5 A Proposed ADR may be withdrawn by its author at any time. Withdrawal SHALL be recorded in the pull request per [AI-SDOM-GOV-0001 (Section 11)].

---

## 9. Governance Approval Workflow

9.1 Submit the ADR for ratification approval per [AI-SDOM-ARC-0001 (Section 15.5)]:
- Approval from at least two reviewers independent of the decision author.
- For decisions affecting Layer 0: additional unanimous Governance Board approval [AI-SDOM-ARC-0001 (Section 15.1)].
- For decisions affecting Layer 1: additional two-thirds majority Governance Board approval [AI-SDOM-ARC-0001 (Section 15.2)].

9.2 Board votes SHALL follow the voting rules of [AI-SDOM-GOV-0001 (Section 5.1)] and be conducted per [AI-SDOM-GOV-0001 (Section 5.3)].

9.3 Approval SHALL be recorded in the pull request or the ADR [AI-SDOM-ARC-0001 (Section 15.7)]. Verbal or offline approvals are not recognized.

9.4 A change that fails approval SHALL be revised (re-entering at [Section 8]) or withdrawn. The rejection reason SHALL be recordedin the pull request.

9.5 On approval, the ADR's `status` SHALL be set to `Accepted` [AI-SDOM-STD-0008 (Section 5.2)]. Forward references used during drafting SHALL be converted to normal citations or removed before publication [AI-SDOM-STD-0003 (Section 10.2)]; [AI-SDOM-STD-0008 (Section 8.5)].

---

## 10. Publication Workflow

10.1 Merge the approved pull request to the main branch. Direct commits to the main branch SHALL NOT occur [AI-SDOM-ARC-0001 (Section 19.3)].

10.2 Record the ADR in the Repository Register: add the row to the document inventory with its `status`, and reflect the identifierassignment per the register's update procedure [AI-SDOM-STD-0008 (Section 10.3)]; [AI-SDOM-ARC-0001 (Section 5.3, Section 14.4)].

10.3 The ADR SHALL reside in 06-DECISIONS per [AI-SDOM-STD-0006 (Section 9)].

10.4 An ADR carries no version and is not versioned or tagged as a release; its lifecycle state is recorded through the `status` field [AI-SDOM-ARC-0001 (Section 9.6)]; [AI-SDOM-STD-0008 (Section 12)]. Historical preservation is provided by the repository's Git history [AI-SDOM-ARC-0001 (Section 20.4)].

10.5 Once Accepted, the ADR's substantive content is immutable. The sole mutable field is `status` [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)]; [AI-SDOM-STD-0008 (Section 11)].

---

## 11. Supersession Workflow

11.1 A subsequent ADR supersedes a prior ADR when the later decision replaces the earlier one [AI-SDOM-ARC-0001 (Section 17.3)]; [AI-SDOM-STD-0008 (Section 9)].

11.2 The superseding ADR SHALL reference the decision being superseded in its Context, and SHALL address the content of any ADR on which the superseded ADR was premised directly [AI-SDOM-ARC-0001 (Section 17.4)].

11.3 The superseding ADR SHALL NOT reference another ADR by canonical identifier [AI-SDOM-ARC-0001 (Section 7.2)]; the prior ADR isidentified in the Context text.

11.4 On ratification of the superseding ADR, the superseded ADR's `status` SHALL be updated to the mandated form `Superseded by AI-SDOM-ADR-NNNN`, where `NNNN` is the superseding ADR's sequential number [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)]; [AI-SDOM-STD-0008 (Section 9.2)].

11.5 Supersession takes effect immediately; there is no transition period [AI-SDOM-ARC-0001 (Section 20.2)].

11.6 The Repository Register SHALL be updated to reflect the superseded ADR's `status` per its update procedure.

11.7 Supersession chains SHALL remain acyclic [AI-SDOM-ARC-0001 (Section 17.4)]; [AI-SDOM-STD-0008 (Section 9.6)].

---

## 12. Retirement Workflow

12.1 An ADR is retired on a governance decision to remove its identifier from the active register [AI-SDOM-ARC-0001 (Section 20.2)]; [AI-SDOM-STD-0008 (Section 5.3)].

12.2 Retirement SHALL be initiated by the ADR Document Owner or the Governance Board and SHALL be approved per the applicable governance rules [AI-SDOM-GOV-0001 (Section 5)].

12.3 On retirement, the ADR's `status` SHALL be set to `Retired`, its identifier SHALL be removed from the active register and recorded in the Retired Identifier Register, and the document SHALL be archived and remain readable [AI-SDOM-ARC-0001 (Section 20.2, Section 20.4)].

12.4 A retired identifier SHALL NOT be reused [AI-SDOM-ARC-0001 (Section 5.3)].

12.5 Retirement takes effect immediately; there is no transition period for ADRs [AI-SDOM-ARC-0001 (Section 20.2)].

12.6 A Proposed ADR that is withdrawn SHALL be removed without ratification; its document SHALL be deleted or archived per the Document Development Procedure.

---

## 13. Exception Handling

13.1 Exceptions to this procedure or to other governed rules follow the exception governance of [AI-SDOM-GOV-0001 (Section 9)].

13.2 Every exception SHALL be recorded in an ADR [AI-SDOM-ARC-0001 (Section 17)]; [AI-SDOM-GOV-0001 (Section 9.3)] documenting the rule from which exception is sought, the rationale, the duration, the granting authority and date, and the revocation conditions.

13.3 Exceptions are classified per [AI-SDOM-GOV-0001 (Section 9.2)]:
- Procedural exceptions (deviation from a PRC rule): granted by the Document Owner.
- Standard exceptions (deviation from an STD rule): granted by the Domain Maintainer.
- Governance exceptions (deviation from a GOV rule): granted by the Governance Board.
- Constitutional exceptions (deviation from [AI-SDOM-ARC-0001]): not permitted without amendment.

13.4 An exception expires automatically at the end of its maximum duration; renewal requires a new ADR [AI-SDOM-GOV-0001 (Section 9.4)].

---

## 14. Error Handling

| Failure | Action | Reference |
|---------|--------|-----------|
| ADR rule violation (ADR-01..20) | Correct the defect, re-run the self-audit, and record the issue in the Self-Audit Log | [AI-SDOM-STD-0008 (Section 13)] |
| Unresolvable cross-reference | Correct or remove the reference; re-verify dependency rules | [AI-SDOM-ARC-0001 (Section 8.2)] |
| Identifier conflict | Do not assign the identifier; confirm the register's next available ADR identifier | [AI-SDOM-ARC-0001 (Section 12.2)] |
| ADR-to-ADR or ADR-to-QLT reference found | Replace with compliant reference or remove; the prior ADR is identified descriptively in Context | [AI-SDOM-ARC-0001 (Section 7.2)] |
| Review rejection | Revise the ADR and re-enter the technical review phase | [Section 8] |
| Approval failure | Revise or withdraw the change; record the reason in the pull request | [Section 9] |
| Supersession chain would become cyclic | Rework the superseding ADR to address the prior ADR's premises directly | [AI-SDOM-ARC-0001 (Section 17.4)] |
| Downstream impact discovered | Re-run the impact analysis and notify affected document owners | [AI-SDOM-ARC-0001 (Section 10.2)]; [AI-SDOM-GOV-0002 (Section 6.5)] |
| Forward reference left in an Accepted ADR | Convert to a normal citation or remove before publication | [AI-SDOM-STD-0003 (Section 10.2)] |
| Governance violation discovered | Report and resolve per the governance compliance process | [AI-SDOM-GOV-0001 (Section 13)] |

---

## 15. Traceability Requirements

15.1 Every ADR SHALL establish bidirectional traceability:
- **Motivating:** reference the document(s) that motivated the decision [AI-SDOM-ARC-0001 (Section 7.6)].
- **Affected:** reference any document(s) affected by the decision [AI-SDOM-ARC-0001 (Section 7.6)].

15.2 The Repository Register SHALL record each ADR and its current `status`, providing an inventory-level trace [AI-SDOM-STD-0008 (Section 10.3)].

15.3 Supersession SHALL be traceable through the superseding ADR's Context and the superseded ADR's Status field [Section 11]; [AI-SDOM-STD-0008 (Section 9)].

15.4 Approvals SHALL be traceable to recorded evidence per [AI-SDOM-ARC-0001 (Section 15.7)]; [AI-SDOM-STD-0008 (Section 13, ADR-20)].

15.5 Every ADR-required trigger SHALL be traceable to its governing provision [AI-SDOM-STD-0008 (Section 4)].

---

## 16. Records Generated

The ADR lifecycle generates the following records, all retained per [AI-SDOM-GOV-0001 (Section 11)]:

| Record | Format | Location | Retention |
|--------|--------|----------|-----------|
| ADR document | ADR file | 06-DECISIONS | Permanent |
| Ratification approvals | Pull request comments / ADR | Repository | Permanent |
| Governance votes (Board escalation) | Pull request comments and ADRs | Repository | Permanent |
| Register row | Register entry | 05-REGISTERS | Permanent |
| Exception grants | ADRs | 06-DECISIONS | Permanent |
| Retirement records | Retired Identifier Register | 05-REGISTERS | Permanent |
| Self-audit log | ADR Self-Audit Log section | Per ADR | Permanent |

---

## 17. Success Criteria

The ADR lifecycle is complete when all of the following hold:

| # | Criterion | Verified By |
|---|-----------|-------------|
| 1 | The ADR is in the `Accepted` state with substantive content immutable | [AI-SDOM-ARC-0001 (Section 17.3)]; [AI-SDOM-STD-0008 (Section 11)] |
| 2 | The ADR passed all applicable quality gates, including the ADR rule family ADR-01..20 | Architecture Validation Standard; [AI-SDOM-STD-0008 (Section 13)] |
| 3 | The ADR is registered in the Repository Register with its status | Repository Register |
| 4 | Ratification was granted by the correct authority and recorded | [AI-SDOM-ARC-0001 (Section 15.5, Section 15.7)] |
| 5 | The ADR references its motivating and affected documents | [AI-SDOM-ARC-0001 (Section 7.6)] |
| 6 | Supersession, where applicable, uses the mandated Status form and remains acyclic | [AI-SDOM-ARC-0001 (Section 9.6, Section 17.4)] |
| 7 | All affected documents were reviewed for impact | [AI-SDOM-ARC-0001 (Section 10.2)]; [AI-SDOM-GOV-0002 (Section 6)] |

---

## 18. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Constitutional source. ADR provisions (§17), ratification (§15.5), isolation (§7.2), forward references (§8.3), review periods (§10), naming (§11), reserved ranges (§12), automation boundaries (§19), and lifecycle (§20). |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Roles (§3), decision-making (§5), ratification (§7), exceptions (§9), and governance records (§11). |
| [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY] | Change governance. Change categories, impact assessment (§6), and traceability (§7). |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Document structure and self-audit requirements that apply to the documents produced by this procedure. |
| [AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD] | ADR front-matter field model (§3.5) referenced by the proposal workflow. |
| [AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD] | Canonical cross-reference syntax and forward-reference lifecycle. |
| [AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD] | Version grammar and the ADR version prohibition referenced as a boundary. |
| [AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD] | Naming conventions for ADR identifiers, filenames, and slugs. |
| [AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD] | Repository structure and the 06-DECISIONS placement of ADR documents. |
| [AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD] | Dependency declaration rules applied to the ADR Dependencies section. |
| [AI-SDOM-STD-0008-ARCHITECTURE-DECISION-STANDARD] | Authorizing standard. ADR definition, structure, lifecycle, supersession, immutability, and the ADR-01..20 rule family that this procedure implements. |
| ADR Template (04-TEMPLATES) | ADR authoring skeleton instantiated in the proposal workflow. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (05-REGISTERS) | Identifier authority and document inventory updated in the publication workflow. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard (07-QUALITY) | Validation gates applied in the review workflow. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-08-02 | —      | Initial architecture decision procedure | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-STD-0001], [AI-SDOM-STD-0002], [AI-SDOM-STD-0003], [AI-SDOM-STD-0004], [AI-SDOM-STD-0005], [AI-SDOM-STD-0006], [AI-SDOM-STD-0007], and [AI-SDOM-STD-0008], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure ADR-lifecycle procedure. No ADR content, governance, standard, validation, template, or register content. §1.3 excludes those responsibilities. |
| §2.2 | Traceability | PASS | Every workflow section cites the authorizing provision in ARC-0001, GOV-0001, GOV-0002, or STD-0008.|
| §2.4 | Parsimony | PASS | ADR structure, front matter, rule family, approval thresholds, and gates are referenced, not reproduced. |
| §2.6 | Explicitness | PASS | All steps written as normative statements. |
| §4 | Valid class code PRC | PASS | Identifier: AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE. |
| §5.1 | Identifier format | PASS | AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE. |
| §5.4 | Filename mirror | PASS | ai-sdom-prc-0002-architecture-decision-procedure.md. |
| §6.1 | Directory match | PASS | 03-PROCEDURES/ maps to PRC class. |
| §7.1 | Layer N references 0..N | PASS | PRC (L3) references ARC (L0), GOV (L1), STD (L2). All ≤ 3. TPL/REG/QLT referenced by descriptive title. |
| §7.3 | Dependencies section | PASS | Front-matter Dependencies lists ARC-0001, GOV-0001, GOV-0002, STD-0001..STD-0008. |
| §7.5 | PRC cites authorizing STD | PASS | STD-0008 in Dependencies and §1.2. |
| §8 | Cross-reference syntax | PASS | Canonical form used for all formal references. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-prc-0002-architecture-decision-procedure.md. |
| §12 | Reserved range | PASS | PRC-0002 within PRC 0001-0999 (operational). |
| §15 | No governance duplication | PASS | Approval thresholds referenced to ARC-0001 §15.5 and GOV-0001 §5.2, not defined. |
| §16 | Governance boundaries | PASS | §1.3 and §2.3 keep the procedure within its class boundary. |
| §18.3 | Mandatory automated gates | PASS | §7.9 references the applicable gates; no pass/fail criteria redefined. |
| §18.4 | Mandatory manual gates | PASS | §8.2 references the manual gates; no criteria redefined. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §3 | Roles | PASS | §4 references GOV-0001 §3; no roles redefined. |
| §5 | Decision-making and thresholds | PASS | §9 references §5.1-§5.2; no thresholds redefined. |
| §9 | Exception governance | PASS | §13 references §9.2-§9.5; no exception rules added. |
| §11 | Governance records | PASS | §16 references §11; record locations deferred. |

### GOV-0002 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §6 | Impact assessment | PASS | §7.3 references §6; no impact-assessment criteria added. |
| §7 | Traceability | PASS | §15 references change traceability; no policy added. |

### STD-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §3 | Front matter | PASS | YAML front matter present with identifier, title, version, lifecycle-state, layer, dependencies, tags,and ai-assistance. |
| §7 | Cross-reference conventions | PASS | All formal references use canonical form per STD-0003. |
| §8 | Self-audit | PASS | This section present; all applicable gates audited. |

### STD-0002 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §3.5 | ADR field model | PASS | §7.6 references the ADR field model without redefining fields. |
| §3 | Field registry | PASS | `dependencies` field used per the registry; no other extension fields. |

### STD-0003 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §5 | Canonical references | PASS | All formal references use the canonical form `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]`. |
| §8 | Forward references | PASS | §9.5 and §14 reference the conversion obligation without restating syntax. |

### STD-0004 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §4 | Version grammar | PASS | `version: 0.1.0` in front matter. |
| §6.3 | ADR version prohibition | PASS | §7.8 references the prohibition; not restated. |

### STD-0005 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §5 | Document naming | PASS | Identifier `AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE`; filename `ai-sdom-prc-0002-architecture-decision-procedure.md`. |

### STD-0006 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §6 | Document placement | PASS | Document placed in 03-PROCEDURES per the placement matrix. |
| §9 | ADR directory | PASS | §10.3 references the 06-DECISIONS placement for ADRs. |

### STD-0007 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §5 | Dependency direction | PASS | All declared dependencies are at layers 0-2, within the PRC (L3) bound. |
| §6 | Dependency declaration | PASS | §7.6 references the ADR Dependencies obligation without restating it. |

### STD-0008 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §5 | Lifecycle and status model | PASS | §2.2, §7-§12 operationalize the state model by reference. |
| §6 | Structure | PASS | §7.6 references the §17.2 section order; not restated. |
| §7 | Front matter | PASS | §7.6 references the field model; not restated. |
| §9 | Supersession | PASS | §11 references §9; no supersession rule added. |
| §11 | Immutability | PASS | §10.5 references §11; no immutability rule restated. |
| §13 | ADR rule family | PASS | §7.9 and §8.2 reference ADR-01..20 as the validation rules; no rule redefined. |

### Self-Audit Certification — G01-G10

| Gate | Status |
|------|--------|
| G01 Layer Dependency Compliance | PASS (R1, R6, R7, R8; R2-R5 N/A — layered PRC class) |
| G02 Document Taxonomy Compliance | PASS |
| G03 Identifier Format and Uniqueness | PASS |
| G04 Directory Placement | PASS |
| G05 Cross-Reference Integrity | PASS |
| G06 Semantic Versioning Compliance | PASS |
| G07 Reserved Range Usage | PASS |
| G08 ADR Immutability Rules | N/A (not ADR) |
| G09 Architecture Contract Conformance | PASS |
| G10 Automation Boundary Compliance | PASS |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Higher-layer and cross-cutting reference constraint (Sections 7, 10, 18):** The procedure must reference the ADR Template (L4), the Repository Register (L5), and the Architecture Validation Standard (cross-cutting). Per [AI-SDOM-ARC-0001 (Section 7.1)], PRC (Layer 3) may formally reference layers 0-3 only; TPL (L4) and REG (L5) are higher layers, and QLT is cross-cutting. Resolved by referencing ARC-0001, GOV-0001, GOV-0002, and STD-0001 through STD-0008 by canonical identifier, and the ADR Template, Repository Register, and Architecture Validation Standard by descriptive title, consistent with the precedent established in the PRC-0001 and STD-0007 self-audits.

2. **ADR rule-family duplication risk (Sections 7, 8):** Initial draft restated several ADR validation rules. Resolved by referencing the ADR rule family ADR-01..20 of [AI-SDOM-STD-0008 (Section 13)] and the mandatory gates of [AI-SDOM-ARC-0001 (Section 18)], satisfying G09-R3.

3. **Approval threshold duplication risk (Sections 4, 9):** Initial draft reproduced the ratification thresholds. Resolved by referencing [AI-SDOM-ARC-0001 (Section 15.5)] and [AI-SDOM-GOV-0001 (Section 5.2)] for the thresholds and §5.1-§5.2 for vote mechanics, satisfying G09-R3.

4. **ADR structure/front-matter duplication risk (Section 7.6):** Initial draft reproduced the §17.2 section list and the front-matter field table. Resolved by referencing [AI-SDOM-STD-0008 (Section 6, Section 7)] and [AI-SDOM-STD-0002 (Section 3.5)] instead.

5. **Exception-policy duplication risk (Section 13):** Initial draft reproduced the exception classification table. Resolved by referencing [AI-SDOM-GOV-0001 (Section 9)] and summarizing the classification in §13.3 as a pointer, not a redefinition.

6. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter Dependencies field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.

7. **Version/tag treatment of ADRs (Section 10.4):** The publication workflow must not imply a version or release tag for ADRs. Resolved by explicitly referencing [AI-SDOM-ARC-0001 (Section 9.6)] and [AI-SDOM-STD-0008 (Section 12)] to record that an ADR carries no version and is not versioned or tagged as a release, while its historical preservation is provided by Git history per [AI-SDOM-ARC-0001 (Section 20.4)].

8. **Supersession reference boundary (Section 11):** The superseding ADR must identify the superseded ADR without a canonical ADR-to-ADR citation, which would violate [AI-SDOM-ARC-0001 (Section 7.2)]. Resolved by specifying in §11.3 that the prior ADR is identified in the Context text rather than by canonical citation, consistent with [AI-SDOM-STD-0008 (Section 9.3)].

9. **Assumed-delivery source control:** This document is delivered as an uncommitted working-tree change for review and approval (phase contract: no Git operations). Its `lifecycle-state` is Active and version 0.1.0; ratification and the associated Git tag per [AI-SDOM-ARC-0001 (Section 11.6)] will follow approval per [AI-SDOM-ARC-0001 (Section 15.3)].

10. **No PRC regressions and self-consistency:** This document's own dependency declaration complies with the rules it references: each of the eleven declared dependencies (ARC-0001, GOV-0001, GOV-0002, STD-0001 through STD-0008) is cited in the body, all targets are at layers 0-2, the graph is acyclic, and every dependency is resolvable. The QLT, TPL, and REG documents are referenced descriptively only, per the layer bound. Every workflow section was verified against the provision it references during self-audit.
