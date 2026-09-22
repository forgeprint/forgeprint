# Astro Content Site

A static site in Astro with Tailwind, a typed content collection, and a test
suite that reads the built HTML and asserts the SEO and accessibility work is
actually in it. Two content formats: plain Markdown, or MDX when a post needs
components.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. What has not happened is somebody
building and running a real site on it, which is what `tier: official` means in
this catalog and why this one is `community`.

## What it fits

- A documentation site, a blog, a changelog, a marketing site — anything where
  the content is text and the pages are known at build time.
- A project that needs the SEO basics correct from the first commit rather than
  retrofitted after somebody notices the link previews are empty.
- A team that wants the accessibility floor enforced by a test rather than by
  review comments.
- Somebody new to Astro. The recipe is short, every step verifies, and the
  parts that are easy to get wrong carry their reason in a comment.

## What it is NOT for

- **An application.** No server, no database, no sessions, no forms that go
  anywhere. Astro can do those with an adapter; this blueprint does not set one
  up, and adding one changes the deployment story completely.
- **Search.** No index, no client-side search. The `search` requirement is in
  the taxonomy and this does not claim it.
- **Internationalisation.** One language, declared once in the layout. Astro
  has routing for more; wiring it is a different blueprint.
- **A real accessibility audit.** The tests assert what can be read out of
  static HTML: the language attribute, one `h1`, a skip link to the main
  landmark, `alt` on every image. They cannot see colour contrast, focus order,
  keyboard traps, or whether the alt text describes anything. They stop the
  mechanical regressions so a browser audit can be about the real questions.
- **Comments, analytics, or anything that phones home.** Nothing here loads a
  third-party script.

## Pros

- **The SEO work is tested, not assumed.** The suite reads `dist/` and fails on
  a missing description, a relative canonical URL, a second `<title>`, or a
  missing Open Graph tag. These are exactly the things that break silently and
  get noticed months later by somebody sharing a link.
- **One `<head>`, in one file.** Every page goes through `Page.astro` and has
  to pass a title and a description, so the type checker catches the page that
  forgot rather than the search result doing it.
- **Frontmatter is validated at build time.** A post missing a description
  fails the build instead of shipping an empty meta tag.
- **Nothing ships to the browser that does not have to.** Astro sends no
  JavaScript for a page with no interactive components, and none of these
  pages have any.
- **Tailwind 4 through the Vite plugin** — no PostCSS config, no separate
  build step.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **`node>=22.12`.** Astro 7 requires it, and that is recent enough to be a
  wall on an older machine or an LTS-pinned CI image.
- **The accessibility claim is narrower than the word suggests.** It is in
  `requirements` because the blueprint does real work there — the skip link,
  the landmark, the language, the enforced heading count — but a reader who
  sees `accessibility` and expects WCAG conformance will be disappointed, and
  the tests say so in their own comments.
- **Two content formats is a real option, and a small one.** MDX costs an
  integration and buys components inside posts. If you know you will never
  need them, the `markdown` branch is strictly simpler.
- **No adapter, so no preview of the deployed thing.** The recipe builds and
  tests; it does not deploy, and the first deploy is where `site` being wrong
  would finally show.
- **Tailwind is an opinion.** If the project already has a design system, the
  `tailwind` half of this blueprint is in the way rather than helping.

## Compared with the alternatives here

Nothing else in this catalog is a `web` blueprint, so the comparison is against
what it is not: `fastapi-service`, `dotnet-web-api` and
`dotnet-multitenant-saas-api` are APIs with no front end, and the two MCP
server blueprints are not web at all. If the site needs a backend, this is the
wrong starting point and the catalog does not currently have the right one.
