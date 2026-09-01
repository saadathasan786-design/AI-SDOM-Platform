# ADR Template — Architecture Decision Record

Per [AI-SDOM-STD-0008 (Section 6, Section 7)] and [AI-SDOM-PRC-0002
(Section 7.6)], an ADR is authored with the following front matter and
mandatory section order. This template is instantiated when a governed
architecture decision is proposed.

## Front Matter

```yaml
---
status: Proposed
layer: <0 | 1 | 2 | 3>
dependencies:
  - AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT
  - <other governed documents, layers 0..N>
tags:
  - <kebab-case tags>
ai-assistance: "<tool> <date>: <note>"
---
```

Rules enforced by [AI-SDOM-ARC-0001 (Section 7.6)] and [AI-SDOM-STD-0002
(Section 3.5)]:

- An ADR SHALL carry a `status` field (Proposed / Accepted / Superseded /
  Retired) and SHALL NOT carry `version` or `lifecycle-state`.
- The `layer` value reflects the decision's architectural impact.
- An ADR SHALL NOT reference another ADR or a QLT document by canonical
  identifier per [AI-SDOM-ARC-0001 (Section 7.2)].

## Mandatory Section Order

| Order | Section | Content |
|-------|---------|---------|
| 1 | Title | Concise decision statement |
| 2 | Status | Lifecycle state |
| 3 | Context | Motivating situation and verified facts |
| 4 | Decision | The decision, stated as normative SHALL statements |
| 5 | Consequences | Positive and negative consequences |
| 6 | Alternatives Considered | At least one rejected alternative with rationale |
| 7 | References | Canonical references per [AI-SDOM-STD-0003] |

## Identifier

The ADR identifier is drawn from the Repository Register (05-REGISTERS). The
`{SHORT-NAME}` SHALL be a kebab-case slug per [AI-SDOM-STD-0005]. The
filename SHALL mirror the identifier in lowercase form.
