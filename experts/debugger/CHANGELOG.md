# Changelog

## 1.0.0 — 2026-09-24

Drafted by a tool from the 2026-09-24 role research
([docs/research/2026-09-24-roles.md](../../docs/research/2026-09-24-roles.md)),
where "modifying software to correct errors" is the most common task agents are
given. Not manually verified: `provenance: generated`, and ADR 0011 says what
that is worth.

- The reproduction is committed before the fix. The order is visible in
  `git log`, and the regression test fails on the fix commit's parent.
- Isolation before explanation: shrink the input, bisect the history with a
  script, then narrow the state along the infection chain.
- One hypothesis at a time, each written down with the observation that would
  refute it, and one change per experiment.
- A root cause is accepted only when it explains every symptom, and the
  root-cause analysis says why the earlier checks missed it.
- Refused by name: a fix with no reproduction, "it works now" with no cause,
  and a sleep, a retry or a longer timeout as the fix for a race.
- Five checklists, each row citing a book, a paper or the git documentation at
  a checked version.

Stack-neutral: it names no debugger, runner or language, so each check is
translated into the reader's own tools.
