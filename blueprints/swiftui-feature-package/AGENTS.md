# SwiftUI Feature Package — agent context

A SwiftPM package of SwiftUI feature modules for an Apple app. Read this
before adding a view, a model or a target.

> This blueprint was generated rather than written from a shipped codebase, and
> its recipe was run end to end on macOS before it was committed. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
Package.swift                              two targets, two isolation defaults
Sources/FeatureCore/Reminder.swift         the rules: no SwiftUI, nonisolated
Sources/Feature/ReminderList.swift         the view and the @Observable model
Tests/FeatureTests/ReminderRulesTests.swift      the rules, no main actor
Tests/FeatureTests/ReminderListModelTests.swift  the model, @MainActor once
.swift-format                              the formatting gate
```

**There is no app here.** This package is added to an App target in Xcode; the
recipe stops at the boundary a script can verify. What that means for you:
anything about the app's lifecycle, its Info.plist, its entitlements or its UI
tests belongs to the app, not to this package.

## The one decision this blueprint makes for you

`Package.swift` declares a **different default actor isolation per target**
(SE-0466, Swift 6.2):

| Target        | Default       | Why                                                                                                                 |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Feature`     | `MainActor`   | It is UI. Views and their models are main-actor work, so neither carries an annotation                              |
| `FeatureCore` | `nonisolated` | It is rules. Pointing `MainActor` at domain code forces `@concurrent` or `nonisolated` onto nearly everything in it |

Both targets are in language mode 6. **Adding a third target means choosing
its default**, and the choice follows what the target is rather than what makes
the compiler quiet first.

## Rules

- **A new type that is not UI goes in `FeatureCore`.** If it needs `import
SwiftUI`, it is UI and it belongs in `Feature`.
- **A model the view observes is `@Observable`.** Not `ObservableObject` with
  `@Published`, and never `@StateObject` beside an `@Observable` type — that
  compiles and observes nothing.
- **A view reads the properties it needs**, not a model handed down to be read
  at the leaves. The second makes every ancestor a dependency of every change.
- **A refusal is a value somebody reads.** `FeatureCore` throws a typed error;
  `Feature` turns it into a sentence. Do not put the sentence in the rules.
- **`body` draws.** No I/O, no sorting a whole collection, no formatter built
  per row.
- **Every control carries a label written for a person**, and a state gets a
  value or a trait rather than a colour.
- **A test asserts behaviour**, and the refusals have tests, not only the
  happy path.
- **Formatting is `xcrun swift-format lint --strict`**, which exits non-zero on
  a finding. It is a gate, not a review comment.

## The four commands

```bash
swift build
swift test
xcrun swift-format lint --strict --recursive Sources Tests
swift build --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" \
  -Xswiftc -target -Xswiftc "$(uname -m)-apple-ios18.0-simulator"
```

The last one is the one people forget: `swift build` on a Mac builds for macOS,
and a package that compiles there can still fail for iOS. CI runs all four on a
macOS runner, because the fourth cannot run anywhere else.

## What this package deliberately does not have

- **No dependency.** Nothing in `Package.swift` but the two targets. The first
  dependency is a decision with a reason, not a convenience.
- **No persistence.** `ReminderListModel` holds an array. Storage is a choice
  the app makes, and swapping the array for SwiftData is a change to one type.
- **No accessibility audit.** `XCUIApplication.performAccessibilityAudit()`
  needs an app to launch; it belongs to the app's UI test target. The labels
  here are what make that audit pass when it exists.
- **No `@MainActor` annotations.** If you find yourself adding one inside
  `Feature`, the target default already did it. If you need one inside
  `FeatureCore`, ask whether that type is in the right target.
