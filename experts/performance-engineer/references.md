# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

None of these is tracked in [`docs/review-standards.md`](../../docs/review-standards.md),
so they are listed here in full. Each row carries the version current when it
was read and the date of that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-23.**

## Web

| Reference                                                                                                         | Version                      | Checked    | Used for                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| [web.dev — Web Vitals](https://web.dev/articles/vitals)                                                           | page last updated 2024-10-31 | 2026-09-24 | `core-web-vitals.md` CW1 — three metrics, 75th percentile, mobile and desktop apart    |
| [web.dev — Defining the Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds) | page last updated 2025-05-07 | 2026-09-24 | CW2, CW4 — LCP 2.5 s / 4.0 s, CLS 0.1 / 0.25, and why p75 rather than p95              |
| [web.dev — Interaction to Next Paint](https://web.dev/articles/inp)                                               | page last updated 2025-09-02 | 2026-09-24 | CW3, CW10, `profiling.md` PR6 — 200 ms / 500 ms, and that INP needs real interaction   |
| [web.dev — Why lab and field data can be different](https://web.dev/articles/lab-and-field-data-differences)      | page last updated 2022-07-18 | 2026-09-24 | CW5, CW6 — field data sets the priority when both exist                                |
| [web.dev — Performance budgets 101](https://web.dev/articles/performance-budgets-101)                             | page last updated 2018-11-05 | 2026-09-24 | CW11 — budget kinds, and enforcement in the build. Its metric examples predate INP     |
| [Lighthouse](https://github.com/GoogleChrome/lighthouse/releases)                                                 | v13.5.0, released 2026-09-18 | 2026-09-24 | CW7 — the pinned lab instrument                                                        |
| [Lighthouse — score variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)        | `main` at check              | 2026-09-24 | `measurement-discipline.md` MD8, MD9; CW8, CW9 — median of five runs, no parallel runs |

## Server and method

| Reference                                                                                                                         | Version                                               | Checked    | Used for                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| [Brendan Gregg — The USE Method](https://www.brendangregg.com/usemethod.html)                                                     | page last updated 2017-08-24                          | 2026-09-24 | `server-latency.md` SV4 to SV6, `load-testing.md` LT7, `profiling.md` PR5                                    |
| [Tom Wilkie — The RED Method](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/)                           | published 2018-08-03                                  | 2026-09-24 | SV1, SV2 — rate, errors, duration per service                                                                |
| [Google SRE Book — Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)                               | current at check                                      | 2026-09-24 | MD7, SV2, SV3 — latency as a distribution, and what an average hides                                         |
| [Brendan Gregg — Systems Performance, 2nd edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html)        | 2nd edition, Addison-Wesley, 2020, ISBN 9780136820154 | 2026-09-24 | MD1 to MD6, SV9 (ch. 2 Methodology); PR2, PR4 (ch. 5 Applications); LT2, LT6, LT8, LT9 (ch. 12 Benchmarking) |
| [Brendan Gregg — Flame Graphs](https://www.brendangregg.com/flamegraphs.html)                                                     | page last updated 2026-08-14                          | 2026-09-24 | PR1, PR3, PR7 — frame width is share of samples                                                              |
| [Rails Guides — Active Record Query Interface, N + 1 Queries Problem](https://guides.rubyonrails.org/active_record_querying.html) | Rails 8.1.4 guide                                     | 2026-09-24 | SV7, SV8. The pattern is not Rails-specific; this is the clearest named description of it                    |

## Load testing

| Reference                                                                                                     | Version                           | Checked    | Used for                                                        |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------- | --------------------------------------------------------------- |
| [k6](https://github.com/grafana/k6/releases)                                                                  | v2.3.0, released 2026-09-21       | 2026-09-24 | `load-testing.md` LT1 — the pinned load generator               |
| [k6 — Open and closed models](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/) | docs `latest`, read on 2026-09-24 | 2026-09-24 | LT3, LT4 — arrival-rate executors, and coordinated omission     |
| [k6 — Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)                                    | docs `latest`, read on 2026-09-24 | 2026-09-24 | LT5 — `p(95)<400` syntax, and a failed threshold exits non-zero |

A pinned tool version and a documentation page read at `latest` are different
claims. The release row says which k6 existed on the date; the documentation
rows say what the manual said that day. If k6 moves a major version before the
re-check, re-read both documentation rows before relying on the executor names.

## Deferred to elsewhere

- SLOs, alerting and rollout: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md),
  and its `slo-and-alerting.md`. This expert measures against a target; it does
  not set one.
- Whether the gating suite is trustworthy: [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- A single query's plan, and index design: [`sql-data-engineer`](../sql-data-engineer/SKILL.md)
  and its `query-performance.md`. A database-administrator expert is planned.
- Frontend implementation: a planned frontend-engineer expert.
