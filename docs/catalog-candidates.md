# Catalog candidates

What the catalog should hold next, and why. Produced with
[`catalog-research`](../skills/catalog-research/SKILL.md) on **2026-09-22**.

**These are candidates, not commitments.** Nothing here is written until
somebody picks it up, and a candidate that nobody picks up was correctly
identified as not urgent.

---

## The demand, with its sources

**1. Nobody has asked us yet.** Zero open `blueprint-request` issues. The label
and the site's request list were only wired up today, so this says nothing
about demand — it says the queue is new. It also means everything below is an
outside signal, which is the weaker kind.

**2. The catalog cannot answer most questions it is asked.** From its own
index, today:

| Criterion      | Covered                           | Missing                                                   |
| -------------- | --------------------------------- | --------------------------------------------------------- |
| `project_type` | `api`, `agent`                    | `cli`, `data`, `game`, `infra`, `lib`, `mobile`, `web`    |
| `languages`    | `csharp`                          | 18 others, including `typescript`, `python`, `go`, `java` |
| `distribution` | `internal`, `saas`, `open-source` | `free`, `paid`, `ads`, `iap`                              |

These are the two heaviest criteria in the resolver. A user who writes Python,
or is building a CLI, gets `no_match` — correctly, and that is the problem.

**3. The ecosystem, measured rather than quoted.** The official MCP registry's
first hundred servers, fetched 2026-09-22: **79 remote-only, 20 npm, 1 PyPI**.
Of the servers that ship as a package, npm is twenty to one. We publish the
only .NET MCP blueprint in a registry whose packaged servers are almost
entirely TypeScript.

**4. Framework and database usage**, Stack Overflow Developer Survey 2025
([survey.stackoverflow.co/2025/technology](https://survey.stackoverflow.co/2025/technology)):
Node.js 49.1% and React 46.9% lead; Express remains the most-used Node
framework; Next.js 21.5%; FastAPI 15.1%, the largest single rise in the
survey; **PostgreSQL 58.2%**, first by a distance. Our two API blueprints
already offer Postgres, which is the one thing this list says we got right.

**5. What people buy.** The SaaS starter-kit market — ShipFast, Supastarter,
SaaSykit and the rest — sells the same feature list every time: multi-tenancy,
authentication, role-based access, billing, and per-tenant data isolation.
People pay for that assembly, which is a stronger demand signal than a survey.
We have exactly one of those features, in one language.

---

## The candidates

Five, in the order I would take them. Each states the risk, because a candidate
without one has not been thought about.

### 1. `ts-mcp-server` — MCP server in TypeScript

**Triple:** `[node, typescript-sdk]` + `agent` + `[ci, testing]`
**Demand:** signal 3. Twenty of the twenty-one packaged servers in the official
registry are npm. This is the single most common thing being built in the
ecosystem Forgeprint itself lives in.
**Testable:** the same probe `dotnet-mcp-server` uses — speak MCP over stdio,
initialise, call a tool, assert the response. Node is on every runner, so the
recipe costs seconds in CI rather than minutes.
**Provenance:** derivable from the official TypeScript SDK's own examples (MIT).
**Risk:** its `setup.md` will look like `dotnet-mcp-server`'s, because the
shape of an MCP server is the same in any language. Expect a similarity RED
FLAG on the recipe and answer it in the pull request; the triple differs on
stack, which is what rule 9 actually asks.

### 2. `fastapi-service` — Python API with Postgres

**Triple:** `[fastapi, postgres]` + `api` + `[auth, ci, containerization]`
**Demand:** signals 2 and 4. Python is the largest missing language, and
FastAPI is the fastest-rising framework in the survey. Same triple shape as
`dotnet-web-api`, different stack — which is precisely how the catalog is
supposed to grow: the resolver weights a language the user already knows above
everything else, so a Python developer needs a Python answer, not a good C# one.
**Testable:** `pytest` against the app with `httpx`, a token check that a
protected route refuses an unauthenticated request, and the container
answering `/health` — the pattern the .NET recipes already prove works.
**Provenance:** the FastAPI full-stack template (MIT) is the obvious source.
**Risk:** dependency pinning in Python is a choice, not a default. The recipe
has to commit to one — `uv` with a lockfile is the current answer — and
`lint-setup` will insist on `==` versions throughout.

### 3. `express-rest-api` — Node REST API with Postgres

**Triple:** `[node, express, postgres]` + `api` + `[auth, ci, containerization]`
**Demand:** signal 4. Express is still the most-used Node framework and Node
the most-used web technology; this is the most common backend in the world and
the catalog has nothing for it.
**Testable:** `node --test` with `supertest`, plus the container health check.
**Provenance:** no single canonical source; write it from the Express and
`node-postgres` documentation and record that.
**Risk:** "Express with auth" is the most-written starter on the internet, so
the bar for being worth a blueprint is higher than usual. It earns its place
only if the recipe is genuinely opinionated — one auth mechanism, one migration
tool, one test layout — rather than a menu.

### 4. `nextjs-saas-web` — multi-tenant SaaS web application

**Triple:** `[nextjs, postgres]` + `web` + `[multi-tenant, auth, rbac, ci]`
**Demand:** signals 4 and 5. Next.js is the fastest-growing framework, `web`
is our largest empty `project_type`, and multi-tenant SaaS is the feature list
the entire paid boilerplate market is built on.
**Testable:** a Playwright smoke test that signs in as two tenants and proves
one cannot see the other's rows — the same claim `dotnet-multitenant-saas-api`
proves in its test suite, which is the part that makes it worth having.
**Provenance:** to be decided; most sources in this space are commercial and
cannot be derived from. That may mean writing it from scratch.
**Risk:** the heaviest candidate by far. Billing is what people actually want
from a SaaS starter and it cannot be CI-tested against a payment provider, so
the blueprint has to say plainly in "What it is NOT for" that it stops before
billing. A blueprint that promises a SaaS kit and omits payments will
disappoint unless it is explicit.

### 5. `go-cli` — command-line tool in Go

**Triple:** `[go-stdlib]` + `cli` + `[ci, testing]`
**Demand:** signal 2 — `cli` is an empty `project_type` and Go is a missing
language. No external signal says this is urgent; it is here because it is the
cheapest possible proof that the catalog is not a .NET catalog.
**Testable:** `go test ./...` and running the built binary with `--help` and a
real argument. No container, no database, seconds in CI.
**Provenance:** written from the Go standard library documentation.
**Risk:** the smallest value of the five. A Go CLI is not hard to start, so the
blueprint has to earn its place on the parts people get wrong — flag parsing
without a framework, exit codes, testing a binary rather than a package, and
cross-compilation in CI.

---

## What this does not include

- **A second .NET blueprint.** The three we have cover the maintainer's stack;
  a fourth would deepen the catalog where it is already deepest.
- **Anything needing a taxonomy change.** Every triple above uses values that
  already exist. `go-stdlib` and `typescript-sdk` do not — see the note below.
- **Mobile, game, data.** All empty `project_type`s, all requiring a toolchain
  or a device CI cannot provide today. They wait for a contributor who has one.

> **Two of the triples above are approximate.** `stack` has no value for the Go
> standard library or for the MCP TypeScript SDK, so those candidates need a
> taxonomy pull request first, on its own, before the blueprint. That is the
> rule and this document is not an exception to it.
