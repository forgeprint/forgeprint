# Shutdown and logging

Spring Boot already drains requests on shutdown and can already emit JSON
logs. What is left is making the numbers agree with the orchestrator and making
sure every line can be found again.

| #   | Check                                                                                             | How                                                                                 | Source                                                                           |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| SL1 | `server.shutdown` is not set to `immediate`                                                       | read `application.yaml`; the default is `graceful`                                  | Spring Boot 4.1 — Graceful shutdown                                              |
| SL2 | `spring.lifecycle.timeout-per-shutdown-phase` is below the pod's `terminationGracePeriodSeconds`  | compare the property (default 30 s) with the manifest (default 30 s)                | Spring Boot 4.1 — Graceful shutdown; Kubernetes 1.37 — pod termination           |
| SL3 | Liveness uses `/actuator/health/liveness` and includes no external system                         | read `management.endpoint.health.group.liveness.include`                            | Spring Boot 4.1 — Kubernetes probes                                              |
| SL4 | The database is in the readiness group, and readiness is what the load balancer or Service checks | read the readiness group and the probe configuration                                | Spring Boot 4.1 — Kubernetes probes                                              |
| SL5 | `logging.structured.format.console` is `ecs` or `logstash`                                        | read `application.yaml`                                                             | Spring Boot 4.1 — Structured logging                                             |
| SL6 | The trace id appears in every log line of a request                                               | send a request with `traceparent`; find its trace id in the JSON logs               | Spring Boot 4.1 — Micrometer Tracing, log correlation; W3C Trace Context Level 1 |
| SL7 | Log calls use SLF4J placeholders, never concatenation or `String.format`                          | grep logger calls whose message is built with `+` or `String.format`                | SLF4J 2.0 — parameterized logging                                                |
| SL8 | No `System.out`, `System.err` or `printStackTrace` in `src/main`                                  | grep all three                                                                      | Error Prone 2.50 — CatchAndPrintStackTrace                                       |
| SL9 | No authorization header, cookie, password or token value reaches a log line                       | read request-logging filters and any `toString()` on records that carry credentials | OWASP ASVS 5.0.0 V16                                                             |

## Why each one

**SL2** is two defaults that happen to be equal. Thirty seconds for Spring's
shutdown phase and thirty for Kubernetes' grace period leave no room for the
pre-stop delay or JVM exit; the kubelet's SIGKILL can land mid-drain. The
Spring value has to be the smaller one.

**SL3** is the cascading-failure rule from Spring Boot's own documentation. A
liveness probe that checks the database restarts every instance at once when
the database blips.

**SL9** usually fails through a `record`. Its generated `toString()` prints
every component, so a request record holding a password is logged in full by
any `log.debug("{}", body)`.
