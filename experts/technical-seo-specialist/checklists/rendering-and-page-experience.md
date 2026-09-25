# Rendering and page experience

The first HTML a crawler receives decides most of what gets indexed. Page
experience is measured from field data and handed to performance work.

| #   | Check                                                                                            | How                                                                         | Source                                                                  |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| RP1 | The raw HTML contains the title, meta description, `h1`, main text, canonical and internal links | `curl -s <url>` and read it; compare with the rendered page                 | Google Search Central — JavaScript SEO basics                           |
| RP2 | Indexable pages are server-rendered or statically generated, not rendered only on the client     | RP1 passes without JavaScript                                               | Google Search Central — JavaScript SEO basics                           |
| RP3 | Dynamic rendering is not the chosen strategy                                                     | no user-agent switch serving crawlers pre-rendered HTML                     | Google Search Central — JavaScript SEO basics; Spam policies (cloaking) |
| RP4 | A `noindex` in the initial HTML is intended; none is removed later by JavaScript                 | `curl -s <url> \| grep -i 'name="robots"'`                                  | Google Search Central — JavaScript SEO basics                           |
| RP5 | Client-side routes use the History API, not `#` fragments, and unknown routes return 404         | read the router configuration; request an unknown route                     | Google Search Central — JavaScript SEO basics                           |
| RP6 | Titles and meta descriptions are unique across indexable pages                                   | collect `<title>` per sitemap URL; count duplicates                         | Google Search Central — JavaScript SEO basics                           |
| RP7 | Lighthouse's SEO category passes on the key templates, pinned by version                         | `npx lighthouse@13.5.0 <url> --only-categories=seo --output=json`           | Lighthouse 13.5.0                                                       |
| RP8 | Core Web Vitals are reported from field data at p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1        | read the field source and date range; a lab score is not reported as a pass | web.dev — Web Vitals                                                    |
| RP9 | `llms.txt`, if present, is labelled an optional convention and not claimed to affect search      | read the audit's wording about it                                           | llmstxt.org proposal                                                    |

## Why each one

**RP1** is the single most useful check in the list, and it is one `curl`. If
the content is not in the response, indexing depends on a deferred rendering
pass, and crawlers that do not run JavaScript see an empty page.

**RP3** because serving crawlers something different from users is the
definition of cloaking unless it is genuinely equivalent content, and Google
describes dynamic rendering as a workaround rather than a solution.

**RP9** keeps the audit honest about something new. llms.txt is a proposal for
helping LLM-based tools use a site; no search engine documentation cited here
says it affects search, and the audit does not suggest otherwise.
