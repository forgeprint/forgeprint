# Changelog — nestjs-api

## 1.0.0 — 2026-09-25

First version.

A NestJS 12 HTTP API on Postgres 18 through TypeORM 1.1, with a global JWT
guard and an explicit `@Public()` opt-out, a global `ValidationPipe` that
rejects undeclared properties, RFC 9457 problem details for every error,
`@nestjs/swagger` OpenAPI, end-to-end tests with supertest against a real
Postgres, a multi-stage non-root image and a CI workflow.

**Drafted by a tool** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where it ranked fifth: `@nestjs/core` at 10.3M downloads a week and NestJS at
6.7% in the 2025 Stack Overflow survey, with no NestJS blueprint in the
catalog. Its recipe runs in CI like every other and nobody has run a service
on it, so it is `tier: community` and `provenance: generated`, and says so
wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).
**CI-tested, not manually verified.**

What the recipe proves when it runs, rather than asserts:

- the end-to-end tests: no token, a forged token, a wrong-audience token and a
  token with no `exp` are all refused; a controller with no decorator is
  refused; the only `@Public()` handler is the health check; an undeclared
  property is a 400; one caller cannot list or read another's items; the
  applied migrations produce exactly the schema the entities describe;
- `npm run migration:check` after the migrations are applied;
- the built image runs as `node`, runs its own migrations from a one-off
  container, exits naming the missing settings when started unconfigured, and
  when configured answers `/health`, refuses `/items` with a problem document
  and publishes an OpenAPI document.

Versions were read from the npm registry and Docker Hub on 2026-09-24:
`@nestjs/*` 12.1.0 (`config` 12.0.1, `jwt` 12.0.2, `swagger` 12.0.2,
`typeorm` 12.0.1), `typeorm` 1.1.1, `pg` 8.23.0, `class-validator` 0.15.1,
TypeScript 6.0.3, `node:22.23.3-alpine3.24`, `postgres:18.6-alpine3.24`.

Four things came out of building it rather than describing it:

- **TypeScript 7 does not fit.** `@nestjs/swagger` 12 declares a TypeScript
  peer of `^5.5 || ^6`, so the recipe pins 6.0.3.
- **TypeORM 1.1 declares Node `^22.13`**, which is why `requires_tools` says
  22.13 rather than 22.
- **An unannotated `PORT = 3000` is not a number.** With no type annotation the
  decorator metadata says `Object`, implicit conversion leaves `"8080"` a
  string, and `@IsInt()` refuses it. `@Type(() => Number)` and a test fix it.
- **A container that is expected to exit is waited for, not attached to.** On
  the machine the recipe was drafted on, a foreground `docker run` of the
  unconfigured image never returned although the container had exited. The
  check runs it detached and waits with `docker wait` under a timeout, which
  also means a regression that lets it start fails the step instead of hanging
  it.

### Planned

- Rate limiting with `@nestjs/throttler`, and a readiness probe that checks the
  database — both deliberately left out of the first version and named in
  `overview.md`.
