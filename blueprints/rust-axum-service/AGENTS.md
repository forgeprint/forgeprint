# Rust Axum Service — agent context

An HTTP service on axum 0.8 and tokio, with Postgres through sqlx 0.9 and JWT
bearer authentication. Read this before adding a route, a query or a
migration.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/config.rs        the only place that reads an environment variable
src/auth.rs          the only place that reads Authorization; PUBLIC_PATHS
src/problem.rs       Problem (RFC 9457) and the middleware that enforces it
src/notes.rs         handlers and their queries, each scoped to the caller
src/server.rs        the accept loop: header-read timeout, drain deadline
src/lib.rs           AppState, the router, its layers, /health and /ready
src/main.rs          startup, the database wait, migrations, the exit code
migrations/          NNNN_description.sql, embedded by sqlx::migrate!
build.rs             reruns the build when a migration file changes
tests/api.rs         the router, driven with tower's oneshot, against Postgres
```

The crate is a library plus a thin binary so that `tests/api.rs` drives the
same `app(state)` that `main.rs` serves. Keep `main.rs` to startup and
shutdown; anything a test needs to reach belongs in the library.

## Rules that are not style preferences

**Every path needs a token unless it is in `PUBLIC_PATHS`.** `require_bearer`
is layered over the whole router and checks the request path against that
list, so a new route is protected without anyone remembering, and a path that
matches no route answers 401 rather than 404 to an anonymous caller. Making a
route public is a line added to `PUBLIC_PATHS`, on purpose, in the file that
owns authentication. `a_path_no_route_matches_still_needs_a_token` fails if the
layer stops covering everything.

**A handler that touches data takes `Caller` and filters on
`caller.subject`.** Every query in `notes.rs` has `owner = $n` in it. A query
by id alone is how one caller reads another's row (OWASP API1:2023, BOLA), and
nothing but a test notices. When you add a resource, add the equivalent of
`a_caller_cannot_read_another_callers_note` for it in the same change.

**Somebody else's row is a 404, never a 403.** A 403 confirms the id exists.
`show` returns the same problem for "missing" and "not yours".

**The owner comes from the token, never from the body.** `NewNote` has
`deny_unknown_fields`, so a client that sends `owner` gets a 422 instead of
silently being ignored. Keep that attribute on every request type.

**Every error is a `Problem`.** Return `Result<_, Problem>` from handlers.
`Problem::internal(error)` logs the cause and tells the caller nothing — never
put a database error in `detail`. Responses a handler never sees (404, 405,
413, 408, a path parameter that does not parse) are converted by
`ensure_problem`, which is why it sits outside the timeout and the body limit
in the layer stack. Do not move it inward.

**Layer order is load-bearing.** In `app_with_timeout`, the last `.layer` runs
first: trace, then `ensure_problem`, then the timeout, then the body limit,
then authentication. A request whose declared length is over the limit is
refused before anything else reads it; the timeout outside everything else
means a client that trickles its body, or never sends it, is cut off.

**Serve through `server::serve`, not `axum::serve`.** axum's function gives
hyper no timer, so hyper's header-read timeout never takes effect: a client
that sends its headers a byte at a time holds a connection indefinitely, and
the request timeout only starts once the headers are in. Its graceful shutdown
also waits for every connection with no deadline. `server::serve` sets both
(`Limits`), and `a_client_that_never_finishes_its_headers_is_disconnected` and
`shutdown_does_not_wait_forever_for_a_slow_client` fail if either goes. Keep
`Limits::drain` under the orchestrator's grace period — ten seconds for
`docker stop`, thirty by default in Kubernetes.

**Every `Validation` setting in `Verifier::new` is deliberate.** One algorithm
(HS256), fixed in code, so `alg: none` and algorithm confusion are refused.
Issuer and audience set, so a token for another service does not work here.
`exp`, `iss`, `aud` and `sub` required, so a token without an expiry is not
valid forever. The test that covers each is
`a_bad_token_is_refused_whatever_is_wrong_with_it`; add a case there before
changing any of them.

**Configuration is read once, in `config.rs`, before anything listens.** A
missing variable stops the process with `refusing to start` and the variable's
name. Do not add `std::env::var` anywhere else, and do not give a secret a
default. `Config`'s `Debug` is written by hand so the secret and the database
password cannot reach a log; a new secret field goes in that list.

**Startup waits for the database, for a bounded time.** `connect` in
`main.rs` retries for 30 seconds and then refuses to start. Without the wait,
a service started alongside its database crash-loops; without the bound, a
wrong URL hangs instead of failing.

**`/health` touches nothing; `/ready` asks the database.** Liveness must keep
answering when Postgres is down, or an orchestrator restarts a healthy process
in a loop. Readiness is what takes the instance out of the load balancer. Do
not add a database call to `/health`.

**Migrations are append-only.** sqlx records a checksum per migration and
refuses to start against a database that ran a different version of the same
file. A schema change is a new file with the next number. `sqlx::migrate!`
embeds them at compile time and `build.rs` makes a new file trigger a rebuild;
without it the binary ships without the migration.

**Queries are checked at run time, not compile time.** `query_as` with
`FromRow`, not `query!`. The compile-time macros need a live database or a
committed `.sqlx` directory from `cargo sqlx prepare` at build time, and this
blueprint has neither. A typo in SQL is caught by the integration tests, which
is why they run against a real Postgres and fail rather than skip without one.

**Never `.unwrap()` on a request path.** A panic in a handler drops the
connection. Map the error into a `Problem`.

## Commands

```bash
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
DATABASE_URL=postgres://postgres:...@127.0.0.1:5432/postgres cargo test --locked
docker build --tag service:dev .
```

`#[sqlx::test]` creates a database per test, so the user in `DATABASE_URL`
needs `CREATEDB`.

## When you are asked to add a resource

1. A migration: `migrations/NNNN_create_<things>.sql`, with an `owner TEXT NOT
NULL` column and an index that starts with it.
2. A module like `notes.rs`: a response struct with `FromRow` and without
   `owner`, a request struct with `deny_unknown_fields`, handlers that take
   `Caller` and put `owner = $n` in every query.
3. The routes in `app_with_timeout`. They are protected already; do not touch
   `PUBLIC_PATHS`.
4. Tests in `tests/api.rs`: the happy path, a caller reading another caller's
   row (404), and a body that fails validation (422, a problem document).
5. `cargo clippy` and `cargo test` against Postgres, then `docker build`.

## Dependencies

Exact pins (`=x.y.z`) in `Cargo.toml` and a committed `Cargo.lock`. Default
features are off for axum, sqlx, jsonwebtoken and tracing-subscriber, because
compile time is this stack's real cost: add a feature when you use it, not
before. Raising `rust-version` is a decision, and the `msrv` job in CI is what
holds the number.
