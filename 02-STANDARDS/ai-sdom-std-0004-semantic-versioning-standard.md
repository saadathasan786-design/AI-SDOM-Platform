---
identifier: AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD
title: Semantic Versioning Standard
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
tags:
  - versioning
  - standards
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-01: initial draft"
---

# Semantic Versioning Standard

## 1. Purpose

1.1 This standard is the canonical specification of document versioning within the AI-SDOM repository. It is the single source of truth for how a document's version is structured, assigned, incremented, interpreted, and managed across the life of a document. It defines versioning rules only; it SHALL NOT define operational procedures for versioning (governed by the PRC class), governance roles or approval authority (governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001]), or quality-gate pass/fail criteria (governed by the QLT class).

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 9)], which establishes Semantic Versioning 2.0.0 as the versioning scheme for layered documents, and from [AI-SDOM-GOV-0001 (Section 8.3)], which defines the amendment types and their version impact. This standard is the canonical specification of how those constitutional rules are applied to every document class. Where this standard and [AI-SDOM-ARC-0001] describe the same versioning rule, [AI-SDOM-ARC-0001] remains the constitutional authority and prevails in case of conflict [AI-SDOM-ARC-0001 (Section 2.3)].

1.3 This standard applies to:
- Every governed document that carries a version field [AI-SDOM-ARC-0001 (Section 9.5)].
- Every amendment to a governed document [AI-SDOM-GOV-0001 (Section 8.2)].
- Any machine-readable tooling, automation, or AI agent that reads or writes document versions [AI-SDOM-ARC-0001 (Section 14, Section 19)].

---

## 2. Scope

2.1 This standard governs the version field of every document in the repository that carries one. It defines the version grammar [Section 4], the version lifecycle [Section 5], the increment rules for every document class [Section 6], compatibility rules [Section 7], initial version rules [Section 8], the relationship between versions and document deprecation and supersession [Section 9], release identification [Section 10], validation rules [Section 11], and the machine-readable representation of versions [Section 12].

2.2 This standard does not govern:
- The content or substance of a document's body, which determines what version impact applies (classified per [AI-SDOM-GOV-0001 (Section 8.3)]).
- The identifier scheme, reserved ranges, or identifier immutability (governed by [AI-SDOM-ARC-0001 (Section 5, Section 12)]).
- The lifecycle states of documents as a whole, which are Active, Deprecated, and Retired (governed by [AI-SDOM-ARC-0001 (Section 20.2)]); the version lifecycle in [Section 5] is a distinct per-version concept [Section 5.10].
- Repository release designation and publishing (governed by the Document Development Procedure (PRC-0001) and the Repository Certification Standard).

2.3 Where a provision of this standard conflicts with [AI-SDOM-ARC-0001], the Architecture Contract prevails [AI-SDOM-ARC-0001 (Section 2.3)].

---

## 3. Versioning Philosophy

3.1 **Single Source of Truth.** This standard is the canonical authority for version structure, assignment, and increment in the AI-SDOM repository. No other governed document SHALL define versioning rules that conflict with this standard.

3.2 **Document Releases Are Identified by Versions.** A document release is identified by its version. Document versions are expressed as Semantic Versioning 2.0.0 version strings [AI-SDOM-ARC-0001 (Section 9.1)]. Git commit hashes identify repository states and repository releases; they SHALL NOT be used as components of a document version [Section 10.4].

3.3 **Deterministic Assignment.** The same change SHALL produce the same version increment decision under the decision rules in [Section 6]. Version increment SHALL NOT depend on the judgment of individual authors beyond the classification of the change under [AI-SDOM-GOV-0001 (Section 8.3)].

3.4 **Stability of Meaning.** A version SHALL express, unambiguously, the compatibility relationship between a new document release and the releases that preceded it [Section 7]. A version SHALL NOT be reinterpreted after the release to which it is attached has been published [Section 5.5].

3.5 **Backward Compatibility as the Anchor.** MAJOR, MINOR, and PATCH increments express, in order of decreasing impact, breaking, backward-compatible-additive, and intent-preserving-correction changes [AI-SDOM-ARC-0001 (Section 9.2-9.4)]. Versioning decisions SHALL be anchored to the change's effect on consumers of the document.

3.6 **Proportional Rigor.** The rigor applied to versioning SHALL be proportional to the layer of the affected document [AI-SDOM-ARC-0001 (Section 2.5)]. Higher-layer documents (ARC, GOV) break dependent content more consequentially than lower-layer documents, and their MAJOR semantics are defined accordingly [Section 6.2].

---

## 4. Version Structure

4.1 **Grammar.** A document version SHALL conform to Semantic Versioning 2.0.0 `MAJOR.MINOR.PATCH` as specified in [AI-SDOM-ARC-0001 (Section 9.1)]. The version is a string of three non-negative integer segments separated by single periods, each segment SHALL NOT contain leading zeroes:

```
MAJOR.MINOR.PATCH
```

4.2 **MAJOR.** The MAJOR segment increments when the change is breaking: it invalidates content or requires non-compliant or dependent artifacts to be updated [AI-SDOM-ARC-0001 (Section 9.2)]. The per-class meaning of a breaking change is defined in [Section 6.2].

4.3 **MINOR.** The MINOR segment increments when the change is a backward-compatible addition: new rules, optional steps, or extended content that does not invalidate existing content [AI-SDOM-ARC-0001 (Section 9.3)].

4.4 **PATCH.** The PATCH segment increments when the change is a correction that does not change intent: typos, formatting, clarifications, or fixed references [AI-SDOM-ARC-0001 (Section 9.4)].

4.5 **Normalization.** A version SHALL be recorded exactly as its incremented value; segments SHALL NOT be zero-padded. A MAJOR increment SHALL reset MINOR and PATCH to `0`; a MINOR increment SHALL reset PATCH to `0`; a PATCH increment changes PATCH only.

4.6 **Prohibited elements.** A document version SHALL NOT contain a pre-release identifier (for example `-alpha`, `-rc.1`) or build metadata (for example `+build.7`). Pre-release status is expressed through the version lifecycle in [Section 5], not through version-string suffixes. This aligns with the Architecture Validation Standard (semantic versioning gate).

---

## 5. Version Lifecycle

5.1 **State model.** Every version of a document exists in exactly one version lifecycle state at any time. The version lifecycle states are: Draft, Internal Review, Approved, Released, Deprecated, Superseded, and Retired. A version normally progresses:

```
Draft -> Internal Review -> Approved -> Released -> Deprecated -> Superseded -> Retired
```

5.2 **Draft.** A version is Draft while its content is being authored and has not been frozen. Draft versions are working versions; they need not be registered in the Repository Register and SHALL NOT be tagged [Section 10.4]. A document in version 0.Y.Z is a draft [AI-SDOM-GOV-0001 (Section 7.3)]; while a version is Draft, its content MAY change without incrementing the version.

5.3 **Internal Review.** A version is in Internal Review once its content is frozen and it has been submitted for review before approval. A version in Internal Review SHALL NOT have its content changed without returning to Draft. Pre-ratification versions of a document under review are in the Internal Review state [Section 5.2].

5.4 **Approved.** A version is Approved when it has received the approval required for its class per [AI-SDOM-ARC-0001 (Section 15)] and the approval has been recorded [AI-SDOM-ARC-0001 (Section 15.7)]. An Approved version's content SHALL NOT be changed; any change requires a new version per [Section 6].

5.5 **Released.** A version is Released when an Approved version has been published as a release: registered in the Repository Register and, for ratified releases, tagged per [AI-SDOM-ARC-0001 (Section 9.5, Section 11.6)]. A Released version's content is immutable [Section 5.4]; a Released version's version string SHALL NOT be reused or reinterpreted [Section 3.4].

5.6 **Deprecated.** A version is Deprecated when the document of which it is a version has entered the Deprecated lifecycle state [AI-SDOM-ARC-0001 (Section 20.2)] or when the version has been replaced by a newer version and remains in effect only during a transition period [Section 9.2].

5.7 **Superseded.** A version is Superseded when a newer version of the same document, or a replacement document, has taken its place. A Superseded version SHALL NOT be used as the target of new references [Section 9.3].

5.8 **Retired.** A version is Retired when the document identifier has been removed from the active register after the transition period expires [AI-SDOM-ARC-0001 (Section 20.2)] or when the version is otherwise withdrawn from use. A Retired version SHALL NOT be referenced [Section 9.4].

5.9 **Transition rules.** A version SHALL transition only to a state reachable in the state model of [Section 5.1], and SHALL NOT skip the Released state in its progression toward Deprecated, Superseded, or Retired. A version in Draft or Internal Review MAY be abandoned without release; an abandoned version SHALL NOT be assigned to a later release.

5.10 **Relationship to document lifecycle and certification.** The version lifecycle is a property of individual versions and is distinct from the document lifecycle (Active, Deprecated, Retired) defined in [AI-SDOM-ARC-0001 (Section 20.2)] and from certification levels defined in the Repository Certification Standard. A document may be Active while a particular version of it is Deprecated or Superseded. Version lifecycle states map to certification readiness only as the Repository Certification Standard defines, and this standard SHALL NOT define certification levels.

---

## 6. Version Increment Rules

6.1 **Authority.** The change categories and their version impact are defined in [AI-SDOM-GOV-0001 (Section 8.3)]; the per-class MAJOR semantics are defined in [AI-SDOM-ARC-0001 (Section 9.2)]. This section presents the operational decision tables that apply those rules to every document class. Where a value in this section appears to differ from [AI-SDOM-GOV-0001 (Section 8.3)] or [AI-SDOM-ARC-0001 (Section 9)], the authority prevails.

6.2 **Per-class MAJOR triggers.** The MAJOR segment increments only when the change matches the class-specific trigger below, as derived from [AI-SDOM-ARC-0001 (Section 9.2)]:

| Class | MAJOR trigger |
|-------|---------------|
| ARC | An incompatible change to the repository constitution |
| GOV | A policy change that invalidates existing procedures or standards |
| STD | A breaking change requiring non-compliant artifacts to be updated |
| PRC | Any change that breaks backward compatibility of the procedure |
| TPL | Any change that breaks backward compatibility of the template |
| REG | Any change that breaks backward compatibility of the register's records or schema |
| QLT | Same as layered documents [AI-SDOM-ARC-0001 (Section 9.7)]; a breaking change to a validation or certification rule |
| ADR | Not applicable — ADR documents carry no version [AI-SDOM-ARC-0001 (Section 9.6)] |

6.3 **Change-category decision table.** For every document class except ADR, the version increment SHALL follow the change category as classified under [AI-SDOM-GOV-0001 (Section 8.3)]:

| Change category | Version increment | Requirement |
|-----------------|-------------------|-------------|
| Correction | PATCH | Intent-preserving fix; no downstream effect confirmed [AI-SDOM-GOV-0002 (Section 6.4)] |
| Addition | MINOR | Backward-compatible extension; compatible with dependent documents [AI-SDOM-GOV-0002 (Section 6.4)] |
| Revision | MAJOR | Meaning-altering change; full impact assessment required [AI-SDOM-GOV-0002 (Section 6.4)] |
| Deprecation | MAJOR | Marking the document deprecated [AI-SDOM-GOV-0001 (Section 8.3)] |
| Retraction | MAJOR | Removing the document from active use [AI-SDOM-GOV-0001 (Section 8.3)] |
| New Document Creation | 0.1.0 | Initial version; ratified as 1.0.0 upon first full ratification [Section 8] |

6.4 **Increment normalization.** When an increment is applied, the resulting version SHALL follow the normalization rules of [Section 4.5]. For example, `1.2.3` becomes `1.2.4` (PATCH), `1.3.0` (MINOR), or `2.0.0` (MAJOR).

6.5 **Register amendments.** An amendment to the Repository Register (REG-0001) that adds, removes, or updates the record of a governed document SHALL be versioned per this section, and the register's version impact rules in [AI-SDOM-STD-0002 (Section 8.2)] SHALL apply to the register's own metadata fields.

---

## 7. Compatibility Rules

7.1 **Compatibility classification.** The version increment SHALL be determined by the compatibility of the change with the consumers of the document. Compatibility is assessed per [Section 6]. A change is:
- **Breaking** if it invalidates existing content or requires consumers to update — MAJOR.
- **Backward-compatible (additive)** if it adds content without invalidating existing content — MINOR.
- **Intent-preserving** if it changes no meaning — PATCH.

7.2 **Documentation-only changes.** A change to prose, examples, or illustrative content that does not alter any requirement, step, field, or value is a Correction and SHALL be a PATCH increment [Section 6.3].

7.3 **Metadata-only changes.** A change to a document's metadata record that does not change any metadata value's meaning (for example, migrating the representation) is a Correction and SHALL be a PATCH increment, consistent with [AI-SDOM-STD-0002 (Section 8.2)].

7.4 **Reference-only changes.** A change that re-points or corrects references without changing the referenced meaning is a Correction and SHALL be a PATCH increment. The rules for updating references SHALL follow the Cross-Reference Standard, which governs reference formation, resolution, and lifecycle; this standard SHALL NOT restate them.

7.5 **Interface changes.** For classes whose documents expose a machine interface or schema (in particular REG and TPL), any change to that interface or schema that breaks consumers is breaking and SHALL be a MAJOR increment [Section 6.2].

7.6 **Register synchronization.** When a document's version changes, the Repository Register (REG-0001) SHALL be updated to record the new version in the same change [AI-SDOM-GOV-0002 (Section 7.5)].

---

## 8. Initial Version Rules

8.1 **Initial version.** A new governed document SHALL be created at version `0.1.0`, reflecting its pre-ratification draft status [AI-SDOM-GOV-0001 (Section 7.3)]. ADR documents are excepted and carry no version [AI-SDOM-ARC-0001 (Section 9.6)].

8.2 **Ratification.** A document reaches version `1.0.0` upon its first full ratification [AI-SDOM-GOV-0001 (Section 7.3)]. The increment from `0.Y.Z` to `1.0.0` is not a MAJOR, MINOR, or PATCH increment under [Section 6]; it is the ratification transition and is governed by [AI-SDOM-GOV-0001 (Section 7)].

8.3 **Draft iteration.** While a document is in version 0.Y.Z and its version is in the Draft or Internal Review state [Section 5], the content MAY change without a version increment. Once a document's version is Approved or Released [Section 5.4, Section 5.5], the version SHALL be incremented per [Section 6] for every subsequent change.

8.4 **Version field update before merge.** The version field SHALL be updated to its new value before the amended document is merged to the main branch [AI-SDOM-STD-0001 (Section 6.4)].

---

## 9. Deprecation and Supersession

9.1 **Authority.** Document deprecation and retraction are governed by [AI-SDOM-GOV-0001 (Section 8.3)] (Deprecation and Retraction amendment types), [AI-SDOM-ARC-0001 (Section 20.2)] (lifecycle and transition periods), and [AI-SDOM-GOV-0001 (Section 9)] (exceptions). This section defines only the versioning behavior of deprecation and supersession and SHALL NOT restate those governance rules or transition periods.

9.2 **Version behavior on deprecation.** Marking a document deprecated is a Deprecation amendment and SHALL be a MAJOR increment [Section 6.3], so that consumers can distinguish the deprecated release from prior releases. The deprecated version enters the Deprecated version lifecycle state [Section 5.6] and remains in effect during the transition period defined in [AI-SDOM-ARC-0001 (Section 20.2)].

9.3 **Supersession.** A version becomes Superseded [Section 5.7] when a newer version of the same document or a replacement document is Released [Section 5.5]. New references to a Superseded version SHALL NOT be introduced; the handling of references to superseded targets SHALL follow the Cross-Reference Standard (reference lifecycle), which is referenced and not restated here.

9.4 **Retraction.** Removing a document from active use is a Retraction amendment and SHALL be a MAJOR increment [Section 6.3] if the document remains versioned. A Retired version [Section 5.8] SHALL NOT be referenced by any document, per the reference lifecycle rules of the Cross-Reference Standard.

---

## 10. Release Identification

10.1 **Release identifier.** A document release is identified by the document's identifier plus its version: `[AI-SDOM-CLASS-NNNN]` and `MAJOR.MINOR.PATCH` as recorded in the document's front matter [AI-SDOM-ARC-0001 (Section 9.5)].

10.2 **Pre-release semantics.** Because no repository has public releases yet, pre-release status is expressed through the internal version lifecycle states Draft and Internal Review [Section 5.2, Section 5.3], not through version-string pre-release suffixes, which are prohibited [Section 4.6]. A document version in Draft or Internal Review SHALL NOT be treated as a public release.

10.3 **Git tag format.** A ratified release SHALL have a Git tag matching `{lowercased-identifier}-v{MAJOR}.{MINOR}.{PATCH}` per [AI-SDOM-ARC-0001 (Section 11.6)] and the semantic versioning gate of the Architecture Validation Standard. This standard SHALL NOT redefine the tag format.

10.4 **Git commit hashes.** Git commit hashes identify repository states and repository releases, not document versions. A commit hash SHALL NOT appear as or substitute for a document version, and a document version SHALL NOT be derived from a commit hash.

---

## 11. Validation Rules

11.1 **Severity scale.** Each validation rule in this section carries one of the severities defined in the Cross-Reference Standard (Critical, Major, Minor, Informational), which is referenced and not restated here.

11.2 **Enforcement.** The rules in this section are the canonical document-versioning validation rules. They are enforced by the semantic versioning gate of the Architecture Validation Standard, by automated tooling established per [AI-SDOM-ARC-0001 (Section 19)], and, where no automated tooling exists, by author self-audit per the Document Development Procedure. This standard does not define gate pass/fail criteria; it defines the rules that gates and tooling validate against.

11.3 The validation rules are designated SVR-01 through SVR-20.

**SVR-01 — Version Field Presence.**
- **Purpose:** Ensure every versioned document carries a version.
- **Requirement:** The `version` field SHALL be present for all document classes except ADR and SHALL NOT be present for ADR [AI-SDOM-STD-0002 (Section 3.2)]; [AI-SDOM-ARC-0001 (Section 9.6)].
- **Failure condition:** A non-ADR document missing the `version` field, or an ADR carrying one.
- **Severity:** Critical.

**SVR-02 — SemVer Format.**
- **Purpose:** Ensure every version string is a valid Semantic Versioning 2.0.0 version.
- **Requirement:** A version SHALL conform to `MAJOR.MINOR.PATCH` per [Section 4.1], with non-negative integer segments and no leading zeroes.
- **Failure condition:** A version that is malformed, negative, or contains leading zeroes.
- **Severity:** Critical.

**SVR-03 — Pre-release and Build Metadata Prohibition.**
- **Purpose:** Ensure version strings carry no pre-release identifiers or build metadata.
- **Requirement:** A version SHALL NOT contain a pre-release suffix (e.g. `-alpha`, `-rc.1`) or build metadata (e.g. `+build.7`) [Section 4.6].
- **Failure condition:** A version containing a hyphen suffix or a `+` build-metadata segment.
- **Severity:** Critical.

**SVR-04 — Increment Direction.**
- **Purpose:** Ensure the version increment matches the declared change category.
- **Requirement:** The version SHALL increment consistently with the declared change type per [Section 6.3] [AI-SDOM-STD-0002 (Section 3.2)].
- **Failure condition:** A Correction recorded as MINOR or MAJOR, an Addition recorded as MAJOR, or a Revision recorded as MINOR or PATCH.
- **Severity:** Major.

**SVR-05 — Increment Normalization.**
- **Purpose:** Ensure increments follow the reset rules.
- **Requirement:** A MAJOR increment SHALL reset MINOR and PATCH to `0`; a MINOR increment SHALL reset PATCH to `0` [Section 4.5].
- **Failure condition:** A version such as `1.2.4` produced from `1.2.3` by a MINOR increment, or `1.2.3` produced from `1.2.3` with no change.
- **Severity:** Major.

**SVR-06 — Monotonicity.**
- **Purpose:** Ensure each new released version is strictly greater than the previous one.
- **Requirement:** A new Released version SHALL be strictly greater than every prior Released version of the same document.
- **Failure condition:** A new version equal to or lower than a prior Released version.
- **Severity:** Critical.

**SVR-07 — Version Field Update Before Merge.**
- **Purpose:** Ensure the version reflects the change before it is published.
- **Requirement:** The version field SHALL be updated before the amended document is merged to the main branch [AI-SDOM-STD-0001 (Section 6.4)].
- **Failure condition:** A document merged with content changed since its recorded version.
- **Severity:** Major.

**SVR-08 — ADR Version Prohibition.**
- **Purpose:** Ensure ADR documents carry no version.
- **Requirement:** An ADR SHALL NOT carry a `version` field; ADR immutability and status follow [AI-SDOM-ARC-0001 (Section 9.6, Section 17.3)].
- **Failure condition:** An ADR with a `version` field.
- **Severity:** Critical.

**SVR-09 — QLT Version Inclusion.**
- **Purpose:** Ensure QLT documents carry versions.
- **Requirement:** A QLT document SHALL carry a `version` field and follow the same versioning rules as layered documents [AI-SDOM-ARC-0001 (Section 9.7)].
- **Failure condition:** A QLT document missing the `version` field.
- **Severity:** Critical.

**SVR-10 — Git Tag Consistency.**
- **Purpose:** Ensure ratified releases are tagged with the recorded version.
- **Requirement:** When a document reaches a ratified state, a Git tag SHALL exist matching `{lowercased-identifier}-v{MAJOR}.{MINOR}.{PATCH}` [Section 10.3].
- **Failure condition:** Missing tag or tag that does not match the front-matter version.
- **Severity:** Major.

**SVR-11 — Initial Version.**
- **Purpose:** Ensure new documents start at the correct version.
- **Requirement:** A new governed document SHALL be created at `0.1.0` and SHALL reach `1.0.0` only upon first full ratification [Section 8.1, Section 8.2].
- **Failure condition:** A new document starting at any version other than `0.1.0`.
- **Severity:** Major.

**SVR-12 — Deprecation and Retraction Version Impact.**
- **Purpose:** Ensure lifecycle amendment categories carry MAJOR increments.
- **Requirement:** A Deprecation or Retraction amendment SHALL be a MAJOR increment [Section 6.3].
- **Failure condition:** A document entering the Deprecated or Retired lifecycle state at a MINOR or PATCH increment.
- **Severity:** Major.

**SVR-13 — Released Version Immutability.**
- **Purpose:** Ensure Released versions are not altered.
- **Requirement:** The content of a Released version SHALL NOT be changed [Section 5.5]; any change SHALL be released as a new version per [Section 6].
- **Failure condition:** Content change to a Released version without a version increment.
- **Severity:** Major.

**SVR-14 — Certification Version Scoping.**
- **Purpose:** Ensure version changes invalidate stale certifications.
- **Requirement:** A change to certified content or dependencies SHALL invalidate the certification at that version, per the version-scoping rule of the Repository Certification Standard.
- **Failure condition:** A certification asserted for a version whose content has changed.
- **Severity:** Major.

**SVR-15 — Register Synchronization.**
- **Purpose:** Ensure the Repository Register records the current version.
- **Requirement:** The Repository Register (REG-0001) SHALL record the current version of each governed document and SHALL be updated in the same change as a version increment [Section 7.6].
- **Failure condition:** A version in the document's front matter that differs from the version recorded in the register.
- **Severity:** Major.

**SVR-16 — Auto-Update for Metadata-Only and Reference-Only Changes.**
- **Purpose:** Provide the mechanism for automated versioning of low-impact changes.
- **Requirement:** Metadata-only changes [Section 7.3] and reference-only changes [Section 7.4] MAY be applied as PATCH increments through an automated process; such changes SHALL NOT alter meaning and SHALL follow the reference update rules of the Cross-Reference Standard, which are referenced and not restated here.
- **Failure condition:** An auto-update that changes content meaning, or an auto-update that violates the Cross-Reference Standard's reference update rules.
- **Severity:** Minor.

**SVR-17 — Pre-release State Semantics.**
- **Purpose:** Ensure internal pre-release states are not misrepresented as releases.
- **Requirement:** A document version in the Draft or Internal Review state SHALL NOT be presented as a public release [Section 10.2].
- **Failure condition:** A draft or in-review version referenced as a release.
- **Severity:** Minor.

**SVR-18 — Commit Hash Exclusion.**
- **Purpose:** Ensure Git commit hashes are not used as versions.
- **Requirement:** A document version SHALL NOT contain or be derived from a Git commit hash [Section 10.4].
- **Failure condition:** A version field containing a commit hash or hash-derived component.
- **Severity:** Major.

**SVR-19 — Supersession Reference Prohibition.**
- **Purpose:** Ensure Superseded and Retired versions are not newly referenced.
- **Requirement:** New references SHALL NOT be introduced to a Superseded or Retired version [Section 9.3, Section 9.4]; existing references SHALL be updated per the Cross-Reference Standard.
- **Failure condition:** A new reference to a Superseded or Retired version.
- **Severity:** Major.

**SVR-20 — Documentation-Only Classification.**
- **Purpose:** Ensure documentation-only changes do not over-increment.
- **Requirement:** A change limited to prose, examples, or illustrative content SHALL be classified as a Correction and SHALL be a PATCH increment [Section 7.2].
- **Failure condition:** A documentation-only change recorded as MINOR or MAJOR.
- **Severity:** Minor.

---

## 12. Machine Readability

12.1 **Canonical version grammar.** The canonical machine-readable representation of a version is the Semantic Versioning 2.0.0 string defined in [Section 4.1]:

```
(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)
```

12.2 **Metadata representation.** The version SHALL be recorded in the document's YAML front matter as the `version` field, per the canonical YAML representation and syntax rules of [AI-SDOM-STD-0002 (Section 7)] and the field registry of [AI-SDOM-STD-0002 (Section 3.2)]. This standard SHALL NOT redefine the metadata representation.

12.3 **Semantics for tooling.** Tooling SHALL treat the three segments as a total order for comparison: MAJOR has the highest precedence, then MINOR, then PATCH. Because pre-release and build-metadata suffixes are prohibited [Section 4.6], no additional precedence rules are required.

12.4 **Machine-generated updates.** Tooling SHALL NOT set, increment, or migrate a document version except per [Section 6] and [Section 8], and SHALL record any auto-update per [SVR-16].

---

## 13. Examples

The following examples are non-normative. They illustrate the versioning rules in [Section 4], [Section 6], and [Section 7].

13.1 **Correct increments.** Starting from `1.2.3`:

```text
Correction (typo fix, no intent change)         -> 1.2.4
Correction (reference re-pointed)               -> 1.2.4
Correction (metadata representation migrated)   -> 1.2.4
Addition (new optional rule in an STD)          -> 1.3.0
Addition (new section in a GOV document)        -> 1.3.0
Revision (STD requirement made stricter)        -> 2.0.0
Deprecation of the document                     -> 2.0.0
```

13.2 **Correct initial versions.**

```text
New document (pre-ratification)                 -> 0.1.0
First full ratification of a document           -> 1.0.0
```

13.3 **Incorrect versions.**

```text
1.2.3 -> 1.2.3   (no change; a new release requires an increment)      [SVR-06]
1.2.3 -> 1.3.3   (MINOR increment must reset PATCH to 0)               [SVR-05]
1.2.3 -> 2.2.4   (MAJOR increment must reset MINOR and PATCH to 0)     [SVR-05]
0.1.0-alpha      (pre-release suffix is prohibited)                    [SVR-03]
1.0.0+20260801   (build metadata is prohibited)                        [SVR-03]
1.2.3a           (malformed)                                           [SVR-02]
```

13.4 **Git tag for a ratified release** per [AI-SDOM-ARC-0001 (Section 11.6)]:

```text
ai-sdom-std-0001-v1.0.0
```

---

## 14. Relationship to Other Standards

14.1 This standard is one of the Layer 2 standards. Its relationship to the other governed documents is:

| Document | Relationship |
|----------|--------------|
| [AI-SDOM-ARC-0001] | Constitutional authority for Semantic Versioning 2.0.0 (§9), identifier scheme (§5), reserved ranges (§12), approval principles (§15), and lifecycle states (§20). This standard operationalizes §9. |
| [AI-SDOM-GOV-0001] | Amendment types and version impact (§8.3), ratification and 0.Y.Z draft semantics (§7.3). This standard operationalizes §8.3 into per-class decision tables. |
| [AI-SDOM-GOV-0002] | Change categories and impact assessment that determine the version increment. |
| [AI-SDOM-STD-0001] | Version field declaration (§3.2) and version-update-before-merge rule (§6.4). |
| [AI-SDOM-STD-0002] | Version field registry (§3.2) and YAML front-matter representation (§7). |
| [AI-SDOM-STD-0003] | Severity scale (§11.1) and reference lifecycle that governs references to versioned and superseded documents. |
| Document Development Procedure | Operational lifecycle that executes self-audit and versioning validation. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (REG-0001) | Identifier and version inventory that records each document's current version. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard | Enforces versioning rules (semantic versioning gate, G06). Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Certification Standard | Defines certification levels and version scoping of certification. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

14.2 **Division of authority.** This standard defines versioning rules only. It SHALL NOT duplicate:
- Approval thresholds and review periods (governed by [AI-SDOM-ARC-0001 (Section 15)] and [AI-SDOM-GOV-0001 (Section 8.3)]).
- Document lifecycle states and transition periods (governed by [AI-SDOM-ARC-0001 (Section 20.2)]).
- Reference formation, resolution, and lifecycle (governed by the Cross-Reference Standard).
- Certification criteria and levels (governed by the Repository Certification Standard).
- Procedural steps for applying or reviewing versions (governed by the PRC class).

---

## 15. References

The following external record supports this standard. It is pinned per the version-pinning rules of the Cross-Reference Standard.

| Label | Target | Kind |
|-------|--------|------|
| [SEMVER-2.0.0] | Tom Preston-Werner. *Semantic Versioning 2.0.0*. June 2013. https://semver.org/spec/v2.0.0.html | External — versioned specification |

---

## Amendment Record

| Version | Date       | Author | Description of Change | Approval |
|---------|------------|--------|-----------------------|----------|
| 0.1.0   | 2026-08-01 | —      | Initial semantic versioning standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-STD-0001], [AI-SDOM-STD-0002], and [AI-SDOM-STD-0003], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure versioning specification. §1.1 and §14.2 exclude procedures, governance, lifecycle, reference, certification, and quality-gate content. |
| §2.2 | Traceability | PASS | Every normative section cites the authorizing provision in ARC-0001, GOV-0001, GOV-0002, STD-0001, STD-0002, or STD-0003. |
| §2.4 | Parsimony | PASS | Versioning rules operationalize ARC-0001 §9 and GOV-0001 §8.3 as decision tables, referenced not reproduced. See Self-Audit Log items 1, 2, and 6. |
| §2.6 | Explicitness | PASS | All version structure, lifecycle, increment, and validation rules written explicitly. |
| §4 | Valid class code STD | PASS | Identifier: AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD. |
| §5.1 | Identifier format | PASS | AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD. |
| §5.4 | Filename mirror | PASS | ai-sdom-std-0004-semantic-versioning-standard.md. |
| §6.1 | Directory match | PASS | 02-STANDARDS/ maps to the STD class. |
| §7.1 | Layer N references 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), STD (L2). All ≤ 2. Higher-layer and cross-cutting documents referenced descriptively. |
| §7.3 | Dependencies section | PASS | Present as the front-matter `dependencies` list per established repository precedent. |
| §7.5 | STD cites authorizing GOV | PASS | GOV-0001 listed in Dependencies and §1.2. |
| §8 | Cross-reference syntax | PASS | All formal references use `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]` canonical form. |
| §9.1 | SemVer version | PASS | Version: 0.1.0. |
| §9.2 | Per-class MAJOR semantics | PASS | §6.2 reproduces §9.2 as a decision table with attribution. |
| §9.6 | ADR version prohibition | PASS | SVR-08 and §8.1 implement §9.6 by reference. |
| §11.2 | Filename lowercase | PASS | ai-sdom-std-0004-semantic-versioning-standard.md. |
| §12 | Reserved range | PASS | STD-0004 falls in STD 0001-0099 (universal standards). |
| §14.2 | ai-assistance field | PASS | `ai-assistance` recorded in the front matter. |
| §18 | Quality gate requirements | PASS | §11.2 references the mandatory gates without redefining their pass/fail criteria. |
| §20.2 | Lifecycle state | PASS | `lifecycle-state: Active`. |

### GOV-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2.1 | Constitutional Supremacy | PASS | §2.3 acknowledges supremacy of ARC-0001. |
| §2.3 | Separation of Concerns | PASS | §1.1 and §14.2 exclude procedures, templates, validation gates, and register content. |
| §7.3 | 0.Y.Z draft; 1.0.0 ratification | PASS | §8.1 and §8.2 implement the rule by reference. |
| §8.3 | Amendment types and version impact | PASS | §6.3 operationalizes the amendment categories and version impacts as a decision table without restating review periods. |
| §9 | Exception governance referenced | PASS | §9.1 defers exceptions to GOV-0001 §9; no granting authority is defined here. |

### STD-0001 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §2 | Normative language | PASS | SHALL/SHOULD/MAY used consistently; SVR severity scale is referenced from STD-0003 §11.1 and does not redefine normative keywords. |
| §3.2 | Version field declaration | PASS | §4 and §11 implement the declared field. |
| §6 | Versioning rules | PASS | §6 is the canonical specification of the increment rules declared in STD-0001 §6 and ARC-0001 §9. |
| §6.4 | Version updated before merge | PASS | SVR-07 and §8.4 implement the rule. |
| §8 | Mandatory sections | PASS | Front matter, title, Purpose, body sections, References, Amendment Record, and Self-Audit Log all present. |
| §8.4 | Self-Audit Log | PASS | Present, with issues and resolutions recorded. |

### STD-0002 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §3.2 | Field registry | PASS | `version` field referenced, not redefined; §12.2 defers to the canonical registry. |
| §7 | Machine-readable representation | PASS | Front matter conforms to the canonical YAML form; §12.2 references §7. |
| §8.2 | Version impact of registry changes | PASS | §6.5 references §8.2 for the register's own version impact. |
| MVR-10 | No unknown unprefixed keys | PASS | Only registered fields appear in the front matter. |

### STD-0003 Compliance

| Section | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| §6.1 | Resolution requirements | PASS | All `[AI-SDOM-ARC-0001]`, `[AI-SDOM-GOV-0001]`, `[AI-SDOM-GOV-0002]`, `[AI-SDOM-STD-0001]`, `[AI-SDOM-STD-0002]`, and `[AI-SDOM-STD-0003]` references resolve. |
| §6.7 | Dependency completeness | PASS | Every document referenced canonically appears in the `dependencies` list. |
| §7.3 | Cross-cutting references by descriptive title | PASS | QLT documents and the Procedure referenced descriptively, not canonically. |
| §10 | Reference lifecycle | PASS | §9.3 and §9.4 reference, not restate, the reference lifecycle for superseded and retired targets. |
| §11.1 | Severity scale | PASS | §11.1 references the severity scale, not restates it. |

### Architecture Validation Standard Gate Compliance

**G01 — Layer Dependency Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G01-R1 | Layer N may reference 0..N | PASS | STD (L2) references ARC (L0), GOV (L1), STD (L2). All ≤ 2. |
| G01-R6 | No circular dependencies | PASS | STD-0004 → GOV-0002 → GOV-0001 → ARC-0001; STD-0004 → STD-0003 → STD-0002 → STD-0001 → GOV-0001 → ARC-0001. ARC has no dependencies. No cycle. |
| G01-R7 | STD must cite authorizing GOV | PASS | GOV-0001 listed in Dependencies. |
| G01-R8 | Dependencies section exists | PASS | Front-matter `dependencies` present with a list of identifiers. |

**G02 — Document Taxonomy Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G02-R1 | Class code in CLASS_CODES | PASS | STD is a valid class code. |
| G02-R2 | Single class code | PASS | Exactly one class code: STD. |
| G02-R3 | Layer matches LAYER_MAP | PASS | Layer 2. Front matter: `layer: 2`. |
| G02-R4 | Single concern | PASS | Versioning specification only — no governance, procedure, certification, or reference-definition content. |

**G03 — Identifier Format and Uniqueness**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G03-R1 | Identifier format | PASS | AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD. |
| G03-R2 | Filename mirror | PASS | ai-sdom-std-0004-semantic-versioning-standard.md. |
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
| G05-R1 | All references resolve | PASS | All canonical references resolve to governed documents; the external reference resolves to the pinned record. |
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
| G07-R1 | Within class range | PASS | STD 0004 is within STD 0001-0099 (universal standards). |
| G07-R2 | No retired reuse | PASS | First assignment. |

**G08 — ADR Immutability Rules**

Not applicable — this document is STD, not ADR.

**G09 — Architecture Contract Conformance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G09-R1 | No contradiction with ARC-0001 | PASS | All content aligns with ARC-0001, GOV-0001, GOV-0002, STD-0001, STD-0002, and STD-0003. |
| G09-R2 | Traceability to ARC-0001 | PASS | Every substantive section cites the authorizing provision. |
| G09-R3 | No duplication | PASS | Increment rules referenced to GOV-0001 §8.3 and ARC-0001 §9 as operational decision tables; reference and certification content not restated. See Self-Audit Log items 1, 2, and 6. |
| G09-R4 | Composability | PASS | Version model composes cleanly with the `version` field in STD-0002 §3.2, the `version` requirement in STD-0001 §3.2, and the reference lifecycle in STD-0003 §10. |
| G09-R5 | Explicitness | PASS | All version structure, lifecycle, increment, and validation rules written explicitly. |
| G09-R6 | Governance boundary respect | PASS | No governance roles, approval processes, or decision rights defined. |

**G10 — Automation Boundary Compliance**

| Rule | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G10-R1 | No unauthorized identifier assignment | PASS | Identifier AI-SDOM-STD-0004 drawn from the register's next-available table (STD 0004). |
| G10-R2 | No direct main-branch commits | PASS | Submitted via pull request. Not yet committed. |
| G10-R6 | AI compliance | PASS | `ai-assistance` field present. All cross-references human-verified. |

---

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Increment-rule duplication boundary with ARC-0001 and GOV-0001 (Section 6):** [AI-SDOM-ARC-0001 (Section 9.2)] defines per-class MAJOR semantics and [AI-SDOM-GOV-0001 (Section 8.3)] defines amendment categories and version impact. Reproducing them as original content would duplicate constitutional content. Resolved by presenting the decision tables as operationalizations that attribute each value to the authority in §6.1, adding only the per-class decision structure that no existing document provides, and stating in §6.1 and §14.2 that the authority is referenced, not restated.

2. **Review-period duplication risk (Section 6):** Minimum review periods are defined in [AI-SDOM-ARC-0001 (Section 10.3, Section 10.4)] and [AI-SDOM-GOV-0001 (Section 8.3)]. Resolved by omitting review periods from the decision tables entirely; the tables state version impact and requirement only, and §14.2 excludes review periods.

3. **Version lifecycle vs. document lifecycle (Section 5):** The task prescribed a version lifecycle (Draft, Internal Review, Approved, Released, Deprecated, Superseded, Retired) that is distinct from the document lifecycle in [AI-SDOM-ARC-0001 (Section 20.2)] (Active, Deprecated, Retired) and from certification levels in the Repository Certification Standard. Resolved by defining the version lifecycle as a per-version concept, mapping it to document lifecycle and certification only descriptively in §5.10, and prohibiting this standard from defining certification levels.

4. **Pre-release semantics (Section 4.6, Section 10.2):** Semantic Versioning 2.0.0 permits pre-release identifiers, but the Architecture Validation Standard's semantic versioning gate prohibits pre-release tags in this repository, and no repository has public releases yet. Resolved by prohibiting pre-release and build-metadata suffixes in version strings (§4.6) and mapping pre-release status to the internal Draft and Internal Review version lifecycle states (§10.2), aligning with the Architecture Validation Standard rather than with the generic SemVer pre-release mechanism.

5. **QLT reference constraint (Sections 14):** The required relationship to the Architecture Validation Standard and the Repository Certification Standard conflicts with the adopted interpretation of [AI-SDOM-ARC-0001 (Section 7.1)], under which a layered document SHALL NOT reference a cross-cutting document by canonical identifier. Resolved by referencing both QLT documents by descriptive title only, in §14, consistent with the precedent established in the STD-0001, STD-0002, STD-0003, GOV-0001, and REG-0001 self-audits.

6. **Reference-only update rule (SVR-16, Section 7.4):** Auto-updates for reference-only changes could be read as redefining the reference update rules of the Cross-Reference Standard. Resolved by referencing the Cross-Reference Standard for all reference update rules and scoping SVR-16 to the versioning mechanism only.

7. **External reference pinning (Section 15):** The Semantic Versioning 2.0.0 specification is a versioned external target. Resolved by pinning the record to the versioned specification per the Cross-Reference Standard's version-pinning rule, including the specification title, author, date, and URL.

8. **Dependencies section representation:** G01-R8 requires a "Dependencies" section. Following the precedent of all existing documents, the front-matter `dependencies` field serves as this section; no separate body section is added. This matches [AI-SDOM-ARC-0001 (Section 7.3)] and existing document practice.

9. **Assumed-delivery source control:** This document is delivered as an uncommitted working-tree change for review and approval (phase contract: no Git operations). Its `lifecycle-state` is Active and version 0.1.0; ratification and the associated Git tag per [AI-SDOM-ARC-0001 (Section 11.6)] will follow approval per [AI-SDOM-ARC-0001 (Section 15.3)].

10. **No Semantic Versioning regressions:** This document's own version (0.1.0) is the initial version; it introduces no prior release to regress, and the standard's rules are written so that its own future amendments will increment per §6.3. Every SVR rule was verified against the section it references during self-audit.
