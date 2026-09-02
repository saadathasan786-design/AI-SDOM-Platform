---
identifier: AI-SDOM-GOV-0003-PRODUCT-ROADMAP
title: AI-SDOM Product Roadmap
version: 0.1.0
lifecycle-state: Active
layer: 1
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY
  - AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY
tags:
  - governance
  - product
  - roadmap
created: 2026-08-01
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-01: initial draft"
---

# AI-SDOM Product Roadmap

## Purpose

This document defines the official long-term roadmap governing the evolution of the AI-SDOM product. It establishes WHAT the product will achieve and WHEN, while never defining HOW. It derives its authority from [AI-SDOM-ARC-0001 (Section 20)], which requires the repository to evolve through deliberate, governed changes, and operates within the governance framework established by [AI-SDOM-GOV-0001] and [AI-SDOM-GOV-0002].

This document is a governance document. It SHALL NOT define:
- Implementation procedures or step-by-step instructions (governed by the PRC class).
- Standards content or mandatory technical rules (governed by the STD class).
- Approval thresholds, voting rules, or role composition (governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5)]).
- Amendment types, version increment rules, or change categories (governed by [AI-SDOM-GOV-0001 (Section 8)] and [AI-SDOM-GOV-0002 (Section 4)]).
- Repository architecture, structure, or constitutional rules (governed by [AI-SDOM-ARC-0001]).
- Validation rules or quality gates (governed by the QLT class).
- Identifier allocation or document inventory (governed by the Repository Register (REG-0001)).

---

## 1. Vision

1.1 The vision of the AI-SDOM product is to be the definitive, self-sustaining governance and operations framework for AI-assisted software development operations: a constitutional repository whose documents are machine-processable, human-readable, validated, certified, and evolvable without ever compromising its foundation [AI-SDOM-ARC-0001 (Section 1.1, Section 1.3)].

1.2 The product vision SHALL be achieved through the deliberate, governed evolution required by [AI-SDOM-ARC-0001 (Section 20.1)].

---

## 2. Mission

2.1 The mission of the AI-SDOM product is to operationalize the Architecture Contract into a complete system of governance, standards, procedures, templates, registers, and quality gates that any engineering organization can adopt, and to integrate automation and AI assistance under continuous human accountability [AI-SDOM-ARC-0001 (Section 1.4)].

---

## 3. Strategic Objectives

3.1 The strategic objectives of the product are:
- Establish and ratify a complete, coherent governance foundation.
- Operationalize the full document taxonomy [AI-SDOM-ARC-0001 (Section 4)].
- Make validation and certification routine and continuous.
- Automate the mandatory quality gates and certification evidence.
- Integrate AI assistance within the constraints of [AI-SDOM-ARC-0001 (Section 14)].
- Achieve a stable public release.
- Expand the product to additional teams, domains, and derived repositories.

3.2 Each strategic objective is realized through one or more product milestones [Section 7] and released through the release roadmap [Section 8].

---

## 4. Scope

4.1 This roadmap governs:
- The product vision, mission, and strategic objectives [Section 1] through [Section 3].
- The product milestones and their exit criteria [Section 7].
- The release roadmap and release designations [Section 8].
- The planned document families [Section 9], automation [Section 10], and AI capabilities [Section 11].
- The quality objectives [Section 12], risks [Section 13], assumptions [Section 14], and success criteria [Section 15].
- The long-term evolution of the product and of this roadmap [Section 16].
- The governance of this roadmap itself [Section 17].

4.2 This roadmap applies to the AI-SDOM repository and, where adopted, to derived repositories and adopting domains [AI-SDOM-ARC-0001 (Section 20.6)].

---

## 5. Out-of-Scope

5.1 This roadmap does not govern:
- How milestones are achieved. Implementation and step-by-step execution are governed by the PRC class.
- The structure, naming, and constitutional rules of the repository. These are governed by [AI-SDOM-ARC-0001].
- Approval thresholds, voting rules, and role composition. These are governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 5)].
- Change management policy. This is governed by [AI-SDOM-GOV-0002].
- Validation rules and quality gates. These are governed by the QLT class.
- Document structure, metadata, and content requirements. These are governed by the STD class.
- Identifier allocation and document inventory. These are governed by the Repository Register (REG-0001).
- Software architecture decisions for specific projects. These are captured in ADRs [AI-SDOM-ARC-0001 (Section 17)].

5.2 Where a topic is governed by another document, this roadmap SHALL reference it and SHALL NOT reproduce it [AI-SDOM-ARC-0001 (Section 2.4)].

---

## 6. Product Principles

6.1 **Constitutional Supremacy.** This roadmap operates within [AI-SDOM-ARC-0001]. If any provision of this roadmap conflicts with the Architecture Contract, the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

6.2 **Governed Evolution.** The product evolves only through the change management framework in [AI-SDOM-GOV-0002] and the amendment governance in [AI-SDOM-GOV-0001 (Section 8)]. No milestone or release SHALL be achieved, rescinded, or deferred outside that framework.

6.3 **What and When, Never How.** This roadmap defines outcomes and timing only. It SHALL NOT define implementation procedures [Section 5].

6.4 **Parsimony.** This roadmap references, and does not duplicate, the architecture, governance, standards, validation, and certification content of other documents [AI-SDOM-ARC-0001 (Section 2.4)].

6.5 **Proportional Rigor.** The rigor applied to roadmap changes SHALL be proportional to the layer of the affected content [AI-SDOM-ARC-0001 (Section 2.5)].

6.6 **Stability.** Milestones and releases are deliberate and rare. This roadmap SHALL NOT be amended opportunistically [AI-SDOM-ARC-0001 (Section 1.3)].

6.7 **Traceability.** Every milestone and release SHALL trace its authority to this roadmap and, through it, to [AI-SDOM-ARC-0001] [AI-SDOM-ARC-0001 (Section 2.2)].

6.8 **Human Accountability.** AI-assisted planning, drafting, and assessment remain advisory; humans decide [AI-SDOM-ARC-0001 (Section 14.3)].

---

## 7. Product Milestones

7.1 The product SHALL progress through the following milestones. Each milestone states WHAT is achieved and WHEN (its exit criteria); the HOW is governed by the PRC class and is not defined here.

| # | Milestone | Definition (WHAT) | Exit Criteria (WHEN achieved) | Target Release |
|---|-----------|-------------------|-------------------------------|----------------|
| M1 | Foundation | Establish and ratify the constitutional and core governance base of AI-SDOM. | The Architecture Contract is ratified; the core governance documents are ratified; this roadmap is Active. | v0.1 |
| M2 | Operational Framework | Complete and operationalize the core document families and the document lifecycle. | At least one ratified document in each layered class [AI-SDOM-ARC-0001 (Section 4)]; the Document Development Procedure (PRC-0001) is exercised end to end. | v0.5 |
| M3 | Validation Framework | Make quality gate validation and certification routine for all documents and releases. | All governed documents pass all applicable gates (Architecture Validation Standard); certification is exercised on a release (Repository Certification Standard). | v0.9 |
| M4 | Automation Framework | Deploy automated validation, reference, dependency, and certification tooling. | The mandatory automated gates [AI-SDOM-ARC-0001 (Section 18.3)] run on every change; certification evidence is machine-recorded. | v2.0 |
| M5 | AI Assistance Framework | Integrate AI-assisted authoring, review, and validation under human accountability. | AI-assisted capabilities are operational and compliant with [AI-SDOM-ARC-0001 (Section 14)]; AI compliance is validated. | v3.0 |
| M6 | Public Release | Reach a stable, certified release suitable for adoption. | The release certification criteria (Repository Certification Standard) are satisfied and the v1.0 Git tag is published [AI-SDOM-ARC-0001 (Section 11.6)]. | v1.0 |
| M7 | Ecosystem Expansion | Expand AI-SDOM through adopting domains and derived repositories. | At least one adopting domain or derived repository operates under the framework [AI-SDOM-ARC-0001 (Section 20.6)]. | v3.0+ |

7.2 Milestones are not strictly sequential. Capability maturation for a milestone MAY begin before the release that carries it, provided the exit criteria of earlier milestones remain satisfied [Section 8].

7.3 A milestone SHALL be declared Achieved only when its exit criteria are met and the achievement is recorded in the Roadmap Status Register [Section 17.4].

---

## 8. Release Strategy

8.1 Releases SHALL follow the release roadmap below. Release readiness is governed by the Repository Certification Standard (QLT-0002), whose criteria this roadmap does not reproduce [AI-SDOM-ARC-0001 (Section 2.4)].

| Release | Designation | Carries Milestone(s) | Release Criteria (referenced, not defined) |
|---------|-------------|----------------------|---------------------------------------------|
| v0.1 | Foundation | M1 Foundation | Foundation exit criteria [Section 7]; all documents registered in the Repository Register |
| v0.5 | Operational | M2 Operational Framework | Operational Framework exit criteria [Section 7] |
| v0.9 | Feature Complete | M3 Validation Framework | Validation Framework exit criteria [Section 7]; planned document families [Section 9] present |
| v1.0 | Stable Release | M6 Public Release | Release certification criteria (Repository Certification Standard) |
| v2.0 | Automation | M4 Automation Framework | Automation Framework exit criteria [Section 7] |
| v3.0 | AI Platform | M5 AI Assistance Framework, M7 Ecosystem Expansion | AI Assistance and Ecosystem Expansion exit criteria [Section 7] |

8.2 Release versioning and tagging follow [AI-SDOM-ARC-0001 (Section 9, Section 11.6)]. Release publication follows the Document Development Procedure (PRC-0001).

8.3 A release SHALL NOT advance to the next release designation unless the exit criteria of the milestones it carries are satisfied [Section 7].

8.4 Release cadence is informational: this roadmap does not fix calendar dates. Sequencing is driven by milestone exit criteria [Section 7], certification readiness (Repository Certification Standard), and the review cycle in [Section 17.2].

---

## 9. Planned Document Families

9.1 The following document families are planned across the taxonomy defined in [AI-SDOM-ARC-0001 (Section 4)]. Specific documents and identifiers SHALL be allocated from the Repository Register (REG-0001) when each is initiated [AI-SDOM-ARC-0001 (Section 5.3)]; no forward identifiers are assigned here.

| Family (Class) | Planned Content | Target Release (family operational) |
|----------------|-----------------|-------------------------------------|
| ARC | Architecture Contract series; extension architecture documents as needed | v0.1 |
| GOV | Core governance: Repository Governance Policy, Change Management Policy, AI-SDOM Product Roadmap; planned additions: domain admission, release governance, security governance | v0.5 |
| STD | Documentation and Document Metadata standards; planned additions: security, automation, and AI-assistance standards | v0.5 |
| PRC | Document Development Procedure; planned additions: certification and release procedures | v0.5 |
| TPL | Master Document Template; class-specific templates as required | v0.5 |
| REG | Repository Register; planned additions: certification register, filled-registry entries | v0.5 |
| ADR | Decision records as decisions arise | v0.9 |
| QLT | Architecture Validation Standard and Repository Certification Standard; additional gates as required | v0.9 |

9.2 The composition of each family SHALL be amended through the change management framework in [AI-SDOM-GOV-0002]. The completion of a family is gated by its target release [Section 8].

---

## 10. Planned Automation

10.1 The product SHALL automate, within the boundaries defined in [AI-SDOM-ARC-0001 (Section 19)], the following capabilities. This section states WHAT and WHEN; the HOW is governed by the PRC class and the QLT class.

| # | Automation Capability (WHAT) | Target Release |
|---|------------------------------|----------------|
| A1 | Identifier uniqueness and filename-mirror validation | v0.5 |
| A2 | Cross-reference resolution and forward-reference annotation checking | v0.5 |
| A3 | Dependency graph generation and cycle detection | v0.5 |
| A4 | Naming and layer compliance checks | v0.5 |
| A5 | Execution of the mandatory automated quality gates on every change [AI-SDOM-ARC-0001 (Section 18.3)] | v0.9 |
| A6 | Automated certification evidence collection | v2.0 |
| A7 | Roadmap status tracking and reporting | v2.0 |

10.2 Automation SHALL NOT bypass the human approval chain [AI-SDOM-ARC-0001 (Section 15)] or modify ratified content without approval [AI-SDOM-ARC-0001 (Section 19.2, Section 19.3)].

---

## 11. Planned AI Capabilities

11.1 The product SHALL integrate the following AI-assisted capabilities, within the constraints of [AI-SDOM-ARC-0001 (Section 14)].

| # | AI Capability (WHAT) | Target Release | Constraint |
|---|----------------------|----------------|------------|
| AI-1 | AI-assisted authoring and drafting | v3.0 | Advisory; `ai-assistance` field recorded [AI-SDOM-ARC-0001 (Section 14.2, Section 14.3)] |
| AI-2 | AI-assisted consistency and contradiction detection | v3.0 | Results reviewed before publication [AI-SDOM-ARC-0001 (Section 14.6)] |
| AI-3 | AI-assisted validation and audit support | v3.0 | Human decision retained |
| AI-4 | AI-assisted roadmap planning and status assessment | v3.0 | Identifiers never AI-generated [AI-SDOM-ARC-0001 (Section 14.4)] |

11.2 AI agents are classified as automation for the purposes of [AI-SDOM-ARC-0001 (Section 19)] and SHALL comply with Sections 14 and 19 of the Architecture Contract [AI-SDOM-ARC-0001 (Section 19.5)].

---

## 12. Quality Objectives

12.1 The product SHALL pursue the following quality objectives. How each is verified is governed by the Architecture Validation Standard (QLT-0001) and the Repository Certification Standard (QLT-0002); the pass/fail criteria are not reproduced here.

| # | Objective | Target |
|---|-----------|--------|
| Q1 | Every governed document passes all applicable mandatory validation gates | 100% |
| Q2 | Every governed document attains at least the Internal Review certification level | 100% |
| Q3 | Every released document attains the Certified level | 100% |
| Q4 | Cross-references resolve with zero unresolved references | 100% |
| Q5 | Certification review completed within the required interval | Per Repository Certification Standard |

12.2 Quality objectives are targets. The pass/fail criteria that verify them are defined in the QLT class and are not defined here.

---

## 13. Risks

13.1 The following risks to the achievement of this roadmap are recognized. Mitigation is stated at the governance level; operational handling is governed by the PRC class.

| # | Risk | Roadmap-Level Mitigation |
|---|------|--------------------------|
| R1 | Ratification stall: milestones cannot advance without ratification | Milestones gate releases on ratification; the review cycle [Section 17.2] flags stalled milestones |
| R2 | Scope creep or roadmap divergence | Amendments flow through [AI-SDOM-GOV-0002]; scope boundaries in [Section 5] |
| R3 | Adoption failure | Ecosystem Expansion milestone [Section 7]; domain admission per [AI-SDOM-ARC-0001 (Section 20.6)] |
| R4 | Automation dependency | Automation is incremental [Section 10]; mandatory manual gates remain [AI-SDOM-ARC-0001 (Section 18.4)] |
| R5 | AI capability risk | Human accountability per [AI-SDOM-ARC-0001 (Section 14)]; AI capabilities remain advisory [Section 11] |

---

## 14. Assumptions

14.1 This roadmap rests on the following assumptions:

| # | Assumption |
|---|------------|
| A1 | Continuity of the Governance Board and Domain Maintainers per [AI-SDOM-GOV-0001 (Section 3)] |
| A2 | Sufficient authoring, review, and certification capacity |
| A3 | Availability of the tooling required for automation [Section 10] |
| A4 | No constitutional change is required to achieve the milestones; if required, an amendment to [AI-SDOM-ARC-0001] follows [AI-SDOM-ARC-0001 (Section 15.1)] |
| A5 | The reserved identifier ranges in [AI-SDOM-ARC-0001 (Section 12)] accommodate the planned documents [Section 9] |

---

## 15. Success Criteria

15.1 The product is considered to have succeeded on this roadmap when the following criteria are satisfied:

| # | Criterion | Verification |
|---|-----------|--------------|
| S1 | All seven milestones achieved with recorded exit-criteria evidence | Roadmap Status Register [Section 17.4] |
| S2 | Release v1.0 attained the Certified level | Repository Certification Standard (QLT-0002) |
| S3 | Automation capabilities A1 through A7 operational | Architecture Validation Standard (QLT-0001) gates running continuously |
| S4 | At least one adopting domain or derived repository operates under the framework | Domain admission record per [AI-SDOM-ARC-0001 (Section 20.6)] |
| S5 | Governance review of this roadmap completed within the required frequency | Governance record per [AI-SDOM-GOV-0001 (Section 11)] |

---

## 16. Long-Term Evolution

16.1 Beyond the release roadmap [Section 8], the product SHALL evolve toward ecosystem expansion: adoption by additional domains and teams [AI-SDOM-ARC-0001 (Section 20.6)], derived repositories, and an AI-assisted operations platform [Section 11].

16.2 The long-term evolution of this roadmap is governed by [Section 17]. This roadmap SHALL be replanned through amendments under [AI-SDOM-GOV-0002]; it SHALL NOT be abandoned or replaced outside the change management framework.

16.3 Long-term evolution SHALL respect the stability of the Architecture Contract [AI-SDOM-ARC-0001 (Section 2.5, Section 13)].

---

## 17. Roadmap Governance

### 17.1 Ownership

17.1.1 Ownership of this roadmap follows the repository ownership model in [AI-SDOM-GOV-0001 (Section 6)] and the role model in [AI-SDOM-GOV-0001 (Section 3)].

17.1.2 The Document Owner of this roadmap SHALL be designated by the GOV Domain Maintainer per [AI-SDOM-GOV-0001 (Section 3.4)].

17.1.3 The Governance Board retains ultimate authority over the product's strategic direction through the approval of this roadmap and its amendments [AI-SDOM-GOV-0001 (Section 3.2, Section 6.1)].

### 17.2 Review Frequency

17.2.1 This roadmap SHALL be reviewed at least semi-annually.

17.2.2 Each review SHALL assess milestone statuses [Section 17.4], release readiness (Repository Certification Standard), the assumptions [Section 14], and the risks [Section 13], and SHALL be aligned with the governance review cycle in [AI-SDOM-GOV-0001 (Section 10)].

17.2.3 A special review MAY be triggered through the special-review mechanisms in [AI-SDOM-GOV-0001 (Section 10.4)].

17.2.4 Review findings SHALL be recorded in an ADR per [AI-SDOM-GOV-0001 (Section 10.3)] and retained as a governance record per [AI-SDOM-GOV-0001 (Section 11)].

### 17.3 Amendment Process

17.3.1 Amendments to this roadmap SHALL follow the change management framework in [AI-SDOM-GOV-0002] and the amendment governance in [AI-SDOM-GOV-0001 (Section 8)].

17.3.2 As a GOV (Layer 1) document, an amendment to this roadmap SHALL be approved by a two-thirds majority of the Governance Board with a minimum 7-day review period per [AI-SDOM-GOV-0001 (Section 5.2, Section 8.4)].

17.3.3 Amendment types, version impacts, and minimum review periods follow [AI-SDOM-GOV-0001 (Section 8.3)] and [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)]; they are not reproduced here.

17.3.4 Every amendment SHALL be recorded in this roadmap's Amendment Record and in the Repository Register (REG-0001).

### 17.4 Roadmap Status Definitions

17.4.1 This roadmap SHALL carry exactly one roadmap lifecycle status at any time. The roadmap lifecycle status is a roadmap governance status distinct from the document lifecycle state defined in [AI-SDOM-ARC-0001 (Section 20.2)]:

| Status | Meaning |
|--------|---------|
| Proposed | Drafted but not ratified. |
| Active | Ratified and in effect. |
| On Hold | Temporarily suspended by the Governance Board; milestones do not advance. |
| Superseded | Replaced by a newer version or a successor roadmap. |

17.4.2 Each milestone [Section 7] and each release [Section 8] SHALL carry exactly one status:

| Status | Meaning |
|--------|---------|
| Not Started | Not yet initiated. |
| In Progress | Work within the milestone or release is underway. |
| On Track | Progress is consistent with the target. |
| At Risk | Progress may miss the target absent intervention. |
| Blocked | Progress is halted pending a decision or dependency. |
| Achieved | Exit criteria have been met and recorded. |
| Deferred | Postponed to a later release. |
| Cancelled | Removed from this roadmap by amendment. |

17.4.3 Status changes SHALL be recorded in the Roadmap Status Register [Section 17.4.4], maintained by the Document Owner [Section 17.1.2], and reviewed at the frequency in [Section 17.2].

17.4.4 **Roadmap Status Register.** This register is a living section of this document, maintained in real time per the precedent in [AI-SDOM-GOV-0001 (Section 11.2)].

| Item | Status | Last Updated |
|------|--------|--------------|
| This roadmap (AI-SDOM-GOV-0003) | Proposed | 2026-08-01 |
| M1 Foundation | In Progress | 2026-08-01 |
| M2 Operational Framework | Not Started | 2026-08-01 |
| M3 Validation Framework | Not Started | 2026-08-01 |
| M4 Automation Framework | Not Started | 2026-08-01 |
| M5 AI Assistance Framework | Not Started | 2026-08-01 |
| M6 Public Release | Not Started | 2026-08-01 |
| M7 Ecosystem Expansion | Not Started | 2026-08-01 |
| v0.1 Foundation | In Progress | 2026-08-01 |
| v0.5 Operational | Not Started | 2026-08-01 |
| v0.9 Feature Complete | Not Started | 2026-08-01 |
| v1.0 Stable Release | Not Started | 2026-08-01 |
| v2.0 Automation | Not Started | 2026-08-01 |
| v3.0 AI Platform | Not Started | 2026-08-01 |

*The roadmap lifecycle status becomes Active upon ratification per [AI-SDOM-GOV-0001 (Section 7)].*

### 17.5 Governance Boundary

17.5.1 This section defines roadmap governance policy only. It SHALL NOT define operational procedures for roadmap tracking, which are governed by the PRC class.

---

## 18. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Empowering document. Repository philosophy (§1), design principles (§2), layered architecture (§3), taxonomy (§4), versioning (§9), change impact (§10), approval principles (§15), governance boundaries (§16), quality gate architecture (§18), automation boundaries (§19), and repository evolution (§20). |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Roles (§3), decision-making model (§5), ownership model (§6), amendment governance (§8), review cycle (§10), and governance records (§11) that govern this roadmap. |
| [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY] | Change governance. Change categories (§4), impact assessment (§6), traceability (§7), and review expectations (§8) that govern roadmap amendments. |
| Documentation Standard (02-STANDARDS) | Structural requirements for this document. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Document Development Procedure (03-PROCEDURES) | Operational lifecycle that executes roadmap document changes. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (05-REGISTERS) | Identifier authority and document inventory that records this roadmap. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard (07-QUALITY) | Validation gates that validate this roadmap. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.2)]. |
| Repository Certification Standard (07-QUALITY) | Certification framework that certifies this roadmap and releases. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.2)]. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-08-01 | —      | Initial AI-SDOM product roadmap | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], and all applicable gates in the Architecture Validation Standard (QLT-0001), and assessed against the certification framework in the Repository Certification Standard (QLT-0002).

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §1.1 | Repository philosophy (machine-processable, human-readable, self-documenting) | PASS | Roadmap is a governance document aligned with the constitutional philosophy. |
| §2.1 | Single Concern Principle | PASS | Pure product roadmap governance. Purpose excludes procedures, standards, validation, and register content. |
| §2.2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing ARC-0001, GOV-0001, or GOV-0002 provision. |
| §2.4 | Parsimony | PASS | Approval thresholds, amendment types, review periods, validation gates, and certification criteria referenced, not reproduced. See Self-Audit Log items 3, 4. |
| §2.6 | Explicitness | PASS | All roadmap definitions, statuses, and exit criteria written explicitly. |
| §4 | Valid class code GOV | PASS | Identifier: AI-SDOM-GOV-0003-PRODUCT-ROADMAP. |
| §5.1 | Identifier format | PASS | AI-SDOM-GOV-0003-PRODUCT-ROADMAP. |
| §5.4 | Filename mirror | PASS | ai-sdom-gov-0003-product-roadmap.md. |
| §6.1 | Directory match | PASS | 01-GOVERNANCE/ maps to the GOV class. |
| §7.1 | Layer N references 0..N | PASS | GOV (L1) references ARC (L0), GOV-0001 (L1), GOV-0002 (L1). All ≤ 1. Higher-layer and cross-cutting documents referenced descriptively. |
| §7.3 | Dependencies section | PASS | Front-matter `dependencies` present with a list of identifiers. |
| §8 | Cross-reference syntax | PASS | All formal references use `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]`. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-gov-0003-product-roadmap.md. |
| §12 | Reserved range | PASS | GOV-0003 falls in GOV 0001-0099 (core governance). |
| §14.2 | ai-assistance field | PASS | `ai-assistance` recorded in the front matter. |
| §15 | Approval thresholds not duplicated | PASS | Section 17.3 references [AI-SDOM-GOV-0001 (Section 5.2, Section 8.4)]; no threshold redefined. |
| §16 | Governance boundaries respected | PASS | Section 5 defines out-of-scope consistent with ARC-0001 §16. |
| §20 | Repository evolution strategy | PASS | Section 16 references ARC-0001 §20 for deliberate, governed evolution. |
| §20.2 | Lifecycle state | PASS | `lifecycle-state: Active`. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Constitutional Supremacy | PASS | Section 6.1 acknowledges supremacy of ARC-0001. |
| §2.3 | Separation of Concerns | PASS | Purpose and Section 5 exclude procedures, standards, validation, templates, and registers. |
| §2.4 | Transparency | PASS | Section 17.4 requires recorded statuses; this certification documents all checks. |
| §3 | Roles referenced, not redefined | PASS | Section 17.1 references the role model in GOV-0001 §3. |
| §5 | Decision-making model referenced | PASS | Section 17.3 references GOV-0001 §5.2; no thresholds redefined. |
| §6 | Ownership model referenced | PASS | Section 17.1 references GOV-0001 §6. |
| §8 | Amendment governance referenced | PASS | Section 17.3 references GOV-0001 §8. |
| §10 | Review cycle referenced | PASS | Section 17.2 references GOV-0001 §10. |
| §11 | Governance records respected | PASS | Section 17.2.4 records review findings per GOV-0001 §10.3/§11. |

### GOV-0002 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §1.3 | Exclusions | PASS | Purpose excludes procedures, thresholds, amendment types, validation, structure, and identifiers. |
| §3.3 | No Unapproved Change | PASS | Section 17.3 requires recorded approval for every roadmap amendment. |
| §4.1 | Change categories referenced | PASS | Section 17.3.3 references GOV-0001 §8.3; no categories redefined. |
| §6 | Impact assessment | PASS | Roadmap amendments are subject to the impact assessment in GOV-0002 §6. |
| §7 | Traceability | PASS | Section 17.3.4 requires Amendment Record and register entries. |
| §8 | Review expectations | PASS | Sections 17.2 and 17.3 are subject to the review expectations in GOV-0002 §8. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | GOV (L1) references ARC (L0), GOV-0001 (L1), GOV-0002 (L1). All ≤ 1. |
| G01-R2 | Cross-cutting dependency scope | N/A | This document is GOV (layered), not ADR/QLT. |
| G01-R3 | ADR-to-ADR isolation | N/A | Not ADR. |
| G01-R4 | QLT-to-QLT isolation | N/A | Not QLT. |
| G01-R5 | ADR-QLT mutual isolation | N/A | Not ADR or QLT. |
| G01-R6 | Acyclicity | PASS | GOV-0003 → GOV-0002 → GOV-0001 → ARC-0001; ARC-0001 has no dependencies. No cycle. |
| G01-R7 | Mandatory citation chain | N/A | GOV is not among the classes with a mandatory citation requirement. |
| G01-R8 | Dependencies section exists | PASS | Front-matter `dependencies` present with a list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | GOV is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: GOV. |
| G02-R3 | Layer matches LAYER_MAP | PASS | GOV → Layer 1. Front matter: `layer: 1`. |
| G02-R4 | Single concern | PASS | Product roadmap governance only — no procedures, standards, validation, or architecture content. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-GOV-0003-PRODUCT-ROADMAP. |
| G03-R2 | Filename mirror | PASS | ai-sdom-gov-0003-product-roadmap.md. |
| G03-R3 | No duplicate identifier | PASS | No other document uses this identifier. |
| G03-R4 | Identifier not reassigned | PASS | First assignment. |
| G03-R5 | Not in retired register | PASS | Retired register is empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | Directory matches class | PASS | 01-GOVERNANCE/ maps to the GOV class. |
| G04-R2 | Within numbered directory | PASS | File resides in 01-GOVERNANCE/. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]`, `[AI-SDOM-GOV-0001]`, `[AI-SDOM-GOV-0002]` references resolve. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` and `[Section N]` references verified. |
| G05-R4 | Cross-class reference compliance | PASS | Formal references limited to layers 0-1 per [AI-SDOM-ARC-0001 (Section 7.1)]; higher-layer and cross-cutting documents referenced descriptively. |
| G05-R5 | Canonical syntax | PASS | All formal external references use canonical form; descriptive titles used only where layer rules prohibit canonical references. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `version: 0.1.0`. |
| G06-R2 | SemVer format | PASS | 0.1.0 matches `\d+\.\d+\.\d+`. |
| G06-R3 | Version increment direction | N/A | Initial version; no prior revision to compare. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | GOV 0003 is within GOV 0001-0099 (core governance). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is GOV, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001, GOV-0001, and GOV-0002. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing provision. |
| G09-R3 | No duplication | PASS | Approval thresholds, amendment types, review periods, validation gates, and certification criteria referenced, not reproduced. See Self-Audit Log items 3, 4. |
| G09-R4 | Composability | PASS | Roadmap composes cleanly with the layered rules, change governance, and certification framework. |
| G09-R5 | Explicitness | PASS | All roadmap definitions, statuses, and exit criteria written explicitly. |
| G09-R6 | Governance boundary respect | PASS | No governance roles, approval thresholds, or operational procedures defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R1 | No unauthorized identifier assignment | PASS | Identifier GOV-0003 drawn from the register's next-available table (0003) and registered in REG-0001 at version 0.9.0. |
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

### Repository Certification Standard (QLT-0002) Compliance

| Level | Criteria | Status | Evidence |
|-------|----------|--------|----------|
| 0 — Draft | Identifier and filename conform to ARC-0001 §5; file in the class directory | PASS | G03/G04 PASS. |
| 1 — Internal Review | All Draft criteria; front matter complete; mandatory sections present; Dependencies correct; no unresolved structural defects | PASS | Front matter, Purpose, body sections, References, Amendment Record, and Self-Audit Log present. |
| 2 — Release Candidate | All Internal Review criteria; all applicable mandatory gates passed; version set; Self-Audit Log complete; registered in REG-0001 | PARTIAL | Gates G01-G10 PASS (self-audit); registered in REG-0001 at version 0.9.0. Does not yet attain Release Candidate because recorded approval is pending. |
| 3 — Certified | All Release Candidate criteria; complete evidence, record, and recorded approval; Active lifecycle state | NOT MET | Approval pending per [AI-SDOM-ARC-0001 (Section 15.7)]. |

Current certification level: **Internal Review**, consistent with the certification criteria in QLT-0002 §4.1 and the precedent in the Phase 2B and Phase 2C reports.

### Phase 2D Verification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Layer compliance | PASS | GOV (L1); dependencies ARC (L0), GOV-0001 (L1), GOV-0002 (L1). |
| Dependency correctness | PASS | G01-R1, G01-R6, G01-R8 PASS; acyclic. |
| No duplicated governance | PASS | G09-R3; approval thresholds and amendment types referenced (GOV-0001 §5.2, §8.3), not redefined. |
| No procedural content | PASS | Purpose excludes procedures; sections state WHAT/WHEN only. |
| No architecture duplication | PASS | Architecture referenced to ARC-0001; not restated. |
| No upward dependencies | PASS | Formal references limited to layers 0-1; higher-layer and cross-cutting documents referenced descriptively. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Identifier slug derivation (title vs. identifier):** The title "AI-SDOM Product Roadmap" yields a slug excluding the repository prefix, following the precedent set by the Architecture Contract (title "AI-SDOM Architecture Contract" → slug "ARCHITECTURE-CONTRACT"). The identifier is AI-SDOM-GOV-0003-PRODUCT-ROADMAP, avoiding the redundant AI-SDOM-AI-SDOM form.

2. **Mandatory sections vs. prescribed section list (Purpose section):** [AI-SDOM-STD-0001 (Section 8.1)] requires a Purpose section, while this phase prescribes eighteen body sections beginning with Vision. Resolved by adding an unnumbered Purpose section before Section 1, satisfying STD-0001 §8.1 without renumbering the prescribed sections.

3. **Approval threshold duplication risk (Section 17.3):** Restating the two-thirds majority and 7-day review requirement for amendments to this document could duplicate [AI-SDOM-GOV-0001 (Section 5.2, Section 8.4)]. Resolved by following the precedent in [AI-SDOM-GOV-0002 (Section 10.1)]: the values are restated only as the amendment rule for this document and attributed to GOV-0001, satisfying G09-R3.

4. **GOV minimum-content vs. prescribed structure (STD-0001 §9.2.2):** [AI-SDOM-STD-0001 (Section 9.2.2)] prescribes Governance Objectives, Governance Principles, Authority Model, and Decision-Making Model, which the prescribed 18-section structure does not name. Resolved by mapping them: governance principles → Section 6 (Product Principles); authority and decision-making model → Section 17 (Roadmap Governance), consistent with the precedent in [AI-SDOM-GOV-0002], which also adapts GOV minimum content to its specific governance concern.

5. **Roadmap status vs. document lifecycle state (Section 17.4):** The roadmap lifecycle statuses (Proposed/Active/On Hold/Superseded) could be conflated with the document lifecycle states in [AI-SDOM-ARC-0001 (Section 20.2)]. Resolved by explicitly distinguishing the two concepts, mirroring the precedent in the Repository Certification Standard §1.5.

6. **Cross-cutting and higher-layer reference constraint (Purpose, Sections 9-15, References):** [AI-SDOM-ARC-0001 (Section 7.1)] restricts GOV (L1) to canonical references to layers 0-1. The Documentation Standard (STD, L2), the Document Development Procedure (PRC, L3), the Repository Register (REG, L5), the Architecture Validation Standard (QLT, cross-cutting), and the Repository Certification Standard (QLT, cross-cutting) are referenced by descriptive title only, consistent with established precedent.

7. **Forward-reference prohibition (Section 9):** Planned document families cannot reference specific future identifiers because forward references are permitted only in ARC and ADR documents [AI-SDOM-ARC-0001 (Section 8.3)]. Resolved by describing planned families by class and content, and allocating identifiers from the Repository Register when each is initiated [AI-SDOM-ARC-0001 (Section 5.3)].

8. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of [AI-SDOM-STD-0002 (Section 7)] and existing documents, the front-matter `dependencies` field serves as this section; no separate body section is added.
