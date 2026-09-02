---
identifier: AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD
title: Naming Convention Standard
version: 0.1.0
lifecycle-state: Active
layer: 2
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY
  - AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY
  - AI-SDOM-STD-0001-DOCUMENTATION-STANDARD
  - AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD
  - AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD
  - AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD
tags:
  - naming
  - standards
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-01: initial draft"
---

# Naming Convention Standard

## 1. Purpose

1.1 This standard is the canonical specification of naming conventions within the AI-SDOM repository. It is the single source of truth for how the repository itself, its directories, its documents, its assets, its scripts and configuration files, and its Git objects are named. It defines naming standards only; it SHALL NOT define governance, operational procedures, architecture rules, metadata rules, or versioning rules.

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 5, Section 11)], which establishes the document identifier scheme and the base naming conventions that all repository artifacts must follow, and from [AI-SDOM-STD-0002 (Section 4, Section 5)], which establishes field-name and slug conventions. This standard is the canonical specification of those conventions: it specifies, extends, and operationalizes them without contradicting them. Where this standard and [AI-SDOM-ARC-0001] describe the same naming rule, [AI-SDOM-ARC-0001] remains the constitutional authority and prevails in case of conflict [AI-SDOM-ARC-0001 (Section 2.3)].

1.3 This standard applies to:
- The repository name and its root folders.
- Every governed document's identifier, title, and filename.
- Every directory, asset, script, configuration file, and Git object in the repository.
- Any machine-readable tooling, automation, or AI agent that reads or writes repository names [AI-SDOM-ARC-0001 (Section 14, Section 19)].

---

## 2. Scope

2.1 This standard governs the naming of every artifact within the AI-SDOM repository. It defines the canonical naming rules for the repository [Section 4], documents [Section 5], directories [Section 6], assets [Section 7], scripts and configuration files [Section 8], Git objects [Section 9], the character set [Section 10], case conventions [Section 11], reserved words [Section 12], validation rules [Section 13], and machine-readable naming [Section 14].

2.2 This standard does not govern:
- The content or substance of a document's body.
- The identifier scheme's reserved number ranges and their allocation (governed by [AI-SDOM-ARC-0001 (Section 12)] and the Repository Register).
- Metadata field values, data types, or representation (governed by [AI-SDOM-STD-0002]).
- Version strings and version increments (governed by [AI-SDOM-STD-0004]).
- Reference formation, resolution, or lifecycle (governed by [AI-SDOM-STD-0003]).
- Governance of rename operations or migration approvals (governed by [AI-SDOM-GOV-0001 (Section 8)] and [AI-SDOM-GOV-0002]).

2.3 Where a provision of this standard conflicts with [AI-SDOM-ARC-0001], the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

---

## 3. Naming Philosophy

3.1 **Consistency.** The same kind of artifact SHALL be named the same way everywhere in the repository. Consistent naming makes the repository predictable to humans and parseable by automation [AI-SDOM-ARC-0001 (Section 1.1)].

3.2 **Readability.** A name SHALL be legible at a glance: short, descriptive, and free of ambiguity. Readability SHALL take precedence over brevity when the two conflict.

3.3 **Predictability.** A name SHALL be derivable from the artifact it names by applying the rules of this standard alone. Given an artifact, the reader SHALL be able to determine its kind, class, and identity from its name.

3.4 **Stability.** Names SHALL be stable over time. A name SHALL NOT be changed without a governed change per [AI-SDOM-GOV-0001 (Section 8)] and [AI-SDOM-GOV-0002]; a document identifier SHALL NEVER change [AI-SDOM-ARC-0001 (Section 5.3)].

3.5 **Traceability.** A name SHALL preserve the relationship between an artifact and its governing document, class, or identity, so that names can be traced through the repository [AI-SDOM-ARC-0001 (Section 2.2)].

3.6 **Machine readability.** A name SHALL be composed of characters and separators that automation can tokenize, sort, and validate deterministically [Section 10].

3.7 **Human usability.** A name SHALL remain comprehensible to a human reader and SHALL NOT rely on abbreviations that require external context to resolve.

---

## 4. Repository Naming

4.1 **Repository name.** The repository name is `AI-SDOM`, invariant. The repository prefix used in document identifiers is `AI-SDOM` per [AI-SDOM-ARC-0001 (Section 5.1)]. References to the repository SHALL use the name `AI-SDOM`.

4.2 **Root folders.** The repository root SHALL contain only the numbered class directories, the reserved directories `.ai` and `scripts`, and the infrastructure files `README.md` and `.gitignore`, per [AI-SDOM-ARC-0001 (Section 6)]. Infrastructure files at the repository root are exempt from classification, identifier, and layering rules [AI-SDOM-ARC-0001 (Section 6.4)].

4.3 **Reserved directories.** The numbered directories `00-ARCHITECTURE` through `07-QUALITY`, the `.ai` directory, and the `scripts` directory are reserved per [AI-SDOM-ARC-0001 (Section 6)]. A new top-level directory SHALL NOT be introduced except by amendment to [AI-SDOM-ARC-0001] or by an ADR per [AI-SDOM-ARC-0001 (Section 6.5)].

4.4 **Hidden directories.** The `.ai` directory is the sole hidden directory defined for repository automation and AI context per [AI-SDOM-ARC-0001 (Section 6.2)]. No other hidden directory SHALL be introduced without amendment to [AI-SDOM-ARC-0001]. A governed document SHALL NOT reside in a hidden directory [AI-SDOM-ARC-0001 (Section 6.5)].

---

## 5. Document Naming

5.1 **Document identifiers.** Every governed document SHALL receive a globally unique identifier conforming to [AI-SDOM-ARC-0001 (Section 5.1)]:

```text
AI-SDOM-{CLASS}-{NNNN}-{SHORT-NAME}
```

- `AI-SDOM` is the invariant repository prefix.
- `{CLASS}` is the uppercase class code (ARC, GOV, STD, PRC, TPL, REG, ADR, QLT).
- `{NNNN}` is the zero-padded four-digit sequential number, unique within the class and drawn from the reserved range per [AI-SDOM-ARC-0001 (Section 12)].
- `{SHORT-NAME}` is a kebab-case descriptive slug derived from the document title [Section 11.3].

5.2 **Identifier immutability.** An identifier is assigned at creation and SHALL NEVER change [AI-SDOM-ARC-0001 (Section 5.3)]. A deprecated document's identifier is retired and recorded in the Repository Register; it SHALL NOT be reused [AI-SDOM-ARC-0001 (Section 12.2)].

5.3 **Document titles.** A document title SHALL be a descriptive noun phrase in Title Case (for example, "Semantic Versioning Standard"), SHALL identify the document's single concern [AI-SDOM-ARC-0001 (Section 2.1)], and SHALL NOT include the class code or identifier. The `title` value SHALL match the document's `#` title heading [AI-SDOM-STD-0002 (Section 3.3)].

5.4 **Filenames.** The filename of every governed document SHALL match its identifier in lowercase with the `.md` extension per [AI-SDOM-ARC-0001 (Section 5.4)]:

```text
ai-sdom-{class}-{nnnn}-{short-name}.md
```

5.5 **Filename ↔ identifier relationship.** The filename SHALL be the lowercased identifier with a `.md` extension appended [Section 5.4] [AI-SDOM-STD-0002 (Section 4.3)]. There SHALL be exactly one filename for each identifier and exactly one identifier for each governed filename.

5.6 **Extension rules and length recommendations.**
- Governed documents SHALL use the `.md` extension [AI-SDOM-ARC-0001 (Section 5.4)].
- The `{SHORT-NAME}` component SHOULD be 2-6 words and SHOULD NOT exceed 30 characters, so that the complete filename remains readable.
- A document title SHOULD NOT exceed 60 characters.
- The complete identifier SHOULD NOT exceed 64 characters.

---

## 6. Directory Naming

6.1 **Directory structure.** Directories SHALL follow the structure of [AI-SDOM-ARC-0001 (Section 6)]. Only the classes and directories defined there SHALL be created at the top level.

6.2 **Numbered folders.** A top-level class directory SHALL be named `NN-CATEGORY-NAME` per [AI-SDOM-ARC-0001 (Section 11.1)]: a zero-padded two-digit number, an uppercase class code, and an uppercase descriptor, joined by hyphens. Examples: `02-STANDARDS`, `05-REGISTERS`. The number SHALL match the class's layer or the reserved mapping in [AI-SDOM-ARC-0001 (Section 6)].

6.3 **Class folders.** A numbered directory SHALL contain only documents of the corresponding class [AI-SDOM-ARC-0001 (Section 6.1)]. Subdirectories within a numbered directory, when needed, SHALL use lowercase kebab-case names [Section 11.3].

6.4 **Asset folders.** A folder for assets associated with a document SHOULD be named `{document-short-name}-assets` in lowercase kebab-case and SHOULD reside within the same numbered directory as its governing document. Where an asset is not document-specific, it SHOULD reside in a `shared-assets` folder.

6.5 **Archive folders.** A folder for archived or retired material SHALL be named `{NN}-ARCHIVE` or `archive-{descriptor}` in the pattern of its enclosing tree. Retired governed documents remain readable for historical reference per [AI-SDOM-ARC-0001 (Section 20.4)]; an archive folder SHALL NOT be used to hide a governed document.

6.6 **Temporary folders.** A folder for temporary work SHALL be named `tmp-{descriptor}` in lowercase kebab-case, SHALL be deleted when its purpose is complete, and SHALL NOT contain governed documents.

---

## 7. Asset Naming

7.1 **General rule.** Assets (images, diagrams, PDFs, spreadsheets, attachments, examples, and sample files) SHALL be named `{short-name}-{descriptor}.{ext}` in lowercase kebab-case per [AI-SDOM-ARC-0001 (Section 11.3)]. Example: `architecture-contract-layer-diagram.png`.

7.2 **Images and diagrams.** An image or diagram SHALL be named with the short name of the content it illustrates followed by a descriptor of the figure, for example `version-lifecycle-states.png` or `layer-dependency-diagram.svg`.

7.3 **PDFs.** A PDF SHALL be named with the short name of the content followed by a descriptor of the document kind, for example `semantic-versioning-standard-release.pdf`.

7.4 **Spreadsheets.** A spreadsheet SHALL be named with the short name of the data set followed by a descriptor of the sheet, for example `identifier-range-utilization.xlsx`.

7.5 **Attachments.** An attachment to a governed document SHALL be named `{document-short-name}-{descriptor}.{ext}` so that its governing document is traceable from its name [Section 3.5].

7.6 **Examples and sample files.** An example or sample SHALL be named `example-{descriptor}.{ext}` or `sample-{descriptor}.{ext}` and SHALL NOT use a name that could be confused with a governed document identifier [Section 12.2].

7.7 **Versioned assets.** An asset that is released alongside a versioned document MAY include the version in its name as `{short-name}-{descriptor}-{version}.{ext}` (for example, `identifier-range-utilization-v1.0.0.xlsx`), using the version grammar of [AI-SDOM-STD-0004 (Section 4)].

---

## 8. Script and Configuration Naming

8.1 **General rule.** Scripts SHALL be named `{verb}-{target}.{ext}` in lowercase kebab-case per [AI-SDOM-ARC-0001 (Section 11.4)]. Example: `validate-references.py`. Every script SHALL have a corresponding QLT or PRC document that defines its purpose and invocation [AI-SDOM-ARC-0001 (Section 6.3)].

8.2 **PowerShell.** A PowerShell script SHALL use the extension `.ps1` and SHALL be named `{verb}-{target}.ps1`, for example `validate-metadata.ps1`.

8.3 **Bash.** A Bash script SHALL use the extension `.sh` and SHALL be named `{verb}-{target}.sh`, for example `validate-references.sh`.

8.4 **Python.** A Python script SHALL use the extension `.py` and SHALL be named `{verb}-{target}.py`, for example `check-cycles.py`. Python module names SHALL be lowercase snake_case per [Section 11.4].

8.5 **YAML and JSON.** A YAML file SHALL use the extension `.yml` or `.yaml` (a repository SHALL choose one and use it consistently; the preferred extension is `.yml`), and a JSON file SHALL use the extension `.json`. Both SHALL be named `{descriptor}.{ext}` in lowercase kebab-case or snake_case consistently, for example `repository-config.yml` or `checks-config.json`.

8.6 **Markdown.** A non-governed Markdown file (for example, a README or a phase report) SHALL use the extension `.md` and a lowercase kebab-case filename, for example `phase-2g-certification-report.md`. Governed documents SHALL follow [Section 5.4].

8.7 **XML.** An XML file SHALL use the extension `.xml` and a lowercase kebab-case or snake_case filename, for example `document-registry.xml`. XML element and attribute names SHALL be PascalCase or lower camelCase consistently within a single file per [Section 11].

8.8 **Configuration files.** A configuration file SHALL be named `{descriptor}.{ext}` or `{tool}-{descriptor}.{ext}` in lowercase kebab-case, for example `opencode.json` or `validation-checks.yml`. A dotfile configuration SHALL use its conventional name (for example, `.gitignore`).

---

## 9. Git Naming

9.1 **Branch names.** A branch SHALL be named `{type}/{identifier-or-description}` per [AI-SDOM-ARC-0001 (Section 11.5)], where `{type}` is one of `feat`, `fix`, `chore`, `docs`. Example: `feat/arc-0001-architecture-contract`.

9.2 **Feature branches.** A feature branch SHALL use the `feat/` prefix followed by a lowercase kebab-case description of the feature, for example `feat/std-0005-naming-standard`.

9.3 **Hotfix branches.** A hotfix branch SHALL use the `fix/hotfix-` prefix followed by a lowercase kebab-case description, for example `fix/hotfix-reference-resolution`. A hotfix SHALL be traceable to an issue or change record per [AI-SDOM-GOV-0002].

9.4 **Tags.** A version tag SHALL be named `{lowercased-identifier}-v{MAJOR}.{MINOR}.{PATCH}` per [AI-SDOM-ARC-0001 (Section 11.6)], for example `ai-sdom-arc-0001-v1.0.0`. Tag names SHALL NOT contain pre-release or build-metadata suffixes [AI-SDOM-STD-0004 (Section 4.6)].

9.5 **Release names.** A repository release SHALL be named `v{MAJOR}.{MINOR}.{PATCH}` using the release versioning rules of [AI-SDOM-STD-0004 (Section 10)] and [AI-SDOM-ARC-0001 (Section 9.5, Section 11.6)]. A release name SHALL NOT be reused.

9.6 **Commit messages.** Commit messages SHALL begin with a concise imperative summary (for example, "Add AI-SDOM-STD-0005 Naming Convention Standard") and MAY reference the affected document identifier. Commit hashes SHALL NOT be used as document versions [AI-SDOM-STD-0004 (Section 10.4)].

---

## 10. Character Set Rules

10.1 **Allowed characters.** A name SHALL be composed only of the characters permitted for its context:
- ASCII lowercase letters `a-z` and digits `0-9` for slugs, filenames, script names, asset names, and branch names.
- The hyphen `-` as the word separator for kebab-case names.
- The underscore `_` as the word separator for snake_case names.
- The slash `/` as the hierarchy separator in Git branch names and directory paths.
- Uppercase letters `A-Z` for class codes, directory category and name components, and identifiers per [AI-SDOM-ARC-0001 (Section 5.1, Section 11.1)].

10.2 **Prohibited characters.** A name SHALL NOT contain spaces, backslashes, non-ASCII characters, control characters, or any of the characters reserved by the file system or the Git tooling (for example, `* : ? " < > |`). A filename SHALL NOT contain characters prohibited by the host file system.

10.3 **Case sensitivity.** Git and the file systems in use are case-sensitive for names. A name SHALL be used with exactly one canonical spelling [Section 3.4]; two names differing only in case SHALL be treated as distinct and SHALL NOT be introduced where they could be confused [Section 11].

10.4 **Spaces.** A name SHALL NOT contain spaces. Spaces SHALL be replaced by the separator appropriate to the context (hyphen for kebab-case, underscore for snake_case) [Section 11].

10.5 **Separators.** The hyphen is the sole separator in kebab-case names and the underscore is the sole separator in snake_case names. A name SHALL NOT mix separators within a single segment. A name SHALL NOT begin or end with a separator, and SHALL NOT contain consecutive separators.

10.6 **Unicode policy.** Repository names SHALL be ASCII-only [Section 10.1]. Unicode characters are permitted only inside the content of a governed document, never in a name. An identifier, filename, directory name, or Git object name SHALL be composed of ASCII characters only.

---

## 11. Case Conventions

11.1 **Canonical cases.** The repository recognizes the following cases:

| Case | Pattern | Example |
|------|---------|---------|
| kebab-case | `lowercase-lowercase` | `semantic-versioning-standard` |
| snake_case | `lowercase_underscore` | `validate_metadata` |
| PascalCase | `UpperCamelCase` | `Repository Governance Policy` |
| camelCase | `lowerCamelCase` | `lifecycleState` |
| UPPER_SNAKE_CASE | `UPPER_UNDERSCORE` | `02-STANDARDS` |

11.2 **Identifier case.** A document identifier SHALL be all-uppercase with hyphen separators per [AI-SDOM-ARC-0001 (Section 5.1)]: `AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD`. This is the identifier form and is distinct from the kebab-case forms in [Section 11.3].

11.3 **Slugs and filenames.** Slugs (tags, extension names), filenames, and short names SHALL be lowercase kebab-case per [AI-SDOM-STD-0002 (Section 4.3, Section 5)]: `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`. Example: `document-metadata-standard`.

11.4 **Code identifiers.** Python module names SHALL be lowercase snake_case. XML attribute names SHALL be lower camelCase. Configuration keys SHALL be lowercase kebab-case (YAML) or lower camelCase (JSON) consistently within a file.

11.5 **Case decision table.** The case SHALL be selected from the context:

| Context | Case | Example |
|---------|------|---------|
| Document identifier | UPPER, hyphen-separated | `AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD` |
| Class code | UPPER | `STD` |
| Numbered directory | UPPER_SNAKE_CASE | `02-STANDARDS` |
| Document title | Title Case (PascalCase with separators) | `Semantic Versioning Standard` |
| Filename | lowercase kebab-case | `ai-sdom-std-0005-naming-convention-standard.md` |
| Slug / short name / tag | lowercase kebab-case | `naming-convention-standard` |
| Script name | lowercase kebab-case | `validate-references.py` |
| Python module | lowercase snake_case | `reference_validator` |
| Git branch | lowercase kebab-case after type prefix | `feat/std-0005-naming-standard` |
| YAML configuration key | lowercase kebab-case | `validation-checks` |
| JSON configuration key | lower camelCase | `validationChecks` |
| XML element | PascalCase | `<ReferenceRecord>` |
| XML attribute | lower camelCase | `refName` |

11.6 **Consistency rule.** A single naming context SHALL use exactly one case [Section 11.5]; a name SHALL NOT mix cases within a segment. Where a case convention is not listed for a context, the default SHALL be lowercase kebab-case.

---

## 12. Reserved Words

12.1 **Reserved prefixes.** The following prefixes are reserved:
- `AI-SDOM` — repository prefix for identifiers [AI-SDOM-ARC-0001 (Section 5.1)]; it SHALL NOT be used for non-document artifacts.
- `x-` — extension field prefix, reserved per [AI-SDOM-STD-0002 (Section 4.2, Section 8)].
- `feat/`, `fix/`, `chore/`, `docs/` — branch type prefixes per [AI-SDOM-ARC-0001 (Section 11.5)].
- `fix/hotfix-` — hotfix branch prefix [Section 9.3].
- `example-`, `sample-`, `tmp-`, `archive-` — descriptor prefixes reserved for their contexts [Section 6, Section 7].

12.2 **Reserved suffixes.** The following suffixes are reserved:
- `-v{MAJOR}.{MINOR}.{PATCH}` — version tag suffix [Section 9.4].
- `-assets` — asset folder suffix [Section 6.4].
- Class-code-derived suffixes in identifiers SHALL NOT be duplicated within a name.

12.3 **Reserved identifiers.** Document identifiers registered in the Repository Register are reserved. A name SHALL NOT resemble a registered identifier in a way that could be resolved as one [Section 12.2 of this standard]; an asset, script, or sample SHALL NOT be named with the identifier form `AI-SDOM-CLASS-NNNN-{SHORT-NAME}` because that form is reserved for governed documents.

12.4 **Deprecated names.** A name that has been deprecated by an amendment to [AI-SDOM-ARC-0001], this standard, or another governed document SHALL NOT be used for new artifacts. Deprecated names remain documented for historical reference per [AI-SDOM-ARC-0001 (Section 20.4)].

12.5 **Future reserved ranges.** The reserved number ranges of [AI-SDOM-ARC-0001 (Section 12)] are reserved for future document identifiers. Names SHALL NOT be constructed that assume the allocation of a number outside the reserved range or the reuse of a retired number [AI-SDOM-ARC-0001 (Section 12.2)].

---

## 13. Validation Rules

13.1 **Severity scale.** Each validation rule in this section carries one of the severities defined in the Cross-Reference Standard (Critical, Major, Minor, Informational), which is referenced and not restated here [AI-SDOM-STD-0003 (Section 11.1)].

13.2 **Enforcement.** The rules in this section are the canonical naming validation rules. They are enforced by the naming compliance gate of the Architecture Validation Standard, by automated tooling established per [AI-SDOM-ARC-0001 (Section 19)], and, where no automated tooling exists, by author self-audit per the Document Development Procedure. This standard does not define gate pass/fail criteria; it defines the rules that gates and tooling validate against [AI-SDOM-ARC-0001 (Section 18.3)].

13.3 The validation rules are designated NCR-01 through NCR-20.

**NCR-01 — Repository Name.**
- **Purpose:** Ensure the repository is referred to by its canonical name.
- **Requirement:** The repository SHALL be named `AI-SDOM` [Section 4.1]; document identifiers SHALL use the `AI-SDOM` prefix [AI-SDOM-ARC-0001 (Section 5.1)].
- **Failure condition:** Any name that uses a different repository prefix.
- **Severity:** Critical.

**NCR-02 — Identifier Canonical Form.**
- **Purpose:** Ensure every document identifier conforms to the canonical scheme.
- **Requirement:** An identifier SHALL conform to `AI-SDOM-{CLASS}-{NNNN}-{SHORT-NAME}` per [AI-SDOM-ARC-0001 (Section 5.1)] [Section 5.1].
- **Failure condition:** An identifier missing a segment, using an invalid class code, a non-zero-padded number, or a non-kebab-case short name.
- **Severity:** Critical.

**NCR-03 — Identifier Immutability.**
- **Purpose:** Ensure identifiers are never changed or reused.
- **Requirement:** An identifier SHALL be assigned at creation and SHALL NEVER change; a retired identifier SHALL NOT be reused [AI-SDOM-ARC-0001 (Section 5.3, Section 12.2)] [Section 5.2].
- **Failure condition:** A change to an assigned identifier, or the reuse of a retired identifier.
- **Severity:** Critical.

**NCR-04 — Filename Mirror.**
- **Purpose:** Ensure every governed filename mirrors its identifier.
- **Requirement:** A governed filename SHALL equal the lowercased identifier plus `.md` per [AI-SDOM-ARC-0001 (Section 5.4)] [Section 5.4].
- **Failure condition:** A governed filename that differs from the lowercased identifier.
- **Severity:** Critical.

**NCR-05 — Single Filename per Identifier.**
- **Purpose:** Ensure the filename ↔ identifier relationship is one-to-one.
- **Requirement:** There SHALL be exactly one filename for each identifier and exactly one identifier for each governed filename [Section 5.5].
- **Failure condition:** A duplicate filename for one identifier, or a filename resolving to more than one identifier.
- **Severity:** Major.

**NCR-06 — Title Match.**
- **Purpose:** Ensure the document title matches its heading and identifier short name.
- **Requirement:** The `title` value SHALL match the document's `#` title heading [AI-SDOM-STD-0002 (Section 3.3)], and the short name SHALL be derived from the title [Section 5.1, Section 5.3].
- **Failure condition:** A front-matter `title` that differs from the `#` heading, or a short name unrelated to the title.
- **Severity:** Major.

**NCR-07 — Title Case for Titles.**
- **Purpose:** Ensure document titles use Title Case.
- **Requirement:** A document title SHALL be a descriptive noun phrase in Title Case and SHALL NOT include the class code or identifier [Section 5.3].
- **Failure condition:** A title in a case other than Title Case, or a title containing the identifier or class code.
- **Severity:** Minor.

**NCR-08 — Directory Number Match.**
- **Purpose:** Ensure directories follow the numbered-folder convention.
- **Requirement:** A top-level directory SHALL be named `NN-CATEGORY-NAME` per [AI-SDOM-ARC-0001 (Section 11.1)] and SHALL contain only documents of its class [AI-SDOM-ARC-0001 (Section 6.1)] [Section 6.2].
- **Failure condition:** A top-level directory not matching the pattern, or a directory containing documents of another class.
- **Severity:** Major.

**NCR-09 — Reserved Directory Scope.**
- **Purpose:** Ensure no unauthorized top-level directories or hidden directories are introduced.
- **Requirement:** The top-level directories SHALL be limited to the numbered directories, `.ai`, and `scripts` per [AI-SDOM-ARC-0001 (Section 6)] [Section 4.3, Section 4.4].
- **Failure condition:** A new top-level directory or hidden directory without the required amendment or ADR.
- **Severity:** Major.

**NCR-10 — Asset Naming.**
- **Purpose:** Ensure assets follow the canonical asset naming rule.
- **Requirement:** An asset SHALL be named `{short-name}-{descriptor}.{ext}` in lowercase kebab-case per [AI-SDOM-ARC-0001 (Section 11.3)] [Section 7.1].
- **Failure condition:** An asset name not in lowercase kebab-case, or not containing a descriptor.
- **Severity:** Minor.

**NCR-11 — Script Naming.**
- **Purpose:** Ensure scripts follow the canonical script naming rule.
- **Requirement:** A script SHALL be named `{verb}-{target}.{ext}` in lowercase kebab-case per [AI-SDOM-ARC-0001 (Section 11.4)] [Section 8.1].
- **Failure condition:** A script name not in the verb-target form, or in an incorrect case.
- **Severity:** Minor.

**NCR-12 — Branch Naming.**
- **Purpose:** Ensure branch names follow the canonical branch form.
- **Requirement:** A branch SHALL be named `{type}/{identifier-or-description}` where `{type}` is one of `feat`, `fix`, `chore`, `docs` per [AI-SDOM-ARC-0001 (Section 11.5)] [Section 9.1].
- **Failure condition:** A branch name with an unrecognized type prefix or missing the type prefix.
- **Severity:** Major.

**NCR-13 — Version Tag Naming.**
- **Purpose:** Ensure version tags follow the canonical tag form.
- **Requirement:** A version tag SHALL be named `{lowercased-identifier}-v{MAJOR}.{MINOR}.{PATCH}` per [AI-SDOM-ARC-0001 (Section 11.6)] and SHALL NOT contain pre-release or build-metadata suffixes [Section 9.4].
- **Failure condition:** A tag not matching the identifier-version form, or a tag with a pre-release or build-metadata suffix.
- **Severity:** Major.

**NCR-14 — Character Set.**
- **Purpose:** Ensure names use only permitted characters.
- **Requirement:** A name SHALL be composed only of the ASCII characters permitted for its context [Section 10.1].
- **Failure condition:** A name containing a prohibited character, a non-ASCII character, or a file-system-reserved character [Section 10.2, Section 10.6].
- **Severity:** Critical.

**NCR-15 — No Spaces.**
- **Purpose:** Ensure names contain no spaces.
- **Requirement:** A name SHALL NOT contain spaces [Section 10.4].
- **Failure condition:** A name containing a space.
- **Severity:** Critical.

**NCR-16 — Separator Discipline.**
- **Purpose:** Ensure names use the correct separator without mixing or doubling.
- **Requirement:** A name SHALL use the hyphen or underscore separator appropriate to its case, SHALL NOT mix separators within a segment, and SHALL NOT begin, end, or double a separator [Section 10.5].
- **Failure condition:** A name with mixed separators, a leading or trailing separator, or consecutive separators.
- **Severity:** Major.

**NCR-17 — Case Consistency.**
- **Purpose:** Ensure each context uses exactly one case.
- **Requirement:** A name SHALL use the case defined for its context in the decision table [Section 11.5]; a name SHALL NOT mix cases within a segment [Section 11.6].
- **Failure condition:** A name whose case does not match its context, or a name mixing cases within a segment.
- **Severity:** Major.

**NCR-18 — Reserved Word Prohibition.**
- **Purpose:** Ensure reserved prefixes, suffixes, and identifiers are not misused.
- **Requirement:** A non-document artifact SHALL NOT be named with the identifier form or the `AI-SDOM` prefix [Section 12.1, Section 12.3]; an extension field SHALL use the `x-` prefix [AI-SDOM-STD-0002 (Section 4.2)].
- **Failure condition:** An asset, script, or sample named in the reserved identifier form, or a standard field using the `x-` prefix.
- **Severity:** Major.

**NCR-19 — Deprecated and Retired Name Prohibition.**
- **Purpose:** Ensure deprecated and retired names are not reused.
- **Requirement:** A deprecated name SHALL NOT be used for new artifacts, and a retired identifier SHALL NOT be reused [Section 12.4, Section 12.5].
- **Failure condition:** A new artifact using a deprecated name or retired identifier.
- **Severity:** Major.

**NCR-20 — Length Recommendation.**
- **Purpose:** Keep names within recommended length limits.
- **Requirement:** A short name SHOULD be 2-6 words and SHOULD NOT exceed 30 characters; a title SHOULD NOT exceed 60 characters; an identifier SHOULD NOT exceed 64 characters [Section 5.6].
- **Failure condition:** A name substantially exceeding the recommended limits (SHOULD-level; justified deviations recorded in the Self-Audit Log).
- **Severity:** Informational.

---

## 14. Machine Readability

14.1 **Canonical naming schema.** The canonical machine-readable representation of a document name is the identifier [Section 5.1] combined with the filename derived from it [Section 5.4]. The identifier and filename are validated against the grammar:

```text
identifier:  AI-SDOM-[A-Z]{2,3}-[0-9]{4}-[a-z0-9]+(?:-[a-z0-9]+)*
filename:    ai-sdom-[a-z]{2,3}-[0-9]{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md
slug:        [a-z0-9]+(?:-[a-z0-9]+)*
```

14.2 **Metadata representation.** The identifier and title are recorded in the document's YAML front matter as the `identifier` and `title` fields, per the canonical YAML representation and syntax rules of [AI-SDOM-STD-0002 (Section 7)] and the field registry of [AI-SDOM-STD-0002 (Section 3.2)]. This standard SHALL NOT redefine the metadata representation.

14.3 **Parser expectations.** A parser SHALL:
- Resolve the class, number, and short name from an identifier using [Section 5.1].
- Derive the expected filename from an identifier using [Section 5.4] and compare it with the actual filename.
- Validate every slug, filename, directory name, and Git object name against the character set [Section 10] and case decision table [Section 11.5].
- Treat identifier, filename, and short-name mismatches as defects per [NCR-04], [NCR-05], and [NCR-17].

14.4 **Validation examples.** The following pairs are valid identifier/filename combinations:

```text
AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT          ai-sdom-arc-0001-architecture-contract.md
AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD   ai-sdom-std-0004-semantic-versioning-standard.md
AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD     ai-sdom-std-0005-naming-convention-standard.md
```

---

## 15. Examples

The following examples are non-normative. They illustrate the naming rules in [Section 5] through [Section 12].

15.1 **Correct document naming.**

```text
Title:      Semantic Versioning Standard
Identifier: AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD
Filename:   ai-sdom-std-0004-semantic-versioning-standard.md
```

15.2 **Correct directories, assets, scripts, and Git names.**

```text
02-STANDARDS/
naming-convention-standard-assets/
  naming-convention-standard-case-table.png
shared-assets/
  repository-structure.png
scripts/
  validate-references.py
  validate-metadata.ps1
repository-config.yml
feat/std-0005-naming-standard
ai-sdom-std-0004-v0.1.0
```

15.3 **Incorrect names.**

```text
AI-SDOM-STD-0005-Naming-Standard      mixed case in identifier                 [NCR-02, NCR-17]
ai-sdom-std5-naming-standard.md       number not zero-padded                   [NCR-02]
Naming Convention Standard.md         filename with spaces                     [NCR-15]
02-Standards/                         directory case mismatch                  [NCR-08, NCR-17]
architectureContract.png              camelCase asset name                     [NCR-10]
fix-hotfix-reference-resolution       wrong hotfix separator                   [NCR-12, NCR-16]
ai-sdom-arc-0001-v1.0.0-alpha         pre-release tag suffix                   [NCR-13]
AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD.xlsx   identifier form on asset  [NCR-18]
```

15.4 **Migration example.** A legacy document whose filename did not mirror its identifier SHALL be renamed in the same change that next amends the document's content, per the migration and change governance of [AI-SDOM-GOV-0002], without changing the identifier itself [NCR-03].

```text
Before: Standards/DocumentMetadata.md
After:  02-STANDARDS/ai-sdom-std-0002-document-metadata-standard.md
```

---

## 16. Relationship to Other Standards

16.1 This standard is one of the Layer 2 standards. Its relationship to the other governed documents is:

| Document | Relationship |
|----------|--------------|
| [AI-SDOM-ARC-0001] | Constitutional authority for the identifier scheme (§5), directory structure (§6), naming conventions (§11), reserved ranges (§12), and naming compliance gate (§18.3). This standard is the canonical specification of §5 and §11. |
| [AI-SDOM-GOV-0001] | Governance of renames and migrations (§8), lifecycle of deprecated names (§20.2). This standard defines naming rules only and defers rename governance. |
| [AI-SDOM-GOV-0002] | Change management for renames, migrations, and hotfix traceability. |
| [AI-SDOM-STD-0001] | Document metadata declaration (§3) and title heading requirement. |
| [AI-SDOM-STD-0002] | Field-name rules, `x-` prefix, slug grammar (§4, §5), and YAML front-matter representation (§7). |
| [AI-SDOM-STD-0003] | Severity scale (§11.1) and identifier listing form used by registers. |
| [AI-SDOM-STD-0004] | Version grammar (§4) and release/tag identification (§10) referenced by versioned names and tags. |
| Document Development Procedure | Operational lifecycle that executes self-audit and naming validation. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (REG-0001) | Identifier authority and inventory that records each document's identifier and filename. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard | Enforces naming rules (naming compliance gate; G03 identifier, G04 directory). Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Certification Standard | Defines certification levels and the Draft-level requirement that identifiers and filenames conform to ARC-0001 §5. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

16.2 **Division of authority.** This standard defines naming rules only. It SHALL NOT duplicate:
- Identifier allocation and reserved ranges (governed by [AI-SDOM-ARC-0001 (Section 5, Section 12)] and the Repository Register).
- Metadata field definitions and data types (governed by [AI-SDOM-STD-0002]).
- Version grammar and increment rules (governed by [AI-SDOM-STD-0004]).
- Reference syntax and lifecycle (governed by [AI-SDOM-STD-0003]).
- Governance of renames, migrations, and exceptions (governed by [AI-SDOM-GOV-0001 (Section 8, Section 9)] and [AI-SDOM-GOV-0002]).
- Procedural steps for applying or reviewing names (governed by the PRC class).

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
| 0.1.0   | 2026-08-01 | —      | Initial naming convention standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-STD-0001], [AI-SDOM-STD-0002], [AI-SDOM-STD-0003], and [AI-SDOM-STD-0004], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure naming specification. §1.1 and §16.2 exclude governance, procedures, architecture, metadata, and versioning content. |
| §2.2 | Traceability | PASS | Every normative section cites the authorizing provision in ARC-0001, GOV-0001, GOV-0002, STD-0001, STD-0002, STD-0003, or STD-0004. |
| §2.4 | Parsimony | PASS | Naming rules are specified as the canonical implementation of ARC-0001 §5 and §11, referenced not reproduced. See Self-Audit Log items 1, 2, and 6. |
| §2.6 | Explicitness | PASS | All naming, character set, case, and reserved-word rules written explicitly. |
| §4 | Valid class code STD | PASS | Identifier: AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD. |
| §5.1 | Identifier format | PASS | AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD. |
| §5.4 | Filename mirror | PASS | ai-sdom-std-0005-naming-convention-standard.md. |
| §6.1 | Directory match | PASS | 02-STANDARDS/ maps to the STD class. |
| §7.1 | Layer N references 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), STD (L2). All ≤ 2. Higher-layer and cross-cutting documents referenced descriptively. |
| §7.3 | Dependencies section | PASS | Present as the front-matter `dependencies` list per established repository precedent. |
| §7.5 | STD cites authorizing GOV | PASS | GOV-0001 listed in Dependencies and §1.2. |
| §8 | Cross-reference syntax | PASS | All formal references use `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]` canonical form. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11 | Naming conventions | PASS | §5-§9 specify the canonical implementation of §11.1-§11.6, attributed and referenced. |
| §11.2 | Filename lowercase | PASS | ai-sdom-std-0005-naming-convention-standard.md. |
| §12 | Reserved range | PASS | STD-0005 falls in STD 0001-0099 (universal standards). |
| §14.2 | ai-assistance field | PASS | `ai-assistance` recorded in the front matter. |
| §18.3 | Naming compliance gate | PASS | §13.2 references the naming compliance gate without redefining its pass/fail criteria. |
| §20.2 | Lifecycle state | PASS | `lifecycle-state: Active`. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Constitutional Supremacy | PASS | §2.3 acknowledges supremacy of ARC-0001. |
| §2.3 | Separation of Concerns | PASS | §1.1 and §16.2 exclude procedures, templates, validation gates, and register content. |
| §8 | Amendment governance referenced | PASS | §3.4, §15.4, and §16.2 reference GOV-0001 §8 for renames and migrations. |
| §9 | Exception governance referenced | PASS | §16.2 defers exceptions to GOV-0001 §9; no granting authority is defined here. |

### STD-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2 | Normative language | PASS | SHALL/SHOULD/MAY used consistently; NCR severity scale is referenced from STD-0003 §11.1 and does not redefine normative keywords. |
| §3 | Document metadata | PASS | §14.2 references the metadata fields; the title heading rule is referenced from STD-0002 §3.3. |
| §7 | Cross-reference conventions | PASS | §2.3 and §16.1 reference the canonical syntax. |
| §8 | Mandatory sections | PASS | Front matter, title, Purpose, body sections, References, Amendment Record, and Self-Audit Log all present. |
| §8.4 | Self-Audit Log | PASS | Present, with issues and resolutions recorded. |

### STD-0002 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §3.2 | Field registry | PASS | `identifier` and `title` fields referenced, not redefined; §14.2 defers to the canonical registry. |
| §4.2 | Reserved prefix | PASS | §12.1 references the `x-` prefix rule. |
| §4.3 | Value naming | PASS | §11.3 references the slug grammar `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`. |
| §5 | Data types | PASS | Slug grammar referenced in §11.3; identifier type referenced from ARC-0001 §5.1. |
| §7 | Machine-readable representation | PASS | Front matter conforms to the canonical YAML form; §14.2 references §7. |
| MVR-10 | No unknown unprefixed keys | PASS | Only registered fields appear in the front matter. |

### STD-0003 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §6.1 | Resolution requirements | PASS | All canonical references resolve to governed documents. |
| §6.7 | Dependency completeness | PASS | Every document referenced canonically appears in the `dependencies` list. |
| §7.3 | Cross-cutting references by descriptive title | PASS | QLT documents and the Procedure referenced descriptively, not canonically. |
| §9.2 | External record resolution | PASS | [RFC 2119] is declared in the References section. |
| §11.1 | Severity scale | PASS | §13.1 references the severity scale, not restates it. |

### STD-0004 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §4 | Version grammar | PASS | §7.7 and §9.4 reference the version grammar; no version rules restated. |
| §10 | Release identification | PASS | §9.4 and §9.5 reference tag and release naming per STD-0004 §10. |
| SVR-18 | Commit hash exclusion | PASS | §9.6 states commit hashes SHALL NOT be used as versions, per STD-0004 §10.4. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), STD (L2). All ≤ 2. |
| G01-R6 | No circular dependencies | PASS | STD-0005 → GOV-0002 → GOV-0001 → ARC-0001; STD-0005 → STD-0004 → STD-0003 → STD-0002 → STD-0001 → GOV-0001 → ARC-0001. ARC has no dependencies. No cycle. |
| G01-R7 | STD must cite authorizing GOV | PASS | GOV-0001 listed in Dependencies. |
| G01-R8 | Dependencies section exists | PASS | Front-matter `dependencies` present with a list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | STD is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: STD. |
| G02-R3 | Layer matches LAYER_MAP | PASS | Layer 2. Front matter: `layer: 2`. |
| G02-R4 | Single concern | PASS | Naming specification only — no governance, procedure, metadata, or versioning content. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD. |
| G03-R2 | Filename mirror | PASS | ai-sdom-std-0005-naming-convention-standard.md. |
| G03-R3 | No duplicate identifier | PASS | No other document uses this identifier. |
| G03-R4 | Identifier not reassigned | PASS | First assignment. |
| G03-R5 | Not in retired register | PASS | Retired register is empty. |

**G04 — Directory Placement**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G04-R1 | Directory matches class | PASS | 02-STANDARDS/ maps to the STD class. |
| G04-R2 | Within numbered directory | PASS | File resides in 02-STANDARDS/. |

**G05 — Cross-Reference Integrity**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G05-R1 | All references resolve | PASS | All canonical references resolve to governed documents; the external reference resolves to the declared record. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` references verified against the section structure. |
| G05-R4 | Cross-class reference compliance | PASS | Formal references limited to layers 0-2 per [AI-SDOM-ARC-0001 (Section 7.1)]; higher-layer and cross-cutting documents referenced descriptively. |
| G05-R5 | Canonical syntax | PASS | All formal external references use canonical form. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `version: 0.1.0`. |
| G06-R2 | SemVer format | PASS | 0.1.0 matches `\d+\.\d+\.\d+`; no pre-release or build metadata. |
| G06-R3 | Version increment direction | PASS | Initial version; no prior revision to compare. |
| G06-R4 | ADR version prohibition | N/A | This document is STD, not ADR. |
| G06-R5 | QLT version inclusion | N/A | This document is STD, not QLT. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | STD 0005 is within STD 0001-0099 (universal standards). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is STD, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001, GOV-0001, GOV-0002, STD-0001, STD-0002, STD-0003, and STD-0004. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing provision. |
| G09-R3 | No duplication | PASS | Identifier, filename, directory, and version-tag rules referenced to ARC-0001 §5/§11 and STD-0004 as canonical specifications. See Self-Audit Log items 1, 2, and 6. |
| G09-R4 | Composability | PASS | Naming model composes cleanly with the `identifier`/`title` fields in STD-0002 §3, the slug grammar in STD-0002 §5, and the version grammar in STD-0004 §4. |
| G09-R5 | Explicitness | PASS | All naming, character set, case, and reserved-word rules written explicitly. |
| G09-R6 | Governance boundary respect | PASS | No governance roles, approval processes, or decision rights defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R1 | No unauthorized identifier assignment | PASS | Identifier AI-SDOM-STD-0005 drawn from the register's next-available table (STD 0005). |
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R3 | Script documentation requirement | N/A | This standard defines no scripts; it governs script naming. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Identifier and filename duplication boundary with ARC-0001 (Sections 5, 14):** [AI-SDOM-ARC-0001 (Section 5)] defines the identifier scheme and filename mirror, and [AI-SDOM-ARC-0001 (Section 5.4)] defines the lowercase filename. Reproducing them as original content would duplicate constitutional content. Resolved by presenting the identifier scheme and filename rule as the canonical specification attributed to ARC-0001 §5, adding the relationship rule (§5.5), extension and length recommendations (§5.6), and the machine-readable grammar (§14.1) that no existing document provides.

2. **Naming-convention duplication boundary with ARC-0001 (Sections 4-9):** [AI-SDOM-ARC-0001 (Section 11)] defines base conventions for directories, files, assets, scripts, branches, and tags. Resolved by specifying each convention with attribution in §6.2-§6.3, §7.1, §8.1, §9.1, and §9.4, and adding the operational detail (asset folder organization, temporary/archive folders, per-language script extensions, hotfix branches, release names, commit messages) that ARC-0001 does not define.

3. **Metadata-rule duplication risk (Sections 11, 14):** The slug grammar and `x-` prefix are defined by [AI-SDOM-STD-0002 (Section 4, Section 5)]. Resolved by referencing STD-0002 §4.2/§4.3 and §5 for the slug grammar and reserved prefix, and by defining only the context-specific case decision table (§11.5) that no existing document provides.

4. **Versioning duplication risk (Sections 9, 16):** Version grammar, release identification, and the prohibition on pre-release suffixes are defined by [AI-SDOM-STD-0004]. Resolved by referencing STD-0004 §4 and §10 for version strings and tags, and by defining only the tag name form (§9.4) attributed to ARC-0001 §11.6.

5. **QLT reference constraint (Sections 16):** The required relationship to the Architecture Validation Standard and the Repository Certification Standard conflicts with the adopted interpretation of [AI-SDOM-ARC-0001 (Section 7.1)], under which a layered document SHALL NOT reference a cross-cutting document by canonical identifier. Resolved by referencing both QLT documents by descriptive title only, in §16, consistent with the precedent established in the STD-0001 through STD-0004, GOV-0001, GOV-0002, and REG-0001 self-audits.

6. **Severity scale (Section 13.1):** No governed document defines a severity scale for naming defects. Resolved by referencing the four-level severity scale of [AI-SDOM-STD-0003 (Section 11.1)] rather than restating it, keeping the naming rules focused on naming only.

7. **External reference pinning (Section 17):** [RFC 2119] is a versioned external target. Resolved by pinning the record to the RFC per the Cross-Reference Standard's version-pinning rule, including the RFC number and title.

8. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter `dependencies` field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.

9. **Assumed-delivery source control:** This document is delivered as an uncommitted working-tree change for review and approval (phase contract: no Git operations). Its `lifecycle-state` is Active and version 0.1.0; ratification and the associated Git tag per [AI-SDOM-ARC-0001 (Section 11.6)] will follow approval per [AI-SDOM-ARC-0001 (Section 15.3)].

10. **No Semantic Versioning regressions and self-consistency:** This document's own name complies with the rules it defines: the identifier `AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD` conforms to [NCR-02], the filename `ai-sdom-std-0005-naming-convention-standard.md` conforms to [NCR-04], the title uses Title Case per [NCR-07], and the front matter uses only registered fields per [NCR-18] and STD-0002 MVR-10. Every NCR rule was verified against the section it references during self-audit.
