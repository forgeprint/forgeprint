# Spring Boot REST API

A Spring Boot 4.1 API on Java 25: an OAuth2 resource server validating JWTs
against an issuer's JWK Set, Flyway migrations on PostgreSQL, OpenAPI
documentation, RFC 9457 problem details, integration tests on a Testcontainers
PostgreSQL, and a layered non-root container image.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real service on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- **Maven wrapper** pinned to Maven 3.9.16 with its SHA-256, so the build needs
  Java and nothing else installed. The wrapper scripts themselves are fetched
  from Maven Central and checked against a recorded checksum.
- **Spring Boot 4.1.1** through the starter parent, which pins Spring
  Framework 7, Spring Security 7, Jackson 3, Flyway, the PostgreSQL driver and
  Testcontainers together.
- **Authentication:** Spring Security as an OAuth2 resource server. RS256 only,
  keys from the issuer's JWK Set (fetched lazily and cached), and one validator
  that requires the issuer, the audience, an expiry and a subject. Everything
  except health and the OpenAPI document requires a valid token.
- **Object-level authorization:** every row has an owner, the owner is the
  token's subject, and every repository query filters on it. Another caller's
  item is a 404.
- **Validation and errors:** Bean Validation on request records, and
  `application/problem+json` responses (RFC 9457) for validation failures,
  missing rows and framework errors.
- **Migrations:** Flyway runs `db/migration` at startup, before the service
  accepts traffic. Plain SQL, no ORM, no schema generation — `JdbcClient` for
  queries.
- **API documentation:** springdoc-openapi 3.1 with the bearer scheme declared,
  so a generated client knows to send the token. Off unless
  `API_DOCS_ENABLED=true`.
- **Health:** Actuator exposes `health` only, with liveness (touches nothing)
  and readiness (includes the database) groups and no details.
- **Tests:** one integration test class against the real filter chain and a
  real PostgreSQL 18 from Testcontainers — no token is 401, a forged token,
  a wrong audience and an expired token are 401, a stranger cannot read or
  list another caller's item, an invalid body is a 400 problem detail, and the
  OpenAPI document declares the scheme.
- **Container:** layered image from the tested jar on `eclipse-temurin` 25 JRE,
  a fixed non-root UID, the heap sized from the container limit.
- **CI:** a GitHub Actions workflow with actions pinned by commit SHA,
  read-only permissions, `--strict-checksums`, tests and the image build.

## Options

None. The database is PostgreSQL and the token format is a JWT; each is the
shape of the code rather than a switch on it. Another database or opaque-token
introspection is a different project.

## What it fits

- A team that writes Java and wants a service that looks like what most Spring
  shops already run: Boot, Maven, Flyway, PostgreSQL, a bearer token from an
  existing identity provider.
- An API behind an identity provider that publishes a JWK Set — Keycloak, an
  Entra ID, Auth0, Okta or Cognito tenant, or your own authorization server.
- Per-user data, where the question "whose row is this" has to be answered on
  every read, and answered by the query rather than by the controller.
- A service deployed as a container to an orchestrator that uses liveness and
  readiness probes.

## What it is NOT for

- **Issuing tokens.** No login, no password storage, no refresh. Pair it with
  an identity provider; a service that verifies and a service that issues are
  usually two services.
- **Multi-tenant SaaS.** The owner is a single subject. Organisations, tenant
  isolation and per-tenant keys are a different design — see
  `dotnet-multitenant-saas-api` for what that takes.
- **Role or scope based authorization.** Any valid token may use any
  endpoint for its own data. Scopes (`hasAuthority("SCOPE_...")`) are the next
  step and are not set up.
- **Rate limiting** (OWASP API4:2023). Nothing bounds how often a caller can
  hit a route; the list endpoint is capped at 100 rows, which bounds the cost
  of one request and not the number of them. Put it behind a gateway that
  limits, or add it.
- **Browser clients calling it directly.** No CORS configuration.
- **Reactive stacks.** This is Spring MVC on servlet threads. WebFlux is a
  different programming model, not an option.
- **Kotlin or Gradle.** Both are fine choices; neither is this blueprint.

## Trade-offs made on your behalf

- **JWK Set URI rather than issuer discovery.** `issuer-uri` discovery fetches
  metadata at startup, so the service cannot start while the issuer is down.
  The JWK Set is fetched on the first token instead. The price: you configure
  two addresses rather than one.
- **The audience is required.** Spring's defaults do not check `aud`. Without
  it, any token the issuer mints for any other client is accepted here.
- **`JdbcClient` and SQL, not JPA.** The schema is the migrations, the queries
  are visible, and the owner filter is in the SQL where a reviewer sees it.
  The cost is writing SQL for every query; if the domain grows into rich
  object graphs, JPA is a reasonable move.
- **Testcontainers, not an in-memory database.** Tests need Docker and are
  slower to start, and they test PostgreSQL rather than an imitation of it.
- **The image is built from the jar Maven produced**, not by running Maven
  inside `docker build`. What was tested is what ships, and the build context
  is one file. The cost: `docker build` alone does not work on a clean
  checkout; `./mvnw verify` comes first.
- **A Dockerfile rather than Cloud Native Buildpacks.** `spring-boot:build-image`
  pulls builder images and a JDK from outside a package registry at build
  time; a Dockerfile says exactly what is in the image.
- **CSRF protection is off**, because there are no cookies. Adding a cookie
  based login means turning it back on.
- **The OpenAPI document is off by default.** It is an inventory of the API
  (OWASP API9:2023); publishing it is a decision.
- **No lock file.** Maven has none. The parent pins versions, the wrapper pins
  Maven with a SHA-256, and `--strict-checksums` checks each download against
  the repository's checksum, but nothing records a hash per artifact the way
  `go.sum` or a `package-lock.json` does.

## Cost of adoption

About fifteen minutes on a machine with Java 25 and Docker, most of it the
first download of Maven and the dependencies. Needs Java 25, Docker (for the
tests and the image) and curl. `unzip` should be present: without it the
wrapper downloads Maven as a `.tar.gz`, which does not match the recorded
checksum, and it stops.

## Compared with the alternatives here

- **`dotnet-web-api`** — the same shape in C#: bearer authentication, a
  database, a container and CI. It has database and auth options; this one
  adds object-level authorization, problem details and OpenAPI.
- **`fastapi-service`** — Python, with SQLAlchemy on PostgreSQL and bearer
  verification. Pick by language first; the designs agree.
- **`go-http-service`** and **`ts-http-service`** — smaller services in Go and
  TypeScript with bearer verification and no database.
