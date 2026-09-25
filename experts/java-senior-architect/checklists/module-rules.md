# Module rules

A Java package is visible to every other package in the classpath. The module
structure exists only where a test fails when it is broken.

| #   | Check                                                                                             | How                                                                         | Source                                         |
| --- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| MR1 | One enforcement mechanism is chosen and recorded: Spring Modulith, ArchUnit or JPMS               | the ADR; the dependency in the build file                                   | Spring Modulith 2.1; ArchUnit 1.5; JLS 25 §7.7 |
| MR2 | With Spring Modulith, a test calls `ApplicationModules.of(Application.class).verify()`            | `grep -rn "ApplicationModules.of" src/test`                                 | Spring Modulith 2.1 — verification             |
| MR3 | Cross-module access goes only through a module's API package, never an internal one               | MR2's test; or an ArchUnit `noClasses()` rule on `..internal..`             | Spring Modulith 2.1 — verification             |
| MR4 | Module-level dependencies are acyclic                                                             | MR2's test, or `slices().matching(...).should().beFreeOfCycles()`           | Spring Modulith 2.1; ArchUnit 1.5 — slices     |
| MR5 | With ArchUnit, a `layeredArchitecture().consideringAllDependencies()` rule states the layers      | read the `@ArchTest` fields                                                 | ArchUnit 1.5 — layered architecture            |
| MR6 | The domain package depends on no `org.springframework..` or `jakarta.persistence..` type          | an ArchUnit `noClasses().that().resideInAPackage("..domain..")` rule        | ArchUnit 1.5 — package dependency checks       |
| MR7 | Existing violations are frozen, not ignored, so only new ones fail                                | `FreezingArchRule.freeze(...)` and a committed violation store              | ArchUnit 1.5 — freezing arch rules             |
| MR8 | Modules talk through published events where the ADR says so, not by calling each other's services | `grep -rn "@ApplicationModuleListener\|ApplicationEventPublisher" src/main` | Spring Modulith 2.1 — working with events      |
| MR9 | With JPMS, `module-info.java` exports only API packages and `requires` nothing it does not use    | read each `module-info.java`                                                | JLS 25 §7.7 — module declarations              |

## Why each one

**MR2** is the whole of Spring Modulith's value in one line. Without the test,
the package structure is a convention; with it, a call from `orders` into
`inventory.internal` fails the build before review sees it.

**MR6** is the rule that keeps the domain testable without a container. Once a
domain class carries `@Entity` or a Spring annotation, it cannot be
constructed in a unit test without the framework, and the schema and the model
change together from then on.

**MR7** makes the rules adoptable on an existing codebase. Turning on a layer
rule over a thousand existing violations gets it disabled by Friday; freezing
them means the count can only go down.
