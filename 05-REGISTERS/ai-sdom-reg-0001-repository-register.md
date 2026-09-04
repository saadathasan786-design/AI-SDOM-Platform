# Repository Register

**Identifier:** AI-SDOM-REG-0001-REPOSITORY-REGISTER  
**Version:** 0.19.0  
**Lifecycle State:** Active  
**Layer:** 5  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT]  
**ai-assistance:** Claude 2026-07-31: initial draft; opencode (deepseek-v4-flash-free) 2026-07-31: GOV-0002 registration, QLT-0002 registration, STD-0002 registration; opencode (deepseek-v4-flash-free) 2026-08-01: GOV-0003 registration, STD-0003 registration, STD-0004 registration, STD-0005 registration, STD-0006 registration, STD-0007 registration; opencode (deepseek-v4-flash-free) 2026-08-01: 0.14.1 Phase 2K version-cell correction; opencode (deepseek-v4-flash-free) 2026-08-02: STD-0008 registration (Phase 3C-1); opencode 2026-09-03: 0.16.0 governance-stack restoration and repository register reconciliation; opencode 2026-09-03: 0.17.0 GOV-0001 version-cell update; opencode (big-pickle) 2026-09-05: 0.19.0 REG-1000 registration (Elementor Integrity Incident and Evidence Record)  

---

## Purpose

This register serves as the authoritative inventory of all governed documents within the AI-SDOM repository. It records every controlled document, its current version, lifecycle state, directory location, layer assignment, and allocated identifier range. It is the single source of truth for identifier allocation and the repository's document registry as required by [AI-SDOM-ARC-0001 (Section 5.3, Section 12.2)].

Per [AI-SDOM-ARC-0001 (Section 14.4)], this register is the master register for identifier assignment. No new document identifier shall be created without a corresponding entry in this register.

---

## Document Inventory

The following table records every governed document currently in the repository. All entries are sorted by class, then by sequential number.

| # | Identifier | Title | Version | Layer | Directory | Lifecycle State | Dependencies |
|---|------------|-------|---------|-------|-----------|----------------|--------------|
| 1 | AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT | Architecture Contract | 1.0.0 | 0 | 01-ARCHITECTURE | Active | Dependencies: None |
| 2 | AI-SDOM-QLT-0001-ARCHITECTURE-VALIDATION-STANDARD | Architecture Validation Standard | 1.0.0 | X | 07-QUALITY | Active | AI-SDOM-ARC-0001 |
| 3 | AI-SDOM-REG-0001-REPOSITORY-REGISTER | Repository Register | 0.19.0 | 5 | 05-REGISTERS | Active | AI-SDOM-ARC-0001 |
| 4 | AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY | Repository Governance Policy | 0.2.0 | 1 | 01-GOVERNANCE | Active | AI-SDOM-ARC-0001 |
| 5 | AI-SDOM-STD-0001-DOCUMENTATION-STANDARD | Documentation Standard | 0.1.0 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001 |
| 6 | AI-SDOM-TPL-0001-MASTER-DOCUMENT-TEMPLATE | Master Document Template | 0.1.0 | 4 | 04-TEMPLATES | Active | AI-SDOM-ARC-0001, AI-SDOM-STD-0001 |
| 7 | AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE | Document Development Procedure | 0.1.0 | 3 | 03-PROCEDURES | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-STD-0001 |
| 8 | AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY | Change Management Policy | 0.1.0 | 1 | 01-GOVERNANCE | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001 |
| 9 | AI-SDOM-QLT-0002-REPOSITORY-CERTIFICATION-STANDARD | Repository Certification Standard | 0.1.0 | X | 07-QUALITY | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-STD-0001, AI-SDOM-PRC-0001, AI-SDOM-REG-0001 |
| 10 | AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD | Document Metadata Standard | 0.1.0 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-STD-0001 |
| 11 | AI-SDOM-GOV-0003-PRODUCT-ROADMAP | AI-SDOM Product Roadmap | 0.1.0 | 1 | 01-GOVERNANCE | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002 |
| 12 | AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD | Cross-Reference Standard | 0.1.0 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-STD-0001, AI-SDOM-STD-0002 |
| 13 | AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD | Semantic Versioning Standard | 0.1.0 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003 |
| 14 | AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD | Naming Convention Standard | 0.1.0 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003, AI-SDOM-STD-0004 |
| 15 | AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD | Repository Structure Standard | 0.1.1 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-GOV-0003, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003, AI-SDOM-STD-0004, AI-SDOM-STD-0005 |
| 16 | AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD | Dependency Management Standard | 0.1.1 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-GOV-0003, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003, AI-SDOM-STD-0004, AI-SDOM-STD-0005, AI-SDOM-STD-0006 |
| 17 | AI-SDOM-STD-0008-ARCHITECTURE-DECISION-STANDARD | Architecture Decision Standard | 0.1.0 | 2 | 02-STANDARDS | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-GOV-0003, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003, AI-SDOM-STD-0004, AI-SDOM-STD-0005, AI-SDOM-STD-0006, AI-SDOM-STD-0007 |
| 18 | AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE | Architecture Decision Procedure | 0.1.0 | 3 | 03-PROCEDURES | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003, AI-SDOM-STD-0004, AI-SDOM-STD-0005, AI-SDOM-STD-0006, AI-SDOM-STD-0007, AI-SDOM-STD-0008 |
| 19 | AI-SDOM-PRC-0003-CHANGE-IMPLEMENTATION-PROCEDURE | Change Implementation Procedure | 1.0.0 | 3 | 03-PROCEDURES | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003, AI-SDOM-STD-0004, AI-SDOM-STD-0005, AI-SDOM-STD-0006, AI-SDOM-STD-0007 |
| 20 | AI-SDOM-PRC-0004-ELEMENTOR-MUTATION-PROCEDURE | Elementor Document Mutation Procedure | 1.0.0 | 3 | 03-PROCEDURES | Active | AI-SDOM-ARC-0001, AI-SDOM-GOV-0001, AI-SDOM-GOV-0002, AI-SDOM-STD-0001, AI-SDOM-STD-0002, AI-SDOM-STD-0003, AI-SDOM-STD-0004, AI-SDOM-STD-0005, AI-SDOM-STD-0006, AI-SDOM-STD-0007 |
| 21 | AI-SDOM-REG-0002-ARCHITECTURE-DECISION-RECORDS | Architecture Decision Records Register | 1.0.0 | 5 | 05-REGISTERS | Active | AI-SDOM-ARC-0001 |
| 22 | AI-SDOM-ADR-0001-GOVERNED-ELEMENTOR-DOCUMENT-MUTATION | Governed Elementor Document Mutation via the Standard WordPress REST API | — | 1 | 06-DECISIONS | Proposed | AI-SDOM-ARC-0001, AI-SDOM-STD-0001, AI-SDOM-STD-0003, AI-SDOM-STD-0005, AI-SDOM-STD-0006, AI-SDOM-STD-0007 |
| 23 | AI-SDOM-REG-1000-ELEMENTOR-INTEGRITY-INCIDENT-AND-EVIDENCE | Elementor Integrity Incident and Evidence Record | 1.0.0 | 5 | 05-REGISTERS | Active | AI-SDOM-ARC-0001 |

### Column Definitions

- **#:** Sequential row number within this register. Not a document identifier.
- **Identifier:** The globally unique document identifier assigned at creation. Immutable per [AI-SDOM-ARC-0001 (Section 5.3)].
- **Title:** The full title of the document.
- **Version:** The current semantic version. Follows [AI-SDOM-ARC-0001 (Section 9)].
- **Layer:** The architectural layer. Layered classes show their numeric layer; cross-cutting classes show `X`.
- **Directory:** The repository directory containing the document file.
- **Lifecycle State:** One of `Active`, `Deprecated`, or `Retired` as defined in [AI-SDOM-ARC-0001 (Section 20.2)].
- **Dependencies:** The Dependencies section content from each document, reproduced for cross-reference.

### Current Repository Snapshot

As of this version, the repository contains twenty-three governed documents across eight classes, organized into the restored governance layer directories (`01-ARCHITECTURE`, `01-GOVERNANCE`, `02-STANDARDS`, `03-PROCEDURES`, `04-TEMPLATES`, `05-REGISTERS`, `06-DECISIONS`, `07-QUALITY`):

| Class | Count | Documents |
|-------|-------|-----------|
| ARC   | 1     | ARC-0001 |
| GOV   | 3     | GOV-0001, GOV-0002, GOV-0003 |
| QLT   | 2     | QLT-0001, QLT-0002 |
| REG   | 3     | REG-0001, REG-0002, REG-1000 |
| STD   | 8     | STD-0001, STD-0002, STD-0003, STD-0004, STD-0005, STD-0006, STD-0007, STD-0008 |
| PRC   | 4     | PRC-0001, PRC-0002, PRC-0003, PRC-0004 |
| TPL   | 1     | TPL-0001 |
| ADR   | 1     | ADR-0001 |
| **Total** | **23** | |

---

## Reserved Identifier Ranges

The following ranges govern identifier allocation for each document class. These ranges derive from [AI-SDOM-ARC-0001 (Section 12)] and are reproduced here as the operational allocation authority.

### ARC — Architecture Contract (Layer 0)

| Range       | Status      | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-------------|-------------|----------------|-------------|------|-----------|------------|
| 0001-0099   | Core series | 0002           | 99          | 1    | 98        | 99% free  |
| 0100-0199   | Extensions  | 0100           | 100         | 0    | 100       | 100% free |
| 0200-0999   | Future use  | 0200           | 800         | 0    | 800       | 100% free |

### GOV — Governance (Layer 1)

| Range     | Status          | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-----------|-----------------|----------------|-------------|------|-----------|------------|
| 0001-0099 | Core governance | 0004           | 99          | 3    | 96        | 97% free  |
| 0100-0999 | Domain          | 0100           | 900         | 0    | 900       | 100% free |

### STD — Standards (Layer 2)

| Range     | Status            | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-----------|-------------------|----------------|-------------|------|-----------|------------|
| 0001-0099 | Universal         | 0009           | 99          | 8    | 91        | 92% free  |
| 0100-0999 | Domain-specific   | 0100           | 900         | 0    | 900       | 100% free |

### PRC — Procedures (Layer 3)

| Range     | Status              | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-----------|---------------------|----------------|-------------|------|-----------|------------|
| 0001-0999 | Operational         | 0005           | 999         | 4    | 995       | 99.6% free |
| 1000-1999 | Domain procedures   | 1000           | 1000        | 0    | 1000      | 100% free |

### TPL — Templates (Layer 4)

| Range     | Status              | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-----------|---------------------|----------------|-------------|------|-----------|------------|
| 0001-0999 | Document templates  | 0002           | 999         | 1    | 998       | 99.9% free |

### REG — Registers (Layer 5)

| Range       | Status               | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-------------|----------------------|----------------|-------------|------|-----------|------------|
| 0001-0999   | Registry schemas     | 0003           | 999         | 2    | 997       | 99.8% free |
| 1000-9999   | Filled entries       | 1001           | 9000        | 1    | 8999      | 99.99% free |

### ADR — Architecture Decision Records (Cross-cutting)

| Range     | Status          | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-----------|-----------------|----------------|-------------|------|-----------|------------|
| 0001-9999 | Decision records | 0002           | 9999        | 1    | 9998      | 99.99% free |

### QLT — Quality Gates (Cross-cutting)

| Range     | Status                 | Next Available | Total Slots | Used | Remaining | Exhaustion |
|-----------|------------------------|----------------|-------------|------|-----------|------------|
| 0001-0099 | Gate definitions       | 0003           | 99          | 2    | 97        | 98% free  |
| 0100-0999 | Check configurations   | 0100           | 900         | 0    | 900       | 100% free |

---

## Exhaustion Guidance

When a reserved range approaches exhaustion, the following procedures apply per [AI-SDOM-ARC-0001 (Section 12.1)].

### Exhaustion Thresholds

| Level | Utilization | Action |
|-------|-------------|--------|
| Green | 0-80%       | Normal allocation. No action required. |
| Amber | 81-90%      | Warning raised. Governance Board notified. Planning for range expansion begins. |
| Red   | 91-99%      | Range near exhaustion. New allocations restricted to critical documents only. Amendment to [AI-SDOM-ARC-0001] required. |
| Exhausted | 100%    | No further allocations possible. Blocking until [AI-SDOM-ARC-0001] is amended. |

### Current Exhaustion Status

All ranges are currently at Green (0% utilization except where noted below):

| Class | Range       | Utilization | Level  |
|-------|-------------|-------------|--------|
| ARC   | 0001-0099   | 1.0%        | Green  |
| GOV   | 0001-0099   | 3.0%        | Green  |
| PRC   | 0001-0999   | 0.4%        | Green  |
| REG   | 0001-0999   | 0.2%        | Green  |
| REG   | 1000-9999   | 0.01%       | Green  |
| QLT   | 0001-0099   | 2.0%        | Green  |
| STD   | 0001-0099   | 8.1%        | Green  |
| TPL   | 0001-0999   | 0.1%        | Green  |
| ADR   | 0001-9999   | 0.01%       | Green  |
| All others | All ranges | 0.0%      | Green  |

### Range Expansion Triggers

A range expansion amendment to [AI-SDOM-ARC-0001] SHALL be initiated when any class reaches Amber level (80%+ utilization). The amendment SHALL:
1. Extend the existing range by expanding the maximum number (e.g., 0099 -> 0199).
2. Specify the migration path for any documents whose identifiers fall in the expanded portion.
3. Be recorded in an ADR per [AI-SDOM-ARC-0001 (Section 13.6)].

---

## Next Available Identifier Per Class

When creating a new document, the next available identifier SHALL be taken from the following table. After assignment, this register SHALL be updated before the document is ratified.

| Class | Next Identifier                  | Notes                                                        |
|-------|---------------------------------|--------------------------------------------------------------|
| ARC   | AI-SDOM-ARC-0002-{SHORT-NAME}   | Reserved for follow-on architecture documents                |
| GOV   | AI-SDOM-GOV-0004-{SHORT-NAME}   | GOV-0001 assigned to Repository Governance Policy; GOV-0002 assigned to Change Management Policy; GOV-0003 assigned to AI-SDOM Product Roadmap |
| STD   | AI-SDOM-STD-0009-{SHORT-NAME}   | STD-0001 assigned to Documentation Standard; STD-0002 assigned to Document Metadata Standard; STD-0003 assigned to Cross-Reference Standard; STD-0004 assigned to Semantic Versioning Standard; STD-0005 assigned to Naming Convention Standard; STD-0006 assigned to Repository Structure Standard; STD-0007 assigned to Dependency Management Standard; STD-0008 assigned to Architecture Decision Standard |
| PRC   | AI-SDOM-PRC-0005-{SHORT-NAME}   | PRC-0001 assigned to Document Development Procedure; PRC-0002 assigned to Architecture Decision Procedure; PRC-0003 assigned to Change Implementation Procedure; PRC-0004 assigned to Elementor Document Mutation Procedure |
| TPL   | AI-SDOM-TPL-0002-{SHORT-NAME}   | TPL-0001 assigned to Master Document Template                |
| REG   | AI-SDOM-REG-0003-{SHORT-NAME}   | REG-0001 assigned to Repository Register; REG-0002 assigned to Architecture Decision Records Register; registry schemas only |
| REG   | AI-SDOM-REG-1001-{SHORT-NAME}   | REG-1000 assigned to Elementor Integrity Incident and Evidence Record (first REG filled entry, range 1000-9999) |
| ADR   | AI-SDOM-ADR-0002-{SHORT-NAME}   | ADR-0001 assigned to Governed Elementor Document Mutation via the Standard WordPress REST API (status: Proposed) |
| QLT   | AI-SDOM-QLT-0003-{SHORT-NAME}   | QLT-0001 assigned to Architecture Validation Standard; QLT-0002 assigned to Repository Certification Standard |

`{SHORT-NAME}` SHALL be a kebab-case slug derived from the document title per [AI-SDOM-ARC-0001 (Section 5.1)].

---

## Retired Identifier Register

No identifiers have been retired as of this version. When a document enters the Retired lifecycle state, its identifier SHALL be recorded in the table below and shall not be reused.

| Identifier | Previous Title | Previous Version | Retirement Date | Superseded By |
|------------|----------------|------------------|-----------------|---------------|
| —          | —              | —                | —               | —             |

---

## Update Procedure

This register SHALL be updated whenever:
- A new governed document is created (new row added).
- An existing document's version changes (version cell updated).
- An existing document's lifecycle state changes (state cell updated).
- A document identifier is retired (moved to Retired Identifier Register).
- A reserved range is amended (range tables updated).

When this register is updated, its own version SHALL be incremented per [AI-SDOM-ARC-0001 (Section 9)].

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001] and all validation gates defined in the Architecture Validation Standard. The following sections document the audit results for each gate.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §5.1 | Identifier format `{PREFIX}-{CLASS}-{NNNN}-{SHORT-NAME}` | PASS | Identifier: AI-SDOM-REG-0001-REPOSITORY-REGISTER |
| §5.4 | Filename matches identifier in lowercase | PASS | Filename: ai-sdom-reg-0001-repository-register.md |
| §6.1 | Document in correct class directory | PASS | Directory: 05-REGISTERS/ |
| §7.3 | Dependencies section present | PASS | Dependencies lists ARC-0001 |
| §7.5 | REG cites document whose records it holds | PASS | Dependencies: AI-SDOM-ARC-0001 |
| §9.1 | SemVer version | PASS | Version: 0.19.0 |
| §11.2 | Filename lowercase kebab-case | PASS | ai-sdom-reg-0001-repository-register.md |
| §12 | Reserved range assignment | PASS | REG-0001 falls in REG 0001-0999 schema range |
| §20.2 | Lifecycle state recorded | PASS | Lifecycle State: Active |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | REG (Layer 5) references ARC (Layer 0). 0 <= 5. |
| G01-R6 | No circular dependencies | PASS | Dependencies chain: REG-0001 → ARC-0001. No cycle. |
| G01-R7 | REG must cite document it records | PASS | ARC-0001 is the document whose records are held. |
| G01-R8 | Dependencies section exists and is correctly formatted | PASS | Section present with bullet list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | REG is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: REG. |
| G02-R3 | Layer matches LAYER_MAP | PASS | REG → Layer 5. Front matter contains `Layer: 5`. |
| G02-R4 | Single concern | PASS | Document addresses exactly one concern: repository inventory and identifier allocation. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier matches canonical regex | PASS | AI-SDOM-REG-0001-REPOSITORY-REGISTER |
| G03-R2 | Filename mirrors identifier lowercased | PASS | ai-sdom-reg-0001-repository-register.md |
| G03-R3 | No duplicate identifier in repository | PASS | No other document uses AI-SDOM-REG-0001. |
| G03-R4 | Identifier not reassigned | PASS | First assignment of this identifier. |
| G03-R5 | Identifier not in retired register | PASS | Retired register is empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | File in directory matching class | PASS | 05-REGISTERS/ maps to REG class. |
| G04-R2 | Not outside numbered directories | PASS | File is within 05-REGISTERS/. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All `[AI-SDOM-CLASS-NNNN]` references resolve | PASS | All 16 occurrences of [AI-SDOM-ARC-0001] across the document resolve to the existing ARC-0001 document. |
| G05-R2 | No unauthorized forward references | PASS | No forward references used. |
| G05-R3 | Internal `[Section X.Y]` references resolve | PASS | All internal references verified. |
| G05-R5 | Canonical reference syntax used | PASS | All references use `[AI-SDOM-CLASS-NNNN]` format. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `Version: 0.19.0` in front matter. |
| G06-R2 | SemVer format | PASS | 0.19.0 matches `\d+\.\d+\.\d+`. |
| G06-R3 | Version increment direction | PASS | 0.18.0 → 0.19.0 is a MINOR increment for registering the first REG "filled entry" — REG-1000, the Elementor Integrity Incident and Evidence Record — including the inventory row, REG filled-entries range, exhaustion status, and next-identifier updates. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Sequential number falls within class range | PASS | REG 0001 is within REG 0001-0999 (registry schemas). |
| G07-R2 | No retired identifier reuse | PASS | REG-0001 has never been assigned before. |

**G08 — ADR Immutability Rules**

Not applicable. This document is a REG, not an ADR. Skip.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001 rules. See full table above. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the relevant ARC-0001 section. |
| G09-R3 | No duplication of information | PASS | No information is duplicated from ARC-0001 or QLT-0001; ranges are reproduced as operational reference but attributed to ARC-0001 §12. |
| G09-R4 | Composability with layered rules | PASS | Document is pure inventory and identifier authority; no rules introduced that conflict with any layer. |
| G09-R5 | Explicitness | PASS | All assumptions and constraints are written. No implicit knowledge referenced. |
| G09-R6 | Governance boundary respected | PASS | No governance roles, approval processes, or decision rights are defined. All such topics are deferred to GOV documents. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R2 | No direct main-branch commits | PASS | This document is submitted via pull request. Not yet committed. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.19.0  | 2026-09-05 | opencode (big-pickle) | Registered REG-1000-ELEMENTOR-INTEGRITY-INCIDENT-AND-EVIDENCE (Elementor Integrity Incident and Evidence Record) as the first REG "filled entry" (range 1000-9999), documenting the Page 12 Elementor integrity incident, its repair evidence, and the regression-pinned integrity-gate behavior. Updated the inventory (22→23) and snapshot (REG 2→3), the REG 1000-9999 range (0→1 used, next 1001), the exhaustion status, and the next-identifier table. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2/R3) from 0.18.0 to 0.19.0. Corrections applied while editing: inventory row 3 was stale (read 0.17.0 even though the 0.18.0 amendment recorded bumping it to 0.18.0); it is now 0.19.0. | Pending |
| 0.18.0  | 2026-09-04 | Saadat Hasan | Reconciled the Document Inventory with the ratified PRC-0003 and PRC-0004 procedures, updating both records from Draft 0.1.0 to Active 1.0.0. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, and G06-R1/R2/R3) from 0.17.0 to 0.18.0. No repository snapshot, identifier ranges, next-identifier values, or historical amendment records were changed. | Pending |
| 0.17.0  | 2026-09-03 | —      | Recorded the GOV-0001 version change from 0.1.0 to 0.2.0 (initial Governance Board constitution naming the founding-author members and appointing the PRC and Quality Domain Maintainers). Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2/R3) from 0.16.0 to 0.17.0 while leaving historical references unchanged. | Pending |
| 0.16.0  | 2026-09-03 | —      | Governance-stack restoration and repository register reconciliation: restored the historical governance layer directories (01-ARCHITECTURE through 07-QUALITY); registered newly present PRC-0002, PRC-0003, PRC-0004, REG-0002, and ADR-0001; corrected the ARC-0001 directory cell from 00-ARCHITECTURE to 01-ARCHITECTURE; updated the snapshot (17→22), identifier ranges, next-available identifiers, and exhaustion status. | Pending |
| 0.15.0  | 2026-08-02 | —      | Phase 3C-1: Registered STD-0008 (Architecture Decision Standard). Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.14.1  | 2026-08-01 | —      | Phase 2K: updated STD-0006 and STD-0007 version cells to 0.1.1 per approved consolidation corrections. No inventory change. | Pending |
| 0.14.0  | 2026-08-01 | —      | Registered STD-0007. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.13.0  | 2026-08-01 | —      | Registered STD-0006. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.11.0  | 2026-08-01 | —      | Registered STD-0004. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.9.0   | 2026-08-01 | —      | Registered GOV-0003. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.8.0   | 2026-07-31 | —      | Registered STD-0002. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.7.0   | 2026-07-31 | —      | Registered QLT-0002. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.6.0   | 2026-07-31 | —      | Registered GOV-0002. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.5.0   | 2026-07-31 | —      | Registered PRC-0001. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.4.0   | 2026-07-31 | —      | Registered TPL-0001. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.3.0   | 2026-07-31 | —      | Registered STD-0001. Updated range tables, next identifiers, snapshot, and exhaustion. | Pending |
| 0.2.0   | 2026-07-31 | —      | Registered GOV-0001. Updated range tables, next identifiers, and counts. | Pending |
| 0.1.0   | 2026-07-31 | —      | Initial inventory and identifier range allocation | Pending  |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Dependency scope (QLT cross-reference):** The self-audit validates against QLT-0001 gate rules, but listing the QLT document as a formal dependency would require a layered document (REG, Layer 5) to reference a cross-cutting document. ARC-0001 §7.1 restricts layered documents to referencing numeric layers 0 through N; QLT has no numeric layer. Resolved by: (a) listing only ARC-0001 in the Dependencies section, (b) referencing QLT-0001 by descriptive title rather than formal identifier within the Self-Audit Certification section, avoiding the dependency ambiguity entirely.

2. **Self-referential entry (REG-0001 listing itself):** REG-0001 must inventory itself as a governed document. This creates a self-referential table row. This is structurally sound because the register is a record of documents, and this document IS a document. The self-reference is not a dependency cycle (the Dependencies section does not reference itself). Resolved by adding REG-0001 as row 3 with a note in the Column Definitions explaining the # column is sequential, not an identifier.

3. **Exhaustion threshold (percentage-based triggers):** ARC-0001 does not define specific exhaustion thresholds or action levels. G07-R3 defines "last 10%" for warning. This document operationalizes that with Green/Amber/Red/Exhausted levels, which do not contradict ARC-0001 or QLT-0001 — they elaborate within permitted boundaries.

4. **Update procedure (procedural content risk):** The Update Procedure section describes WHEN updates occur but not WHO performs them or HOW approval is obtained. This stays within the REG class boundary (inventory and identifier authority) and does not introduce governance procedures. Confirmed: no governance roles or approval workflows are defined.

5. **STD-0001 registration (version 0.3.0):** Registered the new Documentation Standard (AI-SDOM-STD-0001) at version 0.1.0. Updated the STD universal range (0001-0099) from 0 used to 1 used. Updated next available STD identifier to 0002. Updated exhaustion status to show STD at 1.0% utilization (Green). Updated repository snapshot count from 4 to 5 documents. All changes follow the existing Update Procedure without introducing new patterns.

6. **TPL-0001 registration (version 0.4.0):** Registered the new Master Document Template (AI-SDOM-TPL-0001) at version 0.1.0. Updated the TPL range (0001-0999) from 0 used to 1 used. Updated next available TPL identifier to 0002. Updated exhaustion status to show TPL at 0.1% utilization (Green). Updated repository snapshot count from 5 to 6 documents. All changes follow the existing Update Procedure without introducing new patterns.

7. **PRC-0001 registration (version 0.5.0):** Registered the first procedure (AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE) at version 0.1.0. Updated the PRC operational range (0001-0999) from 0 used to 1 used. Updated next available PRC identifier to 0002. Updated exhaustion status to show PRC at 0.1% utilization (Green). Updated repository snapshot count from 6 to 7 documents. All changes follow the existing Update Procedure without introducing new patterns.

8. **GOV-0002 registration (version 0.6.0):** Registered the second governance document (AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY) at version 0.1.0. Updated the GOV core governance range (0001-0099) from 1 used to 2 used. Updated next available GOV identifier to 0003. Updated exhaustion status to show GOV at 2.0% utilization (Green). Updated repository snapshot count from 7 to 8 documents. All changes follow the existing Update Procedure without introducing new patterns.

9. **QLT-0002 registration (version 0.7.0):** Registered the second quality gate document (AI-SDOM-QLT-0002-REPOSITORY-CERTIFICATION-STANDARD) at version 0.1.0. Updated the QLT gate definitions range (0001-0099) from 1 used to 2 used. Updated next available QLT identifier to 0003. Updated exhaustion status to show QLT at 2.0% utilization (Green). Updated repository snapshot count from 8 to 9 documents. All changes follow the existing Update Procedure without introducing new patterns.

10. **Stale version references (version 0.7.0):** The register's own row in the Document Inventory (§ row 3), the ARC-0001 compliance §9.1 evidence, and the G06-R1/G06-R2 evidence still cited version 0.5.0 after the 0.6.0 update. Resolved by updating all current-version references to 0.7.0 while leaving historical version references in the Amendment Record and Self-Audit Log unchanged.

11. **STD-0002 registration (version 0.8.0):** Registered the second standard (AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD) at version 0.1.0. Updated the STD universal range (0001-0099) from 1 used to 2 used. Updated next available STD identifier to 0003. Updated exhaustion status to show STD at 2.0% utilization (Green). Updated repository snapshot count from 9 to 10 documents. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2) from 0.7.0 to 0.8.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

12. **GOV-0003 registration (version 0.9.0):** Registered the third governance document (AI-SDOM-GOV-0003-PRODUCT-ROADMAP) at version 0.1.0. Updated the GOV core governance range (0001-0099) from 2 used to 3 used. Updated next available GOV identifier to 0004. Updated exhaustion status to show GOV at 3.0% utilization (Green). Updated repository snapshot count from 10 to 11 documents and the GOV count from 2 to 3. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2) from 0.8.0 to 0.9.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

13. **STD-0003 registration (version 0.10.0):** Registered the third standard (AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD) at version 0.1.0. Updated the STD universal range (0001-0099) from 2 used to 3 used. Updated next available STD identifier to 0004. Updated exhaustion status to show STD at 3.0% utilization (Green). Updated repository snapshot count from 11 to 12 documents and the STD count from 2 to 3. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2) from 0.9.0 to 0.10.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

14. **STD-0004 registration (version 0.11.0):** Registered the fourth standard (AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD) at version 0.1.0. Updated the STD universal range (0001-0099) from 3 used to 4 used. Updated next available STD identifier to 0005. Updated exhaustion status to show STD at 4.0% utilization (Green). Updated repository snapshot count from 12 to 13 documents and the STD count from 3 to 4. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2) from 0.10.0 to 0.11.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

15. **STD-0005 registration (version 0.12.0):** Registered the fifth standard (AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD) at version 0.1.0. Updated the STD universal range (0001-0099) from 4 used to 5 used. Updated next available STD identifier to 0006. Updated exhaustion status to show STD at 5.1% utilization (Green). Updated repository snapshot count from 13 to 14 documents and the STD count from 4 to 5. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2) from 0.11.0 to 0.12.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

16. **STD-0006 registration (version 0.13.0):** Registered the sixth standard (AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD) at version 0.1.0. Updated the STD universal range (0001-0099) from 5 used to 6 used. Updated next available STD identifier to 0007. Updated exhaustion status to show STD at 6.1% utilization (Green). Updated repository snapshot count from 14 to 15 documents and the STD count from 5 to 6. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2) from 0.12.0 to 0.13.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

17. **STD-0007 registration (version 0.14.0):** Registered the seventh standard (AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD) at version 0.1.0. Updated the STD universal range (0001-0099) from 6 used to 7 used. Updated next available STD identifier to 0008. Updated exhaustion status to show STD at 7.1% utilization (Green). Updated repository snapshot count from 15 to 16 documents and the STD count from 6 to 7. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2) from 0.13.0 to 0.14.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

18. **Phase 2K version-cell correction (version 0.14.1):** Applied approved Phase 2K corrections: updated the register's STD-0006 and STD-0007 version cells from 0.1.0 to 0.1.1 to reflect the PATCH corrections applied to those standards per the Phase 2J consolidation review. No inventory, range, snapshot, or next-identifier changes. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2/R3) from 0.14.0 to 0.14.1 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

19. **STD-0008 registration (version 0.15.0):** Registered the eighth standard (AI-SDOM-STD-0008-ARCHITECTURE-DECISION-STANDARD) at version 0.1.0 per Phase 3C-1. Updated the STD universal range (0001-0099) from 7 used to 8 used. Updated next available STD identifier to 0009. Updated exhaustion status to show STD at 8.1% utilization (Green). Updated repository snapshot count from 16 to 17 documents and the STD count from 7 to 8. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2/R3) from 0.14.1 to 0.15.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

20. **Governance-stack restoration and reconciliation (version 0.16.0):** Reconciled the register with the current repository after the governance-stack restoration. Registered the newly present governed documents: PRC-0002 (Architecture Decision Procedure, Active), PRC-0003 (Change Implementation Procedure, Draft), PRC-0004 (Elementor Document Mutation Procedure, Draft), REG-0002 (Architecture Decision Records Register, Active), and ADR-0001 (Governed Elementor Document Mutation via the Standard WordPress REST API, Proposed). Corrected the ARC-0001 inventory directory cell from 00-ARCHITECTURE to the restored 01-ARCHITECTURE. Updated the Current Repository Snapshot from 17 to 22 documents across eight classes and documented the restored layer directories. Updated the PRC operational range (0001-0999) from 1 used to 4 used and next available to 0005. Updated the REG schema range (0001-0999) from 1 used to 2 used and next available to 0003. Updated the ADR decision-records range (0001-9999) from 0 used to 1 used and next available to 0002. Updated the next-available-identifier per class table (PRC-0005, REG-0003, ADR-0002) and the exhaustion status table (PRC 0.4%, REG 0.2%, ADR 0.01%). ADR-0001 is inventoried at its actual lifecycle status (Proposed); its status was not changed and the ADR was not accepted. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2/R3, G05-R1) to 0.16.0 and the current ARC-0001 reference count to 16 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

21. **GOV-0001 version-cell update (version 0.17.0):** Recorded the GOV-0001 version change from 0.1.0 to 0.2.0 in the register, reflecting the first amendment to GOV-0001 (initial Governance Board constitution naming the founding-author members and appointment of the PRC and Quality Domain Maintainers). This is a single version-cell update; no inventory, range, snapshot, or next-identifier changes. Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2/R3) from 0.16.0 to 0.17.0 while leaving historical references unchanged. All changes follow the existing Update Procedure without introducing new patterns.

22. **REG-1000 registration (version 0.19.0):** Registered the first REG "filled entry" (AI-SDOM-REG-1000-ELEMENTOR-INTEGRITY-INCIDENT-AND-EVIDENCE) at version 1.0.0 per the Update Procedure. Updated the REG filled-entries range (1000-9999) from 0 used to 1 used and next available from 1000 to 1001. Updated the inventory (22→23), the snapshot REG count (2→3), the exhaustion status (REG 1000-9999 at 0.01% utilization, Green), and the next-available-identifier table (added a REG filled-entry row at REG-1001). Updated the register's own current-version references (inventory row 3, ARC-0001 compliance §9.1, G06-R1/R2/R3) from 0.18.0 to 0.19.0. While editing, a pre-existing staleness in inventory row 3 was corrected (it still read 0.17.0 even though the 0.18.0 amendment recorded bumping it to 0.18.0; it is now 0.19.0). Only the 0.18.0 amendment-row header was touched to add the new 0.19.0 row; historical amendment text is unchanged. All changes follow the existing Update Procedure without introducing new patterns.
