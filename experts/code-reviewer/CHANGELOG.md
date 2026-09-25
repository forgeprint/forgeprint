# Changelog

## 1.0.0 — 2026-09-24

The catalog's first code reviewer, and the second most requested role in the
[2026-09-24 role research](../../docs/research/2026-09-24-roles.md).

Drafted by a tool from that research and from the sources in `references.md`,
each read on 2026-09-24. Not manually verified: nobody has yet run it on a real
pull request and reported what came out differently. `provenance: generated`
(ADR 0011).

- A review record before any comment: size, the author's intent quoted, files
  read out of files changed, and the commands run with their results.
- A fixed order of passes, with correctness before maintainability and style
  last and never blocking.
- Every blocking finding carries `file:line` and a failure scenario — input,
  expected, actual. A suspicion without one is a `question:`.
- Every behaviour change needs a test in the same change, and the test must
  fail against the old code.
- Conventional Comments labels, four verdicts, and `cannot-approve` for a
  change the reviewer could not run or read in full.
- Five checklists: intent and scope, correctness (with CWE entry numbers),
  tests in the change, maintainability, comments and verdict.
- Security in depth, test strategy, writing tests and architecture are handed
  over by name.
