# Architecture Validation Standard

**Identifier:** AI-SDOM-QLT-0001-ARCHITECTURE-VALIDATION-STANDARD  
**Version:** 1.0.0  
**Status:** Ratified  
**Layer:** X (cross-cutting)  
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT]  

---

## Purpose

This document defines the mandatory quality gates that validate every governed document's conformance to [AI-SDOM-ARC-0001] and its own class rules. Each gate specifies what it validates, its pass/fail criteria, whether it is automated or manual, its technical trigger, and the consequence of failure.

This standard is designed for adoption by any repository that follows the AI-SDOM architecture pattern. The Repository Configuration section maps all repository-specific parameters; a derived repository may override these values without modifying the validation rules.

---

## Repository Configuration

The following parameters govern all gate rules in this document. A derived repository SHALL override these values in its own copy of this standard while keeping the validation logic intact.

| Parameter | AI-SDOM Value | Purpose |
|-----------|---------------|---------|
| `REPOSITORY_PREFIX` | `AI-SDOM` | Prefix in document identifiers |
| `NUMBER_WIDTH` | `4` | Zero-padded width of the sequential number |
| `CLASS_CODES` | `ARC`, `GOV`, `STD`, `PRC`, `TPL`, `REG`, `ADR`, `QLT` | Valid class codes |
| `LAYERED_CLASSES` | `ARC`, `GOV`, `STD`, `PRC`, `TPL`, `REG` | Classes assigned to a numbered layer |
| `CROSS_CUTTING_CLASSES` | `ADR`, `QLT` | Classes with no layer assignment |
| `LAYER_MAP` | `{ARC:0, GOV:1, STD:2, PRC:3, TPL:4, REG:5}` | Class to layer number mapping |
| `DIRECTORY_MAP` | `{ARC:00-ARCHITECTURE, GOV:01-GOVERNANCE, STD:02-STANDARDS, PRC:03-PROCEDURES, TPL:04-TEMPLATES, REG:05-REGISTERS, ADR:06-DECISIONS, QLT:07-QUALITY}` | Class to directory mapping |
| `ADMIN_DIRECTORIES` | `.ai`, `scripts` | Non-classified directories |
| `INFRASTRUCTURE_FILES` | `README.md`, `.gitignore` | Files exempt from classification |
| `RESERVED_RANGES` | Defined in [REPOSITORY_PREFIX-ARC-0001 (Section 12)] | Per-class identifier ranges |
| `VERSION_FIELD` | `version` | Front-matter field name for version |

---

## Gate Sequencing and Precedence

Gates SHALL be evaluated in the following order. If a document fails any gate, subsequent gates that depend on the validity of the failed check SHALL report a dependency failure rather than a false negative.

```
G01 Layer Dependency Compliance
  └── G05 Cross-Reference Integrity (depends on dependency graph)
G02 Document Taxonomy Compliance
  └── G03 Identifier Format and Uniqueness (depends on class extraction)
      └── G07 Reserved Range Usage (depends on valid identifier)
      └── G04 Directory Placement (depends on class extraction)
G06 Semantic Versioning Compliance
G08 ADR Immutability Rules
G09 Architecture Contract Conformance
G10 Automation Boundary Compliance
```

---

## G01 — Layer Dependency Compliance

**Validates:** [AI-SDOM-ARC-0001 (Section 3, Section 7)]  

**Classification:** Automated  

**Trigger:** Pre-merge  

**Failure Action:** PR merge blocked; dependency graph recorded in CI artifacts.

### Validation Rules

**G01-R1 — Downward dependency constraint.**  
For every document D with a layered class C at layer N: every document identifier listed in D's Dependencies section SHALL resolve to a document whose class layer M satisfies 0 <= M <= N.  
*Pass:* All resolved dependencies satisfy M <= N.  
*Fail:* Any dependency resolves to a document at layer M > N.

**G01-R2 — Cross-cutting dependency scope.**  
For every document D with a cross-cutting class (ADR, QLT): every document identifier listed in D's Dependencies section SHALL resolve to a layered document (classes in LAYERED_CLASSES).  
*Pass:* All resolved dependencies are layered documents.  
*Fail:* Any dependency resolves to another cross-cutting document.

**G01-R3 — ADR-to-ADR isolation.**  
No ADR SHALL list another ADR identifier in its Dependencies section.  
*Pass:* No ADR-to-ADR dependency found.  
*Fail:* ADR-to-ADR dependency detected.

**G01-R4 — QLT-to-QLT isolation.**  
No QLT SHALL list another QLT identifier in its Dependencies section.  
*Pass:* No QLT-to-QLT dependency found.  
*Fail:* QLT-to-QLT dependency detected.

**G01-R5 — Cross-cutting mutual isolation.**  
No ADR and QLT SHALL list each other's identifiers in their Dependencies sections.  
*Pass:* No ADR-QLT cross-dependency found.  
*Fail:* ADR-QLT cross-dependency detected.

**G01-R6 — Acyclicity.**  
The transitive closure of all document dependencies SHALL contain no cycles.  
*Pass:* Dependency graph is a DAG (directed acyclic graph).  
*Fail:* A cycle exists in the dependency graph.

**G01-R7 — Mandatory citation chain.**  
Every STD SHALL list at least one GOV document in its Dependencies section. Every PRC SHALL list at least one STD document. Every TPL SHALL list at least one document of the class it templates. Every REG SHALL list at least one document of the class it records. Every ADR SHALL list the documents that motivated or are affected by the decision. Every QLT SHALL list the documents whose quality it validates.  
*Pass:* Required citations present.  
*Fail:* Required citation missing.

**G01-R8 — Dependency section existence.**  
Every governed document SHALL contain a section titled "Dependencies". If no dependencies exist, the section SHALL contain the exact text "Dependencies: None."  
*Pass:* Section present and correctly formatted.  
*Fail:* Section missing, misnamed, or incorrectly formatted.

---

## G02 — Document Taxonomy Compliance

**Validates:** [AI-SDOM-ARC-0001 (Section 4)]  

**Classification:** Automated  

**Trigger:** Pre-merge  

**Failure Action:** PR merge blocked.

### Validation Rules

**G02-R1 — Valid class code.**  
Every governed document's identifier SHALL contain a class code that is a member of CLASS_CODES.  
*Pass:* Class code matches one of the defined CLASS_CODES.  
*Fail:* Class code is unknown; document cannot be classified.

**G02-R2 — Single class assignment.**  
A document identifier SHALL contain exactly one class code.  
*Pass:* Exactly one class code present.  
*Fail:* Zero or more than one class code found.

**G02-R3 — Layer membership.**  
If a document's class is in LAYERED_CLASSES, its layer SHALL be the value in LAYER_MAP. If a document's class is in CROSS_CUTTING_CLASSES, its front matter SHALL contain `Layer: X` or omit the layer field entirely.  
*Pass:* Layer assignment matches the taxonomy.  
*Fail:* Layer number contradicts the class definition.

**G02-R4 — Single concern.**  
A document SHALL address exactly one concern as defined by its class. A document SHALL NOT combine rules that belong to two different classes.  
*Pass:* Class-appropriate scope maintained.  
*Fail:* Document mixes responsibilities of multiple classes.  
*Note:* This rule is hybrid automated/manual. An automated heuristic may flag mixed-content documents; a manual reviewer confirms the violation.

---

## G03 — Identifier Format and Uniqueness

**Validates:** [AI-SDOM-ARC-0001 (Section 5)]  

**Classification:** Automated  

**Trigger:** Pre-commit, pre-merge  

**Failure Action:** Pre-commit: warning. Pre-merge: PR blocked.

### Validation Rules

**G03-R1 — Identifier format.**  
Every governed document SHALL contain a front-matter field `identifier` whose value matches the regex:  
`^{REPOSITORY_PREFIX}-({CLASS_CODES joined by |})-(\d{{{NUMBER_WIDTH}}})-([A-Z0-9]+(?:-[A-Z0-9]+)*)$`  
*Pass:* Identifier matches the canonical pattern.  
*Fail:* Identifier omits a component, uses wrong separator, invalid characters, or wrong case.

**G03-R2 — Filename mirror.**  
The filename of every governed document SHALL match its identifier, lowercased, with the extension `.md`.  
*Pass:* `ai-sdom-arc-0001-architecture-contract.md` corresponds to `AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT`.  
*Fail:* Filename does not match the lowercased identifier.

**G03-R3 — Identifier uniqueness.**  
No two governed documents SHALL share the same identifier.  
*Pass:* All identifiers are distinct across the repository.  
*Fail:* Duplicate identifier detected.

**G03-R4 — Identifier immutability.**  
An identifier SHALL NOT change after a document is created. A document SHALL NOT be re-created under a different identifier.  
*Pass:* No identifier reassignment detected via Git history.  
*Fail:* Identifier changed between commits.

**G03-R5 — Retired identifier prohibition.**  
A document SHALL NOT bear an identifier that appears in the retired-identifier register.  
*Pass:* Identifier is not in the retired register.  
*Fail:* Identifier was previously retired.

---

## G04 — Directory Placement

**Validates:** [AI-SDOM-ARC-0001 (Section 6)]  

**Classification:** Automated  

**Trigger:** Pre-commit, pre-merge  

**Failure Action:** Pre-commit: warning. Pre-merge: PR blocked.

### Validation Rules

**G04-R1 — Class-directory match.**  
Every governed document SHALL reside in the directory mapped to its class code in DIRECTORY_MAP.  
*Pass:* File path contains the correct directory name for its class.  
*Fail:* File resides in a directory that does not match its class.

**G04-R2 — No orphan documents.**  
No governed document SHALL reside outside the numbered directories defined in DIRECTORY_MAP.  
*Pass:* Every .md file in a governed directory matches a valid class.  
*Fail:* A governed document is found in the repository root, an admin directory, or an unrecognized path.  
*Exception:* Files in INFRASTRUCTURE_FILES are exempt.

**G04-R3 — Admin directory constraints.**  
A script in `scripts/` SHALL have a corresponding PRC or QLT document. A file in `.ai/` SHALL comply with this contract.  
*Pass:* Every script is documented; every .ai file is contract-compliant.  
*Fail:* Undocumented script or non-compliant .ai file found.

---

## G05 — Cross-Reference Integrity

**Validates:** [AI-SDOM-ARC-0001 (Section 8)]  

**Classification:** Automated  

**Trigger:** Pre-merge; periodic audit  

**Failure Action:** Pre-merge: PR blocked. Audit: compliance report generated.

### Validation Rules

**G05-R1 — Reference resolution.**  
Every occurrence of `[REPOSITORY_PREFIX-CLASS-NNNN]` within a governed document SHALL resolve to an existing document identifier in the repository.  
*Pass:* All document references resolve to real documents.  
*Fail:* One or more references point to non-existent identifiers.

**G05-R2 — Forward reference annotation.**  
A reference to a document that has not yet been created SHALL be annotated with `[FORWARD]` immediately preceding the identifier, and SHALL use a placeholder identifier from the reserved range. Forward references are permitted only in ARC and ADR documents.  
*Pass:* Forward references are correctly annotated and restricted to permitted classes.  
*Fail:* Forward reference missing `[FORWARD]` annotation, uses unreserved identifier, or appears in a non-permitted class.

**G05-R3 — Intra-document reference validity.**  
Every `[Section X.Y]` reference within a document SHALL point to an existing section in the same document.  
*Pass:* All internal section references resolve.  
*Fail:* Section reference points to a non-existent section.

**G05-R4 — Cross-class reference compliance.**  
Every cross-document reference SHALL comply with the dependency rules in G01-R1 through G01-R5.  
*Pass:* Cross-class reference satisfies layer and isolation rules.  
*Fail:* Reference violates a dependency constraint.

**G05-R5 — Reference syntax conformance.**  
All external references SHALL use the canonical form `[REPOSITORY_PREFIX-CLASS-NNNN]` or `[REPOSITORY_PREFIX-CLASS-NNNN (Section X.Y)]`. Inline URLs, bare names, or non-canonical identifiers SHALL be flagged.  
*Pass:* All references use canonical syntax.  
*Fail:* Non-canonical reference detected.

---

## G06 — Semantic Versioning Compliance

**Validates:** [AI-SDOM-ARC-0001 (Section 9)]  

**Classification:** Automated  

**Trigger:** Pre-merge  

**Failure Action:** PR merge blocked.

### Validation Rules

**G06-R1 — Version field presence.**  
Every governed document of a LAYERED_CLASS SHALL contain a front-matter field matching VERSION_FIELD.  
*Pass:* Version field present.  
*Fail:* Version field missing.

**G06-R2 — SemVer format.**  
The version field value SHALL conform to Semantic Versioning 2.0.0: `MAJOR.MINOR.PATCH` where each component is a non-negative integer.  
*Pass:* Version matches `\d+\.\d+\.\d+`.  
*Fail:* Version is malformed, includes pre-release tags, or includes build metadata.

**G06-R3 — Version increment direction.**  
When a version changes between Git revisions, the increment SHALL be consistent with the change classification declared in the commit or pull request:
- Breaking change → MAJOR increment (and MINOR, PATCH reset to 0).
- Backward-compatible addition → MINOR increment (and PATCH reset to 0).
- Correction without intent change → PATCH increment only.
*Pass:* Version increment matches the declared change type.  
*Fail:* Version increment is inconsistent with the declared change type (e.g., PATCH bump for a breaking change).

**G06-R4 — ADR version prohibition.**  
An ADR SHALL NOT contain a version field.  
*Pass:* No version field in ADR front matter.  
*Fail:* ADR contains a version field.

**G06-R5 — QLT version inclusion.**  
A QLT document SHALL contain a version field and SHALL follow the same versioning rules as layered documents.  
*Pass:* QLT has a valid version.  
*Fail:* QLT is missing a version or has an ADR-style versionless format.

**G06-R6 — Git tag consistency.**  
When a document reaches a ratified state, a Git tag SHALL exist matching `{lowercased-identifier}-v{MAJOR}.{MINOR}.{PATCH}`.  
*Pass:* Git tag present and matches front-matter version.  
*Fail:* Git tag missing or version mismatch.

---

## G07 — Reserved Range Usage

**Validates:** [AI-SDOM-ARC-0001 (Section 12)]  

**Classification:** Automated  

**Trigger:** Pre-commit, pre-merge  

**Failure Action:** Pre-commit: warning. Pre-merge: PR blocked.

### Validation Rules

**G07-R1 — Range membership.**  
The sequential number `NNNN` in a document's identifier SHALL fall within the reserved range assigned to its class in RESERVED_RANGES.  
*Pass:* Number is within the assigned range.  
*Fail:* Number falls outside the reserved range for that class.

**G07-R2 — No identifier reuse.**  
A document SHALL NOT bear an identifier whose sequential number was previously assigned to a deprecated or retired document of the same class.  
*Pass:* Sequential number is not found in the retired-identifier register.  
*Fail:* Identifier was previously used by a deprecated or retired document.

**G07-R3 — Range exhaustion.**  
When a reserved range approaches exhaustion (last 10% of identifiers used), a warning SHALL be raised.  
*Pass:* Sufficient identifiers remain in the range.  
*Fail:* Range is at or near exhaustion.

---

## G08 — ADR Immutability Rules

**Validates:** [AI-SDOM-ARC-0001 (Section 17)]  

**Classification:** Hybrid (automated diff analysis; manual review for supersession correctness)  

**Trigger:** Pre-merge; periodic audit  

**Failure Action:** Pre-merge: PR blocked. Audit: compliance report generated.

### Validation Rules

**G08-R1 — Required section presence.**  
Every ADR SHALL contain the following sections in order: Title, Status, Context, Decision, Consequences, Alternatives Considered, References.  
*Pass:* All required sections present in prescribed order.  
*Fail:* Missing section or incorrect ordering.

**G08-R2 — Status validity.**  
The Status field of an ADR SHALL be one of: `Proposed`, `Accepted`, or `Superseded`.  
*Pass:* Status is a valid value.  
*Fail:* Status is unrecognized.

**G08-R3 — Post-ratification immutability.**  
Once an ADR's Status is set to `Accepted`, none of its substantive sections (Title, Context, Decision, Consequences, Alternatives Considered, References) SHALL be modified.  
*Pass:* Git diff shows no changes to substantive sections after ratification.  
*Fail:* Substantive content changed after ratification.

**G08-R4 — Status mutability boundary.**  
The Status field is the sole mutable property of an Accepted ADR. It MAY be changed to `Superseded by AI-SDOM-ADR-NNNN`.  
*Pass:* Only Status field changed; value references an existing superseding ADR.  
*Fail:* Status changed to an invalid value or a different field was modified.

**G08-R5 — Supersession chain termination.**  
The supersession chain (ADR-A superseded-by ADR-B superseded-by ADR-C ...) SHALL NOT contain cycles. A superseding ADR SHALL address the content of all predecessors in the chain. "Address" means substantive incorporation of the predecessor's context and rationale into the superseding ADR's own text; it does NOT require listing the predecessor ADR in the Dependencies section (which is prohibited by G01-R3).  
*Pass:* Supersession chain is acyclic and complete.  
*Fail:* Cycle detected in supersession chain, or superseding ADR fails to address a predecessor's premise.

**G08-R6 — Authorization reference.**  
Every ADR SHALL reference [AI-SDOM-ARC-0001 (Section 17)] in its References section.  
*Pass:* Reference to the authorizing section is present.  
*Fail:* Authorization reference missing.

---

## G09 — Architecture Contract Conformance

**Validates:** [AI-SDOM-ARC-0001 (entire document), especially Section 2 (Design Principles) and Section 16 (Governance Boundaries)]  

**Classification:** Manual (automated tooling MAY flag potential violations for human review)  

**Trigger:** Pre-merge  

**Failure Action:** PR merge blocked pending human resolution.

### Validation Rules

**G09-R1 — No constitutional contradiction.**  
A governed document SHALL NOT contain a statement that contradicts any rule in [AI-SDOM-ARC-0001].  
*Pass:* No contradictory statements found.  
*Fail:* Direct or implied contradiction with the Architecture Contract.

**G09-R2 — Traceability completeness.**  
Every requirement, rule, or standard in a governed document SHALL cite the governing document from which it derives its authority. The citation chain SHALL terminate at [AI-SDOM-ARC-0001].  
*Pass:* Every rule has a traceable chain ending at ARC-0001.  
*Fail:* Orphan rule with no governing citation found.

**G09-R3 — Parsimony compliance.**  
A governed document SHALL NOT duplicate information that exists in another governed document. If information is required in multiple documents, cross-references SHALL be used.  
*Pass:* No substantive duplication detected.  
*Fail:* Duplicate content found across documents.

**G09-R4 — Composability consistency.**  
A governed document SHALL NOT introduce conventions that conflict with the layered composition rules.  
*Pass:* Document layers compose cleanly.  
*Fail:* Document introduces a rule that conflicts with a lower-layer document.

**G09-R5 — Explicitness compliance.**  
A governed document SHALL NOT enforce or reference implicit knowledge. All assumptions, constraints, and rules SHALL be written.  
*Pass:* No implicit assumptions detected.  
*Fail:* Document relies on unwritten knowledge.

**G09-R6 — Governance boundary respect.**  
A governed document SHALL NOT assert authority over topics listed in [AI-SDOM-ARC-0001 (Section 16.2)] unless an ADR explicitly extends governance scope.  
*Pass:* Document stays within governance boundaries.  
*Fail:* Document exceeds governance scope without authorization.

---

## G10 — Automation Boundary Compliance

**Validates:** [AI-SDOM-ARC-0001 (Section 19)]  

**Classification:** Automated  

**Trigger:** Pre-merge; periodic audit  

**Failure Action:** Pre-merge: PR blocked. Audit: compliance report generated.

### Validation Rules

**G10-R1 — No unauthorized identifier assignment.**  
A commit authored or co-authored by an automated system (including AI agents) SHALL NOT introduce a new document identifier unless the identifier was pre-assigned by a human or drawn from the correct reserved range and logged in the register.  
*Pass:* New identifiers in automation-authored commits are correctly sourced.  
*Fail:* Automation introduced an identifier without following the assignment protocol.

**G10-R2 — No main-branch direct commits.**  
No commit SHALL be pushed directly to the main branch. All changes SHALL flow through pull requests.  
*Pass:* Main branch commit history only contains merge commits.  
*Fail:* Direct commit found on main branch.

**G10-R3 — Script documentation requirement.**  
Every executable script in `scripts/` SHALL have a corresponding PRC or QLT document that defines its purpose and invocation.  
*Pass:* Every script has a documented companion.  
*Fail:* Undocumented script found.

**G10-R4 — Automation content freeze for ratified documents.**  
An automated system (including AI agents) SHALL NOT modify the content of a ratified document without human approval.  
*Pass:* No automation-authored changes to ratified documents without human co-author.  
*Fail:* Ratified document modified by automation alone.

**G10-R5 — QLT change constraint.**  
An automated system SHALL NOT add, remove, or modify the pass/fail criteria of any quality gate defined in a QLT document without human approval.  
*Pass:* QLT pass/fail changes are human-authored.  
*Fail:* QLT pass/fail criteria changed by automation.

**G10-R6 — AI compliance.**  
An AI agent's output SHALL comply with [AI-SDOM-ARC-0001 (Section 14)] and all rules in this gate.  
*Pass:* AI contributions meet both sets of constraints.  
*Fail:* AI contribution violates Section 14 or any G10 rule.

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **G02-R4 (subjective pass/fail):** Single-concern validation cannot be fully automated. Resolved by classifying G02-R4 as hybrid; the automated component flags candidates and manual review confirms.

2. **G05-R2 (lexical ambiguity):** The rule originally required `[FORWARD]` annotations without specifying placement. Resolved by requiring `[FORWARD]` to immediately precede the identifier reference.

3. **G06-R3 (automated intent detection):** An automated tool cannot perfectly classify changes as "breaking" vs. "non-breaking." Resolved by requiring the commit or PR metadata to declare the change type; the gate validates the declared type against the version increment, not the semantic content.

4. **G08-R3 (immutability enforcement boundary):** Git diff can detect content changes but cannot distinguish substantive from cosmetic changes to an ADR's immutable sections. Resolved by prohibiting ANY change to immutable sections after ratification; cosmetic corrections require a superseding ADR.

5. **G09 (manual gate dependency):** G09 is classified as manual because automated semantic contradiction detection is unreliable. The gate depends on all prior automated gates passing to ensure the document under review is structurally valid before human conformance review begins.

6. **G10-R1 (automation author identification):** Determining whether a commit author is "automated" or "human" requires reliable metadata. Resolved by defining that commits with `author` or `committer` containing known bot patterns (e.g., `[bot]`, service account names) SHALL be treated as automated for the purposes of this gate. The exact bot pattern list SHALL be defined in a REG document.

7. **G08-R5 vs G01-R3 (address vs reference tension):** G08-R5 requires a superseding ADR to "address" predecessor content, which could be misinterpreted as requiring a formal dependency (prohibited by G01-R3). Resolved by adding an explicit clarification to G08-R5 that "address" means substantive content handling, not formal cross-referencing.

8. **RESERVED_RANGES parameter (machine readability):** The configuration table originally listed "See Section 12 of ARC-0001" as the parameter value, which is AI-SDOM-specific and not machine-parseable. Resolved by using the parameterized form `[REPOSITORY_PREFIX-ARC-0001 (Section 12)]`, which a derived repository changes by replacing the prefix alone.
