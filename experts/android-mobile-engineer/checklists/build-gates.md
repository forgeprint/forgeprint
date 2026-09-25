# Build gates

What ships is the release build: optimized by R8, compiled ahead of time from a
baseline profile, and accepted by Google Play only above a target SDK. Every
row here is a Gradle setting or task with an exit code.

| #    | Check                                                                                                                                 | How                                                                                                | Source                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| BG1  | `targetSdk` is 36 or higher                                                                                                           | `grep -rn "targetSdk" --include=*.kts .`                                                           | Google Play — target API level requirement                                 |
| BG2  | The release build type enables optimization: `optimization { enable = true }` (AGP 9.3+) or `isMinifyEnabled` and `isShrinkResources` | read the `release` block                                                                           | Android — enable app optimization; AGP 9.4.1                               |
| BG3  | Keep rules are narrow: no `-keep class **`, no `-keep class * { *; }`, no `-dontobfuscate`                                            | `grep -rnE "keep class \*\*\|keep class \* \{\|dontobfuscate" --include=*.pro .`                   | Android — enable app optimization                                          |
| BG4  | The release build has been run on a device before release                                                                             | the release checklist or pull request says so                                                      | Android — enable app optimization                                          |
| BG5  | A baseline profile is generated with the Baseline Profile plugin and Macrobenchmark, and `profileinstaller` is a dependency           | `find app/src -name baseline-prof.txt`; read the catalog for `profileinstaller`                    | Android — baseline profiles; baselineprofile 1.5.0; profileinstaller 1.4.1 |
| BG6  | Android lint runs with `warningsAsErrors = true` and a committed baseline that only shrinks                                           | read the `lint { }` block; `git log -p -- lint-baseline.xml`                                       | Android — lint                                                             |
| BG7  | Compose lint checks run inside Android lint, and detekt runs and fails the build                                                      | `lintChecks("com.slack.lint.compose:compose-lint-checks:…")` in the app module; `./gradlew detekt` | compose-lints 1.6.0; detekt 1.23.8                                         |
| BG8  | ktlint runs through the Gradle plugin and fails the build                                                                             | `./gradlew ktlintCheck`                                                                            | ktlint 1.8.0; ktlint-gradle 14.2.0                                         |
| BG9  | Versions live in `gradle/libs.versions.toml`; Compose artifacts come through the BOM                                                  | read the catalog for `compose-bom`; no Compose artifact carries its own version                    | Compose BOM 2026.09.00; Gradle 9.8 — version catalogs                      |
| BG10 | The Gradle wrapper is committed with `distributionSha256Sum`                                                                          | read `gradle/wrapper/gradle-wrapper.properties`                                                    | Gradle 9.8 — wrapper                                                       |

## Why each one

**BG1** is not a preference: since 2026-08-31 Google Play requires new apps and
updates to target API level 36. A lower `targetSdk` is a release that will not
be accepted.

**BG2–BG4** belong together. R8 makes the app smaller and faster and changes
the code that runs; a broad keep rule throws most of that away, and a release
build nobody ran is the one where a reflective call R8 removed turns into a
crash.

**BG5** because Google's own measurement puts the gain from a baseline profile
at about 30% faster code execution from first launch — for every new user and
every update, which is exactly when there is no JIT profile yet.
