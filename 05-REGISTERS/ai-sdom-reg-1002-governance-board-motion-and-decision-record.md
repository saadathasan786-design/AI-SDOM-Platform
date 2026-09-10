# ADR-0002 Governance Nonconformance Board Motion and Decision Record

**Identifier:** AI-SDOM-REG-1002-ADR-0002-GOVERNANCE-NONCONFORMANCE-BOARD-MOTION-AND-DECISION-RECORD
**Version:** 1.0.0
**Lifecycle State:** Active
**Layer:** 5
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT], [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY], [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY], [AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE], [AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE], [AI-SDOM-REG-0001-REPOSITORY-REGISTER]
**ai-assistance:** opencode (big-pickle) 2026-09-11: initial Governance Board motion and decision record for the ADR-0002 governance nonconformance

This register is the third REG "filled entry" (reserved range 1000-9999 per
[AI-SDOM-ARC-0001 (Section 12)]). It establishes the Governance Board's
motion and decision record for AI-SDOM-NC-0001 — the formal governance
nonconformance for the ADR-0002-GOVERNED-EXECUTION-LAYER 48-hour minimum
review period violation lodged by [AI-SDOM-REG-1001-ADR-0002-GOVERNANCE-NONCONFORMANCE-AND-GOVERNANCE-BOARD-SUBMISSION].

This record identifies the motion currently before the Board and the evidence
of record upon which the Board's disposition decision will rest. It is a
record — not a decision, not a disposition, and not a procedure. It does not
on its own change ADR-0002's status or "clear it to govern." It is
inventoried alongside the master [AI-SDOM-REG-0001-REPOSITORY-REGISTER].

## Governance Board Motion Record

### Summary

| Field | Value |
|-------|-------|
| Nonconformance identifier | AI-SDOM-NC-0001 (ADR-0002 minimum review period violation) |
| Lodged by | AI-SDOM-REG-1001-ADR-0002-GOVERNANCE-NONCONFORMANCE-AND-GOVERNANCE-BOARD-SUBMISSION (2026-09-08) |
| Board disposition authority | [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §13.3-§13.4, §9 |
| Motion identifier | AI-SDOM-GOV-MOTION-0001 (disposition of AI-SDOM-NC-0001) |
| Motion status | Record established; Board vote Pending |
| Record created | 2026-09-11 |

### Motion

The Board SHALL determine a single disposition for AI-SDOM-NC-0001 that is
lawful under [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §13 and §9.
Permitted disposition routes are recorded without predetermination of
outcome:

1. **Reversal** — supersede ADR-0002-GOVERNED-EXECUTION-LAYER via a
   superseding ADR ([AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] §17.3,
   ADR status "Superseded by AI-SDOM-ADR-NNNN").
2. **Retroactive ratification** — ratify the already-taken action through the
   correct ratification process with the minimum review period satisfied
   ([AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §13.4(ii)).
3. **Document and resolve** — documentation of the violation and its
   resolution in an ADR, without waiving the violation
   ([AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §13.4(iii)).
4. **Governance exception** — a two-thirds Board vote granting a time-limited
   exception under [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §9.2
   (not permitted for a constitutional deviation without an ARC amendment per
   §9.5).

The disposition SHALL be recorded in a ratified ADR (the disposition ADR), as
required by [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §11.1
("Governance votes: pull request comments and ADRs"), §13.4, and
[AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] §15.7. Until the Board reaches a
recorded disposition, ADR-0002-GOVERNED-EXECUTION-LAYER remains Accepted but
is not "clear to govern" implementation of the governed execution layer.
Step 14D implementation remains blocked pending Board disposition.

### Board Procedure and Voting

| Field | Value |
|-------|-------|
| Board | 3 members: Saadat Hasan, Arfat Hasan, Lubna Saadat (term to 2027-07-31) |
| Ventilation / review period | Each rationale and ADR change 48 hours ([AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §5.3.2), unless an exception applies |
| Quorum | Two-thirds of eligible members ([AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §5.1.2): at least 2 of 3 |
| Simple (remediation disposition) | Majority (>50%) of votes cast, excluding abstentions ([AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §5.1.3) |
| Governance exception (§9.2) | Two-thirds of all members |
| Evidence of approval | Recorded in the pull request or an ADR ([AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] §15.7); verbal or offline approvals are not recognized |
| Acknowledgment deadline | 5 business days from lodgment ([AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] §13.3(i)) |

Votes on this motion will be recorded in the pull request approving this
record and, subsequently, in the disposition ADR. No vote is recorded or
presumed in this record; no member position is asserted.

The 48-hour minimum review period cited above applies to the governed
decision/ADR change and its approving pull request, not to the approval of
this record file itself, which as a REG filled entry carries no minimum review
period ([AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] §15.4).

## Evidence of Record

The Board's disposition decision rests on the following evidence, which is
referenced, not modified or cured:

- [AI-SDOM-REG-1001-ADR-0002-GOVERNANCE-NONCONFORMANCE-AND-GOVERNANCE-BOARD-SUBMISSION]
  (the formal Board submission; register record of the facts, timeline, and
  violation).
- ADR-0002-GOVERNED-EXECUTION-LAYER (the subject decision; referenced
  descriptively).
- [AI-SDOM-REG-0001-REPOSITORY-REGISTER] Self-Audit Log item 26 (the
  post-ratification governance audit finding).

## Limitation

This record does NOT: (a) change the status of ADR-0002-GOVERNED-EXECUTION-LAYER;
(b) grant, fabricate, or assume any waiver, exception, approval, disposition,
or retroactive ratification; (c) record any Board vote or member position;
(d) create or finalize the disposition ADR (ADR-0003) or any other ADR;
(e) amend [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT]; (f) modify any file in
`mcp-server/` or any WordPress site content; or (g) commit or push any change.

## References

| Reference | Purpose |
|-----------|---------|
| [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT] | Layer 0 dependency; §12 identifier ranges; §17.3 ADR supersession; §15.7 recorded approvals; §10.4 non-breaking review rhythm |
| [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY] | §13.1-§13.4 governance violation reporting, acknowledgment, and Board remediation; §9 exception governance; §11.1 governance records; §5.1.2 quorum; §5.1.3 majority; §5.3.1-§5.3.3 review and voting |
| [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY] | §8.1 minimum review period |
| [AI-SDOM-PRC-0001-DOCUMENT-DEVELOPMENT-PROCEDURE] | §14.1 governance violation reporting |
| [AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE] | §8.3 minimum review period; §13 ratification |
| [AI-SDOM-REG-0001-REPOSITORY-REGISTER] | Master inventory recording this register and the ADR-0002 finding (Self-Audit Log item 26); source of next-available identifier AI-SDOM-REG-1002 |
| AI-SDOM-REG-1001-ADR-0002-GOVERNANCE-NONCONFORMANCE-AND-GOVERNANCE-BOARD-SUBMISSION | The formal Board submission lodging AI-SDOM-NC-0001 (referenced descriptively) |
| ADR-0002-GOVERNED-EXECUTION-LAYER (Governed Execution Layer Architecture) | The subject decision (referenced descriptively; ADRs are referenced descriptively) |

## Self-Audit Log

The following issues were identified during the self-audit of this document and resolved before finalization:

1. **Dependency completeness ([AI-SDOM-ARC-0001 (Section 7.3)], [AI-SDOM-STD-0001 (Section 7.4)]):** The body and References canonically cite GOV-0001, GOV-0002, PRC-0001, PRC-0002, and REG-0001 in addition to ARC-0001. Resolved by declaring all six in the front-matter `dependencies` field. All referenced documents are at or below Layer 5 (this document's layer), so the reference bound is satisfied.

2. **Version / ratification convention ([AI-SDOM-STD-0004 (Section 8.1)], [AI-SDOM-GOV-0001 (Section 7.3)]):** This new REG filled entry is created at 1.0.0 with Amendment `Approval: Pending`, whereas the strict reading of STD-0004 §8.1 and GOV-0001 §7.3 would hold an un-ratified document at 0.Y.Z until first ratification. Resolved by following the established REG filled-entry precedent (REG-1000, REG-1001 are likewise 1.0.0 with `Approval: Pending`), keeping the recorded files consistent; the version will be reconciled to the Board's recorded ratification in the disposition ADR. The deviation is deliberate and noted in the Amendment Record.

3. **Review rhythm reference:** An early draft misattributed the 48-hour review period to ARC-0001 §5.3.2, which does not exist. Corrected to ARC-0001 §10.4 (non-breaking change minimum review), with the governance-side 48-hour requirement cited to GOV-0001 §5.3.2 / GOV-0002 §8.1 / PRC-0002 §8.3.

4. **Simple-majority definition ([AI-SDOM-GOV-0001 (Section 5.1.3)]):** The remediation-vote threshold was reworded from "majority of eligible members" to "majority (>50%) of votes cast, excluding abstentions" to match the governing definition exactly.

No other deviations were identified.

## Amendment Record

| Version | Date | Author | Description of Change | Approval |
|---------|------|--------|-----------------------|----------|
| 1.0.0 | 2026-09-11 | opencode (big-pickle) | Initial Governance Board motion and decision record for AI-SDOM-NC-0001: identifies the Board's disposition authority and permitted routes, the procedural/voting requirements, and the evidence of record, without recording any vote or disposition. | Pending |