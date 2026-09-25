# Changelog — android-compose-app

## 1.0.0 — 2026-09-25

First version.

A single-module Android app in Kotlin on Jetpack Compose and AGP 9.4.1: a
ViewModel exposing `StateFlow`, collected with `collectAsStateWithLifecycle`,
a pure-Kotlin title rule, 13 JVM tests including the real screen under
Robolectric, lint with warnings as errors, an unsigned R8 release build and a
CI workflow.

**Generated** by a tool from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where Kotlin was one of the four languages with no blueprint (Stack Overflow
2025: 10.8%) and `android/nowinandroid` carried 21.9k stars. Its recipe runs in
CI like every other and nobody has run the app on a device, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Versions were read on 2026-09-25 from Google's Maven repository, Maven Central
and services.gradle.org: AGP 9.4.1, Gradle 9.7.1, Kotlin 2.4.20, Compose BOM
2026.09.00, Activity Compose 1.13.0, Lifecycle 2.11.0, Robolectric 4.17,
AndroidX Test JUnit 1.3.0, Espresso 3.7.0, JUnit 4.13.2. The Gradle distribution and wrapper
JAR checksums are Gradle's published values for 9.7.1.

Decisions that came out of building it rather than describing it:

- **The JDK floor is 21, not AGP's 17.** Robolectric's Android runtime for
  API 37 is compiled for Java 21.
- **`compileSdk` 37 is forced by Compose, not chosen.** Compose 1.12 requires
  compileSdk 37 and AGP 9; `targetSdk` follows it to 37, above Play's 36.
- **Four lint checks are off** because they fail on the calendar rather than
  on the code, which `warningsAsErrors` would turn into a build that breaks on
  its own.
- **Robolectric on JDK 21 needs two JVM flags.** It simulates Android's shared
  memory through the JDK's file descriptors, which the module system refuses
  without `--add-exports java.base/jdk.internal.access` and
  `--add-opens java.base/java.io`. They are set on unit tests only.
- **Espresso is pinned to 3.7.0 in the tests.** Compose 1.12's test library
  depends on Espresso 3.5.0, which calls `InputManager.getInstance()`; API 37
  removed it, and every screen test failed inside Robolectric until the newer
  Espresso replaced it.
- **Lint wants backup rules for every API level the app supports.**
  `allowBackup="false"` alone is refused on a `minSdk` below 31, so the
  manifest also sets `fullBackupContent="false"` and points
  `dataExtractionRules` at a file that excludes every domain.
- **The Gradle wrapper is generated, not written.** Gradle has no script-only
  wrapper, so the recipe unpacks a checksummed distribution once, generates
  the wrapper with it, and checks the wrapper JAR against Gradle's published
  checksum.

### Planned

- Instrumented tests on Gradle Managed Devices, once there is behaviour that
  only a device can show.
- Gradle dependency verification, once it can be generated for every host
  operating system the reader might build on.
