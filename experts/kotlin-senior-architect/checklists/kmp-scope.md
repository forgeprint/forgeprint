# Kotlin Multiplatform scope

Kotlin Multiplatform lets one codebase target the JVM, Android, iOS and more.
The architectural decision is not whether it can share something, but what it
should: every line in `commonMain` is a line every platform must build, and
every `expect` is a contract each platform has to honour.

| #   | Check                                                                                                            | How                                                                                         | Source                                          |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| KM1 | An ADR records which layers are in `commonMain` and which stay per platform                                      | the ADR; compare with the source sets that exist                                            | Nygard ADR format; KMP — hierarchical structure |
| KM2 | `expect`/`actual` is used for functions and interfaces; `expect class` only with a written reason                | `grep -rn "expect class\|expect abstract class\|expect open class" src/commonMain`          | KMP — expected and actual declarations          |
| KM3 | `-Xexpect-actual-classes` is present only if KM2's reasons exist                                                 | `grep -rn "Xexpect-actual-classes" --include=*.kts .`                                       | KMP — expected and actual declarations          |
| KM4 | Platform implementations are injected through interfaces where the code needs more than one or needs a fake      | read the DI setup; `expect` appears in the DI configuration, not throughout the code        | KMP — expected and actual declarations          |
| KM5 | The default hierarchy template is used; no hand-written `dependsOn` edges                                        | `grep -rn "dependsOn(" --include=*.kts .` inside `sourceSets`                               | KMP — hierarchical structure                    |
| KM6 | `commonMain` depends on no JVM-only or Android-only library                                                      | read `commonMain.dependencies {}`; each artifact publishes the targets the project declares | KMP — hierarchical structure                    |
| KM7 | A `when` over an `expect sealed` type in common code carries an `else`; over an ordinary sealed type it does not | read `when` expressions over sealed types in `commonMain`                                   | Kotlin 2.4 — sealed classes                     |
| KM8 | Every declared target builds in CI, not only the JVM one                                                         | read the workflow for each target's compile task                                            | KMP — hierarchical structure                    |

## Why each one

**KM2** because the Kotlin documentation marks `expect`/`actual` classes as
Beta and recommends functions and interfaces instead: a class allows one
implementation per platform and is harder to replace in a test, and a shared
codebase full of them has pushed platform decisions into every layer.

**KM1** because "share as much as possible" is not a decision. UI shared
across Android and iOS is a different project from shared domain and data
layers, with different costs, and the ADR is where that difference is written
down.

**KM8** because a multiplatform module that only CI-builds for the JVM is a JVM
module with an iOS build that fails the day somebody tries it.
