# Web Launch Crew

_Assembled by @aliosmanmho_

Four experts for everything a public website launch can be checked against:
what a crawler can see, Core Web Vitals in the field, WCAG 2.2 AA by hand, and
a success metric that could come back negative. It replaces the growth crew
the research proposed; growth marketing and content strategy were refused as
taste, and what was left is what can be checked
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D6).

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                        | What it brings                                                         | The question it asks first                               |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| [`product-manager`](../../experts/product-manager/SKILL.md)                   | The launch metric, its counter-metric, and the date to look            | What result would mean the launch did not work           |
| [`technical-seo-specialist`](../../experts/technical-seo-specialist/SKILL.md) | Robots rules, sitemaps, canonicals, hreflang, truthful structured data | Can a crawler be shown to see this page                  |
| [`performance-engineer`](../../experts/performance-engineer/SKILL.md)         | Core Web Vitals measured with their spread, lab and field              | What is the 75th percentile in the field, not in the lab |
| [`accessibility-specialist`](../../experts/accessibility-specialist/SKILL.md) | WCAG 2.2 AA, automated first, then the manual passes                   | Can every launch journey be done with a keyboard alone   |

**Three checkers and one owner.** The SEO specialist, the performance engineer
and the accessibility specialist each audit the site against a published
standard. The product manager owns what the launch is for and decides what a
finding is worth before launch day — but not whether a failed success
criterion counts.

## What they install

| Integration                                                               | Why this crew wants it                                                           |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`chrome-devtools-mcp`](../../integrations/chrome-devtools-mcp/README.md) | The rendered HTML a crawler sees, performance traces, and the accessibility tree |

Third-party software that drives a real Chrome and runs JavaScript in the pages
it opens. Point it at the staging site, not at a logged-in session. Read its
README first.

## The order they are useful in

1. **Product manager first**: the metric, the counter-metric, the date, and
   what is not part of this launch.
2. **SEO specialist, performance engineer and accessibility specialist next**,
   and these three can run side by side: each reads the same staging site and
   writes its own audit, and none edits a shared file.
3. **Product manager last**: the three audits merged into one launch list,
   ordered by what the metric depends on.

They disagree in two places, and the disagreement is useful:

- The SEO specialist wants content in the server-rendered HTML; the
  performance engineer wants less JavaScript. They usually agree, and where
  they do not, the page that indexes and paints fast is the same page.
- The product manager wants a claim in the structured data; the SEO specialist
  refuses anything the page does not show. Structured data is truthful or it
  is left out.

## Why four, and why these run in parallel

- Parallel audits by lens are where the multi-agent evidence is strongest:
  the members read the same site and write nothing shared. That is the
  breadth-first shape Anthropic's research system measured as helped.
- MAST (Cemri et al.) found sharper role specifications worth +9.4%. Each
  auditor has one published standard and no overlap with the others.
- Kim et al. measured errors amplified 17.2 times across independent agents and
  4.4 times with a coordinator. The product manager's merge is the coordinator.

## Where this crew is wrong

- **Building the site.** Take the frontend engineer, or the `ui-build-crew`.
- **Launch copy or growth marketing, or buying advertising.** No member here
  does them, and none pretends to.
- **A change to one page.** Small, same-file work one expert checks faster
  than four.

## How to use it

Ask your agent for the crew by name two weeks before launch, not the day
before, and run it again on the date the product manager wrote down.
