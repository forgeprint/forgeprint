# NestJS API — agent context

A NestJS 12 HTTP API on Postgres through TypeORM, with a global bearer token
guard. Read this before adding a route, an entity or a setting.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/main.ts                      the listener; docs switch; shutdown hooks
src/app.module.ts                config, database, guard, pipe, filter: the whole pipeline
src/config/environment.ts        every setting, validated before anything is built
src/auth/jwt-auth.guard.ts       the only place that decides who a caller is
src/auth/decorators.ts           @Public() and @Subject()
src/problem/problem-details.filter.ts   every error body, RFC 9457
src/items/                       one feature: entity, DTOs, service, controller, module
src/database/options.ts          the one DataSource definition, app and CLI alike
src/database/migrations/         reviewed SQL, listed by class in options.ts
test/app.e2e.test.ts             the application, a real Postgres, supertest
```

## Rules that are not style preferences

**Every route is authenticated unless it says `@Public()`.** `JwtAuthGuard` is
registered as `APP_GUARD`, so it runs for routes that did not exist when it was
written. Do not add `@UseGuards(JwtAuthGuard)` to a controller: it is already
there, and a second copy suggests the first one is optional. A test lists every
`@Public()` handler and fails when the list changes — making a route public is a
line somebody changes on purpose, in the test as well as the controller.

**Identity comes from `@Subject()`, never from the request body or the path.**
It is the verified `sub` claim. A DTO field called `ownerId` is how one user
writes into another's data, which is why the whitelist rejects it.

**Every query that reads an item filters on the owner.** `ItemsService` takes
the owner as a parameter of every method. Somebody else's item is a 404, not a
403: a 403 confirms the id exists (OWASP API1:2023).

**Every `verifyOptions` field is load bearing.** `algorithms: ['HS256']` stops
algorithm confusion; `audience` stops a token minted for another service
working here; `issuer` stops another issuer that shares the secret. And the
guard checks `exp` itself, because jsonwebtoken treats a token with no `exp` as
valid forever. Each removed leaves code that still looks correct; each has a
test.

**401, not 403, and no reason.** "Who are you" and "you may not" are different
answers, and which check failed helps an attacker and nobody else.

**The pipeline lives in `AppModule`, not in `main.ts`.** `APP_PIPE`,
`APP_FILTER` and `APP_GUARD` are providers, so the tests that import
`AppModule` get exactly what production gets. `app.useGlobalPipes()` in
`main.ts` would be skipped by every test and nobody would notice.

**Input is validated with `whitelist` and `forbidNonWhitelisted`.** A property
a DTO does not declare is a 400, not silently dropped. Every body is a DTO
class with class-validator decorators; a body typed as an interface is not
validated at all, because interfaces do not exist at runtime.

**Entities never leave the service.** Controllers return DTOs (`ItemDto.from`),
so adding a column does not publish it.

**Configuration is validated once, before anything is constructed.**
`validateEnvironment` names the settings that failed and never their values.
Nothing that authenticates or connects has a default. Add a setting there, with
a validator, or it does not exist — do not read `process.env` anywhere else.

**`synchronize` is `false`, always.** The schema changes through a migration
somebody read. `npm run migration:check` and a test both fail while an entity
and the migrations disagree.

**Entities and migrations are listed as classes in `src/database/options.ts`,
not globs.** A glob that matches `.ts` in development and `.js` in the image is
how an image ships with no migrations. The recipe runs the migrations from the
built image to prove it carries them.

**The service never migrates on startup.** Migrations run as a one-off
container of the same image before the new version starts. Two replicas
migrating at once is a race, and a failed migration should stop a deployment,
not crash-loop a service.

**`/health` touches nothing.** Liveness only. If it touched Postgres, one
database blip would restart every healthy container.

**OpenAPI is off unless `API_DOCS=enabled`.** `SwaggerModule` registers `/docs`
and `/docs-json` on the HTTP adapter directly, outside the guard.

## TypeScript and ESM details that bite

- NestJS 12 ships as ES modules, so this project is `"type": "module"` and
  every relative import ends in `.js`.
- `emitDecoratorMetadata` is what Nest's injection reads. `tsc` emits it; that
  is why both the build and the tests go through `tsc`, and the tests run the
  compiled output with `node --test`. A constructor parameter imported with
  `import type` has no runtime value, so its metadata is `Object` and injection
  fails at startup — import injected classes as values.
- `useDefineForClassFields` is `false`. With it on, every declared entity and
  DTO field becomes an own property set to `undefined`, which TypeORM and
  class-validator both read as a value.

## Commands

```
npm run build                 compile the service to dist/
npm test                      compile with tests, run them (needs DATABASE_URL, migrated)
npm run migration:run         apply pending migrations (needs a build)
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:check       fail if an entity and the migrations disagree
docker compose up -d --wait   the local database; `docker compose port db 5432`
```

## When you are asked to add an endpoint

1. A DTO class for the body, with class-validator decorators on every field.
2. The route on a controller. No guard decorator; `@Public()` only if it truly
   is, and then the allow-list in the test changes too.
3. Take identity from `@Subject()`, pass it into the service, filter on it.
4. `@ApiOkResponse`/`@ApiCreatedResponse` with a DTO type, so the document stays
   true.
5. A test that an anonymous request is refused and that another subject cannot
   reach the data.

## When you are asked to change the schema

Change the entity, `npm run build`, `npm run migration:generate -- src/database/migrations/<Name>`,
read the SQL, add the class to `migrations` in `src/database/options.ts`,
commit both. Never edit a migration that has run anywhere; write a new one.

## What this does not do

No rate limiting (OWASP API4:2023), no CORS, no security headers middleware, no
token issuance, no refresh, no roles, no TLS to Postgres, no pagination beyond a
fixed page of 100, no readiness probe, no structured logging, no metrics.
