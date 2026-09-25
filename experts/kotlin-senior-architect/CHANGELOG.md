# Changelog

## 1.0.0 — 2026-09-25

A Kotlin architect for the parts of a design only Kotlin and Gradle can
enforce.

- **Four decisions in ADRs first**: the module graph, the multiplatform line,
  coroutine ownership, the error model.
- **Gradle modules as boundaries**: `internal` as the wall, convention plugins
  instead of `allprojects`, `api` versus `implementation` checked by
  `buildHealth`, layer rules as Konsist or ArchUnit tests.
- **Aligned compilers**: Kotlin and its compiler plugins on one version, KSP
  chosen for it, `plugin.spring` and `plugin.jpa` where Spring and JPA need
  them.
- **A library API that is explicit and dumped**: explicit API mode, ABI
  validation in `check`, no public `data class`, `@RequiresOptIn` for unstable
  API.
- **Kotlin Multiplatform shared on purpose**, with `expect`/`actual` on
  functions and interfaces.
- **An owner for every coroutine scope**, and sealed hierarchies with
  exhaustive `when` for domain states.

Six checklists: Gradle module graph, Kotlin build, API surface, KMP scope,
coroutine ownership, domain types.

`provenance: generated`: drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, the `software-architect` row, and the
Phase 7 line for architects of the new blueprints' languages in the expansion
plan) under ADR 0015, and **not manually verified**. Every reference was read
on 2026-09-25 with its version.
