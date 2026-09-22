# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.4 — 2026-09-22

- `requires_tools` declares `curl`. The last step of the recipe reads `/health`
  back from the running container with it, so a machine without `curl` fails
  twenty-eight steps in, with a shell error rather than the refusal
  `test-setup` is supposed to give before it starts. No change to the recipe or
  the project it produces.

## 1.0.3 — 2026-09-22

- The `efcore-migrations` skill declares its licence in its frontmatter. The
  file is copied into another repository when somebody installs it, and
  nothing around it there says what it may be used for. `CC-BY-4.0`, which is
  what `blueprints/LICENSE` already said about skills. No change to the setup
  recipe or the project it produces.

## 1.0.2 — 2026-09-22

The recipe now passes on a GitHub runner, which is where it first failed. Both
problems were real, and neither was visible on a developer machine.

- The health check gave up too early. `docker run -d` returns as soon as the
  container exists, and the published port accepts a connection from that
  moment — seconds before the application listens on it, so `curl` was answered
  with a connection reset rather than a refusal. `--retry-connrefused` does not
  retry a reset, so the check failed against a container that was starting
  normally. It now retries any error, for up to thirty seconds.
- A failed check left its container behind, and every later run hit the name.
  The recipe removes a leftover check container before it starts one, so it no
  longer assumes a clean machine — which is also true for the second time a
  reader runs it.

Verified on Ubuntu (GitHub runner) and on Windows with .NET SDK 10.0.103 and
Docker 29.7.2, for each option combination, twice in a row.

## 1.0.1 — 2026-09-22

The recipe is now executed by `forgeprint test-setup` rather than followed by
hand, and two things had to change before a machine could run it.

- Removing the template's placeholder test is its own numbered step with a
  command. It used to be a sentence inside the step that writes the real test,
  which reads fine and cannot be executed.
- The container check no longer binds host port 8080. It asks the operating
  system for a port and reads it back with `docker port`, because a fixed port
  fails on any machine that already uses it — which, for 8080, is most of them.
  The health check also retries while the container starts, instead of racing
  it.

Verified end to end on .NET SDK 10.0.103 and Docker 29.7.2: every step and
every verification, for each option combination.

## 1.0.0 — 2026-09-22

First release.

- ASP.NET Core 10 minimal API, SDK pinned through `global.json` at the feature
  band base (`10.0.100`, `latestFeature`) so any 10.0.1xx SDK satisfies it.
- EF Core with the provider isolated in `Data/DatabaseRegistration.cs`.
  `database` option: `postgres` (Npgsql 10.0.3) or `sqlserver`
  (Microsoft.EntityFrameworkCore.SqlServer 10.0.12).
- Bearer token validation in `Authentication/AuthenticationRegistration.cs`.
  `auth` option: `jwt` (issuer and audience from configuration) or `oidc`
  (authority and audience, signing keys discovered from provider metadata).
- Liveness endpoint at `/health` that does not touch the database, and an
  authorized `/items` endpoint that proves the wiring.
- Integration tests on `WebApplicationFactory<Program>` that need no database.
- Multi-stage Dockerfile with a non-root runtime stage, `.dockerignore`, and a
  local-only `compose.yaml` for the database.
- CI workflow with `actions/checkout` and `actions/setup-dotnet` pinned to
  commit SHAs and read-only workflow permissions.
- `Microsoft.AspNetCore.OpenApi` pinned to 10.0.12: the version the `webapi`
  template installs resolves `Microsoft.OpenApi` 2.0.0, which is under advisory
  GHSA-v5pm-xwqc-g5wc. 10.0.12 resolves 2.12.0.
- `Microsoft.EntityFrameworkCore.Design` pinned per provider (10.0.4 for
  PostgreSQL, 10.0.12 for SQL Server) so the assembly versions unify and the
  build stays warning-free.

Verified on Windows with .NET SDK 10.0.103 and Docker 29.7.2: clean build with
zero warnings, both tests passing, the image building, and the running
container answering `/health` with 200 and `/items` with 401.

### Planned

- `mcp.json` with recommended MCP servers, once each configuration has been
  verified rather than copied.
- A readiness endpoint example that checks the database, alongside the liveness
  one.
