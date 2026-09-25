# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Library versions were read from Maven Central, the Gradle Plugin Portal and
services.gradle.org; documentation pages carry a "last updated" date that is
recorded where present. **Re-check every 90 days**, and when Kotlin 2.5 is
released (2.5.0-Beta1 was on Maven Central at check).

> **Next re-check due: 2026-12-24.**

## Language

| Short name                             | Reference                                                                                                | Version                                               | Checked    | Used for                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| Kotlin 2.4                             | [Kotlin releases](https://kotlinlang.org/docs/releases.html)                                             | `kotlin-gradle-plugin` 2.4.20 stable on Maven Central | 2026-09-25 | The target in SKILL.md                                                           |
| Kotlin 2.4 — visibility modifiers      | [Visibility modifiers](https://kotlinlang.org/docs/visibility-modifiers.html)                            | Kotlin 2.4                                            | 2026-09-25 | SKILL.md §2; MG1, MG2, AS7: `internal` is module-wide                            |
| Kotlin 2.4 — sealed classes            | [Sealed classes and interfaces](https://kotlinlang.org/docs/sealed-classes.html)                         | last updated 2026-06-29                               | 2026-09-25 | SKILL.md §7; DT1, DT2, DT6, KM7: exhaustive `when`; `expect sealed` needs `else` |
| Kotlin 2.4 — inline value classes      | [Inline value classes](https://kotlinlang.org/docs/inline-classes.html)                                  | Kotlin 2.4                                            | 2026-09-25 | DT3                                                                              |
| Kotlin 2.4 — null safety               | [Null safety](https://kotlinlang.org/docs/null-safety.html)                                              | Kotlin 2.4                                            | 2026-09-25 | DT4                                                                              |
| Kotlin 2.4 — Java interop, null safety | [Calling Java from Kotlin](https://kotlinlang.org/docs/java-interop.html)                                | Kotlin 2.4                                            | 2026-09-25 | DT5: platform types at the boundary                                              |
| Kotlin 2.4 — collections overview      | [Collections overview](https://kotlinlang.org/docs/collections-overview.html)                            | Kotlin 2.4                                            | 2026-09-25 | DT7: read-only versus mutable collection types                                   |
| Kotlin 2.4 — compiler options          | [Compiler options in the Kotlin Gradle plugin](https://kotlinlang.org/docs/gradle-compiler-options.html) | Kotlin 2.4                                            | 2026-09-25 | KB5, KB9: `allWarningsAsErrors`, `freeCompilerArgs`                              |
| Kotlin 2.4 — Gradle JVM toolchain      | [Configure a Gradle project](https://kotlinlang.org/docs/gradle-configure-project.html)                  | Kotlin 2.4                                            | 2026-09-25 | KB4: `jvmToolchain`                                                              |
| Kotlin 2.4 — Compose compiler plugin   | [Compose compiler migration guide](https://kotlinlang.org/docs/compose-compiler-migration-guide.html)    | plugin version equals Kotlin version since 2.0.0      | 2026-09-25 | KB2                                                                              |
| KSP 2.3.12                             | [KSP releases](https://github.com/google/ksp/releases)                                                   | 2.3.12; versioned independently of Kotlin since 2.3   | 2026-09-25 | KB3                                                                              |

## Libraries and API evolution

| Short name                                          | Reference                                                                                                                              | Version                                                    | Checked    | Used for                                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Kotlin 2.4 — API guidelines, simplicity             | [Simplicity](https://kotlinlang.org/docs/api-guidelines-simplicity.html)                                                               | page dated 2026-06-16; explicit API mode since Kotlin 1.4  | 2026-09-25 | SKILL.md §4; AS1                                                                                                                |
| Kotlin 2.4 — API guidelines, backward compatibility | [Backward compatibility](https://kotlinlang.org/docs/api-guidelines-backward-compatibility.html)                                       | last updated 2026-07-15                                    | 2026-09-25 | SKILL.md §4; AS3–AS6, AS8: no data classes in API, `@JvmOverloads`, `@RequiresOptIn`; ABI validation built into KGP since 2.2.0 |
| Kotlin 2.4 — ABI validation                         | [Binary compatibility validation in the Kotlin Gradle plugin](https://kotlinlang.org/docs/gradle-binary-compatibility-validation.html) | experimental; `checkKotlinAbi` runs with `check`           | 2026-09-25 | AS2                                                                                                                             |
| BCV 0.18.2                                          | [binary-compatibility-validator](https://github.com/Kotlin/binary-compatibility-validator)                                             | 0.18.2; "in maintenance mode" in favour of the KGP feature | 2026-09-25 | AS2                                                                                                                             |

## Multiplatform

| Short name                             | Reference                                                                                                      | Version                 | Checked    | Used for                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------- | -------------------------------------------------------------------------------- |
| KMP — expected and actual declarations | [Expected and actual declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html) | last updated 2026-05-13 | 2026-09-25 | SKILL.md §5; KM2–KM4: functions and interfaces preferred; `expect class` is Beta |
| KMP — hierarchical structure           | [Hierarchical project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-hierarchy.html)       | last updated 2026-03-16 | 2026-09-25 | KM1, KM5, KM6, KM8: the default hierarchy template since 1.9.20                  |

## Coroutines

| Short name                                                  | Reference                                                                                                                   | Version | Checked    | Used for                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- | ---------- | ----------------------------------------------------------------- |
| kotlinx.coroutines 1.11 — `GlobalScope`                     | [`GlobalScope`](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-global-scope/)    | 1.11.0  | 2026-09-25 | SKILL.md §6; CO1: `@DelicateCoroutinesApi` and its three pitfalls |
| kotlinx.coroutines 1.11 — coroutine scope                   | [Coroutines basics — scope and structured concurrency](https://kotlinlang.org/docs/coroutines-basics.html)                  | 1.11.0  | 2026-09-25 | CO2, CO4                                                          |
| kotlinx.coroutines 1.11 — `runBlocking`                     | [`runBlocking`](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) | 1.11.0  | 2026-09-25 | CO3                                                               |
| kotlinx.coroutines 1.11 — coroutine context and dispatchers | [Coroutine context and dispatchers](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html)                     | 1.11.0  | 2026-09-25 | CO5                                                               |
| kotlinx.coroutines 1.11 — cancellation and timeouts         | [Cancellation and timeouts](https://kotlinlang.org/docs/cancellation-and-timeouts.html)                                     | 1.11.0  | 2026-09-25 | CO6, CO9                                                          |

## Build and architecture tests

| Short name                       | Reference                                                                                                                         | Version                           | Checked    | Used for                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| Gradle 9.8 — sharing build logic | [Sharing build logic between subprojects](https://docs.gradle.org/current/userguide/sharing_build_logic_between_subprojects.html) | 9.8.0 (current, 2026-09-24)       | 2026-09-25 | SKILL.md §2; MG3, MG6, MG9: convention plugins over `allprojects` / `subprojects` |
| Gradle 9.8 — version catalogs    | [Version catalogs](https://docs.gradle.org/current/userguide/version_catalogs.html)                                               | 9.8.0                             | 2026-09-25 | KB1                                                                               |
| Gradle 9.8 — dependency locking  | [Locking dependency versions](https://docs.gradle.org/current/userguide/dependency_locking.html)                                  | 9.8.0                             | 2026-09-25 | KB8                                                                               |
| dependency-analysis 3.9.0        | [Dependency Analysis Gradle Plugin](https://github.com/autonomousapps/dependency-analysis-gradle-plugin)                          | 3.9.0 on the Gradle Plugin Portal | 2026-09-25 | MG4, MG5: `buildHealth`, `severity("fail")`                                       |
| Konsist 0.17.3                   | [Konsist](https://docs.konsist.lemonappdev.com/)                                                                                  | 0.17.3 on Maven Central; pre-1.0  | 2026-09-25 | MG7, MG8, DT8: `assertArchitecture` on Kotlin source                              |
| ArchUnit 1.5.0                   | [ArchUnit user guide](https://www.archunit.org/userguide/html/000_Index.html)                                                     | 1.5.0 on Maven Central            | 2026-09-25 | MG7, MG8, DT8: `layeredArchitecture` on bytecode                                  |
| Nygard ADR format                | [Documenting architecture decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)                    | original, 2011                    | 2026-09-25 | SKILL.md §1; MG1, KM1                                                             |

## Frameworks at the edges

| Short name                       | Reference                                                                           | Version                                 | Checked    | Used for                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Spring Boot 4.1 — Kotlin support | [Kotlin support](https://docs.spring.io/spring-boot/reference/features/kotlin.html) | Spring Boot 4.1.1; Kotlin 2.2+ required | 2026-09-25 | KB6, KB7, CO8: `plugin.spring`, `kotlin-reflect`, `jackson-module-kotlin` |
| Ktor 3.6 — modules               | [Modules](https://ktor.io/docs/server-modules.html)                                 | Ktor 3.6.0                              | 2026-09-25 | CO7: `Application` extension functions as modules                         |

## Deferred to elsewhere

- Application security: [`security-reviewer`](../security-reviewer/SKILL.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
- JVM-generic build reproducibility (wrapper checksums, reproducible archives)
  and Spring's transaction and wiring rules: `java-senior-architect`, proposed
  in a separate pull request.
- Android app code: `android-mobile-engineer`, proposed in a separate pull
  request.
