# Java Senior Software Architect

## What it changes

An agent working on a Spring Boot service without this expert produces
familiar code: packages named after layers, services with field-injected
repositories, `@Transactional` sprinkled on methods, entities returned from
controllers, a `pom.xml` that builds today. Every piece works. None of it
fails a build when the design is broken — a controller calling a repository,
a transaction silently skipped, two versions of a library fighting at runtime.

This expert moves the design into things the build checks:

- **Four decisions first** — the module mechanism (Spring Modulith, ArchUnit
  or JPMS), the JDK and Spring Boot line, the persistence boundary, and the
  thread model.
- **Module boundaries as a test** — `ApplicationModules.verify()` or ArchUnit
  layer, slice and dependency rules, with existing violations frozen.
- **A reproducible, convergent build** — pinned wrapper and plugins, Maven
  Enforcer convergence rules or Gradle locking, and a rebuild compared
  byte-for-byte.
- **Types that close the cases** — records, sealed hierarchies with exhaustive
  switches, JSpecify nullness checked by NullAway.
- **Spring read as the proxy reads it** — constructor injection, validated
  configuration records, `@Transactional` that is actually applied,
  `open-in-view` off.
- **A thread model chosen on purpose** — virtual threads with explicit bounds,
  current pinning facts (JEP 491), `ScopedValue` for request context.

## What it fits

- Starting a Spring Boot 4 service on Java 25, before the modules are
  public inside the codebase.
- Reviewing a Spring Boot codebase's structure, or a change that crosses a
  module, adds a transaction or switches on virtual threads.
- Upgrading to Java 25 or Spring Boot 4.x — the migration-plan deliverable.
- Maven 3.9 or Gradle 9. Maven 4 is at release candidate; the rules hold, and
  its reproducible-build default makes BR7 easier.

## What it does not fit

- **Kotlin, Android, Quarkus, Micronaut.** The type and build rules transfer;
  the Spring proxy and configuration rules do not.
- **Application security** — Spring Security configuration included:
  `security-reviewer` and `docs/review-standards.md`.
- **Schema design and query tuning** — `sql-data-engineer`.
- **JVM performance tuning** — garbage collectors, heap sizing, JIT. The
  expert decides the thread model; it does not profile.
- **A library with no container.** The Spring rules are irrelevant there, and
  the expert will reduce itself to modules, build and types.

## Pros and cons

**In its favour:** every rule lands as a test, a build rule or a compiler
flag, so it keeps holding after the conversation ends. It is also current in a
place where old advice lingers: it tells an agent _not_ to rewrite
`synchronized` for virtual threads on Java 25.

**Against it:** it adds build machinery — Enforcer rules, Error Prone and
NullAway, ArchUnit or Modulith — that a small service may not want on day one,
and NullAway in particular costs real time on an unannotated codebase. It is
tied to Spring Boot 4 and Java 25, which means a re-read at each of their
upgrades.
