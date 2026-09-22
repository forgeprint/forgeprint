# Multi-tenant SaaS API — agent context

Context for an agent working in a project created from the
`dotnet-multitenant-saas-api` blueprint. Read it before touching anything that
reads or writes data.

---

## The one thing that matters here

Every row belongs to a tenant, and a tenant must never see another tenant's
rows. Everything below exists to make that true by construction rather than by
remembering.

A cross-tenant leak is not a bug like other bugs. It is a breach: it is
reportable, it is not reversible by deploying a fix, and it usually surfaces as
a customer seeing a competitor's data. Code that weakens isolation is rejected
even when it is convenient and even when it passes review otherwise.

## Where the tenant comes from

`TenantResolutionMiddleware` reads a `tenant_id` claim from the validated access
token and nothing else.

**Never resolve a tenant from a header, a query string, a route value, a
subdomain parsed in code, or a request body.** All of those are chosen by the
caller. A caller who can name the tenant can read that tenant.

The middleware runs after authentication and before authorization, so an
unauthenticated request never reaches tenant-scoped code. The default
authorization policy requires the claim, so an endpoint cannot accidentally be
tenant-free: making one public takes an explicit `.AllowAnonymous()`, and the
only one that has it is `/health`.

## Layout

```
src/Saas.Api/
  Program.cs                      composition root, middleware order, endpoints
  Tenancy/ITenantContext.cs       the tenant of the current request
  Tenancy/TenantResolutionMiddleware.cs   claim -> tenant, and nothing else
  Data/AppDbContext.cs            where isolation is enforced
  Data/DatabaseRegistration.cs    how the tenancy strategy reaches EF Core
  Data/ProviderRegistration.cs    the only file naming a database provider
tests/Saas.Api.Tests/             isolation tests — the point of the suite
```

## Rules for this project

### Isolation lives in the data layer, never in the endpoint

An endpoint must not filter by tenant. If you find yourself writing
`.Where(x => x.TenantId == tenant.TenantId)` in an endpoint, the model is not
wired correctly — fix `AppDbContext`, not the endpoint. Isolation that depends
on every author remembering it is isolation that fails on a Friday.

### Do not disable the query filter

`IgnoreQueryFilters()` removes tenant isolation for that query. There are
legitimate uses — a background job that genuinely spans tenants, an
administrative export — and every one of them:

- lives in a clearly named service, never in a request-scoped path,
- is reviewed as a security change,
- carries a comment explaining why the tenant boundary is being crossed.

If you cannot write that comment convincingly, do not write the call.

### New entities are tenant-owned by default

Adding an entity means deciding whose it is. Under the shared-database option,
implement `ITenantOwned`, add the tenant column, the composite index, and the
query filter in `OnModelCreating` in the same change. An entity that is
genuinely global — a country list, a plan catalogue — is the exception and says
so in a comment.

Forgetting the filter on a new entity is the most common way this design fails,
which is why every entity gets an isolation test.

### Never trust a tenant identifier that reaches a connection string or SQL

Under the database-per-tenant option the identifier becomes part of a
connection string. `TenantDatabaseName.For` validates it against a strict
pattern and refuses anything else. Do not route around it, and do not build
connection strings by concatenation anywhere.

The same caution applies to raw SQL: `FromSqlRaw` bypasses query filters.
Parameterise, and add the tenant predicate yourself, or do not use it.

### Tests prove isolation; they do not assume it

The isolation tests are not coverage decoration. Each one states an attack:
read another tenant's row, write a row as another tenant, rely on a cached
model. When you add an entity or change how the tenant is resolved, add the
matching test first and watch it fail.

### Keep the provider in one file

Only `Data/ProviderRegistration.cs` names a provider. That is what lets the
`database` option be a one-file change, and it is why connection-string
manipulation lives there too.

### Cross-tenant work is explicit and rare

Analytics across tenants, a migration runner, a support tool: each is a
deliberate, separately named component that constructs its own context outside
the request scope. It never reuses the request-scoped `AppDbContext`.

## Onboarding a tenant

| Option                    | What onboarding means                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared-db-tenant-column` | Nothing at the database level. A token with a new `tenant_id` claim starts working immediately, which is convenient and also means a typo in a claim silently creates an empty tenant |
| `db-per-tenant`           | Create the database, run migrations against it, then the first request works. Automate this; doing it by hand is how a tenant ends up on an old schema                                |

Under `db-per-tenant`, migrations are applied per database. Generate the script
once and run it against every tenant database as a deployment step, and keep a
record of which tenant is at which migration.

## Commands

| Task                            | Command                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| Build                           | `dotnet build`                                                    |
| Test                            | `dotnet test`                                                     |
| Run                             | `dotnet run --project src/Saas.Api`                               |
| Start the local database        | `docker compose up -d`                                            |
| Add a migration                 | `dotnet ef migrations add <Name> --project src/Saas.Api`          |
| Migration script for deployment | `dotnet ef migrations script --idempotent --project src/Saas.Api` |
| Build the image                 | `docker build --tag saas-api:dev .`                               |

## Configuration

| Key                         | Meaning                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ConnectionStrings:Default` | The database, or under `db-per-tenant` the server and credentials whose database name is replaced per tenant |
| `Oidc:Authority`            | The OIDC provider that issues access tokens                                                                  |
| `Oidc:Audience`             | This API's identifier at that provider                                                                       |

The provider must place a `tenant_id` claim in the access token. Mapping a user
to a tenant is the identity provider's job, not this API's: an API that decides
tenancy from its own tables can be argued into the wrong answer.

In a container these keys are environment variables with `__` in place of `:`.

## When you are asked to add an endpoint

1. Write the endpoint. Do not filter by tenant in it.
2. Leave the default authorization policy in place unless the endpoint is
   genuinely public, and say so explicitly if it is.
3. If it introduces an entity, make it tenant-owned and add the filter.
4. Add an isolation test for that entity: tenant A writes, tenant B cannot read.
5. Run `dotnet test`. A green suite that contains no isolation test for your new
   entity is not evidence of anything.
