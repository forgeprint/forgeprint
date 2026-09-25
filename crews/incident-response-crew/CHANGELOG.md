# Changelog

## 1.0.0 — 2026-09-25

Phase 9 of the 2026-09-24 expansion plan.

- Research shape D. `site-reliability-engineer` owns the incident from page to postmortem, with no separate incident commander (D18); `observability-engineer` finds the signal, `debugger` the reproduced root cause, and `test-engineer` checks the regression test fails before the fix.
- Competing hypotheses stay inside the debugger, not as identical members (research rule 5).
- Three integrations: `sentry-mcp`, `github-mcp`, `grafana-mcp`.
- `not_for` names the small, sequential and same-file work where more agents measurably do worse, and the README cites MAST and Kim et al. for why the crew stays small.
- `tier: community`, `provenance: generated` (ADR 0011).
