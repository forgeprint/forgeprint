# Kotlin build

A Kotlin build carries more version couplings than a Java one: the compiler
plugins ship with Kotlin, KSP has to support the Kotlin release, and framework
integrations need compiler plugins of their own. These rows keep them in one
place and aligned.

| #   | Check                                                                                                                        | How                                                                                    | Source                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| KB1 | Every version is in `gradle/libs.versions.toml`; no literal version in a module build file                                   | `grep -rnE "\"[a-z0-9.-]+:[a-z0-9.-]+:[0-9]" --include=*.gradle.kts .` returns nothing | Gradle 9.8 — version catalogs        |
| KB2 | The Kotlin Gradle plugin, `plugin.compose`, `plugin.serialization`, `plugin.spring` and `plugin.jpa` share one `version.ref` | read `[plugins]` in the catalog                                                        | Kotlin 2.4 — Compose compiler plugin |
| KB3 | The KSP version is one released for the Kotlin version in use                                                                | read the catalog; KSP 2.3.x is versioned independently of Kotlin                       | KSP 2.3.12                           |
| KB4 | `jvmToolchain(…)` names the JDK in a convention plugin                                                                       | `grep -rn "jvmToolchain" build-logic buildSrc`                                         | Kotlin 2.4 — Gradle JVM toolchain    |
| KB5 | `allWarningsAsErrors` is on for production source sets                                                                       | `grep -rn "allWarningsAsErrors" build-logic buildSrc`                                  | Kotlin 2.4 — compiler options        |
| KB6 | Spring modules apply `kotlin("plugin.spring")`; JPA modules apply `kotlin("plugin.jpa")`                                     | read the plugins block of each Spring or JPA module                                    | Spring Boot 4.1 — Kotlin support     |
| KB7 | Spring modules use Kotlin 2.2 or later with `kotlin-reflect` and `jackson-module-kotlin`                                     | read the catalog                                                                       | Spring Boot 4.1 — Kotlin support     |
| KB8 | Dependency locking is on and lock files are committed                                                                        | `dependencyLocking { lockAllConfigurations() }`; `git ls-files '*gradle.lockfile'`     | Gradle 9.8 — dependency locking      |
| KB9 | No `-Xskip-prerelease-check`, `-Xsuppress-version-warnings` or experimental language flags without an ADR                    | `grep -rn "freeCompilerArgs" build-logic buildSrc --include=*.kts`                     | Kotlin 2.4 — compiler options        |

## Why each one

**KB2** because since Kotlin 2.0 the Compose compiler ships inside Kotlin and
its Gradle plugin's version must equal Kotlin's. A catalog that pins them
separately will one day upgrade one without the other, and the failure is a
compiler crash in a module nobody touched.

**KB6** is the Kotlin-specific trap in a Spring codebase. Kotlin classes are
final by default; Spring's proxies — `@Transactional`, `@Cacheable`,
`@Configuration` — need them open. Without the plugin, the annotation is
there, and nothing it promises happens.

**KB3** because KSP stopped encoding the Kotlin version in its own from 2.3, so
"latest of both" is no longer a guarantee that they fit.
