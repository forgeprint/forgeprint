# Flutter Mobile App

A Flutter 3.47.5 app (Dart 3.13.4) for iOS, Android and the web, with the
parts a `flutter create` leaves out: one state library chosen and justified,
navigation through typed route objects, the app's rules in plain Dart with a
test that keeps the framework out of them, 36 tests including Flutter's own
accessibility guideline matchers, a strict analyzer as a gate, and a release
web build as the proof that all of it compiles.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run the app on a phone,
which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- `flutter create --empty` at Flutter 3.47.5, with the iOS, Android and web
  targets generated.
- **Riverpod 3.4.3** — one `Notifier` holding the list, tested through a
  `ProviderContainer.test()` with no widgets at all.
- **`go_router` 18.0.2** with typed route objects: `lib/src/routing/routes.dart`
  is the only file where a location is spelled, every path parameter is parsed
  there, and anything unparseable reaches `errorBuilder` instead of throwing
  during a build.
- **Rules in plain Dart** under `lib/src/rules`, with no framework import, and
  a test that reads the folder and fails on the first one — and fails rather
  than passes when the folder is empty.
- **36 tests**: the title rules, the framework boundary, the notifier, both
  screens, and every route including `/tasks/abc`, `/tasks/-1`, `/tasks/9999`
  and `/nowhere`.
- **Accessibility as a build failure**, as far as a test can reach:
  `labeledTapTargetGuideline`, `androidTapTargetGuideline`,
  `iOSTapTargetGuideline` and `textContrastGuideline` all run against the real
  screen. The theme raises Material 3's 40-pixel button to 48 because that
  test refuses the smaller one.
- **`very_good_analysis` 11.0.0**, pinned to the exact version, with
  `strict-casts`, `strict-inference`, `strict-raw-types` and
  `prefer_const_constructors` on — none of which `flutter_lints` 6.0.0
  enables. `flutter analyze` is clean with infos fatal.
- **`dart format --output=none --set-exit-if-changed .`** as a gate, not a
  reformat step.
- **Localisation wired up**: every user-facing string is a key in
  `lib/l10n/app_en.arb` with a description, `flutter gen-l10n` generates the
  Dart, and CI regenerates it and fails if the committed copy has drifted.
- **`.github/workflows/ci.yml`** running all of the above with actions pinned
  by commit, `permissions: contents: read` and `persist-credentials: false`,
  plus a Dependabot configuration for pub and for the actions.

## What CI cannot prove

Say this plainly, because a green pipeline invites people to read more into
it:

- **On-device behaviour.** `flutter test` runs on the Dart VM with a fake
  window. Gestures, the software keyboard, safe areas on a real notch, system
  text scaling as the platform applies it, frame timing, memory, and every
  platform channel are untested.
- **iOS.** Nothing here builds, signs or runs an iOS app. That needs macOS
  and Xcode, and a build you can hand to anybody needs a paid Apple Developer
  Program membership. `platforms` lists `ios` because `flutter create`
  generates the Runner project and the Dart compiles for it — not because a
  `.ipa` was produced.
- **Android packaging.** The recipe does not run `flutter build apk`. The
  Android project is generated and untouched, which means it carries
  Flutter's template defaults and not a decision: `minSdk` is whatever
  `flutter.minSdkVersion` currently is, no shrinker is configured,
  `android:allowBackup` is on, and — the one to read twice —
  `android/app/build.gradle.kts` gives the **release** build type
  `signingConfigs.getByName("debug")`, so `flutter build apk --release`
  produces an APK signed with the debug key. That key ships with every
  Android SDK and its password is published, so an APK signed with it is
  authenticated by nothing.
  Replace that block with a real signing configuration before you build
  anything you intend to hand to another person. "What you do next" says how.
- **Store submission.** No listing, no privacy declaration, no review.
- **What it looks like.** There is no golden test and no screenshot test; see
  the trade-off below.

## What you do next for a device build

1. **On a phone or emulator, today:** `flutter run` with a device connected.
   Android needs the free Android SDK and an accepted licence set; iOS needs
   macOS and Xcode.
2. **An installable Android build:** first replace the release
   `signingConfig` in `android/app/build.gradle.kts` — the template points it
   at the debug keys — with a keystore of your own, loaded from a
   `key.properties` that the generated `android/.gitignore` already refuses to
   commit. Then `flutter build apk --release`, or `flutter build appbundle`
   for Play. Decide `minSdk` and `android:allowBackup` in the same pass.
3. **An installable iOS build:** `flutter build ipa` on macOS, with a signing
   identity from an Apple Developer Program membership.
4. **Real device coverage:** add `integration_test`, run it with
   `flutter test integration_test` on an emulator, and use a tool that can tap
   a system permission dialog for any flow that meets one.

## Options

None. State management, routing and the lint set are each one decision, and
an option for each would be eight projects wearing one name
([ADR 0001](../../docs/decisions/0001-no-variants.md)).

## What it fits

- An iOS and Android app from one Dart codebase, by somebody who wants the
  structure decided before the second screen rather than after the tenth.
- A team that wants its CI to prove something about a mobile app without a
  macOS runner, an emulator or a paid service.
- A project where the rules are worth testing on their own — pricing, limits,
  validation — because the layout here makes that the cheap path.

## What it is NOT for

- **A React Native or TypeScript team.** Use `expo-mobile-app`: same three
  platforms, TypeScript, Expo Router, and a web export plus Hermes bundles as
  its proof.
- **An Android-only app that wants the platform's own toolchain.** Use
  `android-compose-app`: Kotlin, Jetpack Compose, Robolectric screen tests,
  Android lint and an actual R8 release APK. It proves packaging, which this
  blueprint does not; it covers one platform, which this one does not.
- **A web application.** The web build is a compile proof, not a product.
  A site whose users are on the web is `nextjs-fullstack-app`,
  `sveltekit-app` or `astro-content-site`.
- **An app with a backend.** There is no API client, no data layer, no
  authentication. Pair it with a service blueprint such as `ts-http-service`
  or `fastapi-service`, and keep the secrets there.
- **Games.** Flutter draws widgets, not a game loop. `flame` exists; this is
  not it.
- **Offline storage, push notifications, in-app purchases, deep-link
  verification.** None is set up. Each one brings a platform account, a
  device build or both, which is exactly what this recipe avoids.

## Trade-offs made on your behalf

- **Riverpod, not Bloc.** The catalog's demand research put `flutter_riverpod`
  at 3.27M pub.dev downloads in 30 days against `flutter_bloc`'s 1.98M, and
  Riverpod's `ProviderContainer.test()` lets the state be tested with no
  widget tree and no extra test package. Bloc's event log is the better fit
  where you need to replay what happened; if that is your project, replace
  the notifier and delete Riverpod rather than running both.
- **Hand-written typed routes, not `go_router_builder`.** The generator gives
  you `@TypedGoRoute` and code generation; it also gives you `build_runner`,
  a generated file per route file, and a second thing that has to stay in step
  with the formatter and the analyzer. A class with a `location` getter and a
  parser buys the same property — a location is spelled once, a parameter is
  parsed once — for one file and no build step. If the route table grows past
  a dozen entries, the generator starts paying for itself.
- **`very_good_analysis` 11.0.0, not `flutter_lints`.** The stricter set is
  the reason `prefer_const_constructors`, `unawaited_futures`,
  `discarded_futures`, `strict-casts` and `public_member_api_docs` are on. It
  is also opinionated in ways you may not want: 80-character lines, single
  quotes, required trailing commas, and a doc comment on every public member
  outside `lib/src`. That last one is why almost all the code lives under
  `lib/src`.
- **`const new(...)` constructors.** Dart 3.13 added the shorthand and this
  lint set requires it. It looks unfamiliar; it is what `dart fix` writes, and
  the alternative was switching one rule off in a set the blueprint otherwise
  takes as published.
- **No golden tests.** Flutter's own documentation warns that fonts render
  differently across platforms and Flutter versions. A golden is worth having
  only when one pinned platform generates it and everything else compares
  against that; a recipe that runs on an empty directory has nowhere to get
  such a file from, and generating it in the same run that checks it would
  compare CI with itself. The Flutter expert's `flutter-tests` checklist (FT5,
  FT6) says the same thing. Add goldens when you have a CI image you are
  willing to pin and regenerate from.
- **No `riverpod_lint`.** It is published and the catalog's Flutter expert
  asks for it (AG7), but it is an analyzer plugin, and the plugin story moved
  between the legacy mechanism and the new one during Dart 3.13. A plugin that
  silently does not run in `flutter analyze` is worse than no plugin, because
  it reads as coverage. Revisit when `dart.dev`'s analysis page documents the
  current mechanism as stable.
- **Localisation without a second locale.** Every string is an ARB key with a
  description and the delegates are wired, so adding a language is one file.
  The blueprint does not claim `requirements: i18n`, because one locale proves
  no translation — and the catalog is English-only
  ([ADR 0004](../../docs/decisions/0004-english-only-catalog.md)), so a
  translated ARB cannot live here.
- **The generated localisations are committed.** Flutter's synthetic package
  is gone, so they are ordinary source. Committing them means a clone
  analyses without a generation step; CI regenerates and diffs, so a stale
  copy fails.
- **Exact versions, no carets.** `pubspec.yaml` pins
  `flutter_riverpod: 3.4.3`, `go_router: 18.0.2`, `intl: 0.20.3` and
  `very_good_analysis: 11.0.0`, all read from pub.dev on 2026-09-30, and
  `pubspec.lock` is committed. Dependabot proposes every move.
- **The web build is the proof, not the product.** It is the one target that
  compiles the whole app with the production compiler on a Linux runner with
  no device, no emulator and no account. The verification greps the compiled
  bundle for a string from the app's own ARB file, so a build that compiled
  nothing of yours would fail.

## Pros

- The tests assert behaviour: a refused blank title, a trimmed title, a
  toggled row, a count that follows, four kinds of bad link, and the
  accessibility guidelines.
- The boundary between rules and framework is enforced by a test, not by a
  convention in a document.
- Every location in the app is in one file, and every route parameter is
  parsed in the same one.
- An unlabelled or undersized control fails the build rather than waiting for
  somebody with a screen reader to find it.
- Nothing in the recipe needs an account, a device, a macOS machine or a paid
  service.

## Cons

- **Nobody has run it on a phone.** See the notice at the top.
- **The app itself is small.** One list and one detail screen. It is the
  structure and the gates that are the deliverable, not the feature.
- **`very_good_analysis` is strict enough to be annoying** for the first
  hour: 80-character lines, trailing commas and a doc comment on every public
  member outside `lib/src`.
- **No persistence.** Close the app and the list is gone. Adding storage is
  the first thing most readers will do, and it is the change that brings the
  security questions with it.
- **Flutter's release cadence.** A stable release roughly every three months,
  each of which can move the analyzer, the formatter and the lint set
  together. These pins will age faster than a backend blueprint's.
- **`flutter build web` prints a warning** about missing Cupertino icon fonts,
  because the framework's own Cupertino widgets reference a font package the
  app does not depend on. It is noise, not a failure; adding
  `cupertino_icons` silences it at the cost of a dependency nothing uses.

## Cost of adoption

About five minutes for the recipe on a warm pub cache: most of it is the
first `flutter pub get` and the release web compile, which takes roughly a
minute on its own. Flutter 3.47.5 or newer is the only tool, and it brings
Dart 3.13.4 with it. No Android SDK, no Xcode, no device, no account.
