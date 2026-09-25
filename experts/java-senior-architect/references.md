# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. Library and plugin versions were read from Maven Central, Gradle's
version service and the vendors' documentation on the date shown. **Re-check
every 90 days**, and at two known dates: Spring Boot 4.0 leaves open-source
support on 2026-12-31, and the next Java LTS (JDK 29) is due in September 2027.

> **Next re-check due: 2026-12-23.**

## Language and platform

| Reference                                                                                                                                    | Version                                             | Checked    | Used for                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| [Oracle Java SE support roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html)                                      | JDK 25 LTS (25.0.4.1); JDK 27 non-LTS GA 2026-09-15 | 2026-09-24 | The target in SKILL.md, and §1 decision 2                                |
| [JDK 25 project page](https://openjdk.org/projects/jdk/25/)                                                                                  | GA 2025-09-16                                       | 2026-09-24 | TM7 — which JEPs are final and which are preview (JEP 505 fifth preview) |
| [JEP 395 — Records](https://openjdk.org/jeps/395)                                                                                            | final in JDK 16                                     | 2026-09-24 | TM1, TM8, ST5                                                            |
| [JEP 409 — Sealed classes](https://openjdk.org/jeps/409)                                                                                     | final in JDK 17                                     | 2026-09-24 | TM2                                                                      |
| [JEP 441 — Pattern matching for switch](https://openjdk.org/jeps/441)                                                                        | final in JDK 21                                     | 2026-09-24 | TM3 — exhaustiveness over sealed types                                   |
| [JEP 444 — Virtual threads](https://openjdk.org/jeps/444)                                                                                    | final in JDK 21                                     | 2026-09-24 | TH2, TH3, TH5                                                            |
| [JEP 491 — Synchronize virtual threads without pinning](https://openjdk.org/jeps/491)                                                        | final in JDK 24                                     | 2026-09-24 | SKILL.md §6; TH4                                                         |
| [JEP 506 — Scoped values](https://openjdk.org/jeps/506)                                                                                      | final in JDK 25                                     | 2026-09-24 | SKILL.md §6; TH6                                                         |
| [Java Language Specification, Java SE 25 — §7.7 module declarations](https://docs.oracle.com/javase/specs/jls/se25/html/jls-7.html#jls-7.7)  | SE 25                                               | 2026-09-24 | MR1, MR9                                                                 |
| [Java SE 25 API — `Optional`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Optional.html)                          | SE 25                                               | 2026-09-24 | TM6 — "primarily intended for use as a method return type"               |
| [Java SE 25 API — `ExecutorService`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ExecutorService.html) | SE 25                                               | 2026-09-24 | TH7 — `close()` and try-with-resources                                   |

## Architecture enforcement

| Reference                                                                                                          | Version            | Checked    | Used for                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| [Spring Modulith — verifying module structure](https://docs.spring.io/spring-modulith/reference/verification.html) | 2.1.1              | 2026-09-24 | SKILL.md §2; MR1–MR4 — `ApplicationModules.verify()`                                        |
| [Spring Modulith — fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html)               | 2.1.1              | 2026-09-24 | SW5 — top-level packages as application modules                                             |
| [Spring Modulith — working with application events](https://docs.spring.io/spring-modulith/reference/events.html)  | 2.1.1              | 2026-09-24 | MR8, ST7, ST8 — `@ApplicationModuleListener`, after-commit events                           |
| [ArchUnit user guide](https://www.archunit.org/userguide/html/000_Index.html)                                      | 1.5.0 (2026-08-04) | 2026-09-24 | SKILL.md §2; MR1, MR4–MR7 — layered architecture, slices, `noClasses()`, `FreezingArchRule` |

## Build

| Reference                                                                                                               | Version                       | Checked    | Used for                                                      |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------- | ------------------------------------------------------------- |
| [Maven — release history](https://maven.apache.org/docs/history.html)                                                   | 3.9.16 current; 4.0.0 at RC 6 | 2026-09-24 | The Maven line this expert targets                            |
| [Maven Enforcer — built-in rules](https://maven.apache.org/enforcer/enforcer-rules/index.html)                          | maven-enforcer-plugin 3.6.3   | 2026-09-24 | SKILL.md §3; BR2–BR5                                          |
| [Maven — configuring for reproducible builds](https://maven.apache.org/guides/mini/guide-reproducible-builds.html)      | current at check              | 2026-09-24 | BR6, BR7 — `project.build.outputTimestamp`, no version ranges |
| [Maven Artifact Plugin](https://maven.apache.org/plugins/maven-artifact-plugin/)                                        | 3.7.0                         | 2026-09-24 | BR7, BR8 — `check-buildplan`, `compare`                       |
| [Maven Wrapper](https://maven.apache.org/tools/wrapper/)                                                                | maven-wrapper-plugin 3.3.4    | 2026-09-24 | BR1 — `distributionSha256Sum`                                 |
| [Gradle — the Gradle wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html)                            | Gradle 9.8.0                  | 2026-09-24 | BR1                                                           |
| [Gradle — working with files: reproducible archives](https://docs.gradle.org/current/userguide/working_with_files.html) | Gradle 9.8.0                  | 2026-09-24 | SKILL.md §3 — archives reproducible by default since 9.0      |
| [Gradle — dependency locking](https://docs.gradle.org/current/userguide/dependency_locking.html)                        | Gradle 9.8.0                  | 2026-09-24 | BR9                                                           |
| [Gradle — resolution strategy](https://docs.gradle.org/current/userguide/resolution_strategy_tuning.html)               | Gradle 9.8.0                  | 2026-09-24 | BR3 — `failOnVersionConflict()`                               |
| [Gradle — toolchains](https://docs.gradle.org/current/userguide/toolchains.html)                                        | Gradle 9.8.0                  | 2026-09-24 | BR5                                                           |

## Static analysis

| Reference                                                | Version | Checked    | Used for                                      |
| -------------------------------------------------------- | ------- | ---------- | --------------------------------------------- |
| [JSpecify](https://jspecify.dev/docs/start-here/)        | 1.0.1   | 2026-09-24 | SKILL.md §4; TM4 — `@NullMarked`, `@Nullable` |
| [NullAway](https://github.com/uber/NullAway)             | 0.14.1  | 2026-09-24 | TM5                                           |
| [Error Prone](https://errorprone.info/docs/installation) | 2.50.0  | 2026-09-24 | TM5 — running NullAway as a compiler plugin   |

## Spring

| Reference                                                                                                                                           | Version                              | Checked    | Used for                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------- | ----------------------------------------------------------------------------- |
| [Spring Boot — system requirements and support](https://spring.io/projects/spring-boot#support)                                                     | 4.1.1; 4.0 OSS support to 2026-12-31 | 2026-09-24 | SKILL.md §1 decision 2                                                        |
| [Spring Framework — null-safety](https://docs.spring.io/spring-framework/reference/core/null-safety.html)                                           | 7.0.9                                | 2026-09-24 | TM5 — JSpecify and NullAway in Spring Framework 7                             |
| [Spring Framework — dependency injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)     | 7.0.9                                | 2026-09-24 | SW1, SW6 — constructor-based DI recommended                                   |
| [Spring Framework — using `@Transactional`](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html) | 7.0.9                                | 2026-09-24 | SKILL.md §5; ST1–ST3, ST6 — proxy mode, self-invocation, `readOnly`, rollback |
| [Spring Boot — externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)                              | 4.1.1                                | 2026-09-24 | SW2–SW4 — `@ConfigurationProperties`, records, `@Validated`                   |
| [Spring Boot — SpringApplication](https://docs.spring.io/spring-boot/reference/features/spring-application.html)                                    | 4.1.1                                | 2026-09-24 | TH1, TH9 — virtual threads, `keep-alive`                                      |
| [Spring Boot — common application properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)                        | 4.1.1                                | 2026-09-24 | SW7 — `spring.main.allow-circular-references`, default `false`                |
| [Spring Boot — profiles](https://docs.spring.io/spring-boot/reference/features/profiles.html)                                                       | 4.1.1                                | 2026-09-24 | SW8                                                                           |
| [Spring Boot — SQL databases (Open EntityManager in View)](https://docs.spring.io/spring-boot/reference/data/sql.html)                              | 4.1.1                                | 2026-09-24 | SKILL.md §5; ST4, ST5                                                         |
| [Spring Boot — graceful shutdown](https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html)                                          | 4.1.1                                | 2026-09-24 | TH8 — on by default; `timeout-per-shutdown-phase`                             |
| [Spring Boot — dependency management](https://docs.spring.io/spring-boot/reference/using/build-systems.html)                                        | 4.1.1                                | 2026-09-24 | BR10                                                                          |

## Architecture

| Reference                                                                                                                  | Version          | Checked    | Used for                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------- |
| [Architecture decision records — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011   | 2026-09-24 | SKILL.md §1; Alternatives is this catalog's addition |
| [C4 model](https://c4model.com/)                                                                                           | current at check | 2026-09-24 | SKILL.md §8 — Context and Container only             |

## Deferred to elsewhere

- Spring Security, authentication, secrets and dependency vulnerabilities:
  [`docs/review-standards.md`](../../docs/review-standards.md) and
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Schema design, migrations and query plans:
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- Images, CI and supply chain: the SLSA and NIST SSDF rows in
  `docs/review-standards.md`, and [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
