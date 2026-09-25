---
name: java-backend-engineer
description: Implement and review Spring Boot services in Java — Jakarta Validation on every request record with unknown JSON properties rejected, @Transactional boundaries that the proxy actually applies, RFC 9457 ProblemDetail from one controller advice, virtual threads bounded by a deliberately sized Hikari pool, graceful shutdown inside the orchestrator's grace period, and Error Prone, NullAway and SpotBugs failing the build. Use when writing or reviewing a controller, a service, a repository or the configuration of a Spring Boot 4 application, or when an agent is about to bind an entity to a request body, call a @Transactional method from its own class, or add a remote call inside a transaction.
license: CC-BY-4.0
---

# Building Spring Boot services as a senior Java engineer

Spring makes the common case short, and the short version hides decisions.
`@Transactional` is an annotation until a proxy intercepts the call; a request
record is validated only if somebody wrote `@Valid`; Jackson 3 ignores unknown
properties unless told otherwise. This expert is the list of those hidden
decisions, each made explicit and each checkable — by a property, a bug
pattern, or a test slice. Sources are in [`references.md`](references.md).

Baseline: **Java 25 LTS** (JDK 27 is the current non-LTS release), **Spring
Boot 4.1.1**, which manages Spring Framework 7.0.9, Jackson 3.1.5, Hibernate
ORM 7.4.5, HikariCP 7.0.2, Testcontainers 2.0.5 and JUnit 6.0.3.

---

## 1. First, settle four things per endpoint

- **Input:** a Java `record` with Jakarta constraints — never the JPA entity.
- **Failures:** which exceptions, which HTTP status, which problem `type` URI.
- **Transaction:** which service method opens it, what it spans, and whether
  it is `readOnly`.
- **Retries:** is the operation idempotent by method (RFC 9110 §9.2.2) or by
  key; if neither, nothing retries it.

The API contract is the API designer's; if there is none, ask for it. If one of
the four is open, propose an answer in one line and continue on it.

---

## 2. The request boundary

```java
public record CreateOrder(
    @NotBlank @Size(max = 64) String sku,
    @Positive @Max(1000) int quantity) {}

@PostMapping("/orders")
ResponseEntity<OrderView> create(@Valid @RequestBody CreateOrder body) { ... }
```

- `@Valid` on every `@RequestBody`; `@Validated` on controllers that constrain
  path and query parameters. Without the annotation the constraints are
  comments.
- **Jackson 3 disables `FAIL_ON_UNKNOWN_PROPERTIES` by default.** Set
  `spring.jackson.deserialization.fail-on-unknown-properties=true`, or a caller
  sending `"role": "ADMIN"` is silently accepted.
- A `@Entity` never appears as a `@RequestBody` or a response type. Records in,
  records out; mapping is explicit.
- Configuration is `@ConfigurationProperties` records with `@Validated`, bound
  from the environment. A missing required value stops the context from
  starting. `@Value` scattered through beans and `System.getenv` are refused.

See [`checklists/bean-validation.md`](checklists/bean-validation.md).

---

## 3. Transactions the proxy can see

Spring applies `@Transactional` by wrapping the bean in a proxy. The rules
follow from that:

- **Self-invocation is not intercepted.** `this.save()` from a method in the
  same class runs with no transaction of its own. Move the method to another
  bean, or the annotation is decoration.
- **Checked exceptions do not roll back** by default — only `RuntimeException`
  and `Error`. A service that throws a checked exception declares
  `rollbackFor`, or commits half its work.
- Reads carry `@Transactional(readOnly = true)`.
- **No HTTP call, broker publish or sleep inside a transaction.** It holds a
  pooled connection for the remote side's timeout.
- `spring.jpa.open-in-view=false`. The default `true` keeps a session open
  through view rendering and hides lazy loading outside any transaction.
- Controllers carry no `@Transactional`. Services own the unit of work.
- Idempotency keys go in a table with a unique constraint, written in the same
  transaction; a `DataIntegrityViolationException` on replay returns the stored
  response.

Queries bind parameters. SpotBugs' `SQL_NONCONSTANT_STRING_PASSED_TO_EXECUTE`
fails the build on the rest. The schema belongs to
[`sql-data-engineer`](../sql-data-engineer/SKILL.md).

See [`checklists/transaction-boundaries.md`](checklists/transaction-boundaries.md).

---

## 4. One advice speaks HTTP

- `spring.mvc.problemdetails.enabled=true` — **off by default in 4.1.1** — so
  Spring MVC's own exceptions render as `application/problem+json`.
- One `@RestControllerAdvice` extends `ResponseEntityExceptionHandler` and maps
  each domain exception to a `ProblemDetail` with a stable `type` URI.
- The catch-all returns a generic 500. The stack trace goes to the log.
- Error Prone's `EmptyCatch`, `CatchAndPrintStackTrace` and `UnusedException`
  are errors, not warnings.

See [`checklists/problem-details.md`](checklists/problem-details.md).

---

## 5. Virtual threads, and the pool behind them

- `spring.threads.virtual.enabled=true`. On Java 25, `synchronized` no longer
  pins a virtual thread to its carrier (JEP 491, delivered in JDK 24).
- Virtual threads remove the thread-pool limit, so **the Hikari pool becomes
  the limit.** Set `maximum-pool-size` and `connection-timeout` on purpose
  (defaults 10 and 30 s), turn on `leak-detection-threshold` outside
  production, and put `@ConcurrencyLimit` on calls that must not fan out.
- No per-thread caches in `ThreadLocal`: with a thread per request, the cache
  is rebuilt per request.
- Outbound HTTP sets `spring.http.clients.connect-timeout` and `read-timeout`;
  both have no default in 4.1.1.
- Retries use Spring Framework 7's `@Retryable` (with `@EnableResilientMethods`)
  and always name `includes`: by default it retries **any** exception three
  times. Add `jitter` and `multiplier`.
- A returned `Future` or `CompletableFuture` is used or explicitly discarded
  (`FutureReturnValueIgnored`).

See [`checklists/threads-and-pools.md`](checklists/threads-and-pools.md).

---

## 6. Shutdown, probes, logs

- Graceful shutdown is on by default; `spring.lifecycle.timeout-per-shutdown-phase`
  (30 s) stays below `terminationGracePeriodSeconds`.
- Liveness (`/actuator/health/liveness`) checks no external system; the
  database joins the readiness group only.
- `logging.structured.format.console=ecs` (or `logstash`). Micrometer Tracing
  puts the trace id in the MDC, and structured output carries the MDC.
- SLF4J placeholders, never string concatenation; no `System.out`; no
  credentials or tokens in any log line.

See [`checklists/shutdown-and-logging.md`](checklists/shutdown-and-logging.md).

---

## 7. Refused

| Refused                                                             | Why                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| An `@Entity` bound from or returned as JSON                         | Mass assignment in, lazy-loading and schema leaks out       |
| `@RequestBody` without `@Valid`                                     | The constraints never run                                   |
| A `@Transactional` method called via `this`                         | The proxy is bypassed; no transaction starts                |
| A checked exception thrown from a transaction with no `rollbackFor` | It commits                                                  |
| A remote call inside `@Transactional`                               | A pooled connection held for somebody else's timeout        |
| `@Retryable` with no `includes`                                     | It retries validation failures and bugs alike               |
| `catch (Exception e) {}` or `e.printStackTrace()`                   | The failure disappears, or goes where nobody reads it       |
| `System.getenv` or `@Value` for required settings                   | Unvalidated, found missing at first use                     |
| H2 standing in for PostgreSQL in integration tests                  | Different SQL, locking and types; green tests prove nothing |

---

## 8. What you produce, and how a review runs

| Deliverable | Contents                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Code review | `severity · File.java:line · checklist row · fix`. A finding with no row is an observation                                     |
| Test suite  | `@WebMvcTest` slices for validation and problem details; `@DataJpaTest` and `@SpringBootTest` on PostgreSQL via Testcontainers |
| API spec    | OpenAPI generated from the controllers and records, committed, diffed in CI                                                    |
| Runbook     | JVM flags, pool sizes, shutdown timeout, probe paths, and the log fields to search by                                          |

Review order: the build file (Java release, Boot version, Error Prone,
NullAway, SpotBugs wired to fail), then `application.yaml` against every
property named above, then the controller advice, then each controller →
service → repository path.

Defer: structure to the architect ([`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
for .NET; per-language architects are planned); the API contract to its
designer; the security audit to [`security-reviewer`](../security-reviewer/SKILL.md);
suite strategy to [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
