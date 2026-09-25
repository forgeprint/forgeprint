# Changelog

## 1.0.0 — 2026-09-25

A React Native and Expo engineer whose checks are exit codes and greps.

- **The SDK chooses versions**: `npx expo install`, `npx expo install --check`
  in the merge gate, `npx expo-doctor` before a release build, TypeScript
  strict, New Architecture only, Hermes confirmed in a release build.
- **Lists recycle**: stable keys, stable `renderItem`, `getItemLayout`, and the
  FlashList 2 rules — no estimates, no `key` inside a row, `useRecyclingState`.
- **Secrets in `expo-secure-store`**; AsyncStorage and `EXPO_PUBLIC_` treated
  as public; sign-out clears Keychain entries that survive uninstall.
- **Deep links parsed as input**, never an action without confirmation,
  verified links for anything sensitive.
- **Accessibility props by grep, then TalkBack and VoiceOver**, with a
  "not checked" section when that was not done.
- **OTA updates** on the `fingerprint` runtime-version policy, through a
  staging channel, with the rollback written down first.

Six checklists: SDK alignment, list rendering, secure storage, deep links,
React Native accessibility, OTA and tests.

`provenance: generated`: drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, the `mobile-engineer` row, and decision
D21 of the expansion plan) under ADR 0015, and **not manually verified**. Every
reference was read on 2026-09-25 with its version. Targets Expo SDK 57; re-read
when SDK 58 ships.
