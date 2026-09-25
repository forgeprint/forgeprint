# Sitemaps

A sitemap is a list of the URLs you want indexed. Every entry that is not one
of those makes the list less trustworthy.

| #   | Check                                                                                 | How                                                                      | Source                                                                        |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| SM1 | The sitemap is well-formed XML in the 0.9 namespace, UTF-8                            | `xmllint --noout sitemap.xml`; read the `urlset` namespace               | sitemaps.org protocol 0.9                                                     |
| SM2 | Each file holds at most 50,000 URLs and 50 MB uncompressed; larger sites use an index | `grep -c '<loc>' sitemap.xml`; check the uncompressed size               | sitemaps.org protocol 0.9                                                     |
| SM3 | Every `<loc>` is an absolute URL on the sitemap's own host and path scope             | read the entries; no relative URLs, no other hosts                       | sitemaps.org protocol 0.9; Google Search Central — Build and submit a sitemap |
| SM4 | Every listed URL returns 200 and is its own canonical                                 | per entry: status code, and the page's canonical equals the `<loc>`      | Google Search Central — Build and submit a sitemap                            |
| SM5 | No listed URL carries `noindex` or is disallowed in robots.txt                        | cross-check the entries against CI3 and CI5                              | Google Search Central — Block indexing with noindex                           |
| SM6 | `lastmod` changes only when the content does, in W3C Datetime format                  | compare `lastmod` for two builds with no content change: it did not move | Google Search Central — Build and submit a sitemap; sitemaps.org protocol 0.9 |
| SM7 | Effort is not spent on `priority` or `changefreq`                                     | if present, they are noted as ignored by Google                          | Google Search Central — Build and submit a sitemap                            |
| SM8 | robots.txt references the sitemap with an absolute `Sitemap:` line                    | `grep -i '^sitemap:' robots.txt`                                         | sitemaps.org protocol 0.9; Google Search Central — Build and submit a sitemap |

## Why each one

**SM4** is where most sitemaps fail. Generated from the route table, they list
redirects, parameter variants and error pages — each one a small signal that
the file cannot be relied on.

**SM6** because a `lastmod` that changes on every build is noise. Google uses it
only if it is consistently accurate; a value that always moves teaches it to
ignore the field.
