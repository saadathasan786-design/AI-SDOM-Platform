---
identifier: AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD
title: Document Metadata Standard
version: 0.1.0
lifecycle-state: Active
layer: 2
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY
  - AI-SDOM-STD-0001-DOCUMENTATION-STANDARD
tags:
  - metadata
  - standards
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-07-31: initial draft"
---

# Document Metadata Standard

## 1. Purpose and Scope

1.1 This standard is the canonical metadata specification for every governed document in the AI-SDOM repository. It defines the complete metadata field registry, field naming conventions, data types, validation rules, the machine-readable representation of document metadata, and the rules for extending the metadata model. It is the single source of truth for what metadata every governed document SHALL, MAY, and SHALL NOT carry, across all eight document classes defined in [AI-SDOM-ARC-0001 (Section 4)].

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 7.5)], which requires a Standard (STD) to cite the Governance (GOV) document that authorizes it, and operates within the governance framework established by [AI-SDOM-GOV-0001]. It is the canonical specification of the metadata fields whose structural requiredness is declared in [AI-SDOM-STD-0001 (Section 3)]. Where this standard and [AI-SDOM-STD-0001] describe the same field, this standard defines the field's specification (key, type, value grammar, validation, and representation) and [AI-SDOM-STD-0001 (Section 3)] remains the authority for the field's structural presence in the front matter.

1.3 This standard applies to:
- Every governed document currently in the repository.
- Every governed document created in the future.
- Amendments to existing governed documents.
- Any machine-readable tooling, automation, or AI agent that reads or writes governed document metadata [AI-SDOM-ARC-0001 (Section 14, Section 19)].

1.4 The term *metadata record* denotes the set of fields carried in a document's front matter. The term *field registry* denotes the authoritative catalog defined in [Section 3]. The *effective date* of this standard is the date of its ratification.

1.5 This standard defines document metadata only. It SHALL NOT define:
- Visual formatting, layout, or typography of the front matter or the document body (governed by TPL documents in 04-TEMPLATES).
- Step-by-step procedures for authoring or validating metadata (governed by PRC documents in 03-PROCEDURES).
- Quality gates or pass/fail criteria that enforce conformance (governed by QLT documents in 07-QUALITY).
- Identifier allocation, reserved ranges, or the document inventory (governed by the Repository Register in 05-REGISTERS and [AI-SDOM-ARC-0001 (Section 5, Section 12)]).

1.6 Where a provision of this standard conflicts with [AI-SDOM-ARC-0001], the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

---

## 2. Normative Language and Terminology

2.1 The key words SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and NEED NOT in this standard SHALL be interpreted as defined in [AI-SDOM-STD-0001 (Section 2)]. Those definitions are authoritative and are not reproduced here.

2.2 For the purposes of this standard:
- **Field** — a named item of metadata carried in a document's front matter.
- **Key** — the machine-readable name of a field (for example, `identifier`).
- **Value** — the data carried by a field.
- **Requiredness** — the obligation status of a field, one of `SHALL`, `SHALL NOT`, `MAY`, or `Conditional`.
- **Metadata record** — the complete set of fields and values in a document's front matter.
- **Field registry** — the authoritative catalog in [Section 3].
- **Front matter** — the block at the top of a governed document that carries the metadata record, delimited per [AI-SDOM-STD-0001 (Section 3.1)].

---

## 3. Metadata Field Registry

3.1 The field registry is the authoritative catalog of all metadata fields. A field is defined by its key, its data type [Section 5], its requiredness, its value grammar, and its validation rules [Section 6]. No governed document SHALL introduce a field that is not recorded in this registry unless the field complies with the extension rules in [Section 8].

3.2 **Core fields.** The following fields are the canonical metadata fields for all governed documents. Their structural presence is declared in [AI-SDOM-STD-0001 (Section 3.2)]; their specification is defined here.

| Key | Field | Data Type | Requiredness | Value Grammar | Authoritative Source |
|------|-------|-----------|--------------|---------------|---------------------|
| `identifier` | Identifier | identifier | SHALL — all classes | Canonical scheme per [AI-SDOM-ARC-0001 (Section 5.1)] | [AI-SDOM-ARC-0001 (Section 5.1)]; [AI-SDOM-STD-0001 (Section 3.2)] |
| `version` | Version | semver | SHALL — all classes except ADR; SHALL NOT — ADR | `MAJOR.MINOR.PATCH` per [AI-SDOM-ARC-0001 (Section 9)] | [AI-SDOM-ARC-0001 (Section 9)]; [AI-SDOM-STD-0001 (Section 3.2)] |
| `lifecycle-state` | Lifecycle State | enum | SHALL — all classes except ADR; SHALL NOT — ADR | One of `Active`, `Deprecated`, `Retired` | [AI-SDOM-ARC-0001 (Section 20.2)]; [AI-SDOM-STD-0001 (Section 3.2)] |
| `status` | Status | enum | SHALL — ADR only; SHALL NOT — all other classes | One of `Proposed`, `Accepted`, `Superseded` | [AI-SDOM-ARC-0001 (Section 17.2)]; [AI-SDOM-STD-0001 (Section 3.2)] |
| `layer` | Layer | integer-or-x | SHALL — all classes | Numeric layer 0-5, or `X` for cross-cutting classes | [AI-SDOM-ARC-0001 (Section 3, Section 4)]; [AI-SDOM-STD-0001 (Section 3.2)] |
| `dependencies` | Dependencies | list of identifier | SHALL — all classes | List of canonical document identifiers; empty expressed as `None` | [AI-SDOM-ARC-0001 (Section 7.3)]; [AI-SDOM-STD-0001 (Section 3.2)] |
| `ai-assistance` | AI Assistance | string | Conditional — SHALL when AI assistance was used per [AI-SDOM-ARC-0001 (Section 14.2)]; MAY otherwise | Free text recording the AI tool and the extent of assistance | [AI-SDOM-ARC-0001 (Section 14.2)]; [AI-SDOM-STD-0001 (Section 3.2)] |

3.2.1 The `ai-assistance` field reconciles the MAY declaration in [AI-SDOM-STD-0001 (Section 3.2)] with the mandatory requirement in [AI-SDOM-ARC-0001 (Section 14.2)]: the field is required precisely when AI assistance was used, and optional otherwise. Its requiredness is therefore Conditional.

3.3 **Canonical optional fields.** The following optional fields are standardized by this standard for use across all document classes. They extend the registry permitted by [AI-SDOM-STD-0001 (Section 3.5)].

| Key | Field | Data Type | Applicability | Value Grammar | Authoritative Source |
|------|--------|-----------|---------------|---------------|---------------------|
| `title` | Document Title | string | All classes | The document's full title; when present SHALL match the `#` title heading | This standard |
| `owner` | Document Owner | string | All classes | The Document Owner role or holder per [AI-SDOM-GOV-0001 (Section 3.4)] | This standard |
| `tags` | Tags | list of slug | All classes | Lowercase kebab-case slugs; SHALL be unique within the list | This standard |
| `created` | Created Date | date | All classes | ISO 8601 `YYYY-MM-DD` | This standard |
| `supersedes` | Supersedes | identifier | Non-ADR classes in the `Deprecated` lifecycle state | Identifier of the document that supersedes this one | This standard |

3.4 **Extension fields.** Extension fields are unregistered fields permitted under the rules in [Section 8]. They SHALL use the reserved `x-` key prefix.

| Key | Field | Data Type | Applicability | Value Grammar | Authoritative Source |
|------|-------|-----------|---------------|---------------|---------------------|
| `x-{name}` | Extension field | any | All classes | Key SHALL use the `x-` prefix and SHALL conform to the key naming rules in [Section 4] | This standard |

3.5 **Per-class applicability matrix.** The following matrix is the normative statement of each field's requiredness per class. `SHALL` = mandatory; `SHALL NOT` = prohibited; `Cond` = Conditional (SHALL when AI assistance was used); `MAY` = optional; `—` = not applicable.

| Field | ARC | GOV | STD | PRC | TPL | REG | ADR | QLT |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|
| `identifier` | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL |
| `version` | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL NOT | SHALL |
| `lifecycle-state` | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL NOT | SHALL |
| `status` | — | — | — | — | — | — | SHALL | — |
| `layer` | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL |
| `dependencies` | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL | SHALL |
| `ai-assistance` | Cond | Cond | Cond | Cond | Cond | Cond | Cond | Cond |
| `title` | MAY | MAY | MAY | MAY | MAY | MAY | MAY | MAY |
| `owner` | MAY | MAY | MAY | MAY | MAY | MAY | MAY | MAY |
| `tags` | MAY | MAY | MAY | MAY | MAY | MAY | MAY | MAY |
| `created` | MAY | MAY | MAY | MAY | MAY | MAY | MAY | MAY |
| `supersedes` | MAY | MAY | MAY | MAY | MAY | MAY | — | MAY |

3.5.1 The `layer` value SHALL be `X` for the cross-cutting classes ADR and QLT, and SHALL match the LAYER_MAP assignment for the layered classes [AI-SDOM-ARC-0001 (Section 3, Section 4)].

3.6 **Field order.** The metadata record SHOULD list fields in the registry order above: core fields first, then canonical optional fields, then extension fields. Field order is a SHOULD; order does not affect validity.

---

## 4. Field Naming Conventions

4.1 **Key naming.** Every metadata key SHALL be lowercase kebab-case, conforming to the regex `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`. A key SHALL NOT begin or end with a hyphen, SHALL NOT contain consecutive hyphens, and SHALL NOT contain underscores, spaces, or uppercase characters. This aligns key naming with the naming conventions in [AI-SDOM-ARC-0001 (Section 11)].

4.2 **Reserved prefixes.** The prefix `x-` is reserved for extension fields [Section 8]. No standard field SHALL use the `x-` prefix. No extension field SHALL use any prefix other than `x-`.

4.3 **Value naming.** Value casing is defined per data type [Section 5]:
- Enum values SHALL use the exact casing defined in [Section 3.2] (for example, `Active`, `Deprecated`, `Retired`).
- Class codes in identifiers SHALL be uppercase per [AI-SDOM-ARC-0001 (Section 5.1)].
- Slugs (tags, extension names) SHALL be lowercase kebab-case.
- Dates SHALL use ISO 8601 `YYYY-MM-DD`.

4.4 **Legacy label mapping.** Documents created before the effective date of this standard used a label rendering (`**Field:** value`) for the metadata record. Each legacy label maps to exactly one registry key:

| Legacy Label | Registry Key |
|--------------|--------------|
| `**Identifier:**` | `identifier` |
| `**Version:**` | `version` |
| `**Lifecycle State:**` | `lifecycle-state` |
| `**Status:**` | `status` |
| `**Layer:**` | `layer` |
| `**Dependencies:**` | `dependencies` |
| `**ai-assistance:**` | `ai-assistance` |

4.5 The legacy label mapping exists for interpretation and migration [Section 7.5] only. It does not authorize new documents to use the label rendering.

---

## 5. Data Types

5.1 The following data types are defined for metadata values. Every field in the registry SHALL use one of these types.

| Type | Meaning | Value Grammar | Example |
|------|---------|---------------|---------|
| `string` | Free-form text | Any printable text | `Repository Governance Policy` |
| `slug` | Kebab-case label | `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$` | `document-metadata-standard` |
| `identifier` | Canonical AI-SDOM identifier | Per [AI-SDOM-ARC-0001 (Section 5.1)] | `AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD` |
| `semver` | Semantic Version 2.0.0 | `MAJOR.MINOR.PATCH` per [AI-SDOM-ARC-0001 (Section 9.1)] | `0.1.0` |
| `enum` | One of a defined set of values | The allowed values defined for the field in [Section 3] | `Active` |
| `int` | Integer | Signed or unsigned integer | `2` |
| `integer-or-x` | Integer or the cross-cutting marker | `0` through `5`, or `X` | `X` |
| `list` | Ordered collection | `list of {type}` — a sequence of values of one element type | — |
| `list of identifier` | Ordered collection of identifiers | Each element SHALL be a valid `identifier` | — |
| `list of slug` | Ordered collection of slugs | Each element SHALL be a valid `slug` | — |
| `date` | Calendar date | ISO 8601 `YYYY-MM-DD` | `2026-07-31` |
| `bool` | Boolean | `true` or `false` | `true` |
| `any` | Any type | No constraint | — |

5.2 A field SHALL carry a value of its declared type. A value of a different type is a defect. Type conformance is validated per [Section 6].

---

## 6. Validation Rules

6.1 Validation of the core fields is defined in [AI-SDOM-ARC-0001] and enforced by the mandatory quality gates described in [AI-SDOM-ARC-0001 (Section 18.3, Section 18.4)] and defined in the Architecture Validation Standard. Those rules are authoritative and are not reproduced here. This section states the metadata validation requirements of this standard and references the authority for each.

6.2 **Core field validation.**

| Rule | Requirement | Authority | Enforcement |
|------|-------------|-----------|-------------|
| MVR-01 | The `identifier` value SHALL conform to the canonical identifier scheme. | [AI-SDOM-ARC-0001 (Section 5.1)] | Architecture Validation Standard (identifier and naming gates) |
| MVR-02 | The filename SHALL match the lowercased `identifier`. | [AI-SDOM-ARC-0001 (Section 5.4)] | Architecture Validation Standard (naming gate) |
| MVR-03 | `version` SHALL be present for all classes except ADR and SHALL NOT be present for ADR. | [AI-SDOM-ARC-0001 (Section 9.6)]; [AI-SDOM-STD-0001 (Section 3.2)] | Architecture Validation Standard (versioning gate) |
| MVR-04 | `version` SHALL conform to Semantic Versioning and SHALL increment consistently with the declared change type. | [AI-SDOM-ARC-0001 (Section 9.2-9.4)] | Architecture Validation Standard (versioning gate) |
| MVR-05 | `lifecycle-state` SHALL be one of `Active`, `Deprecated`, `Retired`, SHALL be present for all classes except ADR, and SHALL NOT be present for ADR. | [AI-SDOM-ARC-0001 (Section 20.2)]; [AI-SDOM-STD-0001 (Section 5)] | Architecture Validation Standard |
| MVR-06 | `status` SHALL be one of `Proposed`, `Accepted`, `Superseded`, SHALL be present for ADR only, and SHALL NOT be present for any other class. | [AI-SDOM-ARC-0001 (Section 17.2)] | Architecture Validation Standard |
| MVR-07 | `layer` SHALL be a valid numeric layer or `X` for cross-cutting classes, and SHALL match the class taxonomy. | [AI-SDOM-ARC-0001 (Section 3, Section 4)] | Architecture Validation Standard (layer gate) |
| MVR-08 | `dependencies` SHALL list only canonical identifiers that resolve to existing documents, SHALL satisfy the dependency rules, SHALL NOT form cycles, and SHALL read `None` when empty. | [AI-SDOM-ARC-0001 (Section 7)] | Architecture Validation Standard (reference and dependency gates) |
| MVR-09 | `ai-assistance` SHALL be present when AI assistance was used per [AI-SDOM-ARC-0001 (Section 14.2)]. | [AI-SDOM-ARC-0001 (Section 14.2)] | Architecture Validation Standard (automation gate) |

6.3 **Metadata-specific validation.** The following rules are specific to this standard. They validate aspects of the metadata model that no other governed document defines.

| Rule | Requirement | Authority | Enforcement |
|------|-------------|-----------|-------------|
| MVR-10 | A metadata record SHALL NOT contain a key that is not recorded in the registry [Section 3] and does not use the `x-` prefix. An unknown unprefixed key is a defect. | This standard, [Section 3, Section 8] | Self-audit per the Document Development Procedure; automated validation as tooling is established |
| MVR-11 | An extension field (`x-` prefix) SHALL conform to the key naming rules [Section 4] and SHALL be documented in the document's Self-Audit Log unless registered in this standard. | This standard, [Section 8] | Self-audit per the Document Development Procedure |
| MVR-12 | Every value SHALL conform to the data type declared for its field in the registry [Section 3, Section 5]. | This standard, [Section 3, Section 5] | Self-audit per the Document Development Procedure; automated validation as tooling is established |
| MVR-13 | The `title` value, when present, SHALL match the document's `#` title heading. | This standard, [Section 3.3] | Self-audit per the Document Development Procedure |
| MVR-14 | The `supersedes` value, when present, SHALL be a canonical identifier that resolves to an existing document, SHALL appear only in non-ADR documents in the `Deprecated` lifecycle state, and SHALL NOT equal the document's own `identifier`. | This standard, [Section 3.3] | Self-audit per the Document Development Procedure |
| MVR-15 | The `tags` values SHALL be unique within the list and SHALL each conform to the `slug` data type. | This standard, [Section 3.3, Section 5] | Self-audit per the Document Development Procedure |

6.4 Rules MVR-01 through MVR-09 SHALL be enforced by the mandatory quality gates of the Architecture Validation Standard before merge to main [AI-SDOM-ARC-0001 (Section 18)]. Rules MVR-10 through MVR-15 SHALL be verified by the author during self-audit in the Validate phase of the Document Development Procedure, and SHALL be enforced by automated validation once tooling is established in accordance with [AI-SDOM-ARC-0001 (Section 19)].

6.5 A document that fails a validation rule SHALL be corrected before publication. A deviation from a SHALL requirement requires an exception per [Section 10]. A deviation from a SHOULD requirement SHALL be justified in the document's Self-Audit Log [AI-SDOM-STD-0001 (Section 2.3)].

---

## 7. Machine-Readable Representation

7.1 **Canonical form.** The canonical machine-readable representation of a metadata record is a YAML front-matter block at the top of the governed document, delimited by a line containing exactly `---` before and after the metadata [AI-SDOM-STD-0001 (Section 3.1)]. The front-matter block SHALL appear before any other content in the file.

7.2 **Syntax rules.** The YAML front matter SHALL conform to YAML 1.2 core schema and SHALL additionally satisfy:
- Keys SHALL be registry keys [Section 3] conforming to [Section 4.1].
- Scalar values SHALL be unquoted plain scalars unless the value contains a colon-space (`: `), a leading special character, or trailing whitespace, in which case the value SHALL be double-quoted.
- List values SHALL use YAML block list syntax (one `- ` item per line) or flow list syntax (`[a, b]`).
- An empty `dependencies` list SHALL be expressed as `dependencies: []`, which is the machine-readable equivalent of `Dependencies: None.` [AI-SDOM-ARC-0001 (Section 7.3)].
- Values of type `enum` SHALL use the exact casing defined in [Section 3].

7.3 **Schema authority.** [Section 3] is the authoritative field schema: it defines each key, its data type, requiredness, and value grammar. A machine-readable schema (for example, a JSON Schema or equivalent) MAY be generated from [Section 3] and [Section 5] without adding normative content.

7.4 **Exemplar.** This document uses the canonical YAML front matter defined in this section as the exemplar of the representation. See also the non-normative examples in [Section 12].

7.5 **Legacy representation and transition.** Documents created before the effective date of this standard that use the label rendering defined in [Section 4.4] SHALL remain valid. Their metadata record SHALL be migrated to the canonical YAML representation in the same change that next amends the document's content. The migration SHALL NOT alter the logical metadata values. Documents created on or after the effective date of this standard SHALL use the canonical YAML representation.

---

## 8. Extensibility Rules

8.1 **Registry authority.** The field registry [Section 3] is the authoritative catalog of metadata fields. A new standard field SHALL be added to the registry by amending this standard.

8.2 **Version impact of registry changes.** The version impact of a registry change SHALL follow [AI-SDOM-ARC-0001 (Section 9)] and [AI-SDOM-GOV-0001 (Section 8.3)]:
- Adding an optional field is a backward-compatible addition and SHALL be a MINOR version increment.
- Changing a field's requiredness, data type, or value grammar is a breaking change and SHALL be a MAJOR version increment.
- Correcting a typo or clarifying a description without changing intent is a PATCH version increment.

8.3 **Class-specific fields.** A class-specific metadata field defined under [AI-SDOM-STD-0001 (Section 3.5)] SHALL either (a) be added to the registry by amendment of this standard, or (b) use the `x-` prefix. A class-specific field that is neither registered nor prefixed is a defect [MVR-10].

8.4 **Experimental fields.** An experimental field SHALL use the `x-` prefix and SHALL be documented in the document's Self-Audit Log. An experimental field MAY be promoted to a standard field by amendment of this standard.

8.5 **Field deprecation and removal.** Deprecating or removing a field from the registry is a breaking change [AI-SDOM-ARC-0001 (Section 9.2)] and SHALL follow the change governance in [AI-SDOM-GOV-0001 (Section 8)]. A deprecated field SHALL be marked in the registry and SHALL remain defined for the duration of any transition period required by the change governance.

8.6 **Field rename.** Renaming a field is a breaking change and SHALL be a MAJOR version increment. The rename SHALL be recorded in this standard's Amendment Record.

8.7 **Extension requirements.** Every extension SHALL:
- Not duplicate the meaning of an existing registered field.
- Conform to the key naming rules in [Section 4].
- Declare a data type from [Section 5].
- Define its value grammar and validation rule.
- Not change the requiredness of any core field.

8.8 Any extensibility decision that introduces a new field class or changes the extension mechanism SHALL be recorded in an ADR [AI-SDOM-ARC-0001 (Section 13.6)].

---

## 9. Compliance

9.1 A governed document conforms to this standard when all of the following hold:
- Every SHALL field for its class is present with a valid value [Section 3].
- No SHALL NOT field for its class is present [Section 3.5].
- Every field value conforms to its declared data type [Section 5].
- No unknown unprefixed key appears in the metadata record [MVR-10].
- All cross-field rules are satisfied [Section 6.3].
- Documents created on or after the effective date use the canonical YAML representation [Section 7.5].

9.2 Conformance SHALL be verified by the author's self-audit in the Validate phase of the Document Development Procedure, by the mandatory quality gates of the Architecture Validation Standard before merge to main [AI-SDOM-ARC-0001 (Section 18.3)], and by the certification criteria of the Repository Certification Standard.

9.3 A deviation from a SHOULD requirement SHALL be justified in the document's Self-Audit Log [AI-SDOM-STD-0001 (Section 2.3)]. A deviation from a SHALL requirement requires an exception per [Section 10].

---

## 10. Exceptions

10.1 Exceptions to this standard SHALL be granted and recorded per the exception governance in [AI-SDOM-GOV-0001 (Section 9)]. A deviation from a Standard (STD) rule is a Standard exception, granted by the STD Domain Maintainer for a maximum duration of 90 days [AI-SDOM-GOV-0001 (Section 9.2)].

10.2 Constitutional exceptions — deviations from [AI-SDOM-ARC-0001] — are not permitted; such situations require an amendment to [AI-SDOM-ARC-0001] [AI-SDOM-GOV-0001 (Section 9.5)].

10.3 An exception SHALL be recorded in an ADR per [AI-SDOM-GOV-0001 (Section 9.3)]. Upon expiry, the document SHALL be brought into conformance with this standard.

---

## 11. Rationale

11.1 The repository philosophy in [AI-SDOM-ARC-0001 (Section 1.1)] requires artifacts that are both machine-processable and human-readable. A single canonical metadata specification makes document metadata deterministic, parseable, and searchable by automation and AI agents.

11.2 A centralized registry prevents metadata fragmentation across the eight document classes and across documents, and gives the quality gates and future tooling a single source of truth to validate against.

11.3 Explicit data types and validation rules make metadata errors detectable before publication rather than after, supporting the Explicitness Principle [AI-SDOM-ARC-0001 (Section 2.6)].

11.4 Controlled extensibility ensures that new metadata needs are met without weakening the core model or silently diverging from the registry [Section 8].

11.5 The canonical YAML representation is chosen for its broad machine support and its compatibility with the front-matter requirement in [AI-SDOM-STD-0001 (Section 3.1)].

---

## 12. Examples

The following examples are non-normative. They illustrate the canonical YAML representation [Section 7]. Example identifiers are illustrative and are not assigned to any governed document.

### 12.1 Layered document

```yaml
---
identifier: AI-SDOM-STD-0011-EXAMPLE-STANDARD
title: Example Standard
version: 0.1.0
lifecycle-state: Active
layer: 2
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY
tags:
  - example
  - standards
created: 2026-07-31
---
```

### 12.2 ADR

An ADR carries `status` instead of `version` and `lifecycle-state`, and its `layer` is `X`.

```yaml
---
identifier: AI-SDOM-ADR-0042-EXAMPLE-DECISION
status: Proposed
layer: X
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
---
```

### 12.3 Extension field

```yaml
---
identifier: AI-SDOM-TPL-0002-EXAMPLE-TEMPLATE
version: 0.1.0
lifecycle-state: Active
layer: 4
dependencies: []
x-schema-version: "1.0"
---
```

---

## 13. References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Constitutional source. Identifier scheme (§5), dependency rules (§7), versioning (§9), governance boundaries (§16), quality gate architecture (§18), lifecycle states (§20), and AI assistance (§14). |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | Governance framework. Document Owner role (§3.4) and exception governance (§9). |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Structural authority. Front matter and mandatory metadata fields (§3), normative language (§2), mandatory sections (§8), and class-specific requirements (§9). |
| Master Document Template (04-TEMPLATES) | Reusable document structure providing the front-matter boilerplate. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Document Development Procedure (03-PROCEDURES) | Operational lifecycle that executes self-audit and validation of the metadata record. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (05-REGISTERS) | Identifier authority and document inventory. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard (07-QUALITY) | Source of the validation gates that enforce metadata conformance. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.2)]. |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-07-31 | —      | Initial document metadata standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-STD-0001], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure document metadata specification. §1.5 excludes governance, validation, procedure, template, and register content. |
| §2.2 | Traceability | PASS | Every normative section cites the authorizing provision in ARC-0001, GOV-0001, or STD-0001. |
| §2.4 | Parsimony | PASS | Structural metadata requiredness is referenced to STD-0001 §3, not reproduced; versioning, lifecycle, identifier, and dependency rules are referenced to ARC-0001, not restated. See Self-Audit Log items 1 and 4. |
| §2.6 | Explicitness | PASS | All field definitions, types, grammars, and validation rules written explicitly. |
| §4 | Valid class code STD | PASS | Identifier: AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD. |
| §5.1 | Identifier format | PASS | AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD. |
| §5.4 | Filename mirror | PASS | ai-sdom-std-0002-document-metadata-standard.md. |
| §6.1 | Directory match | PASS | 02-STANDARDS/ maps to the STD class. |
| §7.1 | Layer N references 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), and STD (L2). All ≤ 2. Higher-layer and cross-cutting documents referenced descriptively. |
| §7.3 | Dependencies section | PASS | Present as the front-matter `dependencies` list per established repository precedent. |
| §7.5 | STD cites authorizing GOV | PASS | GOV-0001 listed in Dependencies and §1.2. |
| §8 | Cross-reference syntax | PASS | All formal references use `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]` canonical form. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §11.2 | Filename lowercase | PASS | ai-sdom-std-0002-document-metadata-standard.md. |
| §12 | Reserved range | PASS | STD-0002 falls in STD 0001-0099 (universal standards). |
| §14.2 | ai-assistance field | PASS | `ai-assistance` recorded in the front matter. |
| §18 | Quality gate requirements | PASS | §6.4 references the mandatory gates in §18.3 without redefining them. |
| §20.2 | Lifecycle state | PASS | `lifecycle-state: Active`. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Constitutional Supremacy | PASS | §1.6 acknowledges supremacy of ARC-0001. |
| §2.3 | Separation of Concerns | PASS | §1.5 excludes procedures, templates, validation gates, and register content. |
| §3.4 | Document Owner referenced, not redefined | PASS | `owner` field (§3.3) references the role in GOV-0001 §3.4. |
| §9 | Exception governance referenced | PASS | §10 references GOV-0001 §9 for granting, recording, and expiring exceptions. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), STD (L2). All ≤ 2. |
| G01-R6 | No circular dependencies | PASS | STD-0002 → STD-0001 → GOV-0001 → ARC-0001. ARC has no dependencies. No cycle. |
| G01-R7 | STD must cite authorizing GOV | PASS | GOV-0001 listed in Dependencies. |
| G01-R8 | Dependencies section exists | PASS | Front-matter `dependencies` present with a list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | STD is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: STD. |
| G02-R3 | Layer matches LAYER_MAP | PASS | Layer 2. Front matter: `layer: 2`. |
| G02-R4 | Single concern | PASS | Document metadata specification only — no validation, governance, procedure, or template content. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD. |
| G03-R2 | Filename mirror | PASS | ai-sdom-std-0002-document-metadata-standard.md. |
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
| G05-R1 | All references resolve | PASS | All `[AI-SDOM-ARC-0001]`, `[AI-SDOM-GOV-0001]`, and `[AI-SDOM-STD-0001]` references resolve. |
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
| G06-R4 | ADR version prohibition | N/A | This document is STD, not ADR. |
| G06-R5 | QLT version inclusion | N/A | This document is STD, not QLT. |

**G07 — Reserved Range Usage**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G07-R1 | Within class range | PASS | STD 0002 is within STD 0001-0099 (universal standards). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is STD, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001, GOV-0001, and STD-0001. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing provision. |
| G09-R3 | No duplication | PASS | Core field validation and structural requiredness referenced to STD-0001 §3 and ARC-0001, not reproduced. See Self-Audit Log items 1 and 4. |
| G09-R4 | Composability | PASS | The metadata model composes cleanly with the front-matter requirement in STD-0001 §3 and the identifier, versioning, and lifecycle rules in ARC-0001. |
| G09-R5 | Explicitness | PASS | All field definitions, types, grammars, and validation rules written explicitly. |
| G09-R6 | Governance boundary respect | PASS | No governance roles, approval processes, or decision rights defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R1 | No unauthorized identifier assignment | PASS | Identifier AI-SDOM-STD-0002 drawn from the register's next-available table (STD 0002). |
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Validation-rule overlap with the Architecture Validation Standard (Section 6):** An initial draft restated identifier, versioning, lifecycle, and dependency validation rules that are already defined in [AI-SDOM-ARC-0001] and enforced by the quality gates of the Architecture Validation Standard. This violated G09-R3 (parsimony). Resolved by reducing Section 6.2 to requirements that cite the authority for each rule, and by placing the genuinely new validation rules (unknown-field detection, extension fields, optional-field typing, and cross-field consistency — MVR-10 through MVR-15) in Section 6.3 as metadata-specific rules no other document defines.

2. **Representation change vs. existing repository practice (Section 7):** All existing governed documents render metadata as bold-label fields (`**Field:** value`), while this standard defines the canonical machine-readable representation as YAML front matter. Introducing a YAML mandate without a transition would invalidate nine existing Active documents. Resolved by defining the label rendering as a recognized legacy representation [Section 4.4], mapping each label to a registry key, and requiring migration to the YAML representation in the same change that next amends each existing document [Section 7.5]. This standard itself uses the canonical YAML form as the exemplar [Section 7.4].

3. **New optional fields (Section 3.3):** The standard introduces five optional fields (`title`, `owner`, `tags`, `created`, `supersedes`). These are within the authority granted by [AI-SDOM-STD-0001 (Section 3.5)] to define additional fields, are typed and validated (MVR-12 through MVR-15), and do not duplicate any core field. Their rationale is given in [Section 11].

4. **Duplication boundary with STD-0001 (Sections 1, 3):** [AI-SDOM-STD-0001 (Section 3.2)] already declares the mandatory metadata fields. Reproducing that table as original content would duplicate it. Resolved by defining this standard as the canonical specification of those fields — key, data type, value grammar, validation, and representation — while attributing each core field's requiredness to [AI-SDOM-STD-0001 (Section 3.2)] in the registry's Authoritative Source column. The per-class applicability matrix [Section 3.5] consolidates requiredness in one place and is attributed to its sources.

5. **`ai-assistance` requiredness reconciliation (Section 3.2.1):** [AI-SDOM-STD-0001 (Section 3.2)] marks `ai-assistance` MAY, while [AI-SDOM-ARC-0001 (Section 14.2)] requires the field whenever AI assistance is used. Resolved by defining Conditional requiredness: SHALL when AI assistance was used, MAY otherwise, citing ARC-0001 §14.2 as the governing rule.

6. **Key naming choice (Section 4):** Keys could have used snake_case or camelCase. Resolved by choosing lowercase kebab-case to align with the naming conventions in [AI-SDOM-ARC-0001 (Section 11)] for files, assets, and scripts.

7. **Layer-2 reference constraint (Sections 1, 8, 13):** This document references only ARC-0001, GOV-0001, and STD-0001 by canonical identifier. The Master Document Template (L4), the Document Development Procedure (L3), the Repository Register (L5), and the Architecture Validation Standard (cross-cutting) are referenced by descriptive title only, consistent with [AI-SDOM-ARC-0001 (Section 7.1, Section 7.2)] and the precedent in the GOV-0001, STD-0001, and PRC-0001 self-audits.

8. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter `dependencies` field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.

9. **Prospective application of the YAML representation (Section 7.5):** Requiring the YAML representation for all documents immediately would conflict with the transition for existing documents. Resolved by scoping the YAML requirement to documents created on or after the effective date and to existing documents upon their next amendment, mirroring the prospective-application precedent in the Repository Certification Standard.
