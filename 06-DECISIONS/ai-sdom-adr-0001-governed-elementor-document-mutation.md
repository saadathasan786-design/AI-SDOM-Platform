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
ai-assistance: "opencode (deepseek-v4-flash-free) 2026-08-29: assessment + ADR draft"
---

# Governed Elementor Document Mutation via the Standard WordPress REST API

## Status

Proposed

## Context

The AI-SDOM controlled repository must provide a governed capability to
inspect and, where governed, modify the Elementor document content of an
existing WordPress page (for example, editing widget text, or replacing an
image reference) through the certified wp-mcp-server adapter.

Read-only REST route inspection of the connected test site
(`http://test-website-ai-sdom.com`) established the following verified facts:

- The Elementor plugin exposes NO authenticated REST endpoint for reading an
  existing document's `_elementor_data`.
- The Elementor plugin exposes NO authenticated REST endpoint for updating an
  existing document's `_elementor_data`.
- The only supported mutation surface verified on the site is the standard
  WordPress REST API: `GET/POST /wp/v2/pages/{id}` using the writable
  `meta._elementor_data` field.
- A document read via `GET /wp/v2/pages/{id}?context=edit` may be returned
  with `meta._elementor_data` truncated for at least one live page on the
  connected site (page 12 "Home" returns a server-truncated, non-parseable
  value), while other Elementor pages return the full, parseable value. The
  governed reader MUST therefore refuse to operate on any read that does not
  parse as a complete, structurally coherent JSON array, rather than risk
  overwriting a document with partial data.

The certified v1.0.0 wp-mcp-server is the only adapter that holds an
authenticated WordPress REST client (`mcp-server/wp-client.js`), the Project
Knowledge Graph, and the Memory store. It is the correct host for this
capability (see Consequences).

## Decision

Elementor document content mutations SHALL be performed through the standard
WordPress REST API (`GET/POST /wp/v2/{post_type}/{id}` with the writable
`meta._elementor_data` field) by a governed capability of the existing
wp-mcp-server adapter, implemented as a third Platform API module
(`mcp-server/elementor.js`) exposed as the `wp_elementor_inspect` and
`wp_elementor_patch` MCP tools.

The governed mutation SHALL follow an inspect -> snapshot -> validate ->
(dry-run | write -> verify -> rollback) workflow that:

- refrains from operating on any `_elementor_data` read that does not parse
  completely and pass structural validation;
- refuses structural changes (element ids, element order, element counts,
  `elType`/`widgetType` identity, `__globals__` keys, image ids) unless
  explicitly allowed;
- supports a dry-run mode that reports the computed change without writing;
- guards against stale writes by comparing an optional expected document
  SHA-256 against the current document before writing;
- verifies the write by re-reading and comparing the document hash, and
  rolls back to the pre-write document on verification failure.

Validation of this capability SHALL be split into an offline suite and an
opt-in live validation test:

- `npm test` runs the offline suite (`mcp-server/test/*.test.js`), including
  the Elementor unit tests, with no live WordPress connection required, and
  is suitable for CI;
- `npm run test:live` runs the deliberate live validation test
  (`mcp-server/test-live/elementor-mcp-real-invocation.test.js`), which
  performs read-only `wp_elementor_inspect` calls against a connected
  WordPress site, and SHALL be opt-in rather than part of the default
  offline suite or of CI.

The live validation test requires working WordPress credentials
(`WP_BASE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`), normally supplied through
the local `.env`. Credentials SHALL NOT be committed to the repository.

## Consequences

Positive:

- Adds a governed, reversible mutation surface to the certified adapter with
  no new transport, no new authentication, and no functional change to any
  existing tool (additive-only).
- Uses a WordPress-core contract (`wp/v2/pages/{id}` + `meta._elementor_data`)
  rather than a version-specific Elementor REST route, so it is not tied to
  the Elementor plugin's own REST namespace, which may change between
  installations/versions.
- The SHA-256 + rollback semantics reuse primitives already provided by
  `mcp-server/memory-store.js` and mirror the transactional semantics already
  certified in the Generator Framework executor.

Negative:

- `_elementor_data` is treated as an opaque-but-structured JSON document; the
  Elementor schema may vary per installation, so the structural guard is
  intentionally conservative and may refuse edits it cannot classify as
  simple.
- Elementor REST capabilities are NOT standardized across WordPress
  installations, plugin versions, or free/Pro editions; the decision is
  grounded in the verified behavior of the connected test site and MUST be
  re-verified on any other connected site.
- The read side may return truncated `_elementor_data` for some large
  documents on some sites; such documents are refused (safe failure) rather
  than edited.

## Alternatives Considered

1. A dedicated separate Elementor MCP server. Rejected: would duplicate the
   authenticated client, auth configuration, and Memory wiring of the
   certified wp-mcp-server, violating the repository's dependency-direction
   and no-unnecessary-duplication discipline. Elementor is not a second
   "site" requiring its own connection; it is a data format on the same pages.
2. Mutating `_elementor_data` by driving Elementor's own REST `documents`
   namespace. Rejected: the connected site exposes no content read/write
   route in that namespace (only a media-import POST), so there is nothing to
   call.
3. Whole-document hand-off (AI rewrites the entire `_elementor_data` and
   writes it back). Rejected: risks introducing unintended structural drift
   and cannot be verified by a hash comparison; the minimal-diff, guarded
   single-path mutation is safer.
4. Explore the truncated-read page by rewriting it unconditionally. Rejected:
   overwriting a document read from an unreliable/truncated source risks data
   loss; the safe failure is to refuse.

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

## Self-Audit Log

1. **Identifier authority (PRC-0002 Section 7.4):** The ADR identifier is drawn
   from the Repository Register. As ADR-0001 is the first ADR in this
   repository, the register enumeration is seeded by this record; subsequent
   ADRs draw the next identifier from the register. AI assistance did not
   invent an arbitrary identifier; it is the sequential first value within the
   ADR reserved range 0001-9999.
2. **Layer impact (PRC-0002 Section 7.2):** This decision affects the certified
   wp-mcp-server adapter (an implementation artifact, Layer 1). Governance
   Board escalation per [AI-SDOM-ARC-0001 (Section 15.5)] applies where
   required by policy.
3. **Cross-references (PRC-0002 Section 7.6):** This ADR references only ARC
   and STD documents (layers 0-2). It does not reference another ADR or a QLT
   document. The Repository Register is referenced descriptively.
4. **At least one alternative with rejection rationale (PRC-0002 Section
   8.2):** Four alternatives are documented with rationale.
5. **Positive and negative consequences (PRC-0002 Section 8.2):** Both are
   recorded under Consequences.
6. **Verified grounding:** The Context facts were established by read-only
   REST route inspection of the connected test site, not by assumption.
   Human verification of cross-references is required before submission per
   [AI-SDOM-ARC-0001 (Section 14.5)].
