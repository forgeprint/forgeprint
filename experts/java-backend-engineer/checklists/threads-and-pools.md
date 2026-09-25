# Threads and pools

Virtual threads make threads cheap. They do not make connections cheap, and
once the thread limit is gone the connection pool is the limit — sized by
default, unless somebody sized it.

| #    | Check                                                                                                  | How                                                                                   | Source                                                               |
| ---- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| TP1  | The service runs on Java 25 or later with `spring.threads.virtual.enabled=true`                        | read the toolchain version and `application.yaml`                                     | Spring Boot 4.1 — `spring.threads.virtual.enabled`; JEP 491 (JDK 24) |
| TP2  | `spring.datasource.hikari.maximum-pool-size` and `connection-timeout` are set, not left at 10 and 30 s | read `application.yaml`                                                               | HikariCP 7 — configuration                                           |
| TP3  | `leak-detection-threshold` is set in non-production profiles                                           | read the profile files                                                                | HikariCP 7 — configuration                                           |
| TP4  | Calls that must not fan out without limit carry `@ConcurrencyLimit`                                    | read the adapters for downstreams with their own limits                               | Spring Framework 7.0 — Resilience features                           |
| TP5  | No `ThreadLocal` used as a per-thread cache of expensive objects                                       | grep `ThreadLocal`; Error Prone `ThreadLocalUsage`                                    | Error Prone 2.50 — ThreadLocalUsage                                  |
| TP6  | `spring.http.clients.connect-timeout` and `read-timeout` are set, or each client sets both             | read `application.yaml` and each `RestClient` builder; neither property has a default | Spring Boot 4.1 — `spring.http.clients.*`                            |
| TP7  | Every `@Retryable` names `includes`, and sets `jitter` and `multiplier`                                | grep `@Retryable`; by default it retries any exception three times with a fixed delay | Spring Framework 7.0 — Resilience features                           |
| TP8  | Retried operations are idempotent, or carry an idempotency key                                         | read what each retried method writes                                                  | RFC 9110 §9.2.2                                                      |
| TP9  | No returned `Future` or `CompletableFuture` is ignored                                                 | Error Prone `FutureReturnValueIgnored` as an error                                    | Error Prone 2.50 — FutureReturnValueIgnored                          |
| TP10 | NullAway runs with JSpecify annotations and fails the build                                            | read the build; annotate a package `@NullMarked` and pass a null                      | NullAway 0.14; JSpecify 1.0                                          |

## Why each one

**TP2** is where virtual threads change the arithmetic. With a platform thread
pool of 200 and a Hikari pool of 10, the thread pool shed load first. With
virtual threads, a thousand requests reach `getConnection()`, ten proceed, and
the rest wait thirty seconds before failing.

**TP7** follows from a default. `@Retryable` with no attributes retries on
every exception — including a validation failure that will fail identically
three more times, and a bug that now runs four times.

**TP1** cites JEP 491 because it removes the usual reason to avoid virtual
threads. Before JDK 24, blocking inside `synchronized` pinned the carrier
thread; on Java 25 it does not.
