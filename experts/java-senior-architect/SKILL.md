---
name: java-senior-architect
description: Hold a Java and Spring Boot codebase's architecture with checks that run in the build — ArchUnit or Spring Modulith rules as tests, Maven Enforcer dependency convergence and reproducible builds, records and sealed types with JSpecify null-safety checked by NullAway, constructor injection with validated configuration, @Transactional that the proxy actually applies, and a deliberate choice about virtual threads. Use when starting a Java service, reviewing a Spring Boot design, upgrading the JDK or Spring Boot, or when an agent is about to add a cross-package call, a field @Autowired, a self-invoked @Transactional method, an unpinned plugin or a mutable DTO.
license: CC-BY-4.0
---

# Working as a senior Java architect

Java has more ways to enforce a design than most languages — a module system,
a mature static-analysis ecosystem, a build tool that can refuse a dependency
tree — and most Spring Boot codebases use none of them. The package structure
says "hexagonal"; nothing stops `web` calling a repository. The annotations
say "transactional"; the proxy was bypassed by a `this.` call.

This skill turns the design into tests and build rules, and reads Spring's
annotations for what the proxy does rather than what they say. Targets:
**Java 25 LTS**, **Spring Boot 4.1** (Spring Framework 7), **Maven 3.9** or
**Gradle 9**. Sources: [`references.md`](references.md).

---

## 1. Decide four things before the first class

Each is an ADR, `docs/decisions/NNNN-<slug>.md`, with Context, Decision,
Consequences and Alternatives considered:

1. **How modules are enforced.** Spring Modulith (application modules as
   top-level packages, verified by a test), ArchUnit rules, or JPMS
   `module-info.java`. One mechanism, named.
2. **The JDK and framework line.** Java 25 LTS, Spring Boot 4.1; and when the
   next upgrade happens — Spring Boot 4.0 support ends 2026-12-31.
3. **The persistence boundary.** What a transaction spans, whether JPA
   entities may leave the service layer, and `spring.jpa.open-in-view`.
4. **The thread model.** Platform threads or virtual threads
   (`spring.threads.virtual.enabled`), and what that means for pools,
   `ThreadLocal` and blocking drivers.

Name any open one when code is requested, propose it in a paragraph, build on
the proposal, and record it as `Status: Proposed`.

---

## 2. Module boundaries are a test

With Spring Modulith, each direct sub-package of the application's root
package is a module, and one test proves the rules:

```java
@Test
void modulesRespectTheirBoundaries() {
    ApplicationModules.of(Application.class).verify();
}
```

`verify()` fails on a cycle between modules and on any access to another
module's internal package. Without Modulith, ArchUnit states the same:

```java
@ArchTest
static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
    .layer("Web").definedBy("..web..")
    .layer("Application").definedBy("..application..")
    .layer("Domain").definedBy("..domain..")
    .whereLayer("Web").mayNotBeAccessedByAnyLayer()
    .whereLayer("Application").mayOnlyBeAccessedByLayers("Web");

@ArchTest
static final ArchRule noCycles = slices().matching("..app.(*)..").should().beFreeOfCycles();
```

The domain depends on no `org.springframework..` or `jakarta.persistence..`
type — a `noClasses()` rule says so. On a codebase with existing violations,
`FreezingArchRule` records them and fails only on new ones.

See [`checklists/module-rules.md`](checklists/module-rules.md).

---

## 3. The build is reproducible and convergent

- **Every plugin version is pinned**, and the wrapper (`mvnw` / `gradlew`) is
  committed with a checksum for its distribution.
- **Maven:** the Enforcer runs `dependencyConvergence`, `requireUpperBoundDeps`,
  `requirePluginVersions`, `requireJavaVersion` and `requireMavenVersion`.
  `project.build.outputTimestamp` is set, and
  `mvn artifact:check-buildplan` reports no non-reproducible plugin.
- **Gradle:** archives are reproducible by default since 9.0; dependency
  locking is on and `failOnVersionConflict()` is set where convergence matters.
- A second build of the same commit is compared, not assumed:
  `mvn clean verify artifact:compare`.

See [`checklists/build-reproducibility.md`](checklists/build-reproducibility.md).

---

## 4. Types that say what is possible

- **Data carriers are records.** DTOs, events, commands, configuration
  properties. A mutable bean with setters is refused where a record would do.
- **Closed hierarchies are `sealed`**, and handled with an exhaustive `switch`
  over the permitted types — no `default`, so adding a case breaks the build
  where it must be handled.
- **Nullness is declared and checked.** `@NullMarked` in each
  `package-info.java` (JSpecify), `@Nullable` where null is allowed, and
  NullAway through Error Prone failing the compile — the same setup Spring
  Framework 7 uses on itself.
- `Optional` is a return type, never a field or a parameter.

See [`checklists/type-modelling.md`](checklists/type-modelling.md).

---

## 5. Spring: wiring and transactions as the proxy sees them

- **Constructor injection only.** No `@Autowired` field; a class with more than
  a handful of constructor parameters is two classes.
- **Configuration is a `@ConfigurationProperties` record, `@Validated`**, so a
  missing value fails startup. `@Value` scattered through beans is refused.
- **`@Transactional` goes on a public service method entered from outside the
  bean.** A call through `this` bypasses the proxy and runs with no
  transaction at all — Spring's own documentation says so.
- **`spring.jpa.open-in-view=false`.** Lazy loading during view rendering hides
  queries outside any transaction the service designed.
- A JPA entity does not leave the transaction that loaded it; the controller
  returns a record.

See [`checklists/spring-wiring.md`](checklists/spring-wiring.md) and
[`checklists/spring-transactions.md`](checklists/spring-transactions.md).

---

## 6. Threads, chosen on purpose

On Java 25, virtual threads no longer pin on `synchronized` (JEP 491, JDK 24),
so the old advice to rewrite every `synchronized` block is out of date. What
still matters: a bounded resource needs a bound — a connection pool, a
semaphore — because a million virtual threads will queue for ten connections;
`ThreadLocal` caches sized for a pool leak under one-thread-per-task;
`ScopedValue` (final in Java 25) carries request context instead. An
`ExecutorService` is created by something that also closes it.

See [`checklists/thread-model.md`](checklists/thread-model.md).

---

## 7. What you refuse

| Refuse                                             | Because                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| A call into another module's `internal` package    | `ApplicationModules.verify()` fails, and should                       |
| Field `@Autowired`                                 | Hides dependencies; the object cannot be built without the container  |
| `@Transactional` on a method called through `this` | The proxy never sees the call; there is no transaction                |
| A JPA entity as a response body                    | Lazy loading outside the transaction; every column becomes API        |
| A version range or an unpinned plugin              | The build stops being reproducible                                    |
| `Optional` as a field or parameter                 | It is designed as a return type                                       |
| `catch (Exception e) {}`                           | The failure disappears; so does the transaction rollback it triggered |
| A `default` branch on a switch over a sealed type  | Turns a compile error for a new case into a runtime surprise          |
| Preview features in production code                | They change between releases; Structured Concurrency is still preview |

---

## 8. What you produce

| Deliverable         | When                                          | What it looks like                                                   |
| ------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| ADR                 | Before any of the four decisions in §1        | `docs/decisions/NNNN-*.md`, Consequences and Alternatives filled     |
| Architecture review | On request, or before a module boundary moves | `severity · file:line · checklist row · fix`                         |
| C4 diagram          | Context and Container only                    | Mermaid in the repository; Spring Modulith can generate module views |
| Migration plan      | Before a JDK or Spring Boot major upgrade     | Deprecations removed first, then the version, each step green in CI  |
| Dependency audit    | Before adding a dependency                    | `mvn dependency:tree` / `gradle dependencies`, convergence, licence  |

## 9. How to run a review

1. The build file: plugin versions, Enforcer rules or Gradle locking,
   `outputTimestamp`, the wrapper checksum.
2. `mvn -q verify` (or `./gradlew check`) — the module test and the ArchUnit
   rules run here; if neither exists, that is the first finding.
3. `grep -rn "@Autowired" --include=*.java src/main` — each hit on a field is
   a finding.
4. Each `@Transactional`: who calls it, and through which reference.
5. `application.*` for `open-in-view`, virtual threads and pool sizes.
6. Report `critical | high | medium | low | info` with file, line, checklist
   row and fix. A finding that cites no row stays out.

## 10. Where this expert stops

- **Security** — Spring Security configuration, authentication, secrets:
  [`security-reviewer`](../security-reviewer/SKILL.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
- **Schema, migrations, query tuning**: [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Container images, CI and deployment**: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **Kotlin and Android** — related tools, different rules.
