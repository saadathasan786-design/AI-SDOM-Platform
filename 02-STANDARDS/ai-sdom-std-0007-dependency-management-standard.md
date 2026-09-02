---
identifier: AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD
title: Dependency Management Standard
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
  - AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD
tags:
  - dependencies
  - standards
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-01: initial draft"
---

# Dependency Management Standard

## 1. Purpose

1.1 This standard is the canonical specification of dependency management within the AI-SDOM repository. It is the single source of truth for how dependencies between controlled documents are defined, declared, validated, analyzed, and maintained. It defines dependency relationships only; it SHALL NOT redefine repository architecture, governance, naming, metadata, cross-references, versioning, or operational procedures.

1.2 This standard derives its authority from [AI-SDOM-ARC-0001 (Section 7)], which establishes the constitutional dependency rules between document classes, and from [AI-SDOM-STD-0003], which establishes the canonical cross-reference syntax and lifecycle. This standard is the canonical specification of dependency management: it specifies, extends, and operationalizes the dependency model without contradicting it. Where this standard and [AI-SDOM-ARC-0001] describe the same dependency rule, [AI-SDOM-ARC-0001] remains the constitutional authority and prevails in case of conflict [AI-SDOM-ARC-0001 (Section 2.3)].

1.3 This standard applies to:
- Every governed document's declared dependencies.
- The dependency types, direction rules, lifecycle, impact analysis, and metrics defined for the repository.
- Machine-readable tooling, automation, or AI agents that read, write, or validate dependency data [AI-SDOM-ARC-0001 (Section 14, Section 19)].

---

## 2. Scope

2.1 This standard governs the management of dependencies between controlled documents. It defines the dependency management philosophy [Section 3], dependency types [Section 4], direction rules [Section 5], declaration requirements [Section 6], lifecycle [Section 7], impact analysis [Section 8], circular dependency prevention [Section 9], validation [Section 10], machine-readable representation [Section 11], metrics [Section 12], validation rules [Section 13], migration guidance [Section 14], and examples [Section 15].

2.2 This standard does not govern:
- The repository architecture, layering, taxonomy, or constitutional dependency constraints (governed by [AI-SDOM-ARC-0001 (Section 3, Section 4, Section 7)]).
- The canonical syntax of cross-references, reference resolution, forward references, external references, or the reference lifecycle (governed by [AI-SDOM-STD-0003]).
- The `dependencies` metadata field's definition, type, or YAML representation (governed by [AI-SDOM-STD-0002 (Section 3, Section 7)]).
- Version strings, version increments, or compatibility classification (governed by [AI-SDOM-STD-0004]).
- Naming conventions for documents or artifacts (governed by [AI-SDOM-STD-0005]).
- Repository structure, directory placement, or placement of documents (governed by [AI-SDOM-STD-0006]).
- Governance of dependency changes, approval processes, or decision rights (governed by the GOV class and [AI-SDOM-ARC-0001 (Section 15)]).
- Operational procedures for executing impact analyses or dependency migrations (governed by the PRC class).
- The pass/fail criteria of the dependency validation gate (governed by the QLT class).

---

## 3. Dependency Management Philosophy

The dependency model of the repository is governed by the following principles, which justify the specific rules in this standard. They are stated as guidance; the normative requirements they motivate appear in the sections that follow and in the validation rules [Section 13].

3.1 **Explicit dependencies.** Every dependency a governed document has SHALL be declared explicitly in its Dependencies section [AI-SDOM-ARC-0001 (Section 7.3)]. Implicit or undeclared dependencies are defects.

3.2 **Minimal coupling.** A document SHALL depend on only the documents it actually references and whose rules it needs. A dependency SHALL NOT be added without a corresponding reference [Section 6.1].

3.3 **Downward dependency.** A layered document SHALL depend only on documents at its own layer or lower [AI-SDOM-ARC-0001 (Section 7.1)]. Dependency direction SHALL follow layer direction [Section 5].

3.4 **Layer isolation.** Each layer SHALL depend on layers 0 through N only [AI-SDOM-ARC-0001 (Section 7.1)]. A document SHALL NOT reach across layers to depend on a higher-layer document [Section 5.3].

3.5 **Single source of truth.** A dependency SHALL be declared in exactly one place — the document's Dependencies section [AI-SDOM-ARC-0001 (Section 7.3)] — and SHALL be derived from that declaration by all tooling [Section 11].

3.6 **Traceability.** Every dependency SHALL be traceable to the reference that motivates it [Section 6.1], and every dependent SHALL be discoverable from the dependency graph [Section 8].

3.7 **Change impact visibility.** A change to a document SHALL surface its effect on every directly and transitively dependent document [AI-SDOM-GOV-0002 (Section 6)], enabling the impact assessment required by [AI-SDOM-ARC-0001 (Section 10)].

3.8 **Deterministic validation.** Dependency validation SHALL be deterministic: given the same set of documents, the same dependency conclusions SHALL be produced by every validator [Section 10].

---

## 4. Dependency Types

4.1 **Dependency types.** Every dependency between governed documents belongs to exactly one of the following types. The type SHALL be recorded in the dependency metadata [Section 6.3].

| Type | Meaning | Effect on validation |
|------|---------|----------------------|
| Mandatory | A dependency that the document requires to be valid. | Required; the dependency must resolve. |
| Normative | A dependency on rules the document implements or must satisfy. | Required; the dependency must resolve and its rules apply. |
| Informative | A dependency that provides context or rationale but no binding rule. | Recorded; the dependency must resolve. |
| Structural | A dependency that establishes the document's placement, class, or composition (for example, a register's dependency on the document class it records). | Required; the dependency must resolve. |
| Referential | A dependency that is a cross-reference to another document's content [AI-SDOM-STD-0003]. | Recorded; the dependency must resolve and must be declared. |
| Validation | A dependency on a document whose quality the document helps validate, or that validates this document. | Required; the dependency must resolve. |
| Optional | A dependency that may be present but is not required for validity. | Recorded if present; MUST resolve if present. |
| External | A dependency on a target outside the governed repository, declared per [AI-SDOM-STD-0003 (Section 9)]. | Recorded; the external target must be declared and pinned. |

4.2 **Type assignment.** The type of a dependency SHALL be determinable from the kind of reference that motivates it [Section 6.1]. A dependency arising from a normative rule reference is Normative; from a context reference, Informative; from a register's record target, Structural; from a quality gate's validation target, Validation; and from an external target, External.

4.3 **Type boundary.** Dependency types classify the dependency relationship. They SHALL NOT be used to weaken a direction rule [Section 5] or a layer rule [AI-SDOM-ARC-0001 (Section 7.1)]; all types are subject to the direction rules.

---

## 5. Dependency Direction Rules

5.1 **Constitutional authority.** The allowed and forbidden dependencies between document classes are defined constitutionally in [AI-SDOM-ARC-0001 (Section 7.1-7.2)] and are enforced by the dependency validation gate [AI-SDOM-ARC-0001 (Section 18.3)]. This standard specifies the dependency model without duplicating those rules.

5.2 **Allowed dependencies.** The allowed dependencies are:
- **Lower-layer dependencies.** A layered document at layer N SHALL depend on documents at layers 0 through N inclusive [AI-SDOM-ARC-0001 (Section 7.1)].
- **Same-layer dependencies.** A layered document at layer N MAY depend on another document at layer N [AI-SDOM-ARC-0001 (Section 7.1)].
- **Cross-cutting dependencies.** A cross-cutting document (ADR, QLT) SHALL depend only on layered documents [AI-SDOM-ARC-0001 (Section 7.2)], and a cross-cutting document SHALL NOT depend on another cross-cutting document [AI-SDOM-ARC-0001 (Section 7.2)].

5.3 **Forbidden dependencies.** The forbidden dependencies are:
- **Upward dependencies.** A layered document at layer N SHALL NOT depend on a document at layer M where M > N [AI-SDOM-ARC-0001 (Section 7.1)].
- **Cross-cutting-to-cross-cutting.** An ADR SHALL NOT depend on another ADR; a QLT SHALL NOT depend on another QLT; an ADR and a QLT SHALL NOT depend on each other [AI-SDOM-ARC-0001 (Section 7.2)].
- **Circular dependencies.** No dependency chain SHALL form a cycle [AI-SDOM-ARC-0001 (Section 7.4)] [Section 9].

5.4 **Direction rule implementation.** This standard operationalizes the direction rules as deterministic checks over declared dependencies [Section 10]. The rules themselves are not restated here.

---

## 6. Dependency Declaration

6.1 **Declaration and reference correspondence.** A document SHALL list in its Dependencies section exactly the documents it references via canonical external syntax [AI-SDOM-STD-0001 (Section 7.4)], and a document SHALL NOT list a document it does not reference. A dependency SHALL be justified by at least one canonical reference in the body.

6.2 **Canonical declaration location.** The Dependencies section SHALL be the front-matter `dependencies` field, following established repository precedent [AI-SDOM-STD-0005 (Section 16)] and [AI-SDOM-STD-0002 (Section 3)], which serves as the Dependencies section per [AI-SDOM-ARC-0001 (Section 7.3)]. An empty list SHALL read `None` per [AI-SDOM-ARC-0001 (Section 7.3)].

6.3 **Required metadata.** A dependency declaration SHALL include the canonical identifier of the target document. Dependency metadata (type, rationale, version expectation) SHOULD be recorded in the machine-readable form of [Section 11] where tooling requires it; the human-readable Dependencies section SHALL at minimum list the identifiers [AI-SDOM-ARC-0001 (Section 7.3)].

6.4 **Version expectations.** A dependency SHALL NOT pin a specific version of the target document unless a compatibility requirement demands it. Where version expectations exist, they SHALL be expressed per the version rules of [AI-SDOM-STD-0004] and recorded in the dependency metadata [Section 11.2]. A dependency on a document whose version is not yet ratified SHALL reference the current registered version in the Repository Register (05-REGISTERS), referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)].

6.5 **Dependency rationale.** The rationale for a dependency SHALL be the existence of at least one canonical reference in the body [Section 6.1]. Where a dependency's type requires explanation beyond the reference (for example, a Structural or Validation dependency), the rationale SHOULD be recorded in the dependency metadata [Section 11.2].

---

## 7. Dependency Lifecycle

7.1 **Creation.** A dependency SHALL be created when a document first references another document [Section 6.1]. A dependency SHALL NOT be created without a corresponding reference, and a reference SHALL NOT exist without a corresponding dependency declaration [Section 6.1].

7.2 **Modification.** A dependency SHALL be modified when its target changes in a way that affects the dependency's type, rationale, or version expectation. A modification SHALL be recorded in the same change as the reference it accompanies [Section 6.1] and SHALL follow the change management of [AI-SDOM-GOV-0002].

7.3 **Deprecation.** A dependency SHALL be deprecated when its target document is deprecated [AI-SDOM-ARC-0001 (Section 20.2)]. A deprecated dependency SHALL be recorded as such in the dependency metadata [Section 11.2], and new documents SHALL NOT be created with a dependency on a deprecated document [AI-SDOM-ARC-0001 (Section 20.3)].

7.4 **Removal.** A dependency SHALL be removed when the referencing document no longer references the target [Section 6.1], or when the target is retired [AI-SDOM-ARC-0001 (Section 20.2)]. A removed dependency SHALL be removed from the Dependencies section and the machine-readable metadata in the same change [Section 11].

7.5 **Supersession.** A dependency SHALL be re-pointed when its target is superseded by a successor (for example, an ADR superseded per [AI-SDOM-ARC-0001 (Section 17.3)]). The referencing document SHALL be updated to depend on the successor and SHALL remove the dependency on the superseded document during the transition period [AI-SDOM-ARC-0001 (Section 20.3)].

---

## 8. Dependency Impact Analysis

8.1 **Purpose.** The impact of a change to a governed document SHALL be assessed against every document that depends on it, directly or transitively, per [AI-SDOM-GOV-0002 (Section 6)] and [AI-SDOM-ARC-0001 (Section 10)].

8.2 **Direct impact.** A directly impacted document is one that lists the changed document in its Dependencies section [Section 6.1]. Its impact SHALL be assessed for every dependency type [Section 4].

8.3 **Indirect and transitive impact.** An indirectly or transitively impacted document is one that depends on the changed document through one or more intermediate documents. The transitive closure of the dependency graph SHALL be used to identify all transitively impacted documents [Section 11.4].

8.4 **Breaking changes.** A change is breaking for a dependent document if it invalidates content the dependent relies on — for example, a MAJOR version increment [AI-SDOM-STD-0004 (Section 7.1)], a rule removal, a schema change [AI-SDOM-STD-0004 (Section 7.5)], or a semantic alteration [AI-SDOM-GOV-0001 (Section 8.3)]. Breaking changes SHALL be identified in the impact assessment and SHALL trigger the review process of [AI-SDOM-ARC-0001 (Section 10.2-10.3)].

8.5 **Non-breaking changes.** A change is non-breaking for a dependent document if it is backward-compatible (additive) or intent-preserving per [AI-SDOM-STD-0004 (Section 7.1)]. Non-breaking changes SHALL still be recorded in the impact assessment so that the transitive closure is validated [Section 8.3].

8.6 **Impact assessment recording.** The impact assessment SHALL be recorded with the change per [AI-SDOM-GOV-0002 (Section 6.5)] and SHALL identify every directly and transitively impacted document. The dependency graph [Section 11.4] SHALL be the basis for the transitive closure.

---

## 9. Circular Dependency Prevention

9.1 **Detection.** A circular dependency exists when the transitive closure of the dependency graph contains a cycle: a document that directly or transitively depends on itself [AI-SDOM-ARC-0001 (Section 7.4)]. Cycles SHALL be detected by the dependency validation gate [AI-SDOM-ARC-0001 (Section 18.3)] over the machine-readable graph [Section 11.4].

9.2 **Prevention.** A dependency SHALL be introduced only if it does not create a cycle. The dependency validation gate SHALL reject any change whose dependency graph is not a DAG [AI-SDOM-ARC-0001 (Section 18.3)].

9.3 **Resolution.** A detected cycle SHALL be resolved by removing or re-pointing one of the dependencies in the cycle so that the graph becomes a DAG. The resolution SHALL preserve the intent of the affected documents and SHALL be reviewed per [AI-SDOM-GOV-0002].

9.4 **Exceptions.** Cycles SHALL NOT be permitted by exception in a governed repository. Where a genuine mutual dependency exists, the shared content SHALL be moved to a lower-layer document that both parties depend on, preserving downward dependency [Section 5.2].

---

## 10. Dependency Validation

10.1 **Validation expectations.** The repository SHALL validate dependencies deterministically [Section 3.8] using the dependency validation gate [AI-SDOM-ARC-0001 (Section 18.3)] and the Architecture Validation Standard's G01 gate. Validation SHALL check:
- Declaration correspondence: every reference has a dependency and vice versa [Section 6.1].
- Direction compliance: no upward, cross-cutting-to-cross-cutting, or circular dependency [Section 5.3].
- Resolvability: every dependency target is an existing governed document [AI-SDOM-ARC-0001 (Section 8.2)] or a declared external target [Section 4.1].
- Lifecycle compliance: no dependency on a retired or deprecated target by new documents [Section 7.3, Section 7.4].

10.2 **Deterministic outcomes.** For a given set of documents, validation SHALL produce the same result regardless of the validator or its execution order [Section 3.8]. Validation results SHALL be reproducible from the machine-readable dependency graph [Section 11.4].

10.3 **Manual validation.** Where automated validation is not yet established, authors SHALL self-audit the dependency rules of [Section 5], [Section 6], and [Section 9] per the Document Development Procedure, and the results SHALL be recorded in the document's Self-Audit Log.

---

## 11. Machine Readability

11.1 **Canonical YAML dependency schema.** The canonical machine-readable form of a document's dependencies SHALL conform to the following schema, consistent with the metadata representation of [AI-SDOM-STD-0002 (Section 7)]:

```yaml
document:
  identifier: AI-SDOM-CLASS-NNNN-...
  dependencies:
    - target: AI-SDOM-CLASS-NNNN-...
      type: normative        # mandatory | normative | informative | structural | referential | validation | optional | external
      rationale: "one-line justification"   # optional
      version: "0.1.0"                      # optional, per STD-0004
```

11.2 **Dependency object structure.** A dependency object SHALL have the fields `target` (canonical identifier), `type` (one of [Section 4.1]), and optionally `rationale` (text) and `version` (SemVer string per [AI-SDOM-STD-0004]). The `target` SHALL be the canonical identifier form of [AI-SDOM-ARC-0001 (Section 5.1)].

11.3 **Graph representation.** The dependency graph SHALL be represented as a set of edges, each edge `(source, target)` derived from the declared dependencies of `source` [Section 6.2]. The graph SHALL be a directed graph over governed document identifiers.

11.4 **Parser expectations.** A parser reading dependency data SHALL:
- Derive the graph from the Dependencies sections of all governed documents [Section 6.2].
- Resolve every target against the governed document set; an unresolvable target SHALL be flagged [Section 10.1].
- Compute the transitive closure for impact analysis [Section 8.3].
- Detect cycles in the transitive closure [Section 9.1].
- Compute the metrics of [Section 12] from the graph.

11.5 **Relationship to the metadata field.** The dependency object schema of [Section 11.1-11.2] is the canonical derived representation used by tooling and parsers; it is derived from, and does not replace, the front-matter `dependencies` field. The `dependencies` metadata field remains a flat list of canonical identifiers per [AI-SDOM-STD-0002 (Section 3.2, Section 7)], and this standard SHALL NOT redefine its type or representation. A structured dependency record stored in a document's metadata record SHALL be expressed as an extension field per [AI-SDOM-STD-0002 (Section 8)] (the `x-` prefix) and SHALL be documented in the document's Self-Audit Log per the extension-field validation rules of [AI-SDOM-STD-0002 (Section 6.3)].

---

## 12. Dependency Metrics

The following metrics SHALL be computed from the dependency graph [Section 11.3] and SHALL be reported in dependency analyses and certification reports.

| Metric | Definition |
|--------|-----------|
| Dependency count | The number of declared dependencies of a document [Section 6.1]. |
| Fan-in | The number of documents that depend on a given document (direct dependents). |
| Fan-out | The number of documents a given document depends on (direct dependencies). |
| Coupling | A measure of how many documents a change affects; the sum of the directly and transitively impacted documents [Section 8.3]. |
| Stability | A measure of how likely a document is to be affected by changes to its dependencies; computed from fan-in and fan-out (higher fan-in, lower fan-out indicates greater stability). |
| Dependency depth | The maximum number of edges from a document to a root document (a document with no dependencies) in the dependency graph. |

12.1 **Metric use.** Metrics SHALL be used to inform impact analysis [Section 8], to identify high-risk documents (high coupling, low stability) for review, and to guide layer and structure evolution per [AI-SDOM-STD-0006 (Section 10)] and [AI-SDOM-GOV-0003].

---

## 13. Dependency Validation Rules

13.1 **Severity scale.** Each validation rule in this section carries one of the severities defined in the Cross-Reference Standard (Critical, Major, Minor, Informational), which is referenced and not restated here [AI-SDOM-STD-0003 (Section 11.1)].

13.2 **Enforcement.** The rules in this section are the canonical dependency validation rules. They are enforced by the dependency validation gate of the Architecture Validation Standard, by automated tooling established per [AI-SDOM-ARC-0001 (Section 19)], and, where no automated tooling exists, by author self-audit per the Document Development Procedure. This standard does not define gate pass/fail criteria; it defines the rules that gates and tooling validate against [AI-SDOM-ARC-0001 (Section 18.3)].

13.3 The validation rules are designated DSR-01 through DSR-20.

**DSR-01 — Declaration Correspondence.**
- **Purpose:** Ensure every reference has a declared dependency and every dependency is referenced.
- **Requirement:** A document SHALL list in its Dependencies section exactly the documents it references via canonical external syntax [Section 6.1].
- **Failure condition:** A document references a document without declaring it, or declares a document it does not reference.
- **Severity:** Critical.

**DSR-02 — Downward Dependency.**
- **Purpose:** Enforce the constitutional downward dependency rule.
- **Requirement:** A layered document at layer N SHALL depend only on documents at layers 0 through N [Section 5.2, AI-SDOM-ARC-0001 (Section 7.1)].
- **Failure condition:** A dependency resolves to a document at layer M > N.
- **Severity:** Critical.

**DSR-03 — Cross-cutting Isolation.**
- **Purpose:** Enforce the isolation of cross-cutting classes.
- **Requirement:** A cross-cutting document SHALL depend only on layered documents, and SHALL NOT depend on another cross-cutting document [Section 5.3, AI-SDOM-ARC-0001 (Section 7.2)].
- **Failure condition:** An ADR or QLT depends on another ADR or QLT.
- **Severity:** Critical.

**DSR-04 — Acyclicity.**
- **Purpose:** Prevent circular dependencies.
- **Requirement:** The transitive closure of all dependencies SHALL contain no cycles [Section 9.1, AI-SDOM-ARC-0001 (Section 7.4)].
- **Failure condition:** A cycle exists in the dependency graph.
- **Severity:** Critical.

**DSR-05 — Resolvability.**
- **Purpose:** Ensure every dependency target exists.
- **Requirement:** Every declared dependency SHALL resolve to an existing governed document [Section 10.1, AI-SDOM-ARC-0001 (Section 8.2)].
- **Failure condition:** A dependency target does not exist as a governed document.
- **Severity:** Critical.

**DSR-06 — Mandatory Citation Chain.**
- **Purpose:** Ensure the citation obligations of each class are met.
- **Requirement:** Every STD SHALL depend on at least one GOV document; every PRC on at least one STD; every TPL on a document of the class it templates; every REG on the class it records; every ADR on the documents that motivated or are affected; every QLT on the documents it validates [Section 5.2, AI-SDOM-ARC-0001 (Section 7.5-7.7)].
- **Failure condition:** A document of a class lacks its mandatory dependency.
- **Severity:** Critical.

**DSR-07 — Dependency Declaration Existence.**
- **Purpose:** Ensure every document declares its dependencies.
- **Requirement:** Every governed document SHALL contain a Dependencies section per [AI-SDOM-ARC-0001 (Section 7.3)], expressed as the front-matter `dependencies` field [Section 6.2].
- **Failure condition:** A document lacks a Dependencies declaration, or the declaration is misformatted.
- **Severity:** Critical.

**DSR-08 — Dependency Type Validity.**
- **Purpose:** Ensure dependency types are drawn from the defined set.
- **Requirement:** Every dependency SHALL carry one of the types defined in [Section 4.1] [Section 11.2].
- **Failure condition:** A dependency carries an undefined type.
- **Severity:** Major.

**DSR-09 — Type-Direction Compatibility.**
- **Purpose:** Ensure types do not weaken direction rules.
- **Requirement:** A dependency of any type SHALL satisfy the direction rules of [Section 5] [Section 4.3].
- **Failure condition:** A dependency satisfies the type rules but violates a direction rule.
- **Severity:** Critical.

**DSR-10 — No Deprecated Dependency for New Documents.**
- **Purpose:** Prevent new documents from depending on deprecated content.
- **Requirement:** A new document SHALL NOT declare a dependency on a deprecated document [Section 7.3, AI-SDOM-ARC-0001 (Section 20.3)].
- **Failure condition:** A new document depends on a deprecated document.
- **Severity:** Major.

**DSR-11 — No Retired Dependency.**
- **Purpose:** Prevent dependence on retired content.
- **Requirement:** A dependency SHALL NOT resolve to a retired document [Section 7.4, AI-SDOM-ARC-0001 (Section 20.3)].
- **Failure condition:** A declared dependency resolves to a retired document.
- **Severity:** Critical.

**DSR-12 — External Dependency Declaration.**
- **Purpose:** Ensure external dependencies are declared and pinned.
- **Requirement:** An external dependency SHALL be declared per [AI-SDOM-STD-0003 (Section 9)] and SHALL be pinned [Section 4.1].
- **Failure condition:** An external target is referenced without a declared, pinned external dependency.
- **Severity:** Major.

**DSR-13 — Version Expectation Validity.**
- **Purpose:** Ensure version expectations conform to versioning rules.
- **Requirement:** A version expectation on a dependency SHALL be a valid SemVer string per [AI-SDOM-STD-0004 (Section 4)] [Section 6.4].
- **Failure condition:** A dependency records an invalid or malformed version expectation.
- **Severity:** Minor.

**DSR-14 — Graph Acyclicity for Impact Analysis.**
- **Purpose:** Ensure impact analysis operates on a valid graph.
- **Requirement:** Impact analysis SHALL use the transitive closure of an acyclic graph [Section 8.3, Section 9.1].
- **Failure condition:** An impact analysis is computed over a graph containing a cycle.
- **Severity:** Critical.

**DSR-15 — Transitive Impact Identification.**
- **Purpose:** Ensure all impacted documents are identified.
- **Requirement:** A change SHALL identify every directly and transitively impacted document [Section 8.2-8.3, AI-SDOM-GOV-0002 (Section 6.1)].
- **Failure condition:** An impact assessment omits a transitively impacted document.
- **Severity:** Major.

**DSR-16 — Breaking Change Identification.**
- **Purpose:** Ensure breaking changes are identified.
- **Requirement:** A breaking change SHALL be classified as such in the impact assessment [Section 8.4, AI-SDOM-STD-0004 (Section 7.1)].
- **Failure condition:** A breaking change is misclassified as non-breaking.
- **Severity:** Critical.

**DSR-17 — Impact Assessment Recording.**
- **Purpose:** Ensure impact assessments are recorded with changes.
- **Requirement:** An impact assessment SHALL be recorded with the change per [AI-SDOM-GOV-0002 (Section 6.5)] [Section 8.6].
- **Failure condition:** A change is submitted without its impact assessment.
- **Severity:** Major.

**DSR-18 — Deterministic Validation.**
- **Purpose:** Ensure validation is reproducible.
- **Requirement:** Dependency validation SHALL be deterministic [Section 10.2, Section 3.8].
- **Failure condition:** A validator produces different results for the same input set.
- **Severity:** Major.

**DSR-19 — Metric Computation.**
- **Purpose:** Ensure metrics are computed from the dependency graph.
- **Requirement:** Dependency metrics SHALL be computed from the dependency graph per [Section 12].
- **Failure condition:** A reported metric cannot be reproduced from the dependency graph.
- **Severity:** Minor.

**DSR-20 — Self-Audit Recording.**
- **Purpose:** Ensure manual validation is recorded.
- **Requirement:** Where automated validation is absent, dependency rules SHALL be self-audited and the results recorded in the document's Self-Audit Log [Section 10.3].
- **Failure condition:** A document with dependencies lacks a dependency self-audit record.
- **Severity:** Minor.

---

## 14. Migration Guidance

14.1 **Existing repositories.** A repository migrating to this standard SHALL reconcile every document's Dependencies section against its references [Section 6.1], and SHALL classify each dependency's type [Section 4.1]. Discrepancies SHALL be resolved before the dependency gate is applied [Section 10].

14.2 **Legacy dependencies.** Legacy dependencies (undeclared references, unresolved targets, or dependencies that violate the direction rules) SHALL be remediated by: (a) adding the missing declaration, (b) re-pointing or removing the invalid dependency, or (c) if a dependency target is missing, creating the target document or removing the reference. Remediation SHALL follow the change management of [AI-SDOM-GOV-0002].

14.3 **Architecture evolution.** When the repository grows per [AI-SDOM-STD-0006 (Section 10)] and [AI-SDOM-GOV-0003], new layers and classes SHALL be introduced in dependency-consistent positions: a new layer SHALL be appended after the highest existing layer [AI-SDOM-ARC-0001 (Section 13.2)], preserving the downward dependency rule [Section 5.2]. Existing dependencies SHALL NOT be re-pointed as a side effect of structural change [AI-SDOM-STD-0006 (Section 10.5)].

14.4 **Compatibility.** This standard is additive with respect to [AI-SDOM-ARC-0001 (Section 7)] and [AI-SDOM-STD-0003]: it specifies the dependency model and SHALL NOT be read to change the constitutional dependency rules or the cross-reference syntax.

---

## 15. Examples

15.1 **Correct dependency declaration.** A Layer 2 standard depending on its authorities, shown in the derived tooling form of [Section 11.1]:

```yaml
document:
  identifier: AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD
  dependencies:
    - target: AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
      type: normative
      rationale: constitutional dependency rules
    - target: AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD
      type: normative
      rationale: canonical cross-reference syntax
    - target: AI-SDOM-STD-0004-SEMANTIC-VERSIONING-STANDARD
      type: informative
      rationale: version expectations on dependencies
```

15.2 **Incorrect declarations.**

```yaml
dependencies:
  - target: AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
    type: undefined-type        # WRONG: not in [Section 4.1] [DSR-08]
  - target: AI-SDOM-QLT-0001-ARCHITECTURE-VALIDATION-STANDARD
    type: normative             # WRONG: cross-cutting dependency from layered doc [DSR-03]
```

```
Dependencies: [AI-SDOM-STD-0004-...]   # WRONG: not the canonical bullet form [DSR-07]
```

15.3 **Circular examples.**

```
A -> B -> C -> A     # cycle: A transitively depends on itself [DSR-04]
A -> B -> C          # acyclic: acceptable
```

15.4 **Layer examples.**

```
# Correct: STD (L2) depends on GOV (L1) and ARC (L0) and STD (L2)
STD-0007 -> GOV-0001, ARC-0001, STD-0003

# Incorrect: STD (L2) depends on REG (L5) — upward dependency [DSR-02]
STD-000X -> REG-0001
```

15.5 **Cross-cutting examples.**

```
# Correct: QLT depends on layered documents only
QLT-0001 -> ARC-0001, STD-0001

# Incorrect: QLT depends on QLT [DSR-03]
QLT-0001 -> QLT-0002
```

---

## 16. Relationship to Other Standards

16.1 This standard is one of the Layer 2 standards. Its relationship to the other governed documents is:

| Document | Relationship |
|----------|--------------|
| [AI-SDOM-ARC-0001] | Constitutional authority for the dependency rules between classes (§7), layering (§3), taxonomy (§4), change impact (§10), dependency acyclicity gate (§18.3), and automation boundaries (§19). This standard is the canonical specification of the dependency model, without restating §7. |
| [AI-SDOM-GOV-0001] | Governance of dependency-affecting changes and the document lifecycle; this standard defines dependency management only and defers governance. |
| [AI-SDOM-GOV-0002] | Change management and impact assessment that dependency impact analysis (§8) references and operationalizes. |
| [AI-SDOM-GOV-0003] | The product roadmap that informs dependency and architecture evolution planning (§14). |
| [AI-SDOM-STD-0001] | Document structure requirements, cross-reference conventions (§7), and the Dependencies section obligation. |
| [AI-SDOM-STD-0002] | The `dependencies` metadata field, data types, and YAML representation referenced by the machine-readable schema (§11). |
| [AI-SDOM-STD-0003] | Canonical cross-reference syntax, reference types, external references, and the severity scale (§11.1) referenced throughout. |
| [AI-SDOM-STD-0004] | Version grammar and compatibility classification referenced by version expectations (§6.4) and breaking/non-breaking impact (§8.4-8.5). |
| [AI-SDOM-STD-0005] | Naming conventions for the artifacts that carry dependency data; canonical identifiers used as dependency targets. |
| [AI-SDOM-STD-0006] | Repository structure and growth rules referenced by architecture evolution (§14) and metric-informed structure decisions (§12.1). |
| Document Development Procedure | Operational lifecycle that executes dependency self-audit. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Register (REG-0001) | Identifier authority and document inventory supporting resolvability and version expectations. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Architecture Validation Standard | Enforces dependency rules (dependency validation gate; G01 layer dependency compliance). Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| Repository Certification Standard | Defines certification levels that dependency compliance attains. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |

16.2 **Division of authority.** This standard defines dependency management only. It SHALL NOT duplicate:
- The constitutional dependency rules between classes (governed by [AI-SDOM-ARC-0001 (Section 7)]).
- The canonical cross-reference syntax, resolution, forward references, external references, and reference lifecycle (governed by [AI-SDOM-STD-0003]).
- The `dependencies` metadata field definition and YAML representation (governed by [AI-SDOM-STD-0002 (Section 3, Section 7)]).
- Version grammar, increment rules, and compatibility classification (governed by [AI-SDOM-STD-0004]).
- Naming conventions (governed by [AI-SDOM-STD-0005]).
- Repository structure and directory placement (governed by [AI-SDOM-STD-0006]).
- Governance of dependency changes, decision rights, and approval processes (governed by the GOV class and [AI-SDOM-ARC-0001 (Section 15)]).
- Procedural steps for executing impact analyses or migrations (governed by the PRC class).
- Certification criteria applied to dependency compliance (governed by the QLT class).

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
| 0.1.1   | 2026-08-01 | —      | Applied Phase 2J finding MAJ-1: added §11.5 clarifying that the dependency object schema is a derived tooling representation and the front-matter `dependencies` field remains a flat list of identifiers per STD-0002; annotated §15.1 as the derived tooling form. | Pending |
| 0.1.0   | 2026-08-01 | —      | Initial dependency management standard | Pending |

---

## Self-Audit Certification

This document has been audited against all applicable rules in [AI-SDOM-ARC-0001], [AI-SDOM-GOV-0001], [AI-SDOM-GOV-0002], [AI-SDOM-GOV-0003], [AI-SDOM-STD-0001], [AI-SDOM-STD-0002], [AI-SDOM-STD-0003], [AI-SDOM-STD-0004], [AI-SDOM-STD-0005], and [AI-SDOM-STD-0006], and all applicable gates in the Architecture Validation Standard.

### ARC-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §2.1 | Single Concern Principle | PASS | Pure dependency-management specification. §1.1 and §16.2 exclude governance, procedures, architecture, naming, metadata, versioning, and reference content. |
| §2.3 | Separation of Concerns | PASS | §1.1 and §16.2 exclude content owned by other standards; dependency rules only. |
| §3 | Layering | PASS | §5 operationalizes the layer direction; no layer rule introduced. |
| §4 | Taxonomy | PASS | §6 references the classes; no new class introduced. |
| §5 | Identifier scheme | PASS | §11.2 uses canonical identifiers as dependency targets; no identifier rule restated. |
| §7 | Dependency rules | PASS | §5 references §7.1-§7.2; §9 references §7.4; §6 references §7.3; no constitutional rule restated. |
| §8 | Cross-reference rules | PASS | §4.1 and §13 reference [AI-SDOM-STD-0003] for syntax; no syntax restated. |
| §9 | Versioning | PASS | §6.4 and §8.4-8.5 reference [AI-SDOM-STD-0004]; no version rule restated. |
| §10 | Change impact | PASS | §8 operationalizes §10 impact assessment by reference; no governance added. |
| §18.3 | Mandatory gates | PASS | §10 and §13.2 reference the dependency validation gate without redefining pass/fail criteria. |
| §19 | Automation boundaries | PASS | §11.4 defines parser expectations; no automation authority granted. |
| §20 | Repository evolution | PASS | §7 and §14 reference §20.2-§20.4; no lifecycle rule restated. |

### GOV-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §2.3 | Governance vs. technical content | PASS | §16.2 defers all governance to the GOV class; no roles, approval processes, or decision rights defined. |

### GOV-0002 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §6 | Impact assessment | PASS | §8 references §6 for impact assessment; no procedural content added. |

### GOV-0003 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| Roadmap alignment | PASS | §14 references the roadmap for evolution planning; no roadmap content duplicated. |

### STD-0001 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §3 | Front matter | PASS | YAML front matter present with identifier, title, version, lifecycle-state, layer, dependencies, tags, and ai-assistance. |
| §7 | Cross-reference conventions | PASS | §6.1 references §7.4 for the Dependencies obligation; no convention restated. |
| §8 | Self-audit | PASS | This section present; all applicable gates audited. |

### STD-0002 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §3 | Field registry | PASS | `dependencies` field used per the registry; no other extension fields. |
| §7 | YAML representation | PASS | §11.1 uses YAML per the representation rules. |

### STD-0003 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §11.1 | Severity scale | PASS | §13.1 references the scale, not restates it. |
| §5 | Canonical references | PASS | All formal references use the canonical form `[AI-SDOM-CLASS-NNNN]` or `[AI-SDOM-CLASS-NNNN (Section X.Y)]`. |

### STD-0004 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §4 | Version grammar | PASS | `version: 0.1.1` in front matter. |
| §7 | Compatibility classification | PASS | §8.4-8.5 reference the breaking/non-breaking classification; not restated. |

### STD-0005 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §5 | Document naming | PASS | Identifier `AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD`; filename `ai-sdom-std-0007-dependency-management-standard.md`. |

### STD-0006 Compliance

| § | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| §6 | Document placement | PASS | Document placed in 02-STANDARDS per the placement matrix. |

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

1. **Dependency-rule duplication boundary with ARC-0001 (Sections 4, 5):** [AI-SDOM-ARC-0001 (Section 7.1-7.2)] defines the constitutional dependency rules between classes. Reproducing them as original content would duplicate constitutional content. Resolved by referencing ARC-0001 §7 for the direction rules and cross-cutting isolation (§5.1-§5.3), and defining only the dependency types (§4), declaration requirements (§6), lifecycle (§7), impact model (§8), and metrics (§12) that operationalize the dependency model. §16.2 and the Self-Audit Certification record this boundary.

2. **Cross-reference duplication boundary with STD-0003 (Sections 4, 13):** [AI-SDOM-STD-0003] governs canonical syntax, reference types, external references, forward references, and the reference lifecycle. Resolved by referencing STD-0003 for all cross-reference syntax and lifecycle, and defining only the dependency-specific type classification (§4.1), declaration correspondence (§6.1), and dependency lifecycle (§7) that no existing document provides. Severity is referenced to STD-0003 §11.1 (§13.1).

3. **Metadata duplication boundary with STD-0002 (Sections 6, 11):** [AI-SDOM-STD-0002 (Section 3, Section 7)] defines the `dependencies` field, its type, and its YAML representation. Resolved by referencing STD-0002 for the field and representation, and defining only the dependency-specific schema for dependency objects (type, rationale, version) in §11.1-§11.2.

4. **Versioning duplication boundary with STD-0004 (Sections 6, 8):** [AI-SDOM-STD-0004] governs version grammar and compatibility classification. Resolved by referencing STD-0004 for version expectations (§6.4) and breaking/non-breaking classification (§8.4-§8.5), and defining only the dependency-specific impact model (direct/indirect/transitive, coupling) in §8.

5. **Impact-assessment overlap with GOV-0002 (Section 8):** [AI-SDOM-GOV-0002 (Section 6)] requires the impact assessment of changes. Resolved by referencing GOV-0002 for the impact assessment requirement and recording (§8.1, §8.6), and defining only the dependency-graph-based model of direct/indirect/transitive impact (§8.2-§8.3) and the metric definitions (§12).

6. **Severity scale (Section 13.1):** No governed document defines a severity scale for dependency defects. Resolved by referencing the four-level severity scale of [AI-SDOM-STD-0003 (Section 11.1)] rather than restating it.

7. **QLT reference constraint (Section 16):** The required relationship to the Architecture Validation Standard and the Repository Certification Standard conflicts with the adopted interpretation of [AI-SDOM-ARC-0001 (Section 7.1)], under which a layered document SHALL NOT reference a cross-cutting document by canonical identifier. Resolved by referencing both QLT documents by descriptive title only, in §16, consistent with established precedent.

8. **Circular-dependency exception policy (Section 9):** The question of whether cycles could be permitted by exception was resolved against it. [AI-SDOM-ARC-0001 (Section 7.4)] prohibits cycles, so no exception mechanism exists to define; §9.4 instead directs shared content to a lower-layer document, which is the dependency-consistent resolution that does not require an exception.

9. **Assumed-delivery source control:** This document is delivered as an uncommitted working-tree change for review and approval (phase contract: no Git operations). Its `lifecycle-state` is Active and version 0.1.0; ratification and the associated Git tag per [AI-SDOM-ARC-0001 (Section 11.6)] will follow approval per [AI-SDOM-ARC-0001 (Section 15.3)].

10. **No Dependency-Management regressions and self-consistency:** This document's own dependency declaration complies with the rules it defines: each dependency (ARC-0001, GOV-0001, GOV-0002, GOV-0003, STD-0001 through STD-0006) is referenced in the body (DSR-01), all targets are at layers 0-2 (DSR-02), the graph is acyclic (DSR-04), and every dependency is resolvable (DSR-05). The QLT, PRC, and REG documents are referenced descriptively only, per the layer bound. Every DSR rule was verified against the section it references during self-audit.

11. **Phase 2J consolidation finding MAJ-1 (Sections 11, 15):** The Phase 2J Layer 2 Consolidation Review identified that the dependency object schema (§11.1-§11.2) did not state where it resides relative to the canonical `dependencies` field of STD-0002. Resolved in version 0.1.1 by adding §11.5, which clarifies that the object schema is a derived tooling representation, that the front-matter `dependencies` field remains a flat list of identifiers per STD-0002, and that structured records stored in the metadata record require an `x-` extension field per STD-0002 §8. The §15.1 example is annotated as the derived tooling form. No new requirements were introduced; the change is a PATCH correction per STD-0004.
