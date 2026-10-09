# Changelog

## 1.0.0 — 2026-10-08

The eleventh language architect, and the pair to
[`swift-mobile-engineer`](../swift-mobile-engineer/SKILL.md). Every other
language architect in the catalog had one; Swift did not.

- Six checklists: `module-boundaries`, `api-surface`, `isolation-ownership`,
  `dependency-policy`, `platform-scope`, `warning-policy`.
- Target: Swift 6.4 as it ships in Xcode 27 (both read 2026-10-08).
- The boundary rows turn on `package` (SE-0386, Swift 5.9) rather than
  `public`, including the trap: outside SwiftPM the modifier is an error unless
  `-package-name` is passed.
- `api-surface` uses `swift package diagnose-api-breaking-changes` **with its
  open issues named** — no access-level filter, a missed protocol default
  `associatedtype`, a defaulted parameter reported as a break — so the row says
  to read the output rather than trust the exit code.
- Library evolution is off by default and the checklist says so, citing the
  proposal's own line that libraries shipped inside an app are not meant to
  use it, plus what it costs a client: non-frozen enums and `@unknown default`.
- `isolation-ownership` says SE-0478's per-file defaults are **accepted, not
  shipped**, with the experimental flag and the revised syntax named, so the
  expert says "not yet" with a reason rather than silently omitting it.
- Two rows exist because Swift 6.4 shipped them: an SBOM from SwiftPM
  (SE-0509) for the dependency audit, and `@diagnose` (SE-0522) for a
  suppression narrow enough to review.
- `pairs_with` names `swift-mobile-engineer`, `api-designer` and
  `security-reviewer`. The first was in an open pull request when this was
  drafted and `validate` refuses a slug that is not on `main`
  ([ADR 0016](../../docs/decisions/0016-cross-unit-changes-land-in-order.md));
  it merged first, so the field is complete at 1.0.0 rather than waiting for a
  follow-up.
- `tier: community`, `provenance: generated` (ADR 0011), and `overview.md`
  says it has not been run against a real Swift project because the catalog
  has no Swift blueprint yet.
