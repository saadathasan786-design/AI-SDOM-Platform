# Elementor Integrity Incident and Evidence Record

**Identifier:** AI-SDOM-REG-1000-ELEMENTOR-INTEGRITY-INCIDENT-AND-EVIDENCE
**Version:** 1.0.1
**Lifecycle State:** Active
**Layer:** 5
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT]
**ai-assistance:** opencode (big-pickle) 2026-09-05: initial evidence record; opencode (big-pickle) 2026-09-05: 1.0.1 hashing-convention clarification and live-state verification

This register is the first REG "filled entry" (reserved range 1000-9999 per
[AI-SDOM-ARC-0001 (Section 12)]). It records the Page 12 Elementor integrity
incident, the recovery evidence, and the required integrity-gate behavior that
regression tests now pin. It is an incident and evidence record — not a
procedure and not a decision. It is inventoried alongside the master
[AI-SDOM-REG-0001-REPOSITORY-REGISTER].

## Incident Record

### Summary

| Field | Value |
|-------|-------|
| Incident identifier | AI-SDOM-INC-0001 (Elementor Page 12 Integrity) |
| Scope | Live Elementor document, WordPress Page 12 |
| Date (detection + repair) | 2026-09-04 (UTC) |
| Record created | 2026-09-05 |

### Symptom

The front page's main body was absent while the site header and footer
remained rendered. Elementor did not render the page body.

### Root Cause

The stored `_elementor_data` JSON for Page 12 was malformed: a trailing
corrupt segment (`,...]]`) made the document unparseable. The governed
mutation tooling must therefore treat any malformed or truncated
`_elementor_data` baseline as a hard precondition failure. The integrity
gate that enforces this (throw before planning/validation/write) originates
in commit `e3e2d4b`; this change adds regression coverage that proves the
gate holds with ZERO writes and ZERO persisted snapshots.

### Evidence (hashes and lengths)

**Hashing convention:** every incident hash recorded below is a **plain SHA-256
of the raw stored `_elementor_data` string** — the exact bytes of the
`meta._elementor_data` value as WordPress stores and returns it. The malformed
baseline was unparseable JSON, so no parsed/canonical form could exist for it;
the raw-string convention is therefore the only one defined for the incident.

| Field | Value |
|-------|-------|
| Malformed document raw length | 8520 characters |
| Repaired document raw length | 8515 characters |
| Original (malformed) raw-string SHA-256 | `f551597de603209b86078b5ccf7c6ac35d6fd6952b8c070fdce9c027bc23b975` |
| Repaired raw-string SHA-256 | `fca06f44e30c3fad431770c3e4214fa7aebec209b51224aa2b6d19d9a46d225e` |
| Pre-repair rollback snapshot | `snap_2026-09-04T21-52-09-681Z_6569cb82` (Memory scope `test-website-ai-sdom`) |

**Live-state verification (2026-09-05):** a read-only `GET /wp/v2/pages/12`
returned `_elementor_data` with raw length **8515 characters**, and its
raw-string SHA-256 exactly equals the repaired baseline `fca06f44…` above —
the document IS the repaired state and is unchanged since
`2026-09-04T21:54:35` (revision 2635). `wp_elementor_inspect` on page 12
reports `element_count: 17`, `is_elementor: true`, and
`document_sha256: ccd5d8c58ebdc093dad489d0f6e7d6685667692446981979b8703b7825d63fee`.

> **Convention note:** `wp_elementor_inspect`'s `document_sha256` is NOT a
> raw-string hash. It is the SHA-256 of the canonically re-serialized parsed
> JSON (`sha256Stable(JSON.parse(_elementor_data))`, keys recursively sorted).
> It is therefore **not directly comparable** to the raw-string hashes above;
> to check the live document against this record, recompute the raw-string
> SHA-256 of `meta._elementor_data`.

### Recovery Action

An exceptional, controlled direct REST write of `meta._elementor_data` only
was used to repair the malformed document. This was outside the normal
governed Elementor mutation workflow because that workflow correctly refused
the malformed baseline. The write was limited to the single supported,
verified mutation surface; no other site content was modified. The retained
pre-repair snapshot provided rollback evidence. Post-repair verification
(parse + structural + hash match against the repaired baseline) succeeded.

## Required Behavior (now regression-pinned)

The Elementor mutation service MUST reject a malformed or truncated
`_elementor_data` baseline with a clear integrity/parsing error BEFORE any
planning, validation, write, verification, or rollback, and MUST NOT persist a
Memory snapshot for such a refusal.

Regression coverage added in this change — `mcp-server/test/elementor.test.js`:

1. `patch on a malformed _elementor_data baseline rejects, issues ZERO writes, and persists ZERO snapshots`
2. `patch on a truncated _elementor_data baseline rejects, issues ZERO writes, and persists ZERO snapshots`
3. `the same counting harness performs EXACTLY one write and one snapshot on a valid baseline`

Claims asserted by the tests: clear `/malformed _elementor_data/` error
surfaced; zero mutation writes against the live REST API; zero snapshots in
the Memory scope; and (contrast) exactly one write and one snapshot when the
baseline is valid — proving the parse gate, not the test harness, prevents
mutation.

## References

| Reference | Purpose |
|-----------|---------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Layer 0 dependency; §12 identifier ranges; §12.2 registry authority |
| [AI-SDOM-REG-0001-REPOSITORY-REGISTER] | Master inventory recording this register's identifier |
| [AI-SDOM-PRC-0004-ELEMENTOR-MUTATION-PROCEDURE] | Governed mutation workflow whose integrity precondition refused the malformed baseline; procedure requirements are referenced descriptively |
| [AI-SDOM-ADR-0001-GOVERNED-ELEMENTOR-DOCUMENT-MUTATION] | Decision constraining mutation to the standard WordPress REST API (descriptive reference; ADRs are referenced descriptively) |

## Amendment Record

| Version | Date | Author | Description of Change | Approval |
|---------|------|--------|-----------------------|----------|
| 1.0.1 | 2026-09-05 | opencode (big-pickle) | Clarified the hashing convention: the recorded incident hashes are plain SHA-256 of the raw stored `_elementor_data` string, so they are not comparable to `wp_elementor_inspect`'s canonical (`sha256Stable`) `document_sha256`. Recorded the live-state verification (raw length 8515, raw-string SHA-256 matches the repaired baseline, unchanged since the repair) and the current inspect hash `ccd5d8c5…`. | Pending |
| 1.0.0 | 2026-09-05 | opencode (big-pickle) | Initial evidence record for the Page 12 Elementor integrity incident, recovery evidence, and regression-pinned integrity-gate behavior. | Pending |