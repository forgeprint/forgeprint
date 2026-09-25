# Gradle module graph

In Kotlin the Gradle module is the unit of encapsulation: `internal` means
"visible inside this module", and nothing else in the language draws a wall
around a group of files. The architecture is therefore the module graph, and
it exists only where the build refuses to break it.

| #   | Check                                                                                                   | How                                                                                                                   | Source                                               |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| MG1 | The module list and their allowed dependencies are recorded in an ADR                                   | the ADR; compare with `include(...)` in `settings.gradle.kts`                                                         | Nygard ADR format; Kotlin 2.4 — visibility modifiers |
| MG2 | Implementation details are `internal`, and nothing outside the module reaches them                      | `grep -rn "^internal \|^\s*internal " src/main/kotlin` in each module; read what is public instead                    | Kotlin 2.4 — visibility modifiers                    |
| MG3 | Shared build logic is in convention plugins; no `allprojects {}` or `subprojects {}`                    | `grep -rnE "allprojects\s*\{\|subprojects\s*\{" --include=*.gradle.kts .` returns nothing                             | Gradle 9.8 — sharing build logic                     |
| MG4 | `api(...)` is used only for dependencies whose types appear in the module's public API                  | `./gradlew buildHealth` reports no misdeclared configuration                                                          | dependency-analysis 3.9.0                            |
| MG5 | `buildHealth` fails the build on any issue, and runs where merges are gated                             | read `dependencyAnalysis { issues { all { onAny { severity("fail") } } } }`; read the workflow                        | dependency-analysis 3.9.0                            |
| MG6 | No dependency cycle between modules                                                                     | Gradle refuses project cycles; read `./gradlew :<module>:dependencies --configuration compileClasspath` for surprises | Gradle 9.8 — sharing build logic                     |
| MG7 | Layer rules inside a module are a test: Konsist `assertArchitecture` or ArchUnit `layeredArchitecture`  | `grep -rn "assertArchitecture\|layeredArchitecture" src/test`                                                         | Konsist 0.17.3; ArchUnit 1.5.0                       |
| MG8 | The domain layer depends on nothing: `dependsOnNothing()` or a `noClasses()` rule on framework packages | read the rule; it names `io.ktor..`, `org.springframework..` and `androidx..` as forbidden where used                 | Konsist 0.17.3; ArchUnit 1.5.0                       |
| MG9 | An app module depends on feature modules; feature modules do not depend on each other                   | read each feature module's `dependencies {}` for `project(":feature…")`                                               | Gradle 9.8 — sharing build logic                     |

## Why each one

**MG2** is the row that makes a module mean something. Kotlin declarations are
public by default; a module whose classes are all public is a folder with a
build file, and every other module will eventually depend on its insides.

**MG4** because `api` puts the dependency on every consumer's compile
classpath. One misdeclared `api` turns a private choice — a JSON library, an
HTTP client — into something every downstream module compiles against, and
changing it becomes a cross-module migration.

**MG7** needs a choice: Konsist reads Kotlin source and understands Kotlin
constructs (files, top-level functions, `internal`), but is still before 1.0;
ArchUnit is stable and reads bytecode, where Kotlin's top-level functions
appear as synthetic `…Kt` classes. Name which one in the ADR.
