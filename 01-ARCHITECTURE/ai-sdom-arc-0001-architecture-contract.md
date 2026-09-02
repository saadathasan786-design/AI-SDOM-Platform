# AI-SDOM Architecture Contract

**Identifier:** AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT  
**Version:** 1.0.0  
**Status:** Ratified  
**Layer:** 0  
**Authority:** Repository Governance Board  

---

## Preamble

This Architecture Contract is the constitutional document of the AI-SDOM repository. It defines the structural, relational, and governance rules that every document, register, template, standard, and procedure within this repository must comply with. No document in this repository may contradict this contract. Amendments to this contract follow the change process defined in its own sections.

---

## 1. Repository Philosophy

1.1 AI-SDOM is a constitutional governance repository. Its primary purpose is to host a coherent, self-documenting system of software development operations rules that are both machine-processable and human-readable.

1.2 Every artifact in this repository derives its authority from the document that empowers it. No document may claim authority it cannot trace through the dependency chain to this contract.

1.3 The repository is designed for durability over convenience. Structural changes are deliberate, rare, and require broad consensus.

1.4 AI-SDOM embraces AI-assisted authoring [Section 14] but maintains human accountability [Section 15]. Machines may suggest; humans must decide.

1.5 The repository is version-controlled (Git), with the main branch representing the ratified state. All changes flow through pull requests.

---

## 2. Design Principles

2.1 **Single Concern Principle.** Each document addresses exactly one concern. A document that mixes governance rules with technical standards is invalid.

2.2 **Traceability Principle.** Every requirement, rule, or standard must cite the governing document from which it derives its authority. The citation chain must terminate at this contract.

2.3 **Composability Principle.** Documents from different classes must be combinable without logical conflict. If two documents conflict, the one at the lower layer number prevails.

2.4 **Parsimony Principle.** No information may be duplicated across documents. When information must appear in multiple contexts, use cross-references [Section 8].

2.5 **Stability Principle.** The Architecture Contract changes via the most rigorous process in the repository. Lower-layer documents change less frequently than higher-layer documents.

2.6 **Explicitness Principle.** Implicit knowledge is not governance. All rules, assumptions, and constraints must be written. An undocumented rule cannot be enforced.

---

## 3. Layered Architecture

The repository is organized into six numbered layers plus two cross-cutting classes. Layer number determines dependency direction and change rigor.

```
Layer 0:  Architecture Contract (ARC)       -- constitutional foundation
            ↑ depends on nothing external
Layer 1:  Governance (GOV)                   -- policies, roles, decision rights
            ↑ may depend on Layer 0
Layer 2:  Standards (STD)                    -- mandatory technical rules
            ↑ may depend on Layers 0-1
Layer 3:  Procedures (PRC)                   -- step-by-step instructions
            ↑ may depend on Layers 0-2
Layer 4:  Templates (TPL)                    -- reusable document structures
            ↑ may depend on Layers 0-3
Layer 5:  Registers (REG)                    -- structured record keeping
            ↑ may depend on Layers 0-4
```

Cross-cutting classes (no layer number; may reference any layered class but not each other):
- Architecture Decision Records (ADR)
- Quality Gates (QLT)

3.1 A document's layer is encoded in its identifier [Section 5]. Every document belongs to exactly one class and at most one layer.

3.2 Cross-cutting documents belong to no layer. They are exempt from strict layering dependency direction but must comply with their own dependency constraints [Section 7.6-7.7].

---

## 4. Document Taxonomy

Every document in the repository is classified into exactly one of the following classes:

| Code | Class                      | Layer | Description                                                    |
|------|----------------------------|-------|----------------------------------------------------------------|
| ARC  | Architecture Contract      | 0     | Constitutional rules governing the repository itself           |
| GOV  | Governance                 | 1     | Policies, roles, decision rights, and governance framework     |
| STD  | Standard                   | 2     | Mandatory technical and operational rules                      |
| PRC  | Procedure                  | 3     | Step-by-step operational instructions                          |
| TPL  | Template                   | 4     | Reusable document structures and formats                       |
| REG  | Register                   | 5     | Structured record-keeping schemas and filled registries        |
| ADR  | Architecture Decision Record | X   | Immutable records of significant decisions                     |
| QLT  | Quality Gate               | X     | Validation rules and quality check definitions                 |

4.1 No other classes may be introduced without amending this contract [Section 13].

4.2 A document class may have sub-classifications defined in the relevant GOV document for that class.

---

## 5. Document Identifier Scheme

5.1 Every document receives a globally unique identifier conforming to:

```
AI-SDOM-{CLASS}-{NNNN}-{SHORT-NAME}
```

Where:
- `AI-SDOM` is the repository prefix (invariant).
- `{CLASS}` is the two- or three-letter class code from Section 4.
- `{NNNN}` is a zero-padded four-digit sequential number unique within that class.
- `{SHORT-NAME}` is a kebab-case descriptive slug derived from the document title.

5.2 Examples:
- `AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT`
- `AI-SDOM-GOV-0001-DECISION-RIGHTS`
- `AI-SDOM-STD-0001-CODING-STANDARDS`
- `AI-SDOM-ADR-0042-TYPESCRIPT-STRICT-MODE`

5.3 The identifier is assigned at creation and never changes. If a document is deprecated, its identifier is retired and recorded in a register.

5.4 The filename of every document must match its identifier in lowercase:
`ai-sdom-{class}-{nnnn}-{short-name}.md`

---

## 6. Repository Directory Structure

```
AI-SDOM/
├── 00-ARCHITECTURE/           # Layer 0: ARC documents
├── 01-GOVERNANCE/             # Layer 1: GOV documents
├── 02-STANDARDS/              # Layer 2: STD documents
├── 03-PROCEDURES/             # Layer 3: PRC documents
├── 04-TEMPLATES/              # Layer 4: TPL documents
├── 05-REGISTERS/              # Layer 5: REG documents
├── 06-DECISIONS/              # Cross-cutting: ADR documents
├── 07-QUALITY/                # Cross-cutting: QLT documents
├── .ai/                       # AI tooling configuration and context files
├── scripts/                   # Automation scripts [Section 19]
├── README.md                  # Repository entry point
└── .gitignore                 # Git exclusion rules
```

6.1 Each numbered directory contains only documents of the corresponding class.

6.2 The `.ai/` directory may contain context files, AI configuration, prompt templates, and automation rules consumed by CI/CD or AI agents.

6.3 The `scripts/` directory may contain executable automation scripts. Every script must have a corresponding QLT or PRC document that defines its purpose and invocation.

6.4 The files `README.md` and `.gitignore` at the repository root are infrastructure files, not governed documents. They are exempt from classification, identifier, and layering rules.

6.5 No governed document may reside outside the numbered directories. Exceptions require an ADR.

---

## 7. Dependency Rules Between Document Classes

7.1 A layered document at layer N may reference documents at layers 0 through N inclusive. It must not reference documents at layer N+1 or higher.

7.2 Cross-cutting documents (ADR, QLT) may reference any layered document (Layers 0-5). An ADR must not reference another ADR. A QLT must not reference another QLT. An ADR and a QLT must not reference each other.

7.3 Every document must include a "Dependencies" section listing all documents it references. The format is a bullet list of identifiers. If there are no dependencies, the section must read "Dependencies: None."

7.4 No chain of dependencies may form a cycle. If document A references document B, and document B references document C, then document C must not reference document A (directly or transitively).

7.5 A Standard (STD) must cite the Governance (GOV) document that authorizes it. A Procedure (PRC) must cite the Standard (STD) it implements. A Template (TPL) must cite the document class it templates. A Register (REG) must cite the document whose records it holds.

7.6 An ADR must reference the document(s) that motivated the decision and any document(s) affected by the decision.

7.7 A QLT must reference the document(s) whose quality it validates.

7.8 Dependency verification is performed by an automated quality gate [Section 18].

---

## 8. Cross-Reference Rules

8.1 All cross-references use the formal syntax:
- Within document: `[Section X.Y]`
- To another document: `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]`

8.2 Every cross-reference to another document must resolve to an existing document identifier. Unresolvable references are defects.

8.3 Forward references (to documents not yet created) are permitted only in ADRs and in this Architecture Contract. A forward reference must be annotated with `[FORWARD]` and a placeholder identifier from the reserved range [Section 12].

8.4 Cross-references between classes must comply with Section 7 dependency rules.

8.5 All cross-references must be validated by an automated quality gate on every commit to the main branch [Section 18].

---

## 9. Versioning Strategy

9.1 Every layered document uses Semantic Versioning 2.0.0: `MAJOR.MINOR.PATCH`.

9.2 MAJOR version increment indicates:
- For ARC: an incompatible change to the repository constitution.
- For GOV: a policy change that invalidates existing procedures or standards.
- For STD: a breaking change requiring non-compliant artifacts to be updated.
- For PRC, TPL, REG: any change that breaks backward compatibility.

9.3 MINOR version increment indicates backward-compatible additions (new rules, optional steps, extended templates).

9.4 PATCH version increment indicates corrections that do not change intent (typos, formatting, clarifications, fixed references).

9.5 Version is recorded in the document's front matter as the `version` field. The version must match the Git tag for ratified releases.

9.6 ADRs do not carry a version. Once ratified (Status: Accepted), an ADR's substantive content is immutable. The sole mutable field is `Status`, which may be updated to "Superseded by AI-SDOM-ADR-NNNN" [Section 17.3].

9.7 QLT documents follow the same versioning rules as layered documents.

---

## 10. Change Impact Rules

10.1 Any proposed change must include an impact statement listing every document potentially affected.

10.2 A change to a Layer N document triggers mandatory review of all documents that depend on it (directly or transitively).

10.3 Breaking changes (MAJOR version increment) require:
- A minimum 14-calendar-day review period.
- Notification to all document owners identified in the dependency chain.
- Approval per Section 15.

10.4 Non-breaking changes (MINOR, PATCH) require:
- A minimum 48-hour review period.
- Approval per Section 15.

10.5 Urgent changes (security vulnerabilities, critical errors) may follow an expedited process defined in a GOV document.

10.6 Change impact analysis is supported by an automated dependency graph maintained in the REG class.

---

## 11. Naming Conventions

11.1 **Directories:** `NN-CATEGORY-NAME` where NN is a zero-padded two-digit number, CATEGORY is an uppercase class code, and NAME is an uppercase descriptor. Example: `02-STANDARDS`.

11.2 **Files:** `ai-sdom-{class}-{nnnn}-{short-name}.md` where all alphabetic characters are lowercase. Example: `ai-sdom-arc-0001-architecture-contract.md`.

11.3 **Assets** (images, diagrams, data files): `{short-name}-{descriptor}.{ext}` in lowercase kebab-case. Example: `architecture-contract-layer-diagram.png`.

11.4 **Scripts:** `{verb}-{target}.{ext}` in lowercase kebab-case. Example: `validate-references.py`.

11.5 **Branches:** `{type}/{identifier-or-description}` where type is one of `feat`, `fix`, `chore`, `docs`. Example: `feat/arc-0001-architecture-contract`.

11.6 **Tags:** `v{MAJOR}.{MINOR}.{PATCH}` prefixed with the document identifier for ratified releases. Example: `ai-sdom-arc-0001-v1.0.0`.

---

## 12. Reserved Document Ranges

Each class has reserved number ranges to support future expansion:

| Class | Reserved Range   | Purpose                         |
|-------|------------------|---------------------------------|
| ARC   | 0001-0099        | Architecture Contract series    |
| ARC   | 0100-0199        | Extension architecture docs     |
| ARC   | 0200-0999        | Reserved for future use         |
| GOV   | 0001-0099        | Core governance documents       |
| GOV   | 0100-0999        | Domain governance documents     |
| STD   | 0001-0099        | Universal standards             |
| STD   | 0100-0999        | Domain-specific standards       |
| PRC   | 0001-0999        | Operational procedures          |
| PRC   | 1000-1999        | Domain procedures               |
| TPL   | 0001-0999        | Document templates              |
| REG   | 0001-0999        | Registry schemas                |
| REG   | 1000-9999        | Filled registry entries         |
| ADR   | 0001-9999        | Decision records                |
| QLT   | 0001-0099        | Quality gate definitions        |
| QLT   | 0100-0999        | Quality check configurations    |

12.1 When a range is exhausted, an amendment to this contract expands it. The expansion must not reuse retired identifiers.

12.2 No identifier may be reused after its document is deprecated.

---

## 13. Future Extensibility Rules

13.1 New document classes may be introduced by amending Section 4. The new class must be assigned a unique two- or three-letter code not already in use.

13.2 New classes must be placed into an existing layer or a new layer. If a new layer is required, it must be appended after the highest existing layer number rather than inserted between existing layers, to preserve directory numbering. The layered architecture diagram in Section 3 must be updated accordingly.

13.3 New layers must not violate the dependency direction: a layer may depend only on lower-numbered layers.

13.4 Cross-cutting classes may be added by amending Section 3. New cross-cutting classes must specify what they may and may not reference.

13.5 The reserved ranges in Section 12 accommodate growth. If structural growth requires renaming directories, the Governance Board must approve a migration plan.

13.6 Any extensibility decision must be recorded in an ADR.

---

## 14. AI-Assisted Authoring Principles

14.1 AI tools may be used to draft, review, and refine documents, subject to the constraints in this section.

14.2 Every document created or substantially modified with AI assistance must include a front-matter field `ai-assistance` indicating which AI tool was used and the extent of assistance (e.g., "Claude: initial draft," "GPT-4: consistency review").

14.3 AI-generated content is advisory. The human author bears full responsibility for correctness, completeness, and compliance with this contract.

14.4 AI tools must not generate document identifiers. Identifiers are assigned by a human or by an automated system under human supervision, using the master register in 05-REGISTERS.

14.5 AI-generated cross-references must be verified by a human against the dependency rules [Section 7] before submission.

14.6 AI tools may be used for quality validation (reference resolution, contradiction detection) without human pre-approval, but results must be reviewed before publication.

14.7 The `.ai/` directory may contain configuration files that instruct AI tools about the repository's structure and constraints. These files must themselves comply with this contract.

---

## 15. Human Approval Principles

15.1 **Architecture Contract changes** (ARC class, Layer 0) require:
- Unanimous approval from the Governance Board.
- A minimum 14-day review period.
- Ratification vote recorded in an ADR.

15.2 **Governance changes** (GOV class, Layer 1) require:
- Two-thirds majority approval from the Governance Board.
- A minimum 7-day review period.
- Ratification vote recorded in an ADR.

15.3 **Standard changes** (STD class, Layer 2) require:
- Majority approval from the relevant domain maintainer.
- A minimum 48-hour review period.

15.4 **Procedure, Template, Register changes** (PRC, TPL, REG, Layers 3-5) require:
- Approval from the document owner or designated maintainer.
- No minimum review period unless the change has downstream impact [Section 10].

15.5 **ADR ratification** requires:
- Approval from at least two reviewers independent of the decision author.
- For decisions affecting Layer 0, additional unanimous Governance Board approval [Section 15.1].
- For decisions affecting Layer 1, additional two-thirds majority Governance Board approval [Section 15.2].

15.6 **Quality Gate changes** (QLT class) require:
- Approval from the Quality domain maintainer.
- Notification to all document owners whose documents are validated by that gate.

15.7 All approvals must be recorded in the relevant pull request or an ADR. Verbal or offline approvals are not recognized.

---

## 16. Governance Boundaries

16.1 This Architecture Contract governs:
- The structure, naming, and organization of all documents in the repository.
- The dependency and cross-reference relationships between documents.
- The versioning and change management of all documents.
- The roles and approval thresholds for document changes.
- The use of AI tools in document authoring.
- The quality validation processes for repository artifacts.

16.2 This Architecture Contract explicitly does not govern:
- The content or substance of software development practices (these are defined in GOV, STD, and PRC documents).
- The engineering toolchain configuration (CI/CD, linters, formatters) unless those tools interact with repository structure.
- Personnel management, team structures, or HR policies.
- Software architecture decisions for specific projects (these are captured in ADRs).
- Source code within the organization's development repositories.

16.3 Any topic not explicitly addressed by this contract is governed by the nearest applicable higher-layer document, or, if none exists, may be governed by a new document created according to the process defined herein.

---

## 17. Architectural Decision Records

17.1 An Architecture Decision Record (ADR) documents a significant decision with architectural impact. ADRs are cross-cutting [Section 3] and occupy no layer.

17.2 Every ADR must contain the following sections in order:
- **Title:** Concise statement of the decision.
- **Status:** Proposed | Accepted | Superseded.
- **Context:** The problem or force motivating the decision.
- **Decision:** The chosen approach.
- **Consequences:** Expected outcomes, both positive and negative.
- **Alternatives Considered:** At least one alternative with rationale for rejection.
- **References:** Documents that motivated or are affected by this decision.

17.3 Once an ADR is ratified (Status: Accepted), its substantive content (Title, Context, Decision, Consequences, Alternatives Considered, References) is immutable. The sole mutable field is `Status`, which may be updated to "Superseded by AI-SDOM-ADR-NNNN" when a subsequent ADR replaces it.

17.4 ADRs must not create circular dependency chains. If ADR-B supersedes ADR-A, and ADR-A was premised on ADR-C, ADR-B must address ADR-C's content directly.

17.5 Every ADR must reference this section [Section 17] as the authorization for its creation.

---

## 18. Quality Gate Architecture

18.1 Quality gates are automated or manual checks that validate conformance to this contract and other repository documents.

18.2 Every quality gate is documented as a QLT document in `07-QUALITY/`. Each QLT document specifies:
- What it validates.
- The pass/fail criteria.
- Whether it is automated, manual, or hybrid.
- When it runs (pre-commit, CI, periodic audit).
- What happens on failure.

18.3 Mandatory automated quality gates (must pass before merge to main):
- **Identifier Uniqueness:** No duplicate document identifiers.
- **Reference Resolution:** All cross-references resolve to existing identifiers.
- **Dependency Acyclicity:** No circular dependency chains.
- **Naming Compliance:** All filenames match Section 11 conventions.
- **Layer Compliance:** Documents reside in directories matching their class.

18.4 Mandatory manual quality gates (must pass before merge to main):
- **Content Review:** Subject matter expert verifies technical correctness.
- **Contract Compliance:** Reviewer verifies compliance with this contract.
- **Consistency Review:** Cross-document consistency check.

18.5 Quality gate definitions are themselves subject to quality gates. A change to a QLT document must be validated against the meta-gate defined in the same class.

---

## 19. Automation Boundaries

19.1 Non-AI automation (scripts, CI/CD pipelines, linting tools) may perform the following without human approval:
- Reference resolution validation [Section 8.5].
- Dependency graph generation and cycle detection [Section 7.8].
- Identifier assignment for new documents, provided the identifier is drawn from the correct reserved range [Section 12] and logged in the register.
- Formatting and linting according to repository conventions.
- Automated quality gate execution [Section 18.3].

19.2 Automation may perform the following only with human approval:
- Document identifier creation when the reserved range default is insufficient.
- Any change to the content of a ratified document.
- Deprecation or removal of a document.
- Any change to a QLT quality gate pass/fail criteria.

19.3 Automation must never:
- Assign a document identifier that duplicates an existing identifier.
- Modify the Architecture Contract without a pull request and Governance Board approval.
- Bypass the human approval chain defined in Section 15.
- Commit directly to the main branch.

19.4 All automation scripts in `scripts/` must have a corresponding PRC or QLT document defining their purpose. Undocumented scripts are not permitted.

19.5 AI agents (code generation assistants, review bots, automated governance tools) are classified as automation for the purposes of this section. They must comply with Sections 14 and 19 simultaneously. Where the two sections conflict, the more restrictive rule prevails.

---

## 20. Repository Evolution Strategy

20.1 This repository evolves through deliberate, governed changes. Evolution triggers include:
- Identified gaps in governance coverage.
- Changes in the engineering organization's structure or tooling.
- Lessons learned from operational incidents.
- Introduction of new technologies that existing standards do not address.
- Regulatory or compliance requirements.

20.2 Deprecation follows a defined lifecycle:
1. **Active:** The document is in effect and enforced.
2. **Deprecated:** The document is marked deprecated via a front-matter status change. It remains in effect during a transition period. Minimum transition periods by class: ARC (180 days), GOV (90 days), STD (90 days), PRC/TPL/REG (30 days), ADR (no transition — superseding ADR takes effect immediately), QLT (60 days).
3. **Retired:** The document identifier is removed from the active register after the transition period expires. Retired documents are archived but remain readable for historical reference.

20.3 Deprecated or retired documents must not be referenced by new documents. Existing references must be updated during the transition period.

20.4 Archival preserves the complete history (Git history plus an archived copy in a designated archive tag). No document is ever permanently deleted.

20.5 The repository structure and governance should be reviewed annually by the Governance Board. The review findings are recorded in an ADR.

20.6 Adoption of this repository by new teams or domains is governed by a GOV document on domain admission.

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval         |
|---------|------------|--------|-----------------------|------------------|
| 1.0.0   | 2026-07-31 | -      | Initial ratification  | Governance Board |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Section 7.1 (original ambiguity):** Early draft had conflicting rules about layer N depending on N-2. Resolved by adopting the clean rule: Layer N may reference layers 0 through N only.

2. **Section 7.3 (scope gap):** Original draft did not specify that cross-cutting documents also require a Dependencies section. Added explicit coverage of all documents.

3. **Section 9.6 vs Section 17.3 (immutability contradiction):** Section 9.6 stated ADRs are "immutable after ratification" while Section 17.3 required the Status field to be mutable for superseding. Resolved by clarifying in Section 9.6 that substantive content is immutable and Status is the sole mutable field.

4. **Section 13.2 (directory renumbering risk):** Original draft said new layers may be "inserted" between existing layers, which would break directory numbering. Resolved by requiring new layers to be appended after the highest existing layer.

5. **Section 14.4 vs Section 19.1 (identifier assignment contradiction):** Section 14.4 prohibited AI from generating identifiers, while Section 19.1 allowed automation (including AI per 19.5) to assign identifiers without approval. Resolved by scoping 19.1 to "non-AI automation" and adding a conflict-resolution rule in 19.5 (more restrictive rule prevails).

6. **Section 15.5 (ambiguous approval threshold):** ADR ratification for Layer 0/1 decisions referenced "approval as specified above" without distinguishing the two layers. Resolved by explicitly naming the approval mechanism for each: Section 15.1 (unanimous) for Layer 0, Section 15.2 (two-thirds) for Layer 1.

7. **Section 20.2 (missing transition periods):** Deprecation timeline did not specify transition periods for ARC, GOV, ADR, or QLT. Resolved by defining periods for all classes.

8. **Section 6 (infrastructure exemption gap):** README.md and .gitignore at repository root had no classification exemption. Resolved by adding Section 6.4 exempting them from governance rules.

9. **Deferred role definitions (acknowledged gap):** The "Governance Board," "domain maintainer," and "document owner" roles referenced in Section 15 are not defined in this contract. These role definitions are intentionally deferred to the GOV layer (Layer 1). The initial Governance Board is the repository's founding authors; formal composition must be defined in the first GOV document.
