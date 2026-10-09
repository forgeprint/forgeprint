# Swift Senior Mobile Engineer — overview

## What it is

A way of building and reviewing SwiftUI apps where six things are settings,
greps or tests rather than habits: each target's default actor isolation, where
observed state is read, the accessibility audit in CI, the Keychain
accessibility class, a test behind every custom migration stage, and a gate
that runs the release configuration.

Target: Swift 6.4 as it ships in Xcode 27.

## What it fits

- A SwiftUI app of more than one screen, on iOS, iPadOS or macOS.
- A codebase turning on Swift 6 language mode and drowning in annotations —
  §1 is about the setting that makes that burden smaller.
- An app migrating from `ObservableObject` to `@Observable`, where the two can
  be held wrongly and still compile.
- A review where somebody has to say which row a finding fails, and show the
  command that found it.
- Any team shipping a schema change to installs that already hold data.

## What it does not fit

- **A UIKit codebase.** §2 is about `@Observable` and SwiftUI's read
  dependencies; a UIKit app gets §1, §4, §5 and §6 and little else.
- **Deciding the package or module layout.** That is
  [`swift-senior-architect`](../swift-senior-architect/SKILL.md), and the two
  overlap on purpose at one point only: this expert reads the isolation setting
  of a target it did not get to choose.
- **A Swift server.** Vapor or Hummingbird work shares the language and almost
  nothing else here: no SwiftUI, no Keychain, no accessibility audit.
- **Cross-platform mobile.** A Flutter or React Native app with a thin Swift
  layer wants [`flutter-mobile-engineer`](../flutter-mobile-engineer/SKILL.md)
  or [`react-native-mobile-engineer`](../react-native-mobile-engineer/SKILL.md);
  this expert has nothing to say about Dart or JavaScript.
- **A WCAG conformance claim.** §3 runs the automated audit and names its
  limits. The claim needs
  [`accessibility-specialist`](../accessibility-specialist/SKILL.md).
- **Store release mechanics** — version, changelog, phased rollout, withdrawal.
  That is [`release-manager`](../release-manager/SKILL.md).

## What is good about it

- **Every row is a command or a setting to read.** The isolation defaults, the
  greps for `@StateObject` and `kSecAttrAccessible`, the audit call in the UI
  test, the migration test, the lint invocation.
- **The two escape hatches are allowed and bounded.**
  `@preconcurrency import` and `nonisolated(unsafe)` are legitimate; this
  expert asks for a dated note and a named guarantee rather than refusing them.
- **It states the limit of the automated accessibility audit** instead of
  implying a green suite is a conformance claim.
- **It says which way the isolation default should point per target**, which is
  the one place the Swift 6.2 setting is most often pointed the wrong way.

## What is not

- **`provenance: generated`.** This was written from the sources in
  [`references.md`](references.md) rather than from a codebase somebody ships,
  and it has not been run against a real Swift project — there is no Swift
  blueprint in the catalog to run it against. Read it with the scepticism
  ADR 0011 asks for, and the pull request that adds the first iOS blueprint is
  where it should be tried.
- **Keychain availability is cited indirectly.** Apple's reference pages render
  client-side and could not be read when this was written, so the storage rows
  rest on OWASP MASVS and MASWE for the requirement and name the mechanism
  without asserting a version. `references.md` says so.
- **No performance method of its own.** §2 and §5 say what to measure;
  [`performance-engineer`](../performance-engineer/SKILL.md) owns how.
