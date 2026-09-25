# Vite React SPA — agent context

A client-only single-page application: React with React Router, built by Vite
into static files, styled with Tailwind. Read this before adding a route,
calling the API, or reading configuration.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
index.html            the only HTML file; Vite injects the bundle into it
src/main.tsx          reads configuration, builds the router, mounts React
src/config.ts         the one function that checks VITE_API_BASE_URL
src/api/client.ts     the only code that touches the network
src/routes.tsx        every route, the layout, the error and not-found pages
src/pages/            one component per page
src/*.test.ts(x)      Vitest in jsdom, next to what they test
vite.config.ts        plugins, the build-time config check, the test setup
eslint.config.js      the boundaries below, enforced
```

## There is no server

Everything in this project runs in the visitor's browser, and the visitor can
read all of it. That one fact decides most of the rules below.

- **Nothing here is secret.** A `VITE_` variable is compiled into the bundle as
  plain text. An API key, a token or a password in one is published to every
  visitor, and "it is only in the build" does not change that. Anything that
  needs a secret belongs in the API, not in this project.
- **Nothing here is authorization.** Hiding a link or a route is presentation;
  the API decides what a caller may see. A check that only exists in this code
  can be skipped by anybody with developer tools.
- **If you need server rendering, a server route or a database, this is the
  wrong blueprint.** Use `nextjs-fullstack-app`; do not bolt a server onto this
  one.

## Rules that are not style preferences

**Configuration is read once, in `src/main.tsx`, through `readConfig`.** The
lint config refuses `import.meta.env` anywhere else. A second place that reads
the environment is a second set of rules about what a valid value is, and the
two drift.

**`VITE_API_BASE_URL` has no default and must be https outside localhost.**
`vite.config.ts` runs the same `readConfig` at build time, so a missing or
plain-http URL fails the build instead of the first visitor. A default would
mean a build that silently talks to the wrong API.

**Only `src/api/` calls `fetch`.** The lint config refuses the global anywhere
else. Every response is `unknown` until a guard in `client.ts` has checked its
shape; a type annotation on `response.json()` is a claim the server can break
without the compiler noticing.

**Paths go through `resolveApiUrl`, which refuses to leave the API's origin.**
The moment a path is built from a route parameter, a value like
`//elsewhere.example` would otherwise send the request — and whatever it
carries — to another host.

**Credentials are `same-origin`.** No cookies go to the API unless somebody
changes that line deliberately, together with the API's CORS settings.

**Data is loaded by route loaders, not in effects.** The router runs the loader
before rendering and aborts its signal when the user navigates away. A fetch in
`useEffect` has neither, and it is how a slow response overwrites the page the
user moved on to.

**Every page renders a `<title>`.** React hoists it into `<head>`. A single-page
app that does not do this has the same title on every page, and a screen reader
user cannot tell where a navigation went.

**Focus moves to `<main>` after a client-side navigation.** A full page load
does this for free; a client-side one leaves focus on the link that was clicked
and announces nothing. `Layout` in `routes.tsx` does it and a test proves it.
Do not remove it to fix a visual outline — style the outline instead.

**No source maps in production.** `build.sourcemap` is `false`, CI fails the
build if a `.map` appears in `dist/`. A map publishes the original source. If
an error tracker needs maps, upload them to it; do not ship them.

**The host must rewrite unknown paths to `index.html`.** Routing happens in the
browser, so `/about` does not exist as a file. Without that rewrite a reload on
any route but `/` is a 404.

## What the accessibility tests check, and what they cannot

`src/routes.test.tsx` runs axe-core against every route in jsdom, and asserts
the title changes and focus moves on navigation. That catches structure: names,
roles, landmarks, labels, duplicate ids.

**It is not an audit.** jsdom does no layout, so colour contrast is switched off
by name, and nothing here sees focus order, keyboard traps, zoom and reflow, or
whether any text describes anything. Check those in a browser before claiming
WCAG 2.2 AA.

## Commands

```
npm run dev          development server (needs VITE_API_BASE_URL)
npm run typecheck    tsc, no output
npm run lint         ESLint, type-aware
npm test             Vitest, once
npm run build        static files in dist/ (needs VITE_API_BASE_URL)
```

`package-lock.json` is committed, and CI installs with `npm ci` from it. Add a
dependency with an exact version (`npm install --save-exact name@1.2.3`) and
commit the lock file in the same change.

## Adding a route

1. Create the page in `src/pages/`, rendering a `<title>` and exactly one
   `<h1>`.
2. Add it to the children in `createRoutes`. If it needs data, give it a
   `loader` that calls a method on the `ApiClient` it was given, and an
   `errorElement`.
3. If it needs a new endpoint, add a method to `ApiClient` with a guard for the
   response shape. Nothing outside `src/api/` calls `fetch`.
4. Add the path to the `it.each` list in `routes.test.tsx`, so axe runs on it.

## What this does not do

No authentication, no server, no server rendering, no database, no API — the
data comes from somewhere else, and `VITE_API_BASE_URL` says where. No state
management library, no data-fetching cache, no forms or mutations, no
internationalisation, no service worker, no error reporting (a failed load is
shown to the user and nobody else hears about it), no Content-Security-Policy
or other security headers (set them at the host, where the API origin is
known), no deployment.
