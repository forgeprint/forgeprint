# TypeScript Senior Backend Engineer

## What it changes

An agent writing a Node.js service in TypeScript produces code that compiles,
and compiling is exactly the problem: the compiler accepts `req.body as
Order`, a promise nobody awaited, and a `pool.query` between `BEGIN` and
`COMMIT`. All three pass review and fail in production. This expert targets the
places where TypeScript's types stop being true:

- **The edge is parsed, not cast.** zod schemas on body, query, params, the
  environment and other services' responses. `z.strictObject` for bodies,
  because Zod 4's `z.object` strips unknown keys silently.
- **Promises are awaited, returned, or handed off by name.** `no-floating-promises`
  and `no-misused-promises` as errors, Node's `throw` default for unhandled
  rejections left intact, Express pinned to 5 so async handler failures reach
  the error middleware.
- **Errors are a union, and one mapper turns them into RFC 9457 problem
  details**, with lint failing when a new error is not mapped.
- **Transactions hold one client.** node-postgres runs each `pool.query` on
  whichever connection is free; a transaction built from them is not one.
- **Every outbound call has a deadline**, and SIGTERM drains instead of drops —
  proven by sending the signal during a request.

Six checklists — boundary validation, promise discipline, errors and logs, pool
and idempotency, lifecycle, test layers — and nine refusals.

## What it fits

- Writing or reviewing HTTP handlers, repositories and workers in a TypeScript
  service on Node.js 24 LTS, with Express 5, Fastify 5, Hono 4 or NestJS.
- PostgreSQL through node-postgres. The transaction and pool rules name its
  API; the principles carry to another driver, the commands do not.
- A service whose startup, shutdown and health endpoints have never been tested
  by actually sending a signal or stopping the database.

## What it does not fit

- **Deciding the structure.** Module boundaries, service splits and the
  persistence model are the architect's; this expert builds inside them. The
  catalog's architect today is .NET-specific
  ([`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)).
- **Designing the API contract.** It generates the specification from the zod
  schemas so the document cannot drift, but what the resources and status
  codes should be is an API designer's decision.
- **A security audit.** It applies the input, error and logging rows a backend
  engineer owns, and defers the review to
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **The database schema.** Tables, indexes and migrations belong to
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Frontend TypeScript, Deno, Bun or edge runtimes.** The shutdown, signal and
  pool rules assume a long-running Node.js process.
- **Plain JavaScript.** Half the checks are type-aware lint rules; without
  types they do not run.

## Pros and cons

**In its favour:** almost every row is a lint rule, a grep, or a test that does
the failing thing on purpose — sends SIGTERM, replays an idempotency key, stops
the database. It names the specific defaults that hurt (Zod 4 stripping,
undici's 300-second wait, a pool that waits forever for a connection).

**Against it:** it pins a lot, and the TypeScript ecosystem moves fast.
TypeScript 7 is already `latest` while type-aware linting still needs 6.0, and
that split will close on a date nobody has announced. It assumes PostgreSQL and
a container orchestrator; a serverless function has a different lifecycle and
half of §6 does not apply. And it was drafted by a tool from documentation, not
from a person's review history — `provenance: generated` says so.
