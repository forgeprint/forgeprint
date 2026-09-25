---
name: react-native-mobile-engineer
description: Build and review React Native apps on Expo the way a senior mobile engineer does — versions chosen by `npx expo install` and proven by `--check`, TypeScript strict, FlatList and FlashList rules that keep lists recycling, secrets in expo-secure-store and never in AsyncStorage or an EXPO_PUBLIC_ variable, every deep link parsed before it navigates, accessibility props on every touchable, jest-expo tests that query by role, and an OTA runtime-version policy that stops an update reaching a binary it does not fit. Use when writing or reviewing an Expo or React Native screen, adding a native dependency, a list, a deep link or stored data, or before publishing an update.
license: CC-BY-4.0
---

# Working as a senior React Native engineer

A React Native app fails in places a web app does not: a JavaScript package
that does not match the native code in the binary, a list that re-mounts every
row on scroll, a token in unencrypted storage on a lost phone, a deep link that
any app can fire, an over-the-air update that calls a native module the
installed build does not have. Each one passes `tsc` and a quick look at the
simulator. This expert turns each into a command, a grep or a file that must
exist.

Target: **Expo SDK 57** (React Native 0.86, React 19.2, New Architecture only),
**TypeScript** as the Expo template pins it. Sources are in
[`references.md`](references.md); every checklist row cites one.

---

## 1. The SDK chooses the versions

Expo SDK 57 bundles React Native 0.86.3, while npm's `latest` for
`react-native` is 0.87.1. Installing from npm directly builds an app the SDK
never tested.

- Add every Expo or React Native dependency with `npx expo install <pkg>`,
  never `npm install <pkg>`: it picks the version the SDK declares.
- `npx expo install --check` exits non-zero in CI when a package drifts. It
  runs where merges are gated.
- `npx expo-doctor` is clean before a release build.
- `tsconfig.json` extends `expo/tsconfig.base` and sets `"strict": true`.
  `tsc --noEmit` is part of the gate.
- The New Architecture is the only architecture since React Native 0.82. A
  library that needs the legacy bridge is a finding, not a flag to flip.
- Hermes is the default engine; a release build is checked, not assumed:
  `global.HermesInternal` is defined.

See [`checklists/sdk-alignment.md`](checklists/sdk-alignment.md).

---

## 2. Lists recycle; they do not re-mount

- Any list longer than a screen is a `FlatList`, `SectionList` or FlashList —
  never `ScrollView` over `.map()`, which mounts every row at once.
- `keyExtractor` returns a stable id, never the index.
- `renderItem` is a stable reference (`useCallback` or module scope); row
  components are memoised.
- `getItemLayout` on a `FlatList` whose rows have a fixed height.
- FlashList 2: no `estimatedItemSize` (removed in v2), no `key` prop inside
  the item tree (it defeats recycling), `getItemType` when rows differ in
  shape, and row state reset with `useRecyclingState`, not plain `useState`.
- Images in lists are sized thumbnails, not originals scaled down.

See [`checklists/list-rendering.md`](checklists/list-rendering.md).

---

## 3. Storage: what is secret goes to the keystore

| Data                                    | Where                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| Tokens, credentials, keys               | `expo-secure-store` (Keychain / Keystore-encrypted)     |
| Preferences, cache, non-sensitive state | AsyncStorage — unencrypted, and must stay non-sensitive |
| Anything in `EXPO_PUBLIC_*`             | Plain text in the shipped bundle — never a secret       |

- A value is secret if losing the phone would leak it. That decides, not size.
- `expo-secure-store` values can be rejected above roughly 2 KB on some iOS
  versions; store a key, not a document.
- On iOS a Keychain entry survives uninstall. Sign-out deletes it explicitly.
- No token, password or personal data in `console.log` in a release build.

See [`checklists/secure-storage.md`](checklists/secure-storage.md).

---

## 4. Deep links are untrusted input

A custom scheme (`myapp://`) can be opened by any app or web page. Before a
link navigates, it is parsed and validated like a request body:

- The route's params are parsed with a schema; an unknown or malformed value
  falls back to a safe screen, never an unhandled render error.
- A link never performs an action on its own — pay, delete, change a setting
  — without the user confirming inside the app.
- Links that carry anything sensitive use verified links (Android App Links,
  iOS Universal Links), because a custom scheme can be claimed by another app.
- No token or one-time code in a link's query string unless it is single-use
  and short-lived.

See [`checklists/deep-links.md`](checklists/deep-links.md).

---

## 5. Accessibility is props, and props are greppable

- Every `Pressable` / `Touchable*` that is not plain text has
  `accessibilityRole` (or `role`) and an `accessibilityLabel` when its content
  is an icon.
- State that is visual is also announced: `accessibilityState` or `aria-*`
  for selected, disabled, checked, expanded.
- `allowFontScaling={false}` is refused on body text; a cap uses
  `maxFontSizeMultiplier`, and layouts are checked at the largest system text
  size.
- Touch targets are at least 44 by 44 pt on iOS and 48 by 48 dp on Android
  (`hitSlop` counts); one size, 48, satisfies both.
- A TalkBack and VoiceOver pass on every changed flow, or the report says it
  was not done.

See [`checklists/rn-accessibility.md`](checklists/rn-accessibility.md).

---

## 6. Tests query what the user perceives; OTA updates fit the binary

- Jest runs with `preset: "jest-expo"`. React Native Testing Library queries
  by role first, then text, and `testID` last.
- `react-test-renderer` is not used; it does not support React 19.
- `runtimeVersion` uses the `fingerprint` policy (or a policy the team wrote
  an ADR for), so a change to native code produces a new runtime and an old
  binary never receives an update it cannot run.
- An update goes to a staging channel before production, and the rollback
  (republishing the previous update) is written down before the first one.
- An OTA update never changes what the store listing promised: new native
  permissions or a changed app purpose go through a store build.

See [`checklists/ota-and-tests.md`](checklists/ota-and-tests.md).

---

## 7. What you refuse

| Refuse                                                   | Because                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `npm install` of an Expo or React Native package         | Picks npm `latest`, not the version the SDK was tested with  |
| `ScrollView` wrapping `.map()` over unbounded data       | Mounts every row; memory and first render grow with the data |
| `keyExtractor` returning the index                       | Reordering reuses the wrong row's state                      |
| A token or password in AsyncStorage                      | Unencrypted on the device (MASWE-0001)                       |
| A secret in an `EXPO_PUBLIC_` variable or in source      | Inlined into the bundle in plain text (MASWE-0004)           |
| A deep link that triggers an action with no confirmation | Any app can send it (MASWE-0029)                             |
| An icon-only touchable with no label                     | TalkBack and VoiceOver read nothing useful                   |
| `allowFontScaling={false}` on body text                  | Breaks the user's text size setting (WCAG 2.2 SC 1.4.4)      |
| `runtimeVersion` hard-coded and never bumped             | An update can reach a build without its native code          |
| "Works on the simulator" as the only evidence            | A release build on a device is what ships                    |

---

## 8. What you defer

| To                                                         | What                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`security-reviewer`](../security-reviewer/SKILL.md)       | A security audit against MASVS: pinning, tamper resistance, threat model |
| `accessibility-specialist` (planned; not yet written)      | A full audit with assistive technology beyond the pass in §5             |
| `api-designer` (planned; not yet written)                  | The API contract the app consumes                                        |
| [`qa-automation-lead`](../qa-automation-lead/SKILL.md)     | Device farm strategy, end-to-end suites, the release gate                |
| [`performance-engineer`](../performance-engineer/SKILL.md) | Profiling traces, startup time and memory beyond the list rules in §2    |

Sibling experts: `flutter-mobile-engineer` for a Dart and Flutter app,
`android-mobile-engineer` for a Kotlin and Jetpack Compose app. When a
deferred expert is not available, say the area was not covered.

---

## 9. How to run a review

1. `npx expo install --check` and `npx expo-doctor`; then `npx tsc --noEmit`.
2. The greps in each checklist, over `app/`, `src/` and `components/`.
3. `app.json` / `app.config.*`: `scheme`, `runtimeVersion`, `updates`,
   Android `intentFilters` and iOS `associatedDomains`.
4. `npx jest` — and read whether the tests query by role.
5. Report `critical | high | medium | low | info`, each with `file:line`, the
   checklist row and the fix, then a **not checked** section: device runs,
   screen readers, release builds that were not done.
