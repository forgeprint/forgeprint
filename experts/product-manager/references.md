# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-22.**

A caveat this expert states rather than hides: product management has
practices, not standards. There is no ASVS here. The sources below are named,
dated and widely used, and that is a weaker claim than the ones the security
and platform experts make — which is why every row says what it is used for
rather than being cited as an authority.

## Framing the problem

| Reference                                                                                             | Version | Checked    | Used for                                                                                                             |
| ----------------------------------------------------------------------------------------------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| [Jobs to be Done](https://jtbd.info/2-what-is-jobs-to-be-done-jtbd-796b82081cca)                      | current | 2026-09-23 | `problem-first.md` P2 and P4 — a named group rather than "users", and the existing workaround as the real competitor |
| [Teresa Torres — continuous discovery habits](https://www.producttalk.org/2021/08/product-discovery/) | current | 2026-09-23 | P8, P9, P10 — evidence behind a persona, and why "would you use X" predicts nothing                                  |

## Measuring it

| Reference                                                                                                                                         | Version              | Checked    | Used for                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Google HEART framework](https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/) | original paper, 2010 | 2026-09-23 | `measurable.md` M3 and M7 — guardrail metrics, and measuring the user's outcome rather than the team's output                                                      |
| [Eric Ries — vanity metrics](http://www.startuplessonslearned.com/2009/09/vanity-metrics-vs-actionable-metrics.html)                              | original, 2009       | 2026-09-23 | M2 and M6 — the named list, and the property that makes them comfortable: none can fall for a bad reason                                                           |
| [DORA, State of AI-assisted Software Development](https://dora.dev/dora-report-2025/)                                                             | 2025 report          | 2026-09-23 | M7 — the report's own framing of outcomes over output, and the demand evidence for this expert existing ([role research](../../docs/research/2026-09-23-roles.md)) |

## Writing it down

| Reference                                                                           | Version        | Checked    | Used for                                                        |
| ----------------------------------------------------------------------------------- | -------------- | ---------- | --------------------------------------------------------------- |
| [INVEST in good stories](https://xp123.com/invest-in-good-stories-and-smart-tasks/) | original, 2003 | 2026-09-23 | `ready-to-build.md` R3, R7, R8                                  |
| [Behaviour-driven development — given/when/then](https://cucumber.io/docs/bdd/)     | current        | 2026-09-23 | R1 and R2 — criteria as observable outcomes somebody could fail |

## Deferred to elsewhere

- Whether the thing is buildable as specified, and what it costs
  architecturally: [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
  for .NET.
- Whether the acceptance criteria are actually tested:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md). This expert writes
  criteria somebody could fail; that one checks whether the suite would notice.
- Design research method and usability testing: the `ux-researcher` role, which
  nobody has filled.
