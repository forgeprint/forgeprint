# Transaction boundaries

`@Transactional` is metadata. A proxy turns it into a transaction, and only
for calls that pass through the proxy. Most transaction bugs in a Spring
service are a call that did not.

| #    | Check                                                                                                                      | How                                                                                                                | Source                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| TB1  | No `@Transactional` method is called from another method of the same class                                                 | for each annotated method, grep its class for unqualified or `this.` calls to it                                   | Spring Framework 7.0 — Using @Transactional, proxy mode       |
| TB2  | Methods that throw checked exceptions declare `rollbackFor`, or the service throws only unchecked ones                     | read `throws` clauses on annotated methods                                                                         | Spring Framework 7.0 — Using @Transactional, rollback rules   |
| TB3  | Read paths are `@Transactional(readOnly = true)`                                                                           | read the query methods of each service                                                                             | Spring Framework 7.0 — Using @Transactional                   |
| TB4  | Transactions open in services, never in controllers                                                                        | grep `@Transactional` in `@RestController` classes                                                                 | Spring Framework 7.0 — Using @Transactional                   |
| TB5  | No HTTP call, broker publish or sleep inside a transactional method                                                        | read each annotated method's calls for clients and templates                                                       | HikariCP 7 — pool sizing; Spring Framework 7.0 — transactions |
| TB6  | `spring.jpa.open-in-view=false`                                                                                            | read `application.yaml`; the default is `true`                                                                     | Spring Boot 4.1 — `spring.jpa.open-in-view`                   |
| TB7  | Associations accessed after the transaction are fetched in it (fetch join or entity graph)                                 | run an integration test with TB6 set; a `LazyInitializationException` is the finding                               | Hibernate ORM 7.4 — fetching                                  |
| TB8  | SQL is parameterised; no string built from input reaches `JdbcTemplate`, `EntityManager` or `Statement`                    | SpotBugs `SQL_NONCONSTANT_STRING_PASSED_TO_EXECUTE` and `SQL_PREPARED_STATEMENT_GENERATED_FROM_NONCONSTANT_STRING` | SpotBugs 4.10; OWASP ASVS 5.0.0 V1                            |
| TB9  | An idempotency key is stored under a unique constraint in the same transaction as the write                                | read the create path; a replay test returns the first response and one row                                         | RFC 9110 §9.2.2; IETF draft idempotency-key-header-07         |
| TB10 | A publish after commit uses `@TransactionalEventListener(phase = AFTER_COMMIT)` or an outbox, not a call inside the method | grep publisher calls inside `@Transactional` methods                                                               | Spring Framework 7.0 — transaction-bound events               |

## Why each one

**TB1** is invisible in the code. `placeOrder()` calls `this.reserveStock()`,
which is annotated `REQUIRES_NEW`; the annotation reads as a decision and does
nothing, because the call never leaves the object.

**TB2** is the rule people least expect. A checked `PaymentDeclinedException`
thrown after two inserts commits both inserts. The default comes from EJB and
it has not changed.

**TB5** turns a slow partner into an outage. With virtual threads nothing else
limits concurrency, so every request waiting on the remote call holds a
connection, the pool empties, and requests that never touch the partner queue
for `connection-timeout`.
