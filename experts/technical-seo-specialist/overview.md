# Technical SEO Specialist

## What it changes

Asked to "improve SEO", an agent rewrites headings for keywords, adds meta
tags nobody reads, and promises better rankings. None of it is checkable. This
expert restricts SEO to what a crawler can be shown to see, and makes every
finding a request and a response:

- **Crawling and indexing are kept apart.** robots.txt is checked against
  RFC 9309 — including that a 5xx on it blocks the whole site — and pages kept
  out of the index use a crawlable `noindex`, never a disallow.
- **Sitemaps list only indexable, canonical, 200-status URLs**, within the
  protocol's limits, with a `lastmod` that moves only when content does.
- **One URL per page**: a self-referencing absolute canonical, redirects for
  every variant, and signals that agree. hreflang is reciprocal or it is
  broken.
- **Structured data matches the visible page**, validates against both the
  schema.org validator and the search engine's feature requirements, and never
  comes with a promise of a rich result.
- **The first HTML response carries the content.** One `curl` shows whether
  the title, text, canonical and links exist before JavaScript runs.
- **Core Web Vitals are reported from field data** and handed to performance
  work, and `llms.txt` is labelled for what it is: an optional convention, not
  a standard.

Five checklists — crawl and index, sitemaps, canonicals and hreflang,
structured data, rendering and page experience — and seven refusals.

## What it fits

- A pre-launch audit, where the question is whether anything stops pages being
  found and indexed.
- A migration or a framework change, where redirects, canonicals and rendering
  are most likely to break.
- Pages missing from search, where the first job is to rule out the technical
  causes.
- Internationalised sites, where hreflang is easy to get almost right.
- Any stack. The checks are `curl`, `xmllint`, validators and a pinned
  Lighthouse.

## What it does not fit

- **Rankings, traffic, keyword research, content and growth strategy.** No
  checkable standard, and refused as taste in the expansion plan (D6). This
  expert will not promise a position, a traffic number or a rich result, and
  will not rewrite content for keywords.
- **Performance work.** It reports Core Web Vitals from field data;
  diagnosing and fixing them is [`performance-engineer`](../performance-engineer/SKILL.md).
- **Accessibility.** Headings and alt text serve both, but the requirements
  belong to a planned accessibility-specialist expert, and where the two
  pull apart, accessibility wins.
- **Implementing the rendering strategy.** Choosing and building SSR or static
  generation in a framework is [`frontend-engineer`](../frontend-engineer/SKILL.md).
- **Paid search, app store optimisation, local listings.** Different systems
  with different rules.

## Pros and cons

**In its favour:** every finding is reproducible — a command, its output and
the rule it breaks. The checks that catch the most damage are the cheapest:
the status code of robots.txt, the raw HTML from one `curl`, the reciprocity of
hreflang. And by refusing ranking claims it stays honest in a field where most
advice is not.

**Against it:** the search engine documentation it relies on is mostly
Google's, which is the most detailed but not the only engine, and it changes
without version numbers — the page dates are the best available versioning,
and the 90-day re-check matters more here than elsewhere. It deliberately
leaves out the questions many people actually ask — "why don't we rank?" — when
the answer is not technical. And it has not been run on a real site by a
person; `provenance: generated` is the honest label.
