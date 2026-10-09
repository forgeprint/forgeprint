---
name: swift-senior-architect
description: Decide and review the structure of a Swift codebase the way a senior architect does — modules as the boundaries with `internal` as the default wall, `package` instead of `public` for a sibling module, a public surface diffed against the last tag in CI, `-enable-library-evolution` off unless something ships as a binary, each target declaring its default actor isolation with the reason in an ADR, dependencies pinned with an SBOM from the toolchain, and a warning policy narrow enough to be `@diagnose` at a declaration. Use when adding a module or a package, when a symbol is about to become `public`, when turning on strict concurrency across targets, when adding a platform, or when reviewing a Swift codebase's structure.
license: CC-BY-4.0
---

# Working as a senior Swift architect

Swift gives a codebase its boundaries for free and then lets them erode one
keyword at a time: `public` typed where `internal` stopped working, a target
that everything imports, library evolution switched on by a template, an
`await` added until an error went away, a warning silenced for a whole module
because one declaration deserved it. None of that is caught by a compiler, and
all of it is cheap to catch while it is still a decision.

Target: **Swift 6.4** as it ships in **Xcode 27**. This expert decides the
structure; building inside it is
[`swift-mobile-engineer`](../swift-mobile-engineer/SKILL.md)'s job. Sources:
[`references.md`](references.md).

---

## 1. The module is the boundary and `internal` is the wall

- The module graph is written down: which targets exist, which depends on
  which. A target everything imports is a boundary in the wrong place.
- **`package`, not `public`, for a symbol a sibling module needs.** It has
  existed since Swift 5.9, SwiftPM passes the package name automatically, and
  a target that must not reach package symbols sets `packageAccess: false`.
  A codebase of `public` symbols with no outside client is a boundary nobody
  drew.
- Outside SwiftPM, `package` is an error unless `-package-name` is passed —
  the trap waiting for the first Xcode-built target.
- An ambiguous name across two modules is disambiguated with a module selector
  rather than renamed around it.

Checklist: [`module-boundaries`](checklists/module-boundaries.md).

## 2. A public API is a promise, and CI checks it

- Every `public` symbol has a client outside the package. Names follow the API
  design guidelines, and the doc comment says what a caller may rely on.
- `swift package diagnose-api-breaking-changes <last-tag>` runs in CI. **Read
  its output rather than its exit code:** it compares `package` declarations
  too, it has missed a breaking change to a protocol's default
  `associatedtype`, and it has called a newly defaulted parameter a break.
  A gate with known blind spots, used knowingly, still beats finding the break
  in somebody else's build.
- A deprecation names the release that removes it.

Checklist: [`api-surface`](checklists/api-surface.md).

## 3. Library evolution is off unless something ships as a binary

- `-enable-library-evolution` costs performance — layout and field offsets
  become runtime questions — and the proposal that introduced it says
  libraries shipped inside an app are not meant to use it.
- Where it is on, `@frozen` is a deliberate trade with a written reason.
- What it costs a client is one thing they see directly: enums become
  non-frozen, so every exhaustive switch needs `@unknown default`. That is a
  decision to take, not a discovery to leave for them.

Checklist: [`api-surface`](checklists/api-surface.md), AS5–AS7.

## 4. Isolation is declared per target, and the reason is an ADR

- Every target states its default isolation. A target that states nothing is
  `nonisolated` by omission.
- **`MainActor` for UI; `nonisolated` for domain, parsing, networking and
  storage.** Pointing it at a parser adds back, as `@concurrent` and
  `nonisolated`, the annotation burden the setting exists to remove.
- Each actor has a named owner and a reason to be an actor rather than a type
  with no shared state.
- Per-file defaults are accepted but not shipped: an experimental flag, a
  revised syntax, and semantics that supersede the module default without its
  inference carve-outs. Follow it; do not build on it yet.

Checklist: [`isolation-ownership`](checklists/isolation-ownership.md).

## 5. A dependency is somebody else's promise

- Pinned, never a branch. `Package.resolved` committed, and CI building from
  it.
- A new dependency is justified in writing, including what happens if it is
  abandoned.
- The audit produces an **SBOM from the toolchain** — SwiftPM generates SPDX
  or CycloneDX since Swift 6.4 — rather than a list somebody maintains.
- A dependency that has not released in a year gets a sentence, not a verdict:
  fork, replace, or accept and say so.

Checklist: [`dependency-policy`](checklists/dependency-policy.md).

## 6. What is shared across platforms is a list, not whatever compiles

- A shared module imports no UI framework. A shared module that imports
  SwiftUI is a UI module with aspirations.
- A claimed platform has a CI job. Android names its NDK, WebAssembly names
  its Swift SDK, an embedded target configures its restriction warnings
  deliberately.
- A platform the project does not support is absent from the manifest rather
  than present and untested.

Checklist: [`platform-scope`](checklists/platform-scope.md).

## 7. The warning policy is narrow or it is noise

- Warnings are errors for the project's own targets, and the CI log has none,
  so a new one is visible.
- A suppression is `@diagnose` at the declaration, not a flag for the module —
  which is what Swift 6.4 made possible — and it names what it is waiting for.

Checklist: [`warning-policy`](checklists/warning-policy.md).

## 8. What this expert produces

- An **ADR** per structural decision: the module graph, the isolation defaults
  per target, whether library evolution is on, which platforms are supported.
- An **architecture review** against the six checklists, each finding naming
  the row and the file.
- An **API design review** of what is about to become `public`, and of what the
  API diff reports.
- A **migration plan** when a boundary moves: which symbols change access,
  which clients break, and in which release.
- A **dependency audit** with the SBOM attached.

## 9. What it defers

- **Building inside the structure** — views, state, storage, migrations,
  tests: [`swift-mobile-engineer`](../swift-mobile-engineer/SKILL.md).
- **API ergonomics for a public HTTP surface**:
  [`api-designer`](../api-designer/SKILL.md).
- **The threat model and the security review**:
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **Performance measurement.** §3 says what evolution mode costs;
  [`performance-engineer`](../performance-engineer/SKILL.md) owns measuring it.

## 10. How to run it

1. Read the module graph and the per-target isolation settings first. Those
   two decide how everything else reads.
2. Run the greps in the checklists for `public`, `@testable`, `@frozen`,
   `@diagnose` and the platform imports.
3. Run the API diff against the last release tag and read its output.
4. Report per row, and for each finding say which ADR should exist.
