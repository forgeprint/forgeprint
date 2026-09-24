# Setup

Creates an HTTP service in TypeScript on Hono, with bearer token verification,
tests that prove an unauthenticated request is refused, a container and CI.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22 or newer and Docker.

1. Create `package.json` with:

   ```json
   {
     "name": "service",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "scripts": {
       "build": "tsc --build",
       "start": "node dist/main.js",
       "test": "node --test dist/*.test.js"
     },
     "dependencies": {
       "hono": "4.13.8",
       "@hono/node-server": "2.1.1",
       "jose": "6.2.12"
     },
     "devDependencies": {
       "typescript": "7.0.2",
       "@types/node": "26.6.2"
     }
   }
   ```

   Verify: `test -f package.json`

2. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "es2023",
       "module": "nodenext",
       "moduleResolution": "nodenext",
       "outDir": "dist",
       "rootDir": "src",
       "strict": true,
       "exactOptionalPropertyTypes": true,
       "noUncheckedIndexedAccess": true,
       "types": ["node"]
     },
     "include": ["src"]
   }
   ```

   Verify: `test -f tsconfig.json`

3. Install the pinned dependencies: `npm install --no-audit --no-fund`
   Verify: `node -e "await import('hono')"`

4. Create `src/auth.ts` with:

   ```typescript
   import { jwtVerify, type JWTPayload } from 'jose';
   import type { MiddlewareHandler } from 'hono';

   /**
    * The context this middleware adds to, so `c.get('claims')` is typed
    * rather than `any`. Without it, Hono's context has no idea the variable
    * exists and every read of it is a cast.
    */
   export type Env = { Variables: { claims: JWTPayload } };

   export interface AuthSettings {
     readonly secret: Uint8Array;
     readonly audience: string;
     readonly issuer: string;
   }

   /**
    * The only place that decides who a caller is.
    *
    * Every option passed to jwtVerify is load bearing. `algorithms` stops a
    * token signed the wrong way from being accepted — without it, algorithm
    * confusion is live. `audience` stops a token minted for a different
    * service working here. `requiredClaims` stops a token with no `exp` being
    * valid forever.
    */
   export function requireBearer(settings: AuthSettings): MiddlewareHandler<Env> {
     return async (c, next) => {
       const header = c.req.header('authorization') ?? '';
       const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
       if (raw === '') {
         // 401, not 403: "who are you", not "you may not".
         return c.json({ error: 'a bearer token is required' }, 401);
       }

       try {
         const { payload } = await jwtVerify(raw, settings.secret, {
           algorithms: ['HS256'],
           audience: settings.audience,
           issuer: settings.issuer,
           requiredClaims: ['exp', 'sub'],
         });
         c.set('claims', payload);
       } catch {
         // Which check failed is useful to an attacker and to nobody else.
         return c.json({ error: 'the token was not accepted' }, 401);
       }

       await next();
     };
   }
   ```

   Verify: `test -f src/auth.ts`

5. Create `src/app.ts` with:

   ```typescript
   import { Hono } from 'hono';

   import { requireBearer, type AuthSettings, type Env } from './auth.js';

   /**
    * A constructor rather than a module-level app: a test builds a fresh one
    * with its own settings, and the entry point builds one from the
    * environment.
    */
   export function createApp(settings: AuthSettings): Hono<Env> {
     const app = new Hono<Env>();

     // Liveness touches nothing: no token, no dependency. It answers whether
     // the process is up, which is the only thing an orchestrator is asking,
     // and it has to keep answering when something downstream is down.
     app.get('/health', (c) => c.json({ status: 'ok' }));

     // Everything else is mounted behind the middleware, so a new route is
     // authenticated by where it is declared rather than by remembering.
     const protectedRoutes = new Hono<Env>();
     protectedRoutes.use('*', requireBearer(settings));
     protectedRoutes.get('/items', (c) =>
       c.json({ items: [], subject: c.get('claims').sub ?? null }),
     );

     app.route('/', protectedRoutes);

     return app;
   }
   ```

   Verify: `test -f src/app.ts`

6. Create `src/app.test.ts` with:

   ```typescript
   import assert from 'node:assert/strict';
   import { describe, it } from 'node:test';

   import { SignJWT } from 'jose';

   import { createApp } from './app.js';
   import type { AuthSettings } from './auth.js';

   const settings: AuthSettings = {
     secret: new TextEncoder().encode('not-a-real-secret-only-for-tests-0000'),
     audience: 'service-tests',
     issuer: 'service-tests',
   };

   async function token(secret: Uint8Array): Promise<string> {
     return new SignJWT({ sub: 'user-1' })
       .setProtectedHeader({ alg: 'HS256' })
       .setAudience(settings.audience)
       .setIssuer(settings.issuer)
       .setExpirationTime('1h')
       .sign(secret);
   }

   // Hono apps are fetch handlers, so a request goes through the real router
   // and the real middleware with no server and no port.
   // `async`, because Hono's request() is typed as Response | Promise<Response>
   // and an async arrow normalises it. Without it the annotation below is a
   // type error that the tests themselves would never have caught.
   const call = async (path: string, bearer?: string): Promise<Response> =>
     createApp(settings).request(
       path,
       bearer === undefined ? {} : { headers: { authorization: `Bearer ${bearer}` } },
     );

   describe('routes', () => {
     it('health needs no token', async () => {
       assert.equal((await call('/health')).status, 200);
     });

     it('a protected route refuses a request with no token', async () => {
       assert.equal((await call('/items')).status, 401);
     });

     it('a protected route refuses a forged token', async () => {
       // The test that fails the day verification is reduced to decoding.
       const forged = await token(
         new TextEncoder().encode('a-different-secret-entirely-000000000'),
       );
       assert.equal((await call('/items', forged)).status, 401);
     });

     it('a protected route accepts a valid token', async () => {
       assert.equal((await call('/items', await token(settings.secret))).status, 200);
     });

     // A route is authenticated by where it is declared, and nothing stops
     // somebody declaring one on `app` instead of on `protectedRoutes`. Hono
     // exposes its route table, so the convention can be a check rather than a
     // habit. Middleware registrations come back as `ALL` and are not routes.
     it('every route outside the allow-list needs a token', async () => {
       const publicRoutes = new Set(['GET /health']);
       const routes = createApp(settings).routes.filter((r) => r.method !== 'ALL');

       // A loop over an empty list passes without asserting anything, which is
       // the way this kind of test fails silently.
       assert.ok(routes.length > 0, 'the route table is empty');

       for (const route of routes) {
         const name = `${route.method} ${route.path}`;
         if (publicRoutes.has(name)) continue;

         const response = await createApp(settings).request(route.path, {
           method: route.method,
         });
         assert.equal(response.status, 401, `${name} answered without a token`);
       }
     });
   });
   ```

   Verify: `test -f src/app.test.ts`

7. Create `src/main.ts` with:

   ```typescript
   import { serve } from '@hono/node-server';

   import { createApp } from './app.js';

   function required(name: string): string {
     const value = process.env[name];
     if (value === undefined || value === '') {
       throw new Error(`${name} is required`);
     }
     return value;
   }

   // Read at module scope, so a missing variable stops the process before
   // anything listens. Checked per request instead, the service answers 500 to
   // everything while /health still returns 200 and an orchestrator calls the
   // container ready.
   const app = createApp({
     secret: new TextEncoder().encode(required('JWT_SECRET')),
     audience: required('JWT_AUDIENCE'),
     issuer: required('JWT_ISSUER'),
   });

   const port = Number(process.env.PORT ?? '8080');
   serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
     console.log(`listening on ${info.port}`);
   });
   ```

   Verify: `test -f src/main.ts`

8. Create `.gitignore` with:

   ```text
   node_modules/
   dist/
   *.tsbuildinfo
   ```

   Verify: `test -f .gitignore`

9. Create `Dockerfile` with:

   ```dockerfile
   FROM node:22-alpine AS build
   WORKDIR /src
   # Dependencies first, so a source change does not reinstall them.
   COPY package.json package-lock.json* ./
   RUN npm install --no-audit --no-fund
   COPY . .
   # Build, then drop the development dependencies from the tree that gets
   # copied forward — TypeScript has no business in a running image.
   RUN npm run build && npm prune --omit=dev

   FROM node:22-alpine
   WORKDIR /app
   COPY --from=build /src/node_modules ./node_modules
   COPY --from=build /src/dist ./dist
   COPY --from=build /src/package.json ./package.json
   # The node image ships a non-root user. Using it is one line and skipping
   # it is the most common container finding there is.
   USER node
   EXPOSE 8080
   CMD ["node", "dist/main.js"]
   ```

   Verify: `test -f Dockerfile`

10. Create `.dockerignore` with:

    ```text
    node_modules
    dist
    .git
    *.test.ts
    ```

    Verify: `test -f .dockerignore`

11. Create `.github/workflows/ci.yml` with:

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
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-node@2028fbc5c25fe9cf00d9f06a71cc4710d4507903 # v5.0.0
            with:
              node-version: '22'
          - run: npm install --no-audit --no-fund
          - run: npm run build
          - run: npm test
    ```

    Verify: `test -f .github/workflows/ci.yml`

12. Create `README.md` with:

    ```markdown
    # service

    An HTTP service on Hono with bearer token verification.

    ## Run it

    It refuses to start without `JWT_SECRET`, `JWT_AUDIENCE` and `JWT_ISSUER`.
    That is deliberate: see `AGENTS.md`.

    ## Add a route

    On `protectedRoutes`, not on `app`, so it is authenticated by where it is
    declared. `/health` is the one exception and the reason is beside it.
    ```

    Verify: `test -f README.md`

13. Build it: `npm run build`
    Verify: `test -f dist/main.js`

14. Run the tests: `npm test`
    Verify: `npm test`

15. Build the container image: `docker build -t ts-http-service:dev .`
    Verify: `docker image inspect ts-http-service:dev > /dev/null`

16. Remove a check container left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force ts-service-check > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps -aq --filter name=ts-service-check)"`

17. Start the container. It takes its configuration from the environment and refuses to start without it, so all three are supplied here: `docker run -d --name ts-service-check -e JWT_SECRET="local-development-only-not-a-real-secret" -e JWT_AUDIENCE="service" -e JWT_ISSUER="service" -p 127.0.0.1::8080 ts-http-service:dev`
    Verify: `test -n "$(docker ps -q --filter name=ts-service-check)"`

18. Read the port the operating system chose: `docker port ts-service-check 8080 | head -1 > service.url`
    Verify: `test -s service.url`

19. Confirm the service answers, which proves the image runs as the non-root user: `curl -fsS --retry 30 --retry-all-errors --retry-delay 1 -o health.json "http://$(cat service.url)/health"`
    Verify: `grep -q '"status":"ok"' health.json`

20. Confirm a protected route refuses a request with no token. This is the step that proves the middleware is mounted, and it fails loudly the day somebody declares a route on the wrong app: `curl -sS -o refused.json -w "%{http_code}" "http://$(cat service.url)/items" > refused.code`
    Verify: `grep -q '^401$' refused.code`

21. Stop the check container: `docker rm --force ts-service-check`
    Verify: `test -z "$(docker ps -q --filter name=ts-service-check)"`
