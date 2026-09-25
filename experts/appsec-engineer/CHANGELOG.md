# Changelog

## 1.0.0 — 2026-09-25

The catalog's first expert that owns security before the code is written.

- A threat model as a committed file answering the Threat Modeling Manifesto's
  four questions: a data-flow diagram with trust boundaries, STRIDE per element
  that crosses one, one response per threat, and revisit triggers.
- Security requirements per feature from OWASP ASVS 5.0 at a stated level, each
  written as an observable outcome, with the chapters that do not apply listed
  and explained.
- The documentation ASVS 5.0 asks for up front — authorization rules, input
  validation, key management, secrets, remediation time frames, SBOM, logging
  inventory — as design decisions, not afterthoughts.
- A scanning policy: secret, dependency and SAST scanning pinned in CI, with
  failing severities, deadlines, a triage owner and expiring suppressions.
- A test per requirement in the project's own suite, named for the ASVS ID,
  with an authorization matrix and a cross-tenant object test.
- Refuses exploit development and attacks on any system; penetration testing
  stays out of the catalog (expansion plan D8). The boundary with
  `security-reviewer` is written into both `SKILL.md` and `overview.md`.
- Five checklists and eight refusals.

Drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, row 26, and
`docs/research/2026-09-24-expansion-plan.md`, Phase 7, D7 and D8). Every source
was opened and its version confirmed on 2026-09-25. The expert has not been
manually verified against a real project — `provenance: generated` says so
(ADR 0011).
