# Changelog

## 1.0.0 — 2026-09-25

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`) and Phase 7 of the expansion plan that
followed it, where decision D19 makes this expert one of the three members of
`docs-crew`. Not manually verified: `provenance: generated`, `tier: community`
(ADR 0011).

- The structure of a documentation set, not its prose: an inventory first,
  sections typed by Diátaxis, a landing page per section, one canonical page per
  topic, and no orphan pages — enforced by MkDocs 1.6.1 validation settings and
  `--strict`.
- README, CONTRIBUTING, CODEOWNERS, ADRs and CHANGELOG where GitHub and their
  own conventions put them, once each.
- Docs as code: docs in the same pull request as the behaviour, a docs owner in
  `CODEOWNERS`, and one style guide named in an ADR.
- Docs CI: a strict build, lychee `lychee-v0.24.2` offline with fragments on
  every pull request and external links on a schedule, Vale v3.22.0 with a
  pinned style package.
- A version policy: latest stable by default, unsupported versions hidden and
  bannered rather than deleted.
- Boundaries with `technical-writer` (the pages) and the `api-designer` role
  (the contract reference is generated from) written into SKILL.md and
  overview.md.
- Five checklists and eleven refusals; every reference checked on 2026-09-25.
