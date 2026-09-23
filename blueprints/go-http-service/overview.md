# Go HTTP Service

An HTTP service in Go on Gin with bearer token verification, a distroless
container, and tests that prove an unauthenticated request is refused.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real service on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- A service that has to ship as one small container. The image is a distroless
  base and a static binary: no shell, no package manager, nothing in it that is
  not the program.
- A team that already writes Go, or one that wants an API whose deployment
  artefact is a few megabytes rather than a runtime plus an application.
- Anything behind an existing identity provider. It verifies tokens; it does
  not issue them, which is usually the right split.
- An internal service in a cluster, where the gateway handles rate limiting and
  TLS and this handles the request.

## What it is NOT for

- **A database-backed application.** There is no store, no migrations, no
  connection pool. `/items` returns an empty list because it exists to prove
  the authentication group is wired.
- **Issuing tokens.** No login, no refresh, no password storage. A service that
  verifies and a service that issues are usually two services.
- **Rate limiting.** Nothing bounds how often a caller can hit a route
  (OWASP API4:2023). Behind a gateway that does it, this is fine; exposed
  directly, it is a gap.
- **CORS.** No browser is expected to call this directly.
- **Observability.** One log line at startup, and Gin's recovery middleware.
  No metrics, no traces, no structured logging.
- **Graceful shutdown.** The process stops when it is stopped. In a cluster
  that drains connections first this is usually fine, and it is still a
  simplification.

## Pros

- **The unauthenticated request is proved refused, twice.** A test asserts
  `/items` is 401 without a token, and the setup asserts the same thing against
  the running container. Either one alone could pass for the wrong reason;
  together they cover both the routing and the deployed image.
- **A forged token is tested.** A token signed with a different secret must be
  refused — the test that fails the day verification is reduced to decoding.
- **Every `jwt.Parse` option is deliberate**, and each is explained where it
  sits: valid methods, audience, issuer, expiry required. Any of them removed
  leaves code that still looks correct.
- **Authentication is a property of where a route is declared**, not of the
  author remembering. New routes go in the group; `/health` is the documented
  exception.
- **It refuses to start without its configuration.** Not per request — at
  startup, so a missing variable is a container that does not come up rather
  than one that answers 500 to everything while `/health` still says 200.
- **The container is distroless and non-root**, with `CGO_ENABLED=0` and
  `-trimpath`, and the recipe runs it and talks to it rather than trusting the
  build.
- **`go.sum` gives hash-level dependency verification** on every later build,
  which is stronger than the version pinning most of this catalog relies on.
- **The Go floor and the builder image are checked against each other** by a
  step, because `go get` can raise the floor and the mismatch otherwise
  surfaces as a confusing Docker failure.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **HMAC, not asymmetric.** The service holds the same secret that signs the
  tokens. For an internal service behind one issuer that is normal; the moment
  a third party issues tokens you want RS256 or JWKS, and that is a different
  setup.
- **No store means the interesting decisions are still ahead of you.** Pooling,
  migrations, transaction boundaries and where the tenant filter lives are the
  parts that get services wrong, and none of them are here.
- **Gin is a choice.** `net/http` with the routing added in 1.22 covers a lot
  of this without a dependency. Gin earns its place with middleware ordering
  and binding, not with routing.
- **The module path is a placeholder** and renaming it later touches every
  import.
- **Go 1.25 is a recent floor**, and it is set by gin rather than by this
  blueprint.

## Compared with the alternatives here

- **`fastapi-service`** — the same shape in Python: bearer verification, a
  container, one protected route. Pick by language; the designs agree.
- **`dotnet-web-api`** — the same again in C#, and it goes further: it uses the
  framework's fallback authorization policy so that a route which declares
  nothing is still refused. Gin has no equivalent, which is why this blueprint
  leans on the group and says so twice.
- **`dotnet-multitenant-saas-api`** — if the data is per tenant, start there
  instead. Retrofitting tenancy is the expensive path.
