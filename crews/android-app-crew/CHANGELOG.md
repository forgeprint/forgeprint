# Changelog

## 1.0.0 — 2026-10-08

The second crew `mobile-app-crew`'s `not_for` names: "A Flutter or native
Android app."

- Four members: `kotlin-senior-architect`, `android-mobile-engineer`,
  `accessibility-specialist`, `qa-automation-lead`. One mobile expert per stack
  is D21 of the [expansion plan](../../docs/research/2026-09-24-expansion-plan.md);
  this crew picks Android, and the architect comes with the stack because a
  Gradle module graph and a checked public API are decided before the code.
- No release manager, as in `flutter-app-crew`: `not_for` points at
  `release-crew`, and the member set differs from the React Native crew in two
  places rather than one, which is what rule 9 asks of a second crew.
- One integration: `mobile-mcp`, for the device the audit and the
  instrumentation journeys need.
- The README names the three places the members disagree, each from their own
  checklists, including the one that changes what CI runs: a suite that passes
  on the debug build is not evidence about the R8 build that ships.
- `tier: community`, `provenance: generated` (ADR 0011).
