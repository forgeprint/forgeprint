# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.1 — 2026-09-22

The recipe is now executed by `forgeprint test-setup` rather than followed by
hand, and that immediately found a step that could not have worked for anyone.

- The container check never started. `AddTenantDatabase` refuses to run without
  `ConnectionStrings:Default` — correct behaviour, and the recipe did not
  supply it, so the container exited before the health check and a reader would
  have hit that at the last step. The run now passes the setting as an
  environment variable, which also demonstrates the `__` form the application
  expects.
- The container check no longer binds host port 8080; it asks the operating
  system for a port and reads it back, and retries while the container starts.
- Removing the template's placeholder test is its own numbered step with a
  command.

Verified end to end on .NET SDK 10.0.103 and Docker 29.7.2, for each option
combination: every step, every verification, and the tenant isolation suite.

## 1.0.0 — 2026-09-22

First release.

- ASP.NET Core 10 with the SDK pinned through `global.json` at the feature band
  base (`10.0.100`, `latestFeature`).
- Tenant resolved from a `tenant_id` claim on the validated access token, after
  authentication and before authorization. No header, route or query value can
  select a tenant.
- Default authorization policy requires an authenticated user with that claim,
  so an endpoint is tenant-scoped unless it explicitly opts out. `/health` is
  the only endpoint that does.
- `tenancy` option:
  - `shared-db-tenant-column` — a `TenantId` column, a global query filter
    bound to a per-instance field, and writes stamped in `SaveChanges`.
  - `db-per-tenant` — the database name derived per request from the resolved
    tenant, with the identifier validated before it reaches a connection
    string.
- `database` option: `postgres` (Npgsql 10.0.3) or `sqlserver`
  (Microsoft.EntityFrameworkCore.SqlServer 10.0.12). The provider and
  connection-string manipulation are confined to `ProviderRegistration.cs`, so
  switching is a one-file change.
- Isolation tests covering: a tenant cannot read another tenant's rows, a tenant
  reads its own, the query filter is not baked into EF's cached model, a write
  is stamped with the current tenant, and a row submitted with another tenant's
  identifier is restamped. Under `db-per-tenant`, tests that a tenant
  identifier which could alter a connection string is refused.
- Multi-stage Dockerfile with a non-root runtime stage, `.dockerignore`, and a
  local-only `compose.yaml`.
- CI workflow with `actions/checkout` and `actions/setup-dotnet` pinned to
  commit SHAs and read-only workflow permissions.
- `Microsoft.AspNetCore.OpenApi` pinned to 10.0.12, because the version the
  `webapi` template installs resolves `Microsoft.OpenApi` 2.0.0, which is under
  advisory GHSA-v5pm-xwqc-g5wc.

Verified on Windows with .NET SDK 10.0.103 and Docker 29.7.2. Both tenancy
branches build with zero warnings and pass their tests: five isolation tests for
`shared-db-tenant-column`, five identifier-validation tests for `db-per-tenant`.

The isolation tests run on `Microsoft.EntityFrameworkCore.InMemory` rather than
SQLite. SQLite was tried first; `SQLitePCLRaw.lib.e_sqlite3` is under advisory
GHSA-2m69-gcr7-jv3q with no patched version published, and shipping a blueprint
whose first build prints a security warning is not acceptable. The in-memory
provider tests the filter and stamping logic, which is what these tests are
about.

### Planned

- A cross-tenant reporting example showing the reviewed, clearly named way to
  use `IgnoreQueryFilters`.
- A tenant provisioning script for `db-per-tenant`, once there is one worth
  recommending rather than a sketch.
