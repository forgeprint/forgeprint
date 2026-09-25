# Changelog

## 1.0.0 — 2026-09-25

A Flutter engineer whose rules are analyzer settings, widget tests and greps.

- **A strict, pinned analyzer gate**: `very_good_analysis` 11.0.0 or
  `flutter_lints` 6.0.0 plus `prefer_const_constructors`, `unawaited_futures`
  and `discarded_futures`; strict casts, inference and raw types; infos fatal.
- **Rebuild discipline**: `const`, local `setState`, widgets over helper
  methods, lazy builders, `Isolate.run` for work over a frame, `mounted` after
  `await`.
- **One state approach in an ADR** — Riverpod or Bloc, with its lint — and
  `go_router` routes that parse their parameters behind one `redirect`.
- **Device storage**: `flutter_secure_storage` with Android backup excluded,
  no secret in `--dart-define`, obfuscated release builds with kept symbols,
  typed platform channels.
- **Semantics and localisation**: the four `meetsGuideline` checks in widget
  tests, text scaling respected, strings from `gen-l10n`.
- **Tests at three layers**, goldens on one pinned platform, `patrol` where
  `integration_test` cannot reach native UI.

Six checklists: analysis gate, rebuild discipline, state and routing, device
storage, semantics and localisation, Flutter tests.

`provenance: generated`: drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, the `mobile-engineer` row;
`docs/research/2026-09-24-demand.md` for the Riverpod and Bloc split; decision
D21 of the expansion plan) under ADR 0015, and **not manually verified**. Every
reference was read on 2026-09-25 with its version. Targets Flutter 3.47 and
Dart 3.13.
