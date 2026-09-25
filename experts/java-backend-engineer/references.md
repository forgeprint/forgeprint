# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Versions come from Maven Central and from the `spring-boot-dependencies` 4.1.1
BOM. Property names and defaults were read from the configuration metadata
inside the Spring Boot 4.1.1 module jars. Behaviour was read from each
project's documentation or source. Everything was read on the date shown.
**Re-check every 90 days**, and when Spring Boot 4.2 reaches GA (4.2.0-M2 is
current).

> **Next re-check due: 2026-12-23.**

## Platform

| Reference                                                                                                                                                                | Version                                                                                   | Checked    | Used for                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| [OpenJDK — JDK project](https://openjdk.org/projects/jdk/)                                                                                                               | JDK 25 GA 2025-09-16 (LTS); 26 GA 2026-03-17; 27 GA 2026-09-15                            | 2026-09-24 | The Java 25 baseline in SKILL.md; `threads-and-pools.md` TP1 |
| [JEP 491 — Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491)                                                                                    | Delivered in JDK 24                                                                       | 2026-09-24 | TP1 — `synchronized` no longer pins on Java 25               |
| [Jakarta Validation 3.1](https://jakarta.ee/specifications/bean-validation/3.1/)                                                                                         | 3.1.1 (BOM); Hibernate Validator 9.1.3.Final                                              | 2026-09-24 | `bean-validation.md` BN4, BN5                                |
| [jackson-databind 3.x — DeserializationFeature](https://github.com/FasterXML/jackson-databind/blob/3.x/src/main/java/tools/jackson/databind/DeserializationFeature.java) | 3.1.5 (BOM); `FAIL_ON_UNKNOWN_PROPERTIES(false)`, "disabled by default as of Jackson 3.0" | 2026-09-24 | BN3                                                          |

## Spring Boot 4.1.1

| Reference                                                                                                              | Version                                                                                                                                                                                                                                                                                                 | Checked    | Used for                                                          |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| [Dependency versions](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)                | 4.1.1: Spring Framework 7.0.9, Hibernate ORM 7.4.5, HikariCP 7.0.2, Testcontainers 2.0.5, JUnit 6.0.3, SLF4J 2.0.18                                                                                                                                                                                     | 2026-09-24 | SKILL.md baseline; `test-slices.md` TS1                           |
| [Application properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)                | 4.1.1; read from module metadata: `spring.mvc.problemdetails.enabled` false, `spring.jpa.open-in-view` true, `spring.threads.virtual.enabled` false, `server.shutdown` graceful, `spring.lifecycle.timeout-per-shutdown-phase` 30s, `spring.http.clients.connect-timeout` and `read-timeout` no default | 2026-09-24 | PR1, TB6, TP1, TP6, SL1, SL2                                      |
| [JSON — Jackson](https://docs.spring.io/spring-boot/reference/features/json.html)                                      | 4.1.1; Jackson 2 support deprecated                                                                                                                                                                                                                                                                     | 2026-09-24 | BN3 — `spring.jackson.deserialization.*`; `use-jackson2-defaults` |
| [Validation](https://docs.spring.io/spring-boot/reference/io/validation.html)                                          | 4.1.1                                                                                                                                                                                                                                                                                                   | 2026-09-24 | BN2                                                               |
| [Externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)               | 4.1.1                                                                                                                                                                                                                                                                                                   | 2026-09-24 | BN6 — `@ConfigurationProperties` with `@Validated`                |
| [Graceful shutdown](https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html)                           | 4.1.1; enabled by default on all three embedded servers                                                                                                                                                                                                                                                 | 2026-09-24 | SL1, SL2                                                          |
| [Actuator endpoints — Kubernetes probes](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)         | 4.1.1                                                                                                                                                                                                                                                                                                   | 2026-09-24 | SL3, SL4 — liveness checks no external system                     |
| [Tracing — log correlation](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)                        | 4.1.1; Micrometer Tracing 1.7.1                                                                                                                                                                                                                                                                         | 2026-09-24 | SL6                                                               |
| [Logging — structured logging](https://docs.spring.io/spring-boot/reference/features/logging.html)                     | 4.1.1; formats `ecs`, `gelf`, `logstash`                                                                                                                                                                                                                                                                | 2026-09-24 | SL5, SL6                                                          |
| [Testing Spring Boot applications](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html) | 4.1.1                                                                                                                                                                                                                                                                                                   | 2026-09-24 | TS2 — `@WebMvcTest` and the other slices                          |
| [Testcontainers support](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html)                     | 4.1.1                                                                                                                                                                                                                                                                                                   | 2026-09-24 | TS4 — `@ServiceConnection`                                        |

## Spring Framework 7.0

| Reference                                                                                                                                         | Version                                                                    | Checked    | Used for                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| [Using @Transactional](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)                    | 7.0.9                                                                      | 2026-09-24 | TB1, TB3, TB4, TB5, TS5 — proxy mode, self-invocation, visibility       |
| [Rolling back a declarative transaction](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html) | 7.0.9                                                                      | 2026-09-24 | TB2, TS6 — only `RuntimeException` and `Error` roll back by default     |
| [Transaction-bound events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)                                  | 7.0.9                                                                      | 2026-09-24 | TB10                                                                    |
| [Error responses](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html)                                      | 7.0.9                                                                      | 2026-09-24 | PR2, PR3, PR5 — `ProblemDetail`, `ResponseEntityExceptionHandler`       |
| [MVC validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/validation.html)                                         | 7.0.9                                                                      | 2026-09-24 | BN1                                                                     |
| [Resilience features](https://docs.spring.io/spring-framework/reference/core/resilience.html)                                                     | 7.0.9; `@Retryable` retries any exception, 3 retries, 1 s delay by default | 2026-09-24 | TP4, TP7 — `@Retryable`, `@ConcurrencyLimit`, `@EnableResilientMethods` |

## Data access

| Reference                                                                                            | Version                                                                       | Checked    | Used for      |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------- | ------------- |
| [HikariCP — configuration](https://github.com/brettwooldridge/HikariCP)                              | 7.0.2 (BOM), 7.1.0 latest; `maximumPoolSize` 10, `connectionTimeout` 30000 ms | 2026-09-24 | TP2, TP3, TB5 |
| [Hibernate ORM 7.4 User Guide — fetching](https://docs.hibernate.org/orm/7.4/userguide/html_single/) | 7.4.5.Final (BOM)                                                             | 2026-09-24 | TB7           |

## Static analysis and tests

| Reference                                                                                           | Version                                                                                                          | Checked    | Used for                          |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------- |
| [Error Prone — bug patterns](https://errorprone.info/bugpatterns)                                   | 2.50.0; `UnusedException` and `InterruptedExceptionSwallowed` experimental, the others on by default as warnings | 2026-09-24 | PR6, PR7, PR8, TP5, TP9, SL8, TS8 |
| [NullAway](https://github.com/uber/NullAway)                                                        | 0.14.1                                                                                                           | 2026-09-24 | TP10, TS8                         |
| [JSpecify](https://jspecify.dev/)                                                                   | 1.0.1                                                                                                            | 2026-09-24 | TP10                              |
| [SpotBugs — bug descriptions](https://spotbugs.readthedocs.io/en/latest/bugDescriptions.html)       | 4.10.4; SQL patterns read from `etc/findbugs.xml` at the `4.10.4` tag                                            | 2026-09-24 | TB8, TS8                          |
| [Testcontainers for Java — PostgreSQL](https://java.testcontainers.org/modules/databases/postgres/) | 2.0.5                                                                                                            | 2026-09-24 | TS4                               |
| [JUnit](https://junit.org/)                                                                         | 6.0.3 managed by Boot 4.1.1; 6.1.3 latest                                                                        | 2026-09-24 | TS1                               |
| [SLF4J — FAQ, logging performance](https://www.slf4j.org/faq.html#logging_performance)              | 2.0.18 (BOM)                                                                                                     | 2026-09-24 | SL7 — parameterized messages      |

## HTTP and operations

| Reference                                                                                                               | Version                                       | Checked    | Used for                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)                                                     | June 2022, Internet Standard                  | 2026-09-24 | §9.2.2 idempotent methods — TB9, TP8                                                                   |
| [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)                                      | July 2023, obsoletes RFC 7807                 | 2026-09-24 | §3 — BN9, PR3, TS2, TS3; §5 — PR4                                                                      |
| [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/07/) | draft-07, 2025-10-15, **expired**             | 2026-09-24 | TB9, TS7. The clearest description of the convention; it never became a standard, and is cited as such |
| [W3C Trace Context](https://www.w3.org/TR/trace-context/)                                                               | Level 1, W3C Recommendation                   | 2026-09-24 | SL6                                                                                                    |
| [Kubernetes — Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)                         | Kubernetes 1.37; grace period 30 s by default | 2026-09-24 | SL2                                                                                                    |

## Tracked in `docs/review-standards.md`

Cited by chapter or factor in the checklists and not restated here.

| Standard                  | Version in `docs/review-standards.md` | Rows that cite it       |
| ------------------------- | ------------------------------------- | ----------------------- |
| OWASP ASVS                | 5.0.0 — V1, V2, V16                   | BN1, BN8, TB8, PR4, SL9 |
| OWASP API Security Top 10 | 2023 — API3, API4                     | BN4, BN5                |
| The Twelve-Factor App     | III Config                            | BN7                     |

The security review itself belongs to [`security-reviewer`](../security-reviewer/SKILL.md).
