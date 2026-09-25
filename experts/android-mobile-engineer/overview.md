# Android Senior Mobile Engineer

## What it changes

An agent asked for an Android screen in Compose writes code that works in the
emulator: `collectAsState()` on a ViewModel flow, a `GlobalScope.launch`, an
`ArrayList` in `remember`, a Room schema change with
`fallbackToDestructiveMigration()`, the auth token in
`EncryptedSharedPreferences`, every permission requested in `onCreate`, and a
release build nobody ran with R8. With this expert:

- **State is hoisted and observable**, and composables are written for strong
  skipping, which has been the default since Kotlin 2.0.20.
- **Coroutines end with their owner**: `collectAsStateWithLifecycle`,
  `viewModelScope`, injected dispatchers, no `GlobalScope`, no swallowed
  cancellation.
- **The database schema is versioned like an API**: exported, committed, every
  migration tested, no destructive fallback.
- **Secrets use the Android Keystore directly**, because security-crypto 1.1.0
  deprecated `EncryptedSharedPreferences` — a change most generated code has
  not caught up with.
- **Permissions are asked in context** and denial disables one feature.
- **Semantics are checked in tests** with `enableAccessibilityChecks()`.
- **The release build is the product**: `targetSdk` 36 as Google Play has
  required since 2026-08-31, R8 optimization without broad keep rules, a
  baseline profile, and lint, detekt and ktlint as failing gates.

Six checklists — Compose state, coroutines and lifecycle, Room migrations,
Keystore and permissions, Compose semantics and tests, build gates.

## What it fits

- Writing or reviewing composables, ViewModels, repositories, Room entities and
  migrations, permission flows and release configuration in a single-platform
  Android app on Kotlin 2.4 and AGP 9.4.
- A pull request that bumps the database version, adds a permission, stores a
  secret or changes the release build type.
- Hilt or manual dependency injection: nothing here depends on which.

## What it does not fit

- **Module structure and Kotlin Multiplatform decisions** — Gradle module
  boundaries, what is shared across platforms, explicit API mode for
  libraries. That is `kotlin-senior-architect`, proposed alongside this
  expert.
- **A React Native app.** Use `react-native-mobile-engineer`.
- **A Flutter app.** Use `flutter-mobile-engineer`.
- **iOS.** No Swift sibling yet: a SwiftUI expert waits for a check that can
  run on macOS (expansion plan D21).
- **An app still built with Views and XML layouts.** The lifecycle, Room,
  Keystore, permission and build rows apply; the Compose rows do not, and
  there is no View-system equivalent here.
- **Wear OS, TV, Automotive and XR**, whose Play target API levels differ.
- **A security audit** — MASVS depth, pinning, tamper resistance:
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **A full accessibility audit**: the planned `accessibility-specialist`.

## Which mobile sibling

| The app is…                               | Use                            |
| ----------------------------------------- | ------------------------------ |
| TypeScript, React Native, usually on Expo | `react-native-mobile-engineer` |
| Dart and Flutter                          | `flutter-mobile-engineer`      |
| Kotlin and Jetpack Compose, Android only  | `android-mobile-engineer`      |

## Pros and cons

**In its favour:** almost every row is a Gradle setting, a lint result, a test
or a grep, and several rest on changes that are recent enough that an agent's
defaults are wrong: the security-crypto deprecation, the AGP 9.3 optimization
block, the API 36 requirement, Room 3's new package.

**Against it:** Android moves fast — Play's target level every year, Compose
roughly every quarter — so this is out of date sooner than most experts. It
cannot run a device, TalkBack or a macrobenchmark, and says so. It is
`provenance: generated`: drafted by a tool from the 2026-09-24 research, not
written from someone's practice.

**What `agents: [claude-code]` rests on.** Claude Code ran the checklist greps
over this repository, which has no Kotlin code: they are well-formed and
returned nothing. It has not been run against a real Android app. If it changes
nothing about what your agent does on one, say so in an issue.
