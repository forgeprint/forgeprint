# Changelog — swiftui-feature-package

## 1.1.0 — 2026-10-12

Update: the crew it should be worked on with now exists.

- `recommended_crew: ios-app-crew`. 1.0.0 named the two Swift experts and no
  crew, because the catalog had none for this stack: the generic
  `mobile-app-crew` carries a React Native engineer, and its own `not_for`
  already said so. The per-stack crew merged in
  [#258](https://github.com/forgeprint/forgeprint/pull/258), which is why this
  field can be filled at all
  ([ADR 0016](../../docs/decisions/0016-cross-unit-changes-land-in-order.md) in
  the waiting direction).
- The crew is not the two experts with a title. It adds an accessibility
  specialist and a QA automation lead, and `overview.md` now says which
  disagreement that resolves: an automated accessibility audit needs a running
  app, this package has no app target, and the crew's README puts the app shell
  with the UI test target on the QA lead. A package that skipped this can be
  green having never been audited anywhere.
- No recipe change, so no re-run: the twelve steps verified at 1.0.1 are
  untouched.

## 1.0.1 — 2026-10-09

Fix: `requires_tools` says the Swift floor out loud.

- `requires_tools: [swift>=6.2, xcrun]`. 1.0.0 could not say this: the tool
  check read the first number in `swift --version`, which is the swift-driver
  version, so `swift>=6.2` was evaluated as `1.168.6 >= 6.2` and refused a
  toolchain that satisfies it. `forgeprint` 0.5.0 reads the Swift version
  instead, and `overview.md`'s paragraph about the workaround goes with it.
- The floor is now stated in both the places it belongs — before the recipe
  starts and at the first build — and `overview.md` says why that repetition is
  deliberate rather than an oversight.
- Verified with the constraint in place: 12 of 12 steps, and the refusal path
  checked by asking for a version this machine does not have.

## 1.0.0 — 2026-10-08

The catalog's first Apple-platform blueprint. D21 of the
[expansion plan](../../docs/research/2026-09-24-expansion-plan.md) deferred
SwiftUI pending "a macOS-capable check"; the check is this recipe running.

- Twelve steps, nine of which end in a compile, a test or a lint. **Run end to
  end before it was committed: 12 of 12 in 22.1 s**, on Xcode 27.0 (27A266a)
  with Swift 6.4 and the iPhone Simulator SDK 27.0.
- Two library targets with **different default actor isolation** (SE-0466,
  Swift 6.2): `Feature` is main-actor isolated because it is UI, `FeatureCore`
  is not because it is rules. Both in language mode 6, set per target.
- Swift Testing rather than XCTest, which is what `swift package init` now
  generates anyway.
- A `swift-format` gate with `--strict`, so a finding is a non-zero exit. The
  toolchain's `swift-format --version` reports `main`, so the recipe pins
  nothing and uses what the toolchain ships.
- The iOS compile is a step, with the triple derived from `uname -m` so it
  holds on Apple silicon and on Intel.
- No dependencies, no persistence, and no app target — `overview.md` says what
  each of those means for a reader before they start.
- `recommended_experts` names `swift-mobile-engineer` and
  `swift-senior-architect`. Both were in open pull requests while this was
  drafted and `validate` refuses a slug that is not on `main`
  ([ADR 0016](../../docs/decisions/0016-cross-unit-changes-land-in-order.md));
  they merged first, so the field is complete at 1.0.0 rather than waiting for
  a follow-up.
- `requires_tools` is `[swift, xcrun]` with no version, and `overview.md`
  explains why: the tool check reads the first number in `swift --version`,
  which is the swift-driver version, so a Swift constraint cannot be expressed
  today. The floor lives in `swift-tools-version` instead.
- `tier: community`, `provenance: generated` (ADR 0011).
