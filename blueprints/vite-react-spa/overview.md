# Vite React SPA

A client-only single-page application in React and TypeScript, built by Vite
into static files. React Router handles navigation in the browser, Tailwind
styles it, and a typed API client is the only code allowed to reach the
network. There is no server in it.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has built a real application on
it first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- React 19.3, React Router 8 in data mode, Vite 8, Tailwind 4, TypeScript 6 in
  strict mode with `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`.
- `src/config.ts`: one function that checks `VITE_API_BASE_URL` — present,
  absolute, https outside localhost — run at startup and at build time.
- `src/api/client.ts`: the network boundary. Responses are checked by a guard
  before they are typed, paths cannot leave the API's origin, and no cookies go
  cross-origin.
- Routes with a layout, a loader that the router aborts on navigation, an error
  page inside the layout, a not-found page, a `<title>` per page, a skip link,
  and focus moved to `<main>` after every navigation.
- Vitest with Testing Library in jsdom: the configuration rules, the API
  boundary, the routes, the focus move, and axe-core against every route.
- ESLint 10 with type-aware `typescript-eslint`, React's hooks rules, and two
  project rules: `import.meta.env` only in `main.tsx`, `fetch` only in
  `src/api/`.
- A production build with no source maps, and a CI workflow that runs lint,
  type-check, tests and build from the committed lock file.

## Options

None. The obvious candidates — a different router, a different test
environment, a CSS approach other than Tailwind — each change enough files that
they would be different blueprints rather than switches.

## What it fits

- A front end for an API that already exists, or that another team or another
  blueprint provides: a dashboard, an admin tool, an internal application.
- An application where every user is signed in, so search engines never see
  it and server rendering buys nothing.
- Hosting as static files — a bucket, a CDN, GitHub Pages — with no server
  process to run, patch or pay for.
- A team that wants the React it already knows, without a meta-framework's
  conventions about where code runs.

## What it is NOT for

- **Anything that needs a server.** No server rendering, no API routes, no
  server actions, no database, no secrets. Use **`nextjs-fullstack-app`**: it
  has a server, Postgres and migrations, and it is the blueprint this one was
  kept apart from on purpose.
- **Pages search engines must index**, or content that changes rarely. A
  client-rendered page is empty until JavaScript runs. Use
  **`astro-content-site`**.
- **Users and sign-in.** There is no authentication. Whatever the API needs to
  authenticate a browser is a decision this blueprint deliberately does not
  make, because the right answer depends on the API.
- **The API itself.** Use `ts-http-service`, `fastapi-service`,
  `go-http-service` or `dotnet-web-api` for that half.
- **A design system, forms, state management, caching, offline support.**
  None of them is here.

## Trade-offs made on your behalf

- **React Router, not TanStack Router.** React Router has the larger install
  base (`react-router` 40.3M downloads a week against 17.0M for
  `@tanstack/react-router`, npm, week to 2026-09-21), and its data mode gives loaders with abort signals without a code
  generator. TanStack Router's typed routes are a fair reason to swap; it would
  change `routes.tsx`, `main.tsx` and the route test.
- **jsdom, not a browser.** The tests run without downloading a browser, so
  they run anywhere Node does. The price is that nothing needing layout is
  tested: contrast is switched off by name, and focus order, keyboard traps and
  reflow are not checked. A Playwright suite is the next step when those
  matter, and it downloads browsers from outside the npm registry.
- **axe-core directly, not a wrapper.** One `axe.run` and an assertion on the
  violation list; `vitest-axe` has not been released since 0.1.0.
- **No `eslint-plugin-jsx-a11y`.** It does not yet declare support for ESLint
  10, and ESLint 9 is past its end of life. The axe-core tests cover the same
  ground at runtime, on the rendered DOM.
- **TypeScript 6, not 7.** `typescript-eslint` does not yet support 7, and
  type-aware lint rules catch more than the faster compiler saves.
- **A hand-written guard, not a schema library.** One type, one guard. At a
  dozen endpoints a schema library such as zod starts paying for itself.
- **The API URL is fixed at build time.** One build per environment. Serving a
  runtime `config.json` instead would allow one build everywhere, at the cost
  of a request before the first render.
- **`credentials: 'same-origin'`.** Safe by default, and wrong for an API on
  another origin that authenticates with cookies. Changing it is one line and
  a CORS decision on the API.

## Pros

- **The client/server line is drawn in the tooling, not in prose.** Configuration
  has one entry point, the network has one module, and the lint config refuses
  a second of either.
- **The build refuses a bad API URL**, and the recipe proves it writes nothing
  when it does.
- **Tests prove the claims.** Removing the focus move or a link's accessible
  name fails a test; both were tried.
- **Static output.** No server to operate, cheap to host, and nothing on the
  host but files.
- **No browser download anywhere in the toolchain.**

## Cons

- **Nobody has run this in anger.** See the notice above.
- **The accessibility claim is narrower than the word.** axe-core in jsdom sees
  structure, not layout. `AGENTS.md` and the test file both say so.
- **Client rendering has costs a server does not.** An empty page until the
  bundle loads, and a JavaScript bundle of about 100 kB gzipped before any of
  your code.
- **The host needs a rewrite rule.** Every unknown path must serve
  `index.html`, or reloading any route but `/` is a 404.
- **Node 22.22.2 or newer.** Higher than Vite alone needs, because jsdom and
  React Router declare it.

## Cost of adoption

About five minutes on a warm npm cache: one install of roughly 250 packages,
then type-check, lint, tests and a build. Needs Node.js 22.22.2 or newer and
npm. No Docker, no database, no browser download, no account anywhere.

## Compared with the alternatives here

- **`nextjs-fullstack-app`** — the same language, React and Tailwind, and the
  opposite architecture: a server that renders pages and talks to Postgres.
  Choose it when the application owns its data; choose this one when an API
  does.
- **`astro-content-site`** — static like this one, but pages are HTML at build
  time and ship no JavaScript. Choose it for content; choose this one for an
  application.
