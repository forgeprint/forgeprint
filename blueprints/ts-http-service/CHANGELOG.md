# Changelog — ts-http-service

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
