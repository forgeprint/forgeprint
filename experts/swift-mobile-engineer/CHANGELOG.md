# Changelog

## 1.0.0 — 2026-10-08

The fourth mobile expert, one per stack (D21 of the
[expansion plan](../../docs/research/2026-09-24-expansion-plan.md)). React
Native, Flutter and Android had one; Swift did not, and D21 had deferred it
pending a macOS-capable check — which is about verifying a blueprint's recipe,
not about writing an expert.

- Six checklists: `actor-isolation`, `observation-and-state`,
  `accessibility-audit`, `secure-storage`, `data-migrations`, `build-gates`.
- Target: Swift 6.4 as it ships in Xcode 27 (both read 2026-10-08).
- The isolation rows are the ones that change code: SE-0466 lets a target
  choose its default, and the checklist says UI targets point at `MainActor`
  while parsing, networking and storage targets do not — the direction the
  setting is most often pointed wrongly.
- `@preconcurrency import` and `nonisolated(unsafe)` are allowed with a dated
  note and a named guarantee rather than refused.
- The accessibility rows use `performAccessibilityAudit()` in a UI test CI
  runs, and state what the audit cannot see.
- WCAG is pointed at rather than restated: the catalog tracks it in
  `docs/review-standards.md`.
- Keychain constants are cited indirectly through MASVS and MASWE, because
  Apple's reference pages could not be read on the date checked.
  `references.md` says so rather than implying a check that did not happen.
- `tier: community`, `provenance: generated` (ADR 0011), and
  `overview.md` says it has not been run against a real Swift project because
  the catalog has no Swift blueprint yet.
