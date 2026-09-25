# Android Compose App — agent context

A single-module Android app in Kotlin on Jetpack Compose and the Android Gradle
plugin 9. Read this before adding a screen, a dependency or a permission.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has run the app on a phone. Treat it as a
> starting point that builds and tests, not as a design somebody has shipped.

## The shape

```
gradle/libs.versions.toml                every version, in one place
gradle/wrapper/                          Gradle 9.7.1, pinned by SHA-256
settings.gradle.kts                      the only two repositories
app/build.gradle.kts                     SDK levels, R8, lint, dependencies
app/src/main/java/com/example/tasks/
  domain/                                rules in plain Kotlin: no Android imports
  ui/tasks/TasksViewModel.kt             the only writer of the screen's state
  ui/tasks/TasksScreen.kt                TasksRoute (wired) and TasksScreen (stateless)
  ui/theme/Theme.kt                      MaterialTheme, and nothing else
  MainActivity.kt                        the window, then setContent
app/src/test/java/com/example/tasks/     every test; all of them run on the JVM
```

## Build, test, run

```
./gradlew testDebugUnitTest     rules, ViewModel, and the screen under Robolectric
./gradlew lint                  warnings are errors
./gradlew assembleDebug         app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease       R8-shrunk and unsigned
./gradlew installDebug          onto a connected device or a running emulator
```

JDK 21 or newer, and the Android SDK at `ANDROID_HOME`. Robolectric's runtime
for API 37 is compiled for Java 21, which is why the floor is 21 and not the
17 the Android Gradle plugin itself accepts.

Two test-only settings in `app/build.gradle.kts` look removable and are not.
The `jvmArgs` open `jdk.internal.access` and `java.io` to the unit-test JVM,
because Robolectric simulates Android's shared memory through the JDK's file
descriptors; without them every Robolectric test fails before it starts. The
explicit Espresso 3.7.0 replaces the 3.5.0 that Compose's test library brings,
which calls an Android method API 37 removed. Drop either only after the
screen tests pass without it.

## Rules that are not style preferences

**The ViewModel is the only writer of UI state.** `TasksViewModel` holds a
private `MutableStateFlow` and exposes it as `StateFlow`. A screen that keeps
its own copy of the tasks in `remember` has two sources of truth, and the one
that loses on rotation is the one the user was looking at.

**Collect with `collectAsStateWithLifecycle`, never `collectAsState`.** The
lifecycle-aware collector stops when the app goes to the background. The plain
one keeps collecting — harmless with this in-memory state, and a battery and
data drain the day the flow is backed by a database or the network.

**`update {}` lambdas have no side effects.** `MutableStateFlow.update` may run
its lambda more than once when two writers race. That is why the next task id
is derived from the current state rather than taken from a counter.

**Every screen comes in two halves.** `TasksRoute` obtains the ViewModel and
collects its state; `TasksScreen` takes plain values and lambdas. Previews and
most tests use the stateless half, and a screen that takes a ViewModel directly
can be neither previewed nor tested without one.

**`domain/` imports nothing from Android.** `DomainBoundaryTest` reads the
package's sources and fails on an `android.` or `androidx.` import. The rules
there are tested in milliseconds on the JVM, and they outlive any change of UI
toolkit only as long as they stay out of it.

**User-visible text is a string resource.** The domain reports _why_ a title
was refused as an enum, and the screen maps it to `R.string`. A string built in
Kotlin cannot be translated, and a count built with `"$n tasks"` is wrong in
English for one and in most other languages for more.

**Tests find nodes the way a user does.** By visible text, by role, by the
action a node supports. A `testTag` is the last resort, because a control a
test can only find by tag is one a screen reader may not be able to find at
all.

**Versions live in `libs.versions.toml`, and Compose versions live in the
BOM.** Never write a version on a Compose artifact in a build file: the BOM
keeps `ui`, `material3` and `ui-test` on versions that were released together,
and one overridden version breaks that silently.

**No dynamic versions.** No `+`, no `latest.release`, no ranges. A build that
resolves differently tomorrow is a build that fails for reasons nobody changed.

**No new repository.** `settings.gradle.kts` sets `FAIL_ON_PROJECT_REPOS` and
restricts Google's repository to Google's groups. Adding a repository widens
where any dependency can come from, including the ones already here.

## Lint is a gate, not a report

`warningsAsErrors = true`. Fix the warning; do not add a baseline. A baseline
turns every existing warning into one nobody reads again, and this project
starts with none.

Four checks are disabled, and the reason is written beside them: they turn red
when somebody else publishes a release, on a commit that changed nothing.
Dependabot proposes version updates weekly, one pull request each; review
them against the library's release notes and let CI decide. Do not disable
another check without writing the reason next to it.

Dependabot does not move `compileSdk` or `targetSdk`, and with `OldTargetApi`
off nothing else will either. Google Play raises its target API floor every
year on 31 August; raise `targetSdk` before then, read that Android release's
behaviour changes, and run the app on a device at the new level.

## Release builds and signing

`assembleRelease` runs R8 (`isMinifyEnabled`, `isShrinkResources`) and produces
`app-release-unsigned.apk`. There is no `signingConfig`, and there must never be
a keystore, a password or a `keystore.properties` in this repository;
`.gitignore` refuses the usual file names.

When the app is ready to ship, sign it outside the repository: Play App Signing
with an upload key kept by whoever publishes, and the upload key's location
and passwords supplied to the build by the environment on the machine that
signs, never by a committed file. Play requires an Android App Bundle
(`./gradlew bundleRelease`), not an APK.

**R8 removes what it cannot see used.** Reflection, serialisation by class
name, and JNI need a keep rule in `app/proguard-rules.pro`, with a comment
saying which class and why. A release build that crashes and a debug build that
works is almost always this. Test the release build before calling a change
done.

## Permissions, network and data

The manifest requests no permission and the app reaches no network. The only
`uses-permission` in the built APK is the signature-level one AndroidX Core
declares for its own unexported receivers.

When you add a permission, add the smallest one that works, request it at the
moment it is needed, and handle the refusal. When you add networking: HTTPS
only (cleartext is refused by default from API 28 on; do not re-enable it), no
secret in the APK — anything in an app bundle can be extracted — and a
`network_security_config` if you pin anything.

Nothing leaves the device through backup or device transfer:
`android:allowBackup="false"` and `fullBackupContent="false"` cover Android 11
and earlier, and `res/xml/data_extraction_rules.xml` excludes every domain on
Android 12 and later. When the app starts storing data, include in those rules
only the paths that are safe to copy off the device — never a token, a key or
anything a user would not expect on a new phone.

## When you are asked to add a screen

1. A state class, a ViewModel that owns a `MutableStateFlow` of it, and pure
   functions in `domain/` for any rule the screen enforces.
2. A `…Route` composable that collects with `collectAsStateWithLifecycle`, and
   a stateless `…Screen` that takes the state and lambdas.
3. Strings in `res/values/strings.xml`, plurals for counts.
4. A ViewModel test on the plain JVM, and a Robolectric test of the screen that
   finds nodes by text or role.
5. `./gradlew lint testDebugUnitTest assembleRelease`, all three green.

Navigation between screens is not set up. Add Navigation Compose from the
catalog when there is a second screen, not before.

## What this does not do

No persistence: tasks are lost when the process dies. No networking, no
dependency injection framework, no navigation, no instrumented tests on a
device or emulator, no screenshot tests, no baseline profile, no signing, no
Play upload. Each of these is a decision to make when the app needs it.
