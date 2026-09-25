# Changelog — rust-axum-service

## 1.0.0 — 2026-09-25

First version.

An HTTP service on axum 0.8.9 and tokio 1.53.1, with Postgres through sqlx
0.9.0 and embedded migrations, JWT bearer authentication with jsonwebtoken
11.1.0, notes scoped to the token's subject, RFC 9457 problem documents, a body
limit and request timeout from tower-http 0.7.1, graceful shutdown, JSON logs,
integration tests against Postgres, a distroless non-root image and CI.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where `axum` showed 120.0M downloads in 90 days, `sqlx` 38.9M and `tokio`
231.9M on crates.io, and tokio-rs/axum 27.2k stars. Its recipe runs in CI like
every other; it was not run by hand, and nobody has built a service on it, so
it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Versions read on 2026-09-25: every crate from the crates.io API, `postgres`
18.6-alpine and `rust` 1.98.1-slim-trixie from Docker Hub, and the
`gcr.io/distroless/cc-debian13:nonroot` digest from its registry. The code was
built, linted and tested before the recipe was written: `cargo clippy` and
`cargo test` (19 tests) in a `rust:1.98.1` container against `postgres:18.6`,
`cargo check --locked --all-targets` in a `rust:1.94.0` container, and the
image built and run through the recipe's container steps. The header-read
timeout and the drain deadline were each removed once, by hand, to watch
their tests fail.

The floor is **Rust 1.94**, and it is sqlx's: sqlx 0.9.0 declares
`rust-version = "1.94.0"` and nothing else in the lock file asks for more.
The research named CI compile time as the risk, so default features are off
for axum, sqlx, jsonwebtoken and tracing-subscriber, and the generated CI
caches the build keyed on `Cargo.lock`.

Decisions worth arguing about:

- **Deny by default, by path.** axum does not expose its route table, so
  authentication is a middleware over the whole router with an explicit
  `PUBLIC_PATHS` list, rather than a group a route has to be declared in. A
  test proves a path no route matches still needs a token.
- **hyper's server instead of `axum::serve`.** The architecture review found
  that `axum::serve` gives hyper no timer, so no header-read timeout applies
  and a client can hold a connection by sending headers slowly; its graceful
  shutdown also waits with no deadline. `src/server.rs` is the accept loop
  with both limits, on hyper 1.11.1 and hyper-util 0.1.21, which axum already
  depends on.
- **Runtime-checked queries.** The compile-time `query!` macros need a
  database or a committed `.sqlx` directory at build time; this recipe has
  neither, and the integration tests catch what the macros would have.
- **A problem-document middleware** outside the timeout and the body limit,
  so the responses tower-http and axum write themselves have the same shape
  as the handlers' own.
- **jsonwebtoken on `rust_crypto`**, not `aws_lc_rs`: no C toolchain beyond
  the linker. The RSA code it compiles is never reached; only HS256 is
  accepted.
- **No `rust-toolchain.toml`**, the same as `rust-cli`: it would have rustup
  download a toolchain mid-recipe from a host that is not a package registry.

### Planned

Nothing is promised. The obvious next versions, if somebody asks: TLS to the
database behind a feature, JWKS verification for a third-party issuer, and
compile-time-checked queries with a committed `.sqlx` directory.
