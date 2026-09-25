# Setup

Creates an HTTP service in Rust on axum and tokio, with Postgres through sqlx
and migrations embedded in the binary, JWT bearer authentication that denies
by default, notes scoped to the caller, RFC 9457 problem documents for every
error, a body limit and timeouts for the request and its headers, graceful
shutdown with a deadline, JSON logs, integration tests against a real
Postgres, a distroless non-root container and CI.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Rust 1.94 or newer through rustup, with the rustfmt and clippy
components, Docker and curl. No toolchain file is written: it would make rustup
download a toolchain in the middle of the recipe.

1. Start a binary crate in the current directory: `cargo init --bin --vcs none --edition 2024 --name service`
   Verify: `test -f src/main.rs`

2. Replace `Cargo.toml` with:

   ```toml
   [package]
   name = "service"
   version = "0.1.0"
   edition = "2024"
   # The oldest Rust this builds with: sqlx 0.9 declares 1.94, and nothing else
   # in the lock file asks for more. The msrv job in CI builds with exactly this
   # toolchain, so the number is checked rather than hoped for.
   rust-version = "1.94"
   publish = false

   # `=` is an exact pin: `cargo update` cannot move it. Cargo.lock pins what
   # these pull in, by checksum. Default features are off wherever they compile
   # something this service does not use — compile time is this stack's cost.
   [dependencies]
   axum = { version = "=0.8.9", default-features = false, features = ["http1", "json", "tokio", "tracing"] }
   # hyper directly, for the header-read timeout axum::serve does not set; see
   # src/server.rs. axum already depends on both, so they add no compile time.
   hyper = { version = "=1.11.1", default-features = false, features = ["http1", "server"] }
   hyper-util = { version = "=0.1.21", default-features = false, features = ["http1", "server", "server-graceful", "service", "tokio"] }
   # Pure-Rust crypto rather than aws-lc-rs, so the build needs no C toolchain
   # beyond the linker. Only HS256 is accepted; see src/auth.rs.
   jsonwebtoken = { version = "=11.1.0", default-features = false, features = ["rust_crypto"] }
   serde = { version = "=1.0.229", features = ["derive"] }
   serde_json = "=1.0.151"
   # Postgres only, no TLS, no MySQL or SQLite drivers. `macros` is for
   # `migrate!`, `FromRow` and `#[sqlx::test]`; queries are checked at run time.
   sqlx = { version = "=0.9.0", default-features = false, features = ["runtime-tokio", "postgres", "macros", "migrate"] }
   tokio = { version = "=1.53.1", features = ["macros", "net", "rt-multi-thread", "signal", "time"] }
   tower-http = { version = "=0.7.1", features = ["limit", "timeout", "trace"] }
   tracing = "=0.1.44"
   tracing-subscriber = { version = "=0.3.23", default-features = false, features = ["fmt", "json", "std"] }

   [dev-dependencies]
   futures-util = { version = "=0.3.34", default-features = false }
   tokio = { version = "=1.53.1", features = ["io-util"] }
   tower = { version = "=0.5.3", default-features = false, features = ["util"] }

   [lints.rust]
   unsafe_code = "forbid"
   ```

   Verify: `grep -q 'rust-version = "1.94"' Cargo.toml`

3. Create `build.rs` with:

   ```rust
   // `sqlx::migrate!` copies the migration files into the binary at compile
   // time. Cargo does not know that, so without this line a new migration does
   // not trigger a rebuild and the binary ships without it.
   fn main() {
       println!("cargo:rerun-if-changed=migrations");
   }
   ```

   Verify: `test -f build.rs`

4. Create `migrations/0001_create_notes.sql` with:

   ```sql
   -- A migration is never edited once it has run anywhere: sqlx stores its
   -- checksum and refuses to start against a database that ran a different one.
   -- A change is a new file with the next number.
   CREATE TABLE notes (
       id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       -- The `sub` claim of the token that created the note. Every query that
       -- reads a note filters on it.
       owner TEXT NOT NULL,
       text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 1000),
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE INDEX notes_owner_id ON notes (owner, id);
   ```

   Verify: `test -f migrations/0001_create_notes.sql`

5. Create `src/config.rs` with:

   ```rust
   //! Configuration: read once, from the environment, before anything listens.
   //! Nothing else in the service reads an environment variable.

   use std::fmt;

   /// RFC 7518 section 3.2: an HS256 key is at least as long as the hash, 256
   /// bits. A shorter one is refused here rather than accepted and brute-forced.
   const MIN_SECRET_BYTES: usize = 32;

   #[derive(Clone)]
   pub struct Config {
       pub database_url: String,
       pub jwt_secret: Vec<u8>,
       pub jwt_issuer: String,
       pub jwt_audience: String,
       pub port: u16,
   }

   // Written by hand so that neither the signing secret nor the database password
   // inside the URL can reach a log line through `{:?}`.
   impl fmt::Debug for Config {
       fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
           f.debug_struct("Config")
               .field("database_url", &"<redacted>")
               .field("jwt_secret", &"<redacted>")
               .field("jwt_issuer", &self.jwt_issuer)
               .field("jwt_audience", &self.jwt_audience)
               .field("port", &self.port)
               .finish()
       }
   }

   #[derive(Debug, PartialEq, Eq)]
   pub enum ConfigError {
       Missing(&'static str),
       Invalid {
           name: &'static str,
           reason: &'static str,
       },
   }

   impl fmt::Display for ConfigError {
       fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
           match self {
               Self::Missing(name) => write!(f, "{name} is required"),
               Self::Invalid { name, reason } => write!(f, "{name} {reason}"),
           }
       }
   }

   impl std::error::Error for ConfigError {}

   impl Config {
       pub fn from_env() -> Result<Self, ConfigError> {
           Self::from_lookup(|name| std::env::var(name).ok())
       }

       /// The same rules over any source, so a test can supply the values
       /// without touching the process environment other tests share.
       pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
           let required = |name: &'static str| {
               lookup(name)
                   .filter(|value| !value.trim().is_empty())
                   .ok_or(ConfigError::Missing(name))
           };

           let database_url = required("DATABASE_URL")?;
           let jwt_secret = required("JWT_SECRET")?.into_bytes();
           if jwt_secret.len() < MIN_SECRET_BYTES {
               return Err(ConfigError::Invalid {
                   name: "JWT_SECRET",
                   reason: "must be at least 32 bytes",
               });
           }
           let jwt_issuer = required("JWT_ISSUER")?;
           let jwt_audience = required("JWT_AUDIENCE")?;
           let port = match lookup("PORT") {
               None => 8080,
               Some(value) => value.parse().map_err(|_| ConfigError::Invalid {
                   name: "PORT",
                   reason: "must be a port number",
               })?,
           };

           Ok(Self {
               database_url,
               jwt_secret,
               jwt_issuer,
               jwt_audience,
               port,
           })
       }
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       fn complete(name: &str) -> Option<String> {
           match name {
               "DATABASE_URL" => Some("postgres://localhost/example".into()),
               "JWT_SECRET" => Some("not-a-real-secret-only-for-tests-0123456789".into()),
               "JWT_ISSUER" => Some("issuer".into()),
               "JWT_AUDIENCE" => Some("audience".into()),
               _ => None,
           }
       }

       #[test]
       fn a_complete_environment_is_accepted() {
           let config = Config::from_lookup(complete).unwrap();
           assert_eq!(config.port, 8080);
       }

       #[test]
       fn every_required_variable_is_required() {
           for missing in ["DATABASE_URL", "JWT_SECRET", "JWT_ISSUER", "JWT_AUDIENCE"] {
               let result =
                   Config::from_lookup(|name| (name != missing).then(|| complete(name)).flatten());
               assert_eq!(result.unwrap_err(), ConfigError::Missing(missing));
           }
       }

       #[test]
       fn a_short_secret_is_refused() {
           let result = Config::from_lookup(|name| match name {
               "JWT_SECRET" => Some("too-short".into()),
               _ => complete(name),
           });
           assert!(matches!(
               result,
               Err(ConfigError::Invalid {
                   name: "JWT_SECRET",
                   ..
               })
           ));
       }

       #[test]
       fn debug_output_hides_the_secrets() {
           let printed = format!("{:?}", Config::from_lookup(complete).unwrap());
           assert!(!printed.contains("not-a-real-secret"));
           assert!(!printed.contains("postgres://"));
       }
   }
   ```

   Verify: `test -f src/config.rs`

6. Create `src/problem.rs` with:

   ```rust
   //! Every error response is an RFC 9457 problem document: one shape, one media
   //! type, whether a handler, the framework or a tower-http layer produced it.

   use std::fmt;

   use axum::Json;
   use axum::http::{HeaderValue, StatusCode, header};
   use axum::response::{IntoResponse, Response};
   use serde::Serialize;

   pub const CONTENT_TYPE: &str = "application/problem+json";

   #[derive(Debug, Serialize)]
   pub struct Problem {
       /// `about:blank`: the status code is the whole meaning, and the title is
       /// its reason phrase (RFC 9457 section 4.2.1).
       #[serde(rename = "type")]
       kind: &'static str,
       title: &'static str,
       status: u16,
       #[serde(skip_serializing_if = "Option::is_none")]
       detail: Option<String>,
   }

   impl Problem {
       pub fn new(status: StatusCode) -> Self {
           Self {
               kind: "about:blank",
               title: status.canonical_reason().unwrap_or("Error"),
               status: status.as_u16(),
               detail: None,
           }
       }

       /// Written for the caller. Never an internal error message: those go to
       /// the log, and the caller gets `Problem::internal`.
       pub fn detail(mut self, detail: impl Into<String>) -> Self {
           self.detail = Some(detail.into());
           self
       }

       /// A failure the caller cannot fix. The cause is logged here, once, and
       /// the response says nothing about it.
       pub fn internal(error: impl fmt::Display) -> Self {
           tracing::error!(%error, "request failed");
           Self::new(StatusCode::INTERNAL_SERVER_ERROR)
       }
   }

   impl IntoResponse for Problem {
       fn into_response(self) -> Response {
           let status = StatusCode::from_u16(self.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
           let mut response = (status, Json(self)).into_response();
           response
               .headers_mut()
               .insert(header::CONTENT_TYPE, HeaderValue::from_static(CONTENT_TYPE));
           response
       }
   }

   /// Middleware for the whole router: an error response that is not a problem
   /// document yet becomes one. That covers what no handler writes — 404 for an
   /// unknown path, 405, 400 for a path parameter that does not parse, 413 from
   /// the body limit and 408 from the timeout. Headers such as `Allow` are kept.
   pub async fn ensure_problem(response: Response) -> Response {
       let status = response.status();
       if !(status.is_client_error() || status.is_server_error()) {
           return response;
       }
       let already = response
           .headers()
           .get(header::CONTENT_TYPE)
           .is_some_and(|value| value.as_bytes() == CONTENT_TYPE.as_bytes());
       if already {
           return response;
       }

       let (mut parts, _) = response.into_parts();
       let (_, body) = Problem::new(status).into_response().into_parts();
       parts.headers.remove(header::CONTENT_LENGTH);
       parts
           .headers
           .insert(header::CONTENT_TYPE, HeaderValue::from_static(CONTENT_TYPE));
       Response::from_parts(parts, body)
   }
   ```

   Verify: `test -f src/problem.rs`

7. Create `src/auth.rs` with:

   ```rust
   //! Who the caller is. The only module that reads the Authorization header and
   //! the only one that knows a token is a JWT.

   use axum::extract::{FromRequestParts, Request, State};
   use axum::http::request::Parts;
   use axum::http::{HeaderValue, StatusCode, header};
   use axum::middleware::Next;
   use axum::response::{IntoResponse, Response};
   use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
   use serde::Deserialize;

   use crate::AppState;
   use crate::problem::Problem;

   /// The paths answered without a token. Everything else needs one — including
   /// routes nobody has written yet and paths that match no route at all, so a
   /// new route is protected unless somebody adds it here on purpose.
   pub const PUBLIC_PATHS: &[&str] = &["/health", "/ready"];

   pub struct Verifier {
       key: DecodingKey,
       validation: Validation,
   }

   impl Verifier {
       pub fn new(secret: &[u8], issuer: &str, audience: &str) -> Self {
           // One algorithm, fixed here rather than read from the token: `alg:
           // none` and a token signed with some other algorithm are both refused.
           let mut validation = Validation::new(Algorithm::HS256);
           // A token minted for another service, or by another issuer, is not a
           // token for this one.
           validation.set_issuer(&[issuer]);
           validation.set_audience(&[audience]);
           // Without `exp` in this list a token that omits it never expires.
           validation.set_required_spec_claims(&["exp", "iss", "aud", "sub"]);
           validation.leeway = 30;

           Self {
               key: DecodingKey::from_secret(secret),
               validation,
           }
       }

       /// The caller a token names, or nothing. Which check failed is not
       /// returned: it helps an attacker and nobody else.
       pub fn verify(&self, token: &str) -> Option<Caller> {
           let data = decode::<Claims>(token, &self.key, &self.validation).ok()?;
           let subject = data.claims.sub.trim();
           if subject.is_empty() {
               return None;
           }
           Some(Caller {
               subject: subject.to_owned(),
           })
       }
   }

   #[derive(Deserialize)]
   struct Claims {
       sub: String,
   }

   /// The authenticated caller. Handlers take it as an argument and scope every
   /// query to `subject`.
   #[derive(Clone, Debug)]
   pub struct Caller {
       pub subject: String,
   }

   impl<S: Send + Sync> FromRequestParts<S> for Caller {
       type Rejection = Response;

       /// Reads what `require_bearer` stored. A handler on a path the
       /// middleware let through without a token gets a 401 here rather than an
       /// anonymous caller: the failure is closed in both places.
       async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
           parts
               .extensions
               .get::<Caller>()
               .cloned()
               .ok_or_else(unauthorized)
       }
   }

   /// Middleware for the whole router: deny by default.
   pub async fn require_bearer(
       State(state): State<AppState>,
       mut request: Request,
       next: Next,
   ) -> Response {
       if PUBLIC_PATHS.contains(&request.uri().path()) {
           return next.run(request).await;
       }

       let caller = request
           .headers()
           .get(header::AUTHORIZATION)
           .and_then(|value| value.to_str().ok())
           .and_then(|value| value.strip_prefix("Bearer "))
           .and_then(|token| state.verifier.verify(token));

       match caller {
           Some(caller) => {
               request.extensions_mut().insert(caller);
               next.run(request).await
           }
           None => unauthorized(),
       }
   }

   /// 401, not 403: "who are you", not "you may not". RFC 6750 section 3 asks
   /// for the challenge header.
   fn unauthorized() -> Response {
       let mut response = Problem::new(StatusCode::UNAUTHORIZED)
           .detail("a valid bearer token is required")
           .into_response();
       response
           .headers_mut()
           .insert(header::WWW_AUTHENTICATE, HeaderValue::from_static("Bearer"));
       response
   }
   ```

   Verify: `test -f src/auth.rs`

8. Create `src/notes.rs` with:

   ```rust
   //! Notes, each owned by the subject of the token that created it. Every query
   //! here names the owner, so there is no path by which one caller reads
   //! another's note.

   use axum::Json;
   use axum::extract::rejection::JsonRejection;
   use axum::extract::{Path, State};
   use axum::http::StatusCode;
   use serde::{Deserialize, Serialize};

   use crate::AppState;
   use crate::auth::Caller;
   use crate::problem::Problem;

   pub const MAX_TEXT_CHARS: usize = 1000;

   /// What a caller sees. `owner` is not in it: the caller already knows who
   /// they are, and nobody else ever receives the row.
   #[derive(Debug, Serialize, sqlx::FromRow)]
   pub struct Note {
       pub id: i64,
       pub text: String,
   }

   /// Unknown fields are refused rather than ignored, so a client that sends
   /// `owner` learns it cannot set it instead of believing it did.
   #[derive(Debug, Deserialize)]
   #[serde(deny_unknown_fields)]
   pub struct NewNote {
       pub text: String,
   }

   pub async fn create(
       State(state): State<AppState>,
       caller: Caller,
       payload: Result<Json<NewNote>, JsonRejection>,
   ) -> Result<(StatusCode, Json<Note>), Problem> {
       // The rejection keeps its own status: 400 for malformed JSON, 415 for a
       // missing content type, 422 for the wrong shape, 413 for too large.
       let Json(new) = payload
           .map_err(|rejection| Problem::new(rejection.status()).detail(rejection.body_text()))?;

       let text = new.text.trim();
       if text.is_empty() || text.chars().count() > MAX_TEXT_CHARS {
           return Err(Problem::new(StatusCode::UNPROCESSABLE_ENTITY)
               .detail("text must be 1 to 1000 characters"));
       }

       let note = sqlx::query_as::<_, Note>(
           "INSERT INTO notes (owner, text) VALUES ($1, $2) RETURNING id, text",
       )
       .bind(&caller.subject)
       .bind(text)
       .fetch_one(&state.pool)
       .await
       .map_err(Problem::internal)?;

       Ok((StatusCode::CREATED, Json(note)))
   }

   pub async fn list(
       State(state): State<AppState>,
       caller: Caller,
   ) -> Result<Json<Vec<Note>>, Problem> {
       // Bounded: a list endpoint with no limit is a denial of service that
       // grows with the table.
       let notes = sqlx::query_as::<_, Note>(
           "SELECT id, text FROM notes WHERE owner = $1 ORDER BY id LIMIT 100",
       )
       .bind(&caller.subject)
       .fetch_all(&state.pool)
       .await
       .map_err(Problem::internal)?;

       Ok(Json(notes))
   }

   pub async fn show(
       State(state): State<AppState>,
       caller: Caller,
       Path(id): Path<i64>,
   ) -> Result<Json<Note>, Problem> {
       let note = sqlx::query_as::<_, Note>("SELECT id, text FROM notes WHERE id = $1 AND owner = $2")
           .bind(id)
           .bind(&caller.subject)
           .fetch_optional(&state.pool)
           .await
           .map_err(Problem::internal)?;

       // 404 whether the note does not exist or belongs to somebody else: a 403
       // would confirm that the id is taken.
       note.map(Json)
           .ok_or_else(|| Problem::new(StatusCode::NOT_FOUND).detail("no such note"))
   }
   ```

   Verify: `test -f src/notes.rs`

9. Create `src/server.rs` with:

   ```rust
   //! The accept loop, written out rather than `axum::serve`, for two limits that
   //! function does not set.
   //!
   //! axum's `serve` gives hyper no timer, so hyper's header-read timeout never
   //! takes effect: a client that sends its headers a byte at a time holds a
   //! connection for as long as it likes, and tower-http's timeout only starts
   //! once the headers have arrived. And its graceful shutdown waits for every
   //! connection with no deadline, so that same client also holds up the exit
   //! until the orchestrator kills the process.

   use std::future::Future;
   use std::time::Duration;

   use axum::Router;
   use hyper::server::conn::http1;
   use hyper_util::rt::{TokioIo, TokioTimer};
   use hyper_util::server::graceful::GracefulShutdown;
   use hyper_util::service::TowerToHyperService;
   use tokio::net::TcpListener;

   #[derive(Clone, Copy, Debug)]
   pub struct Limits {
       /// From accepting a connection, or finishing a response on it, to having
       /// the next request's headers.
       pub header_read: Duration,
       /// How long shutdown waits for open connections before it stops waiting.
       pub drain: Duration,
   }

   impl Default for Limits {
       fn default() -> Self {
           Self {
               header_read: Duration::from_secs(5),
               // Under the ten seconds `docker stop` waits before it kills, so
               // the process exits on its own. Raise it together with the
               // orchestrator's grace period, never above it.
               drain: Duration::from_secs(8),
           }
       }
   }

   /// Serves `app` until `shutdown` completes, then stops accepting, lets open
   /// connections finish for up to `limits.drain`, and returns.
   pub async fn serve(
       listener: TcpListener,
       app: Router,
       limits: Limits,
       shutdown: impl Future<Output = ()>,
   ) {
       let mut http = http1::Builder::new();
       http.timer(TokioTimer::new())
           .header_read_timeout(limits.header_read);
       let graceful = GracefulShutdown::new();
       let mut shutdown = std::pin::pin!(shutdown);

       loop {
           tokio::select! {
               accepted = listener.accept() => {
                   let stream = match accepted {
                       Ok((stream, _)) => stream,
                       // Out of file descriptors, or a connection reset before
                       // it was accepted: not a reason to stop serving the rest.
                       Err(error) => {
                           tracing::warn!(%error, "accept failed");
                           tokio::time::sleep(Duration::from_millis(50)).await;
                           continue;
                       }
                   };
                   let service = TowerToHyperService::new(app.clone());
                   let connection = graceful.watch(http.serve_connection(TokioIo::new(stream), service));
                   tokio::spawn(async move {
                       if let Err(error) = connection.await {
                           tracing::debug!(%error, "connection ended with an error");
                       }
                   });
               }
               () = &mut shutdown => break,
           }
       }

       drop(listener);
       tokio::select! {
           () = graceful.shutdown() => {}
           () = tokio::time::sleep(limits.drain) => {
               tracing::warn!("connections were still open when the drain deadline passed");
           }
       }
   }
   ```

   Verify: `test -f src/server.rs`

10. Create `src/lib.rs` with:

    ```rust
    //! The service as a library, so the integration tests drive the same router
    //! the binary serves.

    pub mod auth;
    pub mod config;
    pub mod notes;
    pub mod problem;
    pub mod server;

    use std::sync::Arc;
    use std::time::Duration;

    use axum::extract::State;
    use axum::http::StatusCode;
    use axum::routing::get;
    use axum::{Json, Router, middleware};
    use serde_json::{Value, json};
    use sqlx::PgPool;
    use tower_http::limit::RequestBodyLimitLayer;
    use tower_http::timeout::TimeoutLayer;
    use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer};
    use tracing::Level;

    use crate::auth::Verifier;
    use crate::problem::Problem;

    /// The largest request body accepted. A note is at most 1000 characters; this
    /// leaves room for JSON and multi-byte text and nothing much else.
    pub const BODY_LIMIT_BYTES: usize = 16 * 1024;

    /// How long a request may take, from the moment its headers arrive until the
    /// response is ready, reading the body included.
    pub const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);

    /// How long the readiness check waits for the database.
    const READY_TIMEOUT: Duration = Duration::from_secs(2);

    #[derive(Clone)]
    pub struct AppState {
        pub pool: PgPool,
        pub verifier: Arc<Verifier>,
    }

    pub fn app(state: AppState) -> Router {
        app_with_timeout(state, REQUEST_TIMEOUT)
    }

    /// The router with a different timeout, so a test can prove the timeout
    /// without waiting for the real one.
    pub fn app_with_timeout(state: AppState, timeout: Duration) -> Router {
        Router::new()
            .route("/health", get(health))
            .route("/ready", get(ready))
            .route("/notes", get(notes::list).post(notes::create))
            .route("/notes/{id}", get(notes::show))
            // Layers wrap what is above them; the last one added runs first.
            .layer(middleware::from_fn_with_state(
                state.clone(),
                auth::require_bearer,
            ))
            .layer(RequestBodyLimitLayer::new(BODY_LIMIT_BYTES))
            .layer(TimeoutLayer::with_status_code(
                StatusCode::REQUEST_TIMEOUT,
                timeout,
            ))
            .layer(middleware::map_response(problem::ensure_problem))
            // Method, path and status at INFO. Headers are not recorded, so the
            // Authorization header never reaches a log.
            .layer(
                TraceLayer::new_for_http()
                    .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                    .on_response(DefaultOnResponse::new().level(Level::INFO)),
            )
            .with_state(state)
    }

    /// Liveness: is the process up? It touches nothing — no database, no token —
    /// so an orchestrator does not restart a healthy process because a dependency
    /// is down.
    async fn health() -> Json<Value> {
        Json(json!({ "status": "ok" }))
    }

    /// Readiness: can it do its job? It asks the database, with a deadline, so a
    /// load balancer stops sending traffic while the database is unreachable.
    async fn ready(State(state): State<AppState>) -> Result<Json<Value>, Problem> {
        let check = sqlx::query("SELECT 1").execute(&state.pool);
        match tokio::time::timeout(READY_TIMEOUT, check).await {
            Ok(Ok(_)) => Ok(Json(json!({ "status": "ready" }))),
            Ok(Err(error)) => {
                tracing::warn!(%error, "readiness check failed");
                Err(Problem::new(StatusCode::SERVICE_UNAVAILABLE)
                    .detail("the database is not reachable"))
            }
            Err(_) => {
                tracing::warn!("readiness check timed out");
                Err(Problem::new(StatusCode::SERVICE_UNAVAILABLE)
                    .detail("the database did not answer in time"))
            }
        }
    }
    ```

    Verify: `test -f src/lib.rs`

11. Replace `src/main.rs` with:

    ```rust
    //! Startup and shutdown, and nothing else: read the configuration, connect,
    //! migrate, serve until told to stop.

    use std::net::SocketAddr;
    use std::process::ExitCode;
    use std::sync::Arc;
    use std::time::{Duration, Instant};

    use service::auth::Verifier;
    use service::config::Config;
    use service::server::{Limits, serve};
    use service::{AppState, app};
    use sqlx::PgPool;
    use sqlx::postgres::PgPoolOptions;
    use tokio::net::TcpListener;

    #[tokio::main]
    async fn main() -> ExitCode {
        // One JSON object per line on stdout, which is what a log collector reads.
        tracing_subscriber::fmt().json().init();

        match run().await {
            Ok(()) => ExitCode::SUCCESS,
            Err(error) => {
                tracing::error!(%error, "refusing to start");
                ExitCode::FAILURE
            }
        }
    }

    async fn run() -> Result<(), String> {
        // Before anything listens. A missing variable stops the process here;
        // checked per request instead, the service would answer 500 to everything
        // while /health said 200.
        let config = Config::from_env().map_err(|error| error.to_string())?;

        let pool = connect(&config.database_url).await?;

        // Embedded at compile time. Postgres takes an advisory lock while they
        // run, so two replicas starting together do not both apply them.
        sqlx::migrate!()
            .run(&pool)
            .await
            .map_err(|error| format!("migrations failed: {error}"))?;

        let state = AppState {
            pool: pool.clone(),
            verifier: Arc::new(Verifier::new(
                &config.jwt_secret,
                &config.jwt_issuer,
                &config.jwt_audience,
            )),
        };

        let listener = TcpListener::bind(SocketAddr::from(([0, 0, 0, 0], config.port)))
            .await
            .map_err(|error| format!("cannot listen on port {}: {error}", config.port))?;
        tracing::info!(port = config.port, "listening");

        // On the signal: stop accepting, let open requests finish for up to the
        // drain deadline, then close the pool.
        serve(listener, app(state), Limits::default(), shutdown_signal()).await;

        pool.close().await;
        tracing::info!("stopped");
        Ok(())
    }

    /// How long startup keeps trying the database before it gives up.
    const DATABASE_WAIT: Duration = Duration::from_secs(30);

    /// The pool, once the database answers. A service and its database are
    /// usually started together, and the database is usually the slower of the
    /// two: a single attempt turns that race into a crash loop. The wait is
    /// bounded, so a wrong URL still ends in `refusing to start`.
    async fn connect(url: &str) -> Result<PgPool, String> {
        let options = PgPoolOptions::new()
            .max_connections(10)
            .acquire_timeout(Duration::from_secs(3));
        let deadline = Instant::now() + DATABASE_WAIT;

        loop {
            match options.clone().connect(url).await {
                Ok(pool) => return Ok(pool),
                Err(error) if Instant::now() < deadline => {
                    tracing::warn!(%error, "the database is not reachable yet");
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
                Err(error) => return Err(format!("cannot reach the database: {error}")),
            }
        }
    }

    /// Ctrl+C, or SIGTERM — what `docker stop` and Kubernetes send. As PID 1 in a
    /// container a process that installs no handler ignores SIGTERM and is killed
    /// ten seconds later, mid-request.
    async fn shutdown_signal() {
        let interrupt = async {
            tokio::signal::ctrl_c()
                .await
                .expect("the Ctrl+C handler could not be installed");
        };

        #[cfg(unix)]
        let terminate = async {
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("the SIGTERM handler could not be installed")
                .recv()
                .await;
        };
        #[cfg(not(unix))]
        let terminate = std::future::pending::<()>();

        tokio::select! {
            () = interrupt => {},
            () = terminate => {},
        }
        tracing::info!("shutting down");
    }
    ```

    Verify: `grep -q "shutdown_signal" src/main.rs`

12. Create `tests/api.rs` with:

    ```rust
    //! The router the binary serves, driven request by request against a real
    //! Postgres. `#[sqlx::test]` creates a fresh database for each test from
    //! DATABASE_URL and applies the migrations, so tests never see each other's
    //! rows. Without DATABASE_URL they fail rather than skip: a skipped isolation
    //! test is a claim nobody checked.

    use std::io;
    use std::sync::Arc;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    use axum::body::{Body, Bytes, to_bytes};
    use axum::http::{Request, StatusCode, header};
    use jsonwebtoken::{EncodingKey, Header, encode};
    use serde_json::{Value, json};
    use service::auth::Verifier;
    use service::server::{Limits, serve};
    use service::{AppState, BODY_LIMIT_BYTES, app, app_with_timeout};
    use sqlx::PgPool;
    use sqlx::postgres::PgPoolOptions;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::{TcpListener, TcpStream};
    use tower::ServiceExt;

    const SECRET: &[u8] = b"not-a-real-secret-only-for-tests-0123456789";
    const ISSUER: &str = "service-tests";
    const AUDIENCE: &str = "service";

    fn state(pool: PgPool) -> AppState {
        AppState {
            pool,
            verifier: Arc::new(Verifier::new(SECRET, ISSUER, AUDIENCE)),
        }
    }

    fn now() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    fn sign(claims: &Value, secret: &[u8]) -> String {
        encode(
            &Header::default(),
            claims,
            &EncodingKey::from_secret(secret),
        )
        .unwrap()
    }

    fn token(subject: &str) -> String {
        sign(
            &json!({ "sub": subject, "iss": ISSUER, "aud": AUDIENCE, "exp": now() + 3600 }),
            SECRET,
        )
    }

    struct Reply {
        status: StatusCode,
        content_type: String,
        body: Value,
    }

    async fn send(
        state: AppState,
        method: &str,
        path: &str,
        bearer: Option<&str>,
        body: Option<Value>,
    ) -> Reply {
        let mut request = Request::builder().method(method).uri(path);
        if let Some(bearer) = bearer {
            request = request.header(header::AUTHORIZATION, format!("Bearer {bearer}"));
        }
        let request = match body {
            Some(body) => request
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string())),
            None => request.body(Body::empty()),
        }
        .unwrap();

        let response = app(state).oneshot(request).await.unwrap();
        let status = response.status();
        let content_type = response
            .headers()
            .get(header::CONTENT_TYPE)
            .map(|value| value.to_str().unwrap().to_owned())
            .unwrap_or_default();
        let bytes = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body = serde_json::from_slice(&bytes).unwrap_or(Value::Null);

        Reply {
            status,
            content_type,
            body,
        }
    }

    fn assert_problem(reply: &Reply, status: StatusCode) {
        assert_eq!(reply.status, status, "body: {}", reply.body);
        assert_eq!(reply.content_type, "application/problem+json");
        assert_eq!(reply.body["status"], status.as_u16());
        assert_eq!(reply.body["type"], "about:blank");
    }

    #[sqlx::test]
    async fn health_needs_no_token(pool: PgPool) {
        let reply = send(state(pool), "GET", "/health", None, None).await;
        assert_eq!(reply.status, StatusCode::OK);
        assert_eq!(reply.body["status"], "ok");
    }

    #[sqlx::test]
    async fn ready_answers_when_the_database_does(pool: PgPool) {
        let reply = send(state(pool), "GET", "/ready", None, None).await;
        assert_eq!(reply.status, StatusCode::OK);
        assert_eq!(reply.body["status"], "ready");
    }

    /// A pool whose every connection fails: nothing listens on port 1.
    fn unreachable_pool() -> PgPool {
        PgPoolOptions::new()
            .acquire_timeout(Duration::from_secs(1))
            .connect_lazy("postgres://nobody@127.0.0.1:1/nothing")
            .unwrap()
    }

    #[tokio::test]
    async fn ready_is_503_when_the_database_is_down_and_health_is_not() {
        let pool = unreachable_pool();

        let ready = send(state(pool.clone()), "GET", "/ready", None, None).await;
        assert_problem(&ready, StatusCode::SERVICE_UNAVAILABLE);

        let health = send(state(pool), "GET", "/health", None, None).await;
        assert_eq!(health.status, StatusCode::OK);
    }

    #[sqlx::test]
    async fn a_request_without_a_token_is_refused(pool: PgPool) {
        let reply = send(state(pool), "GET", "/notes", None, None).await;
        assert_problem(&reply, StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test]
    async fn a_path_no_route_matches_still_needs_a_token(pool: PgPool) {
        // Deny by default: the middleware covers routes nobody has written yet.
        let reply = send(state(pool), "GET", "/admin", None, None).await;
        assert_problem(&reply, StatusCode::UNAUTHORIZED);
    }

    /// `{"alg":"none","typ":"JWT"}`, base64url: a token that asks not to be
    /// verified. jsonwebtoken cannot sign one, so it is written out.
    const UNSIGNED_HEADER: &str = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0";

    /// `{"sub":"mallory","iss":"service-tests","aud":"service","exp":4102444800}`,
    /// base64url: claims that would pass every other check.
    const UNSIGNED_CLAIMS: &str = "eyJzdWIiOiJtYWxsb3J5IiwiaXNzIjoic2VydmljZS10ZXN0cyIsImF1ZCI6InNlcnZpY2UiLCJleHAiOjQxMDI0NDQ4MDB9";

    #[sqlx::test]
    async fn a_bad_token_is_refused_whatever_is_wrong_with_it(pool: PgPool) {
        let exp = now() + 3600;
        let cases = [
            (
                "signed with another secret",
                sign(
                    &json!({ "sub": "mallory", "iss": ISSUER, "aud": AUDIENCE, "exp": exp }),
                    b"a-different-secret-entirely-0123456789",
                ),
            ),
            (
                "expired",
                sign(
                    &json!({ "sub": "mallory", "iss": ISSUER, "aud": AUDIENCE, "exp": now() - 3600 }),
                    SECRET,
                ),
            ),
            (
                "no expiry",
                sign(
                    &json!({ "sub": "mallory", "iss": ISSUER, "aud": AUDIENCE }),
                    SECRET,
                ),
            ),
            (
                "another audience",
                sign(
                    &json!({ "sub": "mallory", "iss": ISSUER, "aud": "another-service", "exp": exp }),
                    SECRET,
                ),
            ),
            (
                "another issuer",
                sign(
                    &json!({ "sub": "mallory", "iss": "someone-else", "aud": AUDIENCE, "exp": exp }),
                    SECRET,
                ),
            ),
            (
                "no subject",
                sign(
                    &json!({ "iss": ISSUER, "aud": AUDIENCE, "exp": exp }),
                    SECRET,
                ),
            ),
            (
                "unsigned, alg none",
                format!("{UNSIGNED_HEADER}.{UNSIGNED_CLAIMS}."),
            ),
        ];

        for (what, bad) in cases {
            let reply = send(state(pool.clone()), "GET", "/notes", Some(&bad), None).await;
            assert_eq!(
                reply.status,
                StatusCode::UNAUTHORIZED,
                "a token {what} was accepted"
            );
        }
    }

    #[sqlx::test]
    async fn a_caller_cannot_read_another_callers_note(pool: PgPool) {
        let alice = token("alice");
        let bob = token("bob");

        let created = send(
            state(pool.clone()),
            "POST",
            "/notes",
            Some(&alice),
            Some(json!({ "text": "alice's note" })),
        )
        .await;
        assert_eq!(created.status, StatusCode::CREATED);
        let path = format!("/notes/{}", created.body["id"]);

        let own = send(state(pool.clone()), "GET", &path, Some(&alice), None).await;
        assert_eq!(own.status, StatusCode::OK);
        assert_eq!(own.body["text"], "alice's note");

        // The same answer as for an id that does not exist.
        let other = send(state(pool.clone()), "GET", &path, Some(&bob), None).await;
        assert_problem(&other, StatusCode::NOT_FOUND);

        let listed = send(state(pool), "GET", "/notes", Some(&bob), None).await;
        assert_eq!(listed.status, StatusCode::OK);
        assert_eq!(listed.body, json!([]));
    }

    #[sqlx::test]
    async fn the_owner_cannot_be_chosen_by_the_client(pool: PgPool) {
        let reply = send(
            state(pool),
            "POST",
            "/notes",
            Some(&token("mallory")),
            Some(json!({ "text": "mine now", "owner": "alice" })),
        )
        .await;
        assert_problem(&reply, StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[sqlx::test]
    async fn empty_text_is_refused(pool: PgPool) {
        let reply = send(
            state(pool),
            "POST",
            "/notes",
            Some(&token("alice")),
            Some(json!({ "text": "   " })),
        )
        .await;
        assert_problem(&reply, StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[sqlx::test]
    async fn a_body_over_the_limit_is_refused(pool: PgPool) {
        let text = "x".repeat(BODY_LIMIT_BYTES);
        let reply = send(
            state(pool),
            "POST",
            "/notes",
            Some(&token("alice")),
            Some(json!({ "text": text })),
        )
        .await;
        assert_problem(&reply, StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[sqlx::test]
    async fn an_unknown_route_is_a_problem_document(pool: PgPool) {
        let reply = send(
            state(pool),
            "GET",
            "/nothing-here",
            Some(&token("alice")),
            None,
        )
        .await;
        assert_problem(&reply, StatusCode::NOT_FOUND);
    }

    #[sqlx::test]
    async fn a_request_that_never_finishes_is_cut_off(pool: PgPool) {
        // A client that sends headers and then never sends the body.
        let never = futures_util::stream::pending::<Result<Bytes, io::Error>>();
        let request = Request::builder()
            .method("POST")
            .uri("/notes")
            .header(header::AUTHORIZATION, format!("Bearer {}", token("alice")))
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from_stream(never))
            .unwrap();

        let response = app_with_timeout(state(pool), Duration::from_millis(200))
            .oneshot(request)
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::REQUEST_TIMEOUT);
        assert_eq!(
            response.headers()[header::CONTENT_TYPE],
            "application/problem+json"
        );
    }

    /// The real accept loop on a port the operating system chooses, with short
    /// limits, stopped by sending on the returned channel.
    async fn start(
        limits: Limits,
    ) -> (
        String,
        tokio::sync::oneshot::Sender<()>,
        tokio::task::JoinHandle<()>,
    ) {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap().to_string();
        let (stop, stopped) = tokio::sync::oneshot::channel::<()>();
        let server = tokio::spawn(serve(
            listener,
            app(state(unreachable_pool())),
            limits,
            async {
                let _ = stopped.await;
            },
        ));
        (address, stop, server)
    }

    const SHORT: Limits = Limits {
        header_read: Duration::from_millis(300),
        drain: Duration::from_secs(2),
    };

    #[tokio::test]
    async fn the_server_answers_over_tcp_and_stops_when_told() {
        let (address, stop, server) = start(SHORT).await;

        let mut client = TcpStream::connect(&address).await.unwrap();
        client
            .write_all(b"GET /health HTTP/1.1\r\nHost: service\r\nConnection: close\r\n\r\n")
            .await
            .unwrap();
        let mut response = String::new();
        client.read_to_string(&mut response).await.unwrap();
        assert!(response.starts_with("HTTP/1.1 200 OK"), "{response}");

        stop.send(()).unwrap();
        let stopped = tokio::time::timeout(Duration::from_secs(5), server).await;
        assert!(
            stopped.is_ok(),
            "serve did not return after the shutdown signal"
        );
    }

    #[tokio::test]
    async fn a_client_that_never_finishes_its_headers_is_disconnected() {
        let (address, stop, server) = start(SHORT).await;

        // Headers with no blank line after them: the request never starts, so
        // the request timeout never starts either. Only the header timeout ends it.
        let mut client = TcpStream::connect(&address).await.unwrap();
        client
            .write_all(b"GET /health HTTP/1.1\r\nHost: service\r\n")
            .await
            .unwrap();
        let mut rest = Vec::new();
        let closed = tokio::time::timeout(Duration::from_secs(5), client.read_to_end(&mut rest)).await;
        assert!(
            closed.is_ok(),
            "the connection was still open after 5 seconds"
        );

        stop.send(()).unwrap();
        let _ = server.await;
    }

    #[tokio::test]
    async fn shutdown_does_not_wait_forever_for_a_slow_client() {
        let (address, stop, server) = start(Limits {
            header_read: Duration::from_secs(60),
            drain: Duration::from_millis(300),
        })
        .await;

        // Half a request, with a header timeout too long to end it within the
        // test: only the drain deadline lets serve return.
        let mut client = TcpStream::connect(&address).await.unwrap();
        client.write_all(b"GET /health HTTP/1.1\r\n").await.unwrap();
        tokio::time::sleep(Duration::from_millis(100)).await;

        stop.send(()).unwrap();
        let stopped = tokio::time::timeout(Duration::from_secs(5), server).await;
        assert!(
            stopped.is_ok(),
            "shutdown waited for a connection that never spoke"
        );
    }
    ```

    Verify: `test -f tests/api.rs`

13. Create `.gitignore` with:

    ```text
    /target/
    .env
    ```

    Verify: `test -f .gitignore`

14. Create `Dockerfile` with:

    ```dockerfile
    # The builder's Rust has to be at least `rust-version` in Cargo.toml (1.94,
    # which sqlx 0.9 requires). trixie, because the runtime below is Debian 13:
    # the binary links against the builder's glibc and needs the same one at run
    # time.
    FROM rust:1.98.1-slim-trixie AS build
    WORKDIR /src
    COPY Cargo.toml Cargo.lock build.rs ./
    COPY src ./src
    COPY migrations ./migrations
    # The registry and target directories are cache mounts, so a rebuild after a
    # source change does not download and compile every dependency again. The
    # binary is copied out because a cache mount is not part of the image.
    RUN --mount=type=cache,target=/usr/local/cargo/registry \
        --mount=type=cache,target=/src/target \
        cargo build --release --locked && cp target/release/service /service

    # glibc and libgcc, and nothing else: no shell, no package manager. The digest
    # pins the exact image; the tag in front of it is for the reader. `nonroot`
    # is uid 65532.
    FROM gcr.io/distroless/cc-debian13:nonroot@sha256:54df941ed0d06a1bd95ef5e0ce391fd8d9f94b64782dc9a60062727849ee3f97
    COPY --from=build /service /service
    USER nonroot:nonroot
    EXPOSE 8080
    ENTRYPOINT ["/service"]
    ```

    Verify: `test -f Dockerfile`

15. Create `.dockerignore` with:

    ```text
    .git
    .github
    target
    tests
    Dockerfile
    README.md
    AGENTS.md
    ```

    Verify: `test -f .dockerignore`

16. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      check:
        runs-on: ubuntu-latest
        # The integration tests need a real Postgres. `#[sqlx::test]` creates a
        # database per test from DATABASE_URL, so this one is only the entry point.
        services:
          postgres:
            image: postgres:18.6-alpine
            env:
              POSTGRES_PASSWORD: local-development-only-not-a-real-secret
            ports:
              - 5432:5432
            options: >-
              --health-cmd "pg_isready -h 127.0.0.1 -U postgres"
              --health-interval 2s
              --health-timeout 5s
              --health-retries 30
        env:
          DATABASE_URL: postgres://postgres:local-development-only-not-a-real-secret@127.0.0.1:5432/postgres
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          # A pinned toolchain, so a new clippy lint arrives as a pull request that
          # moves this number rather than as a red build on a quiet day.
          - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
            with:
              toolchain: '1.98.1'
              components: clippy, rustfmt
          # Compiling tokio, sqlx and axum from nothing is most of this job. The
          # cache is keyed on Cargo.lock, so it is rebuilt only when a dependency
          # moves.
          - uses: Swatinem/rust-cache@6323deb102c322ba6fcbdcafc7e3dddab59af2b6 # v2.9.2
          - run: cargo fmt --check
          - run: cargo clippy --locked --all-targets -- -D warnings
          - run: cargo test --locked
          - run: docker build --tag service:ci .

      # rust-version in Cargo.toml is a promise to everyone who builds this with
      # an older toolchain. This job is what keeps it.
      msrv:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
            with:
              toolchain: '1.94.0'
          - uses: Swatinem/rust-cache@6323deb102c322ba6fcbdcafc7e3dddab59af2b6 # v2.9.2
          - run: cargo check --locked --all-targets
    ```

    Verify: `test -f .github/workflows/ci.yml`

17. Create `README.md` with:

    ```markdown
    # service

    An HTTP service on axum with Postgres through sqlx and JWT bearer
    authentication.

    ## Run it

    It refuses to start without `DATABASE_URL`, `JWT_SECRET` (at least 32 bytes),
    `JWT_ISSUER` and `JWT_AUDIENCE`. `PORT` defaults to 8080. Migrations are
    embedded in the binary and run at startup.

    ## Test it

    The integration tests need a Postgres they can create databases in:
    `DATABASE_URL=postgres://... cargo test`. Without it they fail rather than
    skip.

    ## Add a route

    It needs a token unless its path is added to `PUBLIC_PATHS` in
    `src/auth.rs`. A handler that reads data takes `Caller` and filters on
    `caller.subject`. See `AGENTS.md`.
    ```

    Verify: `test -f README.md`

18. Resolve the dependencies and write the lock file, which is committed. The 2024 edition resolves against `rust-version`, so it picks versions that still build with 1.94 wherever one exists: `cargo generate-lockfile`
    Verify: `grep -A1 -x 'name = "axum"' Cargo.lock | grep -qx 'version = "0.8.9"'`

19. Check the formatting: `cargo fmt --check`
    Verify: `cargo fmt --check`

20. Check it for the mistakes the compiler allows, with warnings as errors: `cargo clippy --locked --all-targets -- -D warnings`
    Verify: `cargo clippy --locked --all-targets -- -D warnings`

21. Remove containers left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force rust-axum-service-db rust-axum-service-app > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps -aq --filter name=rust-axum-service-db --filter name=rust-axum-service-app)"`

22. Remove a network left behind by an earlier attempt: `docker network rm rust-axum-service-net > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker network ls -q --filter name=rust-axum-service-net)"`

23. Create the network the database and the service will share, so the service reaches the database by name: `docker network create rust-axum-service-net`
    Verify: `docker network inspect rust-axum-service-net > /dev/null`

24. Start Postgres on a port the operating system chooses. The password is for a container that lives for the length of this recipe: `docker run -d --name rust-axum-service-db --network rust-axum-service-net -e POSTGRES_PASSWORD=local-development-only-not-a-real-secret -p 127.0.0.1::5432 postgres:18.6-alpine`
    Verify: `test -n "$(docker ps -q --filter name=rust-axum-service-db)"`

25. Wait until it accepts TCP connections. The image first runs a temporary server that listens only on a socket, so asking over TCP is what tells initialisation from readiness: `for attempt in $(seq 1 60); do docker exec rust-axum-service-db pg_isready -h 127.0.0.1 -U postgres -q && break; sleep 1; done`
    Verify: `docker exec rust-axum-service-db pg_isready -h 127.0.0.1 -U postgres`

26. Read the port the operating system chose: `docker port rust-axum-service-db 5432 | head -1 > db.address`
    Verify: `test -s db.address`

27. Run the unit and integration tests against it. `#[sqlx::test]` creates a database per test, applies the migrations, and drops it afterwards: `DATABASE_URL="postgres://postgres:local-development-only-not-a-real-secret@$(cat db.address)/postgres" cargo test --locked`
    Verify: `DATABASE_URL="postgres://postgres:local-development-only-not-a-real-secret@$(cat db.address)/postgres" cargo test --locked`

28. Build the container image: `docker build --tag rust-axum-service:dev .`
    Verify: `docker image inspect rust-axum-service:dev > /dev/null`

29. Start the image with no configuration at all. It has to refuse, and say which variable is missing: `docker run --rm rust-axum-service:dev > refused.log 2>&1; echo "$?" > refused.code`
    Verify: `grep -qx '1' refused.code && grep -q 'DATABASE_URL is required' refused.log`

30. Start the service with its configuration, on a port the operating system chooses: `docker run -d --name rust-axum-service-app --network rust-axum-service-net -e DATABASE_URL="postgres://postgres:local-development-only-not-a-real-secret@rust-axum-service-db:5432/postgres" -e JWT_SECRET="local-development-only-not-a-real-secret" -e JWT_ISSUER="service" -e JWT_AUDIENCE="service" -p 127.0.0.1::8080 rust-axum-service:dev`
    Verify: `test -n "$(docker ps -q --filter name=rust-axum-service-app)"`

31. Read the port the operating system chose: `docker port rust-axum-service-app 8080 | head -1 > service.address`
    Verify: `test -s service.address`

32. Confirm the process is up. It listens only once the database has answered and the migrations have run, which is what the retries wait for: `curl -fsS --retry 30 --retry-all-errors --retry-delay 1 -o health.json "http://$(cat service.address)/health"`
    Verify: `grep -q '"status":"ok"' health.json`

33. Confirm it is ready, which proves the container reaches the database by its name on the shared network: `curl -fsS --retry 10 --retry-all-errors --retry-delay 1 -o ready.json "http://$(cat service.address)/ready"`
    Verify: `grep -q '"status":"ready"' ready.json`

34. Confirm a request with no token is refused with a problem document, by the image rather than by the test harness: `curl -sS -o refused.json -D refused.headers -w "%{http_code}" "http://$(cat service.address)/notes" > refused.http`
    Verify: `grep -qx '401' refused.http && grep -qi '^content-type: application/problem+json' refused.headers`

35. Read the user the container runs as: `docker inspect --format '{{.Config.User}}' rust-axum-service-app > container.user`
    Verify: `grep -qx 'nonroot:nonroot' container.user`

36. Stop it the way an orchestrator does, with SIGTERM. A process that ignored the signal would be killed after ten seconds and exit with 137: `docker stop rust-axum-service-app`
    Verify: `test "$(docker inspect --format '{{.State.ExitCode}}' rust-axum-service-app)" = 0`

37. Keep its log, which is one JSON object per line and ends with the shutdown: `docker logs rust-axum-service-app > service.log 2>&1`
    Verify: `grep -q '"message":"stopped"' service.log`

38. Remove the containers: `docker rm --force rust-axum-service-app rust-axum-service-db`
    Verify: `test -z "$(docker ps -aq --filter name=rust-axum-service-db --filter name=rust-axum-service-app)"`

39. Remove the network: `docker network rm rust-axum-service-net`
    Verify: `test -z "$(docker network ls -q --filter name=rust-axum-service-net)"`
