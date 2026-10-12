# Changelog

## 1.0.0 — 2026-10-12

The third and last of the per-stack mobile crews, and the one that could not be
built until two experts existed.

- Four members: `swift-senior-architect`, `swift-mobile-engineer`,
  `accessibility-specialist`, `qa-automation-lead`. One mobile expert per stack
  is D21 of the [expansion plan](../../docs/research/2026-09-24-expansion-plan.md);
  `mobile-app-crew` picked React Native, `flutter-app-crew` and
  `android-app-crew` took the next two, and this one takes Apple's.
- The same shape as its two siblings: the architect in, the release manager
  out, `not_for` pointing at `release-crew` for the shipping half. So the member
  set differs from every other crew in two places rather than one, which is what
  rule 9 asks.
- One integration: `mobile-mcp`, for the simulator or device the audit and the
  journeys need.
- The README names three disagreements, each from the members' own checklists,
  and one of them is specific to this stack: the automated accessibility audit
  needs an app to launch, and the architecture this crew recommends puts the
  screens in a package. The README says who owns the app shell rather than
  leaving it between them.
- `tier: community`, `provenance: generated` (ADR 0011).
