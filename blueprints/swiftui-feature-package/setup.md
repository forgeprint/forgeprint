# Setup

Creates a SwiftPM package of SwiftUI feature modules for an Apple app: the UI
isolated to the main actor, the domain code deliberately not, tests in Swift
Testing, a formatting gate that fails rather than warns, and a compile against
the iOS Simulator SDK.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

**This produces the package, not the app.** An Xcode project with an App target
cannot be written by a deterministic script, so the recipe stops where it can
still be checked; `overview.md` says what adding it to an app involves.

Requires `swift` and `xcrun` — in practice Xcode, or a Swift toolchain with the
Command Line Tools. The floor is Swift 6.2, enforced by the tools version in
step 2 rather than by `requires_tools`, for the reason `overview.md` gives.

1. Create the package: `swift package init --type library --name Feature`
   Verify: `test -f Package.swift`

2. Two targets rather than one, because the isolation defaults differ: the UI
   target is main-actor isolated and the domain target is not (SE-0466). The
   tools version is what refuses an older toolchain, and language mode 6 is
   set per target rather than inherited. Replace `Package.swift` with:

   ```swift
   // swift-tools-version: 6.2
   import PackageDescription

   let package = Package(
       name: "Feature",
       platforms: [.iOS(.v18), .macOS(.v15)],
       products: [
           .library(name: "Feature", targets: ["Feature"]),
           .library(name: "FeatureCore", targets: ["FeatureCore"]),
       ],
       targets: [
           .target(
               name: "FeatureCore",
               swiftSettings: [
                   .swiftLanguageMode(.v6),
                   .defaultIsolation(nil),
               ]
           ),
           .target(
               name: "Feature",
               dependencies: ["FeatureCore"],
               swiftSettings: [
                   .swiftLanguageMode(.v6),
                   .defaultIsolation(MainActor.self),
               ]
           ),
           .testTarget(
               name: "FeatureTests",
               dependencies: ["Feature", "FeatureCore"],
               swiftSettings: [.swiftLanguageMode(.v6)]
           ),
       ]
   )
   ```

   Verify: `grep -q 'swift-tools-version: 6.2' Package.swift`

3. The rules, in a target that knows nothing about SwiftUI. Create
   `Sources/FeatureCore/Reminder.swift` with:

   ```swift
   import Foundation

   /// A reminder, and the rules about one. No UI, no framework: this target is
   /// `nonisolated` by default, so nothing here is tied to the main actor.
   public struct Reminder: Equatable, Identifiable, Sendable {
       public let id: UUID
       public var title: String
       public var isDone: Bool

       public init(id: UUID = UUID(), title: String, isDone: Bool = false) {
           self.id = id
           self.title = title
           self.isDone = isDone
       }
   }

   public enum ReminderError: Error, Equatable {
       case titleIsBlank
       case titleIsTooLong(limit: Int)
   }

   public struct ReminderRules: Sendable {
       public static let titleLimit = 200

       public init() {}

       /// Trim, then refuse. A blank title is a refusal rather than a silent
       /// default, because a reminder nobody can read is not a reminder.
       public func reminder(titled raw: String) throws -> Reminder {
           let title = raw.trimmingCharacters(in: .whitespacesAndNewlines)
           if title.isEmpty { throw ReminderError.titleIsBlank }
           if title.count > Self.titleLimit {
               throw ReminderError.titleIsTooLong(limit: Self.titleLimit)
           }
           return Reminder(title: title)
       }
   }
   ```

   Verify: `test -f Sources/FeatureCore/Reminder.swift`

4. The view and the model it observes, in the main-actor target. Neither
   carries an annotation, because the target declares the default. Create
   `Sources/Feature/ReminderList.swift` with:

   ```swift
   import FeatureCore
   import SwiftUI

   /// The model the view observes. This target defaults to `MainActor`
   /// (SE-0466), so neither this type nor the view below carries an annotation.
   @Observable
   public final class ReminderListModel {
       public private(set) var reminders: [Reminder] = []
       public private(set) var refusal: String?

       private let rules = ReminderRules()

       public init() {}

       /// The rules live in `FeatureCore`, which knows nothing about SwiftUI.
       /// This method is where a refusal becomes something a person reads.
       public func add(titled raw: String) {
           do {
               reminders.append(try rules.reminder(titled: raw))
               refusal = nil
           } catch ReminderError.titleIsBlank {
               refusal = "A reminder needs a title."
           } catch ReminderError.titleIsTooLong(let limit) {
               refusal = "A title is at most \(limit) characters."
           } catch {
               refusal = "That reminder could not be added."
           }
       }

       public func toggle(_ reminder: Reminder) {
           guard let at = reminders.firstIndex(of: reminder) else { return }
           reminders[at].isDone.toggle()
       }
   }

   /// A list and a field. Every control carries a label written for a person
   /// rather than for a test, and the refusal is announced rather than only
   /// coloured.
   public struct ReminderList: View {
       @State private var model = ReminderListModel()
       @State private var typed = ""

       public init() {}

       public var body: some View {
           List {
               Section {
                   ForEach(model.reminders) { reminder in
                       Button {
                           model.toggle(reminder)
                       } label: {
                           Label(
                               reminder.title,
                               systemImage: reminder.isDone ? "checkmark.circle.fill" : "circle"
                           )
                       }
                       .accessibilityLabel(reminder.title)
                       .accessibilityValue(reminder.isDone ? "Done" : "Not done")
                       .accessibilityHint("Marks this reminder done or not done")
                   }
               }

               Section {
                   TextField("What needs doing", text: $typed)
                       .accessibilityLabel("New reminder")
                       .onSubmit { submit() }
                   Button("Add reminder") { submit() }
                       .disabled(typed.trimmingCharacters(in: .whitespaces).isEmpty)
                   if let refusal = model.refusal {
                       Text(refusal)
                           .foregroundStyle(.red)
                           .accessibilityAddTraits(.isStaticText)
                   }
               }
           }
       }

       private func submit() {
           model.add(titled: typed)
           if model.refusal == nil { typed = "" }
       }
   }
   ```

   Verify: `test -f Sources/Feature/ReminderList.swift`

5. Remove the two placeholders the template left behind, which is also the
   first build the package can pass: `rm Sources/Feature/Feature.swift Tests/FeatureTests/FeatureTests.swift`
   Verify: `swift build`

6. Create `Tests/FeatureTests/ReminderRulesTests.swift` with:

   ```swift
   import FeatureCore
   import Testing

   @Suite("Reminder rules")
   struct ReminderRulesTests {
       let rules = ReminderRules()

       @Test("a title is trimmed, not rejected for its spaces")
       func trims() throws {
           #expect(try rules.reminder(titled: "  milk  ").title == "milk")
       }

       @Test("a blank title is refused rather than defaulted")
       func refusesBlank() {
           #expect(throws: ReminderError.titleIsBlank) { try rules.reminder(titled: "   ") }
       }

       @Test("a title over the limit is refused, and the limit is in the error")
       func refusesLong() {
           let long = String(repeating: "a", count: ReminderRules.titleLimit + 1)
           #expect(throws: ReminderError.titleIsTooLong(limit: ReminderRules.titleLimit)) {
               try rules.reminder(titled: long)
           }
       }

       @Test("a new reminder is not done")
       func startsNotDone() throws {
           #expect(try rules.reminder(titled: "milk").isDone == false)
       }
   }
   ```

   Verify: `swift build --build-tests`

7. The suite below is main-actor isolated once rather than every test
   awaiting, because the target it tests declares that default. Create
   `Tests/FeatureTests/ReminderListModelTests.swift` with:

   ```swift
   import FeatureCore
   import Testing

   @testable import Feature

   /// The model is `MainActor`-isolated because its target declares that default
   /// (SE-0466), so the suite says so once rather than every test awaiting.
   @Suite("Reminder list model")
   @MainActor
   struct ReminderListModelTests {
       @Test("adding a reminder keeps it and clears the refusal")
       func adds() {
           let model = ReminderListModel()
           model.add(titled: "milk")
           #expect(model.reminders.count == 1)
           #expect(model.refusal == nil)
       }

       @Test("a blank title adds nothing and says why, in words a person reads")
       func refusesBlank() {
           let model = ReminderListModel()
           model.add(titled: "  ")
           #expect(model.reminders.isEmpty)
           #expect(model.refusal == "A reminder needs a title.")
       }

       @Test("the length limit is reported with the number in it")
       func refusesLong() {
           let model = ReminderListModel()
           model.add(titled: String(repeating: "a", count: ReminderRules.titleLimit + 1))
           #expect(model.refusal == "A title is at most 200 characters.")
       }

       @Test("toggling marks done, and twice marks it back")
       func toggles() throws {
           let model = ReminderListModel()
           model.add(titled: "milk")
           let reminder = try #require(model.reminders.first)
           model.toggle(reminder)
           #expect(model.reminders.first?.isDone == true)
           model.toggle(try #require(model.reminders.first))
           #expect(model.reminders.first?.isDone == false)
       }

       @Test("a reminder that is not in the list is ignored rather than crashing")
       func ignoresUnknown() {
           let model = ReminderListModel()
           model.toggle(Reminder(title: "never added"))
           #expect(model.reminders.isEmpty)
       }
   }
   ```

   Verify: `swift test`

8. Formatting is a gate rather than a review comment: `--strict` makes a
   finding a non-zero exit. Create `.swift-format` with:

   ```json
   {
     "version": 1,
     "lineLength": 100,
     "indentation": { "spaces": 4 },
     "lineBreakBeforeEachArgument": true,
     "rules": {
       "AlwaysUseLowerCamelCase": true,
       "NeverForceUnwrap": true,
       "NeverUseImplicitlyUnwrappedOptionals": true,
       "OrderedImports": true,
       "UseLetInEveryBoundCaseVariable": true
     }
   }
   ```

   Verify: `xcrun swift-format lint --strict --recursive Sources Tests`

9. Compile the package against the iOS Simulator SDK. This is the step that
   needs a Mac, and the reason this blueprint exists: `swift build --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" -Xswiftc -target -Xswiftc "$(uname -m)-apple-ios18.0-simulator"`
   Verify: `swift build --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" -Xswiftc -target -Xswiftc "$(uname -m)-apple-ios18.0-simulator"`

10. Create `.gitignore` with:

    ```gitignore
    .DS_Store
    /.build
    /Packages
    /*.xcodeproj
    xcuserdata/
    DerivedData/
    .swiftpm/configuration/registries.json
    .swiftpm/xcode/package.xcworkspace/contents.xcworkspacedata
    .netrc
    ```

    Verify: `test -f .gitignore`

11. The runner is macOS because the compile in step 9 cannot run anywhere
    else, and the workflow prints the toolchain it was given before it uses
    it. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
        branches: [main]
      pull_request:

    jobs:
      build:
        runs-on: macos-latest
        steps:
          - uses: actions/checkout@v5

          - name: Say which toolchain this runner gave us
            run: |
              swift --version
              xcrun --sdk iphonesimulator --show-sdk-version

          - run: swift build
          - run: swift test
          - run: xcrun swift-format lint --strict --recursive Sources Tests
          - name: Compile for the iOS Simulator SDK
            run: |
              swift build --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" \
                -Xswiftc -target -Xswiftc "$(uname -m)-apple-ios18.0-simulator"
    ```

    Verify: `test -f .github/workflows/ci.yml`

12. Create `README.md` with:

    ```markdown
    # Feature

    A SwiftPM package of SwiftUI feature modules.

    - `FeatureCore` — the rules. `nonisolated` by default, no framework, no UI.
    - `Feature` — the SwiftUI views and the `@Observable` models. Main-actor
      isolated by default, so neither carries an annotation.

    The four commands this package is checked by:

        swift build
        swift test
        xcrun swift-format lint --strict --recursive Sources Tests
        swift build --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" -Xswiftc -target -Xswiftc "$(uname -m)-apple-ios18.0-simulator"

    ## Putting it in an app

    This package is not an app. In Xcode: File → Add Package Dependencies →
    Add Local, pick this directory, add the `Feature` library to the App
    target, and call `ReminderList()` from the `WindowGroup`. The accessibility
    audit, `XCUIApplication.performAccessibilityAudit()`, belongs to that app's
    UI test target, because a package has no app to audit.
    ```

    Verify: `test -f README.md`
