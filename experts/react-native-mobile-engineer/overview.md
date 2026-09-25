# React Native Senior Mobile Engineer

## What it changes

An agent asked to add a screen to an Expo app will `npm install` the library it
remembers, render a list with `ScrollView` and `.map()`, keep the auth token in
AsyncStorage because the example did, read deep-link params as though their
type annotation were true, and call it done when the simulator shows the
screen. Each of those compiles and each of them ships a defect. With this
expert:

- **The SDK chooses versions.** `npx expo install` adds packages and
  `npx expo install --check` gates merges, because Expo SDK 57 bundles
  React Native 0.86.3 while npm `latest` is 0.87.1.
- **Lists recycle.** Stable keys, stable `renderItem`, `getItemLayout` where
  rows are fixed, and the FlashList 2 rules that are silent when broken: no
  `key` inside a row, `useRecyclingState` for row state.
- **Secrets go to the keystore.** `expo-secure-store` for tokens; AsyncStorage
  and `EXPO_PUBLIC_` are treated as public.
- **Deep links are input.** Parsed, bounded, never an action without
  confirmation, verified links for anything sensitive.
- **Accessibility props are checked by grep and by a screen reader**, and the
  report says which screens were not walked.
- **OTA updates cannot land on the wrong binary**: the `fingerprint`
  runtime-version policy, a staging channel, and the rollback written down
  first.

Six checklists — SDK alignment, list rendering, secure storage, deep links,
React Native accessibility, OTA and tests — each row a command or a reading
with a versioned source.

## What it fits

- Writing or reviewing screens, lists, navigation and storage in an Expo app on
  SDK 57, including one using Expo Router.
- A bare React Native 0.82+ app: every row except the Expo-specific ones
  (SA1–SA4, SS2, OT5–OT8) applies unchanged.
- A pull request that adds a native dependency, a list, a stored value, a deep
  link route or an OTA update.

## What it does not fit

- **A Flutter app.** Use `flutter-mobile-engineer`: Dart, widgets, `flutter
analyze`, golden tests.
- **A native Android app in Kotlin.** Use `android-mobile-engineer`: Jetpack
  Compose, coroutines, Room, R8.
- **A native iOS app in Swift.** Not covered by any sibling yet: a SwiftUI
  expert waits for a check that can run on macOS (expansion plan D21).
- **A security audit.** This expert applies the storage, link and network rows
  an engineer owns and defers the MASVS audit, pinning and tamper resistance to
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **A full accessibility audit.** It runs a first pass; the audit belongs to an
  `accessibility-specialist` expert, planned and not yet written.
- **The API contract** the app consumes: an `api-designer` expert, planned.
- **React Native for web or desktop** targets. The rows assume iOS and Android.

## Which mobile sibling

| The app is…                               | Use                            |
| ----------------------------------------- | ------------------------------ |
| TypeScript, React Native, usually on Expo | `react-native-mobile-engineer` |
| Dart and Flutter                          | `flutter-mobile-engineer`      |
| Kotlin and Jetpack Compose, Android only  | `android-mobile-engineer`      |

## Pros and cons

**In its favour:** it is tied to the SDK, so its checks are exit codes rather
than advice, and it names the React Native defects that pass type-checking —
index keys, recycled row state, unencrypted tokens, hijackable links, OTA runtime
mismatches.

**Against it:** it moves with every Expo SDK, roughly three a year, and a
reference older than one SDK is already partly wrong. It cannot run a device or
a screen reader, so the rows that need one are reported as not checked unless a
person ran them. And it is `provenance: generated`: drafted by a tool from the
2026-09-24 research, not written from someone's practice.

**What `agents: [claude-code]` rests on.** Claude Code applied the greps in
`list-rendering.md`, `secure-storage.md` and `rn-accessibility.md` to this
catalog's own repository, which has no React Native app: every grep ran and
returned nothing, which shows the commands are well-formed and nothing more. It
has not been run against a real Expo app. If it changes nothing about what your
agent does on one, say so in an issue — that is the evidence it most needs.
