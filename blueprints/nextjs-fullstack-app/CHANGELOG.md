# Changelog — nextjs-fullstack-app

## 1.1.0 — 2026-09-25

Feature: payments option, Stripe hosted Checkout, per D11 of
[the expansion plan](../../docs/research/2026-09-24-expansion-plan.md).

A `nextjs-saas-starter` blueprint would have been this blueprint with a
payment provider added, so payments are an option here instead of a second
slug ([ADR 0001](../../docs/decisions/0001-no-variants.md)).

- **`options.payments: [none, stripe]`.** `none` is the default and the first
  value, so the pull request check runs what it ran before.
- **`stripe` adds a Checkout route and a webhook**, pinned at `stripe` 22.6.2,
  the npm `latest` on 2026-09-25. `POST /api/checkout` creates a hosted
  Checkout session for a price taken from configuration and redirects to it;
  `POST /api/stripe/webhook` verifies the signature against the raw body and
  records a paid order.
- **The webhook refuses unsigned, forged, tampered and replayed events**, each
  with its own test. Replay is Stripe's timestamp tolerance, five minutes.
- **Handling is idempotent.** The event id is recorded in the same transaction
  as the order it creates, so the second delivery of an event changes nothing,
  and a unique session id means a second event about the same checkout does
  not create a second order. Both are tested against the real Postgres the
  recipe already starts.
- **No Stripe account, key or network call anywhere.** Signed payloads come
  from the SDK's own `Stripe.webhooks.generateTestHeaderString`, and the
  Checkout client is replaced at the boundary by an object that records the
  request. `stripe/stripe-mock` was considered and left out: it would prove
  that the SDK can talk to a mock of Stripe, which is Stripe's test, not this
  blueprint's.
- **Keys stay on the server.** They are read from the environment under names
  Next never inlines, and a new step fails the recipe if a key, or the name of
  one, appears anywhere under `.next/static` after a build made with the keys
  set. The project's own CI runs the same check.
- **Production refuses placeholder keys.** `instrumentation.ts` stops the
  server at startup when `NODE_ENV` is `production` and a key is missing, is
  not shaped like a Stripe key, or carries a placeholder marker. The recipe
  starts the built server with the placeholders and asserts that it exits.
- **`payments` is added to `requirements`.** `validate` accepts it, and it is
  what lets `resolve` find this blueprint for somebody who asks for payments.

Not added: subscriptions, tax, refunds, customer records, a storefront page.
`overview.md` says so, and says what hosted Checkout does and does not do for
PCI scope.

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
