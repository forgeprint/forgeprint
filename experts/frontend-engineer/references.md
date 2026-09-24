# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. Where a page carries no version, the row says what it does carry
— a "last updated" date — rather than inventing one. **Re-check every 90 days.**

> **Next re-check due: 2026-12-23.**

## Accessibility and markup

WCAG and the ARIA Authoring Practices are also rows in
[`docs/review-standards.md`](../../docs/review-standards.md), which is the
catalog's copy of record. They are repeated here only so this expert can be
read on its own; the versions below were re-read on the day and match it.

| Short name      | Reference                                                                                                                                    | Version                                                                                                                                                          | Checked    | Used for                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WCAG 2.2        | [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)                                                                    | W3C Recommendation, 12 December 2024 (first published 2023-10-05)                                                                                                | 2026-09-24 | The Level AA target and every success criterion cited in `semantic-html.md` and `wcag-aa.md`. 4.1.1 Parsing is marked obsolete and removed, which SH9 depends on |
| APG             | [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)                                                                           | no version or date on the page; current at check                                                                                                                 | 2026-09-24 | SKILL.md §2 and SH5: the named pattern, including its keyboard model, that a custom widget must follow                                                           |
| ARIA in HTML    | [ARIA in HTML](https://www.w3.org/TR/html-aria/)                                                                                             | W3C Recommendation, 11 August 2026                                                                                                                               | 2026-09-24 | SH4: setting a `role` or `aria-*` value that matches the element's implicit semantics is "NOT RECOMMENDED"                                                       |
| HTML LS         | [HTML Living Standard](https://html.spec.whatwg.org/multipage/)                                                                              | Living Standard, "Last Updated 24 September 2026"                                                                                                                | 2026-09-24 | SKILL.md §2, SH1, SH8, SH9, A9: which element does which job, and the `autocomplete` values                                                                      |
| Nu Html Checker | [The Nu Html Checker (vnu)](https://validator.github.io/validator/)                                                                          | `vnu-jar` 26.9.16 on npm; `--errors-only` and `--skip-non-html` per the [manual](https://validator.github.io/validator/docs/vnu.1.html), exit status 1 on errors | 2026-09-24 | SH9: HTML conformance of the built pages                                                                                                                         |
| axe-core 4.13   | [axe-core](https://github.com/dequelabs/axe-core) and its [API documentation](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md) | 4.13.0 (npm `latest`)                                                                                                                                            | 2026-09-24 | A1: the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`                                                                                              |
| axe-core README | [axe-core README](https://github.com/dequelabs/axe-core)                                                                                     | read at 4.13.0                                                                                                                                                   | 2026-09-24 | SKILL.md §3 and A11: "on average 57% of WCAG issues automatically" — the reason a report must name what it did not check                                         |

## Performance

| Short name      | Reference                                                                                                                            | Version                 | Checked    | Used for                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web Vitals      | [web.dev, _Web Vitals_](https://web.dev/articles/vitals)                                                                             | last updated 2024-10-31 | 2026-09-24 | The thresholds — LCP within 2.5 s, INP 200 ms or less, CLS 0.1 or less — and the 75th percentile, segmented by mobile and desktop. SKILL.md §1, §4; V1, V2 |
| INP article     | [web.dev, _Interaction to Next Paint (INP)_](https://web.dev/articles/inp)                                                           | last updated 2025-09-02 | 2026-09-24 | V3, V8: some lab tools report no INP because they observe a load without interaction; TBT "may be a reasonable proxy … but it's not a substitute"          |
| Optimize LCP    | [web.dev, _Optimize Largest Contentful Paint_](https://web.dev/articles/optimize-lcp)                                                | last updated 2025-03-31 | 2026-09-24 | V4: "Never lazy-load your LCP image"; `fetchpriority="high"` and preload for late-discovered LCP resources                                                 |
| Optimize CLS    | [web.dev, _Optimize Cumulative Layout Shift_](https://web.dev/articles/optimize-cls)                                                 | last updated 2025-02-07 | 2026-09-24 | V5, V6, V7: `width` and `height` on images and video or CSS `aspect-ratio`; `font-display` and fallback fonts; reserved space for late content             |
| Long tasks      | [web.dev, _Optimize long tasks_](https://web.dev/articles/optimize-long-tasks)                                                       | last updated 2024-12-19 | 2026-09-24 | V8: a task over 50 ms is a long task; yield to the main thread, preferring `scheduler.yield()` with a fallback                                             |
| web-vitals 6.2  | [GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals)                                                                | 6.2.2 (npm `latest`)    | 2026-09-24 | V2: `onLCP`, `onINP`, `onCLS` for field measurement, matching how Chrome measures them                                                                     |
| CrUX            | [Chrome UX Report](https://developer.chrome.com/docs/crux)                                                                           | last updated 2024-02-08 | 2026-09-24 | V2: the field dataset of the Web Vitals programme, where a project without its own measurement can read its p75                                            |
| Lighthouse 13.5 | [Lighthouse](https://github.com/GoogleChrome/lighthouse)                                                                             | 13.5.0 (npm `latest`)   | 2026-09-24 | SKILL.md §4 and V3: the lab tool. Named with its version so a lab number can be reproduced                                                                 |
| Budgets 101     | [web.dev, _Performance budgets 101_](https://web.dev/articles/performance-budgets-101)                                               | last updated 2018-11-05 | 2026-09-24 | SKILL.md §5 and BB1–BB6: "a set of limits imposed on metrics that affect site performance", including quantity-based limits on script size                 |
| Code splitting  | [web.dev, _Reduce JavaScript payloads with code splitting_](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting) | last updated 2018-11-05 | 2026-09-24 | BB7: send only the code the initial route needs, and load the rest with dynamic imports                                                                    |

The two budget articles are old. They are cited for a definition and a
technique that have not changed, not for tooling; this expert names no budget
tool, because the check is the same whichever one a project uses.

## Browser support

| Short name        | Reference                                                           | Version               | Checked    | Used for                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------- | --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline          | [web.dev, _Baseline_](https://web.dev/baseline)                     | current at check      | 2026-09-24 | SKILL.md §6 and BL1–BL5: the core browser set, Newly available ("supported by all of the core browsers"), Widely available (30 months later), and Baseline years |
| web-features 3.39 | [`web-features` on npm](https://www.npmjs.com/package/web-features) | 3.39.0 (npm `latest`) | 2026-09-24 | BL3: the data behind Baseline statuses, where a status can be looked up rather than recalled                                                                     |

## Deferred to elsewhere

- A full conformance audit, assistive-technology testing, WAI-ARIA 1.2 in depth
  and EN 301 549: the `accessibility-specialist` expert, planned in the
  2026-09-24 research and not yet written.
- Deep profiling and field-data pipelines: the `performance-engineer` expert,
  planned and not yet written.
- Test strategy, end-to-end suites and the release gate:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- Cross-site scripting, Content Security Policy and third-party scripts:
  [`security-reviewer`](../security-reviewer/SKILL.md), against the standards in
  `docs/review-standards.md`.
