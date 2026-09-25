# Thread model

Java 21 made virtual threads final and Java 24 removed their worst pinning
case. Whether a service uses them is now an architecture decision with
consequences for every pool and every `ThreadLocal`.

| #   | Check                                                                                                             | How                                                                                                                            | Source                                                |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| TH1 | The thread model is recorded, and `spring.threads.virtual.enabled` matches it                                     | the ADR; grep `application.*`                                                                                                  | Spring Boot 4.1 — SpringApplication: virtual threads  |
| TH2 | Every bounded resource has an explicit bound: connection pools, semaphores, rate limits                           | read pool sizes in configuration; compare with the expected concurrency                                                        | JEP 444 — Virtual threads                             |
| TH3 | No virtual threads are pooled                                                                                     | `grep -rn "newFixedThreadPool\|newCachedThreadPool" --include=*.java`; virtual threads use `newVirtualThreadPerTaskExecutor()` | JEP 444 — Virtual threads                             |
| TH4 | `synchronized` is not rewritten for virtual threads on Java 24+                                                   | check the JDK floor before accepting a "pinning" refactor                                                                      | JEP 491 — Synchronize virtual threads without pinning |
| TH5 | `ThreadLocal` is not used as a per-thread cache under virtual threads                                             | `grep -rn "ThreadLocal" --include=*.java src/main`                                                                             | JEP 444 — Virtual threads                             |
| TH6 | Request-scoped context crosses threads as a `ScopedValue`, not an inherited `ThreadLocal`                         | read how context is propagated to child tasks                                                                                  | JEP 506 — Scoped values                               |
| TH7 | Every `ExecutorService` is closed by its owner (`try`-with-resources or a lifecycle hook)                         | `grep -rn "Executors\\." --include=*.java src/main`; find each close                                                           | Java 25 API — `ExecutorService`                       |
| TH8 | Graceful shutdown (the default) is not switched off, and `spring.lifecycle.timeout-per-shutdown-phase` is set     | grep `application.*` for `server.shutdown=immediate` and the timeout                                                           | Spring Boot 4.1 — graceful shutdown                   |
| TH9 | With virtual threads and no non-daemon thread, `spring.main.keep-alive=true` keeps a scheduler-only process alive | grep `application.*`                                                                                                           | Spring Boot 4.1 — SpringApplication: virtual threads  |

## Why each one

**TH2** is the one virtual threads make urgent. With a platform thread pool of
two hundred, the pool was the bound; with a thread per task, ten thousand
requests reach the ten-connection database pool at once, and the bound that
used to be implicit has to be written down.

**TH3** because pooling defeats the design: virtual threads are cheap to create
and meant to be created per task. A pool of them adds a queue in front of a
resource that had none.

**TH4** is a correction to advice that was right in 2023. JEP 491 in JDK 24
lets a virtual thread block inside `synchronized` without pinning its carrier,
so on Java 25 a refactor from `synchronized` to `ReentrantLock` for that
reason alone is churn.
