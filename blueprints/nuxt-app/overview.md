# Nuxt App

A server-rendered Nuxt 4 application with Tailwind: Vue pages whose title,
description and canonical URL are asserted in the HTML the built server sends,
one Nitro API route that validates its input with a schema the form shares,
and three kinds of test on Vitest — unit, component inside a Nuxt runtime, and
end-to-end against the production build.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real application on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- Nuxt 4.5 on Vue 3.5, TypeScript with `strict` and `noUncheckedIndexedAccess`
  (Nuxt's own generated tsconfigs), and `nuxt typecheck` covering the app, the
  server, the shared code and the tests.
- `usePageSeo()` — one composable that writes title, description, canonical
  and Open Graph tags, with both fields required by its type.
- `POST /api/greeting` under `server/api/`, with a `content-length` limit
  checked before the body is read, and h3's `readValidatedBody` with a zod
  schema from `shared/`.
- A form component that uses the same schema, and a component test that mounts
  it in a Nuxt runtime with the endpoint replaced.
- An e2e suite that builds the application, starts it on a free port, and
  asserts the rendered HTML and the route's 200, 400 and 413 answers — no
  browser download.
- ESLint through `@nuxt/eslint`, warnings failing; a CI workflow with actions
  pinned by commit SHA.
- Telemetry off in `nuxt.config.ts`.

## Options

None. Nuxt's natural axes — SSR or static generation, a UI library, a data
layer — each change the shape of the project enough that an option would hide
a different blueprint.

## What it fits

- A Vue team that wants pages rendered on the server, for search engines and
  for a first paint that does not wait for JavaScript.
- A site with a small backend — a form handler, a proxy to one upstream, a
  webhook — that does not justify a second service.
- Somebody who prefers file-based conventions to configuration: the file path
  is the route, the file name carries the HTTP method, components and
  composables are auto-imported.

## What it is NOT for

- **Anything with users.** No authentication, no session, no user table. The
  API route is public. This is the omission people assume is not there, so it
  is first in this list. Adding it is a design decision — sessions, an
  identity provider, what the route checks — not a step.
- **All of SEO.** `seo` here means what the tests assert: one title, a
  description, an absolute canonical URL and the Open Graph tags, in the HTML
  the server sends. There is no sitemap, no `robots.txt` and no structured
  data; add them when there is more than one page to list.
- **Security headers.** Nothing sets `Content-Security-Policy`,
  `X-Frame-Options` or `Referrer-Policy`. Nuxt inlines its hydration payload
  as a script, so a real CSP needs nonces or hashes, and that is work for the
  project that knows which third parties it loads.
- **Anything with a database.** No ORM, no migrations, no state at all. For a
  full-stack application with Postgres and reviewed migrations today, the
  catalog has `nextjs-fullstack-app` — in React.
- **A Vue single-page app with no server.** If the pages do not need rendering
  on the server and the backend is somebody else's, Nuxt's server is weight you
  carry for nothing; a Vite SPA is smaller. The catalog has no Vue SPA
  blueprint yet.
- **A static content site.** Nuxt can prerender, but a blog or documentation
  site is better served by `astro-content-site`, which ships no JavaScript for
  static pages and tests its accessibility basics.
- **Accessibility as a claim.** The page has a label for its input, `lang` on
  `<html>` and one `<h1>`, but nothing asserts contrast, focus order or keyboard
  behaviour, and the manifest does not claim `accessibility`.
- **Deployment.** No Dockerfile and no Nitro preset other than the default
  Node server. The build runs with `node .output/server/index.mjs`; where it
  runs is your choice.

## Compared with `nextjs-fullstack-app`

Both are server-rendered TypeScript meta-frameworks on the `web` shelf, so the
difference is worth stating precisely.

|                | `nuxt-app`                                                              | `nextjs-fullstack-app`                                            |
| -------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| UI             | Vue 3 single-file components                                            | React 19 server and client components                             |
| Server         | Nitro routes in `server/api/`, method in the file name                  | Route handlers and pages in `src/app/`                            |
| What it proves | SEO tags in the built HTML, input validation and size limits on a route | A migration generated, applied and round-tripped against Postgres |
| Data           | none                                                                    | Postgres through Drizzle                                          |
| Tests          | Vitest: unit, component in a Nuxt runtime, e2e on the production build  | `node:test` against a real database                               |
| Needs          | Node 22.19                                                              | Node 22, Docker                                                   |

Pick by language first — Vue or React — because that is what the next year of
work is written in. If you are undecided, pick by what you need on day one: a
database with migrations points at the Next.js blueprint, a public site with a
small API at this one.

## Pros

- **The SEO claim is tested against the server's output**, not the templates:
  one title, a description of at least twenty characters, and an absolute
  canonical URL, in the HTML the production build sends.
- **The canonical URL cannot be steered by a request.** It comes from
  configuration, a test sends a forged `Host` header to prove it, and another
  proves a `//host` path cannot change the host either.
- **The route refuses before it reads.** A body over 1 KB gets 413 and a
  request with no declared length gets 411, both before h3 buffers anything.
- **One schema on both sides.** The form and the route import the same zod
  object from `shared/`; the route's copy is the control, the form's the
  convenience.
- **Three test layers with a reason each**, and the e2e layer needs no browser.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **The example route does nothing useful.** It greets. It exists to show the
  pattern — size check, schema, typed response — and you are meant to replace
  it.
- **Auto-imports cut both ways.** Less boilerplate, and a reader who does not
  know Nuxt cannot tell where `usePageSeo` or `readValidatedBody` come from.
  `.nuxt/` is where the answer is generated.
- **`h3` has to be pinned by hand** to keep `@nuxt/test-utils` working; see
  `AGENTS.md`. That pin is maintenance the next Nuxt major will ask about.
- **The e2e suite builds the whole application**, which makes `npm test` take
  tens of seconds rather than a few.
- **Vue's audience is split** between Nuxt and a plain Vite SPA; this is the
  Nuxt half.

## Cost of adoption

About twenty minutes on a warm npm cache. Node.js 22.19 or newer, and `curl`
for the recipe's final checks. No database, no container, no account.
