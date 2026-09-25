# TypeScript HTTP Service — agent context

An HTTP service in TypeScript with bearer token verification, on Hono or on
Express 5 (`options.framework`). Read this before adding a route.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/auth.ts       the only place that decides who a caller is
src/app.ts        createApp(settings): the routes, and nothing else
src/main.ts       configuration and the listener
src/app.test.ts   the router, driven through fetch
```

The shape and the rules are the same on either framework. Where they differ:

|                     | Hono                                                      | Express                                                             |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| Protected routes    | a sub-app, `protectedRoutes.use('*', requireBearer(...))` | an `express.Router()`, `protectedRoutes.use(requireBearer(...))`    |
| The caller's claims | `c.get('claims')`, typed by `Env`                         | `res.locals.claims`, typed by `Locals`                              |
| Tests               | `app.request(...)`, no port                               | the app on a loopback port the OS picks, called with Node's `fetch` |
| Route-table check   | `app.routes`                                              | `app.router.stack`, walking mounted routers                         |
| Errors              | Hono's default: a bare 500                                | `hideErrors`, the last handler: a JSON 500, detail to the log       |
| Framework header    | none sent                                                 | `x-powered-by` turned off                                           |

## Rules that are not style preferences

**A new route goes on `protectedRoutes`, not on `app`.** The middleware is
mounted on the sub-application, so authentication is a property of where a
route is declared rather than of the author remembering. `/health` is the one
exception and the reason is in the comment beside it. A route added to `app` is
public and nothing will tell you.

**One module decides who the caller is.** `src/auth.ts` reads the header and
verifies the token; nothing else does either.

**Every option passed to `jwtVerify` is load bearing.** `algorithms: ['HS256']`
stops a token signed the wrong way being accepted — without it, algorithm
confusion is live. `audience` stops a token minted for another service working
here. `requiredClaims: ['exp', 'sub']` stops a token with no expiry being valid
forever. Each one removed leaves code that still looks correct.

**401, not 403.** "Who are you" and "you may not" are different answers, and a
client that can refresh a token needs to tell them apart.

**The rejection reason does not reach the caller.** Which check failed helps an
attacker and nobody else.

**Configuration is read at module scope in `main.ts`**, so a missing variable
stops the process before anything listens. Checked inside a handler instead,
the service answers 500 to everything while `/health` still returns 200 and an
orchestrator calls the container ready.

**`createApp` is a constructor.** A module-level app cannot be given different
settings, and every test would share one.

### Express only

**In Express, order is placement.** A route declared on `app` above
`app.use(protectedRoutes)` is public. One declared below it happens to be
refused, because the router's middleware answers every request that reaches
it — do not rely on that; declare it on `protectedRoutes`.

**`hideErrors` stays the last `app.use`.** Express's own error page includes
the stack trace unless `NODE_ENV` is `production`, and nothing here sets it.

**Mount routers at `/`.** The route-table test reads each route's path, not
the path a router is mounted under, so a router mounted at `/v1` is checked
against the wrong URLs. Mounting elsewhere means extending the test first.

**Async middleware needs no wrapper.** Express 5 passes a rejected promise to
the error handler; Express 4 did not, and advice written for it will tell you
to wrap every handler.

## Testing

On Hono, the app is a fetch handler: `app.request('/items', { headers })` goes
through the real router and the real middleware with no port and no listener.
Do not reach for a running server unless you are testing the server.

On Express, the app is a Node request listener, so the tests start it on a
loopback port the operating system picks and call it with Node's own `fetch`.
No test client library: Node already does this, and the port is never fixed,
so two runs cannot collide.

## What this does not do

No database, no migrations, no rate limiting, no CORS, no structured logging,
no token issuance, no graceful shutdown. `/items` returns an empty list because
it exists to prove the middleware is mounted.

Rate limiting in particular is absent and worth knowing: nothing bounds how
often a caller can hit a route (OWASP API4:2023). Behind a gateway that does
it, fine; exposed directly, a gap.
