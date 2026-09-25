# NestJS API

A NestJS 12 HTTP API in strict TypeScript on Postgres through TypeORM: a
global bearer token guard with an explicit `@Public()` opt-out, validated
input, RFC 9457 problem details for every error, reviewed migrations, OpenAPI,
end-to-end tests against a real database, a non-root container and CI.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real service on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- **Authentication as the default, not a habit.** `JwtAuthGuard` is an
  `APP_GUARD`, so a route added tomorrow is protected before anybody thinks
  about it. The tests prove it with a controller that has no decorator at all,
  and list every `@Public()` handler so opening a route is a visible change.
- **Tokens checked the way that matters:** HS256 only, audience, issuer, and an
  explicit `exp` check, because jsonwebtoken accepts a token without one as
  valid forever. Forged, wrong-audience and expiry-less tokens each have a test.
- **Ownership in the data layer.** Items belong to the verified `sub`; every
  query filters on it, and a test proves one caller cannot list or read
  another's (OWASP API1:2023).
- **Input that is rejected, not trimmed.** A global `ValidationPipe` with
  `whitelist` and `forbidNonWhitelisted`: an undeclared property is a 400.
- **One error shape.** Every error — validation, 401, 404, an unhandled
  exception — is `application/problem+json` (RFC 9457). A 500 says nothing
  about its cause; the stack goes to the log.
- **Migrations that are proved, twice.** `synchronize` is off; the first
  migration is written out; `npm run migration:check` and a test both fail
  while an entity and the migrations disagree. The recipe also runs the
  migrations from the built image, the way a deployment does.
- **Configuration that fails closed.** Every setting is validated before
  anything is constructed; the process exits naming what is missing, never
  its value. The recipe starts the image unconfigured and checks it refuses.
- **OpenAPI through `@nestjs/swagger`**, off unless `API_DOCS=enabled`,
  because the UI is served outside the guard.
- **A multi-stage image** that installs from the lockfile with `npm ci`, drops
  development dependencies, runs as `node`, and carries a `HEALTHCHECK`.
- **A CI workflow** with a Postgres service, the migration check, the tests and
  the image build, actions pinned by commit.

## Options

None. The database is Postgres and the ORM is TypeORM, because a second value
for either changes the migration story, the tests and the image — the whole
recipe, not a block of it.

## What it fits

- A TypeScript team that wants the structure a framework imposes: modules,
  dependency injection, decorators, one obvious place for each kind of code.
- A service with a database and more than a handful of routes, maintained by
  more than one person, where "every route is protected unless it says
  otherwise" is worth more than a small dependency tree.
- An API that needs a published OpenAPI document generated from the code.
- Anything behind an existing identity provider that issues HS256 tokens: it
  verifies tokens and does not issue them.

## What it is NOT for

- **A small service where the framework would be the largest thing in the
  repository.** Use `ts-http-service`: Hono, three dependencies, tests with no
  server at all.
- **Issuing tokens, logins, passwords or refresh.** It only verifies.
- **Tokens from a third party or an OIDC provider.** HS256 means the verifier
  holds the signing key. Moving to JWKS is a change to `auth.module.ts`, not a
  setting. `dotnet-web-api` has an `oidc` option if the stack is open.
- **Roles and permissions.** Authenticated or not, and ownership by `sub`.
  There is no RBAC.
- **Rate limiting.** Nothing bounds how often a caller can hit a route
  (OWASP API4:2023). Behind a gateway that does it, fine; exposed directly, a
  gap. `@nestjs/throttler` is the usual addition.
- **Browsers calling it directly.** No CORS, no security headers middleware, no
  cookies.
- **A database other than Postgres**, or Prisma or Drizzle: see Options.
- **A frontend.** `nextjs-fullstack-app` is the full-stack blueprint.

## Trade-offs made on your behalf

- **TypeORM, not Prisma or Drizzle.** It is what `@nestjs/typeorm` integrates
  with through DI, and its migrations are plain classes that run from the
  built image with nothing else to download. Prisma's migration engine is a
  separate binary; Drizzle has no first-party Nest module.
- **Node's test runner, not Jest.** NestJS 12 ships as ES modules and its
  decorators need the metadata `tsc` emits. Compiling with `tsc` and running
  `node --test` on the output tests exactly what production runs, with no
  transformer and no experimental VM flag. The price: no watch mode, no
  snapshot tests, and the Nest CLI's generated `*.spec.ts` files will not run
  without adding a runner.
- **No Nest CLI.** `tsc` builds it and a `tsconfig.build.json` leaves the tests
  out. Add `@nestjs/cli` if you want `nest generate`.
- **End-to-end tests need Postgres.** No in-memory substitute: the point is to
  test the query that filters on the owner and the migrations that create the
  column. The recipe starts one; CI uses a service container.
- **HMAC, not asymmetric keys.** See "NOT for".
- **Liveness only.** `/health` touches nothing. There is no readiness probe
  that checks the database; TypeORM retries the connection five times at
  startup and the process exits if it never connects.
- **The first migration is hand-written**, so the recipe can produce it
  without a database. Later ones are generated.
- **A fixed page of 100.** `GET /items` is bounded, not paginated.
- **Base images pinned to a patch tag, not a digest**: `node:22.23.3-alpine3.24`
  and `postgres:18.6-alpine3.24`. Reproducible enough, and security patches
  arrive when you move the tag on purpose.

## Cost of adoption

Node.js 22.13 or newer, Docker with Compose, and curl. The recipe takes a few
minutes, most of it `npm install` and the image build. Expect to replace the
`items` feature and the HS256 verifier within the first week; the guard, the
filter, the configuration and the migration workflow are the parts meant to
stay.

## Compared with the alternatives here

- **`ts-http-service`** — also TypeScript and also JWT, on Hono with no
  database. Lighter and faster to test; protection there is a matter of which
  sub-application a route is mounted on, and here it is the framework's
  default.
- **`dotnet-web-api`** — the same shape in C#, with a fallback authorization
  policy as the default-deny and EF Core for the database.
- **`fastapi-service`** — the same idea in Python with SQLAlchemy.
- **`go-http-service`** — Go, a distroless image, no database.
