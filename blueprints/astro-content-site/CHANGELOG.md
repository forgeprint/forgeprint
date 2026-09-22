# Changelog — astro-content-site

## 1.0.0 — 2026-09-23

First version.

A static content site on Astro 7 with Tailwind 4, a typed content collection,
and a test suite that reads the built HTML and asserts what a crawler and a
screen reader actually get: one title, a description, an absolute canonical
URL, the Open Graph tags, `lang`, exactly one `h1`, a skip link to the `main`
landmark, and `alt` on every image.

The catalog's first `web` blueprint, and the first to carry `seo` or
`accessibility` at all.

**Generated** from the catalog's own demand research
([the report of 2026-09-23](../../docs/research/2026-09-23-demand.md)), where
`web` was an empty `project_type` and Astro led meta-framework satisfaction.
Its recipe runs in CI like every other, and nobody has built a real site on it
— so it is `tier: community`, and it says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

One decision worth recording: the accessibility checks are static assertions
against the built HTML, not a browser audit. They cannot see contrast, focus
order, or whether any alt text describes anything. `overview.md` and the tests
themselves say so, because a blueprint that claimed `accessibility` and quietly
meant "four regexes" would be worse than one that did not claim it.
