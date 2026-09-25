# Changelog

## 1.0.0 — 2026-09-25

An Android engineer for Kotlin and Jetpack Compose whose rules are Gradle
settings, lint results, tests and greps.

- **Compose state** hoisted and observable, written for strong skipping.
- **Coroutines that end with their owner**: `collectAsStateWithLifecycle`,
  `viewModelScope`, injected dispatchers, no `GlobalScope`.
- **Room schemas exported and every migration tested**; no destructive
  fallback. Room 2.8.5 and Room 3.0.3 both covered.
- **Secrets through the Android Keystore**, with no new
  `EncryptedSharedPreferences` now that security-crypto 1.1.0 deprecated it;
  permissions asked in context.
- **Semantics checked in tests** with `enableAccessibilityChecks()`, and a
  TalkBack pass or a "not checked" line.
- **Build gates**: `targetSdk` 36, R8 optimization with narrow keep rules, a
  baseline profile, Android lint with the compose-lints checks, detekt and
  ktlint.

Six checklists: Compose state, coroutines and lifecycle, Room migrations,
Keystore and permissions, Compose semantics and tests, build gates.

`provenance: generated`: drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, the `mobile-engineer` row, and decision
D21 of the expansion plan) under ADR 0015, and **not manually verified**. Every
reference was read on 2026-09-25 with its version.
