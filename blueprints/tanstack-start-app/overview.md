# TanStack Start App

A TanStack Start application on Vite: TanStack Router's file-based routes with a
validated search parameter and a parsed path parameter, server functions for
everything that needs the server, one account behind a sealed session cookie, a
`beforeLoad` guard in front of the protected pages, and a Nitro build that runs
as a plain Node server. The proof at the end of the recipe is a set of requests
against that built server, not a green build.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real application on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

**The API is young, and that is the main risk.** TanStack Start is on 1.x and
still moves between minor releases: while this blueprint was being
written, the server-function method `inputValidator` was renamed `validator`
(the old name still works, marked deprecated), the recommended scaffolder moved
from `create-start` to `@tanstack/cli`, and the Node adapter it generates,
Nitro 3, is still published as a beta. Every version here is pinned exactly and
the recipe runs weekly in CI, which catches breakage in the recipe; it does not
make an upgrade in your project painless. Budget for reading release notes.

## What you get

- The official generator's output (`@tanstack/cli` 0.71.0, React, Nitro), with
  every version then pinned exactly, the devtools and the router CLI removed, and
  the generator's telemetry turned off.
- **Routes:** `/` and `/notes` public, `/notes/$noteId` with the id parsed to a
  number (anything else is a 404), `?page=` validated with Zod (a bad value
  redirects to `?page=1`), `/login`, and `/dashboard` behind a pathless
  `_authed` layout whose `beforeLoad` redirects to `/login?redirect=...`.
- **Server functions:** the current user, sign-in and sign-out. Sign-in
  validates its input with Zod, answers a malformed request with 400, refuses an
  off-site redirect target, and is a plain HTML form post, so it works before
  the page's JavaScript loads.
- **Authentication:** one account from `AUTH_USER`, stored as an scrypt hash
  (`node:crypto`, no package), and a session cookie sealed by Start's
  `useSession` — encrypted, signed, `HttpOnly`, `SameSite=Lax`, `Secure` in
  production, eight hours.
- **Configuration that refuses to be wrong:** development runs on published,
  obviously fake values; the production build refuses a missing or published
  `SESSION_SECRET` or account, logs why, and answers 503 to every request.
- **CSRF protection** on server functions, written out in `src/start.ts`.
- **A sign-in rate limit**: ten attempts per address per fifteen minutes, then
  429, checked before the expensive password hash.
- **Security headers** on every rendered response: framing forbidden, `<base>`
  and form targets same-origin, `nosniff`, a referrer policy.
- **Tests:** Vitest unit tests for the configuration rules, hashing, the rate
  limiter, schemas and the guard, and an e2e suite that starts the built server
  on ports the operating system picks and proves the redirect, sign-in, the
  cookie attributes, the tampered-cookie case, the 400s, the CSRF 403, the 429,
  the headers and the misconfiguration refusals.
- **CI:** a GitHub Actions workflow, actions pinned by commit SHA, read-only
  permissions, running build, type check, unit and e2e tests.

## Options

None. The stack is one shape, and the choices a reader would want to vary —
the user store, the deployment target — are the seams described below rather
than switches.

## What it fits

- A server-rendered React application where you want the router to be the
  centre of the design: typed links, typed search params, loaders keyed by what
  they read.
- A team that prefers **explicit server functions** — a named function, an
  input validator, an HTTP endpoint you can see — to React Server Components.
- An internal tool or small product with **one operator account**, where the
  sign-in, the session and the guard need to be right before anything else is.
- A project that wants Vite's development loop and plugin ecosystem on the
  server as well as in the browser.

## What it is NOT for

- **Many users, sign-up, password reset, roles or OAuth.** There is one account
  from an environment variable. Replacing `readAuthUser` with a real store is the
  first thing a multi-user product does, and the blueprint does not do it for
  you.
- **A database or migrations.** Nothing is persisted. If the pages read and
  write a relational database, `nextjs-fullstack-app` sets that up.
- **A site that has to be static.** The build is a Node server. For content that
  does not change per request, use `astro-content-site`.
- **A client-only SPA behind somebody else's API.** If there is no server of
  your own, `vite-react-spa` (in review) is smaller and has no server to
  operate.
- **A shared rate limit, a script policy, audit logging.** See Cons.
- **Anybody who needs a stable API more than a modern one.** See the risk
  above.

## Compared with the closest blueprints

- **`nextjs-fullstack-app`** is the other React full-stack blueprint. Next.js is
  a framework around the App Router and React Server Components, with its own
  compiler and conventions for what runs where. This one is **router-first**:
  TanStack Router's typed routes and loaders are the application, Vite is the
  build tool, and the server boundary is an explicit `createServerFn` call rather
  than a component that happens to run on the server. That one sets up Postgres
  and migrations and has no authentication; this one has authentication and no
  database.
- **`vite-react-spa`** (in review) is also React on Vite, but client-only: it
  builds static files and talks to somebody else's API. This one has a **server
  runtime** — server rendering, server functions, a session cookie — and
  therefore a server to deploy, configure and keep patched.

## Pros

- **The guard is proved at the HTTP level**, not only in a unit test: the built
  server answers `/dashboard` without a session with a 307 to
  `/login?redirect=%2Fdashboard`, and with a valid cookie with 200.
- **Production cannot start on development secrets.** The check runs when the
  server loads, and the e2e suite starts a server with the published secret to
  prove it refuses.
- **Sign-in works without JavaScript** because it is a form post to the server
  function's URL. Nothing about authentication depends on hydration.
- **Typed routing is real.** A `Link` to `/notes/$noteId` without a numeric
  `noteId` does not compile, and a renamed route breaks the build instead of a
  page.
- **No authentication library.** The session sealing is Start's, the hashing is
  Node's; the supply chain for the security-critical path is the framework and
  the runtime.
- **The recipe checks the browser bundle** for server-only strings, which is the
  mistake this framework makes easiest.

## Cons

- **Young API**, stated above. Pinned exactly, and upgrades will cost reading.
- **Nitro 3 is a beta** (`3.0.260903-beta`), chosen because it is what TanStack's
  own generator emits for a Node server. It is pinned exactly; watch its
  releases.
- **The build prints many `"use client"` directive warnings** from TanStack
  Router's own files. They are harmless and come from upstream.
- **The sign-in rate limit is per process.** Ten attempts per address per
  fifteen minutes, counted in memory: several instances or a restart each start
  from zero, and behind a proxy all clients share the proxy's address. Move it
  to the proxy or a shared store before either matters.
- **The Content-Security-Policy does not restrict scripts.** It forbids framing,
  `<base>`, off-site form targets and plugins; a script policy needs a nonce on
  every inline script Start's server rendering writes, and is not set up. HSTS
  is left to the proxy that terminates TLS.
- **Sessions cannot be revoked one at a time.** The session lives in the sealed
  cookie; signing out deletes the browser's copy, and a copied cookie stays
  valid until its eight hours are up. Rotating `SESSION_SECRET` ends them all.
- **An error during server rendering is serialized into the page**, including
  its message. Start does this by default; the messages in this project are
  written so that none carries a secret, and new ones must be too.
- **`src/routeTree.gen.ts` is generated and committed**, and only `dev` and
  `build` regenerate it. A new route file needs one of them before the type
  check sees it.

## Cost of adoption

A few minutes: the whole recipe ran in about two minutes on a warm npm cache,
most of it the install, the production build and the e2e suite. Node.js 22.12
or newer, npm and curl; no Docker, no browser download, no account.
