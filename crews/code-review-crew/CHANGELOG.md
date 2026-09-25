# Changelog

## 1.0.0 — 2026-09-25

Phase 9 of the 2026-09-24 expansion plan.

- Research shape B, parallel review by lens: `code-reviewer`, `security-reviewer`, `performance-engineer` and `test-engineer`, with `code-reviewer` reading the intent first and merging the findings into one verdict.
- The research named an architect lens. It is left out: architects are per language in this catalog (ADR 0015), and the correctness lens is `code-reviewer`, which the plan added for exactly this.
- `test-engineer` rather than `qa-automation-lead` for the test lens, because the question is the tests inside the diff (D2).
- One integration: `github-mcp`.
- `not_for` names the small, sequential and same-file work where more agents measurably do worse, and the README cites MAST and Kim et al. for why the crew stays small.
- `tier: community`, `provenance: generated` (ADR 0011).
