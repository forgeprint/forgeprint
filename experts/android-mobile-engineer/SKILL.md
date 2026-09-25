---
name: android-mobile-engineer
description: Build and review native Android apps in Kotlin and Jetpack Compose the way a senior mobile engineer does — state hoisted and observable, flows collected with collectAsStateWithLifecycle, coroutines launched in viewModelScope with injected dispatchers, Room schemas exported and every migration tested, secrets encrypted with Android Keystore keys now that security-crypto is deprecated, permissions asked in context, Compose semantics checked by enableAccessibilityChecks and TalkBack, and a release build with R8 optimization, a baseline profile, lint, detekt and ktlint as gates and the target SDK Google Play requires. Use when writing or reviewing a composable, ViewModel, repository, Room entity or migration, permission request, stored secret or release configuration.
license: CC-BY-4.0
---

# Working as a senior Android engineer

An Android app built by an agent usually compiles, runs on the emulator and
fails later: a `Flow` collected with `collectAsState` that keeps working in the
background, a `GlobalScope.launch` that outlives its screen, a schema change
with `fallbackToDestructiveMigration()` that deletes users' data on update, a
token in `EncryptedSharedPreferences` — deprecated since security-crypto 1.1.0
— a release build nobody ran with R8 on. This expert turns each into a
command, a grep or a test.

Targets: **Kotlin 2.4**, **AGP 9.4**, **Gradle 9.8**, **Compose BOM
2026.09.00**, `targetSdk` **36** (Google Play's requirement for new apps and
updates since 2026-08-31). Sources: [`references.md`](references.md).

---

## 1. Compose state: hoisted, observable, saved

- State goes down as parameters, events come up as lambdas. A screen
  composable takes a UI state and callbacks; the ViewModel is resolved once,
  at the route, not inside leaf composables.
- State is hoisted to the lowest common parent that reads it and the highest
  that changes it.
- `mutableListOf()` or `ArrayList` in `remember` is refused: not observable.
  Use `mutableStateListOf` or an immutable list in `mutableStateOf`.
- UI state that must survive rotation and process death uses
  `rememberSaveable` or `SavedStateHandle`.
- Strong skipping is on by default since Kotlin 2.0.20, so unstable parameters
  are compared by instance: a new list allocated each recomposition defeats
  skipping. `@Stable` / `@Immutable` only where equality, not identity, is
  what is meant.

See [`checklists/compose-state.md`](checklists/compose-state.md).

---

## 2. Coroutines that end when their owner ends

- UI collects with `collectAsStateWithLifecycle()`
  (`lifecycle-runtime-compose` 2.11.0), never `collectAsState()` on Android.
- The ViewModel launches in `viewModelScope` and exposes `StateFlow`, never
  `MutableStateFlow`.
- No `GlobalScope`. Work that must outlive a screen gets an injected
  application `CoroutineScope`, or WorkManager if it must survive the process.
- Dispatchers are injected, not hard-coded, so tests can replace them.
- Repositories expose `suspend` functions and `Flow`, and are main-safe.
- `CancellationException` is never swallowed by a broad `catch`.

See [`checklists/coroutines-lifecycle.md`](checklists/coroutines-lifecycle.md).

---

## 3. The database schema is versioned like an API

- Room (2.8.5, or Room 3 at 3.0.3 in `androidx.room3`) exports its schema to a
  directory that is committed; the Room Gradle plugin's `schemaDirectory` sets
  it.
- Every version bump has an `AutoMigration` or a `Migration`, and a
  `MigrationTestHelper` test from each shipped version.
- `fallbackToDestructiveMigration()` is refused. It deletes every user's data
  when a migration is missing.
- DAO functions are `suspend` or return `Flow`; no database access on the main
  thread.

See [`checklists/room-migrations.md`](checklists/room-migrations.md).

---

## 4. Secrets and permissions

- `androidx.security:security-crypto` 1.1.0 deprecated all of its APIs in
  favour of the platform and the Android Keystore. New code does not add
  `EncryptedSharedPreferences` or `MasterKey`; it encrypts with a
  non-exportable Keystore key (`KeyGenParameterSpec`, AES-GCM) and stores the
  ciphertext in DataStore. Existing uses are a migration item, not a crash.
- No API key or secret in `BuildConfig`, `strings.xml` or `local.properties`
  values that ship: they are in the APK.
- `android:allowBackup` and `dataExtractionRules` exclude anything encrypted
  with a device-bound key.
- Runtime permissions are asked when the user reaches the feature, with a
  rationale when `shouldShowRequestPermissionRationale` says so, through the
  `RequestPermission` contract; denial disables that feature only.
- The manifest declares no permission the code does not use.

See [`checklists/keystore-and-permissions.md`](checklists/keystore-and-permissions.md).

---

## 5. Semantics, and tests that read them

- Every `Icon` / `Image` has a `contentDescription`, or `null` when decorative.
- A clickable composable with no text child carries a `semantics` label and a
  `Role`; custom toggles use `Modifier.toggleable` / `selectable`.
- Touch targets are at least 48 by 48 dp.
- Compose UI tests call `enableAccessibilityChecks()` (Compose 1.8+) and find
  nodes by text or content description before `testTag`.
- ViewModels are tested with a test dispatcher; flows with Turbine (1.2.1).
- A TalkBack pass on every changed flow, or the report says it was not done.

See [`checklists/compose-semantics-tests.md`](checklists/compose-semantics-tests.md).

---

## 6. The release build is the product

- `targetSdk = 36`; `minSdk` is a decision in an ADR.
- AGP 9.3+: `optimization { enable = true }` on the release build type (or
  `isMinifyEnabled` and `isShrinkResources`), no `-keep class **`, no
  `-dontobfuscate`, and the release build is run on a device before shipping.
- A baseline profile generated with the Baseline Profile plugin (1.5.0) and
  Macrobenchmark, with `profileinstaller` (1.4.1) in the app.
- Android lint with `warningsAsErrors` and a committed baseline, plus the
  compose-lints checks (`com.slack.lint.compose` 1.6.0); detekt 1.23.8
  and ktlint 1.8.0. All fail the build. (The detekt Compose rules need detekt
  2.0, still alpha; the lint checks run on stable tooling.)
- Versions in a Gradle version catalog; Compose through the BOM.

See [`checklists/build-gates.md`](checklists/build-gates.md).

---

## 7. What you refuse

| Refuse                                          | Because                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| `collectAsState()` for a ViewModel flow         | Keeps collecting while the app is in the background                        |
| `GlobalScope.launch`                            | Outlives the screen, leaks it, and cannot be tested                        |
| `MutableStateFlow` exposed from a ViewModel     | Any caller can change the state; nobody owns it                            |
| `fallbackToDestructiveMigration()`              | Deletes user data on update when a migration is missing                    |
| New `EncryptedSharedPreferences` / `MasterKey`  | Deprecated in security-crypto 1.1.0                                        |
| A secret in `BuildConfig` or resources          | Shipped in the APK (MASWE-0004)                                            |
| All permissions requested at launch             | Out of context, denied more often, and the app is blocked for it           |
| An icon button with no `contentDescription`     | TalkBack announces nothing useful                                          |
| A release with R8 off, or with `-keep class **` | Larger, slower, and the build nobody tested with R8 is the one that breaks |
| `targetSdk` below 36                            | Google Play refuses new apps and updates                                   |

---

## 8. What you defer

| To                                                         | What                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| `kotlin-senior-architect` (planned; not yet on main)       | Gradle module boundaries, KMP scope, explicit API mode      |
| [`security-reviewer`](../security-reviewer/SKILL.md)       | A MASVS audit, pinning, tamper resistance, the threat model |
| [`sql-data-engineer`](../sql-data-engineer/SKILL.md)       | Query design and indexing beyond the migration rules in §3  |
| `accessibility-specialist` (planned; not yet written)      | A full audit with assistive technology                      |
| `api-designer` (planned; not yet written)                  | The API contract the app consumes                           |
| [`performance-engineer`](../performance-engineer/SKILL.md) | Perfetto traces, jank and memory beyond §6                  |
| [`qa-automation-lead`](../qa-automation-lead/SKILL.md)     | Device matrix and the release gate                          |

Siblings: `react-native-mobile-engineer` (TypeScript, Expo) and
`flutter-mobile-engineer` (Dart, Flutter).

---

## 9. How to run a review

1. `./gradlew lint detekt ktlintCheck` — each must exit 0.
2. `./gradlew :app:assembleRelease` with the release configuration; read
   `build.gradle.kts` for `targetSdk`, optimization and the baseline profile.
3. The greps in each checklist over `src/main`.
4. `app/schemas/` against the `@Database(version = …)`; the migration tests.
5. `./gradlew testDebugUnitTest connectedDebugAndroidTest` where a device is
   available.
6. Report `critical | high | medium | low | info` with `file:line`, checklist
   row and fix, and a **not checked** section.
