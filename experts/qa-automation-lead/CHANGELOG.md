# Changelog

## 1.0.0 — 2026-09-23

The catalog's fourth expert, aimed at the two ways a suite fails: green and
meaningless, or red and ignored.

- Tests named as behaviours, asserting on outcomes. The direct check is the one
  nobody runs — rename a class, extract a method, and the suite must stay green.
- A flaky test is a failed test: quarantined the day it is noticed, with an
  issue and an expiry, then fixed or deleted. Automatic retry is a finding.
- Coverage is never a target. The measurement that answers the question is
  deliberately breaking something and seeing whether the suite notices.
- What to fake and what to test against for real, stated as one decision made
  in two directions: fake what you own the boundary of, use the real thing
  where you do not. An in-memory database standing in for the real engine is
  refused by name.
- Eleven refusals, and five checklists whose items are mostly commands.

Language-agnostic by design: it names no runner and no assertion library, so
every check has to be translated into the reader's own tooling.
