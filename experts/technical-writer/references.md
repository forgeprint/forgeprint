# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-22.**

## Structure

| Reference                                                                            | Version | Checked    | Used for                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Diátaxis](https://diataxis.fr/)                                                     | current | 2026-09-23 | The four types in SKILL.md §1, and all of `document-type.md`. The framework's own claim is the one this expert leans on hardest: the four modes serve different needs and a document that mixes them serves none |
| [Diátaxis — the map](https://diataxis.fr/map/)                                       | current | 2026-09-23 | T2 to T5 — what each type must not do                                                                                                                                                                            |
| [Google developer documentation style guide](https://developers.google.com/style)    | current | 2026-09-23 | `deletion.md` D1 and D7, and the heading guidance in SKILL.md §2. It is a style guide rather than a standard, and it is cited for the specific rules it states rather than as an authority on writing            |
| [Google style guide — words to avoid](https://developers.google.com/style/word-list) | current | 2026-09-23 | D1 — "simply", "just", "easily" are on that list, with the same reasoning                                                                                                                                        |

## Accuracy

| Reference                                                                                                                                    | Version        | Checked    | Used for                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------ |
| [Write the Docs — documentation guide](https://www.writethedocs.org/guide/)                                                                  | current        | 2026-09-23 | `accuracy.md` A1, A8 — running samples, and one canonical page per thing |
| [Keep a Changelog](https://keepachangelog.com/)                                                                                              | 1.1.0          | 2026-09-23 | `deletion.md` D5 — where a historical note belongs instead               |
| [Architecture decision records — Michael Nygard's original format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011 | 2026-09-23 | D5 — the other place a historical note belongs                           |

## Why this expert exists at all

| Reference                                                                             | Version     | Checked    | Used for                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [DORA, State of AI-assisted Software Development](https://dora.dev/dora-report-2025/) | 2025 report | 2026-09-23 | The demand evidence: 90% of professional developers use AI at work, more than 75% for at least one daily responsibility, and information summarisation is one of the three most prevalent uses. Two of the top three named uses are writing rather than coding — which is why the catalog's first expert outside software is this one ([role research](../../docs/research/2026-09-23-roles.md)) |

A widely repeated figure this expert does **not** rely on: several secondary
sources attribute "64% use AI for writing documentation" to the same report. It
could not be confirmed at the source on the date above, so it is recorded as
unverified rather than cited.

## Deferred to elsewhere

- Whether the thing being documented is well designed:
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md) for .NET.
- Whether a `setup.md` recipe is correct: that is what `forgeprint lint-setup`
  and the setup tests are for, and it is a stricter format than documentation.
- Accessibility of a documentation site: WCAG 2.2 in
  [`docs/review-standards.md`](../../docs/review-standards.md), and the
  `accessibility-specialist` role, which nobody has filled.
