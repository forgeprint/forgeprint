# Nuxt App — agent context

A server-rendered Nuxt 4 application: Vue pages under `app/`, one Nitro API
route under `server/api/`, code both sides import under `shared/`. Read this
before adding a page, a route or a dependency.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
app/pages/                     one file per route; every page calls usePageSeo()
app/components/                Vue components, auto-imported by name
app/composables/usePageSeo.ts  the only place that writes title, description, canonical, og:*
server/api/                    Nitro routes; the HTTP method is in the file name
shared/                        imported by app/ and server/ alike: schemas, pure functions
test/unit/                     plain Node, no Nuxt runtime
test/nuxt/                     components mounted in a Nuxt runtime on happy-dom
test/e2e/                      the production build, started and asked over HTTP
```

`app/` never imports from `server/`, and `server/` never imports from `app/`.
What both need goes in `shared/` and is imported as `#shared/<file>`. Code in
`shared/` may not use Vue or Nitro auto-imports, because it has to run in both
places and in `test/unit/`, where neither exists.

## Rules that are not style preferences

**Every page calls `usePageSeo({ title, description })`.** Both fields are
required by its type, so a page without a description fails `npm run
typecheck`. Do not call `useSeoMeta` or `useHead` for these tags anywhere
else: two sources for a title is how a page ends up with the wrong one.

**The canonical URL comes from configuration, never from the request.**
`runtimeConfig.public.siteUrl` (set `NUXT_PUBLIC_SITE_URL` in production) plus
the route path, joined by `shared/canonical.ts`. Do not replace it with
`useRequestURL()` — that reads the `Host` header, which the client chooses,
and the e2e suite has a test that sends a forged one. Do not "simplify"
`canonicalUrl` to `new URL(path, site)`: a path starting with `//` would then
change the host, and the unit test for exactly that will fail.

**A server route validates its body before using it.** `readValidatedBody`
with the zod schema from `shared/`, after a `content-length` check. h3 reads
the whole body into memory, so the size check has to come first, and a
request without a declared length is refused with 411 rather than read.
`readBody` without a schema does no checking at all; do not use it.

**The method is in the file name.** `greeting.post.ts` answers POST only.
A new route that should accept GET is a new file, `*.get.ts`. A file without a
method suffix answers every method, which is almost never what was meant.

**`h3` is pinned to 1.15.11 in `package.json` on purpose.** Nuxt 4.5 runs on
Nitro 2, which uses h3 1. `@nuxt/eslint` pulls in a tool that depends on h3 2,
and without the direct pin npm hoists that one to the top of `node_modules`.
`@nuxt/test-utils` then detects h3 2, tries to load a package that is not
installed, and the component tests fail before they start. Move the pin only
when Nuxt itself moves to h3 2.

**Telemetry stays off.** `telemetry: false` in `nuxt.config.ts` means Nuxt
never loads its telemetry module. Keep it.

**The form's check is a convenience; the route's check is the control.** The
component parses with the same schema so the person typing gets an answer
without a round trip. Anything that must hold goes in the route.

## Commands

```
npm install          also runs `nuxt prepare`, which writes .nuxt/ (types, ESLint config)
npm run dev          development server
npm run lint         ESLint with the rules @nuxt/eslint generates; warnings fail
npm run typecheck    vue-tsc over app/, server/, shared/ and the tests
npm test             unit, component and e2e; e2e builds the app first
npm run build        production build into .output/
node .output/server/index.mjs   run the build; NITRO_HOST and NITRO_PORT choose where
```

If ESLint or the type check complains about something under `.nuxt/`, run
`npx nuxt prepare` — the generated files are stale, not wrong.

## When you are asked to add a page

1. Create `app/pages/<name>.vue`. The file path is the route.
2. Call `usePageSeo` with a real title and a description of at least twenty
   characters.
3. Put one `<h1>` in it.
4. Add an e2e test that fetches the path and asserts the title and the
   canonical URL, as `test/e2e/app.test.ts` does for `/`.

## When you are asked to add an API route

1. Put the request schema in `shared/`, next to its response type.
2. Create `server/api/<name>.<method>.ts`: size check, then
   `readValidatedBody` (or `getValidatedQuery` for GET), then the work.
3. Add a unit test for the schema and e2e tests for a valid request, an
   invalid one (400) and one over the size limit (413).
4. If the route costs something per call — a paid upstream, a write to
   storage — it needs a rate limit, and nothing here provides one yet. Say so
   in the pull request rather than shipping it without.

## What is deliberately not here

No authentication, no session, no database, no state. The route is public and
stateless. Adding any of those is a design decision, not a step: see
`overview.md` for what it would take.
