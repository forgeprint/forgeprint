# TypeScript HTTP Service

An HTTP service in TypeScript on Hono or Express 5 with bearer token
verification, a container, and tests that prove an unauthenticated request is
refused.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real service on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- A TypeScript team that wants an API without the framework being the largest
  thing in the repository.
- A service that may later run somewhere other than Node. Hono is built on the
  web `Request`/`Response` types, so the same app runs on Workers, Deno and Bun
  with a different adapter — this one uses `@hono/node-server`.
- Anything behind an existing identity provider: it verifies tokens and does
  not issue them, which is usually the right split.
- A service whose tests have to be fast. A Hono app is a fetch handler, so the
  whole router is exercised without a port.
- A team whose middleware, hiring and habits already assume Express. Choose
  `framework: express` and keep them; the design and the checks are the same.

## Options

- **`framework: hono`** (default) — Hono 4 on `@hono/node-server`. Tests call
  the fetch handler directly, with no port. Runs on other runtimes with a
  different adapter.
- **`framework: express`** — Express 5. The same routes, the same middleware
  placement, the same route-table test, in Express's idioms: a `Router` for the
  protected routes and a typed `res.locals` for the claims. Tests start the app
  on a loopback port. Adds a terminal error handler, because Express's default
  one prints the stack trace outside `NODE_ENV=production`, and turns off
  `x-powered-by`. Node only.

Everything outside the four source files and `package.json` — the container,
CI, the README and the checks against the running image — is the same step for
both.

## What it is NOT for

- **A database-backed application.** No store, no migrations, no pool.
  `/items` returns an empty list because it exists to prove the middleware is
  mounted.
- **Issuing tokens.** No login, no refresh, no password storage.
- **Rate limiting.** Nothing bounds how often a caller can hit a route
  (OWASP API4:2023). Behind a gateway that does it, fine; exposed directly, a
  gap.
- **CORS.** No browser is expected to call this directly.
- **Observability.** One log line at startup. No metrics, no traces, no
  structured logging.
- **Graceful shutdown.** The process stops when it is stopped.

## Pros

- **The unauthenticated request is proved refused, twice** — once through the
  fetch handler and once against the running container. Either alone could pass
  for the wrong reason.
- **A forged token is tested.** A token signed with a different secret must be
  refused: the test that fails the day verification is reduced to decoding.
- **Every `jwtVerify` option is deliberate and explained** where it sits:
  algorithms, audience, issuer, required claims. Any one removed leaves code
  that still looks correct.
- **The tests need no server.** `app.request(...)` goes through the real router
  and the real middleware, so they run in milliseconds and still cover the
  thing that breaks.
- **The context is typed.** `Env = { Variables: { claims: JWTPayload } }` means
  `c.get('claims')` is checked rather than `any` — a small thing that decides
  whether the type checker is any use in the handlers.
- **It refuses to start without its configuration**, at module scope, not per
  request.
- **The image drops development dependencies** with `npm prune --omit=dev` and
  runs as the `node` user, and the recipe runs the image rather than trusting
  the build.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **HMAC, not asymmetric.** The service holds the secret that signs the tokens.
  Normal for one internal issuer; wrong the moment a third party issues them,
  and the change to JWKS is not a one-line edit.
- **No lockfile is committed by the recipe.** `npm install` resolves
  transitive dependencies at build time, and the Dockerfile copies
  `package-lock.json` only if one exists. Direct dependencies are pinned
  exactly; the rest is the trade-off the whole catalog carries.
- **The image is `node:22-alpine`, not distroless.** It ships a shell and a
  package manager. `go-http-service` does better here, and the difference is
  the runtime rather than the blueprint.
- **No store means the interesting decisions are still ahead of you** —
  pooling, migrations, transaction boundaries, where a tenant filter lives.
- **Hono is young next to Express.** It is 46M downloads a week and climbing,
  and Express is still 101M. That is what the `express` option is for.
- **On Express, route placement is also order.** A route declared on `app`
  above the protected router is public. The route-table test catches it, but
  only for routers mounted at `/` — it reads route paths, not mount paths.
- **Express tests need a port.** A loopback one the operating system picks, so
  they cannot collide, but they are slower than Hono's and exercise a listener
  the Hono tests do not.

## Compared with the alternatives here

- **`go-http-service`** — the same design in Go, and stricter where it counts:
  a distroless image with no shell, and hash-level dependency verification.
- **`fastapi-service`** — the same again in Python.
- **`dotnet-web-api`** — the same, and the only one of the four that can make
  authentication a framework-level default rather than a placement convention.
- **`ts-mcp-server`** — also TypeScript, but for something a model calls rather
  than something a client requests.
