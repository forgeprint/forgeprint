# Canonicals and hreflang

One URL per page, and every language version pointing at every other.

| #   | Check                                                                                                 | How                                                                                       | Source                                                         |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| CH1 | Every indexable page has a self-referencing `rel="canonical"` with an absolute URL in the served HTML | `curl -s <url> \| grep -o '<link[^>]*rel="canonical"[^>]*>'`                              | Google Search Central — Consolidate duplicate URLs             |
| CH2 | Only one canonical is declared per page, and header and HTML do not disagree                          | count `rel="canonical"` in the HTML; `curl -sI` for a `Link:` header                      | Google Search Central — Consolidate duplicate URLs             |
| CH3 | Protocol, host, trailing-slash and case variants redirect to the canonical form                       | request `http://`, `www`/non-`www`, with and without `/`; each ends at one URL with a 301 | Google Search Central — Consolidate duplicate URLs (redirects) |
| CH4 | Internal links, the sitemap and the canonical name the same URL                                       | sample internal links; compare with the sitemap entry and the canonical                   | Google Search Central — Consolidate duplicate URLs             |
| CH5 | `noindex` and robots.txt are not used to choose a canonical                                           | read duplicate variants: they canonicalise or redirect, not `noindex`                     | Google Search Central — Consolidate duplicate URLs             |
| CH6 | Each language version lists itself and every other version                                            | for each version, extract `hreflang` links; the sets are identical across versions        | Google Search Central — Localized versions of your pages       |
| CH7 | Language codes are ISO 639-1, optional regions ISO 3166-1 alpha-2, and no region is used alone        | read the `hreflang` values: `en`, `en-GB`, not `uk` for English in the UK                 | Google Search Central — Localized versions of your pages       |
| CH8 | hreflang URLs are absolute and each is the canonical of its version                                   | compare each `href` with that page's canonical                                            | Google Search Central — Localized versions of your pages       |
| CH9 | `x-default` points at the selector or fallback page where one exists                                  | find `hreflang="x-default"`                                                               | Google Search Central — Localized versions of your pages       |

## Why each one

**CH3** removes duplicates at the source. A redirect is the strongest
canonicalisation signal there is, and every variant that answers 200 is a
duplicate the canonical tag then has to argue about.

**CH6** is the rule most implementations break. Without the return link, the
annotation may be ignored, and the wrong language version is shown to people
who cannot read it.

**CH8** ties the two halves together: an `hreflang` pointing at a
non-canonical URL points at a page the search engine has already decided not
to show.
