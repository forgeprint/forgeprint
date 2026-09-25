# Crawl and index

Crawling and indexing are controlled by different mechanisms, and most
technical SEO failures come from using one for the other.

| #   | Check                                                                                          | How                                                                                  | Source                                                                |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| CI1 | `/robots.txt` is at the root, UTF-8, `text/plain`                                              | `curl -sI https://<host>/robots.txt`; read status and `Content-Type`                 | RFC 9309 §2.3                                                         |
| CI2 | robots.txt never answers 5xx, including during deploys                                         | read the status; check the deploy path serves it statically                          | RFC 9309 §2.3.1.4 — 5xx means complete disallow                       |
| CI3 | Allow and Disallow rules do what was intended under longest-match                              | for each important path, find the most specific matching rule by octets              | RFC 9309 §2.2.2                                                       |
| CI4 | The file stays under 500 KiB                                                                   | `curl -s https://<host>/robots.txt \| wc -c`                                         | RFC 9309 §2.5                                                         |
| CI5 | No page is "hidden" from search with robots.txt; `noindex` is used instead, on a crawlable URL | find pages meant to be out of the index; they carry `noindex` and are not disallowed | Google Search Central — robots.txt intro; Block indexing with noindex |
| CI6 | No `noindex` rule appears inside robots.txt                                                    | `grep -i noindex robots.txt` is empty                                                | Google Search Central — Block indexing with noindex                   |
| CI7 | Nothing sensitive relies on robots.txt; staging and admin areas require authentication         | read the disallowed paths; request each without credentials                          | RFC 9309 §3 — security considerations                                 |
| CI8 | Missing pages return 404 or 410, moved pages 301, and no error page returns 200                | `curl -s -o /dev/null -w '%{http_code}' https://<host>/<nonexistent>`                | Google Search Central — JavaScript SEO basics (status codes)          |

## Why each one

**CI2** is the one that takes a whole site out. Under RFC 9309 a server error
on robots.txt means the crawler must assume everything is disallowed; a deploy
that briefly returns 503 for it stops crawling everywhere.

**CI5** is the most common misunderstanding. A disallowed page is not crawled,
so its `noindex` is never read — and it can still be indexed from external
links, as a URL with no description.

**CI7** because robots.txt is a public list. Disallowing `/admin/` tells every
reader where the admin area is.
