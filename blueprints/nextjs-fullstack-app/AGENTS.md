# Next.js Full-stack App — agent context

A Next.js application with Postgres through Drizzle. Read this before changing
the schema or adding a page.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/db/schema.ts     the tables, and the source of every migration
src/db/client.ts     one pool per process, plus closeDb() for tests
drizzle/             generated SQL — read, never hand-edited
src/app/             the pages
tests/               run against a real Postgres
```

## Rules that are not style preferences

**The schema file is the source; the SQL is the output.** Change
`src/db/schema.ts`, run `npm run db:generate`, **read the SQL it wrote**, and
commit both. Hand-editing a generated migration makes the schema file a lie,
and the next generation will produce a diff against a state that never existed.

**Read the generated SQL before committing it.** Drizzle infers destructive
changes — a renamed column can come out as a drop and an add, which is data
loss that passed review because nobody opened the file.

**One pool per process, created on first use.** Not at module scope: importing
`client.ts` must not open a connection, because Next imports modules during the
build and a build should not need a database. Not per request either — a new
pool per request halves what the database can serve.

**`closeDb()` exists for tests and nothing else.** A pool keeps the event loop
alive, so a test run that opens one and does not close it hangs after the last
assertion, with no failure and no output. If a suite stops printing, that is
what happened.

**A page that reads the database declares `dynamic = 'force-dynamic'`.**
Without it Next tries to render at build time, and the build needs a database.
Say what the page is rather than letting the build discover it.

**Tests run against a real Postgres.** The thing worth testing is whether the
migration produced the columns the schema describes, and a mock agrees with the
schema by construction. That is why `compose.yaml` and the CI service exist.

**`DATABASE_URL` has no default.** Nothing here falls back to a real database,
and `client.ts` throws when it is missing.

## Adding a page

1. If it reads the database, `export const dynamic = 'force-dynamic'`.
2. Import from `../db/client.ts` — with the `.ts` extension. The tsconfig sets
   `allowImportingTsExtensions` and `rewriteRelativeImportExtensions`, because
   the test runner strips types rather than compiling and needs the real path.
3. Keep queries in the page or in a module beside the schema; there is no
   repository layer here and adding one is a decision, not a convention.

## What this does not do

No authentication, no sessions, no user table. No form handling, no server
actions, no validation library. No seeding, no rollback, no connection retry,
no caching, no error boundary, no loading UI.

Authentication is the largest of those and the one people assume is present:
**it is not**. Every page and every route here is public. Adding it changes the
shape of the data layer as well as the routing, which is why it is left out
rather than half-done.
