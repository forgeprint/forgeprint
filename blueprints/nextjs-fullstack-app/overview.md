# Next.js Full-stack App

A full-stack Next.js application with Tailwind and Postgres through Drizzle,
where migrations are generated from the schema, applied, and then proved by a
test that round-trips a row. Optionally, it takes one-off payments through
Stripe hosted Checkout.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real application on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- An application whose pages read and write a relational database — the most
  common shape of web application there is.
- A team that wants migrations to be a reviewed artefact rather than something
  an ORM does invisibly at startup.
- A project that will have more than one environment, because the database URL
  has no default and nothing here silently points at a real database.
- Learning where the seams are in the App Router: what forces a page to be
  dynamic, why a pool cannot live at module scope, and why a build should not
  need a database.

- With `payments: stripe`, selling one thing at one price, where the order
  only has to exist once the money has arrived.

## Options

- **`payments: none`** (default) — no payment code, no Stripe dependency.
- **`payments: stripe`** — `stripe` 22.6.2. `POST /api/checkout` creates a
  hosted Checkout session for the price in `STRIPE_PRICE_ID` and redirects to
  it. `POST /api/stripe/webhook` verifies each event's signature against the
  raw body, refuses unsigned, forged, tampered and replayed events, and
  records a paid order exactly once, however many times Stripe delivers the
  event. Keys are read from the server environment only, a build check fails
  if one reaches the browser bundle, and the server refuses to start in
  production on the recipe's placeholder keys. Every test runs with no Stripe
  account, no key and no network call.

### What hosted Checkout does for PCI scope, and what it does not

Card details are typed into a page Stripe serves and never pass through this
application, which keeps it out of the part of PCI DSS that covers storing,
processing or transmitting card data. It does not take the application out of
scope: a merchant still has compliance obligations, typically a
self-assessment questionnaire, and the page that sends a buyer to Checkout is
part of what is assessed. What applies to you depends on your volume and your
acquirer; read Stripe's own guidance, and treat this paragraph as a pointer,
not an assessment.

## What it is NOT for

- **Anything with users.** There is no authentication, no session, no user
  table. Every page and every route is public. This is the omission people
  assume is not there, so it is the first thing in this list.
- **Forms and mutations.** No server actions, no validation library, no
  optimistic updates. The example reads; it does not write from the browser.
- **A design system.** Tailwind is set up and used for layout. There are no
  components, no tokens, no dark mode.
- **Seeding, rollback or zero-downtime migrations.** `drizzle-kit` generates
  and applies forward. Rolling back is a migration you write.
- **Caching, streaming or partial prerendering.** The one page that reads the
  database is marked dynamic and that is the whole caching story.
- **Deployment.** No Dockerfile for the application, no adapter, no host
  assumed. The compose file is for the database during development.
- **Subscriptions, tax, refunds or invoices**, even with `payments: stripe`.
  It is one-off payments for one configured price. No customer records, no
  receipts, no storefront page, and the order row is not linked to a user,
  because there are no users.

## Pros

- **Migrations are a file somebody reads.** The schema generates SQL, the SQL
  is committed, and `AGENTS.md` says plainly that a renamed column can come out
  as a drop and an add — which is data loss that passes review when nobody
  opens the file.
- **The test runs against a real Postgres.** It asserts that the migration
  produced the columns the schema describes, and that the default came from the
  database rather than from the application. A mock would agree with the schema
  by construction and prove nothing.
- **The pool is created once, on first use.** Not at module scope, because
  importing the client during a build would open a connection; not per request,
  because that is the classic way to exhaust a database.
- **`closeDb()` exists and is explained.** A pool keeps the event loop alive,
  so a suite that opens one and does not close it hangs with no failure and no
  output. Ten confusing minutes, converted into one function and a comment.
- **`DATABASE_URL` has no default** and `client.ts` throws without it.
- **The database is bound to loopback** in `compose.yaml`, with the reason in a
  comment: a database on `0.0.0.0` is reachable from whatever network the
  laptop is on.
- **CI runs the migration, the tests and the build** against a Postgres
  service — the same three things the recipe does.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **No authentication is the big one.** A "full-stack app" that has no users
  will surprise somebody, which is why it is stated three times in this
  document and once in `AGENTS.md`.
- **`.ts` import extensions are unusual to read.** They are there because the
  test runner strips types rather than compiling, and it needs the real path.
  The tsconfig turns on `allowImportingTsExtensions` and
  `rewriteRelativeImportExtensions` to make it legal; if you later compile
  these tests instead, the extensions can go.
- **Drizzle rather than Prisma is a choice, not a verdict.** Drizzle is ahead
  on installs (16.3M a week against 12.2M) and stays closer to SQL, which suits
  a blueprint that wants migrations to be readable. Prisma 7 is a fair swap and
  would change the schema file, the client and the generate step.
- **One table, one page.** You are meant to delete `notes`. There is no
  repository layer, no pagination, no error handling on the query.
- **`POST /api/checkout` has no rate limit** (OWASP API4:2023). Anybody can
  create Checkout sessions; each costs a call to Stripe and nothing else, but
  put it behind a limit before it faces the internet.
- **The production key check runs just after the server starts listening.**
  Next calls `register()` after the port is bound, so a refused server is up
  for a moment before it exits. An orchestrator sees a crash loop, which is
  the intent; a request in that moment gets whatever the route does without
  its keys, which is a 500.
- **The `payments` requirement is true for one option value.** `resolve`
  matches it for anybody who asks for payments; the default does not take
  any.
- **Next.js is gaining usage while losing satisfaction** (State of JS 2025).
  Usage is the reason to pick it; satisfaction is the reason a reader may
  resent it, and both are true at once.

## Compared with the alternatives here

- **`astro-content-site`** — the other `web` blueprint, and the opposite shape:
  static, no database, no server. If the content does not change per request,
  that one is smaller in every dimension and will stay that way.
- **`ts-http-service`** — TypeScript and a server, but an API rather than
  pages. If the front end is somebody else's problem, start there.
- **`fastapi-service`**, **`go-http-service`**, **`dotnet-web-api`** — the same
  reasoning in other languages, for the API half only.
