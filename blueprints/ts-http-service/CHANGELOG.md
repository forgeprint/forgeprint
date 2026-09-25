# Changelog — ts-http-service

## 1.2.0 — 2026-09-25

Feature: framework option, Express 5, per D12 of
[the expansion plan](../../docs/research/2026-09-24-expansion-plan.md).

An `express-api` blueprint would have claimed the same language, type and
requirements as this one and differed in one import, so it is an option here
instead of a second slug ([ADR 0001](../../docs/decisions/0001-no-variants.md)).

- **`options.framework: [hono, express]`.** Hono stays the default and the
  first value, so the pull request check runs what it ran before. Express is
  pinned at 5.2.1, the current 5.x on npm on 2026-09-25, with
  `@types/express` 5.0.6.
- **Only the steps that differ are guarded:** `package.json` and the four
  source files. The configuration, the container, CI, the README and every
  check against the running image are shared, so both branches are proved by
  the same curl.
- **The same guarantees, in Express's own idioms.** Claims live in a typed
  `res.locals`; the protected routes are an `express.Router()` with the
  middleware on it; the route-table test walks `app.router.stack`, including
  mounted routers, and fails on any route outside the allow-list that answers
  without a token.
- **Two things Express needs that Hono did not.** A terminal error handler,
  because Express's own one prints the stack trace unless `NODE_ENV` is
  `production` and the node image does not set it — tested with a handler that
  throws. And `x-powered-by` turned off, also tested.
- **`express` is added to `stack`.** `validate` accepts a stack value that one
  option needs, and it is what lets `resolve` find this blueprint for somebody
  who asks for Express.
- **The install step verifies with `npm ls --depth=0`** rather than importing
  Hono, so it is the same step in both branches.

The Express tests run the app on a loopback port the operating system picks
and call it with Node's own `fetch`. An Express app is a request listener, not
a fetch handler, and a test client library would have been a dependency for
something Node already does.

## 1.1.0 — 2026-09-24

The routing convention became a check, from the architecture review
([2026-09-23](../../docs/reviews/ts-http-service/2026-09-23.md), finding 1).

A route is authenticated by where it is declared — on `protectedRoutes` rather
than on `app` — and nothing stopped somebody declaring one in the wrong place.
That is the single mistake the convention cannot prevent, and it is silent: the
route works, the tests pass, and the endpoint is public.

- **A test walks `app.routes`**, which Hono exposes, and fails on any route
  that answers a request carrying no token. Middleware comes back as `ALL` and
  is filtered out; `GET /health` is the allow-list, written out, so making a
  route public is now a line somebody adds on purpose.
- **It refuses to pass on an empty route table.** A loop over nothing asserts
  nothing, which is how a check like this stops working without failing.

The same finding as `go-http-service` 1.1.0, in the other language. No change
to the service, one test, no new step.

## 1.0.0 — 2026-09-23

First version.

An HTTP service on Hono 4.13 with bearer token verification, a container that
drops its development dependencies and runs as a non-root user, and tests that
prove an unauthenticated request is refused — asserted through the fetch
handler and again against the running image.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where
TypeScript was one of the two languages most missing from `api` and Hono, at
46M downloads a week, had come within half of Express.

Its recipe runs in CI like every other and nobody has run a service on it, so
it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

One thing came out of building it rather than describing it: Hono's context
variables need a declared `Env` type, or `c.get('claims')` is `any` and every
read of it is an unchecked cast. The tests passed either way — which is exactly
why it is worth writing down.
