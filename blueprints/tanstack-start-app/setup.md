# Setup

Creates a TanStack Start application: React with TanStack Router's file-based
routes, a typed and validated search parameter and path parameter, server
functions for everything that needs the server, one account behind a sealed
session cookie, a route guard that sends anybody without a session to the
sign-in page, and a production build that runs as a Node server. The proof at
the end is a set of requests against that built server.

Run every step from an empty directory that will hold the project. Each step is
one action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.12 or newer (the floor TanStack Start, Vite 8 and Vitest 5
declare on the 22 line), npm, and curl. No browser download, no Docker, no
account anywhere.

1. Generate the project with the pinned TanStack CLI, the non-interactive path TanStack documents (`@tanstack/create-start` is now a deprecated wrapper around it): React, the Nitro adapter for a Node server, no demo pages, no linter preset, no agent skill files, no git repository and no install yet, because the next step pins every version the generator leaves as `latest` or a range. The CLI sends usage telemetry to Google Analytics by default; the environment variable turns it off and also stops it writing an identifier under your home directory. It fetches nothing but npm packages: `TANSTACK_CLI_TELEMETRY_DISABLED=1 npx --yes @tanstack/cli@0.71.0 create app --target-dir . --framework React --deployment nitro --no-examples --no-toolchain --no-intent --no-git --no-install --package-manager npm --non-interactive`
   Verify: `test -f vite.config.ts && test -f src/router.tsx && test -f src/routes/__root.tsx`

2. Pin every version exactly instead of the generator's `latest` tags and ranges, drop the devtools and the router CLI, and add Zod, Vitest and the test scripts. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Replace `package.json` with:

   ```json
   {
     "name": "app",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "engines": {
       "node": "^22.12.0 || ^24.0.0 || >=26.0.0"
     },
     "scripts": {
       "dev": "vite dev --port 3000",
       "build": "vite build",
       "start": "node .output/server/index.mjs",
       "typecheck": "tsc",
       "test": "vitest run",
       "test:e2e": "vitest run --config vitest.e2e.config.ts",
       "hash-password": "node scripts/hash-password.mjs"
     },
     "overrides": {
       "vitest": "5.0.1"
     },
     "dependencies": {
       "@tanstack/react-router": "1.170.39",
       "@tanstack/react-start": "1.168.58",
       "nitro": "3.0.260903-beta",
       "react": "19.3.0",
       "react-dom": "19.3.0",
       "zod": "4.6.5"
     },
     "devDependencies": {
       "@tailwindcss/vite": "4.3.3",
       "@types/node": "22.20.4",
       "@types/react": "19.3.0",
       "@types/react-dom": "19.3.0",
       "@vitejs/plugin-react": "6.1.1",
       "tailwindcss": "4.3.3",
       "typescript": "6.0.3",
       "vite": "8.3.1",
       "vitest": "5.0.1"
     }
   }
   ```

   Verify: `test -f package.json`

3. Install the pinned dependencies. This writes `package-lock.json`, which is committed and is what CI installs from: `npm install --no-audit --no-fund`
   Verify: `npm ls @tanstack/react-start @tanstack/react-router nitro vite vitest zod --depth=0`

4. Remove the router CLI's configuration, which nothing uses once the router CLI is gone: the Start plugin regenerates the route tree on every `dev` and `build`: `rm tsr.config.json`
   Verify: `test ! -e tsr.config.json`

5. Strict TypeScript, stated rather than inherited, and the tests and configs included in the check. Replace `tsconfig.json` with:

   ```json
   {
     "include": ["src", "e2e", "vite.config.ts", "vitest.config.ts", "vitest.e2e.config.ts"],
     "compilerOptions": {
       "target": "es2022",
       "lib": ["es2022", "dom", "dom.iterable"],
       "module": "esnext",
       "moduleResolution": "bundler",
       "jsx": "react-jsx",
       "types": ["vite/client", "node"],
       "verbatimModuleSyntax": true,
       "noEmit": true,
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "skipLibCheck": true
     }
   }
   ```

   Verify: `test -f tsconfig.json`

6. The generator's plugins without the devtools, and no source maps in the build. Replace `vite.config.ts` with:

   ```typescript
   import tailwindcss from '@tailwindcss/vite';
   import { tanstackStart } from '@tanstack/react-start/plugin/vite';
   import viteReact from '@vitejs/plugin-react';
   import { nitro } from 'nitro/vite';
   import { defineConfig } from 'vite';

   // Order matters: Start has to see the source before the React plugin
   // transforms it, and Nitro wraps the result into a Node server.
   export default defineConfig({
     build: { sourcemap: false },
     plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
   });
   ```

   Verify: `test -f vite.config.ts`

7. Tailwind, and nothing else. Replace `src/styles.css` with:

   ```css
   @import 'tailwindcss';
   ```

   Verify: `test -f src/styles.css`

8. Password hashing with scrypt from `node:crypto`, and the format of the one account. Create `src/server/password.ts` with:

   ```typescript
   /**
    * Password hashing, and the format of the one account this app knows.
    *
    * scrypt from node:crypto rather than a package: it is a memory-hard KDF, it
    * ships with Node, and it adds nothing to the supply chain. The parameters
    * are fixed here and in `scripts/hash-password.mjs`; a test holds the two
    * together, because a hash made with other parameters never verifies.
    */
   import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

   const KEY_LENGTH = 64;
   // N = 2^17, r = 8, p = 1: about 128 MiB per hash. maxmem has to be raised to
   // allow it, or scrypt refuses before it starts.
   const PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;

   export interface StoredUser {
     readonly username: string;
     readonly salt: Buffer;
     readonly hash: Buffer;
   }

   const USERNAME = /^[A-Za-z0-9._-]{1,64}$/;

   /** Parses `username:scrypt:<salt>:<hash>`, both base64url. */
   export function parseAuthUser(value: string): StoredUser {
     const [username = '', scheme, salt = '', hash = '', ...rest] = value.trim().split(':');
     if (scheme !== 'scrypt' || rest.length > 0 || !USERNAME.test(username)) {
       throw new Error(
         'AUTH_USER must look like username:scrypt:<salt>:<hash>; create one with npm run hash-password',
       );
     }
     const saltBytes = Buffer.from(salt, 'base64url');
     const hashBytes = Buffer.from(hash, 'base64url');
     if (saltBytes.length < 16 || hashBytes.length !== KEY_LENGTH) {
       throw new Error('AUTH_USER has a salt shorter than 16 bytes or a hash of the wrong length');
     }
     return { username, salt: saltBytes, hash: hashBytes };
   }

   export function hashPassword(username: string, password: string): string {
     const salt = randomBytes(16);
     const hash = scryptSync(password, salt, KEY_LENGTH, PARAMS);
     return `${username}:scrypt:${salt.toString('base64url')}:${hash.toString('base64url')}`;
   }

   /**
    * True when both the username and the password match.
    *
    * scrypt runs whether or not the username matched, so the time a failed
    * sign-in takes does not reveal which of the two was wrong.
    */
   export function verifyCredentials(
     user: StoredUser,
     username: string,
     password: string,
   ): boolean {
     const actual = scryptSync(password, user.salt, KEY_LENGTH, PARAMS);
     const passwordMatches = timingSafeEqual(actual, user.hash);
     return passwordMatches && username === user.username;
   }
   ```

   Verify: `test -f src/server/password.ts`

9. How somebody produces an `AUTH_USER` value without the password landing in their shell history. Create `scripts/hash-password.mjs` with:

   ```javascript
   // Prints an AUTH_USER value, `username:scrypt:<salt>:<hash>`, for the password
   // read from standard input — not from an argument, which would land in the
   // shell history. Usage: printf '%s' "$PASSWORD" | npm run --silent hash-password -- <username>
   //
   // The parameters match src/server/password.ts; src/server/password.test.ts
   // fails if they drift apart.
   import { randomBytes, scryptSync } from 'node:crypto';
   import { readFileSync } from 'node:fs';

   const username = process.argv[2] ?? '';
   const password = readFileSync(0, 'utf8');

   if (!/^[A-Za-z0-9._-]{1,64}$/.test(username) || password.length === 0) {
     console.error('usage: printf %s "$PASSWORD" | npm run --silent hash-password -- <username>');
     process.exit(2);
   }

   const salt = randomBytes(16);
   const hash = scryptSync(password, salt, 64, {
     N: 2 ** 17,
     r: 8,
     p: 1,
     maxmem: 256 * 1024 * 1024,
   });
   process.stdout.write(
     `${username}:scrypt:${salt.toString('base64url')}:${hash.toString('base64url')}\n`,
   );
   ```

   Verify: `test -f scripts/hash-password.mjs`

10. The one place configuration is read: development values that are obviously fake, and a production build that refuses them. Create `src/server/config.ts` with:

    ```typescript
    /**
     * The one place server configuration is read and checked.
     *
     * Nothing in here has a working production default. Development gets clearly
     * fake values so `npm run dev` works on a fresh clone; a production build
     * refuses those values, so a deployment that forgot to set a variable fails
     * on its first request instead of sealing sessions with a string that is
     * published in this file.
     */
    import { hashPassword, parseAuthUser, type StoredUser, verifyCredentials } from './password';

    /** Development only. A production build refuses it — see `readSessionSecret`. */
    export const DEV_SESSION_SECRET = 'dev-only-session-secret-not-for-production';

    /** Development only. A production build refuses this account — see `readAuthUser`. */
    export const DEV_USERNAME = 'demo';
    export const DEV_PASSWORD = 'demo-password-not-for-production';

    /** The minimum the session sealing accepts, and the minimum this file accepts. */
    const MIN_SECRET_LENGTH = 32;

    export class ConfigError extends Error {
      override readonly name = 'ConfigError';
    }

    type Env = Readonly<Record<string, string | undefined>>;

    export function readSessionSecret(env: Env, production: boolean): string {
      const secret = env['SESSION_SECRET'];
      if (secret === undefined || secret === '') {
        if (production) throw new ConfigError('SESSION_SECRET is required in production');
        return DEV_SESSION_SECRET;
      }
      if (production && secret === DEV_SESSION_SECRET) {
        throw new ConfigError('SESSION_SECRET is the development placeholder; generate a real one');
      }
      if (secret.length < MIN_SECRET_LENGTH) {
        throw new ConfigError(
          `SESSION_SECRET must be at least ${String(MIN_SECRET_LENGTH)} characters`,
        );
      }
      return secret;
    }

    // scrypt is slow on purpose, so each distinct AUTH_USER value is parsed and
    // checked against the development password once, not on every request.
    interface Account {
      readonly user: StoredUser;
      readonly isDevelopmentAccount: boolean;
    }
    const accounts = new Map<string, Account>();

    export function readAuthUser(env: Env, production: boolean): StoredUser {
      const raw = env['AUTH_USER'] ?? '';
      if (raw === '' && production) throw new ConfigError('AUTH_USER is required in production');

      let account = accounts.get(raw);
      if (account === undefined) {
        const user = parseAuthUser(raw === '' ? hashPassword(DEV_USERNAME, DEV_PASSWORD) : raw);
        // Checked against the password rather than against a string, so the
        // development account is recognised whichever salt it was hashed with.
        account = {
          user,
          isDevelopmentAccount: verifyCredentials(user, DEV_USERNAME, DEV_PASSWORD),
        };
        accounts.set(raw, account);
      }
      if (production && account.isDevelopmentAccount) {
        throw new ConfigError('AUTH_USER is the development account; hash a real password');
      }
      return account.user;
    }
    ```

    Verify: `test -f src/server/config.ts`

11. A per-address limit on sign-in attempts, checked before the expensive password hash. Create `src/server/rate-limit.ts` with:

    ```typescript
    /**
     * A fixed-window counter per key, held in this process's memory.
     *
     * Enough for one server process. Several instances, or a restart, each keep
     * their own count; when that matters, rate-limit at the proxy or in a shared
     * store instead, and keep the call site in `auth.ts` where it is.
     */
    export interface RateLimitResult {
      readonly allowed: boolean;
      readonly retryAfterSeconds: number;
    }

    export interface RateLimiter {
      hit(key: string, now?: number): RateLimitResult;
    }

    const MAX_TRACKED_KEYS = 10_000;

    export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
      const windows = new Map<string, { count: number; resetAt: number }>();

      return {
        hit(key, now = Date.now()) {
          let window = windows.get(key);
          if (window === undefined || window.resetAt <= now) {
            // Drop expired windows before tracking a new key, so the map does not
            // grow for as long as the process lives.
            if (windows.size >= MAX_TRACKED_KEYS) {
              for (const [tracked, entry] of windows)
                if (entry.resetAt <= now) windows.delete(tracked);
            }
            window = { count: 0, resetAt: now + windowMs };
            windows.set(key, window);
          }
          window.count += 1;
          return {
            allowed: window.count <= limit,
            retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
          };
        },
      };
    }

    /** Ten sign-in attempts per client address per fifteen minutes. */
    export const signInAttempts = createRateLimiter(10, 15 * 60 * 1000);
    ```

    Verify: `test -f src/server/rate-limit.ts`

12. The session: a cookie sealed by Start with `SESSION_SECRET`. Create `src/server/session.ts` with:

    ```typescript
    import { useSession } from '@tanstack/react-start/server';

    import { readSessionSecret } from './config';

    interface SessionData {
      readonly username?: string;
    }

    export const SESSION_COOKIE = 'app-session';
    const EIGHT_HOURS = 8 * 60 * 60;

    /**
     * The session is a sealed cookie: encrypted and integrity-checked by Start
     * with SESSION_SECRET, so the browser holds it but cannot read or change it.
     *
     * `import.meta.env.PROD` is replaced at build time, so the production build
     * refuses the development secret whatever NODE_ENV says at run time.
     */
    export function appSession() {
      return useSession<SessionData>({
        name: SESSION_COOKIE,
        password: readSessionSecret(process.env, import.meta.env.PROD),
        maxAge: EIGHT_HOURS,
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          secure: import.meta.env.PROD,
          path: '/',
        },
      });
    }
    ```

    Verify: `test -f src/server/session.ts`

13. The input shapes the browser and the server share, including the redirect target that may only be a path on this site. Create `src/auth/schemas.ts` with:

    ```typescript
    import { z } from 'zod';

    /**
     * Input shapes shared by the browser and the server. Nothing in this file may
     * import from `src/server/`: it is bundled into the client.
     */

    export interface User {
      readonly username: string;
    }

    /**
     * A path on this site, and nothing else. `//example.com` and `/\example.com`
     * are read by browsers as another host, which would turn the sign-in page into
     * an open redirect.
     */
    export const safeRedirect = z
      .string()
      .max(2048)
      .regex(/^\/(?![/\\])/, 'must be a path on this site');

    export const signInInput = z.object({
      username: z.string().trim().min(1).max(64),
      password: z.string().min(1).max(1024),
      redirect: safeRedirect.optional(),
    });

    export type SignInInput = z.infer<typeof signInInput>;

    /** What the sign-in page accepts in its query string. A bad value is dropped, not an error. */
    export const loginSearch = z.object({
      redirect: safeRedirect.optional().catch(undefined),
      error: z.literal('invalid').optional().catch(undefined),
    });
    ```

    Verify: `test -f src/auth/schemas.ts`

14. What a protected route does with the answer to "who is signed in". Create `src/auth/guard.ts` with:

    ```typescript
    import { redirect } from '@tanstack/react-router';

    import type { User } from './schemas';

    /**
     * What every protected route's `beforeLoad` does with the current user.
     *
     * It runs on the server for the first request and in the browser on every
     * navigation after that. Either way the answer comes from the session cookie,
     * through a server function; the browser's copy of this code decides nothing
     * the server has not already decided.
     */
    export function requireUser(user: User | null, href: string): { user: User } {
      if (user === null) {
        throw redirect({ to: '/login', search: { redirect: href } });
      }
      return { user };
    }
    ```

    Verify: `test -f src/auth/guard.ts`

15. The three server functions: who is signed in, sign in (validated, rate-limited), sign out. Create `src/server/auth.ts` with:

    ```typescript
    import { redirect } from '@tanstack/react-router';
    import { createServerFn } from '@tanstack/react-start';
    import { getRequestIP } from '@tanstack/react-start/server';

    import { signInInput, type SignInInput, type User } from '../auth/schemas';
    import { readAuthUser } from './config';
    import { verifyCredentials } from './password';
    import { signInAttempts } from './rate-limit';
    import { appSession } from './session';

    /**
     * The server functions for authentication. Each one is an HTTP endpoint that
     * anybody can call with any payload, so each one validates what it receives
     * and decides for itself; nothing here trusts that the page it was called
     * from checked anything first.
     */

    /** The signed-in user, or null. Called by the `_authed` route's `beforeLoad`. */
    export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
      async (): Promise<User | null> => {
        const session = await appSession();
        const username = session.data.username;
        if (username === undefined) return null;
        // The account can be rotated or removed by changing AUTH_USER; a session
        // for an account that no longer exists is not a session.
        const account = readAuthUser(process.env, import.meta.env.PROD);
        return username === account.username ? { username } : null;
      },
    );

    /**
     * The login form posts here directly, as a plain HTML form, so signing in
     * works before the page's JavaScript has loaded.
     */
    export const signIn = createServerFn({ method: 'POST' })
      .validator((input: unknown): SignInInput => {
        const fields = input instanceof FormData ? Object.fromEntries(input) : input;
        const parsed = signInInput.safeParse(fields);
        if (!parsed.success) {
          // A malformed request is the caller's fault: 400, not 500. A thrown
          // Response is returned as it is, to a form post and to an RPC call alike.
          throw new Response('Invalid sign-in request', { status: 400 });
        }
        return parsed.data;
      })
      .handler(async ({ data }) => {
        // Before the password check: scrypt costs this server as much as it costs
        // somebody guessing. The address is the socket's; X-Forwarded-For is only
        // trustworthy behind a proxy you control, so it is not read here.
        const limit = signInAttempts.hit(getRequestIP() ?? 'unknown');
        if (!limit.allowed) {
          throw new Response('Too many sign-in attempts', {
            status: 429,
            headers: { 'Retry-After': String(limit.retryAfterSeconds) },
          });
        }
        const account = readAuthUser(process.env, import.meta.env.PROD);
        if (!verifyCredentials(account, data.username, data.password)) {
          // One message for a wrong username and a wrong password alike.
          throw redirect({ to: '/login', search: { error: 'invalid', redirect: data.redirect } });
        }
        const session = await appSession();
        // A new session on every sign-in, so an identifier planted before it
        // (session fixation) does not become an authenticated one.
        await session.clear();
        await session.update({ username: account.username });
        throw redirect({ href: data.redirect ?? '/dashboard' });
      });

    export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
      const session = await appSession();
      await session.clear();
      throw redirect({ to: '/' });
    });
    ```

    Verify: `test -f src/server/auth.ts`

16. The CSRF middleware in front of every server function, written out so that removing it is a visible change. Create `src/start.ts` with:

    ```typescript
    import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

    /**
     * Server functions are same-origin RPC endpoints. This middleware refuses a
     * call whose Sec-Fetch-Site, Origin or Referer says it came from another
     * site, and one that carries none of the three. Start adds an equivalent by
     * default; it is written out here so that removing it is a visible change.
     */
    const csrf = createCsrfMiddleware({
      filter: (ctx) => ctx.handlerType === 'serverFn',
    });

    export const startInstance = createStart(() => ({
      requestMiddleware: [csrf],
    }));
    ```

    Verify: `test -f src/start.ts`

17. The server entry: configuration is checked when the server loads, so a misconfigured server refuses every request and says why in its log, and every rendered response carries the security headers. Create `src/server.ts` with:

    ```typescript
    import handler, { createServerEntry } from '@tanstack/react-start/server-entry';

    import { readAuthUser, readSessionSecret } from './server/config';

    /**
     * The server entry. Start uses this file instead of its default when it
     * exists. It adds two things to every response the application renders.
     *
     * First, the configuration is checked when the server loads, so a deployment
     * with a missing or development secret says so in its log and refuses every
     * request, instead of serving public pages and failing only at sign-in.
     *
     * Second, security headers. The policy forbids framing (the sign-in form cannot
     * be overlaid by another site), `<base>` and form targets elsewhere, and
     * plugins. It does not restrict scripts: that needs a nonce on every inline
     * script server rendering writes, and is left to the reader. HSTS belongs at
     * the proxy that terminates TLS.
     */
    function configurationProblem(): string | undefined {
      try {
        readSessionSecret(process.env, import.meta.env.PROD);
        readAuthUser(process.env, import.meta.env.PROD);
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    }

    const problem = configurationProblem();
    if (problem !== undefined) console.error(`Refusing to serve: ${problem}`);

    const SECURITY_HEADERS: Readonly<Record<string, string>> = {
      'Content-Security-Policy':
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    export default createServerEntry({
      async fetch(request, options) {
        if (problem !== undefined) return new Response('Service misconfigured', { status: 503 });
        const response = await handler.fetch(request, options);
        // A new Response, because a redirect's headers are immutable.
        const headers = new Headers(response.headers);
        for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      },
    });
    ```

    Verify: `test -f src/server.ts`

18. Example data, and the schemas for the search parameter and the path parameter that read it. Create `src/notes.ts` with:

    ```typescript
    import { z } from 'zod';

    /**
     * Example data, in memory, so the routes have something to page through.
     * Replace it with a server function that reads your store; the route files
     * then call that function from their loaders instead of these helpers.
     */
    export interface Note {
      readonly id: number;
      readonly title: string;
    }

    const NOTES: readonly Note[] = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      title: `Note ${String(index + 1)}`,
    }));

    export const PAGE_SIZE = 5;

    /** `?page=` on /notes. A missing or bad value means page 1, not an error page. */
    export const notesSearch = z.object({
      page: z.number().int().min(1).default(1).catch(1),
    });

    /** `$noteId` in /notes/$noteId: a positive integer, or the route does not match. */
    export const noteIdParam = z.coerce.number().int().positive();

    export function notesPage(page: number): { notes: readonly Note[]; pageCount: number } {
      const start = (page - 1) * PAGE_SIZE;
      return {
        notes: NOTES.slice(start, start + PAGE_SIZE),
        pageCount: Math.ceil(NOTES.length / PAGE_SIZE),
      };
    }

    export function findNote(id: number): Note | undefined {
      return NOTES.find((note) => note.id === id);
    }
    ```

    Verify: `test -f src/notes.ts`

19. The document shell, without the devtools. Replace `src/routes/__root.tsx` with:

    ```tsx
    import { createRootRoute, HeadContent, Link, Scripts } from '@tanstack/react-router';
    import type { ReactNode } from 'react';

    import appCss from '../styles.css?url';

    export const Route = createRootRoute({
      head: () => ({
        meta: [
          { charSet: 'utf-8' },
          { name: 'viewport', content: 'width=device-width, initial-scale=1' },
          { title: 'App' },
        ],
        links: [{ rel: 'stylesheet', href: appCss }],
      }),
      shellComponent: RootDocument,
      notFoundComponent: () => <p>Not found.</p>,
    });

    function RootDocument({ children }: { children: ReactNode }) {
      return (
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body className="mx-auto max-w-2xl p-8">
            <nav className="mb-8 flex gap-4 underline">
              <Link to="/">Home</Link>
              <Link to="/notes" search={{ page: 1 }}>
                Notes
              </Link>
              <Link to="/dashboard">Dashboard</Link>
            </nav>
            <main>{children}</main>
            <Scripts />
          </body>
        </html>
      );
    }
    ```

    Verify: `test -f src/routes/__root.tsx`

20. Replace `src/routes/index.tsx` with:

    ```tsx
    import { createFileRoute } from '@tanstack/react-router';

    export const Route = createFileRoute('/')({ component: Home });

    function Home() {
      return (
        <>
          <h1 className="text-2xl font-semibold">Home</h1>
          <p className="mt-4">
            Public. The notes are public too; the dashboard needs a signed-in user.
          </p>
        </>
      );
    }
    ```

    Verify: `test -f src/routes/index.tsx`

21. A plain HTML form that posts to the sign-in server function, so it works before the page's JavaScript loads. Create `src/routes/login.tsx` with:

    ```tsx
    import { createFileRoute } from '@tanstack/react-router';

    import { loginSearch } from '../auth/schemas';
    import { signIn } from '../server/auth';

    export const Route = createFileRoute('/login')({
      validateSearch: loginSearch,
      component: LoginPage,
    });

    function LoginPage() {
      const { redirect, error } = Route.useSearch();

      return (
        <>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          {error === 'invalid' && (
            <p role="alert" className="mt-4">
              Unknown username or wrong password.
            </p>
          )}
          {/* A plain form posting to the server function: it works before, and
              without, the page's JavaScript. */}
          <form
            method="post"
            action={signIn.url}
            encType="multipart/form-data"
            className="mt-4 flex flex-col gap-3"
          >
            <label className="flex flex-col">
              Username
              <input name="username" autoComplete="username" required className="border p-2" />
            </label>
            <label className="flex flex-col">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="border p-2"
              />
            </label>
            {redirect !== undefined && <input type="hidden" name="redirect" value={redirect} />}
            <button type="submit" className="border p-2">
              Sign in
            </button>
          </form>
        </>
      );
    }
    ```

    Verify: `test -f src/routes/login.tsx`

22. The guard: a pathless layout whose `beforeLoad` sends anybody without a session to `/login`. Create `src/routes/_authed.tsx` with:

    ```tsx
    import { createFileRoute } from '@tanstack/react-router';

    import { requireUser } from '../auth/guard';
    import { getCurrentUser } from '../server/auth';

    /**
     * A pathless layout: every route under `src/routes/_authed/` needs a signed-in
     * user, and gets it as `user` in its route context.
     */
    export const Route = createFileRoute('/_authed')({
      beforeLoad: async ({ location }) => requireUser(await getCurrentUser(), location.href),
    });
    ```

    Verify: `test -f src/routes/_authed.tsx`

23. Create `src/routes/_authed/dashboard.tsx` with:

    ```tsx
    import { createFileRoute } from '@tanstack/react-router';

    import { signOut } from '../../server/auth';

    export const Route = createFileRoute('/_authed/dashboard')({ component: Dashboard });

    function Dashboard() {
      const { user } = Route.useRouteContext();

      return (
        <>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-4">Signed in as {user.username}.</p>
          <form method="post" action={signOut.url} encType="multipart/form-data" className="mt-4">
            <button type="submit" className="border p-2">
              Sign out
            </button>
          </form>
        </>
      );
    }
    ```

    Verify: `test -f src/routes/_authed/dashboard.tsx`

24. A validated, typed search parameter. Create `src/routes/notes/index.tsx` with:

    ```tsx
    import { createFileRoute, Link } from '@tanstack/react-router';

    import { notesPage, notesSearch } from '../../notes';

    export const Route = createFileRoute('/notes/')({
      // `page` is a number by the time a component sees it. `?page=abc` becomes 1.
      validateSearch: notesSearch,
      loaderDeps: ({ search }) => ({ page: search.page }),
      loader: ({ deps }) => notesPage(deps.page),
      component: NotesPage,
    });

    function NotesPage() {
      const { page } = Route.useSearch();
      const { notes, pageCount } = Route.useLoaderData();

      return (
        <>
          <h1 className="text-2xl font-semibold">Notes</h1>
          <p className="mt-2">
            Page {page} of {pageCount}
          </p>
          <ul className="mt-4 space-y-2">
            {notes.map((note) => (
              <li key={note.id}>
                {/* `params` is checked against the $noteId route at compile time. */}
                <Link to="/notes/$noteId" params={{ noteId: note.id }} className="underline">
                  {note.title}
                </Link>
              </li>
            ))}
          </ul>
          <nav className="mt-4 flex gap-4">
            {page > 1 && (
              <Link to="/notes" search={{ page: page - 1 }}>
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link to="/notes" search={{ page: page + 1 }}>
                Next
              </Link>
            )}
          </nav>
        </>
      );
    }
    ```

    Verify: `test -f src/routes/notes/index.tsx`

25. A parsed, typed path parameter, where a segment that is not a number is a 404. Create `src/routes/notes/$noteId.tsx` with:

    ```tsx
    import { createFileRoute, notFound } from '@tanstack/react-router';

    import { findNote, noteIdParam } from '../../notes';

    export const Route = createFileRoute('/notes/$noteId')({
      // The URL segment is a string; everything after this sees a number. A
      // segment that is not one is a page that does not exist: 404, not 500.
      params: {
        parse: ({ noteId }) => {
          const parsed = noteIdParam.safeParse(noteId);
          if (!parsed.success) throw notFound();
          return { noteId: parsed.data };
        },
        stringify: ({ noteId }) => ({ noteId: String(noteId) }),
      },
      loader: ({ params }) => {
        const note = findNote(params.noteId);
        if (note === undefined) throw notFound();
        return note;
      },
      component: NotePage,
    });

    function NotePage() {
      const note = Route.useLoaderData();
      return <h1 className="text-2xl font-semibold">{note.title}</h1>;
    }
    ```

    Verify: `test -f 'src/routes/notes/$noteId.tsx'`

26. Create `vitest.config.ts` with:

    ```typescript
    import { defineConfig } from 'vitest/config';

    // Unit tests run in Node without the Start and Nitro plugins: they import the
    // route tree and the server modules directly. The built server is tested by
    // vitest.e2e.config.ts.
    export default defineConfig({
      test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        testTimeout: 20_000,
      },
    });
    ```

    Verify: `test -f vitest.config.ts`

27. Create `vitest.e2e.config.ts` with:

    ```typescript
    import { defineConfig } from 'vitest/config';

    // Requests against the production build in .output/, started by the tests
    // themselves on a port the operating system chooses. Run `npm run build` first.
    export default defineConfig({
      test: {
        environment: 'node',
        include: ['e2e/**/*.test.ts'],
        testTimeout: 30_000,
        hookTimeout: 60_000,
      },
    });
    ```

    Verify: `test -f vitest.e2e.config.ts`

28. Create `src/server/password.test.ts` with:

    ```typescript
    import { execFileSync, spawnSync } from 'node:child_process';

    import { describe, expect, it } from 'vitest';

    import { hashPassword, parseAuthUser, verifyCredentials } from './password';

    describe('verifyCredentials', () => {
      const account = parseAuthUser(hashPassword('alice', 'test-only-password-1'));

      it('accepts the right username and password', () => {
        expect(verifyCredentials(account, 'alice', 'test-only-password-1')).toBe(true);
      });

      it('refuses a wrong password', () => {
        expect(verifyCredentials(account, 'alice', 'test-only-password-2')).toBe(false);
      });

      it('refuses a wrong username with the right password', () => {
        expect(verifyCredentials(account, 'mallory', 'test-only-password-1')).toBe(false);
      });

      it('salts every hash, so the same password never hashes the same way twice', () => {
        expect(hashPassword('alice', 'same')).not.toBe(hashPassword('alice', 'same'));
      });
    });

    describe('scripts/hash-password.mjs', () => {
      it('prints a value this module accepts and verifies', () => {
        const output = execFileSync(process.execPath, ['scripts/hash-password.mjs', 'bob'], {
          input: 'test-only-password-3',
          encoding: 'utf8',
        });
        const account = parseAuthUser(output);
        expect(verifyCredentials(account, 'bob', 'test-only-password-3')).toBe(true);
      });

      it('refuses to run without a username', () => {
        const run = spawnSync(process.execPath, ['scripts/hash-password.mjs'], { input: 'x' });
        expect(run.status).toBe(2);
      });
    });
    ```

    Verify: `test -f src/server/password.test.ts`

29. Create `src/server/rate-limit.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { createRateLimiter } from './rate-limit';

    describe('createRateLimiter', () => {
      it('allows up to the limit in a window, then refuses with the time left', () => {
        const limiter = createRateLimiter(3, 60_000);
        const results = [1, 2, 3, 4].map(() => limiter.hit('client', 1_000));

        expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
        expect(results[3]?.retryAfterSeconds).toBe(60);
      });

      it('counts each key on its own', () => {
        const limiter = createRateLimiter(1, 60_000);
        expect(limiter.hit('a', 0).allowed).toBe(true);
        expect(limiter.hit('b', 0).allowed).toBe(true);
        expect(limiter.hit('a', 0).allowed).toBe(false);
      });

      it('starts a new window once the old one has passed', () => {
        const limiter = createRateLimiter(1, 60_000);
        expect(limiter.hit('client', 0).allowed).toBe(true);
        expect(limiter.hit('client', 59_999).allowed).toBe(false);
        expect(limiter.hit('client', 60_000).allowed).toBe(true);
      });
    });
    ```

    Verify: `test -f src/server/rate-limit.test.ts`

30. Create `src/server/config.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import {
      ConfigError,
      DEV_PASSWORD,
      DEV_SESSION_SECRET,
      DEV_USERNAME,
      readAuthUser,
      readSessionSecret,
    } from './config';
    import { hashPassword, verifyCredentials } from './password';

    const TEST_SECRET = 'test-only-session-secret-for-unit-tests';

    describe('readSessionSecret', () => {
      it('refuses a missing secret in production', () => {
        expect(() => readSessionSecret({}, true)).toThrow(ConfigError);
      });

      it('refuses the development placeholder in production', () => {
        expect(() => readSessionSecret({ SESSION_SECRET: DEV_SESSION_SECRET }, true)).toThrow(
          /development placeholder/,
        );
      });

      it('refuses a secret shorter than 32 characters, in any mode', () => {
        expect(() => readSessionSecret({ SESSION_SECRET: 'too-short' }, false)).toThrow(
          /at least 32/,
        );
      });

      it('falls back to the placeholder in development only', () => {
        expect(readSessionSecret({}, false)).toBe(DEV_SESSION_SECRET);
      });

      it('accepts a long secret in production', () => {
        expect(readSessionSecret({ SESSION_SECRET: TEST_SECRET }, true)).toBe(TEST_SECRET);
      });
    });

    describe('readAuthUser', () => {
      it('refuses a missing account in production', () => {
        expect(() => readAuthUser({}, true)).toThrow(/AUTH_USER is required/);
      });

      it('refuses the development account in production, whatever salt it was hashed with', () => {
        const rehashed = hashPassword(DEV_USERNAME, DEV_PASSWORD);
        expect(() => readAuthUser({ AUTH_USER: rehashed }, true)).toThrow(/development account/);
      });

      it('gives development a demo account that the published password opens', () => {
        const account = readAuthUser({}, false);
        expect(verifyCredentials(account, DEV_USERNAME, DEV_PASSWORD)).toBe(true);
      });

      it('accepts a real account in production', () => {
        const account = readAuthUser(
          { AUTH_USER: hashPassword('alice', 'test-only-password-1') },
          true,
        );
        expect(account.username).toBe('alice');
      });

      it('refuses a value that is not username:scrypt:salt:hash', () => {
        expect(() => readAuthUser({ AUTH_USER: 'alice:plaintext' }, false)).toThrow(/AUTH_USER/);
      });
    });
    ```

    Verify: `test -f src/server/config.test.ts`

31. Create `src/auth/schemas.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { noteIdParam, notesSearch } from '../notes';
    import { loginSearch, safeRedirect, signInInput } from './schemas';

    describe('safeRedirect', () => {
      it.each(['/dashboard', '/notes?page=2', '/'])('accepts the path %s', (path) => {
        expect(safeRedirect.safeParse(path).success).toBe(true);
      });

      it.each(['//example.com', '/\\example.com', 'https://example.com', 'dashboard', ''])(
        'refuses %s, which would leave this site',
        (target) => {
          expect(safeRedirect.safeParse(target).success).toBe(false);
        },
      );
    });

    describe('signInInput — the server function validator', () => {
      it('trims the username and keeps a safe redirect', () => {
        const parsed = signInInput.parse({
          username: ' alice ',
          password: 'p',
          redirect: '/dashboard',
        });
        expect(parsed).toEqual({ username: 'alice', password: 'p', redirect: '/dashboard' });
      });

      it('refuses a missing password', () => {
        expect(signInInput.safeParse({ username: 'alice' }).success).toBe(false);
      });

      it('refuses an open redirect', () => {
        const input = { username: 'alice', password: 'p', redirect: '//example.com' };
        expect(signInInput.safeParse(input).success).toBe(false);
      });
    });

    describe('search and path parameters', () => {
      it('drops a bad redirect on the sign-in page instead of failing', () => {
        expect(loginSearch.parse({ redirect: 'https://example.com' })).toEqual({});
      });

      it('reads ?page= as a number, and anything else as page 1', () => {
        expect(notesSearch.parse({ page: 3 })).toEqual({ page: 3 });
        expect(notesSearch.parse({ page: 'abc' })).toEqual({ page: 1 });
        expect(notesSearch.parse({ page: -2 })).toEqual({ page: 1 });
        expect(notesSearch.parse({})).toEqual({ page: 1 });
      });

      it('reads $noteId as a positive integer', () => {
        expect(noteIdParam.parse('7')).toBe(7);
        expect(noteIdParam.safeParse('abc').success).toBe(false);
        expect(noteIdParam.safeParse('0').success).toBe(false);
      });
    });
    ```

    Verify: `test -f src/auth/schemas.test.ts`

32. Create `src/auth/guard.test.ts` with:

    ```typescript
    import { createMemoryHistory, createRouter, isRedirect } from '@tanstack/react-router';
    import { beforeEach, describe, expect, it, vi } from 'vitest';

    // The real routes, with the session server function replaced: these tests are
    // about what the `_authed` guard does with its answer, not about cookies. The
    // cookie is tested against the built server in e2e/.
    const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
    vi.mock('../server/auth', () => ({
      getCurrentUser,
      signIn: { url: '/_serverFn/sign-in' },
      signOut: { url: '/_serverFn/sign-out' },
    }));

    const { Route: AuthedRoute } = await import('../routes/_authed');
    const { routeTree } = await import('../routeTree.gen');

    /** Runs the `_authed` route's own `beforeLoad` for a visit to `href`. */
    async function visit(href: string): Promise<unknown> {
      const beforeLoad = AuthedRoute.options.beforeLoad;
      if (beforeLoad === undefined) throw new Error('the _authed route has no beforeLoad guard');
      // Only `location` is read by the guard; the rest of the context is not needed.
      const context = { location: { href } } as unknown as Parameters<typeof beforeLoad>[0];
      try {
        return await beforeLoad(context);
      } catch (thrown) {
        return thrown;
      }
    }

    describe('the _authed guard', () => {
      beforeEach(() => {
        getCurrentUser.mockReset();
      });

      it('redirects an unauthenticated visitor to /login, remembering where they were going', async () => {
        getCurrentUser.mockResolvedValue(null);

        const result = await visit('/dashboard');

        expect(isRedirect(result)).toBe(true);
        expect(isRedirect(result) && result.options).toMatchObject({
          to: '/login',
          search: { redirect: '/dashboard' },
        });
      });

      it('lets a signed-in user through, and puts the user in the route context', async () => {
        getCurrentUser.mockResolvedValue({ username: 'alice' });

        const result = await visit('/dashboard');

        expect(isRedirect(result)).toBe(false);
        expect(result).toEqual({ user: { username: 'alice' } });
      });

      it('does not ask for a session on a public page', async () => {
        const router = createRouter({
          routeTree,
          history: createMemoryHistory({ initialEntries: ['/notes?page=2'] }),
        });

        await router.load();

        expect(getCurrentUser).not.toHaveBeenCalled();
        expect(router.state.location.search).toEqual({ page: 2 });
      });
    });
    ```

    Verify: `test -f src/auth/guard.test.ts`

33. Requests against the production build: the redirect, the sign-in, the cookie, CSRF, the rate limit, the headers, the refusals. Create `e2e/built-server.test.ts` with:

    ```typescript
    import { type ChildProcess, spawn } from 'node:child_process';
    import { randomBytes } from 'node:crypto';
    import { existsSync } from 'node:fs';
    import { createServer } from 'node:net';

    import { afterAll, beforeAll, describe, expect, it } from 'vitest';

    import { DEV_SESSION_SECRET } from '../src/server/config';
    import { hashPassword } from '../src/server/password';

    /**
     * Requests against the production build, the way a browser without
     * JavaScript would make them: the sign-in form posts to the server function's
     * URL, and the session is a cookie. Run `npm run build` first.
     */

    interface RunningServer {
      readonly origin: string;
      readonly output: () => string;
      readonly stop: () => Promise<void>;
    }

    /** A port the operating system says is free, so no fixed port can collide. */
    async function freePort(): Promise<number> {
      return new Promise((resolve, reject) => {
        const probe = createServer();
        probe.once('error', reject);
        probe.listen(0, '127.0.0.1', () => {
          const address = probe.address();
          probe.close(() => {
            if (address !== null && typeof address === 'object') resolve(address.port);
            else reject(new Error('no port'));
          });
        });
      });
    }

    async function startServer(env: Record<string, string>): Promise<RunningServer> {
      if (!existsSync('.output/server/index.mjs')) throw new Error('run npm run build first');
      const port = await freePort();
      const origin = `http://127.0.0.1:${String(port)}`;
      let output = '';
      const child: ChildProcess = spawn(process.execPath, ['.output/server/index.mjs'], {
        env: { PATH: process.env['PATH'] ?? '', ...env, HOST: '127.0.0.1', PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
      child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));

      const stop = () =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null) return resolve();
          child.once('exit', () => resolve());
          child.kill();
        });

      for (let attempt = 0; attempt < 100; attempt += 1) {
        try {
          await fetch(`${origin}/`);
          return { origin, output: () => output, stop };
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      await stop();
      throw new Error(`the built server did not start:\n${output}`);
    }

    /** The form's action attribute: the server function's URL, read from the page. */
    async function signInAction(origin: string): Promise<string> {
      const html = await (await fetch(`${origin}/login`)).text();
      const action = /<form[^>]*action="([^"]+)"/.exec(html)?.[1];
      if (action === undefined) throw new Error('no form on /login');
      return action;
    }

    function form(fields: Record<string, string>): FormData {
      const body = new FormData();
      for (const [name, value] of Object.entries(fields)) body.set(name, value);
      return body;
    }

    /** `name=value` of the session cookie, or undefined when none was set. */
    function sessionCookie(response: Response): string | undefined {
      const cookie = response.headers.getSetCookie().find((c) => c.startsWith('app-session='));
      return cookie?.split(';')[0];
    }

    describe('the production build, configured', () => {
      const username = 'e2e';
      const password = randomBytes(18).toString('base64url');
      let server: RunningServer;

      beforeAll(async () => {
        server = await startServer({
          SESSION_SECRET: randomBytes(32).toString('base64url'),
          AUTH_USER: hashPassword(username, password),
        });
      });

      afterAll(async () => {
        await server.stop();
      });

      const post = (action: string, fields: Record<string, string>, from?: string) =>
        fetch(`${server.origin}${action}`, {
          method: 'POST',
          body: form(fields),
          redirect: 'manual',
          headers: { origin: from ?? server.origin },
        });

      it('serves the home page with the language declared', async () => {
        const response = await fetch(`${server.origin}/`);
        expect(response.status).toBe(200);
        expect(await response.text()).toContain('<html lang="en"');
      });

      it('forbids framing the sign-in page, and sends the other security headers', async () => {
        const response = await fetch(`${server.origin}/login`);
        expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
        expect(response.headers.get('x-content-type-options')).toBe('nosniff');
        expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      });

      it('redirects an unauthenticated request for /dashboard to /login', async () => {
        const response = await fetch(`${server.origin}/dashboard`, { redirect: 'manual' });
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('/login?redirect=%2Fdashboard');
      });

      it('refuses a wrong password without setting a session', async () => {
        const action = await signInAction(server.origin);
        const response = await post(action, { username, password: 'wrong' });
        expect(response.status).toBeGreaterThanOrEqual(300);
        expect(response.status).toBeLessThan(400);
        expect(response.headers.get('location')).toContain('/login?error=invalid');
        expect(sessionCookie(response)).toBeUndefined();
      });

      it('refuses a malformed sign-in with 400', async () => {
        const action = await signInAction(server.origin);
        const response = await post(action, { username });
        expect(response.status).toBe(400);
      });

      it('refuses an open redirect after sign-in with 400', async () => {
        const action = await signInAction(server.origin);
        const response = await post(action, { username, password, redirect: '//example.com' });
        expect(response.status).toBe(400);
        expect(sessionCookie(response)).toBeUndefined();
      });

      it('refuses a sign-in posted from another site (CSRF) with 403', async () => {
        const action = await signInAction(server.origin);
        const response = await post(action, { username, password }, 'https://example.com');
        expect(response.status).toBe(403);
        expect(sessionCookie(response)).toBeUndefined();
      });

      it('signs in, sets an HttpOnly session cookie, and opens /dashboard with it', async () => {
        const action = await signInAction(server.origin);
        const response = await post(action, { username, password, redirect: '/dashboard' });
        expect(response.headers.get('location')).toBe('/dashboard');

        const setCookie = response.headers.getSetCookie().join('\n');
        expect(setCookie).toMatch(/HttpOnly/i);
        expect(setCookie).toMatch(/SameSite=Lax/i);
        expect(setCookie).toMatch(/Secure/i);

        const cookie = sessionCookie(response);
        expect(cookie).toBeDefined();
        const dashboard = await fetch(`${server.origin}/dashboard`, {
          headers: { cookie: cookie ?? '' },
          redirect: 'manual',
        });
        expect(dashboard.status).toBe(200);
        expect(await dashboard.text()).toContain('Signed in as <!-- -->e2e');
      });

      it('treats a tampered session cookie as no session', async () => {
        const dashboard = await fetch(`${server.origin}/dashboard`, {
          headers: { cookie: 'app-session=Fe26.2**tampered' },
          redirect: 'manual',
        });
        expect(dashboard.status).toBe(307);
      });

      it('validates search and path parameters', async () => {
        const bad = await fetch(`${server.origin}/notes?page=abc`, { redirect: 'manual' });
        expect(bad.status).toBe(307);
        expect(bad.headers.get('location')).toBe('/notes?page=1');

        expect((await fetch(`${server.origin}/notes/3`)).status).toBe(200);
        expect((await fetch(`${server.origin}/notes/abc`)).status).toBe(404);
        expect((await fetch(`${server.origin}/notes/99`)).status).toBe(404);
      });
    });

    describe('the production build, under a password-guessing attack', () => {
      let server: RunningServer;

      beforeAll(async () => {
        server = await startServer({
          SESSION_SECRET: randomBytes(32).toString('base64url'),
          AUTH_USER: hashPassword('e2e', randomBytes(18).toString('base64url')),
        });
      });

      afterAll(async () => {
        await server.stop();
      });

      it('answers the eleventh sign-in attempt in fifteen minutes with 429', async () => {
        const action = await signInAction(server.origin);
        const attempt = () =>
          fetch(`${server.origin}${action}`, {
            method: 'POST',
            body: form({ username: 'e2e', password: 'guess' }),
            redirect: 'manual',
            headers: { origin: server.origin },
          });

        for (let guess = 1; guess <= 10; guess += 1) {
          expect((await attempt()).headers.get('location')).toContain('/login?error=invalid');
        }
        const refused = await attempt();
        expect(refused.status).toBe(429);
        expect(Number(refused.headers.get('retry-after'))).toBeGreaterThan(0);
      });
    });

    describe('the production build, misconfigured', () => {
      it('refuses every request when given the development session secret, and logs why', async () => {
        const server = await startServer({
          SESSION_SECRET: DEV_SESSION_SECRET,
          AUTH_USER: hashPassword('e2e', randomBytes(18).toString('base64url')),
        });
        try {
          expect((await fetch(server.origin)).status).toBe(503);
          expect(server.output()).toContain(
            'Refusing to serve: SESSION_SECRET is the development placeholder',
          );
        } finally {
          await server.stop();
        }
      });

      it('refuses every request when no account is configured, and logs why', async () => {
        const server = await startServer({ SESSION_SECRET: randomBytes(32).toString('base64url') });
        try {
          expect((await fetch(server.origin)).status).toBe(503);
          expect(server.output()).toContain(
            'Refusing to serve: AUTH_USER is required in production',
          );
        } finally {
          await server.stop();
        }
      });
    });
    ```

    Verify: `test -f e2e/built-server.test.ts`

34. Replace `.gitignore` with:

    ```text
    node_modules/
    .output/
    .nitro/
    .tanstack/
    dist/
    .env
    .env.*
    *.local
    server.log
    server.pid
    server.url
    session-secret.txt
    auth-user.txt
    ```

    Verify: `test -f .gitignore`

35. Actions pinned by commit SHA, read-only permissions, and no credentials left in the checkout. Create `.github/workflows/ci.yml` with:

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
        env:
          TANSTACK_CLI_TELEMETRY_DISABLED: '1'
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: npm ci --no-audit --no-fund
          # The build regenerates src/routeTree.gen.ts, which the type check and
          # the unit tests import, and writes the server the e2e tests start.
          - run: npm run build
          - run: npm run typecheck
          - run: npm test
          - run: npm run test:e2e
    ```

    Verify: `test -f .github/workflows/ci.yml`

36. Replace `README.md` with:

    ```markdown
    # app

    A TanStack Start application: file-based routes with typed params and
    validated search params, server functions for everything that needs the
    server, and one account behind a sealed session cookie.

    ## Commands

    - `npm run dev` — development server on port 3000. Uses a published
      development secret and the account `demo` / `demo-password-not-for-production`.
    - `npm run build` — production build in `.output/`. Also regenerates
      `src/routeTree.gen.ts`; commit it.
    - `npm start` — the built server. Reads `PORT` and `HOST`.
    - `npm run typecheck`, `npm test` — type check and unit tests.
    - `npm run test:e2e` — starts the built server and makes real requests to it.

    ## Configuration

    The production build refuses to serve without both of these, and refuses the
    development values:

    - `SESSION_SECRET` — at least 32 characters. Generate one with
      `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
    - `AUTH_USER` — the account, as `username:scrypt:<salt>:<hash>`. Generate it
      with `printf '%s' "$PASSWORD" | npm run --silent hash-password -- <username>`.

    Keep both in your host's secret store, not in a file in this repository.
    ```

    Verify: `test -f README.md`

37. Build for production. This also regenerates `src/routeTree.gen.ts`, which the type check and the unit tests import and which is committed: `npm run build`
    Verify: `test -f .output/server/index.mjs && grep -q "/_authed/dashboard" src/routeTree.gen.ts`

38. Type-check the application, the tests and the configs: `npm run typecheck`
    Verify: `npm run typecheck`

39. Run the unit tests: the configuration refusals, password hashing and the script that must agree with it, the rate limiter, the input schemas, and the route guard: `npm test`
    Verify: `npm test`

40. Confirm nothing from the server reached the browser bundle — no scrypt, no secret name, no development secret — and that no source map was shipped: `! grep -rqE "scrypt|SESSION_SECRET|dev-only-session-secret" .output/public`
    Verify: `test -z "$(find .output -name '*.map')"`

41. Run the end-to-end tests. They start the built server themselves, on ports the operating system chooses, and prove the redirect, a sign-in that sets a sealed HttpOnly cookie, the 400s, the CSRF 403, the 429 after ten guesses, the security headers, and that a server given the development secret refuses to serve: `npm run test:e2e`
    Verify: `npm run test:e2e`

42. Generate a throwaway session secret for the check below: `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))" > session-secret.txt`
    Verify: `test "$(wc -c < session-secret.txt)" -ge 32`

43. Hash a throwaway account for the same check, through the project's own script: `printf '%s' 'recipe-check-only-password' | npm run --silent hash-password -- check > auth-user.txt`
    Verify: `grep -q "^check:scrypt:" auth-user.txt`

44. Start the built server on a port the operating system chooses, and keep its process id. A fixed port can already be taken, and then the check either fails or answers from somebody else's server: `SESSION_SECRET="$(cat session-secret.txt)" AUTH_USER="$(cat auth-user.txt)" HOST=127.0.0.1 PORT=0 node .output/server/index.mjs > server.log 2>&1 & echo $! > server.pid`
    Verify: `test -s server.pid`

45. Read the address it chose out of its own log: `for attempt in $(seq 60); do grep -oE "http://127\.0\.0\.1:[0-9]+" server.log | head -1 > server.url && test -s server.url && break; sleep 1; done`
    Verify: `test -s server.url`

46. Request the home page from the built server: `curl -fsS -o home.html "$(cat server.url)/"`
    Verify: `grep -q '<html lang="en"' home.html`

47. Request the protected page with no session, and keep the status and the redirect: `curl -sS -o /dev/null -w "%{http_code} %{redirect_url}" "$(cat server.url)/dashboard" > dashboard.txt`
    Verify: `grep -qE "^307 .*/login\?redirect=%2Fdashboard$" dashboard.txt`

48. Stop the server: `kill "$(cat server.pid)"`
    Verify: `sleep 2; ! kill -0 "$(cat server.pid)" 2>/dev/null`

49. Delete the throwaway secret, account and check output: `rm session-secret.txt auth-user.txt server.log server.pid server.url home.html dashboard.txt`
    Verify: `test ! -e session-secret.txt && test ! -e auth-user.txt`
