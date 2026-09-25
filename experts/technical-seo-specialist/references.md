# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

None of these is tracked in [`docs/review-standards.md`](../../docs/review-standards.md),
so they are listed here in full, with the version or last-updated date the page
showed and the date it was read. Search engine documentation changes often and
without version numbers; the page date is the version. **Re-check every 90
days.**

> **Next re-check due: 2026-12-24.**

## Standards and protocols

| Reference                                                                           | Version                             | Checked    | Used for                                                                              |
| ----------------------------------------------------------------------------------- | ----------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| [RFC 9309 — Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html) | Proposed Standard, September 2022   | 2026-09-25 | `crawl-and-index.md` CI1 to CI4 (§2.2.2, §2.3, §2.3.1.4, §2.5), CI7 (§3)              |
| [sitemaps.org — Sitemaps XML format](https://www.sitemaps.org/protocol.html)        | protocol 0.9                        | 2026-09-25 | `sitemaps.md` SM1 to SM3, SM6, SM8. The protocol's "ping" submission is not relied on |
| [schema.org](https://schema.org/docs/releases.html)                                 | release 30.1, 2026-09-16            | 2026-09-25 | `structured-data.md` SD2                                                              |
| [Schema Markup Validator](https://validator.schema.org/)                            | run by schema.org; current at check | 2026-09-25 | SD2                                                                                   |

## Search engine documentation

Google's documentation is cited because it is the most detailed published by a
search engine, not because it is the only one. A finding that rests on it says
so.

| Reference                                                                                                                                        | Version                 | Checked    | Used for                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| [Google Search Central — Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)                   | last updated 2025-12-10 | 2026-09-25 | CI5 — not a mechanism for keeping a page out of Google                                                          |
| [Google Search Central — Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)                | last updated 2025-12-10 | 2026-09-25 | CI5, CI6, SM5 — `noindex` must be crawlable; not supported in robots.txt                                        |
| [Google Search Central — Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)         | current at check        | 2026-09-25 | SM3, SM4, SM6 to SM8 — absolute canonical URLs; `priority` and `changefreq` ignored; `lastmod` only if accurate |
| [Google Search Central — Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)     | last updated 2026-07-10 | 2026-09-25 | CH1 to CH5 — redirects strongest, canonical strong, sitemap weak; absolute URLs; not `noindex`                  |
| [Google Search Central — Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions) | last updated 2026-09-21 | 2026-09-25 | CH6 to CH9 — reciprocal links, ISO codes, `x-default`                                                           |
| [Google Search Central — General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)   | last updated 2026-07-10 | 2026-09-25 | SD1, SD3 to SD7 — JSON-LD, visible content, no guarantee                                                        |
| [Google Search Central — JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)    | current at check        | 2026-09-25 | CI8, RP1 to RP6 — rendering phases, SSR, `noindex`, History API, status codes, unique titles                    |
| [Google Search Central — Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)                                      | last updated 2026-08-28 | 2026-09-25 | SD5, RP3, and the refusals — cloaking, doorway abuse, link spam, scaled content abuse                           |

## Page experience

| Reference                                                         | Version                            | Checked    | Used for                                                                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [web.dev — Web Vitals](https://web.dev/articles/vitals)           | page last updated 2024-10-31       | 2026-09-25 | RP8 — LCP 2.5 s, INP 200 ms, CLS 0.1 at p75, mobile and desktop apart. The "poor" thresholds are in [`performance-engineer`](../performance-engineer/references.md), which owns the diagnosis |
| [Lighthouse](https://github.com/GoogleChrome/lighthouse/releases) | v13.5.0 (npm `latest`, 2026-09-18) | 2026-09-25 | RP7 — the `seo` category in the v13.5.0 default config: `is-crawlable`, `document-title`, `meta-description`, `robots-txt`, `hreflang`, `canonical` among its audits                          |

## Emerging conventions

| Reference                        | Version                                                                          | Checked    | Used for                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [llms.txt](https://llmstxt.org/) | a proposal (Jeremy Howard, September 2024); page notes a revision in August 2026 | 2026-09-25 | RP9 — **not a standard**. A curated Markdown index at `/llms.txt` for LLM-based tools. No search engine documentation cited here says it affects search |

## Deferred to elsewhere

- Core Web Vitals diagnosis and fixes: [`performance-engineer`](../performance-engineer/SKILL.md).
- Rendering implementation: [`frontend-engineer`](../frontend-engineer/SKILL.md).
- Accessibility: a planned accessibility-specialist expert.
