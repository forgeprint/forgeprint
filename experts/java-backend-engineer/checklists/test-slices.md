# Test slices

Spring Boot's test slices load just enough of the context to test one layer.
Use the narrowest slice that still exercises the proxy, the mapper or the
database you are testing — and a real PostgreSQL for anything that touches
SQL.

| #   | Check                                                                                                          | How                                                                                     | Source                                                            |
| --- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| TS1 | JUnit is the version Spring Boot manages, and one build task runs every layer                                  | read the build; `./gradlew test` or `./mvnw verify` runs all of them                    | Spring Boot 4.1.1 dependency versions (JUnit 6.0.3)               |
| TS2 | Every controller has a `@WebMvcTest` asserting a 400 problem response for an invalid and an unknown-field body | find the slice tests; count against controllers                                         | Spring Boot 4.1 — Testing, auto-configured MVC tests; RFC 9457 §3 |
| TS3 | Every mapped exception has a test asserting status, `type` and `application/problem+json`                      | count handler tests against the advice                                                  | RFC 9457 §3                                                       |
| TS4 | Repository and integration tests run on PostgreSQL through Testcontainers with `@ServiceConnection`            | grep `@ServiceConnection` and `PostgreSQLContainer`; grep for `h2` in test dependencies | Testcontainers for Java 2.0.5; Spring Boot 4.1 — Testcontainers   |
| TS5 | A test calls a `@Transactional` service method that fails after its first write and asserts nothing committed  | find the rollback test; it goes through the bean, not `new`                             | Spring Framework 7.0 — Using @Transactional                       |
| TS6 | A test throws a checked exception from a transactional method and asserts the rollback rule you declared       | find it next to TS5                                                                     | Spring Framework 7.0 — rollback rules                             |
| TS7 | A replayed idempotency key returns the first response and leaves one row                                       | find the replay test                                                                    | IETF draft idempotency-key-header-07                              |
| TS8 | Error Prone, NullAway and SpotBugs run in the build and fail it                                                | break one rule on purpose; the build must go red                                        | Error Prone 2.50; NullAway 0.14; SpotBugs 4.10                    |

## Why each one

**TS4** is what makes TS5 to TS7 mean anything. H2 in PostgreSQL mode accepts
SQL PostgreSQL rejects, rejects some it accepts, and locks differently; a
rollback or unique-constraint test that passes there is a test of H2.

**TS5** has to go through the Spring bean. A test that constructs the service
with `new` has no proxy, so it tests a method with no transaction and will pass
whether or not the annotation works.

**TS8** is where most of this expert's rows are enforced. A bug pattern that is
configured but only warns is a pattern nobody reads after the first week.
