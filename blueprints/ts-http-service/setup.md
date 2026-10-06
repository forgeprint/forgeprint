# Setup

Creates an HTTP service in TypeScript on Hono or Express (`options.framework`),
with bearer token verification, tests that prove an unauthenticated request is
refused, a container and CI.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22 or newer and Docker.

<!-- if options.framework == hono -->

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

<!-- endif -->

<!-- if options.framework == express -->

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
       "express": "5.2.1",
       "jose": "6.2.12"
     },
     "devDependencies": {
       "typescript": "7.0.2",
       "@types/express": "5.0.6",
       "@types/node": "26.6.2"
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
   Verify: `npm ls --depth=0`

4. Create `src/body.ts` with:

   ```typescript
   /**
    * Reading a JSON body, for routes that accept one.
    *
    * This exists because six agents asked to add a resource to this service
    * each wrote their own version of it, and an independent review of one of
    * those found two defects worth making impossible here instead
    * (docs/research/2026-10-06-scenario-d.md):
    *
    * - a boolean field that accepted `null`, because the check was written as
    *   a coercion rather than as a type test;
    * - an error response that echoed the caller's unknown field name back,
    *   which turns a validator into a reflector.
    *
    * So: every value is type-tested, and no message contains anything the
    * caller sent. The messages name what this route accepts, which is not
    * user input.
    */

   /** 16 KiB. Large enough for a form, small enough that nothing queues. */
   const MAX_BODY_BYTES = 16 * 1024;

   export type Field = { kind: 'string'; min: number; max: number } | { kind: 'boolean' };

   export type Shape = Record<string, { field: Field; required: boolean }>;

   export interface Refusal {
     readonly status: 400 | 413 | 415;
     readonly error: string;
   }

   export type Read<T> = { ok: true; value: T } | { ok: false; refusal: Refusal };

   function accepts(shape: Shape): string {
     // The accepted names, which came from this file rather than from the
     // request. Listing the *rejected* name is the mistake this avoids.
     return Object.keys(shape).sort().join(', ');
   }

   function check(field: Field, value: unknown): boolean {
     if (field.kind === 'boolean') {
       // `typeof` and nothing else. `Boolean(value)`, `value ?? false` and
       // `!!value` all accept null, and one of them shipped.
       return typeof value === 'boolean';
     }
     if (typeof value !== 'string') return false;
     const trimmed = value.trim();
     return trimmed.length >= field.min && trimmed.length <= field.max;
   }

   /**
    * Parse and validate a body against a shape. `text` is the raw body, so the
    * size limit is applied before anything is parsed.
    */
   export function readBody<T>(text: string, contentType: string | null, shape: Shape): Read<T> {
     if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
       return { ok: false, refusal: { status: 413, error: 'the body is too large' } };
     }
     if (contentType === null || !contentType.toLowerCase().startsWith('application/json')) {
       return { ok: false, refusal: { status: 415, error: 'the body must be application/json' } };
     }

     let parsed: unknown;
     try {
       parsed = JSON.parse(text);
     } catch {
       return { ok: false, refusal: { status: 400, error: 'the body is not valid JSON' } };
     }
     if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
       return { ok: false, refusal: { status: 400, error: 'the body must be a JSON object' } };
     }

     const body = parsed as Record<string, unknown>;
     for (const key of Object.keys(body)) {
       if (!(key in shape)) {
         return {
           ok: false,
           refusal: { status: 400, error: `this route accepts only: ${accepts(shape)}` },
         };
       }
     }
     for (const [key, { field, required }] of Object.entries(shape)) {
       if (!(key in body)) {
         if (required) {
           return { ok: false, refusal: { status: 400, error: `${key} is required` } };
         }
         continue;
       }
       if (!check(field, body[key])) {
         return { ok: false, refusal: { status: 400, error: `${key} is not acceptable` } };
       }
     }
     return { ok: true, value: body as T };
   }
   ```

   Verify: `test -f src/body.ts`

<!-- if options.framework == hono -->

5. Create `src/auth.ts` with:

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

6. Create `src/app.ts` with:

   ```typescript
   import { Hono } from 'hono';

   import { requireBearer, type AuthSettings, type Env } from './auth.js';
   import { readBody } from './body.js';

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

     // A route that accepts a body validates it in one place, so the rules are
     // read rather than remembered. Nothing is stored: this service has no
     // database, and a create route that pretends otherwise misleads whoever
     // builds on it.
     protectedRoutes.post('/items', async (c) => {
       const read = readBody<{ name: string; done?: boolean }>(
         await c.req.text(),
         c.req.header('content-type') ?? null,
         {
           name: { field: { kind: 'string', min: 1, max: 200 }, required: true },
           done: { field: { kind: 'boolean' }, required: false },
         },
       );
       if (!read.ok) return c.json({ error: read.refusal.error }, read.refusal.status);
       return c.json({ item: { name: read.value.name, done: read.value.done ?? false } }, 201);
     });

     app.route('/', protectedRoutes);

     return app;
   }
   ```

   Verify: `test -f src/app.ts`

7. Create `src/app.test.ts` with:

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

     // The two defects an independent review found in agent-written validation,
     // turned into tests here so the next reader inherits the answer rather than
     // the question (docs/research/2026-10-06-scenario-d.md).
     describe('a body is validated in one place', () => {
       const create = async (body: string, contentType = 'application/json') => {
         const res = await createApp(settings).request('/items', {
           method: 'POST',
           headers: {
             authorization: `Bearer ${await token(settings.secret)}`,
             'content-type': contentType,
           },
           body,
         });
         return { status: res.status, text: await res.text() };
       };

       it('accepts a valid body and defaults done to false', async () => {
         const res = await create(JSON.stringify({ name: 'a name' }));
         assert.equal(res.status, 201);
         assert.deepEqual(JSON.parse(res.text), { item: { name: 'a name', done: false } });
       });

       // `Boolean(value)`, `value ?? false` and `!!value` all accept null. Only a
       // `typeof` test refuses it, and one of those three shipped once.
       it('refuses a boolean field that is null', async () => {
         assert.equal((await create(JSON.stringify({ name: 'a name', done: null }))).status, 400);
       });

       // An error that repeats the caller's field name has turned a validator
       // into a reflector. The message names what the route accepts instead.
       it('refuses an unknown field without repeating it back', async () => {
         const res = await create(JSON.stringify({ name: 'a name', sneaky: 1 }));
         assert.equal(res.status, 400);
         assert.doesNotMatch(res.text, /sneaky/);
       });

       it('refuses a body that is not valid JSON', async () => {
         assert.equal((await create('{')).status, 400);
       });

       it('refuses a body that is not a JSON object', async () => {
         assert.equal((await create('"a string"')).status, 400);
         assert.equal((await create('[]')).status, 400);
       });

       it('refuses a body that is not application/json', async () => {
         assert.equal((await create(JSON.stringify({ name: 'a name' }), 'text/plain')).status, 415);
       });

       // The size is checked before the parse, so this answers 413 rather than
       // the 400 the over-long name would otherwise earn.
       it('refuses a body over the size limit', async () => {
         assert.equal((await create(JSON.stringify({ name: 'x'.repeat(17 * 1024) }))).status, 413);
       });
     });
   });
   ```

   Verify: `test -f src/app.test.ts`

8. Create `src/main.ts` with:

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

<!-- endif -->

<!-- if options.framework == express -->

5. Create `src/auth.ts` with:

   ```typescript
   import { jwtVerify, type JWTPayload } from 'jose';
   import type { NextFunction, Request, Response } from 'express';

   /**
    * What this middleware leaves in `res.locals`, so a handler that reads
    * `res.locals.claims` is typed rather than `any`. Express types `locals` as
    * an open record unless it is told otherwise.
    */
   export type Locals = { claims: JWTPayload };

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
    *
    * Async is safe here without a wrapper: Express 5 passes a rejected promise
    * to the error handler, where Express 4 left the request hanging.
    */
   export function requireBearer(settings: AuthSettings) {
     return async (req: Request, res: Response<unknown, Locals>, next: NextFunction) => {
       const header = req.get('authorization') ?? '';
       const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
       if (raw === '') {
         // 401, not 403: "who are you", not "you may not".
         res.status(401).json({ error: 'a bearer token is required' });
         return;
       }

       try {
         const { payload } = await jwtVerify(raw, settings.secret, {
           algorithms: ['HS256'],
           audience: settings.audience,
           issuer: settings.issuer,
           requiredClaims: ['exp', 'sub'],
         });
         res.locals.claims = payload;
       } catch {
         // Which check failed is useful to an attacker and to nobody else.
         res.status(401).json({ error: 'the token was not accepted' });
         return;
       }

       next();
     };
   }
   ```

   Verify: `test -f src/auth.ts`

6. Create `src/app.ts` with:

   ```typescript
   import express, { type ErrorRequestHandler, type Express, type Response } from 'express';

   import { requireBearer, type AuthSettings, type Locals } from './auth.js';
   import { readBody } from './body.js';

   /**
    * The last handler. Without it Express answers an error with its own page,
    * which includes the stack trace unless NODE_ENV is `production` — and the
    * node image does not set it. The detail goes to the log, not the caller.
    */
   export const hideErrors: ErrorRequestHandler = (error, _req, res, _next) => {
     console.error(error);
     res.status(500).json({ error: 'internal error' });
   };

   /**
    * A constructor rather than a module-level app: a test builds a fresh one
    * with its own settings, and the entry point builds one from the
    * environment.
    */
   export function createApp(settings: AuthSettings): Express {
     const app = express();
     // Announcing the framework and its version helps nobody who is meant to be
     // calling this service.
     app.disable('x-powered-by');

     // Liveness touches nothing: no token, no dependency. It answers whether
     // the process is up, which is the only thing an orchestrator is asking,
     // and it has to keep answering when something downstream is down.
     app.get('/health', (_req, res) => {
       res.json({ status: 'ok' });
     });

     // Everything else is mounted behind the middleware, so a new route is
     // authenticated by where it is declared rather than by remembering.
     const protectedRoutes = express.Router();
     protectedRoutes.use(requireBearer(settings));
     protectedRoutes.get('/items', (_req, res: Response<unknown, Locals>) => {
       res.json({ items: [], subject: res.locals.claims.sub ?? null });
     });

     // The raw body, as text: the size and the content type are decided in
     // body.ts rather than by a parser that answers for itself. The limit here
     // is deliberately above body.ts's, so our own 413 is the one that answers.
     protectedRoutes.use(express.text({ type: '*/*', limit: '1mb' }));

     // A route that accepts a body validates it in one place, so the rules are
     // read rather than remembered. Nothing is stored: this service has no
     // database, and a create route that pretends otherwise misleads whoever
     // builds on it.
     protectedRoutes.post('/items', (req, res: Response<unknown, Locals>) => {
       const read = readBody<{ name: string; done?: boolean }>(
         typeof req.body === 'string' ? req.body : '',
         req.header('content-type') ?? null,
         {
           name: { field: { kind: 'string', min: 1, max: 200 }, required: true },
           done: { field: { kind: 'boolean' }, required: false },
         },
       );
       if (!read.ok) {
         res.status(read.refusal.status).json({ error: read.refusal.error });
         return;
       }
       res.status(201).json({ item: { name: read.value.name, done: read.value.done ?? false } });
     });

     app.use(protectedRoutes);
     app.use(hideErrors);

     return app;
   }
   ```

   Verify: `test -f src/app.ts`

7. Create `src/app.test.ts` with:

   ```typescript
   import assert from 'node:assert/strict';
   import type { AddressInfo } from 'node:net';
   import { after, before, describe, it } from 'node:test';

   import express, { type Express } from 'express';
   import { SignJWT } from 'jose';

   import { createApp, hideErrors } from './app.js';
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

   // An Express app is a Node request listener, not a fetch handler, so it is
   // served on a port the operating system picks, on loopback only, and called
   // with the fetch built into Node. No test client library is needed.
   async function serve(app: Express): Promise<{ url: string; close: () => Promise<void> }> {
     const server = app.listen(0, '127.0.0.1');
     await new Promise<void>((resolve, reject) => {
       server.once('listening', resolve);
       server.once('error', reject);
     });
     const { port } = server.address() as AddressInfo;
     return {
       url: `http://127.0.0.1:${port}`,
       close: () => new Promise<void>((resolve) => server.close(() => resolve())),
     };
   }

   /** The routes an app declares, found by walking its router and every router mounted on it. */
   type Layer = { route?: { path: string; stack: { method: string }[] }; handle: unknown };
   function routesOf(stack: readonly Layer[]): { method: string; path: string }[] {
     return stack.flatMap((layer) => {
       if (layer.route !== undefined) {
         const { path } = layer.route;
         const methods = new Set(layer.route.stack.map((l) => l.method.toUpperCase()));
         return [...methods].map((method) => ({ method, path }));
       }
       const nested = (layer.handle as { stack?: Layer[] }).stack;
       return nested === undefined ? [] : routesOf(nested);
     });
   }

   describe('routes', () => {
     let server: { url: string; close: () => Promise<void> };
     before(async () => {
       server = await serve(createApp(settings));
     });
     after(() => server.close());

     const call = (path: string, init: RequestInit = {}): Promise<Response> =>
       fetch(`${server.url}${path}`, init);
     const bearer = (value: string): RequestInit => ({
       headers: { authorization: `Bearer ${value}` },
     });

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
       assert.equal((await call('/items', bearer(forged))).status, 401);
     });

     it('a protected route accepts a valid token', async () => {
       assert.equal((await call('/items', bearer(await token(settings.secret)))).status, 200);
     });

     it('does not announce the framework', async () => {
       assert.equal((await call('/health')).headers.get('x-powered-by'), null);
     });

     // A route is authenticated by where it is declared, and nothing stops
     // somebody declaring one on `app` above the protected router. Express keeps
     // its routes in `app.router.stack`, so the convention can be a check rather
     // than a habit.
     it('every route outside the allow-list needs a token', async () => {
       const publicRoutes = new Set(['GET /health']);
       const routes = routesOf(createApp(settings).router.stack);

       let checked = 0;
       for (const route of routes) {
         const name = `${route.method} ${route.path}`;
         if (publicRoutes.has(name)) continue;

         const response = await call(route.path, { method: route.method });
         assert.equal(response.status, 401, `${name} answered without a token`);
         checked += 1;
       }

       // A walk that finds only the public routes asserts nothing, which is
       // the way this kind of test fails silently — for example the day the
       // shape of a mounted router changes and the walk stops descending.
       assert.ok(checked > 0, 'no protected route was found in the route table');
     });
   });

   describe('errors', () => {
     it('a failing handler answers 500 without its detail', async () => {
       const app = express();
       app.get('/fails', () => {
         throw new Error('detail-that-must-not-leak');
       });
       app.use(hideErrors);
       const server = await serve(app);
       const original = console.error;
       console.error = () => {};
       try {
         const response = await fetch(`${server.url}/fails`);
         assert.equal(response.status, 500);
         assert.doesNotMatch(await response.text(), /detail-that-must-not-leak/);
       } finally {
         console.error = original;
         await server.close();
       }
     });

     // The two defects an independent review found in agent-written validation,
     // turned into tests here so the next reader inherits the answer rather than
     // the question (docs/research/2026-10-06-scenario-d.md).
     describe('a body is validated in one place', () => {
       // The body has to be read before the server closes, so this returns the
       // text rather than the response.
       const create = async (body: string, contentType = 'application/json') => {
         const { url, close } = await serve(createApp(settings));
         try {
           const res = await fetch(`${url}/items`, {
             method: 'POST',
             headers: {
               authorization: `Bearer ${await token(settings.secret)}`,
               'content-type': contentType,
             },
             body,
           });
           return { status: res.status, text: await res.text() };
         } finally {
           await close();
         }
       };

       it('accepts a valid body and defaults done to false', async () => {
         const res = await create(JSON.stringify({ name: 'a name' }));
         assert.equal(res.status, 201);
         assert.deepEqual(JSON.parse(res.text), { item: { name: 'a name', done: false } });
       });

       // `Boolean(value)`, `value ?? false` and `!!value` all accept null. Only a
       // `typeof` test refuses it, and one of those three shipped once.
       it('refuses a boolean field that is null', async () => {
         assert.equal((await create(JSON.stringify({ name: 'a name', done: null }))).status, 400);
       });

       // An error that repeats the caller's field name has turned a validator
       // into a reflector. The message names what the route accepts instead.
       it('refuses an unknown field without repeating it back', async () => {
         const res = await create(JSON.stringify({ name: 'a name', sneaky: 1 }));
         assert.equal(res.status, 400);
         assert.doesNotMatch(res.text, /sneaky/);
       });

       it('refuses a body that is not valid JSON', async () => {
         assert.equal((await create('{')).status, 400);
       });

       it('refuses a body that is not a JSON object', async () => {
         assert.equal((await create('"a string"')).status, 400);
         assert.equal((await create('[]')).status, 400);
       });

       it('refuses a body that is not application/json', async () => {
         assert.equal((await create(JSON.stringify({ name: 'a name' }), 'text/plain')).status, 415);
       });

       // The size is checked before the parse, so this answers 413 rather than
       // the 400 the over-long name would otherwise earn.
       it('refuses a body over the size limit', async () => {
         assert.equal((await create(JSON.stringify({ name: 'x'.repeat(17 * 1024) }))).status, 413);
       });
     });
   });
   ```

   Verify: `test -f src/app.test.ts`

8. Create `src/main.ts` with:

   ```typescript
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
   // Express 5 hands a failed listen to the callback instead of throwing it, so
   // a port that is already taken has to be rethrown here or the process runs on
   // having bound nothing.
   app.listen(port, '0.0.0.0', (error) => {
     if (error !== undefined) throw error;
     console.log(`listening on ${port}`);
   });
   ```

   Verify: `test -f src/main.ts`

<!-- endif -->

9. Create `.gitignore` with:

   ```text
   node_modules/
   dist/
   *.tsbuildinfo
   ```

   Verify: `test -f .gitignore`

10. Create `Dockerfile` with:

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

11. Create `.dockerignore` with:

    ```text
    node_modules
    dist
    .git
    *.test.ts
    ```

    Verify: `test -f .dockerignore`

12. Create `.github/workflows/ci.yml` with:

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

13. Create `README.md` with:

    ```markdown
    # service

    An HTTP service in TypeScript with bearer token verification.

    ## Run it

    It refuses to start without `JWT_SECRET`, `JWT_AUDIENCE` and `JWT_ISSUER`.
    That is deliberate: see `AGENTS.md`.

    ## Add a route

    On `protectedRoutes`, not on `app`, so it is authenticated by where it is
    declared. `/health` is the one exception and the reason is beside it.
    ```

    Verify: `test -f README.md`

14. Build it: `npm run build`
    Verify: `test -f dist/main.js`

15. Run the tests: `npm test`
    Verify: `npm test`

16. Build the container image: `docker build -t ts-http-service:dev .`
    Verify: `docker image inspect ts-http-service:dev > /dev/null`

17. Remove a check container left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force ts-service-check > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps -aq --filter name=ts-service-check)"`

18. Start the container. It takes its configuration from the environment and refuses to start without it, so all three are supplied here: `docker run -d --name ts-service-check -e JWT_SECRET="local-development-only-not-a-real-secret" -e JWT_AUDIENCE="service" -e JWT_ISSUER="service" -p 127.0.0.1::8080 ts-http-service:dev`
    Verify: `test -n "$(docker ps -q --filter name=ts-service-check)"`

19. Read the port the operating system chose: `docker port ts-service-check 8080 | head -1 > service.url`
    Verify: `test -s service.url`

20. Confirm the service answers, which proves the image runs as the non-root user: `curl -fsS --retry 30 --retry-all-errors --retry-delay 1 -o health.json "http://$(cat service.url)/health"`
    Verify: `grep -q '"status":"ok"' health.json`

21. Confirm a protected route refuses a request with no token. This is the step that proves the middleware is mounted, and it fails loudly the day somebody declares a route on the wrong app: `curl -sS -o refused.json -w "%{http_code}" "http://$(cat service.url)/items" > refused.code`
    Verify: `grep -q '^401$' refused.code`

22. Stop the check container: `docker rm --force ts-service-check`
    Verify: `test -z "$(docker ps -q --filter name=ts-service-check)"`
