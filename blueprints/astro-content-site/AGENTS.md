# Astro Content Site — agent context

A static content site on Astro with Tailwind. Read this before adding a page.

> This blueprint was generated from the catalog's own demand research and its
> recipe is executed in CI, but nobody has reviewed the steps by hand. Treat
> what follows as a starting point that runs, not as a design somebody has
> shipped and maintained.

## The shape

```
src/layouts/Page.astro       the <head>, the language, the skip link, the landmark
src/content.config.ts        the collection schema — frontmatter that is checked
src/content/posts/           the content itself
src/pages/index.astro        the home page
src/pages/posts/[...slug].astro  one page per entry in the collection
tests/built-html.test.mjs    assertions against dist/, after a build
astro.config.mjs             site URL, sitemap, Tailwind
```

`Page.astro` is the only place that writes `<head>`. Every page goes through it
and passes a title and a description. A page that builds its own `<head>` is
how a site ends up with two canonical URLs and no description on half its
pages.

## Rules that are not style preferences

**`site` in `astro.config.mjs` is not decoration.** The canonical URL and the
sitemap are both built from it. Set it to the domain the site will actually be
served from before the first deploy; a sitemap full of `example.com` is worse
than no sitemap, because a crawler believes it.

**Every page has a title and a description, and they are different from each
other.** `Page.astro` requires both as props, so this is enforced by the type
checker rather than by remembering. The description is what appears under the
link in a search result — write it for the person deciding whether to click,
not as a restatement of the title.

**One `<h1>` per page, and the headings do not skip levels.** A screen reader's
outline is the heading structure; skipping from `h1` to `h3` removes a level
from the outline for the reader who navigates that way. The test enforces the
`h1` count and nothing enforces the rest, so that part is on you.

**Every image needs `alt`.** Decorative images get `alt=""` — an empty
attribute is a statement ("skip this"), a missing one is an omission the
screen reader fills by reading the filename aloud. The test fails on a missing
attribute and cannot tell you whether the text is any good.

**The frontmatter schema is the contract.** `content.config.ts` validates every
entry at build time, so a post missing a description fails the build rather
than shipping a page with an empty meta tag. Add a field there before you use
it in a template.

## What the tests actually check

`tests/built-html.test.mjs` reads the built HTML out of `dist/` and asserts
what a crawler and a screen reader would find: a single title, a description, an
absolute canonical URL, the Open Graph tags, `lang` on `<html>`, exactly one
`h1`, a skip link pointing at the `main` landmark, and `alt` on every image.

**This is a static check and it is not an accessibility audit.** It cannot see
contrast, focus order, keyboard traps, or whether the alt text describes the
image. It catches the regressions that are mechanical — the ones that reappear
every time somebody adds a page in a hurry — and nothing else. If accessibility
matters to this site, run a real audit in a browser as well; this suite exists
so that the easy failures never reach that audit.

## Adding a page

1. Create it under `src/pages/`, wrapped in `Page`, with a title and a
   description.
2. If it is content rather than a page, add it to `src/content/posts/` instead
   and let the dynamic route render it.
3. Run the build, then the tests. The tests read `dist/`, so they check the
   previous build unless you build first — the `test` script does both for this
   reason.
