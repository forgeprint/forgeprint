# Changelog

## 1.0.0 — 2026-09-23

The catalog's second expert, and the one the review process was already using
by hand.

- Trust boundaries first: name every boundary, name what crosses it in both
  directions, then four questions per boundary. Code is read last, in the order
  the data flows.
- Every finding cites a control at a version, or it goes under Observations as
  judgement. A guessed citation is a wrong answer wearing a uniform.
- Five severities with stated meanings, and `high` requires a path to impact
  that fits in one sentence — because a `critical` or `high` blocks
  `tier: official` (rule 23).
- What is deliberately **not** reported: framework-prevented findings, style,
  "consider using X", and controls for things that do not exist.
- Six checklists: trust boundaries, authentication and authorization, input and
  output, secrets and configuration, dependencies and the build, logging and
  errors.

It holds no standards of its own. `references.md` points at
`docs/review-standards.md`, which carries each one with a version and a date,
so a review ages with the standards rather than with this file.
