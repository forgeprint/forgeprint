# TypeScript HTTP Service — agent context

An HTTP service on Hono with bearer token verification. Read this before adding
a route.

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

## Testing without a server

A Hono app is a fetch handler: `app.request('/items', { headers })` goes
through the real router and the real middleware with no port and no listener.
That is why the tests here are ordinary function calls and still cover routing.
Do not reach for a running server unless you are testing the server.

## What this does not do

No database, no migrations, no rate limiting, no CORS, no structured logging,
no token issuance, no graceful shutdown. `/items` returns an empty list because
it exists to prove the middleware is mounted.

Rate limiting in particular is absent and worth knowing: nothing bounds how
often a caller can hit a route (OWASP API4:2023). Behind a gateway that does
it, fine; exposed directly, a gap.
