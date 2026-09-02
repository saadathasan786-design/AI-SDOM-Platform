---
identifier: AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD
title: Cross-Reference Standard
version: 0.1.0
lifecycle-state: Active
layer: 2
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY
  - AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY
  - AI-SDOM-STD-0001-DOCUMENTATION-STANDARD
  - AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD
tags:
  - references
  - standards
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-01: initial draft"
---

# Cross-Reference Standard

## 1. Purpose

1.1 This standard is the canonical specification of every reference that may appear anywhere within the AI-SDOM repository. It is the single source of truth for how references are formed, classified, resolved, validated, represented in machine-readable form, and managed across the lifecycle of their targets. It applies to references within document content, in the metadata record, and in any tooling or automation that reads or writes references [AI-SDOM-ARC-0001 (Section 14, Section 19)].

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 7, Section 8)], which establishes the dependency rules and the cross-reference syntax that all documents must follow, and from [AI-SDOM-STD-0001 (Section 7)], which declares the cross-reference conventions of the Documentation Standard. This standard is the canonical specification of that syntax and those conventions. Where this standard and [AI-SDOM-ARC-0001] describe the same reference rule, [AI-SDOM-ARC-0001] remains the constitutional authority and prevails in case of conflict [AI-SDOM-ARC-0001 (Section 2.3)].

1.3 This standard operates within the governance framework established by [AI-SDOM-GOV-0001]. It defines the rules for references only. It SHALL NOT define:
- Step-by-step operational instructions for authoring or validating references (governed by the PRC class, e.g., the Document Development Procedure).
- Governance roles, approval thresholds, or decision rights for reference management (governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001]).
- Architecture rules for document structure, taxonomy, or layering (governed by [AI-SDOM-ARC-0001 (Section 3, Section 4, Section 6)]).
- The metadata field registry, including the `dependencies` field (governed by [AI-SDOM-STD-0002 (Section 3)]).
- Quality gate pass/fail criteria (governed by the QLT class, e.g., the Architecture Validation Standard).

1.4 This standard applies to:
- Every governed document currently in the repository.
- Every governed document created in the future.
- Amendments to existing governed documents.
- Any machine-readable tooling, automation, or AI agent that reads or writes references [AI-SDOM-ARC-0001 (Section 14, Section 19)].

---

## 2. Scope

2.1 This standard governs every reference. A *reference* is any expression within a governed document or its metadata record that points to a target — a section or appendix of a document, a governed document, a repository artifact, or an external resource. Every such expression SHALL conform to this standard.

2.2 This standard applies to references of all nine types defined in [Section 4], regardless of where they appear: body content, tables, front-matter metadata, References sections, and Self-Audit records.

2.3 This standard does not govern:
- The content or substance of the targets of references.
- The rendering or visual formatting of references (governed by TPL documents in 04-TEMPLATES).
- The interpretation of normative keywords (SHALL, SHOULD, MAY) used inside referenced sections (governed by [AI-SDOM-STD-0001 (Section 2)]).
- The allocation of document identifiers (governed by [AI-SDOM-ARC-0001 (Section 5, Section 12)] and the Repository Register in 05-REGISTERS).

2.4 Where a provision of this standard conflicts with [AI-SDOM-ARC-0001], the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

---

## 3. Reference Philosophy

3.1 **Single Source of Truth.** This standard is the canonical authority for reference formation, classification, resolution, and lifecycle in the AI-SDOM repository. No other governed document SHALL define reference rules that conflict with this standard.

3.2 **Deterministic Resolvability.** Every reference SHALL resolve deterministically to a single target. A reference that can resolve to no target, more than one target, or an ambiguous target is a defect.

3.3 **Parsimony Through References.** References exist to avoid duplicating information. When information must be reused across documents, the repository uses references per the parsimony principle [AI-SDOM-ARC-0001 (Section 2.4)], never copy-paste of normative content.

3.4 **Precision Over Convenience.** A reference SHALL be explicit and machine-parseable. Shorthand that saves authoring effort but weakens resolution is prohibited.

3.5 **Stability of Intent.** The intent of a reference (what it points to) is stable; its resolution is updated as its target moves through its lifecycle [Section 10]. References are corrected, not silently reinterpreted.

3.6 **Constitutional Precedence.** [AI-SDOM-ARC-0001 (Section 7, Section 8)] is the constitutional authority for dependency and cross-reference rules. This standard specifies, extends, and operationalizes those rules; it never contradicts them.

---

## 4. Reference Types

4.1 Every reference SHALL be classified as one or more of the nine reference types defined below. A reference is classified by (a) the location of its target and (b) the lifecycle state of its target. A single reference MAY satisfy several types simultaneously; for example, a reference from an STD to a GOV document is both an internal document reference and a cross-class and cross-layer reference.

### 4.1 Internal Section Reference

An internal section reference points to a section or appendix of the same document that contains the reference. It uses the internal forms `[Section X]`, `[Section X.Y]`, `[Section X.Y.Z]`, or `[Appendix A]` [Section 5.4, Section 5.5]. It is resolved within the host document only.

### 4.2 Internal Document Reference

An internal document reference points to a governed document within the AI-SDOM repository. It uses the canonical citation form `[AI-SDOM-CLASS-NNNN]`, optionally combined with a section or appendix [Section 5.1, Section 5.2, Section 5.3]. It is resolved against the repository's identifier authority, the Repository Register in 05-REGISTERS.

### 4.3 Cross-Class Reference

A cross-class reference is an internal document reference whose target class differs from the class of the document containing the reference (for example, an STD referencing a GOV). All internal document references between different classes are cross-class references. Cross-class references SHALL comply with the class-specific citation chains in [Section 7] and [AI-SDOM-ARC-0001 (Section 7.5)].

### 4.4 Cross-Layer Reference

A cross-layer reference is an internal document reference whose target layer differs from the layer of the document containing the reference. All internal document references between different layers are cross-layer references. Cross-layer references SHALL comply with the dependency direction defined in [AI-SDOM-ARC-0001 (Section 7.1)] and clarified in [Section 7].

### 4.5 External Reference

An external reference points to a target outside the AI-SDOM repository: a book, an ISO standard, an RFC, a URL, a paper, or a versioned specification. It is cited in body text as `[LABEL]` and declared in the document's References section [Section 9].

### 4.6 Repository Reference

A repository reference points to a repository artifact that is not a governed document: a numbered directory (for example, `02-STANDARDS/`), a script in `scripts/`, a file in `.ai/`, or an infrastructure file such as `README.md` or `.gitignore` [AI-SDOM-ARC-0001 (Section 6)]. Repository references use descriptive path notation; they SHALL NOT use the canonical citation form because their targets are not governed documents.

### 4.7 Future Reference

A future reference (forward reference) points to a governed document that has not yet been created. It is annotated `[FORWARD]` and is permitted only in ARC and ADR documents [Section 8] per [AI-SDOM-ARC-0001 (Section 8.3)].

### 4.8 Deprecated Reference

A deprecated reference is a reference whose target is a governed document in the Deprecated lifecycle state [AI-SDOM-ARC-0001 (Section 20.2)]. It is lifecycle-sensitive: existing deprecated references may persist during the transition period, but new references to Deprecated documents SHALL NOT be introduced [Section 10.4].

### 4.9 Superseded Reference

A superseded reference is a reference whose target has been superseded: a document superseded by another document, an ADR whose Status is `Superseded` [AI-SDOM-ARC-0001 (Section 17.3)], or an external specification superseded by a newer edition. Superseded references SHALL be re-pointed to the superseding target or annotated [Section 10.5].

4.10 The nine types are normative. A reference type not defined in this section SHALL NOT be introduced except by amendment of this standard.

---

## 5. Canonical Syntax

5.1 This section defines the canonical syntax for all references. The syntax specified here is the canonical specification of the conventions declared in [AI-SDOM-STD-0001 (Section 7)] and the forms established by [AI-SDOM-ARC-0001 (Section 8.1)].

### 5.1 Document Reference (Citation Form)

The citation form is the canonical in-body reference to a governed document:

```
[AI-SDOM-CLASS-NNNN]
```

Where `CLASS` is a valid class code (`ARC`, `GOV`, `STD`, `PRC`, `TPL`, `REG`, `ADR`, `QLT`) and `NNNN` is the zero-padded four-digit sequential number from the document's identifier [AI-SDOM-ARC-0001 (Section 5.1)]. Examples: `[AI-SDOM-ARC-0001]`, `[AI-SDOM-STD-0002]`.

### 5.2 Document Reference with Section

A reference to a specific section of another document:

```
[AI-SDOM-CLASS-NNNN (Section X.Y)]
```

Where `X.Y` is the section number within the target document. Example: `[AI-SDOM-ARC-0001 (Section 8)]`. When two or more sections are cited together, they SHALL be listed separated by commas within a single parenthetical, for example `[AI-SDOM-ARC-0001 (Section 14, Section 19)]`, matching established repository practice.

### 5.3 Document Reference with Appendix

A reference to a specific appendix of another document:

```
[AI-SDOM-CLASS-NNNN (Appendix A)]
```

Where `A` is the appendix letter within the target document.

### 5.4 Internal Section Reference

A reference to a section of the same document:

```
[Section X]        top-level section X as a whole
[Section X.Y]      subsection Y of section X
[Section X.Y.Z]    subsection Z of subsection X.Y
```

`[Section X]` SHALL refer only to a top-level numbered section (X is a single integer). Nested references SHALL specify the full path from the top level.

### 5.5 Internal Appendix Reference

A reference to an appendix of the same document:

```
[Appendix A]
```

The appendix token SHALL be a single uppercase letter. Lowercase letters, numerals, or descriptive appendix names are not canonical forms.

### 5.6 Document Identifier (Listing Form)

The listing form is the full identifier with short name, used for records and inventories — the front-matter `dependencies` field [AI-SDOM-STD-0002 (Section 3.2)], References section tables, and registers:

```
AI-SDOM-CLASS-NNNN-SHORT-NAME
```

Example: `AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT`. The listing form SHALL NOT be used as an in-body citation; the citation form [Section 5.1] is used there. In tables and registers the listing form may be shown with or without surrounding brackets for readability; bracketed listing forms are records, not citations, and are not resolved as citations [Section 6.1].

### 5.7 Prohibited Forms

The following SHALL NOT appear in body content of any governed document:
- Bare identifiers without brackets, for example `AI-SDOM-ARC-0001` or `ARC-0001`.
- Abbreviated class codes, for example `ARC-0001`.
- Section-sign notation, for example `[ARC-0001 §8]` or `[Section §8.1]`.
- Markdown links to internal headings in place of `[Section X.Y]`.
- Raw inline URLs in body text; URLs appear only within external reference records [Section 9.2].
- The listing form [Section 5.6] used as an in-body citation.
- Descriptive titles used where a canonical citation is required [Section 5.1].

### 5.8 Grammar Summary

| Form | Grammar |
|------|---------|
| Document citation | `[AI-SDOM-CLASS-NNNN]` |
| Document + section | `[AI-SDOM-CLASS-NNNN (Section \d+(\.\d+)*)]` |
| Document + appendix | `[AI-SDOM-CLASS-NNNN (Appendix [A-Z])]` |
| Internal section | `[Section \d+(\.\d+)*]` |
| Internal appendix | `[Appendix [A-Z]]` |
| External citation | `[LABEL]` — unique label declared in the References section [Section 9.3] |
| Forward reference | `[FORWARD] [AI-SDOM-CLASS-NNNN]` [Section 8.2] |
| Repository reference | descriptive path notation, not a bracketed citation [Section 4.6] |

---

## 6. Reference Resolution Rules

6.1 **Resolution requirements.** Every reference SHALL resolve to a single, existing, valid target at the time of validation. A canonical document citation SHALL resolve to a governed document registered in the Repository Register in 05-REGISTERS [AI-SDOM-ARC-0001 (Section 8.2)]. An internal section or appendix reference SHALL resolve to an existing section or appendix of the host document. An external citation SHALL resolve to a declared record in the References section [Section 9.2]. A bracketed listing-form record in a table or register is not a citation and is not resolved as one [Section 5.6].

6.2 **Uniqueness.** Resolution SHALL produce exactly one target. A reference SHALL NOT be satisfiable by more than one document, section, appendix, or record. Uniqueness of document targets is guaranteed by identifier uniqueness [AI-SDOM-ARC-0001 (Section 5.3)] and SHALL be verified for section, appendix, and external targets [CRR-06].

6.3 **Ambiguity prohibition.** A reference SHALL have exactly one interpretation. The following are defects:
- A document containing two sections with the same number or two appendices with the same letter.
- A citation form that matches more than one registered document.
- An external label that could be read as an internal section or appendix token, or that is declared more than once.
- Any reference whose target cannot be determined without context outside the document.

6.4 **Identifier precedence.** In a combined reference `[AI-SDOM-CLASS-NNNN (Section X.Y)]` or `[AI-SDOM-CLASS-NNNN (Appendix A)]`, the document identifier SHALL be resolved first — against the register — and the section or appendix SHALL then be resolved within that document. The section or appendix SHALL NOT be resolved against any other document.

6.5 **Section precedence.** For `[Section X.Y]`, top-level section X SHALL be resolved first, then subsection Y within it. The reference targets the deepest level specified. `[Section X]` SHALL refer to top-level section X as a whole, including all of its subsections; it SHALL NOT be used where a deeper level is intended.

6.6 **Appendix precedence.** The appendix namespace is disjoint from the section namespace. `[Appendix A]` SHALL resolve only to an appendix of the host document; it SHALL NOT resolve to a section or any other element, regardless of numbering. `[AI-SDOM-CLASS-NNNN (Appendix A)]` SHALL resolve only to an appendix of the target document.

6.7 **Dependency completeness.** The metadata record and the body references SHALL agree:
- Every document referenced by a canonical document citation [Section 5.1] SHALL be listed in the referencing document's `dependencies` field [AI-SDOM-STD-0002 (Section 3.2)] per [AI-SDOM-ARC-0001 (Section 7.3)].
- Every identifier listed in the `dependencies` field SHALL be referenced at least once in the document body or in its References section.
- Documents referenced only by descriptive title — higher-layer and cross-cutting targets [Section 7.3] — SHALL NOT be listed in the `dependencies` field.

---

## 7. Cross-Layer Reference Rules

7.1 The authority for dependency direction between layers and classes is [AI-SDOM-ARC-0001 (Section 7)]. This section clarifies acceptable and prohibited cross-layer and cross-class references without adding new authority. Where this section and [AI-SDOM-ARC-0001 (Section 7)] appear to differ, [AI-SDOM-ARC-0001 (Section 7)] prevails [Section 2.4].

7.2 **Acceptable and prohibited references.**

| Referencing document | Acceptable canonical references | Prohibited canonical references |
|----------------------|---------------------------------|--------------------------------|
| Layered document at layer N (ARC, GOV, STD, PRC, TPL, REG) | Documents at layers 0 through N inclusive [AI-SDOM-ARC-0001 (Section 7.1)] | Documents at layers N+1 through 5; cross-cutting documents (ADR, QLT) [Section 7.3] |
| ARC (Layer 0) | No documents (Layer 0 depends on nothing) | Any canonical document reference |
| ADR (cross-cutting) | Any layered document (Layers 0-5) [AI-SDOM-ARC-0001 (Section 7.2)] | Another ADR; any QLT |
| QLT (cross-cutting) | Any layered document (Layers 0-5) [AI-SDOM-ARC-0001 (Section 7.2)] | Another QLT; any ADR |

7.3 **Cross-cutting clarification.** A layered document SHALL reference a cross-cutting document (ADR, QLT) by descriptive title, not by canonical citation. The target's identifier may appear within the descriptive text; it SHALL NOT appear in the bracketed citation form and SHALL NOT be listed in the `dependencies` field [Section 6.7]. Cross-cutting documents SHALL reference each other's class only as permitted in [Section 7.2].

7.4 **Class citation chains.** Cross-class references SHALL satisfy the mandatory citation chains of [AI-SDOM-ARC-0001 (Section 7.5)]: a STD SHALL cite the GOV document that authorizes it; a PRC SHALL cite the STD it implements; a TPL SHALL cite the document class it templates; a REG SHALL cite the document whose records it holds; an ADR SHALL cite the documents that motivated or are affected by the decision; a QLT SHALL cite the documents whose quality it validates.

7.5 **Cycles.** The transitive closure of all references SHALL contain no cycle [AI-SDOM-ARC-0001 (Section 7.4)]. If a document A references document B, and document B references document C, then document C SHALL NOT reference document A, directly or transitively.

---

## 8. Forward References

8.1 **When allowed.** A forward reference — a reference to a governed document that has not yet been created — SHALL appear only in an ARC or ADR document, per [AI-SDOM-ARC-0001 (Section 8.3)]. All other classes (GOV, STD, PRC, TPL, REG, QLT) SHALL NOT contain forward references. A forward reference in a permitted class SHALL use a placeholder identifier that has not yet been assigned.

8.2 **Required notation.** A forward reference SHALL be annotated `[FORWARD]` immediately preceding the placeholder canonical identifier:

```
[FORWARD] [AI-SDOM-CLASS-NNNN]
```

The `[FORWARD]` annotation is required in every occurrence. An unannotated reference to a document that does not yet exist is a defect, not a forward reference.

8.3 **Validation expectations.** At validation time:
- The placeholder identifier SHALL conform to the canonical scheme [Section 5.1].
- The placeholder identifier SHALL be unreserved: it SHALL NOT match an existing registered document, and it SHALL be drawn from the reserved range for its class [AI-SDOM-ARC-0001 (Section 12)].
- When the target document is created, each forward reference to it SHALL be converted to a normal canonical citation [Section 5.1] and the `[FORWARD]` annotation SHALL be removed.
- A forward reference whose placeholder identifier has become an existing document SHALL be treated as a normal reference and SHALL NOT retain the `[FORWARD]` annotation.

8.4 **Publication restrictions.** A forward reference SHALL NOT remain unresolved in a published document:
- A document that contains an unresolved forward reference SHALL NOT attain the Release Candidate certification level until each forward reference resolves or the document is revised [QLT-0002 §4].
- Forward references SHALL NOT be introduced in classes where they are prohibited [Section 8.1].
- A forward reference SHALL NOT be used where a descriptive plan or a reference to a registered document would serve. Planned documents are described by class and content, not cited in advance; identifiers are allocated from the Repository Register when each document is initiated [AI-SDOM-ARC-0001 (Section 5.3)].

---

## 9. External References

9.1 **Scope.** An external reference points to a target outside the AI-SDOM repository. The recognized external target kinds are: books, ISO standards, RFCs, URLs, papers, and versioned specifications. No other external kind SHALL be introduced except by amendment of this standard.

9.2 **Declaration and citation.** An external reference SHALL be declared as a record in the document's References section and SHALL be cited in body text as `[LABEL]`. Raw inline URLs SHALL NOT appear in body text. An external citation SHALL have exactly one declared record [CRR-18].

9.3 **Labels.** A label SHALL be unique within the document, SHALL be distinct from internal section and appendix tokens [Section 6.3], and SHALL be a short descriptive token. Recognized label forms include:
- RFC: `[RFC 2119]`
- ISO standard: `[ISO 8601:2019]`
- Versioned specification: `[SemVer 2.0.0]`
- Book or paper: `[Author Year]` (for example, `[Meyerhoff 2020]`)

9.4 **Record schemas.** Each external reference record SHALL contain the fields applicable to its kind:

| Kind | Required Fields |
|------|-----------------|
| Book | Authors; Title; Edition (when not the first); Publisher; Year; ISBN |
| ISO standard | Standard number with edition year (for example, `ISO 8601:2019`); Title |
| RFC | RFC number; Title; Status (for example, Standards Track, Informational); obsoleted-by / updated-by notes when applicable |
| URL | Title; URL; Access date (SHALL); archived copy (MAY) |
| Paper | Authors; Title; Venue; Year; DOI (SHALL when available) |
| Versioned specification | Name; Version; Date; Source (URL or authority) |

9.5 **Version pinning.** A versioned external target SHALL be pinned to a specific version, edition, or access date [CRR-19]. A reference to a versioned specification SHALL NOT cite an unpinned target (for example, "the latest edition" or a bare standard name without an edition year).

9.6 **External reference lifecycle.** External targets may be superseded: an RFC may be obsoleted, an ISO standard superseded by a new edition, or a specification replaced. A superseded external reference SHALL be updated to the current edition or annotated with the supersession [Section 10.5]. The external target's status as documented in its record is the basis for its lifecycle classification.

---

## 10. Reference Lifecycle

10.1 Every reference exists in exactly one reference lifecycle state at any time. The reference lifecycle states are:

```
Draft → Active → Deprecated → Superseded → Retired
```

10.2 **Draft.** A reference is Draft while it is introduced but not yet resolved or validated. Authoring-time references, and forward references in ARC and ADR documents [Section 8], are Draft. A reference SHALL NOT remain Draft in a published document.

10.3 **Active.** A reference is Active when its target exists, is in the Active lifecycle state [AI-SDOM-ARC-0001 (Section 20.2)] or is a current external target, and the reference is current and valid.

10.4 **Deprecated.** A reference is Deprecated when its target is a governed document in the Deprecated lifecycle state, or its external target has been formally superseded and the reference has not yet been updated. A Deprecated reference may persist during the target's transition period [AI-SDOM-ARC-0001 (Section 20.2)], but:
- New references to the Deprecated target SHALL NOT be introduced [AI-SDOM-ARC-0001 (Section 20.3)].
- Existing references SHALL be updated before the transition period expires.

10.5 **Superseded.** A reference is Superseded when its target has been superseded: a document replaced by another document, an ADR whose Status is `Superseded` [AI-SDOM-ARC-0001 (Section 17.3)], or an external target superseded by a newer edition. A Superseded reference SHALL be re-pointed to the superseding target or annotated with the supersession. New references to a Superseded target SHALL NOT be introduced.

10.6 **Retired.** A reference is Retired when its target is a governed document in the Retired lifecycle state or whose identifier has been retired [AI-SDOM-ARC-0001 (Section 12.2)], or an external target that is no longer available. References to Retired targets SHALL be removed or re-pointed. A Retired target SHALL NOT be referenced by any document.

10.7 **State derivation.** For internal document references [Section 4.2], the reference lifecycle is derived from the target document's lifecycle state as recorded in the Repository Register, combined with the reference's own creation and resolution state. For external references [Section 4.5], the lifecycle is derived from the external target's status recorded in its reference record [Section 9.4]. The reference lifecycle is a property of the reference instance, not of the host document.

10.8 **Relationship to the document lifecycle.** The reference lifecycle is distinct from the document lifecycle [AI-SDOM-ARC-0001 (Section 20.2)] and from certification status. A host document may be Active while containing a Deprecated or Superseded reference; that condition is a defect to be corrected [CRR-20] and may affect the host document's certification level [QLT-0002 §4]. Correcting a reference SHALL follow the amendment and change governance of [AI-SDOM-GOV-0001 (Section 8)] and [AI-SDOM-GOV-0002].

---

## 11. Validation Rules

11.1 **Severity scale.** Each validation rule in this section carries one of the following severities:

| Severity | Meaning |
|----------|---------|
| Critical | The reference cannot be resolved or validated, or the violation contradicts [AI-SDOM-ARC-0001]. A Critical failure is a mandatory-gate failure [AI-SDOM-ARC-0001 (Section 18.3)] and SHALL block merge and release [QLT-0002 §5.2]. |
| Major | The reference is a defect that SHALL be corrected before the document attains the Release Candidate certification level [QLT-0002 §4]. |
| Minor | The reference is non-conforming in a way that SHOULD be corrected; the deviation SHALL be recorded in the document's Self-Audit Log [AI-SDOM-STD-0001 (Section 8.4)]. |
| Informational | Advisory; no correction required. |

11.2 **Enforcement.** The rules in this section are the canonical reference validation rules. They are enforced by the cross-reference integrity gate of the Architecture Validation Standard, by automated tooling established per [AI-SDOM-ARC-0001 (Section 19)], and, where no automated tooling exists, by author self-audit per the Document Development Procedure and by manual review per [AI-SDOM-ARC-0001 (Section 18.4)]. This standard does not define gate pass/fail criteria; it defines the rules that gates and tooling validate against [Section 1.3].

11.3 The validation rules are designated CRR-01 through CRR-20.

**CRR-01 — Canonical Document Reference Syntax.**
- **Purpose:** Ensure every reference to a governed document uses the single canonical citation form.
- **Requirement:** A reference to a governed document SHALL use `[AI-SDOM-CLASS-NNNN]`, `[AI-SDOM-CLASS-NNNN (Section X.Y)]`, or `[AI-SDOM-CLASS-NNNN (Appendix A)]` in body content [Section 5.1-5.3]. Prohibited forms [Section 5.7] SHALL NOT be used.
- **Failure condition:** A reference to a governed document in any form other than the canonical citation forms.
- **Severity:** Major.

**CRR-02 — Canonical Section Reference Syntax.**
- **Purpose:** Ensure internal section references use the defined syntax.
- **Requirement:** An internal section reference SHALL use `[Section X]`, `[Section X.Y]`, or `[Section X.Y.Z]` [Section 5.4].
- **Failure condition:** A section reference in any other form (for example, `[Section §8]`, a markdown link to a heading, or a bare heading name).
- **Severity:** Major.

**CRR-03 — Canonical Appendix Reference Syntax.**
- **Purpose:** Ensure appendix references use the defined syntax.
- **Requirement:** An internal appendix reference SHALL use `[Appendix A]` with a single uppercase letter [Section 5.5].
- **Failure condition:** An appendix reference missing the letter, using a lowercase or non-letter token, or in any other form.
- **Severity:** Major.

**CRR-04 — Canonical Combined Reference Syntax.**
- **Purpose:** Ensure document-plus-section and document-plus-appendix references use the defined forms.
- **Requirement:** A combined reference SHALL use `[AI-SDOM-CLASS-NNNN (Section X.Y)]` or `[AI-SDOM-CLASS-NNNN (Appendix A)]` [Section 5.2-5.3].
- **Failure condition:** A combined reference in any other form (wrong delimiter, reversed order, or missing parentheses).
- **Severity:** Major.

**CRR-05 — Reference Resolution Requirement.**
- **Purpose:** Ensure every reference resolves to a single, existing target.
- **Requirement:** Every reference SHALL resolve to a target that exists and is valid at validation time [Section 6.1]; a reference to a non-existent document, section, appendix, or record is a defect [AI-SDOM-ARC-0001 (Section 8.2)].
- **Failure condition:** A reference whose target cannot be resolved.
- **Severity:** Critical.

**CRR-06 — Target Uniqueness.**
- **Purpose:** Ensure a reference identifies exactly one target.
- **Requirement:** A reference SHALL resolve to exactly one document, section, appendix, or record [Section 6.2].
- **Failure condition:** A reference that resolves to more than one target.
- **Severity:** Critical.

**CRR-07 — Ambiguity Prohibition.**
- **Purpose:** Ensure no reference admits more than one interpretation.
- **Requirement:** A reference SHALL have exactly one interpretation. Duplicate section numbers, duplicate appendix letters, citation forms matching more than one document, and duplicate external labels are prohibited [Section 6.3].
- **Failure condition:** Any reference or referenced structure that can be read in more than one way.
- **Severity:** Critical.

**CRR-08 — Identifier Precedence.**
- **Purpose:** Establish the resolution order of a combined reference.
- **Requirement:** In a combined reference, the document identifier SHALL be resolved first against the register; the section or appendix SHALL then be resolved within that document [Section 6.4].
- **Failure condition:** A combined reference resolved in any other order.
- **Severity:** Major.

**CRR-09 — Section Precedence.**
- **Purpose:** Establish how nested section references resolve.
- **Requirement:** `[Section X.Y]` SHALL resolve top-level section X first, then subsection Y within it; `[Section X]` SHALL refer to top-level section X as a whole [Section 6.5].
- **Failure condition:** A nested reference resolving to the wrong level, or a reference whose path does not exist.
- **Severity:** Major.

**CRR-10 — Appendix Precedence.**
- **Purpose:** Keep the appendix namespace disjoint from the section namespace.
- **Requirement:** An appendix reference SHALL resolve only to an appendix; it SHALL NOT resolve to a section or any other element [Section 6.6].
- **Failure condition:** An appendix reference resolving to a non-appendix element, or an appendix collision.
- **Severity:** Major.

**CRR-11 — Layer-Bound Compliance.**
- **Purpose:** Enforce the dependency direction of [AI-SDOM-ARC-0001 (Section 7.1)].
- **Requirement:** A layered document at layer N SHALL reference by canonical citation only documents at layers 0 through N; higher-layer documents SHALL be referenced descriptively [Section 7.2].
- **Failure condition:** A canonical reference from a layer-N document to a document at layer M greater than N.
- **Severity:** Critical.

**CRR-12 — Cross-Cutting Descriptive Reference.**
- **Purpose:** Prescribe how layered documents reference cross-cutting documents (ADR, QLT).
- **Requirement:** A layered document SHALL reference an ADR or QLT document by descriptive title, not by canonical citation; the identifier may appear in the descriptive text but not in a bracketed citation [Section 7.3].
- **Failure condition:** A layered document using a canonical bracket reference to an ADR or QLT document.
- **Severity:** Major.

**CRR-13 — Dependency Completeness.**
- **Purpose:** Ensure the `dependencies` metadata field and the body references agree.
- **Requirement:** Every document referenced by a canonical citation SHALL be listed in the referencing document's `dependencies` field; every identifier listed in `dependencies` SHALL be referenced at least once in the document body or References section [Section 6.7].
- **Failure condition:** A referenced document missing from `dependencies`, or a dependency never referenced.
- **Severity:** Major.

**CRR-14 — Cross-Class Citation Chain.**
- **Purpose:** Enforce the mandatory citation chains of [AI-SDOM-ARC-0001 (Section 7.5)].
- **Requirement:** A STD SHALL cite an authorizing GOV; a PRC SHALL cite the STD it implements; a TPL SHALL cite the class it templates; a REG SHALL cite the document whose records it holds; an ADR SHALL cite its motivating and affected documents; a QLT SHALL cite the documents it validates [Section 7.4].
- **Failure condition:** A missing mandatory citation for the document's class.
- **Severity:** Major.

**CRR-15 — Acyclicity.**
- **Purpose:** Prevent dependency cycles.
- **Requirement:** The transitive closure of document references SHALL contain no cycle [AI-SDOM-ARC-0001 (Section 7.4)] [Section 7.5].
- **Failure condition:** A direct or transitive reference cycle.
- **Severity:** Critical.

**CRR-16 — Forward Reference Restriction.**
- **Purpose:** Limit forward references to the classes permitted by [AI-SDOM-ARC-0001 (Section 8.3)].
- **Requirement:** A forward reference SHALL appear only in an ARC or ADR document [Section 8.1].
- **Failure condition:** A forward reference in a class other than ARC or ADR.
- **Severity:** Critical.

**CRR-17 — Forward Reference Notation and Reservation.**
- **Purpose:** Ensure forward references are annotatable and resolvable later.
- **Requirement:** A forward reference SHALL be annotated `[FORWARD]` immediately before the placeholder canonical identifier, and the placeholder SHALL be an unreserved identifier from the reserved range [Section 8.2-8.3].
- **Failure condition:** A forward reference without the `[FORWARD]` annotation, or using an already-assigned or out-of-range identifier.
- **Severity:** Major.

**CRR-18 — External Reference Canonical Form.**
- **Purpose:** Ensure external references are declared and cited canonically.
- **Requirement:** An external reference SHALL be cited as `[LABEL]` and SHALL have a corresponding record in the References section; raw inline URLs SHALL NOT appear in body text [Section 9.2-9.3].
- **Failure condition:** An inline URL in body text, an external citation without a record, or a label not declared in the References section.
- **Severity:** Major.

**CRR-19 — External Reference Validity and Version Pinning.**
- **Purpose:** Ensure external targets exist and are pinned to a specific version.
- **Requirement:** Each external record SHALL identify a resolvable target and SHALL pin the specific version, edition, or access date [Section 9.4-9.5].
- **Failure condition:** An unpinned, unresolvable, or unverifiable external target.
- **Severity:** Major.

**CRR-20 — Lifecycle State Compliance.**
- **Purpose:** Ensure references track the lifecycle of their targets.
- **Requirement:** New content SHALL NOT introduce references to Deprecated, Superseded, or Retired targets; existing references SHALL be re-pointed or annotated during the transition period, and SHALL NOT reference Retired targets [Section 10.4-10.6].
- **Failure condition:** A new reference to a Deprecated, Superseded, or Retired target, or an existing reference to a Retired target not corrected.
- **Severity:** Critical.

---

## 12. Machine Readability

12.1 **Canonical YAML representation.** The canonical machine-readable representation of a reference is the reference object. Each in-text reference corresponds to exactly one reference object. Reference objects are serialized as YAML per the syntax rules of [AI-SDOM-STD-0002 (Section 7.2)]:

```yaml
# canonical reference object (machine-readable form of an in-text reference)
- type: internal-document      # one of the reference types [Section 4]
  target: AI-SDOM-ARC-0001     # citation-form identifier [Section 5.1]
  section: "8"                 # optional; section path without the "Section " prefix
  appendix: null               # optional; appendix letter without the "Appendix " prefix
  label: null                  # external reference label [Section 9.3]
  status: active               # reference lifecycle state [Section 10]
  note: null                   # optional free text
```

12.2 **Reference object schema.** The fields of a reference object are defined by the following schema. The schema is derived from [Section 4] and [Section 5] and adds no normative content:

| Key | Data Type | Requiredness | Value Grammar |
|-----|-----------|--------------|---------------|
| `type` | enum | SHALL | One of the nine reference types [Section 4]: `internal-section`, `internal-document`, `cross-class`, `cross-layer`, `external`, `repository`, `future`, `deprecated`, `superseded` |
| `target` | identifier | Conditional — SHALL for document, cross-class, cross-layer, future, deprecated, and superseded references | Citation-form identifier [Section 5.1] |
| `section` | string | MAY | Section path per [Section 5.4], without the `Section ` prefix |
| `appendix` | string | MAY | Appendix letter per [Section 5.5], without the `Appendix ` prefix |
| `label` | string | Conditional — SHALL for external references | External label per [Section 9.3] |
| `status` | enum | SHALL | Reference lifecycle state [Section 10]: `draft`, `active`, `deprecated`, `superseded`, `retired` |
| `note` | string | MAY | Free text |

12.3 **Relationship to the metadata model.** The `dependencies` metadata field remains defined by [AI-SDOM-STD-0002 (Section 3.2, Section 7)]; this standard does not redefine it. A document that carries a structured reference record in its front matter SHALL express it as an extension field per [AI-SDOM-STD-0002 (Section 8)] (the `x-` prefix) or as document content, and SHALL document the extension in its Self-Audit Log per the extension-field validation rules of [AI-SDOM-STD-0002 (Section 6.3)]. The reference object [Section 12.1] is the canonical internal representation used by tooling and parsers.

12.4 **Parser expectations.** A parser of governed documents SHALL:
- Tokenize bracketed expressions and classify each as a canonical citation [Section 5.1-5.5], an external citation label [Section 5.8], a forward reference [Section 8.2], or a bracketed listing-form record [Section 5.6].
- Resolve canonical document citations against the Repository Register in 05-REGISTERS.
- Resolve internal section and appendix references against the host document's structure.
- Classify each parsed reference and serialize it as a reference object [Section 12.1].
- Reject with a classified error: `unresolvable`, `ambiguous`, `non-canonical`, or `malformed` [Section 6].
- SHALL NOT treat listing-form records in Dependencies fields, References tables, or registers as citations [Section 5.6, Section 6.1].
- SHALL NOT modify references to governed documents; corrections SHALL follow the change governance of [AI-SDOM-GOV-0001 (Section 8)] and [AI-SDOM-GOV-0002].

---

## 13. Examples

The following examples are non-normative. They illustrate the canonical forms of [Section 5] and the rules of [Section 6].

### 13.1 Correct examples

```text
[AI-SDOM-ARC-0001]                                      canonical citation of a governed document
[AI-SDOM-STD-0002 (Section 7)]                          canonical citation of a section
[AI-SDOM-ARC-0001 (Appendix A)]                         canonical citation of an appendix
[Section 7]                                             internal reference to a top-level section
[Section 7.2]                                           internal reference to a subsection
[Appendix A]                                            internal reference to an appendix
[RFC 2119]                                              external citation declared in the References section
[FORWARD] [AI-SDOM-ADR-0042]                            forward reference in an ARC or ADR document
Document Development Procedure (03-PROCEDURES)          descriptive reference to a higher-layer target
```

### 13.2 Incorrect examples

```text
AI-SDOM-ARC-0001                                        bare identifier without brackets [CRR-01]
ARC-0001                                                abbreviated class code [CRR-01]
[ARC-0001 §8]                                           section-sign notation [CRR-01, CRR-02]
[AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT]                listing form used as a body citation [CRR-01]
[Section A]                                             lettered section token; sections are numeric [CRR-02]
[Appendix a]                                            lowercase appendix letter [CRR-03]
[AI-SDOM-CLASS-NNNN (8.1)]                              missing "Section" token [CRR-04]
https://example.com/spec                                raw inline URL in body text [CRR-18]
[ISO 8601]                                              unpinned standard without edition year [CRR-19]
[FORWARD] [AI-SDOM-STD-0003] in an STD                  forward reference in a prohibited class [CRR-16]
[AI-SDOM-QLT-0001] in a layered document                canonical citation of a cross-cutting document [CRR-12]
```

### 13.3 Edge cases

- **Same-class reference.** A reference from one STD to another STD (for example, STD-0003 referencing STD-0002) is an internal document reference at the same layer. It SHALL be listed in the `dependencies` field [Section 6.7].
- **Self-reference.** A document SHALL reference its own identifier only in its front matter [AI-SDOM-STD-0001 (Section 4.5)]. Internal content references to one's own sections use the internal forms [Section 5.4].
- **Descriptive higher-layer targets.** A Layer-2 STD referencing the Master Document Template (Layer 4) or the Document Development Procedure (Layer 3) SHALL use a descriptive title, never a canonical citation [Section 7.2, CRR-11].
- **Cross-cutting targets.** A Layer-2 STD referencing the Architecture Validation Standard SHALL use its descriptive title; the QLT identifier may appear in prose but not in a bracketed citation [Section 7.3, CRR-12].
- **Deprecated target during transition.** During a target's transition period [AI-SDOM-ARC-0001 (Section 20.2)], existing references remain valid but new references to the Deprecated target are prohibited [Section 10.4, CRR-20].
- **Superseded ADR.** A reference to an ADR whose Status is `Superseded` SHALL be re-pointed to the superseding ADR or annotated [Section 10.5, CRR-20].
- **Section versus appendix namespace.** A document containing both a section and an appendix referenced as `[Section 1]` and `[Appendix A]` has no ambiguity; the namespaces are disjoint [Section 6.6, CRR-10].
- **Dependencies of cross-cutting references.** A layered document that references a QLT document descriptively SHALL NOT list that QLT document in its `dependencies` field [Section 6.7, CRR-13].

---

## 14. Relationship to Other Standards

14.1 This standard is the canonical specification of reference rules. Its relationship to the standards that define related scope is:

| Document | Relationship |
|----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Constitutional authority. Dependency rules (§7), cross-reference syntax (§8), identifier scheme (§5), reserved ranges (§12), lifecycle states (§20). This standard specifies and operationalizes those rules without contradicting them. |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Amendment and change governance (§8), exception governance (§9), and governance records (§11) apply to corrections of references and to exceptions to this standard. |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Structural authority. Cross-reference conventions (§7), mandatory sections (§8), Self-Audit Log (§8.4), and normative language (§2). This standard is the canonical specification of the conventions declared in STD-0001 §7. |
| [AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD] | Metadata authority. The `dependencies` field (§3.2), front-matter representation (§7), extension fields (§8), and metadata validation (MVR-10 through MVR-15). This standard governs the references inside metadata values; STD-0002 governs the metadata fields themselves. |
| Architecture Validation Standard (07-QUALITY) | Validation authority. The cross-reference integrity gate (G05) enforces reference resolution and canonical syntax; the layer gate (G01) enforces dependency direction. Referenced descriptively per the layer rules of [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Certification Standard (07-QUALITY) | Certification authority. Certification levels and criteria (§4, §5) reference validation outcomes; unresolved reference defects constrain the attainable level. Referenced descriptively per the layer rules of [AI-SDOM-ARC-0001 (Section 7.1)]. |

14.2 **Division of authority.**
- [AI-SDOM-ARC-0001] defines whether a reference is permitted (dependency direction, forward-reference scope, cycle prohibition).
- This standard defines how a reference is formed, classified, resolved, represented, and managed through its lifecycle.
- [AI-SDOM-STD-0001] defines the structural requirement that references use canonical syntax and that dependencies be listed.
- [AI-SDOM-STD-0002] defines the metadata fields that carry references and their machine-readable representation.
- The Architecture Validation Standard and the Repository Certification Standard define the gates and criteria that validate reference conformance and certification consequences.

14.3 This standard does not duplicate the content of any document listed above. Where a rule already exists in a lower-layer document, this standard references it rather than reproducing it [Section 3.6].

---

## 15. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Constitutional source. Dependency rules (§7), cross-reference rules (§8), identifier scheme (§5), naming conventions (§11), reserved ranges (§12), AI assistance (§14), quality gates (§18), automation boundaries (§19), lifecycle states (§20). |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Amendment governance (§8), exception governance (§9), and governance records (§11) that apply to reference corrections and exceptions. |
| [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY] | Change governance. Change categories (§4) and traceability (§7) that apply when a reference or its target is changed. |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Structural authority. Cross-reference conventions (§7), mandatory sections (§8), Self-Audit Log (§8.4), and normative language (§2). |
| [AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD] | Metadata authority. `dependencies` field (§3.2), machine-readable representation (§7), and extension fields (§8). |
| Document Development Procedure (03-PROCEDURES) | Operational lifecycle that executes self-audit and validation of references. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (05-REGISTERS) | Identifier authority and document inventory used to resolve document citations. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard (07-QUALITY) | Source of the validation gates (G01, G05) that enforce the rules in [Section 11]. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.2)]. |
| Repository Certification Standard (07-QUALITY) | Source of the certification criteria that reference-conformance outcomes affect. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.2)]. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-08-01 | —      | Initial cross-reference standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-STD-0001], [AI-SDOM-STD-0002], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure reference specification. §1.3 excludes procedures, governance, architecture, metadata, and quality-gate content. |
| §2.2 | Traceability | PASS | Every normative section cites the authorizing provision in ARC-0001, GOV-0001, STD-0001, or STD-0002. |
| §2.4 | Parsimony | PASS | Cross-reference syntax (§5) is specified as the canonical implementation of ARC-0001 §8 and STD-0001 §7, referenced not reproduced. See Self-Audit Log items 1, 2, and 6. |
| §2.6 | Explicitness | PASS | All syntax, resolution, lifecycle, and validation rules written explicitly. |
| §4 | Valid class code STD | PASS | Identifier: AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD. |
| §5.1 | Identifier format | PASS | AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD. |
| §5.4 | Filename mirror | PASS | ai-sdom-std-0003-cross-reference-standard.md. |
| §6.1 | Directory match | PASS | 02-STANDARDS/ maps to the STD class. |
| §7.1 | Layer N references 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), STD (L2). All ≤ 2. Higher-layer and cross-cutting documents referenced descriptively. |
| §7.3 | Dependencies section | PASS | Present as the front-matter `dependencies` list per established repository precedent. |
| §7.5 | STD cites authorizing GOV | PASS | GOV-0001 listed in Dependencies and §1.3. |
| §8 | Cross-reference syntax | PASS | All formal references use `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]` canonical form. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-std-0003-cross-reference-standard.md. |
| §12 | Reserved range | PASS | STD-0003 falls in STD 0001-0099 (universal standards). |
| §14.2 | ai-assistance field | PASS | `ai-assistance` recorded in the front matter. |
| §18 | Quality gate requirements | PASS | §11.2 references the mandatory gates without redefining their pass/fail criteria. |
| §20.2 | Lifecycle state | PASS | `lifecycle-state: Active`. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Constitutional Supremacy | PASS | §2.4 acknowledges supremacy of ARC-0001. |
| §2.3 | Separation of Concerns | PASS | §1.3 excludes procedures, templates, validation gates, and register content. |
| §8 | Amendment governance referenced | PASS | §10.8 references GOV-0001 §8 for reference corrections. |
| §9 | Exception governance referenced | PASS | §14.1 and the CRR framework defer exceptions to GOV-0001 §9; no granting authority is defined here. |

### STD-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2 | Normative language | PASS | SHALL/SHOULD/MAY used consistently; severity scale in §11.1 does not redefine normative keywords. |
| §7 | Cross-reference conventions | PASS | §5 is the canonical specification of the forms declared in STD-0001 §7. |
| §8 | Mandatory sections | PASS | Front matter, title, Purpose, body sections, References, Amendment Record, and Self-Audit Log all present. |
| §8.4 | Self-Audit Log | PASS | Present, with issues and resolutions recorded. |

### STD-0002 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §3 | Field registry | PASS | Uses the canonical YAML representation; the `dependencies` field is referenced, not redefined (§12.3). |
| §7 | Machine-readable representation | PASS | Front matter conforms to the canonical YAML form. |
| §8 | Extensibility | PASS | Structured reference records are scoped to `x-` extension fields or document content (§12.3). |
| MVR-10 | No unknown unprefixed keys | PASS | Only registered fields appear in the front matter. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), STD (L2). All ≤ 2. |
| G01-R6 | No circular dependencies | PASS | STD-0003 → GOV-0002 → GOV-0001 → ARC-0001; STD-0003 → STD-0002 → STD-0001 → GOV-0001 → ARC-0001. ARC has no dependencies. No cycle. |
| G01-R7 | STD must cite authorizing GOV | PASS | GOV-0001 listed in Dependencies. |
| G01-R8 | Dependencies section exists | PASS | Front-matter `dependencies` present with a list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | STD is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: STD. |
| G02-R3 | Layer matches LAYER_MAP | PASS | Layer 2. Front matter: `layer: 2`. |
| G02-R4 | Single concern | PASS | Reference specification only — no validation-gate, governance, procedure, or template content. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD. |
| G03-R2 | Filename mirror | PASS | ai-sdom-std-0003-cross-reference-standard.md. |
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
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]`, `[AI-SDOM-GOV-0001]`, `[AI-SDOM-GOV-0002]`, `[AI-SDOM-STD-0001]`, and `[AI-SDOM-STD-0002]` references resolve. |
| G05-R2 | No unauthorized forward references | PASS | No `[FORWARD]` annotations used. |
| G05-R3 | Internal section references | PASS | All `[Section X.Y]` references verified against the section structure. |
| G05-R4 | Cross-class reference compliance | PASS | Formal references limited to layers 0-2 per [AI-SDOM-ARC-0001 (Section 7.1)]; higher-layer and cross-cutting documents referenced descriptively. |
| G05-R5 | Canonical syntax | PASS | All formal external references use canonical form. |

**G06 — Semantic Versioning Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G06-R1 | Version field present | PASS | `version: 0.1.0`. |
| G06-R2 | SemVer format | PASS | 0.1.0 matches `\d+\.\d+\.\d+`. |
| G06-R3 | Version increment direction | PASS | Initial version; no prior revision to compare. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | STD 0003 is within STD 0001-0099 (universal standards). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is STD, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001, GOV-0001, STD-0001, and STD-0002. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing provision. |
| G09-R3 | No duplication | PASS | Reference syntax and dependency rules referenced to ARC-0001 §7/§8 and STD-0001 §7, not reproduced. See Self-Audit Log items 1 and 6. |
| G09-R4 | Composability | PASS | Reference model composes cleanly with the `dependencies` field in STD-0002 §3 and the dependency rules in ARC-0001 §7. |
| G09-R5 | Explicitness | PASS | All syntax, resolution, lifecycle, and validation rules written explicitly. |
| G09-R6 | Governance boundary respect | PASS | No governance roles, approval processes, or decision rights defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R1 | No unauthorized identifier assignment | PASS | Identifier AI-SDOM-STD-0003 drawn from the register's next-available table (STD 0003). |
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Duplication boundary with ARC-0001 (Sections 5, 7):** [AI-SDOM-ARC-0001 (Section 8)] already defines the base cross-reference syntax and [AI-SDOM-ARC-0001 (Section 7)] defines dependency rules. Reproducing them as original content would duplicate constitutional content. Resolved by defining this standard as the canonical specification that implements those rules — adding the citation-form/listing-form distinction (§5.6), internal top-level and nested forms (§5.4), and the acceptable/prohibited reference matrix (§7.2) — while attributing each rule's authority to ARC-0001 §7/§8 and stating in §3.6 and §14.3 that ARC-0001 is referenced, not reproduced.

2. **Reference-form vs. listing-form identifier (Section 5.6):** Existing documents use both `[AI-SDOM-ARC-0001 (Section 8)]` (citation) in body text and `[AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT]` (full identifier) in Dependencies fields and References tables. This standard codifies the distinction, defining the citation form [Section 5.1] and the listing form [Section 5.6] and clarifying that bracketed listing forms are records, not citations [Section 6.1], so the existing practice remains valid.

3. **QLT reference constraint (Sections 14, 15):** The required relationship to the Architecture Validation Standard and the Repository Certification Standard conflicts with the adopted interpretation of [AI-SDOM-ARC-0001 (Section 7.1)], under which a layered document SHALL NOT reference a cross-cutting document by canonical identifier. Resolved by referencing both QLT documents by descriptive title only, in §14, §15, and the CRR enforcement note (§11.2), consistent with the precedent established in the STD-0001, STD-0002, GOV-0001, and REG-0001 self-audits.

4. **Severity scale (Section 11.1):** No governed document defines a severity scale for reference defects. The four-level scale (Critical, Major, Minor, Informational) is new and is defined within this standard's remit as a validation classification, distinct from governance. Its Critical/Major consequences reference QLT-0002 certification levels and ARC-0001 §18.3 rather than defining approval or release authority.

5. **Reference lifecycle vs. document lifecycle (Section 10):** The reference lifecycle states (Draft, Active, Deprecated, Superseded, Retired) are a property of reference instances, not documents. The task prescribed these five states; the document lifecycle in [AI-SDOM-ARC-0001 (Section 20.2)] has only Active/Deprecated/Retired. Resolved by explicitly distinguishing the two concepts in §10.8 and deriving the reference lifecycle from the target's document lifecycle where applicable (§10.7), avoiding contradiction.

6. **Validation-rule overlap with the Architecture Validation Standard (Section 11):** The Architecture Validation Standard (G01, G05) defines gate pass/fail criteria for layer and reference conformance. This standard's CRR-01 through CRR-20 are the reference rules that gates and tooling validate against, not a reproduction of gate definitions. Resolved by stating the boundary in §11.2 and by keeping CRR rules scoped to reference-specific requirements not defined elsewhere.

7. **Metadata duplication risk (Section 12.3):** The `dependencies` field and front-matter representation are defined by [AI-SDOM-STD-0002]. Resolved by referencing STD-0002 §3.2, §7, and §8 for the metadata model and defining only the reference object — the representation of a single reference instance — which no existing document defines.

8. **Repository reference scope (Section 4.6):** The nine prescribed reference types include a "repository reference." Interpreted as a reference to a non-document repository artifact (directory, script, `.ai` file, infrastructure file) per [AI-SDOM-ARC-0001 (Section 6)], because references to governed documents are already covered by the internal document reference type. Defined accordingly with descriptive path notation.

9. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter `dependencies` field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.

10. **Internal reference verification:** Every `[Section X.Y]` and `[Section N]` reference in this document was verified against the actual section structure during self-audit. Section numbering was checked against the mandatory-sections requirement [AI-SDOM-STD-0001 (Section 8.1)].

11. **Change-governance dependency (Section 10.8):** The requirement that reference corrections follow change governance referenced [AI-SDOM-GOV-0002] (the Change Management Policy). GOV-0002 is a Layer-1 document, within the STD Layer-2 reference bound, so a canonical reference is permitted. To satisfy this standard's own dependency-completeness rule (CRR-13), GOV-0002 was added to the Dependencies field and to the References table, ensuring every canonical reference is reflected in the metadata record.
