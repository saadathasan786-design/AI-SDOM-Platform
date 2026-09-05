---
status: Proposed
layer: 1
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - AI-SDOM-STD-0001-DOCUMENTATION-STANDARD
  - AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD
  - AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD
  - AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD
  - AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD
tags:
  - elementor
  - architecture-decisions
  - document-creation
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-29: assessment + ADR draft; GPT-5.6 Luna 2026-09-05: architecture amendment assessment"
---

# Governed Elementor Document Creation and Mutation via the Standard WordPress REST API

## Status

Proposed

## Context

The AI-SDOM controlled repository must provide a governed capability to
inspect, create, and, where governed, modify Elementor document content
through the certified wp-mcp-server adapter.

Read-only REST route inspection of the connected test site
(`http://test-website-ai-sdom.com`) established the following verified facts:

- The Elementor plugin exposes NO authenticated REST endpoint for reading an
  existing document's `_elementor_data`.
- The Elementor plugin exposes NO authenticated REST endpoint for updating or
  creating an Elementor document's content in the verified `documents`
  namespace.
- The supported content surface verified on the site is the standard
  WordPress REST API: `GET/POST /wp/v2/{post_type}/{id}` using the writable
  `meta._elementor_data` field.
- WordPress page creation and Elementor document initialization are separate
  operations. A newly created WordPress page can be initialized as an
  Elementor document by writing `_elementor_edit_mode=builder`,
  `_elementor_template_type=wp-page`, and a validated `_elementor_data` JSON
  array through the WordPress REST API.
- A controlled test on temporary draft page 2645 accepted
  `_elementor_data=[]` with the required Elementor metadata, and subsequent
  governed inspection recognized the page as an Elementor document with zero
  elements. The deterministic document hash of `[]` was
  `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ab873c2f11161202b945`.
- A document read via `GET /wp/v2/pages/{id}?context=edit` may be returned
  with `meta._elementor_data` truncated for at least one live page on the
  connected site. The governed reader MUST therefore refuse to operate on
  any read that does not parse as a complete, structurally coherent JSON
  array, rather than risk overwriting a document with partial data.

The certified wp-mcp-server is the only adapter that holds an authenticated
WordPress REST client (`mcp-server/wp-client.js`), the Project Knowledge
Graph, and the Memory store. It is the correct host for this capability.

The architectural gap is therefore not transport or authentication. It is a
governed construction primitive that can take a validated Elementor document
specification and initialize a newly created WordPress page as an Elementor
document without bypassing AI-SDOM integrity controls.

## Decision

Elementor document content creation and mutation SHALL be performed through
the standard WordPress REST API (`GET/POST /wp/v2/{post_type}/{id}` with the
writable `meta._elementor_data` field) by governed capabilities of the
existing wp-mcp-server adapter, implemented in the existing Elementor
Platform API module (`mcp-server/elementor.js`).

The existing governed mutation capability SHALL remain exposed as
`wp_elementor_inspect` and `wp_elementor_patch`. A distinct creation
capability SHALL be added as `wp_elementor_create`; its operational contract
and implementation details SHALL be defined in the applicable Elementor
procedure before production use.

WordPress page creation SHALL remain a separate operation and may use the
existing `wp_create_post` capability. Elementor initialization SHALL then
write, at minimum, the required Elementor metadata and a validated
`_elementor_data` JSON array. The architecture does not require a new
Elementor-specific transport or authentication mechanism.

The governed creation workflow SHALL follow:

`DISCOVER -> SPECIFY -> VALIDATE -> DRY-RUN -> CREATE -> VERIFY -> SNAPSHOT`

Creation SHALL never write unvalidated Elementor JSON. Validation SHALL
include, at minimum:

- complete JSON parsing;
- array root validation;
- coherent Elementor element-tree structure;
- required fields for supported element/container/widget types;
- supported element and widget identity checks;
- deterministic document hashing before and after the operation.

Creation verification SHALL read the newly initialized document back through
the authenticated WordPress REST API and confirm that the resulting
Elementor document is parseable and structurally consistent with the
validated specification. The resulting document SHALL then be eligible for
Memory snapshotting and subsequent governed mutation.

The existing mutation capability SHALL retain its inspect -> plan -> validate
-> snapshot -> (dry-run | write -> verify -> rollback) workflow and its
existing integrity, structural, stale-baseline, dry-run, and rollback
safeguards. Extending the architecture to creation SHALL NOT weaken those
controls.

The creation capability is intentionally bounded. This decision authorizes
the governed creation primitive; it does NOT by itself authorize complete
website generation, arbitrary Elementor widget coverage, design-from-image
interpretation, responsive/global-style automation, WooCommerce-specific
construction, theme construction, or plugin construction. Those capabilities
require separately defined scope, procedures, tests, and architectural
review where applicable.

Validation of the implementation SHALL continue to use the established
offline suite and opt-in live validation approach. Any live creation test
MUST use a controlled disposable target and MUST NOT place credentials in the
repository.

## Consequences

Positive:

- Extends the certified Elementor architecture from safe mutation of existing
  documents to a governed primitive for initializing new Elementor documents,
  without introducing a second transport, authentication system, or adapter.
- Makes the missing construction boundary explicit: WordPress object creation
  and Elementor document initialization are separate governed operations.
- Preserves the existing integrity and rollback model and requires read-back
  verification before a newly created document is treated as usable.
- The controlled Page 2645 experiment demonstrates technical feasibility of
  Elementor initialization through WordPress REST meta rather than an
  Elementor-specific document-creation endpoint.

Negative:

- `_elementor_data` remains an opaque-but-structured JSON document whose schema
  can vary by Elementor installation and supported widgets; the creation
  validator must therefore begin with an explicitly supported subset rather
  than promise arbitrary Elementor authoring.
- Elementor capabilities are NOT standardized across WordPress installations,
  plugin versions, or free/Pro editions; the creation contract MUST be
  re-verified on any connected site where compatibility matters.
- Creation of a complete website remains a higher-level orchestration problem
  requiring page architecture, design specification, media strategy,
  navigation, templates, responsive behavior, and verification beyond this
  architectural primitive.

## Alternatives Considered

1. A dedicated separate Elementor MCP server. Rejected: would duplicate the
   authenticated client, auth configuration, and Memory wiring of the
   certified wp-mcp-server. Elementor is a data format on the same WordPress
   site, not a second site connection.
2. Mutating or creating documents through Elementor's own REST `documents`
   namespace. Rejected: the connected site exposes no verified document
   content creation or write route in that namespace.
3. Whole-document hand-off with no schema or structural validation. Rejected:
   it would permit malformed or unsupported Elementor documents to be written
   and would weaken the integrity guarantees already established for
   mutation.
4. Direct use of Elementor internal PHP/admin APIs as the construction
   surface. Rejected: this would bypass the authenticated WordPress REST
   adapter boundary and introduce installation/version-specific coupling not
   required by the verified REST capability.
5. A single monolithic "build website" capability as the first construction
   primitive. Rejected: it would combine page creation, document generation,
   design interpretation, media handling, navigation, and verification before
   the underlying governed Elementor creation primitive is independently
   defined and tested.

## References

| Reference | Relationship |
|-----------|--------------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] (Section 17) | Authorization for this Architecture Decision Record. |
| [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD] | Controlled-document structure applied to this record. |
| [AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD] | Canonical cross-reference syntax used throughout. |
| [AI-SDOM-STD-0005-NAMING-CONVENTION-STANDARD] | Identifier and filename conventions. |
| [AI-SDOM-STD-0006-REPOSITORY-STRUCTURE-STANDARD] | Placement of this record under 06-DECISIONS. |
| [AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD] | Dependency declaration rules applied to the Dependencies section. |
| Repository Register (05-REGISTERS) | Source of the ADR-0001 identifier. Referenced descriptively per [AI-SDOM-ARC-0001 (Section 7.1)]. |
| [AI-SDOM-PRC-0004-ELEMENTOR-MUTATION-PROCEDURE] | Existing operational procedure to be extended with the creation contract before production use. |
| `mcp-server/elementor.js` | Existing Elementor service and governed mutation implementation. |
| `mcp-server/elementor-tools.js` | Existing MCP adapter surface for governed Elementor inspection and mutation. |
| Controlled Page 2645 feasibility test | Evidence that a new WordPress draft page can be initialized as an Elementor document through REST meta and subsequently inspected by AI-SDOM. |

## Self-Audit Log

1. **Identifier authority (PRC-0002 Section 7.4):** This is an amendment of
   ADR-0001 and therefore retains the existing ADR identifier. No new ADR
   identifier was invented.
2. **Layer impact (PRC-0002 Section 7.2):** The decision affects the
   wp-mcp-server adapter and its Elementor construction boundary (Layer 1).
   Governance Board escalation per [AI-SDOM-ARC-0001 (Section 15.5)] applies
   where required by policy.
3. **Cross-references (PRC-0002 Section 7.6):** References remain limited to
   the applicable architecture, standards, procedure, implementation, and
   controlled feasibility evidence. The operational details of creation are
   intentionally deferred to PRC-0004.
4. **At least one alternative with rejection rationale (PRC-0002 Section
   8.2):** Five alternatives are documented with rationale, including a
   monolithic website-builder approach that is explicitly out of scope for
   this architectural primitive.
5. **Positive and negative consequences (PRC-0002 Section 8.2):** Both are
   recorded under Consequences.
6. **Integrity continuity:** The amendment preserves the existing requirement
   to reject malformed or truncated Elementor documents and does not authorize
   bypassing the established parse, structural, stale-baseline, dry-run,
   verification, or rollback safeguards.
7. **Verified grounding:** Creation feasibility was established through a
   controlled draft-page test on the connected test site; production
   capability has NOT yet been implemented or certified. Human verification
   of cross-references is required before submission per
   [AI-SDOM-ARC-0001 (Section 14.5)].
