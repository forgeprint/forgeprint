# Flutter Mobile App — agent context

A Flutter 3.47 app on Dart 3.13 for iOS, Android and the web: Riverpod 3 for
state, `go_router` 18 for navigation, the rules in plain Dart, and
`very_good_analysis` 11 as the gate. Read this before adding a screen, a
route, a dependency or anything that stores data.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has run the app on a phone. Treat it as a
> starting point that compiles and passes its tests, not as a design somebody
> has shipped to a store.

## The shape

```
lib/main.dart                   runApp inside the one ProviderScope
lib/l10n/app_en.arb             every user-facing string
lib/l10n/app_localizations*.dart  generated, committed, never hand-edited
lib/src/rules/                  plain Dart: no framework import, ever
lib/src/state/                  Riverpod notifiers; they apply the rules
lib/src/routing/routes.dart     every location in the app, as objects
lib/src/routing/router.dart     the GoRouter, including the error path
lib/src/ui/                     screens and the widgets they are built from
test/app_harness.dart           pumpApp and addTask, used by every widget test
```

## Rules that are not style preferences

**`lib/src/rules` may not import the framework.** No `package:flutter/`, no
`flutter_riverpod`, no `go_router`, no `dart:ui`.
`test/rules/rules_are_flutter_free_test.dart` reads every file in that folder
and fails the build on the first such import — and it fails rather than passes
when the folder is empty, so moving the code does not defeat it. The point is
not purity: a rule that needs a `WidgetTester` to be exercised gets tested
once and then not again.

**State has one writer.** `TasksNotifier` is the only thing that assigns
`state`. A screen calls `ref.read(tasksProvider.notifier).add(...)` and gets a
value back; it never edits the list it was handed. Riverpod compares by
identity, so a mutated list is a change nothing rebuilds for — the reason
`toggle` builds a new list instead of setting `task.done`.

**`ref.watch` in `build`, `ref.read` in a callback.** Watching inside
`onPressed` subscribes a new listener on every tap; reading inside `build`
means the screen never hears about the change it just made.

**One state library, and it is Riverpod.** Adding `provider`, `bloc` or `get`
beside it gives the project two answers to "where does this state live", and
the next screen picks whichever its author knew. If Riverpod is wrong for
this app, replace it in one change and delete the other one.

**Never write a location as a string.** `lib/src/routing/routes.dart` holds
one class per screen; a link is `const TaskDetailRoute(id).location`, never
`'/tasks/$id'` spelled at the call site. `context.go('/taksk/1')` compiles and
fails at run time; a typed route cannot be misspelled, and renaming a path is
one edit.

**Every route parameter is untrusted input.** A deep link, a browser address
bar and another app can all send you `/tasks/abc`. `parseTaskDetailRoute`
returns `null` for anything that is not a positive integer, and the route
builder shows `MissingScreen` instead. Never write
`int.parse(state.pathParameters['id']!)`: it throws during a build, which is
a red screen in debug and a blank one in release. A parameter is parsed once,
in `routes.dart`, and the screen below receives a typed value.

**A well-formed id is still not a promise.** `TaskDetailScreen` looks the id
up with `findTask`, which answers `null`, and the screen says so. A link can
outlive the thing it names.

**The router is built per call, not shared.** `buildRouter()` returns a new
`GoRouter`, because one owns navigation history: a shared instance makes the
second test start wherever the first one finished.

**User-facing strings live in `lib/l10n/app_en.arb`.** A literal inside a
`Text(...)` is a string no translator will ever see, and the tests find
widgets by the text the user reads, so a literal also breaks the connection
between the ARB file and the assertions. Add the key with a `description`,
run `flutter gen-l10n`, and commit the regenerated Dart — CI regenerates it
and fails if the committed copy differs.

**Constructors are declared `const new(...)`, not `const ClassName(...)`.**
Dart 3.13 added the shorthand and `very_good_analysis` 11 enforces it through
`unnecessary_type_name_in_constructor`. Writing the old form is not an error
you have to fix by hand: `dart fix --apply` rewrites it. Call sites are
unchanged — `const TaskListScreen()` is still how you build one.

**A row is a widget class, not a `_buildRow` method.** `_TaskRow` has an
element of its own, so it rebuilds when its own task changes. A helper method
returning a `Widget` has no element, cannot be `const`, and rebuilds whenever
its parent does.

**Buttons are 48 logical pixels tall because a test says so.**
`buildTheme()` raises the Material 3 minimum from 40, and
`androidTapTargetGuideline` in `test/ui/task_list_screen_test.dart` fails the
build if any tappable node is smaller. The same test runs
`labeledTapTargetGuideline`, so a control with no label — an `IconButton`
without a `tooltip` is the usual one — fails too. If you add a control, add
it to a screen the guideline test pumps.

**Tests find widgets by what the user reads, not by `Key`.** A test that
finds a button by `Key` passes when the button has no accessible label; one
that finds it by label or tooltip fails. That is what connects the semantics
rules above to CI.

**Nothing is stored, and that is a decision, not an omission.** The list lives
in memory and is gone when the app closes. The moment you add storage:
`shared_preferences` is not a safe place for a token or anything personal —
use `flutter_secure_storage` — and Android backup then needs deciding, because
`android:allowBackup` is on by default in the generated manifest and would
copy whatever you wrote to Google's servers.

**Nothing in the app bundle is secret.** `--dart-define`, `assets/` and a
string in source all end up in the binary; `--obfuscate` renames symbols and
encrypts nothing. A key that must stay secret belongs on a server the app
calls. The app as it stands makes no network call and requests no Android
permission — keep it that way until a feature needs one, and then add only
that one.

**Add a package with `flutter pub add <name>:<exact version>`.** Every
version in `pubspec.yaml` is exact, with no caret, and `pubspec.lock` is
committed. A caret on a router or a state library turns an unrelated update
into a red build nobody changed anything for. Dependabot proposes the moves.

## Commands

| What                      | Command                                             |
| ------------------------- | --------------------------------------------------- |
| Install dependencies      | `flutter pub get`                                   |
| Regenerate localisations  | `flutter gen-l10n`                                  |
| Format (gate)             | `dart format --output=none --set-exit-if-changed .` |
| Analyze (gate)            | `flutter analyze`                                   |
| Test                      | `flutter test`                                      |
| Test with coverage        | `flutter test --coverage`                           |
| Build proof               | `flutter build web --release`                       |
| Run on a connected device | `flutter run`                                       |

`flutter analyze` treats infos as fatal. Do not pass `--no-fatal-infos`:
almost every lint reports at info level, so that one flag turns the whole
pinned set into decoration.

## When you are asked to add a screen

1. Put the decision it makes in `lib/src/rules` as a function, and unit-test
   it there.
2. Add the route class to `lib/src/routing/routes.dart`, with a parser if it
   takes a parameter, and a test for a malformed value.
3. Register it in `buildRouter`, sending an unparseable parameter to
   `MissingScreen`.
4. Add the strings to `lib/l10n/app_en.arb` with descriptions, and run
   `flutter gen-l10n`.
5. Write the screen in `lib/src/ui`, reading state with `ref.watch` and
   changing it with `ref.read(...).method()`.
6. Add a widget test that drives it through `pumpApp`, and extend the
   guideline test to cover it.
7. Run the four gates above before you call it done.

## What this project does not do, and what it would cost

- **No persistence, no network, no authentication.** Adding any of them
  changes the security picture; re-read the two storage rules above first.
- **No integration tests and no device tests.** `flutter test` runs on the
  Dart VM. Gestures, keyboards, safe areas, fonts, performance and every
  platform channel are untested. `integration_test` plus
  `flutter test integration_test` on an emulator is the next step, and a flow
  that meets a native permission dialog needs a tool that can tap one.
- **No golden tests.** See `overview.md`: goldens are only useful when one
  pinned platform generates them, and this recipe has nowhere to generate
  them that is not the same machine that would compare them.
- **No App Links or Universal Links.** The routes exist; nothing claims a
  domain. Verified links need `autoVerify` intent filters, an
  `assetlinks.json` on the domain, and the iOS equivalent.
- **No release signing, and the template's default is worse than none.**
  `android/app/build.gradle.kts` gives the `release` build type
  `signingConfigs.getByName("debug")`, which is what makes
  `flutter run --release` work on a connected device. It also means
  `flutter build apk --release` emits an APK signed with a key everybody has.
  Before any build leaves your machine, point that at a keystore of your own,
  read from a `key.properties` the generated `android/.gitignore` already
  refuses to commit. `flutter build ipa` needs an Apple signing identity, and
  neither key ever enters the repository.
