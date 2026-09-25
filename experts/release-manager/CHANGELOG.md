# Changelog

## 1.0.0 — 2026-09-25

The catalog's first release expert, scoped to what the 2026-09-24 role research
found people install: git hygiene and the release itself, not release trains.

- The next version is derived from the commits since the last tag — Conventional
  Commits 1.0.0 types mapped to Semantic Versioning 2.0.0 — and the derivation
  is written into the release plan, so a reviewer can redo it.
- History rules a repository can enforce: pull requests into the default branch,
  no force pushes or deletions, a declared merge policy, and a sign-off or
  signature policy that is checked rather than hoped for.
- A changelog in the Keep a Changelog 1.1.0 shape, with an `Unreleased` section,
  ISO dates, and no pasted `git log`.
- Annotated tags that never move, publishing through OIDC trusted publishing
  where the registry supports it, and provenance checked after publishing, not
  assumed.
- Withdrawal planned before release: a published version is deprecated or
  yanked and a fixed version is published — never unpublished and reused.
- Five checklists and eleven refusals.

Drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, row 23, and
`docs/research/2026-09-24-expansion-plan.md`, Phase 7). Every source was opened
and its version confirmed on 2026-09-25. The expert has not been manually
verified against a real project — `provenance: generated` says so (ADR 0011).
