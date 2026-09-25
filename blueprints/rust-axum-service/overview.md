# Rust Axum Service

An HTTP service in Rust on axum and tokio, with Postgres through sqlx,
migrations embedded in the binary, JWT bearer authentication that denies by
default, data scoped to the caller, and integration tests against a real
Postgres.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real service on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- **axum 0.8.9 on tokio 1.53**, with `app(state)` in a library crate so the
  tests drive the router the binary serves.
- **Postgres through sqlx 0.9.0**, a pool with an acquire timeout, and
  migrations embedded with `sqlx::migrate!` and applied at startup under
  Postgres's advisory lock. No `sqlx-cli` to install.
- **Runtime-checked queries**, `query_as` with `FromRow`. Not the compile-time
  `query!` macros: those need a live database or a committed `.sqlx`
  directory at build time. The integration tests are what catch a wrong
  query, which is why they run against Postgres and fail without it.
- **JWT bearer authentication** with jsonwebtoken 11.1.0: HS256 only, issuer,
  audience and expiry checked, and `exp`, `iss`, `aud` and `sub` required. A
  middleware over the whole router refuses every path that is not on an
  explicit public list, including paths that match no route.
- **Notes owned by the token's subject.** Every query filters on it; another
  caller's note is a 404, and a test proves one caller cannot read another's.
- **RFC 9457 problem documents for every error**, including the ones no
  handler writes: unknown route, wrong method, oversized body, timeout.
- **A 16 KiB body limit and a 10 second request timeout** from tower-http
  0.7.1, and a **5 second header-read timeout** on hyper's HTTP/1 server, all
  tested. `axum::serve` sets no header timeout, so the accept loop is written
  out in `src/server.rs`.
- **`/health` and `/ready`.** Liveness touches nothing; readiness asks the
  database, with a deadline, and answers 503 when it cannot.
- **Configuration from the environment**, validated before anything listens:
  a missing variable or a signing secret under 32 bytes stops the process.
  Startup waits up to 30 seconds for the database, then refuses to start.
- **Graceful shutdown on SIGTERM** and Ctrl+C, with an 8 second drain
  deadline, proved by the recipe: `docker stop` ends with exit code 0, not the
  137 of a process that ignored the signal.
- **JSON logs** through tracing, one object per line, with a line per request
  that carries method, path, status and latency and no headers.
- **A multi-stage Dockerfile**: `rust:1.98.1-slim-trixie` to build, the
  distroless `cc-debian13` image pinned by digest to run, as a non-root user.
- **CI**: fmt, clippy with warnings as errors, the tests against a Postgres
  service container, the image build, and an MSRV job on Rust 1.94. Actions
  pinned by commit SHA, with a build cache keyed on `Cargo.lock`.

## Options

None. The database is Postgres, and the token is an HS256 JWT.

## What it fits

- A service that owns its data in Postgres and sits behind an identity
  provider that issues tokens with a shared secret.
- A team that wants the compiler to hold the line on the things that go wrong
  quietly elsewhere: an unhandled error is a type error, and a request type
  that accepts an unknown field has to say so.
- A small, fast container. The runtime image is glibc and the binary.
- An internal service in a cluster, where a gateway handles TLS and rate
  limiting and an orchestrator sends SIGTERM and polls readiness.

## What it is NOT for

- **Issuing tokens.** No login, no refresh, no password storage. It verifies.
- **Asymmetric tokens or key rotation.** HS256 with one shared secret. A
  third-party issuer with JWKS, or two keys during a rotation, is a different
  verifier.
- **Rate limiting.** Nothing bounds how often a caller can hit a route (OWASP
  API4:2023). The body limit and the timeout bound one request, not many.
- **TLS to the database.** sqlx is built without a TLS backend, to keep the
  compile small. A managed Postgres that requires TLS needs the
  `tls-rustls-ring-webpki` feature and `sslmode=require` in the URL.
- **Roles or permissions.** A caller is a subject and owns rows. Anything
  finer than "yours or not" is not here.
- **Multi-tenancy.** Use `dotnet-multitenant-saas-api` for tenant isolation as
  a first-class concern.
- **CORS, metrics, traces.** No browser is expected to call it directly; logs
  are the only telemetry.
- **Compile-time-checked SQL.** Say so if you want it: it means `sqlx-cli`
  and a committed `.sqlx` directory, and a CI step that keeps it current.

## Trade-offs made on your behalf

- **Deny by default, by path.** axum does not expose its route table, so the
  Go blueprint's walk-every-route test is not available. Instead the
  middleware wraps the router and lets through only `PUBLIC_PATHS`. The cost:
  an anonymous request to a path that does not exist gets 401, not 404.
- **Runtime queries.** Chosen so a build needs no database and no generated
  files. The price is that a column typo is a test failure, not a compile
  error.
- **Migrations at startup.** One binary, nothing to run beforehand, and
  Postgres's advisory lock stops two replicas applying them at once. A
  migration that takes minutes delays startup by minutes; long migrations
  belong in a job of their own.
- **`BIGINT` identity ids.** Sequential and guessable. Guessing one gets a 404
  because every read is scoped to the owner, which is the control that matters
  — but the ids still leak how many notes exist.
- **jsonwebtoken with `rust_crypto`** rather than `aws_lc_rs`, so the build
  needs no C toolchain beyond the linker. It compiles the RSA and elliptic
  curve code it does not use; only HS256 is accepted. That RSA code is the
  `rsa` crate, which carries RUSTSEC-2023-0071, and CI runs no advisory scan:
  add `cargo audit` or `cargo deny` before adding RS256.
- **HTTP/1 only, and hyper's server directly.** `axum::serve` would be ten
  lines shorter and has no header-read timeout; the loop in `src/server.rs`
  is the price of one. HTTP/2 is left to the proxy in front.
- **No `rust-toolchain.toml`.** It would make rustup download a toolchain in
  the middle of the recipe. `rust-version` in `Cargo.toml` and the CI MSRV job
  hold the floor instead.
- **Exact pins with `=`**, and `Cargo.lock` committed.

## Cost of adoption

Rust 1.94 or newer with rustfmt and clippy, Docker and curl. The recipe
compiles the dependencies twice — once for the tests, once for the release
image — which is a few minutes on a laptop; CI caches the first.

## How it differs from `go-http-service`

The same idea — a small container that verifies bearer tokens — taken further:

- **A database.** Postgres, a pool, embedded migrations, a readiness check
  that uses it. `go-http-service` has no store at all.
- **Object-level authorization.** Rows owned by the token's subject, with a
  test for the cross-caller read. `go-http-service` has one route that returns
  an empty list.
- **Deny by default for every path**, not a protected group. Gin exposes its
  routes, so the Go blueprint tests the group; axum does not, so this one puts
  the check in front of routing.
- **Problem documents, a body limit, a request timeout, graceful shutdown and
  structured logs**, none of which `go-http-service` sets up.

Pick by language if both fit; pick this one if the service owns data.

## Compared with the other APIs here

- **`fastapi-service`** — Python, on Postgres or SQLite. Faster to change,
  slower and larger to run.
- **`dotnet-web-api`** — C# with EF Core and the framework's fallback
  authorization policy, which is the same deny-by-default idea built in.
- **`ts-http-service`** — TypeScript on Node, for a team that already ships
  JavaScript.
