# Changelog

## 1.0.0 — 2026-09-24

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), which listed `test-engineer` fourth by
demand, and from decision D2 of the expansion plan that followed it. Not
manually verified: `provenance: generated`, `tier: community` (ADR 0011).

- Red, green, refactor in the order of Kent Beck's _Canon TDD_, with the
  recorded failing run as the evidence that each test can fail.
- Cases derived by equivalence partitioning, three-value boundary analysis,
  decision tables and state transitions (ISTQB CTFL v4.0.1 chapter 4,
  ISO/IEC/IEEE 29119-4:2021), each test naming what it covers.
- Test doubles named for their kind; queries stubbed and results asserted;
  every fake paired with a contract test against the real implementation.
- A bug is fixed by a reproducing test first, proven to fail on the parent
  commit.
- Mutation testing on the changed files, with a written outcome for every
  surviving mutant.
- The boundary with `qa-automation-lead` written into both `SKILL.md` and
  `overview.md`: this expert owns tests inside the code; the lead owns strategy,
  end-to-end tests and the release gate.
- Five checklists and ten refusals. Every reference checked on 2026-09-24; the
  ISO clause text could not be read, so no row cites an ISO clause number.
