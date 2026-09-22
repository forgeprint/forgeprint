# ASP.NET Core REST API — agent context

Context for an agent working in a project created from the `dotnet-web-api`
blueprint. Read it before changing code.

---

## What this project is

A minimal-API service on ASP.NET Core 10 (LTS) with EF Core for persistence,
bearer-token authentication, a container image, and a CI pipeline. It is the
starting point for an HTTP API, not a framework: delete what you do not need.

## Layout

```
global.json                    SDK pin — do not bump without bumping CI too
App.slnx                       solution
src/App.Api/
  Program.cs                   composition root and endpoint map
  Data/AppDbContext.cs         DbContext and entities
  Data/DatabaseRegistration.cs the only file that knows which database is used
  Authentication/
    AuthenticationRegistration.cs  the only file that knows how tokens are validated
  appsettings.json             settings that are safe in source control
  appsettings.Development.json local development settings
tests/App.Api.Tests/           integration tests that boot the real application
Dockerfile                     multi-stage build, non-root runtime
compose.yaml                   local database only — the API runs from the SDK
.github/workflows/ci.yml       restore, build, test, container build
```

## Rules for this project

### Keep the composition root thin

`Program.cs` maps endpoints and calls registration extensions. Service wiring
lives in the `*Registration.cs` file for its area. When you add an area, add its
registration file rather than another block in `Program.cs`.

### Database choice lives in one file

Only `Data/DatabaseRegistration.cs` names a provider. No other file may call
`UseNpgsql` or `UseSqlServer`, and no other file may reference a
provider-specific type. Swapping the database must mean editing that one file
and the connection string.

### The liveness probe must not touch the database

`/health` answers whether the process is alive. If it queried the database, a
database blip would restart healthy containers and turn a degraded system into
an outage. A readiness probe that does check dependencies is a separate
endpoint, and it belongs on a separate path.

### Every endpoint is authorized or explicitly anonymous

Endpoints require authorization by default, and that is enforced rather than
asked for: `AddApiAuthentication` sets a fallback policy requiring an
authenticated user, so an endpoint with no authorization attribute is refused.
If an endpoint is public, say so in code with `.AllowAnonymous()` so the
decision is visible in review. `/health` is the one exception and is mapped
that way.

Do not add `.RequireAuthorization()` out of habit; it is redundant under the
fallback policy. `/items` deliberately carries no marker, so the test that it
refuses an anonymous caller is a test of the default itself.

### Secrets never enter the repository

No connection string with a real password, no signing key, no client secret in
any file under source control. Local development uses
`appsettings.Development.json` with local-only credentials, or user secrets.
Everything else comes from the environment.

Configuration keys this project reads:

| Key                                            | Meaning                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `ConnectionStrings:Default`                    | database connection string                                                   |
| `Authentication:Schemes:Bearer:Authority`      | token issuer, when the `jwt` option is used                                  |
| `Authentication:Schemes:Bearer:ValidAudiences` | accepted audiences, when the `jwt` option is used                            |
| `Oidc:Authority`                               | OIDC provider, when the `oidc` option is used                                |
| `Oidc:Audience`                                | API identifier registered with that provider, when the `oidc` option is used |

In a container these are environment variables with `__` in place of `:`, for
example `ConnectionStrings__Default`.

### Migrations are code, and they are reviewed

Schema changes go through EF Core migrations, committed with the change that
needs them. Never edit a migration that has been applied anywhere but your own
machine; add a new one. The `efcore-migrations` skill in this blueprint covers
the commands and the failure modes.

### Pin every package version

`dotnet add package` always carries `--version`. An unpinned dependency makes
the build non-reproducible, and this project's CI is expected to produce the
same result in six months.

The template's default `Microsoft.AspNetCore.OpenApi` version pulls a
`Microsoft.OpenApi` release with a known advisory; the blueprint pins a fixed
one. Keep it pinned at or above that version.

### Tests boot the real application

Integration tests use `WebApplicationFactory<Program>` against the real
composition root, so a wiring mistake fails a test rather than production.
`Program.cs` ends with `public partial class Program;` for that reason — do not
remove it.

Tests must not need a live database. A test that does needs a container
fixture, and it goes in a separate test project so the fast suite stays fast.

## Commands

| Task                     | Command                                                 |
| ------------------------ | ------------------------------------------------------- |
| Build                    | `dotnet build`                                          |
| Test                     | `dotnet test`                                           |
| Run                      | `dotnet run --project src/App.Api`                      |
| Start the local database | `docker compose up -d`                                  |
| Add a migration          | `dotnet ef migrations add <Name> --project src/App.Api` |
| Apply migrations         | `dotnet ef database update --project src/App.Api`       |
| Build the image          | `docker build --tag app-api:dev .`                      |

## When you are asked to add an endpoint

1. Add the endpoint to `Program.cs`, or to an endpoint group file if the area
   already has one.
2. Decide authorization explicitly.
3. Add an integration test that exercises it through `WebApplicationFactory`.
4. If it touches new data, add the entity, the configuration in
   `OnModelCreating`, and a migration.
5. Run `dotnet test` before saying it works.
