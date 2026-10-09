# Build gates

What the build refuses is the part of a convention that survives a deadline.

| #   | Check                                                                                                           | How                                                  | Source               |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------- |
| BG1 | The project builds with the Swift that ships in the Xcode CI uses, and the version is pinned somewhere readable | read the CI job and `xcodebuild -version` in its log | Xcode 27             |
| BG2 | Formatting is enforced by a tool, not by review: `swift-format lint --strict` runs in CI                        | read the CI job; `swift-format --version`            | swift-format 604.0.0 |
| BG3 | If SwiftLint is used too, its rules do not contradict `swift-format`, and only one of them owns formatting      | read both configuration files                        | SwiftLint 0.65.1     |
| BG4 | Tests run with `swift test` or a test plan that CI actually executes, and a skipped test is visible             | the CI log, not the local run                        | swift-testing 6.4    |
| BG5 | A suite that mixes Swift Testing and XCTest is not a finding; a suite that silently runs half of it is          | read the test plan for which targets are included    | ST-0021              |
| BG6 | Warnings are errors for the app's own targets, and a dependency's warnings are not suppressed globally          | read `SWIFT_TREAT_WARNINGS_AS_ERRORS` per target     | Xcode 27             |
| BG7 | The release configuration is what the gate runs against before a build goes to TestFlight                       | read the CI job's configuration                      | Xcode 27             |

## Why each one

**BG5 exists because Swift 6.4 removed the reason to care.** `XCTAssert` works
inside Swift Testing tests and `#expect` works inside XCTests, so a mixed suite
is a migration in progress rather than a mess. What is worth finding is a test
plan that includes one target and not the other, which looks green and runs
half the tests.

**BG2 and BG3 are about ownership, not taste.** Two tools formatting the same
file is a loop of reformat commits. One owns formatting; the other, if present,
owns lint rules that are not about layout.

**BG7 is the one people skip.** Debug and release differ in optimisation, in
what is stripped and in what the compiler proves. A gate that only ever ran
debug is evidence about a build nobody ships.
