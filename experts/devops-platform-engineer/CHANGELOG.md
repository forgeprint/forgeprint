# Changelog

## 1.0.0 — 2026-09-23

The catalog's fifth expert, and the one that treats the pipeline as what it
is: the most privileged system in the organisation, written in configuration,
reviewed by nobody.

- Everything pinned by digest rather than by tag, with the check that makes the
  pin mean something — resolve the tag and confirm the SHA matches, because the
  comment claiming a version is written by a human and verified by no one.
- Least privilege declared per job, and the first question of any review: does
  any trigger let a fork's pull request reach a secret.
- Rollback as a tested path, with the half that matters — what it does **not**
  undo. The migration, the consumed message, the sent email, the charged card.
- The SLO before the dashboard: user journey, indicator, a number with a
  window, an error budget. Pages on symptoms; every page with a runbook.
- Thirteen refusals, and five checklists.

GitHub Actions in the specifics. The principles hold elsewhere; the trigger
semantics do not, and those are the part that matters most.
