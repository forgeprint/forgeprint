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

## Payments (`options.payments: stripe`)

With `payments: none` there is no payment code at all and this section does
not apply.

```
src/payments/config.ts     keys from the server environment; the production check
src/payments/checkout.ts   one call to Stripe, behind the CheckoutClient type
src/payments/webhook.ts    verify the signature, then act once
src/payments/schema.ts     stripe_events and orders
src/payments/startup.ts    exits the process on placeholder keys in production
src/instrumentation.ts     runs that check when the server starts
src/app/api/checkout/      POST: create a hosted Checkout session, 303 to it
src/app/api/stripe/webhook/ POST: Stripe's deliveries
```

**Keys never get a `NEXT_PUBLIC_` prefix.** That prefix is the only thing that
puts an environment variable into the browser bundle. A client component that
needs to know about payments calls a route; it never reads a key.
`npm run check:client-bundle` fails if a key, or the name of one, appears under
`.next/static`, and CI runs it after every build.

**The webhook reads `request.text()`, never `request.json()`.** The signature
covers the exact bytes Stripe sent; a parsed and re-serialised body does not
verify.

**Verify first, then act, then acknowledge.** An event whose signature fails,
or whose timestamp is outside Stripe's five-minute tolerance, is a 400 and
changes nothing. That tolerance is the replay protection; do not widen it.

**Idempotency is a primary key, not a check-then-insert.** The event id goes
into `stripe_events` in the same transaction as the change it causes. A second
delivery finds the id taken and changes nothing. Checking "have I seen this?"
and inserting later is a race between two deliveries arriving together.

**A duplicate is answered 200.** Anything else makes Stripe deliver it again.

**An order comes only from the webhook.** The success URL is where the buyer
lands, and anybody can visit it; it proves nothing about payment. Fulfil on
`checkout.session.completed` with `payment_status: 'paid'`, or on
`checkout.session.async_payment_succeeded`.

**The price comes from `STRIPE_PRICE_ID`, not from the request.** A buyer must
not be able to choose what they pay.

**The production check exits; it does not throw.** Next 16 logs an error thrown
from `register()` and keeps serving. Keep the `process.exit(1)` in
`startup.ts`, a Node-only module, because `instrumentation.ts` is compiled for
the edge runtime too.

**Tests never reach Stripe.** Signed payloads come from
`Stripe.webhooks.generateTestHeaderString`, and checkout takes a
`CheckoutClient` so a test can hand it a fake. Keep new Stripe calls behind a
type like that; a test that needs a real key is a test that will be skipped.

Configuration: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`,
`APP_URL`. The recipe's values contain `EXAMPLE` and are refused in production.
The real ones come from the Stripe dashboard, into the host's secret store —
never into a committed file.

## What this does not do

No authentication, no sessions, no user table. No form handling, no server
actions, no validation library. No seeding, no rollback, no connection retry,
no caching, no error boundary, no loading UI.

Authentication is the largest of those and the one people assume is present:
**it is not**. Every page and every route here is public. Adding it changes the
shape of the data layer as well as the routing, which is why it is left out
rather than half-done.

With `payments: stripe`: one-off payments for one configured price, and
nothing else. No subscriptions, no tax, no refunds, no customer records, no
receipts, no storefront page, and no rate limit on `POST /api/checkout`. An
order is a row with a session id and an amount; what it buys is yours to add.
