# Changelog

## 1.0.0 — 2026-09-25

Phase 9 of the 2026-09-24 expansion plan.

- `business-analyst` extracts the rules, `modernization-engineer` pins and moves one slice at a time, `test-engineer` runs mutation analysis on the pinning suite before a slice moves, and `security-reviewer` reviews each moved slice.
- No architect: per language (ADR 0015). The research's backend engineer is covered by `modernization-engineer`.
- Three integrations: `github-mcp`, `context7-mcp`, `serena-mcp`.
- `not_for` names the small, sequential and same-file work where more agents measurably do worse, and the README cites MAST and Kim et al. for why the crew stays small.
- `tier: community`, `provenance: generated` (ADR 0011).
