# Go HTTP Service — agent context

An HTTP service on Gin with bearer token verification. Read this before adding
a route.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
internal/auth/auth.go     the only place that decides who a caller is
internal/api/api.go       New(settings): the routes, and nothing else
internal/api/api_test.go  the router, driven through httptest
main.go                   configuration, the listener, the exit code
```

## Rules that are not style preferences

**A new route goes inside the protected group.** `router.Group("/",
auth.RequireBearer(...))` is what makes authentication a property of where a
route is declared rather than of the author remembering. `/health` is the one
exception and the reason is in the comment beside it. A route declared on
`router` instead of `protected` is public, and nothing will tell you.

**One module decides who the caller is.** `internal/auth` reads the
`Authorization` header and validates the token; nothing else does either. A
second definition of "authenticated" is how a service ends up with two, and one
of them wrong.

**Every `jwt.Parse` option is load bearing.** `WithValidMethods` stops a token
signed the wrong way from being accepted — without it, algorithm confusion is
live. `WithAudience` stops a token minted for another service working here.
`WithExpirationRequired` stops a token with no `exp` being valid forever.
Removing any one of them leaves the code looking correct.

**401, not 403.** "Who are you" and "you may not" are different answers, and a
client that retries after refreshing a token needs to be able to tell them
apart.

**The rejection reason does not go to the caller.** Which check failed is
useful to an attacker and to nobody else. Log it if you need it.

**Configuration is read before anything listens.** `main` reads the
environment and calls `log.Fatalf` if a value is missing. Checked per request
instead, the service answers 500 to everything while `/health` still returns
200 and an orchestrator calls the container ready — which is worse than not
starting.

**`New` is a constructor.** A package-level engine shares state between tests
and cannot be given different settings.

## The go directive is set by your dependencies

`go mod init` writes whatever toolchain you happen to have installed, and
`go get` raises the floor when a dependency demands it — gin 1.12 requires
1.25. The builder image in the Dockerfile has to satisfy that floor, and step
13 of the setup checks the two still agree, because otherwise the mismatch
surfaces as a failed Docker build with an error that reads like a network
problem.

## What this does not do

No database, no migrations, no rate limiting, no CORS, no observability beyond
the standard log line, no token issuance, no graceful shutdown. `/items`
returns an empty list because it exists to prove the group is wired, not to
show a data layer.

Rate limiting in particular is absent and worth knowing about: nothing here
bounds how often a caller can hit a route (OWASP API4:2023). Behind a gateway
that does it, this is fine; exposed directly, it is not.
