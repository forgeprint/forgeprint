# Setup

Creates a full-stack Next.js application with Tailwind, a Postgres database
through Drizzle, and migrations that are generated, applied and then proved by
a test that round-trips a row.

With `options.payments: stripe` it also takes payments through Stripe hosted
Checkout, with a webhook that verifies every event and acts on each one once.
No step needs a Stripe account, a key or a network call to Stripe.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22 or newer and Docker.

<!-- if options.payments == none -->

1. Create `package.json` with:

   ```json
   {
     "name": "app",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "db:generate": "drizzle-kit generate",
       "db:migrate": "drizzle-kit migrate",
       "test": "node --test --experimental-strip-types tests/*.test.ts"
     },
     "dependencies": {
       "next": "16.3.6",
       "react": "19.3.0",
       "react-dom": "19.3.0",
       "drizzle-orm": "0.45.3",
       "postgres": "3.4.9"
     },
     "devDependencies": {
       "typescript": "7.0.2",
       "@types/node": "26.6.2",
       "@types/react": "19.3.0",
       "drizzle-kit": "0.31.11",
       "tailwindcss": "4.3.3",
       "@tailwindcss/postcss": "4.3.3"
     }
   }
   ```

   Verify: `test -f package.json`

<!-- endif -->

<!-- if options.payments == stripe -->

1. Create `package.json` with:

   ```json
   {
     "name": "app",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "db:generate": "drizzle-kit generate",
       "db:migrate": "drizzle-kit migrate",
       "test": "node --test --experimental-strip-types tests/*.test.ts",
       "check:client-bundle": "node scripts/check-client-bundle.mjs"
     },
     "dependencies": {
       "next": "16.3.6",
       "react": "19.3.0",
       "react-dom": "19.3.0",
       "drizzle-orm": "0.45.3",
       "postgres": "3.4.9",
       "stripe": "22.6.2"
     },
     "devDependencies": {
       "typescript": "7.0.2",
       "@types/node": "26.6.2",
       "@types/react": "19.3.0",
       "drizzle-kit": "0.31.11",
       "tailwindcss": "4.3.3",
       "@tailwindcss/postcss": "4.3.3"
     }
   }
   ```

   Verify: `test -f package.json`

<!-- endif -->

2. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "es2023",
       "lib": ["dom", "dom.iterable", "es2023"],
       "module": "esnext",
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "rewriteRelativeImportExtensions": true,
       "noEmit": true,
       "strict": true,
       "exactOptionalPropertyTypes": true,
       "noUncheckedIndexedAccess": true,
       "jsx": "preserve",
       "skipLibCheck": true,
       "incremental": true,
       "types": ["node"],
       "plugins": [{ "name": "next" }]
     },
     "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
     "exclude": ["node_modules"]
   }
   ```

   Verify: `test -f tsconfig.json`

3. Install the pinned dependencies: `npm install --no-audit --no-fund`
   Verify: `node -e "await import('next/package.json', { with: { type: 'json' } })"`

4. Create `src/db/schema.ts` with:

   ```typescript
   import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

   /**
    * The schema is the source of the migration, not a description of it.
    * `drizzle-kit generate` reads this file and writes SQL; nobody hand-edits
    * the SQL, and nobody changes the database without changing this.
    */
   export const notes = pgTable('notes', {
     id: serial('id').primaryKey(),
     body: text('body').notNull(),
     // withTimezone, because a timestamp without one is a timestamp in an
     // unknown timezone, and which one it was is discovered in production.
     createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   });

   export type Note = typeof notes.$inferSelect;
   ```

   Verify: `test -f src/db/schema.ts`

5. Create `src/db/client.ts` with:

   ```typescript
   import { drizzle } from 'drizzle-orm/postgres-js';
   import postgres from 'postgres';

   import * as schema from './schema.ts';

   /**
    * One pool per process, created on first use.
    *
    * Not at module scope: importing this file must not open a connection,
    * because Next imports modules during the build and a build should not
    * need a database. Not per call either — a new pool per request halves
    * what the database can serve and is the classic way to exhaust it.
    */
   let client: ReturnType<typeof postgres> | undefined;

   export function db() {
     if (client === undefined) {
       const url = process.env.DATABASE_URL;
       if (url === undefined || url === '') {
         throw new Error('DATABASE_URL is required');
       }
       client = postgres(url, { max: 5 });
     }
     return drizzle(client, { schema });
   }

   /**
    * Tests need this and the application does not.
    *
    * A pool keeps the event loop alive, so a test run that opens one and does
    * not close it hangs after the last assertion instead of exiting — with no
    * failure and no output. That is a genuinely confusing ten minutes, and it
    * is the reason this function exists.
    */
   export async function closeDb(): Promise<void> {
     if (client !== undefined) {
       await client.end();
       client = undefined;
     }
   }
   ```

   Verify: `test -f src/db/client.ts`

<!-- if options.payments == none -->

6. Create `drizzle.config.ts` with:

   ```typescript
   import type { Config } from 'drizzle-kit';

   export default {
     schema: './src/db/schema.ts',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: { url: process.env.DATABASE_URL ?? '' },
   } satisfies Config;
   ```

   Verify: `test -f drizzle.config.ts`

<!-- endif -->

<!-- if options.payments == stripe -->

6. Create `drizzle.config.ts` with:

   ```typescript
   import type { Config } from 'drizzle-kit';

   export default {
     // The payment tables live beside the code that owns them, and are listed
     // here so one migration history covers both.
     schema: ['./src/db/schema.ts', './src/payments/schema.ts'],
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: { url: process.env.DATABASE_URL ?? '' },
   } satisfies Config;
   ```

   Verify: `test -f drizzle.config.ts`

<!-- endif -->

7. Create `postcss.config.mjs` with:

   ```javascript
   export default { plugins: { '@tailwindcss/postcss': {} } };
   ```

   Verify: `test -f postcss.config.mjs`

8. Create `src/app/globals.css` with:

   ```css
   @import 'tailwindcss';
   ```

   Verify: `test -f src/app/globals.css`

9. Create `src/app/layout.tsx` with:

   ```tsx
   import type { ReactNode } from 'react';

   import './globals.css';

   export const metadata = { title: 'Notes', description: 'A small full-stack example.' };

   export default function RootLayout({ children }: { children: ReactNode }) {
     return (
       <html lang="en">
         <body className="mx-auto max-w-2xl p-8">{children}</body>
       </html>
     );
   }
   ```

   Verify: `test -f src/app/layout.tsx`

10. Create `src/app/page.tsx` with:

    ```tsx
    import { db } from '../db/client.ts';
    import { notes } from '../db/schema.ts';

    // Without this, Next tries to render this page at build time — and the
    // build then needs a database, which a build should not. Say what the
    // page is rather than letting the build discover it.
    export const dynamic = 'force-dynamic';

    export default async function Page() {
      const rows = await db().select().from(notes);

      return (
        <main>
          <h1 className="text-2xl font-semibold">Notes</h1>
          <ul className="mt-4 space-y-2">
            {rows.map((note) => (
              <li key={note.id} className="rounded border p-3">
                {note.body}
              </li>
            ))}
          </ul>
        </main>
      );
    }
    ```

    Verify: `test -f src/app/page.tsx`

11. Create `tests/notes.test.ts` with:

    ```typescript
    import assert from 'node:assert/strict';
    import { after, before, describe, it } from 'node:test';

    import { closeDb, db } from '../src/db/client.ts';
    import { notes } from '../src/db/schema.ts';

    /**
     * This runs against a real Postgres, on purpose.
     *
     * The thing worth testing here is not the query builder — it is whether
     * the migration produced the columns the schema describes. A mock would
     * agree with the schema by construction and prove nothing.
     */
    describe('notes', () => {
      before(async () => {
        await db().delete(notes);
      });

      after(async () => {
        await db().delete(notes);
        await closeDb();
      });

      it('round-trips a row through the schema the migration created', async () => {
        await db().insert(notes).values({ body: 'first' });

        const rows = await db().select().from(notes);

        assert.equal(rows.length, 1);
        assert.equal(rows[0]?.body, 'first');
        // The default came from the database, not from the application.
        assert.ok(rows[0]?.createdAt instanceof Date);
      });
    });
    ```

    Verify: `test -f tests/notes.test.ts`

<!-- if options.payments == stripe -->

12. Create `src/payments/config.ts` with:

    ```typescript
    /**
     * Stripe configuration, read from the server's environment and nowhere else.
     *
     * None of these names starts with NEXT_PUBLIC_, which is the only prefix Next
     * inlines into the browser bundle. Renaming one to "make it work" in a client
     * component is how a secret key ends up in every visitor's browser; the
     * bundle check in the recipe fails if it happens.
     */
    export interface PaymentSettings {
      readonly secretKey: string;
      readonly webhookSecret: string;
      readonly priceId: string;
      readonly appUrl: string;
    }

    type Env = Readonly<Record<string, string | undefined>>;

    function required(env: Env, name: string): string {
      const value = env[name];
      if (value === undefined || value === '') {
        throw new Error(`${name} is required`);
      }
      return value;
    }

    export function paymentSettings(env: Env = process.env): PaymentSettings {
      return {
        secretKey: required(env, 'STRIPE_SECRET_KEY'),
        webhookSecret: required(env, 'STRIPE_WEBHOOK_SECRET'),
        priceId: required(env, 'STRIPE_PRICE_ID'),
        appUrl: required(env, 'APP_URL'),
      };
    }

    /**
     * A placeholder is a value somebody meant to replace. The recipe's own
     * examples all carry one of these markers, so they can never be mistaken for
     * a key that works.
     */
    const PLACEHOLDER = /example|not[-_]a[-_]real|placeholder|changeme|x{8,}/i;

    /**
     * Refuse to run in production on keys that cannot be real.
     *
     * Run from `instrumentation.ts`, so the server stops at startup rather than
     * taking orders it can never be paid for. Outside production it does nothing:
     * tests and local development run on the placeholders on purpose.
     */
    export function assertUsableInProduction(env: Env = process.env): void {
      if (env.NODE_ENV !== 'production') return;

      const settings = paymentSettings(env);
      if (!/^(?:sk|rk)_(?:live|test)_/.test(settings.secretKey)) {
        throw new Error('STRIPE_SECRET_KEY is not a Stripe secret or restricted key');
      }
      if (!settings.webhookSecret.startsWith('whsec_')) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not a Stripe webhook signing secret');
      }
      for (const [name, value] of [
        ['STRIPE_SECRET_KEY', settings.secretKey],
        ['STRIPE_WEBHOOK_SECRET', settings.webhookSecret],
      ] as const) {
        if (PLACEHOLDER.test(value)) {
          throw new Error(`${name} is a placeholder; refusing to start in production`);
        }
      }
    }
    ```

    Verify: `test -f src/payments/config.ts`

13. Create `src/payments/schema.ts` with:

    ```typescript
    import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

    /**
     * Every Stripe event this application has acted on, by Stripe's own id.
     *
     * Stripe delivers at least once, so the same event can arrive twice. The
     * primary key is what makes the second delivery a no-op: it is recorded in the
     * same transaction as the change it causes, so either both happened or
     * neither did.
     */
    export const stripeEvents = pgTable('stripe_events', {
      id: text('id').primaryKey(),
      type: text('type').notNull(),
      receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    });

    /** A paid order, created only from a verified `checkout.session.completed`. */
    export const orders = pgTable('orders', {
      id: serial('id').primaryKey(),
      // Unique as well: a second event about the same session must not create a
      // second order, even if its event id differs.
      checkoutSessionId: text('checkout_session_id').notNull().unique(),
      amountTotal: integer('amount_total'),
      currency: text('currency'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    });
    ```

    Verify: `test -f src/payments/schema.ts`

14. Create `src/payments/checkout.ts` with:

    ```typescript
    import type Stripe from 'stripe';

    import type { PaymentSettings } from './config.ts';

    /**
     * The one Stripe call this module makes, as a type. The real client satisfies
     * it, and a test passes an object that records what it was asked instead —
     * so no test needs a key, an account or the network.
     */
    export interface CheckoutClient {
      checkout: {
        sessions: {
          create(params: Stripe.Checkout.SessionCreateParams): Promise<{ url: string | null }>;
        };
      };
    }

    /**
     * Start a hosted Checkout session and return where to send the buyer.
     *
     * Hosted Checkout means the card number is typed into a page Stripe serves,
     * and never passes through this server. The price comes from configuration,
     * not from the request, so a buyer cannot choose what they pay.
     */
    export async function createCheckoutSession(
      client: CheckoutClient,
      settings: PaymentSettings,
    ): Promise<string> {
      const session = await client.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: settings.priceId, quantity: 1 }],
        // From configuration rather than from the request's Host header, which
        // the caller controls.
        success_url: new URL('/?checkout=success', settings.appUrl).toString(),
        cancel_url: new URL('/?checkout=cancelled', settings.appUrl).toString(),
      });
      if (session.url === null) {
        throw new Error('Stripe returned a Checkout session without a URL');
      }
      return session.url;
    }
    ```

    Verify: `test -f src/payments/checkout.ts`

15. Create `src/payments/webhook.ts` with:

    ```typescript
    import Stripe from 'stripe';

    import { db } from '../db/client.ts';
    import { orders, stripeEvents } from './schema.ts';

    export interface WebhookResult {
      readonly status: number;
      readonly body: { received: boolean; duplicate?: boolean; error?: string };
    }

    /**
     * Verify, then act once.
     *
     * `constructEvent` checks the signature against the raw body with the
     * endpoint's signing secret, and refuses a timestamp older than its tolerance
     * (five minutes by default), which is what stops a captured delivery being
     * replayed later. It needs the body exactly as sent: parse it first and the
     * signature no longer matches.
     */
    export async function handleStripeWebhook(
      payload: string,
      signature: string | null,
      webhookSecret: string,
    ): Promise<WebhookResult> {
      if (signature === null || signature === '') {
        return { status: 400, body: { received: false, error: 'missing signature' } };
      }

      let event: Stripe.Event;
      try {
        event = Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch {
        // Which check failed helps somebody forging events and nobody else.
        return { status: 400, body: { received: false, error: 'invalid signature' } };
      }

      const firstDelivery = await db().transaction(async (tx) => {
        const recorded = await tx
          .insert(stripeEvents)
          .values({ id: event.id, type: event.type })
          .onConflictDoNothing()
          .returning({ id: stripeEvents.id });
        if (recorded.length === 0) return false;

        if (
          (event.type === 'checkout.session.completed' &&
            event.data.object.payment_status === 'paid') ||
          event.type === 'checkout.session.async_payment_succeeded'
        ) {
          const session = event.data.object;
          await tx
            .insert(orders)
            .values({
              checkoutSessionId: session.id,
              amountTotal: session.amount_total,
              currency: session.currency,
            })
            .onConflictDoNothing();
        }
        return true;
      });

      // A duplicate is still a success: answering an error would make Stripe
      // deliver it again, and again.
      return firstDelivery
        ? { status: 200, body: { received: true } }
        : { status: 200, body: { received: true, duplicate: true } };
    }
    ```

    Verify: `test -f src/payments/webhook.ts`

16. Create `src/payments/startup.ts` with:

    ```typescript
    import { assertUsableInProduction } from './config.ts';

    /**
     * Exit rather than throw. Next 16 logs an error thrown from `register()` and
     * then carries on serving, so a thrown refusal leaves a server that is up and
     * cannot take a payment. The recipe starts the built server with the
     * placeholder keys and asserts that the process ends.
     */
    export function refuseToStartWithoutUsableKeys(): void {
      try {
        assertUsableInProduction();
      } catch (error) {
        console.error(`refusing to start: ${(error as Error).message}`);
        process.exit(1);
      }
    }
    ```

    Verify: `test -f src/payments/startup.ts`

17. Create `src/instrumentation.ts` with:

    ```typescript
    /**
     * Runs once when the server starts.
     *
     * In production, a placeholder Stripe key stops the process here instead of
     * surfacing as a failed checkout in front of a customer. The check lives in a
     * Node-only module: this file is also compiled for the edge runtime, where
     * `process.exit` does not exist.
     */
    export async function register(): Promise<void> {
      if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { refuseToStartWithoutUsableKeys } = await import('./payments/startup.ts');
        refuseToStartWithoutUsableKeys();
      }
    }
    ```

    Verify: `test -f src/instrumentation.ts`

18. Create `src/app/api/checkout/route.ts` with:

    ```typescript
    import Stripe from 'stripe';

    import { createCheckoutSession } from '../../../payments/checkout.ts';
    import { paymentSettings } from '../../../payments/config.ts';

    /**
     * POST only: starting a checkout is an action, and a GET that did it could be
     * triggered by a prefetch or an image tag.
     */
    export async function POST(): Promise<Response> {
      const settings = paymentSettings();
      const url = await createCheckoutSession(new Stripe(settings.secretKey), settings);
      // 303, so the browser follows with a GET to Stripe's page.
      return Response.redirect(url, 303);
    }
    ```

    Verify: `test -f src/app/api/checkout/route.ts`

19. Create `src/app/api/stripe/webhook/route.ts` with:

    ```typescript
    import { paymentSettings } from '../../../../payments/config.ts';
    import { handleStripeWebhook } from '../../../../payments/webhook.ts';

    /**
     * The raw body is read with `request.text()`, never `request.json()`: the
     * signature covers the exact bytes Stripe sent.
     */
    export async function POST(request: Request): Promise<Response> {
      const result = await handleStripeWebhook(
        await request.text(),
        request.headers.get('stripe-signature'),
        paymentSettings().webhookSecret,
      );
      return Response.json(result.body, { status: result.status });
    }
    ```

    Verify: `test -f src/app/api/stripe/webhook/route.ts`

20. Create `tests/payments.test.ts` with:

    ```typescript
    import assert from 'node:assert/strict';
    import { after, beforeEach, describe, it } from 'node:test';

    import Stripe from 'stripe';

    import { closeDb, db } from '../src/db/client.ts';
    import { createCheckoutSession, type CheckoutClient } from '../src/payments/checkout.ts';
    import { assertUsableInProduction, type PaymentSettings } from '../src/payments/config.ts';
    import { orders, stripeEvents } from '../src/payments/schema.ts';
    import { handleStripeWebhook } from '../src/payments/webhook.ts';

    /**
     * No Stripe account, key or network call anywhere in this file.
     *
     * Signed payloads are built with the Stripe SDK's own test helper, so the
     * handler verifies them with exactly the code a real delivery goes through.
     * The one outbound call, creating a Checkout session, is replaced at the
     * boundary by an object that records what it was asked.
     */
    const webhookSecret = 'whsec_EXAMPLE_local_development_only';

    const settings: PaymentSettings = {
      secretKey: 'sk_test_EXAMPLE_local_development_only',
      webhookSecret,
      priceId: 'price_EXAMPLE_local_development_only',
      appUrl: 'http://localhost:3000',
    };

    function completed(eventId: string, sessionId: string, paymentStatus = 'paid'): string {
      return JSON.stringify({
        id: eventId,
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            object: 'checkout.session',
            payment_status: paymentStatus,
            amount_total: 1000,
            currency: 'usd',
          },
        },
      });
    }

    function sign(payload: string, options: { secret?: string; timestamp?: number } = {}): string {
      return Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: options.secret ?? webhookSecret,
        ...(options.timestamp === undefined ? {} : { timestamp: options.timestamp }),
      });
    }

    const count = async (table: typeof orders | typeof stripeEvents): Promise<number> =>
      (await db().select().from(table)).length;

    describe('stripe webhook', () => {
      beforeEach(async () => {
        await db().delete(orders);
        await db().delete(stripeEvents);
      });

      after(async () => {
        await db().delete(orders);
        await db().delete(stripeEvents);
        await closeDb();
      });

      it('refuses an unsigned event', async () => {
        const result = await handleStripeWebhook(completed('evt_1', 'cs_1'), null, webhookSecret);
        assert.equal(result.status, 400);
        assert.equal(await count(orders), 0);
      });

      it('refuses an event signed with another secret', async () => {
        const payload = completed('evt_1', 'cs_1');
        const signature = sign(payload, { secret: 'whsec_EXAMPLE_some_other_endpoint' });
        assert.equal((await handleStripeWebhook(payload, signature, webhookSecret)).status, 400);
        assert.equal(await count(orders), 0);
      });

      it('refuses a body that is not the one that was signed', async () => {
        const signature = sign(completed('evt_1', 'cs_1'));
        const tampered = completed('evt_1', 'cs_attacker');
        assert.equal((await handleStripeWebhook(tampered, signature, webhookSecret)).status, 400);
        assert.equal(await count(orders), 0);
      });

      it('refuses a replayed event whose signature is older than the tolerance', async () => {
        const payload = completed('evt_1', 'cs_1');
        const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
        const signature = sign(payload, { timestamp: tenMinutesAgo });
        assert.equal((await handleStripeWebhook(payload, signature, webhookSecret)).status, 400);
        assert.equal(await count(orders), 0);
      });

      it('records an order for a signed, paid checkout', async () => {
        const payload = completed('evt_1', 'cs_1');
        const result = await handleStripeWebhook(payload, sign(payload), webhookSecret);
        assert.equal(result.status, 200);
        assert.equal(await count(orders), 1);
      });

      it('changes state once when the same event is delivered twice', async () => {
        const payload = completed('evt_1', 'cs_1');
        const first = await handleStripeWebhook(payload, sign(payload), webhookSecret);
        const second = await handleStripeWebhook(payload, sign(payload), webhookSecret);

        assert.equal(first.status, 200);
        // A duplicate is acknowledged, or Stripe keeps delivering it.
        assert.equal(second.status, 200);
        assert.equal(second.body.duplicate, true);
        assert.equal(await count(orders), 1);
        assert.equal(await count(stripeEvents), 1);
      });

      it('creates one order per session even across different events', async () => {
        const first = completed('evt_1', 'cs_1');
        const second = completed('evt_2', 'cs_1');
        await handleStripeWebhook(first, sign(first), webhookSecret);
        await handleStripeWebhook(second, sign(second), webhookSecret);
        assert.equal(await count(orders), 1);
      });

      it('records no order for a checkout that is not paid yet', async () => {
        const payload = completed('evt_1', 'cs_1', 'unpaid');
        assert.equal(
          (await handleStripeWebhook(payload, sign(payload), webhookSecret)).status,
          200,
        );
        assert.equal(await count(orders), 0);
      });
    });

    describe('checkout', () => {
      it('asks Stripe for the configured price and returns its hosted page', async () => {
        const asked: Stripe.Checkout.SessionCreateParams[] = [];
        const client: CheckoutClient = {
          checkout: {
            sessions: {
              create: async (params) => {
                asked.push(params);
                return { url: 'http://localhost/stands-in-for-stripe-checkout' };
              },
            },
          },
        };

        const url = await createCheckoutSession(client, settings);

        assert.equal(url, 'http://localhost/stands-in-for-stripe-checkout');
        assert.equal(asked.length, 1);
        assert.equal(asked[0]?.mode, 'payment');
        assert.deepEqual(asked[0]?.line_items, [{ price: settings.priceId, quantity: 1 }]);
        assert.equal(asked[0]?.success_url, 'http://localhost:3000/?checkout=success');
      });

      it('fails rather than redirecting nowhere', async () => {
        const client: CheckoutClient = {
          checkout: { sessions: { create: async () => ({ url: null }) } },
        };
        await assert.rejects(createCheckoutSession(client, settings));
      });
    });

    describe('configuration', () => {
      const env = {
        STRIPE_SECRET_KEY: settings.secretKey,
        STRIPE_WEBHOOK_SECRET: settings.webhookSecret,
        STRIPE_PRICE_ID: settings.priceId,
        APP_URL: settings.appUrl,
      };

      it('refuses placeholder keys in production', () => {
        assert.throws(
          () => assertUsableInProduction({ ...env, NODE_ENV: 'production' }),
          /placeholder/,
        );
      });

      it('refuses missing keys in production', () => {
        assert.throws(
          () => assertUsableInProduction({ ...env, STRIPE_SECRET_KEY: '', NODE_ENV: 'production' }),
          /STRIPE_SECRET_KEY is required/,
        );
      });

      it('refuses a value that is not a Stripe key in production', () => {
        assert.throws(
          () =>
            assertUsableInProduction({
              ...env,
              STRIPE_SECRET_KEY: 'pk_test_x',
              NODE_ENV: 'production',
            }),
          /not a Stripe secret/,
        );
      });

      it('accepts key-shaped values in production', () => {
        // Built at run time, so no key-shaped string is committed anywhere.
        const shaped = (prefix: string): string => prefix + 'a1B2c3D4'.repeat(3);
        assert.doesNotThrow(() =>
          assertUsableInProduction({
            ...env,
            STRIPE_SECRET_KEY: shaped('sk_test_'),
            STRIPE_WEBHOOK_SECRET: shaped('whsec_'),
            NODE_ENV: 'production',
          }),
        );
      });

      it('lets development run on the placeholders', () => {
        assert.doesNotThrow(() => assertUsableInProduction({ ...env, NODE_ENV: 'development' }));
      });
    });
    ```

    Verify: `test -f tests/payments.test.ts`

21. Create `scripts/check-client-bundle.mjs` with:

    ```javascript
    // Fails if a Stripe secret, or the name of one, reached the browser bundle.
    //
    // Everything under .next/static is served to every visitor. Run it after a
    // build made with the secrets set, so a leak shows up as the value itself.
    import { readdirSync, readFileSync } from 'node:fs';
    import { join } from 'node:path';

    const root = '.next/static';
    const files = readdirSync(root, { recursive: true })
      .map(String)
      .filter((name) => name.endsWith('.js'))
      .map((name) => join(root, name));

    // A check over no files passes without looking at anything.
    if (files.length === 0) {
      console.error(`no JavaScript under ${root}; build first`);
      process.exit(1);
    }

    const needles = [
      process.env.STRIPE_SECRET_KEY,
      process.env.STRIPE_WEBHOOK_SECRET,
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'sk_live_',
      'sk_test_',
      'rk_live_',
      'whsec_',
    ].filter((needle) => needle !== undefined && needle !== '');

    let leaks = 0;
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const needle of needles) {
        if (text.includes(needle)) {
          console.error(`${file} contains ${needle.slice(0, 8)}...`);
          leaks += 1;
        }
      }
    }

    if (leaks > 0) process.exit(1);
    console.log(`${files.length} client file(s) checked, no Stripe secret found`);
    ```

    Verify: `test -f scripts/check-client-bundle.mjs`

<!-- endif -->

22. Create `compose.yaml` with:

    ```yaml
    services:
      db:
        image: postgres:18-alpine
        environment:
          POSTGRES_PASSWORD: local-development-only
          POSTGRES_DB: app
        # Loopback, and no fixed host port. Loopback because a database on
        # 0.0.0.0 is reachable from whatever network the laptop is on. No
        # fixed port because 5432 is usually already taken — by the Postgres
        # somebody installed, or by another project's compose file — and the
        # failure is a cryptic "port is already allocated" at the worst
        # moment. The next step asks Docker which port it chose.
        ports: ['127.0.0.1::5432']
        healthcheck:
          test: ['CMD-SHELL', 'pg_isready -U postgres']
          interval: 2s
          retries: 15
    ```

    Verify: `test -f compose.yaml`

23. Create `.gitignore` with:

    ```text
    node_modules/
    .next/
    *.tsbuildinfo
    .env*
    db.url
    ```

    Verify: `test -f .gitignore`

<!-- if options.payments == none -->

24. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        services:
          db:
            image: postgres:18-alpine
            env:
              POSTGRES_PASSWORD: local-development-only
              POSTGRES_DB: app
            ports: ['5432:5432']
            options: >-
              --health-cmd "pg_isready -U postgres"
              --health-interval 2s
              --health-retries 15
        env:
          DATABASE_URL: postgresql://postgres:local-development-only@127.0.0.1:5432/app
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-node@2028fbc5c25fe9cf00d9f06a71cc4710d4507903 # v5.0.0
            with:
              node-version: '22'
          - run: npm install --no-audit --no-fund
          - run: npm run db:migrate
          - run: npm test
          - run: npm run build
    ```

    Verify: `test -f .github/workflows/ci.yml`

<!-- endif -->

<!-- if options.payments == stripe -->

24. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        services:
          db:
            image: postgres:18-alpine
            env:
              POSTGRES_PASSWORD: local-development-only
              POSTGRES_DB: app
            ports: ['5432:5432']
            options: >-
              --health-cmd "pg_isready -U postgres"
              --health-interval 2s
              --health-retries 15
        env:
          DATABASE_URL: postgresql://postgres:local-development-only@127.0.0.1:5432/app
          # Placeholders, so the build runs with keys set and the bundle check
          # has values to look for. Real keys never belong in a workflow file.
          STRIPE_SECRET_KEY: sk_test_EXAMPLE_local_development_only
          STRIPE_WEBHOOK_SECRET: whsec_EXAMPLE_local_development_only
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-node@2028fbc5c25fe9cf00d9f06a71cc4710d4507903 # v5.0.0
            with:
              node-version: '22'
          - run: npm install --no-audit --no-fund
          - run: npm run db:migrate
          - run: npm test
          - run: npm run build
          - run: npm run check:client-bundle
    ```

    Verify: `test -f .github/workflows/ci.yml`

<!-- endif -->

25. Create `README.md` with:

    ```markdown
    # app

    A full-stack Next.js application with Postgres through Drizzle.

    ## Run it

    Start the database with `docker compose up -d --wait`. It binds to a port
    the operating system chooses, so build the connection string from
    `docker compose port db 5432` rather than assuming 5432 — see the comment
    in `compose.yaml` for why. Then `npm run db:migrate` and `npm run dev`.

    `DATABASE_URL` is required; nothing here has a default that points at a
    real database.

    ## Change the schema

    Edit `src/db/schema.ts`, run `npm run db:generate`, read the SQL it wrote,
    commit both. Never hand-edit a generated migration — see `AGENTS.md`.
    ```

    Verify: `test -f README.md`

26. Install the pinned dependencies again after the source exists, so the lock state matches what will be built: `npm install --no-audit --no-fund`
    Verify: `test -d node_modules/next`

27. Generate the first migration from the schema. The file name carries a random word, so it is generated rather than written by this recipe: `npm run db:generate`
    Verify: `ls drizzle/*.sql`

28. Remove a database container left behind by an earlier attempt: `docker compose down -v > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker compose ps -q db)"`

29. Start Postgres and wait for it to accept connections: `docker compose up -d --wait`
    Verify: `test -n "$(docker compose ps -q db)"`

30. Ask Docker which host port it chose, and write the connection string once so every step below uses the same one: `echo "postgresql://postgres:local-development-only@$(docker compose port db 5432)/app" > db.url`
    Verify: `grep -q "^postgresql://" db.url`

31. Apply the migration: `DATABASE_URL="$(cat db.url)" npm run db:migrate`
    Verify: `DATABASE_URL="$(cat db.url)" npm run db:migrate`

32. Run the tests, which prove the migration produced the columns the schema describes: `DATABASE_URL="$(cat db.url)" npm test`
    Verify: `DATABASE_URL="$(cat db.url)" npm test`

<!-- if options.payments == none -->

33. Build the application: `DATABASE_URL="$(cat db.url)" npm run build`
    Verify: `test -d .next`

<!-- endif -->

<!-- if options.payments == stripe -->

33. Build the application with the Stripe keys set, so the next step has real values to look for in the browser bundle. These are the placeholders, which the build accepts and production refuses: `STRIPE_SECRET_KEY="sk_test_EXAMPLE_local_development_only" STRIPE_WEBHOOK_SECRET="whsec_EXAMPLE_local_development_only" DATABASE_URL="$(cat db.url)" npm run build`
    Verify: `test -d .next`

34. Confirm no Stripe key, and no name of one, reached anything the browser downloads: `STRIPE_SECRET_KEY="sk_test_EXAMPLE_local_development_only" STRIPE_WEBHOOK_SECRET="whsec_EXAMPLE_local_development_only" npm run check:client-bundle`
    Verify: `STRIPE_SECRET_KEY="sk_test_EXAMPLE_local_development_only" STRIPE_WEBHOOK_SECRET="whsec_EXAMPLE_local_development_only" npm run check:client-bundle`

35. Start the built server in production with the placeholder keys, which it must refuse. `timeout` ends the attempt if it does not: `STRIPE_SECRET_KEY="sk_test_EXAMPLE_local_development_only" STRIPE_WEBHOOK_SECRET="whsec_EXAMPLE_local_development_only" STRIPE_PRICE_ID="price_EXAMPLE_local_development_only" APP_URL="http://localhost:3000" DATABASE_URL="$(cat db.url)" timeout 120 ./node_modules/.bin/next start -H 127.0.0.1 -p 0 > refused-start.log 2>&1; echo $? > refused-start.code`
    Verify: `grep -q "refusing to start" refused-start.log && grep -qx 1 refused-start.code`

<!-- endif -->

36. Stop the database: `docker compose down -v`
    Verify: `test -z "$(docker compose ps -q db)"`
