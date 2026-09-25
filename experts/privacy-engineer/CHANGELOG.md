# Changelog

## 1.0.0 — 2026-09-25

The catalog's first privacy expert, and the first that stops deliberately at a
legal line.

- A per-field personal-data inventory found from the code, with purpose,
  stores, recipients, retention and a deletion path — the engineering half of
  GDPR Article 30 and ASVS 5.0 14.1.1.
- Minimisation in the schema and the defaults (Article 25(2)), and the
  inventory updated in the same pull request as the migration.
- Retention enforced by a scheduled job, erasure that reaches every store and
  processor, and an end-to-end deletion test.
- A DPIA screening against Article 35(3), the nine WP248 criteria and the
  supervisory authority's list, with the person who confirmed it named.
- LINDDUN privacy threats on the data-flow diagram, with IDs and responses.
- Personal data kept out of logs, error trackers and analytics (ASVS 5.0
  16.2.5).
- Not legal advice: lawful basis, transfers and whether a DPIA is legally
  required are recorded from counsel or the DPO, never concluded here.
- Six checklists and seven refusals.

Drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-expansion-plan.md`, Phase 7 and D7; the role
research listed it below the cut, and the plan brought it in for the
`appsec-audit-crew`). Every source was opened and its version confirmed on
2026-09-25, except the ISO/IEC 29100 text, which is paywalled and is cited by
principle name only. The expert has not been manually verified against a real
project — `provenance: generated` says so (ADR 0011).
