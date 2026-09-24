# Changelog — ts-http-service

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
