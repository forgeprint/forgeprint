# Changelog — spring-boot-api

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.0 — 2026-09-24

First version.

A Spring Boot 4.1.1 API on Java 25: an OAuth2 resource server validating
RS256 JWTs from an issuer's JWK Set, Bean Validation and RFC 9457 problem
details at the boundary, Flyway migrations on PostgreSQL through `JdbcClient`,
springdoc-openapi 3.1.1, Actuator health probes, integration tests against a
Testcontainers PostgreSQL 18.6, a layered non-root image on
`eclipse-temurin:25.0.4_7-jre-noble`, and a CI workflow.

**Drafted by a tool** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where Java had no blueprint at all against 29.4% of developers in the Stack
Overflow survey and Spring at 65% of Java developers. Its recipe runs in CI
like every other; nobody has run a service on it by hand, so it is
`tier: community` and `provenance: generated` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Every version was read from Maven Central's `maven-metadata.xml` or Docker Hub
on 2026-09-24: Spring Boot 4.1.1 (the newest GA; 4.2 is at a milestone),
springdoc 3.1.1 (built against Boot 4.1.0), Maven 3.9.16 (4.0 is still a
release candidate), Maven wrapper 3.3.4, Testcontainers 2.0.5 and Flyway 12.4.0
as managed by the Boot parent.

Decisions worth recording:

- **Object-level authorization is in the SQL.** Every repository method takes
  the caller's subject, and another caller's item is a 404. The test
  `anotherCallerCannotReadOrListIt` proves it (OWASP API1:2023).
- **The audience and an expiry are required.** Spring Security's default JWT
  validators check neither; `TokenRules` adds both, and the tests build their
  decoder with the same validator so they exercise production's rules.
- **JWK Set URI rather than issuer discovery**, so the service starts while
  the issuer is unreachable and fetches keys on the first token.
- **Configuration fails closed.** No default for the datasource or the token
  settings; `TokenSettings` is `@Validated`.
- **Integrity for the build tool.** The wrapper archive is checked against a
  recorded SHA-256, the wrapper checks Maven's, and the build runs with
  `--strict-checksums`. Maven has no lock file; `overview.md` says so.

### Planned

- Rate limiting, scopes, CORS and multi-tenancy are deliberately absent and
  listed under "What it is NOT for".
- A test that walks the handler mappings, if the permit list ever grows past
  health and the API document.
