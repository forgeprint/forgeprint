# Kotlin Senior Software Architect

## What it changes

An agent structuring a Kotlin codebase writes something that looks organised:
packages named `domain` and `data`, everything public because that is Kotlin's
default, shared configuration in `subprojects {}`, `api(...)` wherever a
compile error went away, `CoroutineScope(Dispatchers.IO).launch` in a service,
`else ->` at the bottom of every `when`, and — in a multiplatform project —
`expect class` for anything platform-shaped. With this expert:

- **Gradle modules are the boundaries and `internal` is the wall**, build logic
  lives in convention plugins, and the dependency-analysis plugin fails the
  build on a misdeclared `api`.
- **Layer rules are a test** — Konsist on Kotlin source or ArchUnit on
  bytecode, chosen in the ADR.
- **Compiler versions are aligned** in one catalog: Kotlin and its compiler
  plugins share a version; KSP is picked for it; Spring modules get
  `plugin.spring`.
- **A library's API is explicit and dumped**: explicit API mode, an ABI check
  in `check`, no public `data class`, unstable API behind `@RequiresOptIn`.
- **What Kotlin Multiplatform shares is an ADR**, and `expect`/`actual` stays
  on functions and interfaces.
- **Every coroutine scope has an owner**, and `supervisorScope` is a decision.
- **Sealed hierarchies with exhaustive `when`**, value classes for ids, no `!!`.

Six checklists — Gradle module graph, Kotlin build, API surface, KMP scope,
coroutine ownership, domain types.

## What it fits

- Starting or restructuring a Kotlin codebase with more than one Gradle module:
  a Ktor or Spring Boot service, a library, an Android app's module graph, or a
  Kotlin Multiplatform project.
- Reviewing a Kotlin design, or a change that adds a module, an `api`
  dependency, a public declaration in a library, an `expect` or a
  `CoroutineScope`.
- Kotlin 2.4 with Gradle 9.8. The rules hold from Kotlin 2.2 (ABI validation in
  the Kotlin Gradle plugin); most of them further back.

## What it does not fit

- **A Java codebase, or the JVM-generic half of a Kotlin one.** Maven Enforcer
  rules, reproducible archives, Spring Modulith, `@Transactional` through the
  proxy, virtual threads: `java-senior-architect`, proposed separately. This
  expert is the Kotlin-specific half and says so rather than restating it.
- **Writing the Android app itself** — Compose state, Room migrations,
  permissions, R8: `android-mobile-engineer`, proposed separately. This expert
  decides that app's module graph; that one builds inside it.
- **Application security**: [`security-reviewer`](../security-reviewer/SKILL.md).
- **A single-module script or tool.** One Gradle module has no graph to hold,
  and this expert will say so instead of splitting it.
- **Kotlin/JS or Kotlin/Wasm front ends** as the main target; the KMP rows are
  written with JVM, Android and iOS in mind.

## How it differs from its neighbours

| Question                                                  | Expert                    |
| --------------------------------------------------------- | ------------------------- |
| Which Gradle modules, what is public, what is shared?     | `kotlin-senior-architect` |
| Maven or Gradle reproducibility, Spring internals?        | `java-senior-architect`   |
| How is this Compose screen, database or permission built? | `android-mobile-engineer` |

## Pros and cons

**In its favour:** most rows are a Gradle task with an exit code —
`buildHealth`, `checkKotlinAbi`, a Konsist or ArchUnit test — or a grep with
one right answer. Several rest on recent changes an agent's defaults miss: ABI
validation moving into the Kotlin Gradle plugin, KSP's independent versioning,
`expect class` still Beta.

**Against it:** it asks for a module graph and ADRs before code, which is heavy
for a small service. Konsist is still before 1.0 and the KGP ABI validation is
experimental; both are named with that status rather than hidden. It is
`provenance: generated`: drafted by a tool from the 2026-09-24 research, not
written from someone's practice.

**What `agents: [claude-code]` rests on.** Claude Code ran the checklist greps
over this repository, which has no Kotlin code: they are well-formed and
returned nothing. It has not been run against a real Kotlin codebase. If it
changes nothing about what your agent does on one, say so in an issue.
