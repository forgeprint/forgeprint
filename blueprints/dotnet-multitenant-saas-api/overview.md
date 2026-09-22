# Multi-tenant SaaS API

A SaaS backend on ASP.NET Core 10 where tenant isolation is enforced in the data
layer and demonstrated by tests, rather than left to each endpoint author to
remember.

## What you get

- Tenant resolution from a validated access token claim, and from nowhere else
- An authorization default that rejects a request with no tenant before it
  reaches an endpoint
- Two isolation strategies behind one option, each enforced where queries are
  built rather than where they are called
- Tests that state the attack — read another tenant's row, write as another
  tenant, rely on a cached model — and prove it fails
- The database provider confined to a single file, so the `database` option is a
  one-file change
- A non-root container image and CI with actions pinned to commit SHAs

## Options

| Option     | Values                                     | What changes                                                                                                 |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `database` | `postgres`, `sqlserver`                    | The provider package, `ProviderRegistration.cs`, the development connection string, the local `compose.yaml` |
| `tenancy`  | `shared-db-tenant-column`, `db-per-tenant` | The context, the registration, what onboarding a tenant means, and what the tests can prove                  |

### Choosing a tenancy strategy

**`shared-db-tenant-column`** — one database, a `TenantId` column, a global query
filter, and writes stamped on save. Onboarding a tenant costs nothing, one
migration covers everyone, and the cost per tenant is close to zero. The
isolation is logical: a mistake in the data layer is a leak, which is why the
filter is tested directly.

**`db-per-tenant`** — one database per tenant, chosen per request from the
resolved tenant. Isolation is physical, so a query cannot reach the wrong data
even if somebody writes it badly. Noisy-neighbour problems and per-tenant
restores get easier. The cost is operational: onboarding creates a database,
every migration runs N times, and connection pools multiply.

Pick shared-db when you expect many small tenants and a small team. Pick
db-per-tenant when a customer contract, a regulator, or a per-tenant restore
requirement makes logical isolation an argument you do not want to have.

## What it fits

- A product where every row belongs to exactly one customer organisation, and
  customers must never see each other.
- Teams who already know that "add a `WHERE TenantId = @tenant` everywhere" is
  the design that eventually leaks, and want the boundary lower down.
- A project that will have auditors, security reviews, or enterprise customers
  asking how isolation works — the answer here is short and testable.

## What it is NOT for

- **A single-tenant API.** If there is one customer, the tenancy machinery is
  cost with no benefit. Use `dotnet-web-api`.
- **Per-user data separation.** Tenancy is organisation-level. Row-level rules
  inside a tenant are authorization, a different problem, and this does not
  solve it.
- **Retrofitting tenancy onto a live single-tenant database.** The code here is
  the easy part; backfilling a tenant column, rewriting existing queries, and
  migrating live data is a project on its own.
- **Tenant-aware billing, plans, quotas or onboarding flows.** None of that is
  here. It resolves a tenant and isolates data.
- **Provisioning under `db-per-tenant`.** Creating a database and running
  migrations against it is left to you, deliberately: how it is automated
  depends on where you host.
- **Deciding which tenant a user belongs to.** That is the identity provider's
  job. This API reads a claim; it does not map users to tenants.
- **Sharding, per-tenant regions, or data residency.** One connection, one
  database engine. Residency requirements need an architecture decision this
  blueprint does not make.
- **Anyone new to EF Core.** The filter and model-cache behaviour it depends on
  are subtle enough to warrant the `advanced` audience marking.

## Trade-offs made on your behalf

**The tenant comes from a token claim only.** Subdomain routing is common and
friendlier, and it also means the tenant arrives in a caller-controlled string.
If you want a subdomain, resolve it to a tenant and check it _against_ the
claim; never in place of it.

**The default authorization policy requires a tenant claim.** Slightly annoying
for a genuinely public endpoint, which must opt out explicitly. That annoyance
is the feature: forgetting to opt in is dangerous, forgetting to opt out is
merely noisy.

**Writes are restamped rather than rejected.** An entity added with someone
else's tenant identifier is corrected on save instead of throwing. It is the
safe direction — the row lands in the right tenant either way — but it means a
confused caller gets no error. Changing it to throw is a one-line edit if you
prefer loud.

**Isolation tests run on the in-memory provider.** They test our filter and
stamping logic, which is provider-independent, and they need no database, so
they run everywhere including CI. What they do not test is SQL: if you add raw
SQL or provider-specific behaviour, that needs a test against a real database.
The SQLite alternative was rejected because its native dependency currently
carries an unpatched advisory.

**`ProviderRegistration` also builds connection strings.** Slightly more than
"register the provider", but connection-string manipulation is provider-specific
and it belongs in the one file that is allowed to know the provider.

## Cost of adoption

About thirty steps, a few minutes on a machine with the SDK and Docker. The
recipe ends by building the image and reading `/health` from the running
container. The tests it leaves behind are the part worth keeping: they are what
turns "we isolate tenants" from a claim into a check that runs on every commit.

## Maintenance

Tenancy is not a thing you finish. Every new entity is a chance to forget the
filter, and the test suite is the mechanism that catches it — keep adding
isolation tests as the model grows. Under `db-per-tenant`, keep the record of
which tenant database is at which migration, because that is the failure that
shows up as one customer seeing errors nobody else does.
