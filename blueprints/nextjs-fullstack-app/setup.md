# Setup

Creates a full-stack Next.js application with Tailwind, a Postgres database
through Drizzle, and migrations that are generated, applied and then proved by
a test that round-trips a row.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22 or newer and Docker.

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

12. Create `compose.yaml` with:

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

13. Create `.gitignore` with:

    ```text
    node_modules/
    .next/
    *.tsbuildinfo
    .env*
    db.url
    ```

    Verify: `test -f .gitignore`

14. Create `.github/workflows/ci.yml` with:

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

15. Create `README.md` with:

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

16. Install the pinned dependencies again after the source exists, so the lock state matches what will be built: `npm install --no-audit --no-fund`
    Verify: `test -d node_modules/next`

17. Generate the first migration from the schema. The file name carries a random word, so it is generated rather than written by this recipe: `npm run db:generate`
    Verify: `ls drizzle/*.sql`

18. Remove a database container left behind by an earlier attempt: `docker compose down -v > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker compose ps -q db)"`

19. Start Postgres and wait for it to accept connections: `docker compose up -d --wait`
    Verify: `test -n "$(docker compose ps -q db)"`

20. Ask Docker which host port it chose, and write the connection string once so every step below uses the same one: `echo "postgresql://postgres:local-development-only@$(docker compose port db 5432)/app" > db.url`
    Verify: `grep -q "^postgresql://" db.url`

21. Apply the migration: `DATABASE_URL="$(cat db.url)" npm run db:migrate`
    Verify: `DATABASE_URL="$(cat db.url)" npm run db:migrate`

22. Run the tests, which prove the migration produced the columns the schema describes: `DATABASE_URL="$(cat db.url)" npm test`
    Verify: `DATABASE_URL="$(cat db.url)" npm test`

23. Build the application: `DATABASE_URL="$(cat db.url)" npm run build`
    Verify: `test -d .next`

24. Stop the database: `docker compose down -v`
    Verify: `test -z "$(docker compose ps -q db)"`
