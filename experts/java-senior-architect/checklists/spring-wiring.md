# Spring wiring

The container builds the object graph; the design decides what the graph is
allowed to look like. Both are visible in constructors and configuration
classes, if they are kept there.

| #   | Check                                                                                                | How                                                                                       | Source                                          |
| --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SW1 | Dependencies are injected through constructors, never fields                                         | `grep -rn "@Autowired" --include=*.java src/main`; each hit is on a constructor or absent | Spring Framework 7 — dependency injection       |
| SW2 | Configuration is bound to `@ConfigurationProperties` records                                         | `grep -rn "@Value(" --include=*.java src/main` returns nothing outside config             | Spring Boot 4.1 — externalized configuration    |
| SW3 | Configuration properties are `@Validated`, and a missing value stops startup                         | remove a required property and start; it must fail                                        | Spring Boot 4.1 — externalized configuration    |
| SW4 | No secret has a default in `application.*` or in code                                                | read the property files and the records' defaults                                         | Spring Boot 4.1 — externalized configuration    |
| SW5 | Beans are registered by component scan within their module, or by one configuration class per module | read `@Configuration` classes; no module registers another's beans                        | Spring Modulith 2.1 — fundamentals              |
| SW6 | No `ApplicationContext.getBean` in application code                                                  | `grep -rn "getBean(" --include=*.java src/main`                                           | Spring Framework 7 — dependency injection       |
| SW7 | No circular bean references; `spring.main.allow-circular-references` is not enabled                  | grep the property files                                                                   | Spring Boot 4.1 — common application properties |
| SW8 | Profiles select configuration, not code paths; no `@Profile` on business logic                       | `grep -rn "@Profile" --include=*.java src/main`                                           | Spring Boot 4.1 — profiles                      |

## Why each one

**SW1** is the rule every other one leans on. A constructor lists what a class
needs; a field-injected class hides it, cannot be built in a plain unit test,
and lets a dependency cycle form without anybody writing it down.

**SW3** because configuration read lazily fails on the first request that
needs it, on one instance, at the worst time. Validation at binding time turns
that into a failed deployment.

**SW7** because Spring Boot refuses circular references by default for a
reason: a cycle between beans is a cycle between modules, and the property
that allows it is the cheapest way to stop noticing one.
