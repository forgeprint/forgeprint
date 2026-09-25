# Changelog

## 1.0.0 — 2026-09-25

The catalog's site reliability engineer. Per decision D18 of the 2026-09-24
expansion plan it also owns incident handling and the postmortem; there is no
separate incident-commander expert.

- SLOs as files: OpenSLO `openslo/v1` documents with a ratio indicator (a
  good-events query over a total-events query), a window and a target,
  validated by `oslo validate`.
- An error budget policy agreed before it is needed: what happens at 50%,
  at 100%, and who decides the exceptions.
- Paging on burn rate, not on causes: the SRE Workbook's multiwindow,
  multi-burn-rate table (14.4 over 1h/5m, 6 over 6h/30m, 1 over 3d/6h as a
  ticket).
- Runbooks whose every step has an expected result and a check.
- Incident handling with named roles (incident commander, operations,
  communications), a live incident document, a declared start and end, and
  NIST SP 800-61 Rev. 3 as the frame for anything that turns out to be a
  security incident.
- Blameless postmortems with a timeline, impact in SLO terms, contributing
  factors and actions that each have an owner, a priority and a ticket.
- Ten refusals and six checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`, row 25). Every source was read on
2026-09-25. The expert has not been manually verified against a real service
— `provenance: generated` says so (ADR 0011).
