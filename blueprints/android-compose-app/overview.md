# Android Compose App

A native Android app in Kotlin, on Jetpack Compose and the Android Gradle
plugin 9, with one screen built the way Android's own architecture guidance
describes: state in a ViewModel, exposed as a `StateFlow`, collected by a
lifecycle-aware collector, drawn by a stateless composable. It comes with the
tests, the lint gate, the release build and the CI that a new app usually gets
weeks later, and all of it runs on a laptop or a Linux runner with no device,
no emulator and no account.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has installed the APK on a phone,
which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- AGP 9.4.1 with its built-in Kotlin support, Kotlin 2.4.20 and the Compose
  compiler Gradle plugin, the Compose BOM 2026.09.00 (Compose 1.12.1,
  Material 3 1.4.0), Activity Compose 1.13.0 and Lifecycle 2.11.0.
- Every version in `gradle/libs.versions.toml`; no dynamic version anywhere.
- The Gradle wrapper at 9.7.1, pinned by `distributionSha256Sum`, generated
  from a distribution whose SHA-256 the recipe checks against Gradle's
  published value, and whose wrapper JAR is checked against Gradle's published
  wrapper checksum.
- `compileSdk` and `targetSdk` 37, `minSdk` 26.
- A small task list: add a task, refuse a blank or over-long title with the
  reason, tick tasks off, count what is left. The title rule is a pure Kotlin
  function in `domain/`, the ViewModel is the only writer of the screen's
  state, and the screen is split into a wired `TasksRoute` and a stateless
  `TasksScreen` with a preview.
- 13 tests, all on the JVM: the title rule, a test that the domain imports
  nothing from Android, the ViewModel without Robolectric, and the real screen
  driven through `createComposeRule()` under Robolectric 4.17 — typing,
  pressing, toggling, found by the text a user sees.
- Android lint with `warningsAsErrors`, and Kotlin warnings as errors.
- A release build with R8 shrinking, optimisation and resource shrinking,
  produced unsigned. The recipe proves it carries no signature, is not
  debuggable, and requests no permission beyond AndroidX's own.
- Backup and device transfer excluded for every domain, on every API level
  the app supports.
- `settings.gradle.kts` with two repositories, Google's restricted to Google's
  groups, and project repositories refused.
- `.github/workflows/ci.yml`: actions pinned by commit, read-only permissions,
  no persisted credentials, the wrapper JAR validated against Gradle's
  published checksums, then lint, tests and both builds.
- `.github/dependabot.yml`: weekly update pull requests for the version
  catalog and the pinned actions, so pinned does not mean frozen.

## What CI cannot prove

Say this plainly, because a green pipeline invites people to read more into it:

- **On-device behaviour.** Robolectric runs the real Compose code against a
  simulated Android framework on the JVM. It does not run on ART, draw with
  the device's GPU, show a keyboard, or behave like any particular
  manufacturer's Android. Gestures, insets on a real notch, IME behaviour,
  performance and memory are untested.
- **Instrumented tests.** There is no `androidTest` source set and nothing runs
  on an emulator or a device. The JVM tests cover the logic and the screen's
  semantics; they cannot cover what only a device does.
- **What it looks like.** No screenshot test exists. A colour, a spacing or a
  clipped label can change without any test noticing.
- **The release build running.** R8 ran and the APK was produced; nobody
  launched it. A missing keep rule shows up as a crash at run time, not as a
  failed build — install the release build before trusting it.
- **Signing and Play.** No key exists, nothing is signed, no App Bundle is
  uploaded, and nothing has been through Play's review, pre-launch report or
  policy checks.

## What you do next

1. **Change the application ID.** `com.example.tasks` uses a domain reserved
   for documentation, and Google Play refuses `com.example`. Change
   `applicationId` and `namespace` in `app/build.gradle.kts`, and move the
   source package to match.
2. **Run it.** Open the directory in Android Studio, or connect a device with
   USB debugging on, or start an emulator from the SDK Manager, then
   `./gradlew installDebug`.
3. **Add instrumented tests when you have device-only behaviour to test.**
   `androidTest` with the same Compose test APIs, run on an emulator or a
   device farm; Gradle Managed Devices can run them on a CI runner with
   hardware acceleration, at a cost in minutes.
4. **Set up signing outside the repository.** Enrol in Play App Signing,
   create an upload key, keep it out of git (`.gitignore` already refuses the
   usual names), and give the build its location and passwords from the
   environment of the machine that signs.
5. **Ship an App Bundle.** `./gradlew bundleRelease`, signed with the upload
   key, uploaded to an internal testing track first. A Google Play developer
   account is a one-time paid registration.

## Options

None. Persistence, networking, dependency injection and navigation each have
more than one reasonable answer, and the right one depends on the app; a value
for each would be several blueprints wearing one name (ADR 0001).

## What it fits

- A new Android app in Kotlin, where Android is the platform that matters and
  the native toolkit is the point.
- A team that wants Google's current defaults — Compose, Material 3, a
  ViewModel with `StateFlow`, a version catalog — set up once, correctly, with
  the tests and gates already in place.
- A project whose CI must prove something on a free Linux runner with no
  emulator, no macOS machine and no account.

## What it is NOT for

- **iOS as well.** This is Android only. For one codebase on both platforms,
  `expo-mobile-app` (TypeScript) or a Flutter blueprint fits better; Kotlin
  Multiplatform with Compose Multiplatform is a different project shape this
  blueprint does not set up.
- **A backend.** There is no API and no data layer. Pair it with a service
  blueprint such as `spring-boot-api`, `ts-http-service` or `fastapi-service`,
  and keep secrets there: nothing in an APK is secret.
- **A game.** Compose draws UI, not a game loop.
- **An app that must work offline with stored data, sign users in, take
  payments or receive push notifications.** None is set up, and each needs a
  decision (Room or DataStore, an identity provider, Play Billing, Firebase
  Cloud Messaging) and usually an account this recipe deliberately avoids.
- **A large app from day one.** One module is the right size for one screen.
  Split into feature modules when build times or team boundaries ask for it;
  `android/nowinandroid` is the reference for that shape.

## Trade-offs made on your behalf

- **One module, not app plus a feature module.** A second module with one
  screen in it adds a build file, a namespace and a dependency edge, and buys
  nothing a package boundary does not — the domain boundary is enforced by a
  test instead. Modules are worth it when there are several features or teams.
- **JDK 21, not 17.** AGP 9 accepts 17, but Robolectric's runtime for API 37 is
  compiled for Java 21. Android Studio bundles a JDK 21, so most readers
  already have one.
- **Robolectric for the UI test, not an emulator.** It is what lets a screen
  test run in seconds in any CI. It is also a simulation, and a passing
  Robolectric test is weaker evidence than a passing instrumented one.
- **Robolectric downloads its Android runtime at test time**, from Maven
  Central, outside Gradle's dependency resolution — about 150 MB, once per
  machine, cached afterwards.
- **Two JVM flags for the unit tests** open `jdk.internal.access` and
  `java.io` to Robolectric, which needs them on JDK 17 and later. They apply
  to the test JVM only, never to the app.
- **Espresso 3.7.0 pinned in the tests**, above the 3.5.0 Compose's test
  library asks for, because 3.5.0 calls an Android method API 37 removed.
  Revisit when the Compose BOM moves it.
- **Backup is off everywhere.** `allowBackup="false"` and
  `fullBackupContent="false"` for Android 11 and earlier, and data extraction
  rules that exclude every domain for Android 12 and later. A user moving to a
  new phone gets a fresh app; include paths when you know what is safe to
  copy.
- **`targetSdk` 37, one above what Google Play requires.** 36 is Play's floor
  from 2026-08-31; 37 is the current platform and what lint asks for. Targeting
  it opts into Android 17's behaviour changes, which nobody has checked on a
  device.
- **`minSdk` 26.** Android 8.0 is where adaptive icons begin, so the launcher
  icon is two small vectors and no bitmap in five densities. It excludes a
  small and shrinking share of devices; lower it and add bitmap icons if they
  matter.
- **Four lint checks disabled** — `GradleDependency`,
  `AndroidGradlePluginVersion`, `NewerVersionAvailable` and `OldTargetApi` —
  because they fail a build when a new version is published, not when the code
  changes. With them on and warnings as errors, the build would break on its
  own. Keep versions current on purpose instead.
- **No Gradle dependency verification.** Gradle can record a checksum for every
  artifact (`gradle/verification-metadata.xml`), and it is the strongest
  control available. It is left out because AGP's `aapt2` is published per
  operating system, so metadata written on one machine refuses the build on
  another until it is regenerated there. Repository content filtering, pinned
  versions and the wrapper checksum are what protects the build instead.
- **The Gradle bootstrap stays in `.gradle/bootstrap/`.** The recipe unpacks a
  Gradle distribution once to generate the wrapper, removes the archive, and
  leaves the unpacked copy in Gradle's ignored per-project cache directory
  rather than deleting a directory tree. Delete it whenever you like.
- **State in memory.** It survives rotation and dies with the process. Saving
  it is the first real decision the app will need, and it is yours.
- **Material 3's baseline colours**, not dynamic colour. Dynamic colour follows
  the wallpaper on Android 12 and later; it is a one-line change in
  `Theme.kt` if you want it.

## Pros

- Every part of the build is pinned, and the one binary in the repository is
  checked against Gradle's published checksum on every CI run.
- The screen is tested through the same semantics a screen reader uses.
- The release configuration is proved, not assumed: R8 ran, the APK is
  unsigned, not debuggable, and asks for nothing.
- Lint is a gate from the first commit, so there is no backlog of warnings to
  inherit.

## Cons

- **Nobody has run it on a phone.** See the notice above.
- **AGP, Kotlin and Compose each release several times a year**, and Compose's
  requirements move with AGP's: Compose 1.12 already needs AGP 9 and
  compileSdk 37. Upgrades are routine but not optional for long.
- **The first build is slow and large.** Gradle, AGP, the Android platform, R8
  and Robolectric's runtime are several hundred megabytes of downloads.

## Cost of adoption

About ten minutes for the recipe on a cold cache, most of it downloads and the
first Gradle build. JDK 21 or newer, `curl`, `sha256sum`, and the Android SDK
with its licences accepted — Android Studio provides the SDK and a JDK;
Gradle fetches the missing platform and build tools itself.
