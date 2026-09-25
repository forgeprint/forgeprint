# Changelog

## 1.0.0 — 2026-09-25

The first crew from Phase 9 of the 2026-09-24 expansion plan, and the shape the
crews research ranked first: spec, plan, build, verify, in sequence.

- Four members: `product-manager` writes the spec, `technical-program-manager`
  the plan and the assumption log, `test-engineer` drives the build test-first,
  and `qa-automation-lead` checks the result against the spec. The checker is
  a member of its own because verification was a fifth of the failures MAST
  found and the largest single fix it measured.
- No architect. An architect is per language in this catalog (ADR 0015) and
  this crew is not tied to one; the README says to load the one for your stack
  when the feature moves a boundary.
- The research named a `fullstack-engineer` as the builder. No such expert
  exists or is planned; `test-engineer` fills the slot, because in this shape
  the build is driven by failing tests.
- `not_for` names one-line fixes, same-file changes, prototypes with no spec
  and projects with no tests — the sequential and small work where more agents
  measurably do worse. The README adds several features split across agents,
  the parallel shape that waits for Scenario D.

Two integrations: `github-mcp` and `context7-mcp`.
