# Changelog — flutter-mobile-app

## 1.0.0 — 2026-09-30

First version, and the catalog's first Dart blueprint.

Flutter 3.47.5 (Dart 3.13.4) scaffolded with `flutter create --empty` for
iOS, Android and the web, then given the parts the scaffolder leaves open:
Riverpod 3.4.3 for state, `go_router` 18.0.2 behind typed route objects, the
rules in plain Dart under `lib/src/rules` with a test that keeps the
framework out, localisation through `flutter gen-l10n`, `very_good_analysis`
11.0.0 with infos fatal, `dart format --set-exit-if-changed` as a gate, 36
tests, a CI workflow with actions pinned by commit, and
`flutter build web --release` as the build proof.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
which ranked this the ninth strongest uncovered combination:
`flutter/flutter` at 179.1k stars, and on pub.dev over 30 days `dio` 4.52M,
`go_router` 4.31M, `flutter_riverpod` 3.27M and `flutter_bloc` 1.98M. A tool
drafted it and CI runs it; nobody has run the app on a device, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Every version was read from the pub.dev API and Flutter's release history on
2026-09-30. The recipe was run end to end from an empty directory on Flutter
3.47.5 / Dart 3.13.4 on Linux, through the repository's own recipe parser:
all 29 steps and all 29 verifications passed, `flutter analyze` reported no
issues, 36 tests passed, and `flutter build web --release` produced a bundle
containing the app's own strings.

Six things came out of building it rather than describing it.

**Riverpod over Bloc, on the download numbers and on testability.**
`flutter_riverpod` leads `flutter_bloc` 3.27M to 1.98M over 30 days, and
`ProviderContainer.test()` tests the whole state layer with no widget tree
and no extra test package.

**`very_good_analysis` 11.0.0 requires the Dart 3.13 constructor shorthand.**
Its `unnecessary_type_name_in_constructor` rewrites `const Task({...})` to
`const new({...})`. The alternative was disabling a rule in a set the
blueprint otherwise takes as published; `dart fix --apply` makes the
migration a single command, so the shorthand stayed.

**`public_member_api_docs` decided the folder layout.** It applies to `lib/`
but not to `lib/src/`, so everything except `main.dart` lives under
`lib/src/` and the doc-comment requirement lands where it is useful.

**`flutter pub get` rewrites `analysis_options.yaml`** when the file does not
already exclude `build/`, `android/`, `ios/` and `web/`. The recipe writes
those excludes itself, so the file it wrote is the file that stays.

**`intl` is pinned to 0.20.3, not 0.20.2**, because `flutter_localizations`
in this SDK depends on `^0.20.3` and version solving refuses anything lower.

**Material 3 buttons are 40 pixels tall and the accessibility guideline
matcher wants 48.** `androidTapTargetGuideline` failed until `buildTheme()`
raised the minimum, which is the check doing its job rather than a defect.

### Planned

- Golden tests, once there is a pinned CI image to generate them from. Doing
  it any other way compares CI with itself
  (`experts/flutter-mobile-engineer/checklists/flutter-tests.md`, FT5 and
  FT6).
- `riverpod_lint`, when the Dart analyzer plugin mechanism it uses is
  documented as stable. A plugin that silently does not run reads as coverage
  and is not.
- `integration_test` on an emulator, which needs a runner with the Android
  SDK and a device image.
- Nothing that needs an account, a device or a macOS machine will enter the
  recipe; `overview.md` says what to do instead.
