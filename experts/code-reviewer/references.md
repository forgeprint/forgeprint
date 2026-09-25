# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. Where a source publishes no version, the row says so and names
what was read instead. **Re-check every 90 days.**

> **Next re-check due: 2026-12-23.**

## How a review is conducted

| Reference                                                                                                                          | Version                                                                | Checked    | Used for                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Google Engineering Practices — The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html) | unversioned; repository's latest commit 3bb3ec25b3b0, 2024-09-19       | 2026-09-24 | SKILL.md opening and §6 — approve a change that improves code health even if it is not perfect; `Nit:`; facts and data overrule preference. R2, R5, R8 |
| [Google — What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)              | same                                                                   | 2026-09-24 | The passes in SKILL.md §2. S5, S6, C9, C10, T1, T2, T4, T6, M1–M7, R6, R7                                                                              |
| [Google — Navigating a CL in review](https://google.github.io/eng-practices/review/reviewer/navigate.html)                         | same                                                                   | 2026-09-24 | SKILL.md §2 step 4 — broad view first, design problems raised before line comments. S7                                                                 |
| [Google — Speed of Code Reviews](https://google.github.io/eng-practices/review/reviewer/speed.html)                                | same                                                                   | 2026-09-24 | SKILL.md §6 — one business day to first response; large changes split or reviewed for design only. R9                                                  |
| [Google — How to write code review comments](https://google.github.io/eng-practices/review/reviewer/comments.html)                 | same                                                                   | 2026-09-24 | SKILL.md §4 — comment on the code, explain why, point at the problem. R3, R4                                                                           |
| [Google — Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)                                       | same                                                                   | 2026-09-24 | "100 lines is usually reasonable, 1,000 usually too large"; separate refactorings; tests in the same change. S2, S3, S4, T3, M8                        |
| [Google — Writing good CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)              | same                                                                   | 2026-09-24 | SKILL.md §2 step 1 — the intent is what and why, in the description. S1, T5                                                                            |
| [Conventional Comments](https://conventionalcomments.org/)                                                                         | unversioned; site source's latest commit ae9c2998, 2025-09-30; no tags | 2026-09-24 | The `<label> [decorations]: <subject>` format and the labels in SKILL.md §4. R1, R5, R6                                                                |

## How much can be reviewed at once

| Reference                                                                                                                                 | Version        | Checked    | Used for                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SmartBear — Best Practices for Code Review](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)                | undated page   | 2026-09-24 | S4 — review no more than 200 to 400 lines at a time, under 500 lines an hour, no more than 60 minutes a session; from SmartBear's study of a Cisco Systems team                                                                              |
| Sadowski, Söderberg, Church, Sipko, Bacchelli — _Modern Code Review: A Case Study at Google_, ICSE-SEIP 2018, doi:10.1145/3183519.3183525 | published 2018 | 2026-09-24 | Background only: review at Google is lightweight, with small changes and usually one reviewer, and serves education, norms and gatekeeping as much as defect finding. Its figures were not read at the source on this date and are not cited |

## What a bug looks like

| Reference                                                                                                     | Version                                                    | Checked    | Used for                                                                                                |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html) | 2025 list, published December 2025; still the current list | 2026-09-24 | `correctness.md` C1, C2, C7, C8, and the hand-over list of security classes                             |
| [CWE List](https://cwe.mitre.org/data/index.html)                                                             | 4.20                                                       | 2026-09-24 | The entry names in `correctness.md`: CWE-125, -787, -476, -190, -682, -754, -772, -362, -667, -20, -770 |

## Refactoring

| Reference                                               | Version                                       | Checked    | Used for                                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [Refactoring — Martin Fowler](https://refactoring.com/) | book 2nd edition, 2018; site current at check | 2026-09-24 | The definition: a change to internal structure without changing observable behaviour. SKILL.md §7 (refactoring plan), T7, M8 |

## Deferred to elsewhere

- Security in depth — trust boundaries, authorization, secrets, dependencies:
  [`security-reviewer`](../security-reviewer/SKILL.md), which carries OWASP and
  the rest through [`docs/review-standards.md`](../../docs/review-standards.md).
  This expert only recognises a CWE class in a hunk and hands it over.
- Test strategy, suite health and what to fake:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- Writing the tests: the `test-engineer` role, which has no expert yet.
- Architecture across more than one change: an architect —
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md) for .NET.
