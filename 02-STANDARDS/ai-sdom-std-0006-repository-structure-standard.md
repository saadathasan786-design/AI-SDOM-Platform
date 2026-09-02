---
identifier: AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD
title: Repository Structure Standard
version: 0.1.1
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
tags:
  - structure
  - standards
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-01: initial draft"
---

# Repository Structure Standard

## 1. Purpose

1.1 This standard is the canonical specification of the physical structure and organization of the AI-SDOM repository. It is the single source of truth for how the repository is laid out, how its directories are organized, where each class of controlled document resides, and how the repository is expected to grow, migrate, and be machine-read. It defines repository structure only; it SHALL NOT define governance, operational procedures, architecture rules, metadata rules, versioning rules, naming rules, or cross-reference rules.

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 6)], which establishes the repository directory structure and its constraints, and from [AI-SDOM-STD-0005 (Section 6)], which establishes directory naming conventions. This standard is the canonical specification of the repository structure: it specifies, extends, and operationalizes them without contradicting them. Where this standard and [AI-SDOM-ARC-0001] describe the same structural rule, [AI-SDOM-ARC-0001] remains the constitutional authority and prevails in case of conflict [AI-SDOM-ARC-0001 (Section 2.3)].

1.3 This standard applies to:
- The repository root and every directory, subdirectory, and file location within it.
- The placement of every governed document by class.
- Administrative, asset, and archive locations.
- Machine-readable tooling, automation, or AI agents that read or write repository structure [AI-SDOM-ARC-0001 (Section 14, Section 19)].

---

## 2. Scope

2.1 This standard governs the physical structure and organization of the AI-SDOM repository. It defines the repository root structure [Section 4], layer directory structure [Section 5], controlled document placement [Section 6], administrative structure [Section 7], asset organization [Section 8], archive structure [Section 9], repository growth rules [Section 10], structural constraints [Section 11], machine-readable structure [Section 12], validation rules [Section 13], and migration guidance [Section 14].

2.2 This standard does not govern:
- The content or substance of a document's body.
- The identifier scheme, reserved number ranges, and their allocation (governed by [AI-SDOM-ARC-0001 (Section 5, Section 12)] and the Repository Register).
- The naming of documents, directories, assets, scripts, Git objects, or the repository itself (governed by [AI-SDOM-STD-0005]).
- Metadata field values, data types, or representation (governed by [AI-SDOM-STD-0002]).
- Version strings and version increments (governed by [AI-SDOM-STD-0004]).
- Reference syntax and lifecycle (governed by [AI-SDOM-STD-0003]).
- Governance of the repository, decision rights, or approval processes (governed by the GOV class and [AI-SDOM-ARC-0001 (Section 15)]).
- Operational procedures for restructuring or migration execution (governed by the PRC class).
- The certification criteria applied to repository structure (governed by the QLT class).

---

## 3. Repository Structure Philosophy

The repository structure is governed by the following principles, which justify the specific rules in this standard. They are stated as guidance; the normative requirements they motivate appear in the sections that follow and in the validation rules [Section 13].

3.1 **Layered organization.** The repository SHALL be organized into layer directories that mirror the document layering defined in [AI-SDOM-ARC-0001 (Section 3)]. Each layer directory SHALL contain only documents of the class that occupies that layer [AI-SDOM-ARC-0001 (Section 6.1)].

3.2 **Separation of concerns.** Each directory SHALL have a single, clearly defined purpose. A directory SHALL NOT mix content of different classes, types, or lifecycles. Administrative material SHALL NOT be stored inside a governed document directory [Section 7].

3.3 **Predictability.** A reader or tool SHALL be able to determine where any artifact belongs, and what a directory contains, from the structure alone. Given a document's class, its location SHALL be deterministic [Section 6].

3.4 **Scalability.** The structure SHALL accommodate growth — new documents, new classes, new layers, and new domains — without renumbering or relocating existing directories [Section 10]. The reserved ranges in [AI-SDOM-ARC-0001 (Section 12)] and the reserved expansion locations in this standard [Section 10] provide the headroom.

3.5 **Traceability.** Every governed document's location SHALL be traceable to its class and identifier, and the Repository Register SHALL record that location. Structure SHALL never obscure which document a file or asset belongs to.

3.6 **Stability.** Directory names and locations SHALL be stable across the document lifecycle. Deprecation and retirement SHALL move a document to an archive location rather than renaming or renumbering it [Section 9, AI-SDOM-ARC-0001 (Section 20.2)].

3.7 **Human readability.** The structure SHALL be navigable by a person with no prior exposure: short names, meaningful descriptors, and consistent patterns [AI-SDOM-STD-0005 (Section 6)].

3.8 **Machine readability.** The structure SHALL be parseable by automation without ambiguity. This standard provides a canonical repository tree, a directory schema, and parser expectations [Section 12].

---

## 4. Repository Root Structure

4.1 **Canonical root.** The repository root is the directory named `AI-SDOM`. Its required structure is defined by [AI-SDOM-ARC-0001 (Section 6)] and reproduced here as the canonical layout this standard operationalizes:

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
├── scripts/                   # Automation scripts
├── README.md                  # Repository entry point
└── .gitignore                 # Git exclusion rules
```

4.2 **Mandatory root directories.** The eight numbered directories (`00-ARCHITECTURE` through `07-QUALITY`), the `.ai/` directory, and the `scripts/` directory SHALL exist at the repository root. The two infrastructure files `README.md` and `.gitignore` SHALL exist at the repository root per [AI-SDOM-ARC-0001 (Section 6.4)].

4.3 **Optional root content.** Additional content at the repository root is limited to:
- Non-governed administrative directories as defined in [Section 7], which SHALL be created only when the material they hold exists.
- Nothing else. A governed document SHALL NOT reside at the repository root [AI-SDOM-ARC-0001 (Section 6.5)].

4.4 **Prohibited root-level directories.** A top-level directory SHALL NOT be created unless it is one of the directories in [Section 4.1] or an administrative directory defined in [Section 7]. In particular, a top-level directory SHALL NOT be created for:
- A document class not present in the taxonomy [AI-SDOM-ARC-0001 (Section 4)] (for example, a hypothetical `08-SOURCE/` for source code — source code is out of scope per [AI-SDOM-ARC-0001 (Section 16.2)]).
- Working, temporary, or scratch material at the root; such material SHALL use the administrative locations [Section 7].
- A duplicated class directory (for example, a second directory holding STD documents) [Section 11.3].

4.5 **Root-level exceptions.** The files `README.md` and `.gitignore` are infrastructure files exempt from classification, identifier, and layering rules [AI-SDOM-ARC-0001 (Section 6.4)]. The `.ai/` directory is exempt from the `NN-CATEGORY-NAME` naming form by definition [AI-SDOM-ARC-0001 (Section 6.2)]. The `scripts/` directory is exempt from the `NN-CATEGORY-NAME` naming form by definition [AI-SDOM-ARC-0001 (Section 6.3)].

---

## 5. Layer Directory Structure

5.1 **Layer directories.** Each numeric layer defined in [AI-SDOM-ARC-0001 (Section 3)] SHALL have exactly one top-level directory, named `NN-CATEGORY-NAME` per [AI-SDOM-ARC-0001 (Section 11.1)], where NN is the layer number. The mapping is:

| Layer | Directory | Class |
|-------|-----------|-------|
| 0     | 00-ARCHITECTURE | ARC |
| 1     | 01-GOVERNANCE  | GOV |
| 2     | 02-STANDARDS   | STD |
| 3     | 03-PROCEDURES  | PRC |
| 4     | 04-TEMPLATES   | TPL |
| 5     | 05-REGISTERS   | REG |

5.2 **Class directories.** A layer directory SHALL contain only documents of the class that occupies that layer [AI-SDOM-ARC-0001 (Section 6.1)]. The layer number in the directory name SHALL match the class's layer [Section 5.1].

5.3 **Reserved layer locations.** Numbered directories beyond the currently defined layers (for example, `08-`, `09-`) are reserved for future layers. Per [AI-SDOM-ARC-0001 (Section 13.2)], a new layer SHALL be appended after the highest existing layer number rather than inserted between existing layers, preserving directory numbering.

5.4 **Cross-cutting directories.** The two cross-cutting classes occupy two top-level directories that do not correspond to numeric layers:

| Directory | Class | Note |
|-----------|-------|------|
| 06-DECISIONS | ADR | Cross-cutting, no layer |
| 07-QUALITY   | QLT | Cross-cutting, no layer |

5.5 **Directory numbering invariant.** The sequence `00` through `07` at the repository root SHALL be contiguous. A gap in the numbered sequence SHALL NOT be introduced except by an amendment to [AI-SDOM-ARC-0001 (Section 6)]; reserved future numbers follow contiguously after the highest assigned number [Section 5.3].

5.6 **Naming of directories.** Directory naming is governed by [AI-SDOM-STD-0005 (Section 6)]. This standard references those rules and does not restate them. In particular: a top-level class directory SHALL use the `NN-CATEGORY-NAME` form [AI-SDOM-STD-0005 (Section 6.2)], and a subdirectory within a numbered directory SHALL use lowercase kebab-case [AI-SDOM-STD-0005 (Section 6.3)].

---

## 6. Controlled Document Placement

6.1 **Placement rule.** A governed document SHALL reside in the top-level directory corresponding to its class [AI-SDOM-ARC-0001 (Section 6.1, Section 6.5)]. No governed document SHALL reside outside the numbered directories except as provided by [AI-SDOM-ARC-0001 (Section 6.5)].

6.2 **Placement matrix.** The required location for each document class is:

| Class | Layer | Directory | Constraint |
|-------|-------|-----------|------------|
| ARC   | 0     | 00-ARCHITECTURE | Only ARC documents |
| GOV   | 1     | 01-GOVERNANCE  | Only GOV documents |
| STD   | 2     | 02-STANDARDS   | Only STD documents |
| PRC   | 3     | 03-PROCEDURES  | Only PRC documents |
| TPL   | 4     | 04-TEMPLATES   | Only TPL documents |
| REG   | 5     | 05-REGISTERS   | Only REG documents |
| ADR   | X     | 06-DECISIONS   | Only ADR documents |
| QLT   | X     | 07-QUALITY     | Only QLT documents |

6.3 **Determinism.** The location of a governed document SHALL be determined solely by its class. Given a document identifier `AI-SDOM-CLASS-NNNN-...`, its directory SHALL be the one that corresponds to `CLASS` in [Section 6.2]. This SHALL be verifiable from the Repository Register, which records each document's directory.

6.4 **Subdirectory placement.** A governed document SHALL reside directly in its class's top-level directory unless a subdirectory exists for a documented grouping purpose per [AI-SDOM-ARC-0001 (Section 6.1)] and [Section 8]. A governed document SHALL NOT reside in an asset subdirectory, an administrative directory [Section 7], or an archive directory [Section 9].

6.5 **Class directory exclusivity.** A class directory SHALL NOT contain documents of another class [AI-SDOM-ARC-0001 (Section 6.1)]. Where a document of one class needs to reference material stored under another class, the reference SHALL be a cross-reference per [AI-SDOM-STD-0003], not a physical relocation.

---

## 7. Administrative Structure

Administrative material is material that supports the repository but is not itself a governed document. This standard defines its locations so that it never contaminates governed directories.

7.1 **Administrative locations.** Administrative material SHALL be stored in administrative directories created at the repository root per [Section 4.3], each named in lowercase kebab-case per [AI-SDOM-STD-0005 (Section 6)]. The following locations are defined:

| Location | Content |
|----------|---------|
| `certification-reports/` | Certification reports produced by quality-validation phases [Section 7.2] |
| `releases/` | Release packages assembled for distribution [Section 7.3] |
| `working/` | Working material that is not ready to be governed [Section 7.4] |
| `drafts/` | Draft material in preparation for becoming a governed document [Section 7.5] |
| `imported/` | Material imported from outside the repository awaiting review [Section 7.6] |
| `legacy/` | Legacy material retained for reference that is not governed [Section 7.7] |

7.2 **Certification reports.** A certification report that validates repository artifacts (for example, a phase certification report) SHALL be stored in `certification-reports/`. Certification reports SHALL NOT be governed documents, SHALL NOT carry an AI-SDOM identifier, and SHALL be named per the document naming rules [AI-SDOM-STD-0005 (Section 5)] where applicable.

7.3 **Release packages.** A release package (a coherent set of documents, assets, and metadata assembled for a release) SHALL be stored in `releases/`. A release package SHALL be named using the release identification rules of [AI-SDOM-STD-0004 (Section 10)] and SHALL reference the repository tag that marks the release [AI-SDOM-ARC-0001 (Section 11.6)].

7.4 **Working material.** Working material (notes, scratch files, in-progress edits) SHALL be stored in `working/`. Working material SHALL NOT be a governed document and SHALL NOT be referenced by a governed document.

7.5 **Draft material.** A draft of a future governed document SHALL be stored in `drafts/` until it is ready to be classified. When a draft becomes a governed document, it SHALL be moved to the appropriate class directory [Section 6] and given its identifier at that time [AI-SDOM-ARC-0001 (Section 5.3, Section 14.4)]. Drafts SHALL NOT be placed directly in a class directory.

7.6 **Imported material.** Material imported from outside the repository (external standards, reference copies, downloads) SHALL be stored in `imported/`. Imported material SHALL be reviewed before it is referenced by a governed document; a governed document SHALL reference imported material through the external reference mechanism of [AI-SDOM-STD-0003], not by physical inclusion unless the inclusion is approved.

7.7 **Legacy material.** Material that is no longer active but is retained for historical reference SHALL be stored in `legacy/` if it is not a governed document. Retired governed documents SHALL be archived per [Section 9], not stored in `legacy/`.

7.8 **Administrative exclusion.** An administrative directory SHALL NOT contain a governed document [Section 6.5], and governed directories SHALL NOT contain administrative material [Section 3.2].

---

## 8. Asset Organization

8.1 **Asset folders.** Assets associated with a governed document SHALL reside in an asset folder named `{document-short-name}-assets` in lowercase kebab-case, located within the same numbered directory as its governing document, per [AI-SDOM-STD-0005 (Section 6.4)].

8.2 **Asset folder sub-layout.** Within an asset folder, assets SHALL be organized into subdirectories by kind, each named in lowercase kebab-case:

| Subdirectory | Content |
|--------------|---------|
| `images/`      | Image files (PNG, JPEG, SVG) |
| `diagrams/`    | Diagram source and rendered files (draw.io, Mermaid, PNG) |
| `pdfs/`        | PDF documents attached or generated |
| `examples/`    | Example files illustrating the governing document |
| `templates/`   | Template files associated with the governing document |
| `attachments/` | Attachments referenced by the governing document |
| `generated/`   | Artifacts produced by automation [Section 8.4] |

8.3 **Shared assets.** Assets not specific to a single document SHALL reside in a `shared-assets/` folder within the appropriate numbered directory, or in `shared-assets/` at the repository root when shared across classes, per [AI-SDOM-STD-0005 (Section 6.4)]. A shared asset SHALL be referenced from governing documents by cross-reference [AI-SDOM-STD-0003].

8.4 **Generated artifacts.** Artifacts produced by automation (builds, exports, derived diagrams) SHALL reside in the `generated/` subdirectory of the asset folder [Section 8.2]. Generated artifacts SHALL be reproducible, SHOULD be excluded from version control by the repository `.gitignore` [Section 4.2] when they can be regenerated, and SHALL NOT be treated as governed documents.

8.5 **Asset placement constraints.** An asset SHALL NOT be stored in a governed document's parent directory if an asset folder exists [Section 8.1]. An asset SHALL NOT be stored at the repository root. An asset SHALL NOT be named in the reserved identifier form [AI-SDOM-STD-0005 (Section 12)].

---

## 9. Archive Structure

9.1 **Archive directories.** Archive material SHALL be stored in archive directories named `{NN}-ARCHIVE` at the top level, or `archive-{descriptor}` within an enclosing tree, per [AI-SDOM-STD-0005 (Section 6.5)]. The archive location SHALL preserve the material's origin and class.

9.2 **Historical versions.** Historical versions of governed documents SHALL be preserved in the repository's Git history [AI-SDOM-ARC-0001 (Section 20.4)]. A Git tag per [AI-SDOM-ARC-0001 (Section 11.6)] SHALL mark each ratified release; the archive copy SHALL be derived from the tagged state.

9.3 **Retired documents.** A document entering the Retired lifecycle state [AI-SDOM-ARC-0001 (Section 20.2)] SHALL be moved to the archive location for its class after the transition period expires. Retired documents SHALL remain readable for historical reference and SHALL NOT be deleted [AI-SDOM-ARC-0001 (Section 20.4)].

9.4 **Superseded documents.** A document that has been superseded by another (for example, an ADR marked `Superseded by AI-SDOM-ADR-NNNN` [AI-SDOM-ARC-0001 (Section 17.3)]) SHALL retain its location and identifier while in the Deprecated state and SHALL be archived when it reaches Retired [Section 9.3].

9.5 **Preservation rules.** The following SHALL hold for archive material:
- The archive copy SHALL be immutable and SHALL NOT be edited in place; corrections SHALL be new documents.
- The archived identifier SHALL NOT be reused [AI-SDOM-ARC-0001 (Section 12.2)].
- Archive material SHALL NOT be referenced by new governed documents [AI-SDOM-ARC-0001 (Section 20.3)]; existing references SHALL be updated during the transition period.
- No document SHALL ever be permanently deleted [AI-SDOM-ARC-0001 (Section 20.4)].

---

## 10. Repository Growth Rules

10.1 **Growth authority.** Growth of the repository structure (new layers, new classes, new top-level directories) SHALL be governed by [AI-SDOM-ARC-0001 (Section 13)] and the governance process defined in the GOV class. This standard defines the structural consequences of growth, not the governance authority to approve it.

10.2 **Adding new layers.** A new layer SHALL be appended after the highest existing layer number [AI-SDOM-ARC-0001 (Section 13.2)]. Its directory SHALL be the next number in sequence [Section 5.3], SHALL use the `NN-CATEGORY-NAME` form [AI-SDOM-STD-0005 (Section 6.2)], and SHALL be recorded in this standard's placement matrix [Section 6.2] by amendment.

10.3 **Adding new classes.** A new document class SHALL be introduced only by amending [AI-SDOM-ARC-0001 (Section 4)] [AI-SDOM-ARC-0001 (Section 13.1)]. A new cross-cutting class SHALL be introduced only by amending [AI-SDOM-ARC-0001 (Section 3)] [AI-SDOM-ARC-0001 (Section 13.4)]. Each new class SHALL receive a directory, a reserved range [AI-SDOM-ARC-0001 (Section 12)], and a row in the placement matrix [Section 6.2].

10.4 **Creating new directories.** A new top-level directory SHALL NOT be created except as provided by [Section 4] (class directories, administrative directories). A new subdirectory within a numbered directory SHALL be created only for a documented grouping purpose [Section 8.2] or an asset folder [Section 8.1], SHALL use lowercase kebab-case [AI-SDOM-STD-0005 (Section 6.3)], and SHALL be within the structural constraints [Section 11].

10.5 **Expansion principles.** Expansion SHALL follow these principles:
- Expand by appending, not renumbering: existing directory names and locations SHALL NOT change to make room for growth [Section 3.6].
- Expand within reserved headroom first: unused ranges [AI-SDOM-ARC-0001 (Section 12)] and reserved future numbers [Section 5.3] SHALL be consumed before structural changes.
- Every structural change SHALL be accompanied by a corresponding update to the machine-readable schema [Section 12] and the Repository Register.

10.6 **Reserved expansion areas.** The following areas are reserved for growth and SHALL NOT be used for other purposes:
- Numbered directories above the highest assigned layer (for example, `08-`, `09-`) [Section 5.3].
- The unused portions of the reserved identifier ranges [AI-SDOM-ARC-0001 (Section 12)].
- The `shared-assets/` and administrative locations [Section 7, Section 8.3], which SHALL hold only material of the kinds defined.

---

## 11. Structural Constraints

11.1 **Maximum nesting depth.** The repository structure SHALL NOT exceed four levels below the repository root. The four levels are:
1. Root (level 1): top-level directories [Section 4].
2. Class or administrative directory (level 2).
3. Asset folder or subdirectory (level 3) [Section 8].
4. Asset-kind subdirectory (level 4) [Section 8.2].

A deeper structure SHALL NOT be created without an amendment to [AI-SDOM-ARC-0001 (Section 6)] or this standard, whichever is authoritative for the location.

11.2 **Directory naming expectations.** Directory names SHALL conform to [AI-SDOM-STD-0005 (Section 6)]: `NN-CATEGORY-NAME` at the top level and lowercase kebab-case below. This standard adds no naming rules and restates none.

11.3 **Empty directory policy.** A directory that contains no content SHALL NOT be committed unless it is a mandatory directory required by [Section 4.2]. An empty administrative or asset directory SHALL be removed rather than retained. Because Git does not track empty directories, a directory exists only if it contains at least one tracked item or a `.gitkeep` placeholder; a `.gitkeep` placeholder SHALL be used only to preserve a mandatory directory [Section 4.2].

11.4 **Duplicate directory prohibition.** A directory SHALL NOT be created if its name duplicates an existing directory in the same parent, and a class SHALL have exactly one top-level directory [Section 5]. Duplicate class directories (for example, two STD directories) are prohibited [Section 4.4].

11.5 **Orphan directory handling.** An orphan directory is a directory that contains no governed document, no referenced asset, and no administrative content defined by this standard. An orphan directory SHALL be flagged by the structural validation gate [Section 13] and SHALL be either removed or documented (moved to a defined location [Section 7]) within the same change that introduces it.

11.6 **Constraint precedence.** Where this standard's constraints and [AI-SDOM-ARC-0001 (Section 6)] differ, [AI-SDOM-ARC-0001] prevails [Section 1.2].

---

## 12. Machine Readability

12.1 **Canonical repository tree.** The canonical repository tree is the layout in [Section 4.1] plus the administrative, asset, and archive locations defined in Sections 7-9. The following is the machine-readable canonical form of the tree:

```
AI-SDOM/
├── 00-ARCHITECTURE/
├── 01-GOVERNANCE/
├── 02-STANDARDS/
├── 03-PROCEDURES/
├── 04-TEMPLATES/
├── 05-REGISTERS/
├── 06-DECISIONS/
├── 07-QUALITY/
├── .ai/
├── scripts/
├── certification-reports/
├── releases/
├── working/
├── drafts/
├── imported/
├── legacy/
├── shared-assets/
├── README.md
└── .gitignore
```

12.2 **YAML representation.** The canonical repository structure SHALL be representable in the following YAML form, which tooling SHALL accept as the schema of the repository:

```yaml
repository:
  name: AI-SDOM
  layers:
    - number: 0
      directory: 00-ARCHITECTURE
      class: ARC
    - number: 1
      directory: 01-GOVERNANCE
      class: GOV
    - number: 2
      directory: 02-STANDARDS
      class: STD
    - number: 3
      directory: 03-PROCEDURES
      class: PRC
    - number: 4
      directory: 04-TEMPLATES
      class: TPL
    - number: 5
      directory: 05-REGISTERS
      class: REG
  cross-cutting:
    - directory: 06-DECISIONS
      class: ADR
    - directory: 07-QUALITY
      class: QLT
  infra-directories:
    - .ai
    - scripts
  administrative:
    - certification-reports
    - releases
    - working
    - drafts
    - imported
    - legacy
  shared-assets: shared-assets
  infra-files:
    - README.md
    - .gitignore
```

12.3 **Directory schema.** A directory SHALL conform to one of the following schema kinds:
- `class`: `NN-CATEGORY-NAME` at the root [Section 5.2], containing governed documents of a single class [Section 6.2].
- `admin`: one of the administrative directory names [Section 7.1], containing material of the kind defined.
- `asset`: `{short-name}-assets` [Section 8.1] or `shared-assets` [Section 8.3], containing the asset kinds of [Section 8.2].
- `asset-kind`: one of the subdirectories of [Section 8.2], containing only assets of that kind.
- `infra`: `.ai` [AI-SDOM-ARC-0001 (Section 6.2)] or `scripts` [AI-SDOM-ARC-0001 (Section 6.3)].

12.4 **Parser expectations.** A parser reading the repository SHALL:
- Treat the eight numbered directories and the two infra directories as mandatory [Section 4.2].
- Resolve a governed document's location from its identifier class against [Section 6.2].
- Recognize the administrative, asset, and archive directory names as structural, not document content.
- Flag any top-level directory not recognized by [Section 12.3] as a structural violation [Section 13].
- Treat `README.md` and `.gitignore` as infrastructure files [AI-SDOM-ARC-0001 (Section 6.4)].
- Report directory depth exceeding the maximum [Section 11.1] as a structural violation.

12.5 **Schema versioning.** The YAML schema [Section 12.2] SHALL be versioned with the standard itself. A change to the repository structure SHALL increment this standard's version [AI-SDOM-STD-0004] and SHALL update the schema in the same amendment.

---

## 13. Structural Validation Rules

13.1 **Severity scale.** Each validation rule in this section carries one of the severities defined in the Cross-Reference Standard (Critical, Major, Minor, Informational), which is referenced and not restated here [AI-SDOM-STD-0003 (Section 11.1)].

13.2 **Enforcement.** The rules in this section are the canonical structural validation rules. They are enforced by the structural validation gate of the Architecture Validation Standard, by automated tooling established per [AI-SDOM-ARC-0001 (Section 19)], and, where no automated tooling exists, by author self-audit per the Document Development Procedure. This standard does not define gate pass/fail criteria; it defines the rules that gates and tooling validate against [AI-SDOM-ARC-0001 (Section 18.3)].

13.3 The validation rules are designated RSR-01 through RSR-20.

**RSR-01 — Mandatory Root Directories.**
- **Purpose:** Ensure the repository root always contains the directories required by the architecture.
- **Requirement:** The repository root SHALL contain the eight numbered directories (`00-ARCHITECTURE` through `07-QUALITY`), the `.ai/` directory, the `scripts/` directory, `README.md`, and `.gitignore` [Section 4.2].
- **Failure condition:** A required root directory or infrastructure file is absent.
- **Severity:** Critical.

**RSR-02 — Class Directory Placement.**
- **Purpose:** Ensure every governed document resides in the directory of its class.
- **Requirement:** A governed document SHALL reside in the top-level directory corresponding to its class per the placement matrix [Section 6.2].
- **Failure condition:** A governed document resides in a directory that does not match its class, or resides outside the numbered directories [AI-SDOM-ARC-0001 (Section 6.5)].
- **Severity:** Critical.

**RSR-03 — Class Directory Exclusivity.**
- **Purpose:** Prevent class mixing within a directory.
- **Requirement:** A class directory SHALL contain only documents of the corresponding class [Section 6.5].
- **Failure condition:** A class directory contains a governed document of another class.
- **Severity:** Critical.

**RSR-04 — Root Directory Naming Form.**
- **Purpose:** Ensure top-level directory names follow the architecture's naming form.
- **Requirement:** A top-level class directory SHALL be named `NN-CATEGORY-NAME` [AI-SDOM-ARC-0001 (Section 11.1)], [AI-SDOM-STD-0005 (Section 6.2)].
- **Failure condition:** A top-level class directory name deviates from the `NN-CATEGORY-NAME` form.
- **Severity:** Major.

**RSR-05 — Subdirectory Naming Form.**
- **Purpose:** Ensure subdirectories follow the lowercase kebab-case convention.
- **Requirement:** A subdirectory within a numbered directory SHALL use lowercase kebab-case [AI-SDOM-STD-0005 (Section 6.3)].
- **Failure condition:** A subdirectory name uses characters other than lowercase letters, digits, and hyphens.
- **Severity:** Major.

**RSR-06 — Prohibited Root Directories.**
- **Purpose:** Prevent unauthorized top-level directories.
- **Requirement:** A top-level directory SHALL NOT be created unless it is a class, infra, or administrative directory defined in this standard [Section 4.3, Section 4.4].
- **Failure condition:** A top-level directory exists that is not one of the defined kinds [Section 12.3].
- **Severity:** Critical.

**RSR-07 — Maximum Nesting Depth.**
- **Purpose:** Keep the structure shallow and predictable.
- **Requirement:** No directory SHALL exceed four levels below the repository root [Section 11.1].
- **Failure condition:** A directory exists at depth five or deeper below the root.
- **Severity:** Major.

**RSR-08 — Duplicate Directory Prohibition.**
- **Purpose:** Ensure directory names are unique within their parent.
- **Requirement:** A directory SHALL NOT duplicate the name of an existing directory in the same parent, and a class SHALL have exactly one top-level directory [Section 11.4].
- **Failure condition:** Two directories in the same parent share a name, or a class maps to two top-level directories.
- **Severity:** Critical.

**RSR-09 — Orphan Directory Prohibition.**
- **Purpose:** Ensure no directory exists without a defined purpose.
- **Requirement:** Every directory SHALL contain a governed document, a referenced asset, or defined administrative content [Section 11.5].
- **Failure condition:** A directory contains none of the above and is not a mandatory directory [Section 4.2].
- **Severity:** Minor.

**RSR-10 — Administrative Isolation.**
- **Purpose:** Keep administrative material out of governed directories.
- **Requirement:** Administrative material SHALL reside in an administrative directory [Section 7.1], and an administrative directory SHALL NOT contain a governed document [Section 7.8].
- **Failure condition:** A governed document resides in an administrative directory, or administrative material resides in a class directory.
- **Severity:** Major.

**RSR-11 — Asset Folder Placement.**
- **Purpose:** Ensure assets are organized under their governing document.
- **Requirement:** Assets associated with a governed document SHALL reside in the `{document-short-name}-assets` folder in the document's class directory [Section 8.1], and asset kinds SHALL use the subdirectories of [Section 8.2].
- **Failure condition:** An asset is stored outside its asset folder, at the repository root, or in a governed document's parent directory when an asset folder exists [Section 8.5].
- **Severity:** Major.

**RSR-12 — Generated Artifact Isolation.**
- **Purpose:** Ensure regenerable artifacts are identified and isolated.
- **Requirement:** Generated artifacts SHALL reside in the `generated/` subdirectory [Section 8.4].
- **Failure condition:** A regenerable artifact is stored outside `generated/` and is not governed.
- **Severity:** Minor.

**RSR-13 — Archive Structure.**
- **Purpose:** Ensure retirement and supersession follow the archive structure.
- **Requirement:** A retired document SHALL be moved to the archive location for its class after its transition period, and SHALL remain readable and non-deletable [Section 9.3, AI-SDOM-ARC-0001 (Section 20.4)].
- **Failure condition:** A retired document is not archived, or archived material is edited or deleted.
- **Severity:** Critical.

**RSR-14 — Archive Reference Prohibition.**
- **Purpose:** Prevent new documents from depending on retired material.
- **Requirement:** A new governed document SHALL NOT reference archive material [AI-SDOM-ARC-0001 (Section 20.3)].
- **Failure condition:** A new document's references resolve to a retired or archived document.
- **Severity:** Major.

**RSR-15 — Reserved Area Protection.**
- **Purpose:** Protect the reserved growth areas from misuse.
- **Requirement:** Reserved future numbers [Section 5.3] and unused reserved ranges [AI-SDOM-ARC-0001 (Section 12)] SHALL NOT be used for other purposes [Section 10.6].
- **Failure condition:** A reserved expansion area is consumed for an unintended purpose.
- **Severity:** Major.

**RSR-16 — Structural Change Recording.**
- **Purpose:** Ensure structural changes are recorded in the machine-readable schema and register.
- **Requirement:** A structural change SHALL be accompanied by an update to the schema [Section 12.2] and the Repository Register [Section 10.5].
- **Failure condition:** The repository structure changes without a corresponding schema or register update.
- **Severity:** Major.

**RSR-17 — Contiguous Numbered Sequence.**
- **Purpose:** Preserve the contiguity of the numbered root directories.
- **Requirement:** The numbered directory sequence SHALL be contiguous from `00` through the highest assigned number [Section 5.5].
- **Failure condition:** A gap exists in the numbered sequence.
- **Severity:** Major.

**RSR-18 — No Unauthorized Renumbering.**
- **Purpose:** Prevent instability of directory locations.
- **Requirement:** A directory SHALL NOT be renamed or renumbered to accommodate growth [Section 10.5].
- **Failure condition:** An existing directory is renamed or renumbered without an amendment to [AI-SDOM-ARC-0001 (Section 6)].
- **Severity:** Critical.

**RSR-19 — Empty Directory Policy.**
- **Purpose:** Prevent meaningless empty directories.
- **Requirement:** An empty non-mandatory directory SHALL be removed rather than retained [Section 11.3].
- **Failure condition:** An empty non-mandatory directory is present.
- **Severity:** Minor.

**RSR-20 — Schema Consistency.**
- **Purpose:** Ensure the actual repository matches the declared canonical structure.
- **Requirement:** The repository structure SHALL conform to the canonical tree and schema [Section 12].
- **Failure condition:** A parser-observable deviation between the repository and the canonical structure.
- **Severity:** Major.

---

## 14. Migration Guidance

14.1 **Purpose of migration guidance.** This section provides guidance for bringing an existing or legacy repository into conformance with this standard. It is guidance; the execution procedure is governed by the PRC class.

14.2 **Legacy repositories.** A repository that predates this standard SHALL be assessed against the placement matrix [Section 6.2] before conversion. The assessment SHALL identify every governed document whose current location differs from its required location. Such documents SHALL be moved to their required locations [Section 6] in a migration.

14.3 **Repository restructuring.** A restructuring SHALL:
- Preserve every document identifier [AI-SDOM-ARC-0001 (Section 5.3)].
- Preserve the Git history and release tags [AI-SDOM-ARC-0001 (Section 20.4)].
- Update every cross-reference that used a path or location in place of the canonical form [AI-SDOM-STD-0003].
- Be recorded as a change per [AI-SDOM-GOV-0002] and, where it changes directory names, require the approval of the Governance Board per [AI-SDOM-ARC-0001 (Section 13.5)].

14.4 **Folder migration.** A folder migration SHALL move content, not copy it; SHALL move assets with their governing documents [Section 8.1]; SHALL relocate administrative material to the defined administrative locations [Section 7]; and SHALL verify the migration with the structural validation gate [Section 13] before completion.

14.5 **Compatibility considerations.** A migration SHALL NOT:
- Renumber directories or documents as a side effect [Section 10.5].
- Introduce a gap in the numbered sequence [Section 5.5].
- Leave orphan directories behind [Section 11.5].
- Reference imported or legacy material without review [Section 7.6, Section 7.7].

14.6 **Compatibility of the standard itself.** This standard is additive with respect to [AI-SDOM-ARC-0001 (Section 6)] and [AI-SDOM-STD-0005 (Section 6)]: it specifies their structure and naming, and SHALL NOT be read to change them.

---

## 15. Examples

15.1 **Correct repository layout.** A conforming repository root:

```
AI-SDOM/
├── 00-ARCHITECTURE/
│   └── ai-sdom-arc-0001-architecture-contract.md
├── 01-GOVERNANCE/
│   ├── ai-sdom-gov-0001-repository-governance-policy.md
│   ├── ai-sdom-gov-0002-change-management-policy.md
│   └── ai-sdom-gov-0003-product-roadmap.md
├── 02-STANDARDS/
│   ├── ai-sdom-std-0001-documentation-standard.md
│   ├── ai-sdom-std-0002-document-metadata-standard.md
│   ├── ai-sdom-std-0003-cross-reference-standard.md
│   ├── ai-sdom-std-0004-semantic-versioning-standard.md
│   ├── ai-sdom-std-0005-naming-convention-standard.md
│   └── ai-sdom-std-0006-repository-structure-standard.md
├── 03-PROCEDURES/
│   └── ai-sdom-prc-0001-document-development-procedure.md
├── 04-TEMPLATES/
│   └── ai-sdom-tpl-0001-master-document-template.md
├── 05-REGISTERS/
│   └── ai-sdom-reg-0001-repository-register.md
├── 06-DECISIONS/
├── 07-QUALITY/
│   ├── ai-sdom-qlt-0001-architecture-validation-standard.md
│   └── ai-sdom-qlt-0002-repository-certification-standard.md
├── .ai/
├── scripts/
├── certification-reports/
├── releases/
├── README.md
└── .gitignore
```

The example above shows a minimal conforming repository root; it is illustrative, not exhaustive. The administrative directories of [Section 7] (`working/`, `drafts/`, `imported/`, `legacy/`, `certification-reports/`, `releases/`) and `shared-assets/` [Section 8.3] may also be present, as listed in the canonical tree of [Section 12.1].

15.2 **Asset folder example.** Assets for the Cross-Reference Standard:

```
02-STANDARDS/
├── ai-sdom-std-0003-cross-reference-standard.md
└── cross-reference-standard-assets/
    ├── images/
    │   └── reference-lifecycle.png
    ├── diagrams/
    │   └── dependency-graph.drawio
    ├── examples/
    │   └── canonical-reference-examples.md
    └── generated/
        └── dependency-graph.png
```

15.3 **Incorrect layouts.** The following are non-conforming:

```
AI-SDOM/
├── 00-ARCHITECTURE/
│   └── ai-sdom-std-0002-document-metadata-standard.md   # WRONG: STD doc in ARC dir [RSR-02]
├── Standards/                                            # WRONG: not NN-CATEGORY-NAME [RSR-04]
├── 02-STANDARDS/
│   └── draft-repository-structure-standard.md           # WRONG: draft in class dir [RSR-10]
├── reports/                                              # WRONG: undefined top-level dir [RSR-06]
├── 02b-STANDARDS/                                        # WRONG: duplicate class dir [RSR-08]
└── 06-DECISIONS/../08-ARCHIVE/                           # WRONG: reserved number consumed [RSR-15]
```

15.4 **Edge cases.**
- An empty mandatory directory (for example, `06-DECISIONS/` with no ADRs yet) is conforming [RSR-01, Section 11.3].
- A `.gitkeep` placeholder in a mandatory directory is conforming; a `.gitkeep` in a non-mandatory directory is not [Section 11.3].
- A shared asset used by two classes resides in `shared-assets/` at the root and is referenced cross-class [Section 8.3].
- An archive folder `archive-{descriptor}` within a class directory is a conforming archive location [Section 9.1].

15.5 **Expansion examples.** When the repository adds a seventh layer, the structure SHALL append `08-{CATEGORY}-{NAME}/` after `07-QUALITY/` [Section 10.2], not renumber existing directories. When a new cross-cutting class is introduced, it SHALL receive a new top-level directory after `07-QUALITY/` and a row in the placement matrix [Section 6.2].

---

## 16. Relationship to Other Standards

16.1 This standard is one of the Layer 2 standards. Its relationship to the other governed documents is:

| Document | Relationship |
|----------|--------------|
| [AI-SDOM-ARC-0001] | Constitutional authority for the directory structure (§6), layering (§3), taxonomy (§4), naming conventions (§11), reserved ranges (§12), extensibility (§13), quality gates (§18), and repository evolution (§20). This standard is the canonical specification of §6. |
| [AI-SDOM-GOV-0001] | Governance of the repository, lifecycle of documents (§20.2 in ARC-0001), and approval of structural changes. This standard defines structure only and defers governance. |
| [AI-SDOM-GOV-0002] | Change management for restructuring and migration. |
| [AI-SDOM-GOV-0003] | The product roadmap that informs repository growth and expansion planning [Section 10]. |
| [AI-SDOM-STD-0001] | Document structure requirements and front-matter declaration that governed documents placed per [Section 6] must satisfy. |
| [AI-SDOM-STD-0002] | Metadata fields, YAML representation, and slug grammar referenced by administrative, asset, and schema content [Section 12]. |
| [AI-SDOM-STD-0003] | Severity scale (§11.1) and the cross-reference mechanism used instead of physical relocation [Section 6.5, Section 8.3]. |
| [AI-SDOM-STD-0004] | Versioning of the schema [Section 12.5] and release identification for release packages [Section 7.3]. |
| [AI-SDOM-STD-0005] | Directory naming conventions (§6) referenced throughout; this standard defines structure, not names. |
| Document Development Procedure | Operational lifecycle that executes structural validation. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (REG-0001) | Identifier authority and inventory that records each document's directory and must be updated on structural change. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard | Enforces structural rules (structural validation gate). Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Certification Standard | Defines certification levels that repository structure attains. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

16.2 **Division of authority.** This standard defines repository structure only. It SHALL NOT duplicate:
- The identifier scheme, reserved ranges, and allocation (governed by [AI-SDOM-ARC-0001 (Section 5, Section 12)] and the Repository Register).
- Naming conventions for directories, files, assets, scripts, and Git objects (governed by [AI-SDOM-STD-0005]).
- Metadata field definitions and data types (governed by [AI-SDOM-STD-0002]).
- Version grammar and increment rules (governed by [AI-SDOM-STD-0004]).
- Reference syntax and lifecycle (governed by [AI-SDOM-STD-0003]).
- Governance of the repository, decision rights, and approval processes (governed by the GOV class and [AI-SDOM-ARC-0001 (Section 15)]).
- Procedural steps for restructuring or migration execution (governed by the PRC class).
- Certification criteria applied to repository structure (governed by the QLT class).

---

## 17. References

The following external records support this standard. Each is pinned per the version-pinning rules of the Cross-Reference Standard.

| Label | Target | Kind |
|-------|--------|------|
| [RFC 2119] | S. Bradner. *Key words for use in RFCs to Indicate Requirement Levels*. March 1997. RFC 2119. | External — RFC |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.1   | 2026-08-01 | —      | Applied Phase 2J findings MIN-1 and MIN-2: normalized the §12.2 YAML schema key casing to kebab-case and clarified that the §15.1 example is a minimal, non-exhaustive conforming root. | Pending |
| 0.1.0   | 2026-08-01 | —      | Initial repository structure standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-GOV-0003], [AI-SDOM-STD-0001], [AI-SDOM-STD-0002], [AI-SDOM-STD-0003], [AI-SDOM-STD-0004], and [AI-SDOM-STD-0005], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure structural specification. §1.1 and §16.2 exclude governance, procedures, architecture, naming, metadata, versioning, and reference content. |
| §2.3 | Separation of Concerns | PASS | §1.1 and §16.2 exclude content owned by other standards; structural rules only. |
| §3 | Layering | PASS | §5 operationalizes the layer directories; no layer rules introduced. |
| §4 | Taxonomy | PASS | §6.2 placement matrix covers all eight classes; no new class introduced. |
| §5 | Identifier scheme | PASS | §6.3 derives placement determinism from the identifier class; no identifier rule restated. |
| §6 | Directory structure | PASS | §4.1 references the canonical tree; §4-§6 operationalize it without contradiction. |
| §6.1 | Class-only directories | PASS | §5.2 and RSR-03 require it. |
| §6.4 | Infrastructure exemption | PASS | §4.2, §4.5, and RSR-01 require `README.md`/`.gitignore` at the root. |
| §6.5 | No governed docs outside numbered dirs | PASS | §6.1 and RSR-02 require it. |
| §7 | Dependency rules | PASS | Formal dependencies limited to layers 0-2 [Section 1.2]; higher-layer and cross-cutting documents referenced descriptively. |
| §11 | Naming conventions | PASS | §5.6 and §11.2 reference [AI-SDOM-STD-0005 (Section 6)]; no naming rule restated. |
| §12 | Reserved ranges | PASS | §10.6 and RSR-15 reference them; not restated. |
| §13 | Extensibility | PASS | §10.2-§10.3 reference §13.1-§13.4; no new extensibility rule. |
| §13.5 | Migration plan approval | PASS | §14.3 references it for directory-name changes. |
| §18.3 | Mandatory gates | PASS | §13.2 references the structural validation gate without redefining pass/fail criteria. |
| §19 | Automation boundaries | PASS | §12.4 defines parser expectations; no automation authority granted. |
| §20 | Repository evolution | PASS | §9 and §14 reference §20.2-§20.4; no lifecycle rule restated. |

### GOV-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §2.3 | Governance vs. technical content | PASS | §16.2 defers all governance to the GOV class; no roles, approval processes, or decision rights defined. |

### GOV-0002 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §6 | Impact assessment | PASS | §14.3 references change management for restructuring; no procedural content added. |

### GOV-0003 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| Roadmap alignment | PASS | §10 growth rules reference the roadmap as an input to expansion planning; no roadmap content duplicated. |

### STD-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §3 | Front matter | PASS | YAML front matter present with identifier, title, version, lifecycle-state, layer, dependencies, tags, and ai-assistance. |
| §8 | Self-audit | PASS | This section present; all applicable gates audited. |

### STD-0002 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §3 | Field registry | PASS | Front matter uses only registered fields. |
| §4.2 | Reserved `x-` prefix | PASS | No `x-` fields used. |
| §7 | YAML representation | PASS | §12.2 uses YAML per the representation rules. |

### STD-0003 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §11.1 | Severity scale | PASS | §13.1 references the scale, not restates it. |
| §5 | Canonical references | PASS | All formal references use the canonical form `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]`. |

### STD-0004 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §4 | Version grammar | PASS | `version: 0.1.1` in front matter. |
| §10 | Release identification | PASS | §7.3 references release identification for release packages. |

### STD-0005 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §5 | Document naming | PASS | Identifier `AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD`; filename `ai-sdom-std-0006-repository-structure-standard.md`. |
| §6 | Directory naming | PASS | §5.6 and §11.2 reference STD-0005 §6; no naming rule restated. |
| §11 | Case conventions | PASS | §6 uses canonical uppercase identifiers in the placement matrix; natural case in prose. |

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

1. **Directory-structure duplication boundary with ARC-0001 (Sections 4, 5):** [AI-SDOM-ARC-0001 (Section 6)] defines the repository directory structure and its constraints. Reproducing it as original content would duplicate constitutional content. Resolved by presenting the canonical tree as the attributed specification of ARC-0001 §6 (§4.1), adding the mandatory/optional/prohibited root rules (§4.2-§4.4), the layer mapping (§5.1), and the cross-cutting mapping (§5.4) that operationalize it, and explicitly stating precedence in §1.2 and §11.6.

2. **Naming-rule duplication boundary with STD-0005 (Sections 5, 11):** [AI-SDOM-STD-0005 (Section 6)] defines directory naming conventions. Resolved by referencing STD-0005 §6 for all naming rules (§5.6, §11.2) and defining only the structural attributes (placement, depth, contiguity, duplicates, orphans) that STD-0005 does not provide.

3. **Machine-readability overlap with the schema conventions (Sections 12, 13):** No governed document defines a canonical repository tree, YAML representation, or directory schema for the repository as a whole. The YAML schema (§12.2), directory schema kinds (§12.3), parser expectations (§12.4), and schema versioning (§12.5) are new content no existing document provides; the metadata representation is referenced to [AI-SDOM-STD-0002 (Section 7)].

4. **Archive duplication risk with ARC-0001 (Section 9):** [AI-SDOM-ARC-0001 (Section 20.2-20.4)] defines the lifecycle, deprecation, and archival preservation rules. Resolved by referencing those provisions for the lifecycle and preservation rules, and defining only the physical archive structure (§9.1), historical-version tagging (§9.2), and the archived-material rules (§9.3-§9.5) that operationalize them.

5. **Growth duplication risk with ARC-0001 (Section 10):** [AI-SDOM-ARC-0001 (Section 13)] defines future extensibility rules. Resolved by referencing §13.1-§13.4 for the authority to add layers and classes, and defining only the structural consequences (reserved numbers, contiguous sequence, expansion principles, reserved areas) that no existing document provides.

6. **Severity scale (Section 13.1):** No governed document defines a severity scale for structural defects. Resolved by referencing the four-level severity scale of [AI-SDOM-STD-0003 (Section 11.1)] rather than restating it.

7. **QLT reference constraint (Section 16):** The required relationship to the Architecture Validation Standard and the Repository Certification Standard conflicts with the adopted interpretation of [AI-SDOM-ARC-0001 (Section 7.1)], under which a layered document SHALL NOT reference a cross-cutting document by canonical identifier. Resolved by referencing both QLT documents by descriptive title only, in §16, consistent with established precedent.

8. **Administrative locations (Section 7):** The repository currently has no governed administrative structure, and [AI-SDOM-ARC-0001 (Section 6)] defines only class, infra, and infrastructure content at the root. Resolved by defining administrative locations as optional root content (§4.3) whose directories are created only when the material exists, and by referencing the naming rules of [AI-SDOM-STD-0005 (Section 6)] for their names. Observed structural gaps (missing `README.md` and `.gitignore` at the AI-SDOM root) are recorded as findings in the Phase 2H Certification Report, not corrected here (phase contract: no Git operations, no unrequested content changes).

9. **Assumed-delivery source control:** This document is delivered as an uncommitted working-tree change for review and approval (phase contract: no Git operations). Its `lifecycle-state` is Active and version 0.1.0; ratification and the associated Git tag per [AI-SDOM-ARC-0001 (Section 11.6)] will follow approval per [AI-SDOM-ARC-0001 (Section 15.3)].

10. **No Structural regressions and self-consistency:** This document's own placement and structure comply with the rules it defines: the identifier conforms to RSR-02's placement determinism (class STD → 02-STANDARDS), the filename conforms to the document naming rules [AI-SDOM-STD-0005 (Section 5)], the top-level directory naming form (RSR-04) is satisfied, and the schema in §12.2 is consistent with the current repository state. Every RSR rule was verified against the section it references during self-audit.

11. **Phase 2J consolidation findings MIN-1 and MIN-2 (Sections 12, 15):** The Phase 2J Layer 2 Consolidation Review identified mixed key casing in the §12.2 YAML schema (`cross-cutting` kebab-case alongside `infra_directories`/`shared_assets`/`infra_files` snake_case) and a §15.1 example tree that omitted the administrative directories listed in the §12.1 canonical tree. Resolved in version 0.1.1 by normalizing the schema keys to kebab-case and adding a note that the §15.1 example is a minimal, non-exhaustive conforming root. No new requirements were introduced; the change is a PATCH correction per STD-0004.
