# SwiftUI Feature Package — overview

## What it sets up

A SwiftPM package with two library targets and a test target:

- **`FeatureCore`** — the rules. `nonisolated` by default, no SwiftUI, no
  framework. A typed error per refusal.
- **`Feature`** — the SwiftUI views and the `@Observable` models, main-actor
  isolated by default (SE-0466), so nothing carries an annotation.
- **`FeatureTests`** — Swift Testing, with the refusals covered rather than
  only the happy path.

Plus a `swift-format` gate that exits non-zero on a finding, a `.gitignore`, a
CI workflow on a macOS runner, and a README that says how to put the package
into an app.

Nine of the twelve steps end in a command that compiles, tests or lints
something. Every step was run before this was committed.

## What it fits

- **An Apple app whose features you want testable without launching it.**
  Logic in `FeatureCore` is testable in milliseconds and has no main actor.
- **A codebase turning on Swift 6 language mode**, where the per-target
  isolation defaults are what keep the migration small.
- **A team that wants the formatting argument settled by a gate** rather than
  in review.
- **A package shared between an iOS app and a macOS one**, which is why both
  platforms are declared and why CI compiles for the simulator SDK as well as
  for the host.

## What it does not fit

- **Somebody who wants an app.** This produces no `.xcodeproj`, no App target,
  no Info.plist and no launch screen. An Xcode project cannot be written by a
  deterministic recipe without a third-party generator, and this catalog does
  not ship one. Adding the package to an app is one dialog in Xcode and the
  README says which.
- **A UIKit codebase.** The isolation defaults and the format gate transfer;
  `@Observable` and the SwiftUI views do not.
- **A Swift server.** Vapor or Hummingbird work shares the language and
  nothing else here.
- **Cross-platform mobile.** A Flutter or React Native app with a thin Swift
  layer wants `flutter-mobile-app` or `expo-mobile-app`.
- **A package with dependencies.** It ships none on purpose, so there is no
  dependency policy, no `Package.resolved` discipline and no SBOM step. Those
  are decisions to make when the first dependency arrives.
- **An accessibility conformance claim.** The labels are written for a screen
  reader, and `performAccessibilityAudit()` needs an app to launch — so the
  audit lives in the app's UI test target, not here.

## What is good about it

- **Two isolation defaults, chosen per target and written in the manifest.**
  This is the decision Swift 6.2 made possible and the one most often pointed
  the wrong way: `MainActor` on domain code forces `@concurrent` onto
  everything in it.
- **The iOS compile is a step.** `swift build` on a Mac builds for macOS, and a
  package that passes there can still fail for iOS. The recipe compiles against
  the iPhone Simulator SDK with a target triple derived from `uname -m`, so it
  works on an Apple-silicon or an Intel machine.
- **The format gate is `--strict`**, which exits non-zero. A lint that only
  prints is a lint nobody runs twice.
- **The refusals have tests.** A blank title and an over-long one are tested at
  both layers: the rule that throws, and the sentence a person reads.
- **No dependencies at all**, so nothing in it rots on somebody else's
  schedule.

## What is not

- **`provenance: generated`.** Written from the catalog's own research and
  from the Swift sources the two Swift experts cite, not from a codebase
  somebody ships. ADR 0011 says what that is worth. What it does have is a
  recipe that ran: **12 of 12 steps, 22.1 s**, on Xcode 27.0 with Swift 6.4.
- **`requires_tools` carries no Swift version, and it should.** `swift
--version` leads with the swift-driver version — `1.168.6` on the machine
  this was built on — and the tool check reads the first number it finds, so
  `swift>=6.2` is evaluated as `1.168.6 >= 6.2` and refuses a toolchain that
  satisfies it. Until that is fixed the floor is enforced where it actually
  belongs: `swift-tools-version: 6.2` in `Package.swift`, which refuses an
  older toolchain with a readable message.
- **The CI runner is one version behind the machine this was built on.**
  GitHub's `macos-latest` carried Xcode 26.6 and Swift 6.3 when this was
  written; the recipe needs 6.2 and was run on 6.4, so both sides of the floor
  are covered — but a step that needed a 6.4 feature would pass here and fail
  there.
- **The two experts it is written against are named**, and the overlap is
  deliberate: `swift-mobile-engineer` owns the isolation defaults, the
  observation rules and the format gate that this recipe sets up, and
  `swift-senior-architect` owns the question this package deliberately does not
  answer — what happens when a second module arrives.
