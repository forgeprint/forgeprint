# Spring transactions

`@Transactional` is applied by a proxy. The annotation promises a transaction;
whether one exists depends on how the method was reached, which the annotation
cannot see.

| #   | Check                                                                                                         | How                                                                             | Source                                                |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| ST1 | No `@Transactional` method is reached only through `this`                                                     | for each annotated method, find its callers; one in the same class is a finding | Spring Framework 7 — using `@Transactional`           |
| ST2 | `@Transactional` sits on the application service, not on controllers or repositories                          | `grep -rn "@Transactional" --include=*.java` and note the layer                 | Spring Framework 7 — using `@Transactional`           |
| ST3 | Read paths are `@Transactional(readOnly = true)`                                                              | read the query methods of each service                                          | Spring Framework 7 — using `@Transactional`           |
| ST4 | `spring.jpa.open-in-view` is set to `false`                                                                   | grep `application.*`                                                            | Spring Boot 4.1 — Open EntityManager in View          |
| ST5 | No JPA entity is returned from a controller or published in an event                                          | read controller return types and event payloads                                 | Spring Boot 4.1 — Open EntityManager in View; JEP 395 |
| ST6 | Rollback rules are explicit for checked exceptions that must roll back                                        | `rollbackFor` where a checked exception signals failure                         | Spring Framework 7 — using `@Transactional`           |
| ST7 | No remote call (HTTP, broker) inside a transaction                                                            | read each transactional method for clients                                      | Spring Modulith 2.1 — working with events             |
| ST8 | Cross-module side effects run after commit, via `@ApplicationModuleListener` or `@TransactionalEventListener` | read how modules react to each other's changes                                  | Spring Modulith 2.1 — working with events             |

## Why each one

**ST1** is the failure Spring's documentation calls out itself: in proxy mode,
only calls coming in through the proxy are intercepted. A public method that
calls its own `@Transactional` sibling runs that sibling with no transaction,
and the partial write it was meant to prevent happens silently.

**ST4** because Spring Boot enables Open EntityManager in View by default in a
web application. Lazy associations then load during serialisation, outside any
transaction the service designed, one query per row — and the service layer's
transaction boundary stops being the real one.

**ST7** because a transaction open across a network call holds its locks and
its connection for the remote side's timeout, and under load that empties the
pool.
