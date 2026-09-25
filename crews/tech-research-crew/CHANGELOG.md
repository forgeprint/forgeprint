# Changelog

## 1.0.0 — 2026-09-25

Phase 9 of the 2026-09-24 expansion plan.

- Research shape C: `research-engineer` gathers and grades, `technical-writer` writes the brief or ADR.
- `qa-automation-lead` is the checker. The research engineer's checklists check its own brief before hand-over, which is not independent verification (ADR 0014, P2), so a third member runs the claims the decision rests on.
- No architect: per language (ADR 0015).
- Three integrations: `exa-mcp`, `context7-mcp`, `notion-mcp`.
- `not_for` names the small, sequential and same-file work where more agents measurably do worse, and the README cites MAST and Kim et al. for why the crew stays small.
- `tier: community`, `provenance: generated` (ADR 0011).
