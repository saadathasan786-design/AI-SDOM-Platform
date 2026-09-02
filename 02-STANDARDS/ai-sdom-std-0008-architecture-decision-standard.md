---
identifier: AI-SDOM-STD-0008-ARCHITECTURE-DECISION-STANDARD
title: Architecture Decision Standard
version: 0.1.0
lifecycle-state: Active
layer: 2
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY
  - AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY
  - AI-SDOM-GOV-0003-PRODUCT-ROADMAP
  - AI-SDOM-STD-0001-DOCUMENTATION-STANDARD
  - AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD
  - AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD
  - AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD
  - AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD
  - AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD
  - AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD
tags:
  - architecture-decisions
  - standards
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-02: initial draft"
---

# Architecture Decision Standard

## 1. Purpose

1.1 This standard is the canonical specification of Architecture Decision Records (ADRs) within the AI-SDOM repository. It is the single source of truth for what an ADR is, how an ADR is structured, how it transitions through its lifecycle, how supersession works, how decisions trace to documents, and the ADR validation rules. It defines ADR content and lifecycle only; it SHALL NOT redefine repository architecture, governance, naming, metadata, cross-references, versioning, or operational procedures.

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 17)], which establishes the constitutional definition of an ADR, its mandatory section order, immutability, supersession, and acyclicity requirements, and from [AI-SDOM-STD-0002 (Section 3.5)], which establishes the ADR front-matter field model. This standard is the canonical specification of the ADR model: it specifies, extends, and operationalizes the constitutional provisions without contradicting them. Where this standard and [AI-SDOM-ARC-0001] describe the same rule, [AI-SDOM-ARC-0001] remains the constitutional authority and prevails in case of conflict [AI-SDOM-ARC-0001 (Section 2.3)].

1.3 This standard applies to:
- Every Architecture Decision Record in the repository, whether Proposed, Accepted, Superseded, or Retired.
- The lifecycle, supersession, traceability, and validation rules defined for ADR documents.
- Machine-readable tooling, automation, or AI agents that read, write, or validate ADR documents [AI-SDOM-ARC-0001 (Section 14, Section 19)].

---

## 2. Scope

2.1 This standard governs:
- The definition and purpose of an ADR [Section 3].
- The conditions under which an ADR is required [Section 4].
- The ADR lifecycle and status model [Section 5].
- The mandatory structure and section order of an ADR [Section 6].
- The ADR front-matter (metadata) requirements [Section 7].
- Cross-reference and dependency obligations of ADRs [Section 8].
- Supersession rules [Section 9].
- Traceability requirements [Section 10].
- Immutability rules [Section 11].
- The ADR validation rule family (ADR-01..20) [Section 13].

2.2 This standard SHALL NOT govern:
- The operational workflow of proposing, reviewing, ratifying, publishing, or retiring an ADR (governed by the PRC class; ADR ratification thresholds are established in [AI-SDOM-ARC-0001 (Section 15.5)]).
- The physical skeleton used to author an ADR (governed by the TPL class).
- Identifier allocation and registration (governed by the register authority [AI-SDOM-ARC-0001 (Section 14.4)] and the repository register).
- Quality gate enforcement of ADR rules (governed by the QLT class).
- The content or substance of specific architecture decisions.

---

## 3. Definition of an Architecture Decision Record

3.1 An Architecture Decision Record (ADR) documents a significant decision with architectural impact. ADRs are cross-cutting [AI-SDOM-ARC-0001 (Section 3)] and occupy no layer [AI-SDOM-ARC-0001 (Section 17.1)].

3.2 An ADR records:
- The context and forces that motivated the decision.
- The decision that was made.
- The expected consequences, both positive and negative.
- The alternatives that were considered and rejected, with rationale.
- The documents that motivated or are affected by the decision.

3.3 An ADR SHALL be written as a permanent, standalone record. It SHALL be self-contained enough to be understood without access to the conversation, session, or review in which the decision was made.

3.4 An ADR is distinct from a change request. A change to a controlled document that does not embody a significant architectural decision SHALL follow the change management of [AI-SDOM-GOV-0002] and SHALL NOT be recorded as an ADR.

---

## 4. When an ADR Is Required

4.1 An ADR SHALL be created for any of the following:
- A decision with architectural impact, as defined in [AI-SDOM-ARC-0001 (Section 17.1)].
- A decision affecting Layer 0 or Layer 1 documents or their content [AI-SDOM-ARC-0001 (Section 15.5)].
- An extensibility decision that introduces a new document class or changes the extension mechanism [AI-SDOM-ARC-0001 (Section 13.6)]; [AI-SDOM-STD-0002 (Section 8.8)].
- A repository structure exception requiring a document outside the numbered directories [AI-SDOM-ARC-0001 (Section 6.5)].
- A decision to introduce a new top-level directory [AI-SDOM-STD-0005 (Section 4.3)].
- An exception to a governed standard, recorded per [AI-SDOM-GOV-0001 (Section 9.3)]; [AI-SDOM-STD-0002 (Section 10.3)].
- The findings of an annual governance review [AI-SDOM-ARC-0001 (Section 20.5)].
- A reserved-range expansion amendment to [AI-SDOM-ARC-0001] [AI-SDOM-ARC-0001 (Section 12.1)].
- Any other decision the Governance Board or a domain maintainer determines to be of architectural significance.

4.2 When multiple ADR-required decisions are made in a single effort, each distinct decision SHALL be recorded in its own ADR unless the decisions are inseparable and the combined record is explicitly justified in the ADR's Context.

---

## 5. Lifecycle and Status Model

5.1 The ADR lifecycle follows the state model of [AI-SDOM-ARC-0001 (Section 17.2)] extended with retirement per [AI-SDOM-ARC-0001 (Section 20.2)]:

```
Proposed -> Accepted -> Superseded
    \          |
     \         v
      \     Retired
```

5.2 The `status` field SHALL be one of the following values [AI-SDOM-ARC-0001 (Section 17.2)]; [AI-SDOM-STD-0002 (Section 3.5)]:

| Status | Definition | Governance basis |
|--------|------------|-------------------|
| Proposed | The decision has been drafted and is under review; not yet ratified. | [AI-SDOM-ARC-0001 (Section 17.2)] |
| Accepted | The decision has been ratified; substantive content is immutable. | [AI-SDOM-ARC-0001 (Section 9.6, Section 15.5)] |
| Superseded | The decision has been replaced by a later ADR; Status reads "Superseded by AI-SDOM-ADR-NNNN". | [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)] |
| Retired | The decision's identifier has been removed from the active register; the document remains archived and readable. | [AI-SDOM-ARC-0001 (Section 20.2, Section 20.4)] |

5.3 Transitions:
- **Proposed to Accepted:** Requires ratification per [AI-SDOM-ARC-0001 (Section 15.5)]: approval from at least two reviewers independent of the decision author; decisions affecting Layer 0 additionally require unanimous Governance Board approval [AI-SDOM-ARC-0001 (Section 15.1)]; decisions affecting Layer 1 additionally require a two-thirds Governance Board approval [AI-SDOM-ARC-0001 (Section 15.2)]. Approval SHALL be recorded in the relevant pull request or the ADR [AI-SDOM-ARC-0001 (Section 15.7)].
- **Accepted to Superseded:** Occurs only through the supersession of a subsequent ADR [Section 9].
- **Accepted to Retired:** Occurs on a governance decision to retire the ADR. Retirement takes effect immediately; there is no transition period [AI-SDOM-ARC-0001 (Section 20.2)]. The identifier SHALL be removed from the active register and SHALL NOT be reused [AI-SDOM-ARC-0001 (Section 5.3)].
- **Proposed to Retired:** A Proposed ADR that is withdrawn SHALL be removed from the register without ratification; its document SHALL be deleted or archived per the Document Development Procedure.

5.4 A retired ADR retains its identifier, title, and content in the repository's Git history [AI-SDOM-ARC-0001 (Section 20.4)].

---

## 6. Structure

6.1 Every ADR SHALL contain the following sections, in the order prescribed by [AI-SDOM-ARC-0001 (Section 17.2)]:

1. **Title:** Concise statement of the decision.
2. **Status:** `Proposed`, `Accepted`, `Superseded`, or `Retired` [Section 5.2].
3. **Context:** The problem or force motivating the decision.
4. **Decision:** The chosen approach.
5. **Consequences:** Expected outcomes, both positive and negative.
6. **Alternatives Considered:** At least one alternative with rationale for rejection.
7. **References:** Documents that motivated or are affected by this decision.

6.2 The section order SHALL NOT be reordered or renamed. Additional sub-sections MAY be added within Context, Decision, and Consequences, but SHALL NOT alter the top-level section order [Section 13, ADR-06].

6.3 The References section SHALL include [AI-SDOM-ARC-0001 (Section 17)] as the authorization for the ADR's creation [AI-SDOM-ARC-0001 (Section 17.5)]; [Section 13, ADR-09].

6.4 An ADR SHALL NOT carry an Amendment Record. Substantive content is immutable once Accepted [Section 11]; the sole mutable field is `status` [Section 9].

---

## 7. Front Matter (Metadata)

7.1 An ADR SHALL use the front-matter fields prescribed for the ADR class in [AI-SDOM-STD-0002 (Section 3.5)]:

| Field | Requirement | Value |
|-------|-------------|-------|
| `identifier` | SHALL | `AI-SDOM-ADR-NNNN-{SHORT-NAME}` per [AI-SDOM-ARC-0001 (Section 5.1)] |
| `title` | SHALL | The full title of the decision |
| `status` | SHALL | One of `Proposed`, `Accepted`, `Superseded`, `Retired` |
| `layer` | SHALL | `X` [AI-SDOM-STD-0002 (Section 3.5.1)] |
| `version` | SHALL NOT | ADRs carry no version [AI-SDOM-ARC-0001 (Section 9.6)] |
| `lifecycle-state` | SHALL NOT | Replaced by `status` for ADRs [AI-SDOM-STD-0002 (Section 3.5)] |
| `supersedes` | SHALL NOT | Not applicable to ADR [AI-SDOM-STD-0002 (Section 3.5)] |

7.2 The `{SHORT-NAME}` SHALL be a kebab-case slug derived from the document title per [AI-SDOM-ARC-0001 (Section 5.1)] and [AI-SDOM-STD-0005].

7.3 The `status` field in the front matter SHALL match the Status section of the document body [Section 13, ADR-05].

---

## 8. Cross-References and Dependencies

8.1 An ADR SHALL reference, in its References section and body, the document(s) that motivated the decision and any document(s) affected by the decision [AI-SDOM-ARC-0001 (Section 7.6)] [Section 13, ADR-10].

8.2 An ADR MAY reference any layered document (Layers 0-5) [AI-SDOM-ARC-0001 (Section 7.2)].

8.3 An ADR SHALL NOT reference another ADR [AI-SDOM-ARC-0001 (Section 7.2)] [Section 13, ADR-11]. An ADR SHALL NOT reference a QLT document [AI-SDOM-ARC-0001 (Section 7.2)] [Section 13, ADR-12].

8.4 The Dependencies section of an ADR SHALL list, as a bullet list of canonical identifiers, every layered document the ADR references [AI-SDOM-ARC-0001 (Section 7.3)]; if none, the section SHALL read "Dependencies: None."

8.5 Forward references to documents not yet created SHALL be annotated `[FORWARD]` and SHALL use a placeholder identifier that has not yet been assigned. Forward references are permitted in ADR documents [AI-SDOM-ARC-0001 (Section 8.3)]; [AI-SDOM-STD-0003 (Section 8.1)] [Section 13, ADR-17]. A forward reference SHALL NOT remain in an Accepted ADR; on ratification it SHALL be converted to a normal citation or removed [AI-SDOM-STD-0003 (Section 10.2)].

8.6 All canonical cross-references SHALL follow the syntax of [AI-SDOM-STD-0003].

---

## 9. Supersession

9.1 A subsequent ADR supersedes a prior ADR when the later decision replaces the earlier one [AI-SDOM-ARC-0001 (Section 17.3)].

9.2 On supersession, the superseded ADR's `status` field SHALL be updated to the mandated form: `Superseded by AI-SDOM-ADR-NNNN`, where `NNNN` is the superseding ADR's sequential number [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)] [Section 13, ADR-14].

9.3 The superseding ADR SHALL reference the superseded decision in its Context, and SHALL NOT create a circular dependency chain [AI-SDOM-ARC-0001 (Section 17.4)]. If ADR-B supersedes ADR-A, and ADR-A was premised on ADR-C, ADR-B SHALL address ADR-C's content directly [Section 13, ADR-15, ADR-16].

9.4 Supersession takes effect immediately; there is no transition period [AI-SDOM-ARC-0001 (Section 20.2)].

9.5 A superseded ADR SHALL NOT be edited in any substantive field; only the `status` field changes [Section 11].

9.6 Supersession chains SHALL remain acyclic [AI-SDOM-ARC-0001 (Section 17.4)] [Section 13, ADR-16].

---

## 10. Traceability

10.1 Every ADR SHALL establish bidirectional traceability:
- **Motivating:** The ADR SHALL reference the document(s) whose requirements, constraints, or forces motivated the decision [AI-SDOM-ARC-0001 (Section 7.6)].
- **Affected:** The ADR SHALL reference any document(s) affected by the decision [AI-SDOM-ARC-0001 (Section 7.6)].

10.2 A layered document SHALL reference a cross-cutting document such as an ADR by descriptive title, never by canonical citation, and SHALL NOT list the ADR in its `dependencies` field [AI-SDOM-STD-0003 (Section 7.3)] [AI-SDOM-ARC-0001 (Section 7.1)].

10.3 The repository register SHALL record each ADR as a row, reflecting the ADR's current `status` [Section 13, ADR-19].

---

## 11. Immutability

11.1 Once an ADR is Accepted, its substantive content — Title, Context, Decision, Consequences, Alternatives Considered, and References — SHALL NOT be modified [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)] [Section 13, ADR-18].

11.2 The sole mutable field of an Accepted ADR is `status`, which may be updated only to reflect supersession [Section 9.2] or retirement [Section 5.3] [AI-SDOM-ARC-0001 (Section 9.6)].

11.3 Corrections to a factual error in an Accepted ADR SHALL be made by superseding the ADR, not by editing it.

---

## 12. Versioning

12.1 An ADR SHALL NOT carry a `version` field [AI-SDOM-ARC-0001 (Section 9.6)]; [AI-SDOM-STD-0004 (Section 6.3)] [Section 13, ADR-03]. The `status` field is the ADR's lifecycle indicator.

12.2 Versioning gates and semantic versioning requirements do not apply to ADR documents [AI-SDOM-STD-0004 (SVR-08)].

---

## 13. Validation Rules — ADR Rule Family

13.1 The following rules constitute the ADR rule family (ADR-01..20). They are the validation rules for Architecture Decision Records. Where a severity is assigned, it uses the four-level severity scale of [AI-SDOM-STD-0003 (Section 11.1)]: Critical, Major, Minor, Informational.

13.2 The Architecture Validation Standard (QLT class) SHALL enforce the ADR rule family as applicable gates; this standard defines the rules, and the enforcement mechanism and gate definitions are governed by the QLT class [AI-SDOM-ARC-0001 (Section 18.3, Section 19)].

13.3 Each rule is designated `ADR-NN` and SHALL be referenced by that designation.

---

**ADR-01 — Identifier Format.**
- **Purpose:** Ensure every ADR has a valid, unique identifier.
- **Requirement:** The ADR's `identifier` SHALL match `AI-SDOM-ADR-NNNN-{SHORT-NAME}` where `NNNN` is the zero-padded four-digit sequential number within the ADR reserved range 0001-9999 and `{SHORT-NAME}` is a kebab-case slug [AI-SDOM-ARC-0001 (Section 5.1, Section 12)].
- **Failure condition:** An ADR whose identifier does not match the canonical form or falls outside the ADR reserved range.
- **Severity:** Critical.

**ADR-02 — Filename Mirrors Identifier.**
- **Purpose:** Ensure the ADR filename is derivable from its identifier.
- **Requirement:** The ADR's filename SHALL mirror its identifier in lowercase: `ai-sdom-adr-nnnn-short-name.md` [AI-SDOM-ARC-0001 (Section 5.4)]; [AI-SDOM-STD-0005].
- **Failure condition:** An ADR whose filename does not match its identifier in lowercase.
- **Severity:** Major.

**ADR-03 — Status Not Version.**
- **Purpose:** Ensure ADRs carry `status`, not `version` or `lifecycle-state`.
- **Requirement:** The ADR SHALL include a `status` field and SHALL NOT include a `version` field or a `lifecycle-state` field [AI-SDOM-ARC-0001 (Section 9.6)]; [AI-SDOM-STD-0002 (Section 3.5)].
- **Failure condition:** An ADR carrying a `version` or `lifecycle-state` field, or lacking a `status` field.
- **Severity:** Critical.

**ADR-04 — Layer X.**
- **Purpose:** Ensure ADRs are recognized as cross-cutting.
- **Requirement:** The ADR's `layer` SHALL be `X` [AI-SDOM-ARC-0001 (Section 3, Section 17.1)]; [AI-SDOM-STD-0002 (Section 3.5.1)].
- **Failure condition:** An ADR with a numeric `layer` value.
- **Severity:** Major.

**ADR-05 — Valid Status Values.**
- **Purpose:** Ensure the ADR status is one of the defined values and consistent across front matter and body.
- **Requirement:** The ADR's `status` SHALL be one of `Proposed`, `Accepted`, `Superseded`, or `Retired`, and SHALL match the Status section of the document body [AI-SDOM-ARC-0001 (Section 17.2, Section 20.2)]; [AI-SDOM-STD-0002 (Section 3.5)].
- **Failure condition:** An ADR with an undefined status value, or a mismatch between front matter and body status.
- **Severity:** Major.

**ADR-06 — Mandatory Section Order.**
- **Purpose:** Ensure every ADR contains the mandatory sections in the prescribed order.
- **Requirement:** The ADR SHALL contain, in order: Title, Status, Context, Decision, Consequences, Alternatives Considered, References [AI-SDOM-ARC-0001 (Section 17.2)].
- **Failure condition:** An ADR missing a mandatory section, or with sections in a different order.
- **Severity:** Critical.

**ADR-07 — At Least One Alternative.**
- **Purpose:** Ensure decisions were considered against alternatives.
- **Requirement:** The Alternatives Considered section SHALL contain at least one alternative with rationale for its rejection [AI-SDOM-ARC-0001 (Section 17.2)].
- **Failure condition:** An ADR with no alternatives or an alternative lacking rejection rationale.
- **Severity:** Major.

**ADR-08 — Positive and Negative Consequences.**
- **Purpose:** Ensure consequences are balanced and candid.
- **Requirement:** The Consequences section SHALL address both positive and negative expected outcomes [AI-SDOM-ARC-0001 (Section 17.2)].
- **Failure condition:** An ADR whose Consequences address only benefits or only drawbacks.
- **Severity:** Major.

**ADR-09 — Cites Section 17 as Authorization.**
- **Purpose:** Ensure ADRs cite their constitutional authorization.
- **Requirement:** The ADR's References section SHALL include [AI-SDOM-ARC-0001 (Section 17)] [AI-SDOM-ARC-0001 (Section 17.5)].
- **Failure condition:** An ADR whose References omits [AI-SDOM-ARC-0001 (Section 17)].
- **Severity:** Minor.

**ADR-10 — Motivating and Affected References.**
- **Purpose:** Ensure ADRs trace to motivating and affected documents.
- **Requirement:** The ADR SHALL reference the document(s) that motivated the decision and any document(s) affected by it [AI-SDOM-ARC-0001 (Section 7.6)].
- **Failure condition:** An ADR with no motivating or affected document references where such documents exist.
- **Severity:** Major.

**ADR-11 — No ADR-to-ADR References.**
- **Purpose:** Enforce the constitutional isolation of ADRs.
- **Requirement:** An ADR SHALL NOT reference another ADR in its body or references [AI-SDOM-ARC-0001 (Section 7.2)].
- **Failure condition:** An ADR containing a canonical citation to another ADR.
- **Severity:** Critical.

**ADR-12 — No ADR-to-QLT References.**
- **Purpose:** Enforce the constitutional mutual isolation of ADR and QLT.
- **Requirement:** An ADR SHALL NOT reference a QLT document [AI-SDOM-ARC-0001 (Section 7.2)].
- **Failure condition:** An ADR containing a canonical citation to a QLT document.
- **Severity:** Critical.

**ADR-13 — No `supersedes` Field.**
- **Purpose:** Ensure ADRs do not carry the non-ADR supersession field.
- **Requirement:** The ADR SHALL NOT include a `supersedes` field [AI-SDOM-STD-0002 (Section 3.5)].
- **Failure condition:** An ADR with a `supersedes` field.
- **Severity:** Minor.

**ADR-14 — Mandated Supersession Status Form.**
- **Purpose:** Ensure superseded ADRs carry the constitutional status marker.
- **Requirement:** A superseded ADR's `status` SHALL read `Superseded by AI-SDOM-ADR-NNNN`, where `NNNN` is the superseding ADR's sequential number [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)].
- **Failure condition:** A superseded ADR whose status is not in the mandated form.
- **Severity:** Major.

**ADR-15 — Supersession Target Exists and Is an ADR.**
- **Purpose:** Ensure supersession targets are valid.
- **Requirement:** The `NNNN` in a superseded ADR's status SHALL resolve to an existing ADR [AI-SDOM-ARC-0001 (Section 9.6)].
- **Failure condition:** A supersession target that does not exist or is not an ADR.
- **Severity:** Major.

**ADR-16 — Acyclic Supersession.**
- **Purpose:** Ensure supersession chains do not form cycles.
- **Requirement:** Supersession chains SHALL remain acyclic [AI-SDOM-ARC-0001 (Section 17.4)].
- **Failure condition:** A chain in which an ADR transitively supersedes itself.
- **Severity:** Critical.

**ADR-17 — Forward References.**
- **Purpose:** Ensure forward references in ADRs are annotated and use reserved placeholders.
- **Requirement:** A forward reference in an ADR SHALL be annotated `[FORWARD]` and SHALL use a placeholder identifier that has not yet been assigned; it SHALL NOT remain in an Accepted ADR [AI-SDOM-ARC-0001 (Section 8.3)]; [AI-SDOM-STD-0003 (Section 8, Section 10.2)].
- **Failure condition:** An unannotated forward reference, a forward reference using an already-assigned identifier, or a forward reference remaining in an Accepted ADR.
- **Severity:** Major.

**ADR-18 — Immutability.**
- **Purpose:** Ensure Accepted ADR substantive content is immutable.
- **Requirement:** Once an ADR is Accepted, its substantive content SHALL NOT be modified; the sole mutable field is `status` [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)].
- **Failure condition:** A modification to the substantive content of an Accepted ADR other than the `status` field.
- **Severity:** Critical.

**ADR-19 — Registered in the Repository Register.**
- **Purpose:** Ensure ADRs are registered.
- **Requirement:** Every ADR SHALL be registered as a row in the repository register, reflecting its current `status` [AI-SDOM-ARC-0001 (Section 5.3, Section 14.4)].
- **Failure condition:** An ADR not recorded in the repository register, or a register row disagreeing with the ADR's status.
- **Severity:** Major.

**ADR-20 — Ratification Evidence.**
- **Purpose:** Ensure ratification evidence is recorded.
- **Requirement:** An Accepted ADR SHALL have evidence of ratification: approval from at least two reviewers independent of the decision author, and, where applicable, Governance Board approval recorded per [AI-SDOM-ARC-0001 (Section 15.5, Section 15.7)].
- **Failure condition:** An Accepted ADR without recorded reviewer or Board approval.
- **Severity:** Major.

---

## 14. Relationship to Other Documents

14.1 This standard is one of the Layer 2 standards. Its relationship to the other governed documents is:

| Document | Relationship |
|----------|--------------|
| [AI-SDOM-ARC-0001] | Constitutional authority for ADR definition (§17.1), section order (§17.2), immutability (§9.6, §17.3), acyclicity (§17.4), authorization (§17.5), isolation (§7.2), traceability (§7.6), ratification (§15.5), forward references (§8.3), and lifecycle (§20.2, §20.5). This standard is the canonical specification of the ADR model, without restating §17. |
| [AI-SDOM-GOV-0001] | Governance of ADR proposal, review, exception recording, and the document lifecycle; this standard defines ADR content and lifecycle only and defers governance. |
| [AI-SDOM-GOV-0002] | Change management that ADR-authorized changes and exceptions reference and operationalize. |
| [AI-SDOM-GOV-0003] | The product roadmap that informs which decisions require ADRs and the priority of ADR-driven change. |
| [AI-SDOM-STD-0001] | Document structure requirements and the front-matter obligations that apply to all documents. |
| [AI-SDOM-STD-0002] | The ADR front-matter field model (§3.5), the `status`/`layer` fields, and the prohibition of `version`/`lifecycle-state`/`supersedes` (§3.2, §3.5). |
| [AI-SDOM-STD-0003] | Canonical cross-reference syntax, forward references, cross-cutting reference rules (§7.3), and the severity scale (§11.1) referenced throughout. |
| [AI-SDOM-STD-0004] | The version grammar and the ADR version prohibition (SVR-08) referenced as a boundary; ADRs carry no version. |
| [AI-SDOM-STD-0005] | Naming conventions for ADR identifiers, filenames, and slugs. |
| [AI-SDOM-STD-0006] | Repository structure and the 06-DECISIONS placement of ADR documents. |
| [AI-SDOM-STD-0007] | Dependency declaration and direction rules applied to ADR cross-references and the Dependencies section. |
| Document Development Procedure | Operational lifecycle that executes ADR proposal, review, and ratification steps. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| ADR Template | The physical skeleton enforcing the ADR front matter and section order of this standard. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (REG-0001) | Identifier authority and document inventory; records each ADR and its status. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard | Enforces the ADR rule family (§13) as applicable gates. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Certification Standard | Defines certification levels that ADR compliance attains. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

14.2 **Division of authority.** This standard defines the ADR model only. It SHALL NOT duplicate:
- The constitutional definition, section order, immutability, supersession, and acyclicity provisions (governed by [AI-SDOM-ARC-0001 (Section 17)]).
- The ADR front-matter field model (governed by [AI-SDOM-STD-0002 (Section 3.5)]).
- The canonical cross-reference syntax, forward references, cross-cutting reference rules, and severity scale (governed by [AI-SDOM-STD-0003]).
- Version grammar and the ADR version prohibition (governed by [AI-SDOM-STD-0004]).
- Naming conventions (governed by [AI-SDOM-STD-0005]).
- Repository structure and directory placement (governed by [AI-SDOM-STD-0006]).
- Dependency declaration and direction rules (governed by [AI-SDOM-STD-0007]).
- Governance of ADR approval, decision rights, and ratification processes (governed by the GOV class and [AI-SDOM-ARC-0001 (Section 15)]).
- Procedural steps for proposing, reviewing, ratifying, publishing, or retiring ADRs (governed by the PRC class).
- The physical ADR authoring skeleton (governed by the TPL class).
- Identifier allocation and registration (governed by the register authority and the repository register).
- Certification criteria applied to ADR compliance (governed by the QLT class).

---

## 15. References

The following external records support this standard. Each is pinned per the version-pinning rules of the Cross-Reference Standard.

| Label | Target | Kind |
|-------|--------|------|
| [RFC 2119] | S. Bradner. *Key words for use in RFCs to Indicate Requirement Levels*. March 1997. RFC 2119. | External — RFC |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-08-02 | —      | Initial architecture decision standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-GOV-0003], [AI-SDOM-STD-0001], [AI-SDOM-STD-0002], [AI-SDOM-STD-0003], [AI-SDOM-STD-0004], [AI-SDOM-STD-0005], [AI-SDOM-STD-0006], and [AI-SDOM-STD-0007], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure ADR-model specification. §1.1 and §14.2 exclude governance, procedures, templates, architecture, naming, metadata, versioning, dependencies, and certification content. |
| §2.3 | Separation of Concerns | PASS | §1.1 and §14.2 exclude content owned by other standards; ADR model only. |
| §3 | Layering | PASS | §5 and §7.1 reference the cross-cutting layer status; no layer rule introduced. |
| §4 | Taxonomy | PASS | ADR is an existing class; no new class introduced. |
| §5 | Identifier scheme | PASS | §7 references §5.1 and §5.4; no identifier rule restated. |
| §7 | Dependency rules | PASS | §8 references §7.2, §7.3, §7.6; no constitutional rule restated. |
| §8 | Cross-reference rules | PASS | §8.5-8.6 reference [AI-SDOM-STD-0003]; no syntax restated. |
| §9 | Versioning | PASS | §12 references §9.6; no version rule restated. |
| §13.6 | Extensibility decisions | PASS | §4.1 references §13.6; no authority added. |
| §14.4 | AI identifier generation | PASS | §2.2 defers identifier allocation to the register authority; no allocation rule defined. |
| §15.5 | ADR ratification | PASS | §5.3 references §15.5 without redefining thresholds. |
| §17 | ADR provisions | PASS | §3, §5, §6, §9, §11 reference §17.1-§17.5; no constitutional provision restated. |
| §18.3 | Mandatory gates | PASS | §13.2 references the QLT enforcement mechanism without redefining pass/fail criteria. |
| §19 | Automation boundaries | PASS | §1.3 references §19; no automation authority granted. |
| §20 | Repository evolution | PASS | §5 and §9 reference §20.2-§20.5; no lifecycle rule restated. |

### GOV-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §2.3 | Governance vs. technical content | PASS | §14.2 defers all governance to the GOV class; no roles, approval processes, or decision rights defined. |

### GOV-0002 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §6 | Impact assessment | PASS | §3.4 and §4.1 reference change management; no procedural content added. |

### GOV-0003 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| Roadmap alignment | PASS | §14 references the roadmap for ADR-driven planning; no roadmap content duplicated. |

### STD-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §3 | Front matter | PASS | YAML front matter present with identifier, title, version, lifecycle-state, layer, dependencies, tags, and ai-assistance. |
| §7 | Cross-reference conventions | PASS | §8.6 references [AI-SDOM-STD-0003]; no convention restated. |
| §8 | Self-audit | PASS | This section present; all applicable gates audited. |

### STD-0002 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §3 | Field registry | PASS | Fields used per the registry; no other extension fields. |
| §3.5 | ADR field model | PASS | §7 specifies `status`/`layer: X` and prohibits `version`/`lifecycle-state`/`supersedes` by reference to §3.5. |

### STD-0003 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §11.1 | Severity scale | PASS | §13.1 references the scale, not restates it. |
| §7.3 | Cross-cutting references | PASS | §10.2 and §14 reference QLT and PRC/TPL/REG documents by descriptive title only. |
| §5 | Canonical references | PASS | All formal references use the canonical form `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]`. |

### STD-0004 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §4 | Version grammar | PASS | `version: 0.1.0` in front matter. |
| §6.3 | ADR version prohibition | PASS | §12 and ADR-03 implement the prohibition by reference; not restated. |

### STD-0005 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §5 | Document naming | PASS | Identifier `AI-SDOM-STD-0008-ARCHITECTURE-DECISION-STANDARD`; filename `ai-sdom-std-0008-architecture-decision-standard.md`. |

### STD-0006 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §6 | Document placement | PASS | Document placed in 02-STANDARDS per the placement matrix. |
| §9 | ADR directory | PASS | §8.1 and §14 reference the 06-DECISIONS placement for ADRs without duplicating the placement rule. |

### STD-0007 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §5 | Dependency direction | PASS | §8 references §7.2 direction rules without restating them. |
| §4.1 | Dependency types | PASS | Dependencies section declares normative dependencies only; QLT/PRC/TPL/REG referenced descriptively. |

### Self-Audit Certification — G01-G10

| Gate | Status |
|------|--------|
| G01 Layer Dependency Compliance | PASS (R1, R6, R7, R8; R2-R5 N/A — layered STD class) |
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

1. **Constitutional-duplication boundary with ARC-0001 §17 (Sections 3, 5, 6, 9, 11):** [AI-SDOM-ARC-0001 (Section 17)] defines the ADR definition, section order, immutability, supersession, and acyclicity. Reproducing these as original content would duplicate constitutional content. Resolved by referencing §17.1-§17.5 and §9.6 for the constitutional provisions, and defining only the operational model — lifecycle transitions (§5.3), supersession procedure (§9.2-§9.5), traceability (§10), and the rule family (§13) — that no existing document provides. §14.2 and the Self-Audit Certification record this boundary.

2. **Metadata-duplication boundary with STD-0002 §3.5 (Section 7):** [AI-SDOM-STD-0002 (Section 3.5)] defines the ADR front-matter field model. Resolved by referencing §3.5 for the field requirements and presenting the ADR field table in §7.1 as a mapping, not a new field definition.

3. **Cross-reference duplication boundary with STD-0003 (Sections 8, 13):** [AI-SDOM-STD-0003] governs canonical syntax, forward references, and the severity scale. Resolved by referencing STD-0003 for all cross-reference syntax and lifecycle, and defining only the ADR-specific obligations (motivating/affected references, isolation, supersession status) in §8 and §13. Severity is referenced to STD-0003 §11.1 (§13.1).

4. **Versioning boundary with STD-0004 (Section 12):** [AI-SDOM-STD-0004 (SVR-08)] governs the ADR version prohibition. Resolved by referencing §6.3 and SVR-08 in §12 rather than restating the rule, and defining only the status-based lifecycle consequence.

5. **Ratification-procedure overlap with ARC-0001 §15.5 and GOV-0001 (Section 5.3):** The two-reviewer and Board-escalation requirements are constitutional governance provisions. Resolved by referencing §15.5 in §5.3 without redefining thresholds, and deferring the operational workflow to the PRC class (§2.2, §14.2).

6. **QLT reference constraint (Section 14):** The required relationship to the Architecture Validation Standard and the Repository Certification Standard conflicts with the adopted interpretation of [AI-SDOM-ARC-0001 (Section 7.1)], under which a layered document SHALL NOT reference a cross-cutting document by canonical identifier. Resolved by referencing both QLT documents by descriptive title only, in §14, consistent with established precedent.

7. **Cross-cutting reference constraint (Sections 2, 8, 14):** [AI-SDOM-STD-0003 (Section 7.3)] requires layered documents to reference ADR, QLT, and — where applicable — other cross-cutting documents by descriptive title. Resolved by referencing the ADR Template, the Document Development Procedure, the Repository Register, and the QLT documents by descriptive title only throughout §2 and §14, and by restricting the front-matter `dependencies` field to layered documents at layers 0-2 per [AI-SDOM-ARC-0001 (Section 7.1)].

8. **`Retired` status value (Section 5):** The lifecycle state model of [AI-SDOM-ARC-0001 (Section 17.2)] lists `Proposed | Accepted | Superseded`, while [AI-SDOM-ARC-0001 (Section 20.2)] defines retirement. The ADR rule family and [AI-SDOM-STD-0002 (Section 3.5)] reference `status` values. Resolved by including `Retired` as a permitted `status` value grounded in §20.2 and [AI-SDOM-STD-0001 (Section 5.3)], while preserving the §17.2 transition core; the status enum of [AI-SDOM-STD-0002 (Section 3.5)] remains the authority for the machine-readable values.

9. **Assumed-delivery source control:** This document is delivered as an uncommitted working-tree change for review and approval (phase contract: no Git operations). Its `lifecycle-state` is Active and version 0.1.0; ratification and the associated Git tag per [AI-SDOM-ARC-0001 (Section 11.6)] will follow approval per [AI-SDOM-ARC-0001 (Section 15.3)].

10. **No ADR regressions and self-consistency:** This document's own dependency declaration complies with the rules it defines: each dependency (ARC-0001, GOV-0001 through GOV-0003, STD-0001 through STD-0007) is referenced in the body, all targets are at layers 0-2, the graph is acyclic, and every dependency is resolvable. The QLT, PRC, TPL, and REG documents are referenced descriptively only, per the layer and cross-cutting reference bounds. Every ADR rule was verified against the section it references during self-audit.
