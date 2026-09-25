# Changelog

## 1.0.0 — 2026-09-25

The catalog's first marketing-domain expert, scoped to what can be checked.

- Crawling and indexing kept apart: robots.txt against RFC 9309, including
  that a 5xx on it means complete disallow; `noindex` on crawlable pages
  instead of disallow; robots.txt never treated as security.
- Sitemaps per the sitemaps.org protocol 0.9, listing only indexable,
  canonical, 200-status URLs, with an honest `lastmod`.
- A self-referencing absolute canonical per page, redirects for every variant,
  and reciprocal hreflang with ISO codes and `x-default`.
- Structured data in JSON-LD that matches the visible page, validated twice,
  with no rich result promised.
- The first HTML response carries the content; server-side rendering or static
  generation for indexable pages; Core Web Vitals reported from field data and
  handed to `performance-engineer`.
- `llms.txt` labelled as an emerging convention, not a standard.
- Refuses ranking promises, content and growth strategy (expansion plan D6),
  and anything the search engine's spam policies name.
- Five checklists and seven refusals.

Drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, row 19, and
`docs/research/2026-09-24-expansion-plan.md`, Phase 7 and D6). Every source
was opened and its version or page date confirmed on 2026-09-25. The expert
has not been manually verified against a real site — `provenance: generated`
says so (ADR 0011).
