# Spring Boot REST API — agent context

A Spring Boot 4.1 API on Java 25 that accepts OAuth2 bearer tokens, stores its
data in PostgreSQL through Flyway-managed migrations, and reports errors as RFC
9457 problem details. Read this before adding an endpoint, a table or a
dependency.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/main/java/com/example/service/
  Application.java                 @SpringBootApplication + @ConfigurationPropertiesScan
  OpenApiConfig.java               the bearer scheme the OpenAPI document advertises
  security/SecurityConfig.java     the filter chain and the JwtDecoder: the only public paths
  security/TokenSettings.java      app.token.*, validated at startup
  security/TokenRules.java         the one definition of an acceptable token
  items/ItemController.java        HTTP only: reads the caller, validates the body
  items/ItemRepository.java        SQL only, every query filtered by owner
  items/Item.java, CreateItemRequest.java
src/main/resources/
  application.yaml                 no secrets, no environment-specific values
  db/migration/V1__create_items.sql
src/test/java/com/example/service/
  ApiTest.java                     the whole app + filter chain + real PostgreSQL
  TestTokens.java                  a key pair generated per run, the production validator
  TestcontainersConfiguration.java the pinned postgres image, via @ServiceConnection
```

A feature is a package (`items`): controller, repository and records together.
Security is its own package because nothing in a feature is allowed to decide
who the caller is.

## Rules that are not style preferences

**Deny by default.** `SecurityConfig` lists the public paths — health and the
OpenAPI document — and ends with `.anyRequest().authenticated()`. A new
controller is protected without touching this file. Adding a path to the
`permitAll()` list is the only way to make something public, and it needs a
reason in the comment beside it. Never replace `anyRequest().authenticated()`
with `permitAll()` "for now": the test `aPathNobodyMappedIsRefusedRatherThanFound`
exists to fail when somebody does.

**The caller is the `Jwt` principal's subject, and nothing else.** Read it with
`@AuthenticationPrincipal Jwt caller` and pass `caller.getSubject()` down. Never
take an owner, user id or tenant from the request body, a query parameter or a
header: that is how one caller reads another's data (OWASP API1:2023).

**Every repository method takes the owner.** `ItemRepository` has no
"find by id" without an owner, so a controller cannot forget the check. When
you add a table, give it an `owner` column and keep this property: the WHERE
clause is the authorization.

**Somebody else's row is 404, not 403.** A 403 confirms the id exists.

**`TokenRules` is the only definition of a valid token.** Issuer, audience,
expiry required, subject required, and RS256 enforced by the decoder. The
tests build their decoder with the same validator; if you add a claim rule,
add it there so the tests exercise it. Removing the audience check leaves code
that still looks correct and accepts tokens minted for any other service at
the same issuer.

**Configuration fails closed at startup.** `TokenSettings` is `@Validated`
with no defaults, and the datasource has none either. A missing
`APP_TOKEN_*` or `SPRING_DATASOURCE_*` variable stops the process before it
listens. Do not add a default to "make it start locally" — pass the variable.

**Validate at the boundary.** Request bodies are records with Bean Validation
annotations, taken with `@Valid`. A constraint that exists in the database
(the `CHECK` on `name`) exists on the record too, so the client gets a 400
problem detail instead of a 500.

**Errors are problem details.** `spring.mvc.problemdetails.enabled` renders
framework exceptions as `application/problem+json`. Throw
`ResponseStatusException` or an `ErrorResponseException` subclass; do not
build ad-hoc error maps, and never put an exception message, SQL or a stack
trace in a response.

**Migrations are append-only.** Add `V2__...sql`; never edit a file that has
run anywhere. Flyway checksums applied migrations and refuses to start when one
changes. There is no `ddl-auto`, no JPA schema generation: the SQL files are
the schema.

**Liveness touches nothing; readiness includes the database.** A slow database
must not get the process restarted, and it must stop traffic arriving. Only
`health` is exposed from Actuator; exposing `env`, `beans` or `heapdump`
publishes the inside of the process.

**The OpenAPI document is off unless `API_DOCS_ENABLED=true`.** It lists every
route. Turning it on in production is allowed; doing it by accident is not.

**Versions come from the Spring Boot parent.** Do not write a `<version>` on a
dependency Spring Boot manages; it stops moving when the parent is upgraded
and the two drift apart. `springdoc.version` is the exception because Spring
Boot does not manage it.

## Commands

```
./mvnw -B -ntp verify                 build, test (needs Docker), package target/service.jar
./mvnw -B -ntp test -Dtest=ApiTest    one test class
docker build -t service:dev .         image from target/service.jar
```

The tests start PostgreSQL through Testcontainers, so Docker must be running.
There is no in-memory database profile, on purpose: the migrations, `uuid`,
`timestamptz` and the `CHECK` constraint are PostgreSQL's.

## When you are asked to add an endpoint

1. A method on a controller in the feature's package. It is authenticated
   already.
2. The caller from `@AuthenticationPrincipal Jwt`; the owner is its subject.
3. A request record with validation annotations, taken with `@Valid`.
4. A repository method that takes the owner and filters on it.
5. A schema change as a new `V<n>__*.sql`.
6. Tests in `ApiTest` (or a sibling): no token is 401, another caller's data is
   404 or absent, an invalid body is a 400 problem detail.

## What this does not do

No token issuance or login, no roles or scopes beyond "authenticated", no
multi-tenancy, no rate limiting, no CORS, no pagination beyond a fixed page of
100, no metrics or tracing beyond Actuator health. TLS terminates in front of
the service.
