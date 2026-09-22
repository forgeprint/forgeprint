# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

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
