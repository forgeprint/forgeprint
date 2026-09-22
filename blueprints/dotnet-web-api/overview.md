# ASP.NET Core REST API

An HTTP API on ASP.NET Core 10 with EF Core, bearer-token authentication, a
container image and a CI pipeline. It is the catalog's .NET reference point:
the other .NET blueprints specialise it rather than repeat it.

## What you get

- ASP.NET Core 10 (LTS, supported to November 2028) minimal API, SDK pinned by
  `global.json`
- EF Core with one provider, isolated in a single registration file
- Bearer token validation configured from the environment, never from source
- A liveness endpoint that deliberately does not touch the database
- An integration test project that boots the real application
- A multi-stage Dockerfile producing a non-root runtime image
- A CI workflow that restores, builds, tests and builds the image, with actions
  pinned to commit SHAs

## Options

| Option     | Values                  | What changes                                                                                                     |
| ---------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `database` | `postgres`, `sqlserver` | The provider package, `DatabaseRegistration.cs`, the development connection string, and the local `compose.yaml` |
| `auth`     | `jwt`, `oidc`           | `AuthenticationRegistration.cs` and the configuration keys it reads                                              |

Both `auth` values validate bearer tokens with the same package. `jwt` reads
issuer and audience from configuration; `oidc` points at a provider and
discovers its signing keys from the provider's metadata. Neither writes a
secret into the repository.

## What it fits

- A service that speaks HTTP/JSON to clients you control or publish to.
- A team that wants the boring parts decided: where wiring lives, how the
  database is swapped, what the health endpoint promises, how the image is
  built.
- Projects that will run in a container, on Linux, behind something that
  terminates TLS.
- Somebody comfortable in C# who wants a working baseline in minutes rather
  than an afternoon of scaffolding.

## What it is NOT for

- **Multi-tenant SaaS.** There is no tenant resolution, no tenant isolation and
  no per-tenant data boundary. Use `dotnet-multitenant-saas-api` instead;
  retrofitting tenancy onto a single-tenant schema is the expensive way to get
  there.
- **Server-rendered web applications.** No Razor, no Blazor, no views, no
  antiforgery, no cookie session. This serves JSON.
- **An MCP server.** If the thing you are building talks to coding agents over
  MCP rather than to clients over HTTP, `dotnet-mcp-server` is the blueprint.
- **A CRUD generator.** It ships one example entity and one endpoint to prove
  the wiring. It does not scaffold repositories, DTO mappers, or controllers
  per table, and it is not a Clean Architecture template.
- **gRPC, GraphQL or messaging.** Nothing here prevents adding them, but
  nothing here sets them up either.
- **Windows or IIS hosting.** The image is Linux and the recipe assumes it.
- **Learning C#.** The blueprint assumes you can read the code it writes. A
  beginner will get a working service and an unclear mental model.
- **Serverless.** No Azure Functions or Lambda host; the deliverable is a
  long-running container.
- **Rate limiting.** Nothing restricts how often a caller may ask
  (OWASP API4:2023). `AddRateLimiter` is where to start, and the policy depends
  on what the API is for, which is why the blueprint does not guess.

## Trade-offs made on your behalf

**Minimal APIs, not controllers.** Fewer files and less ceremony for a service
of this size. If you expect dozens of endpoint groups with filters and model
binding conventions, controllers age better — add them, the rest still holds.

**The provider is isolated but not abstracted.** One file names the database.
There is no repository layer hiding EF Core, because that abstraction usually
costs more than the portability it buys.

**`/health` is liveness only.** It answers "is this process alive", not "can it
serve traffic". A readiness probe that checks the database is a deliberate
addition, on a separate path, so an orchestrator cannot confuse the two.

**No migration is created during setup.** The example model exists to prove the
wiring compiles. Creating the first migration against a throwaway entity trains
the wrong habit; create it when the model means something.

**TLS is not terminated in the app.** The image serves plain HTTP on 8080 and
expects an ingress, a load balancer or a sidecar in front. Inside a container
this is the common arrangement; if you need the app to hold the certificate,
that is a change to make consciously.

**Tests do not require a database.** The fast suite boots the application and
asserts wiring and authorization. Tests that need real SQL belong in a second
project with a container fixture, so the fast suite stays fast.

### Base images move within a minor

The Dockerfile pins `mcr.microsoft.com/dotnet/sdk:10.0` and `aspnet:10.0`, not
a digest. That is deliberate, and it is a trade-off: a digest is byte-exact and
also stops security patches arriving, which for a base image is usually the
wrong side to be on. Pin to a digest when a build has to be reproducible to the
byte, and take over patching when you do.

## Cost of adoption

Setup is roughly two dozen commands and file writes, most of it `dotnet` CLI.
On a machine with the SDK and Docker already installed, the whole recipe runs
in a few minutes, and it ends by starting the container and reading `/health`
back, so a broken result is visible immediately rather than at deployment.

## Maintenance

`global.json` pins the SDK feature band and the CI workflow reads that same
file, so the two cannot drift. Package versions are pinned explicitly; bumping
them is a deliberate change with a CHANGELOG entry, not a surprise from a
restore.
