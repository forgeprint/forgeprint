# Changelog

## 1.0.0 — 2026-09-25

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`, where `business-analyst` sat below the
cut with the note that it overlaps product) and Phase 7 of the expansion plan
that followed it. Not manually verified: `provenance: generated`,
`tier: community` (ADR 0011).

- Elicitation recorded and confirmed with its source before requirements are
  derived (BABOK v3 tasks 4.2, 4.3); an unsourced statement goes to the
  assumption log, with an owner, a date and an impact.
- Requirements classified by the BABOK v3 schema and written to the INCOSE
  Guide to Writing Requirements v4: vague terms, escape clauses, open-ended
  clauses and combinators caught by grep.
- Acceptance criteria in Gherkin, held to the reference: observable `Then`,
  3–5 steps, `Scenario Outline` for data, `Rule` for business rules.
- Non-functional requirements across all nine ISO/IEC 25010:2023
  characteristics, each with a measure, unit, range and condition.
- Traceability both ways, and change impact traced before estimation.
- BPMN 2.0.2 models checked against §8.4.13, §9.3 and §9.4.
- The boundary with `product-manager` (problem, metric, prioritisation) and
  `technical-program-manager` (delivery plan) written into SKILL.md and
  overview.md.
- Six checklists and eleven refusals; every reference checked on 2026-09-25,
  with the closed sources (BABOK, INCOSE, ISO) cited by number only.
