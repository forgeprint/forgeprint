# Changelog — nextjs-fullstack-app

## 1.0.0 — 2026-09-23

First version, and the catalog's first blueprint with a database.

Next.js 16 with Tailwind 4 and Postgres through Drizzle, where the schema
generates the migration, the migration is applied, and a test round-trips a row
to prove the columns exist.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where this
was the strongest single combination in the demand research: `next` 42.7M a
week, `tailwindcss` 95.6M, `drizzle-orm` 16.3M. Its recipe runs in CI like
every other and nobody has built an application on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

It also fills `migrations` — a requirement that had been in the taxonomy since
the first week with no blueprint behind it.

Three things came out of building it rather than describing it.

**A pool at module scope breaks the build.** Next imports modules while
building, so a connection opened at import time means the build needs a
database. The pool is created on first use instead.

**A test that opens a pool and does not close it hangs.** No failure, no
output, just a run that never ends. `closeDb()` exists for that and the comment
beside it says why.

**The scope is narrower than the name.** There is no authentication, and this
document says so four times, because "full-stack app" is a phrase people read
as including users.
