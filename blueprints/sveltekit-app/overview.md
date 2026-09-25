# SvelteKit App

A server-rendered SvelteKit application in Svelte 5 runes mode and strict
TypeScript, on adapter-node with Tailwind. One page has a server `load` and a
form action that validates on the server; the root layout writes the title,
description and canonical link; and a test suite starts the production build
with `node build` and reads what it actually sends.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real application on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- The project the official `sv` CLI (0.17.1) generates, with every version then
  pinned exactly and a committed `package-lock.json`.
- Svelte 5 runes forced for every component in the project, `svelte-check` in
  strict mode failing on any compiler warning, and ESLint and Prettier as `sv`
  sets them up.
- A form that works with JavaScript off: a plain `POST` to a form action, with
  `use:enhance` as the improvement. Validation lives in `$lib/server`, which
  SvelteKit refuses to bundle into the browser, and the list of accepted values
  is the same list the page renders from.
- `<svelte:head>` in the root layout as the only place that writes the title,
  the description, the canonical link and the Open Graph tags; each page passes
  its own through its load's `meta`.
- A Content Security Policy with a per-response nonce for scripts,
  `frame-ancestors 'none'`, `nosniff` and a referrer policy.
- A production server that refuses to start without `ORIGIN`, so the canonical
  link and SvelteKit's cross-origin form check are never built from a request's
  `Host` header.
- Two kinds of test: Vitest unit tests that call the validation, the `load` and
  the action directly, and `node:test` tests that start the built server on a
  free port and assert the HTML head, the headers, the action's refusals, a
  cross-origin post being refused, and the missing-`ORIGIN` refusal.
- A GitHub Actions workflow with actions pinned by commit, read-only
  permissions, and `npm audit` at the high level.

## Options

None. The adapter is the one decision somebody would want to vary, and it is
held at `node` on purpose: it is the one whose output can be started and
checked on any machine, with no account.

## What it fits

- A web application whose pages are rendered on the server and whose forms
  post to it: an internal tool, a signup or booking flow, a product site with
  a few interactive pages.
- A team that wants the smallest runtime JavaScript of the three component
  frameworks in this catalog and is happy writing Svelte rather than JSX or
  Angular templates.
- Somebody who wants SEO to be something a test checks against the built
  server, rather than something a template looks like it does.
- A self-hosted Node deployment: `node build` behind a reverse proxy or in a
  container you write.

## What it is NOT for

- **Anything with users.** There is no authentication, no session and no user
  record. Every page is public.
- **Storing anything.** There is no database. A valid signup is acknowledged
  and dropped; where it goes is the first decision after setup, and the action
  marks the place.
- **Abuse protection.** Nothing limits how often the form can be posted. That
  costs nothing while a signup is dropped; the moment it is stored or sends a
  message, a rate limit belongs in front of the action.
- **A static site.** Everything is rendered per request by a Node server. For
  pages that do not change per request, use `astro-content-site`.
- **A serverless or edge host.** adapter-node only. Moving to another adapter
  is a change to `vite.config.ts` and the host's own configuration, and nothing
  here tests it.
- **An accessibility claim.** The form has labels, a legend, `aria-invalid`
  and a skip link, and nothing tests them in a browser, so the blueprint does
  not claim `accessibility`.
- **A sitemap, internationalization or browser tests.** There is one page and
  one language, and the only browser Vitest's component mode can drive is one
  Playwright downloads from outside the npm registry, which this recipe does
  not do.

## Trade-offs made on your behalf

- **Vitest 5.0.1, not the 4.1 line `sv` asks for.** npm cannot resolve Vitest
  4.1's optional peer set at all (it fails inside its dependency resolver), and
  5.0 works with the same configuration.
- **An override pinning `cookie` to 0.7.2.** SvelteKit 2.70.3 still depends on
  `cookie` 0.6, which carries a low-severity advisory (GHSA-pxg6-pf52-xh8x).
  0.7 only adds validation, and every test passes on it. Remove the override
  when SvelteKit moves.
- **`style-src 'unsafe-inline'`.** Vite injects styles as `<style>` elements in
  development and Svelte transitions do at run time. Scripts get a nonce and no
  `'unsafe-inline'`; styles are the weaker half, deliberately.
- **`ORIGIN` is mandatory.** It costs one environment variable in every
  deployment and `vite preview`, and it removes a class of Host-header bugs.
- **The built-server tests pick a free port and then start the server on it.**
  There is a moment in which another process could take the port; the tests
  fail loudly if it does, and never talk to somebody else's server silently.
- **No telemetry to switch off.** None of `sv`, SvelteKit, Vite, Vitest,
  ESLint, Prettier or Tailwind collects any; the `sv` CLI reaches the network
  only for community add-ons, which this recipe does not use.

## Compared with the alternatives here

- **`nextjs-fullstack-app`** — React on Next.js with Postgres through Drizzle.
  Pick it when the application's centre is its database and the team writes
  React. Pick this one for a smaller runtime and form actions that work
  without JavaScript; it has no database at all.
- **`nuxt-app`** (in progress) — Vue on Nuxt, the closest equivalent of this in
  another component model. The choice between them is Vue or Svelte, and which
  one the team already knows.
- **`angular-app`** (pull request #154) — a client-rendered Angular single-page
  application with i18n and a strict network boundary. Pick it for a large
  team that wants Angular's conventions and dependency injection, or when
  there is a separate API; pick this one for server rendering and forms that
  post without JavaScript.
- **`astro-content-site`** — static pages from content. Smaller and simpler
  when nothing depends on the request.

## Cost of adoption

About ten minutes, most of it the install. Node.js 22.13 or newer and nothing
else: no Docker, no database, no browser download, no account.
