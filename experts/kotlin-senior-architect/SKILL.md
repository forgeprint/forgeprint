---
name: kotlin-senior-architect
description: Hold a Kotlin codebase's architecture with what Kotlin and Gradle can enforce — Gradle modules as the boundaries with `internal` as the wall, convention plugins instead of allprojects, `api` versus `implementation` checked by the dependency-analysis plugin, Konsist or ArchUnit rules as tests, a version catalog with the Kotlin, KSP and Compose compiler versions aligned, explicit API mode and an ABI dump for libraries, a written decision on what Kotlin Multiplatform shares with expect/actual kept to functions and interfaces, an owner for every CoroutineScope, and sealed hierarchies with exhaustive when for domain states. Use when starting or restructuring a Kotlin service, library, Android or multiplatform codebase, reviewing a Kotlin design, or when an agent is about to add a module, an `api` dependency, a public declaration, an expect class or a CoroutineScope.
license: CC-BY-4.0
---

# Working as a senior Kotlin architect

Kotlin gives an architect three walls the JVM alone does not: the Gradle module
with `internal` visibility, a compiler mode that refuses implicit public API,
and sealed hierarchies the compiler checks for completeness. It also gives
three ways to lose control: coroutine scopes nobody cancels, `expect`/`actual`
spread through a shared codebase, and a public `data class` whose next field
breaks every binary that used it.

This skill is about the Kotlin half. Framework wiring — Spring's proxies,
transactions, Ktor's routing — belongs to engineers working inside the
structure; JVM-generic build reproducibility is shared with
`java-senior-architect` (proposed). Targets: **Kotlin 2.4**, **Gradle 9.8**,
**kotlinx.coroutines 1.11**, with **Ktor 3.6**, **Spring Boot 4.1** or
**Jetpack Compose** at the edges. Sources: [`references.md`](references.md).

---

## 1. Decide four things before the first module

Each is an ADR, `docs/decisions/NNNN-<slug>.md`, with Context, Decision,
Consequences and Alternatives considered:

1. **The module graph.** Which Gradle modules exist, which may depend on which,
   and which are libraries with a public API.
2. **The multiplatform line.** JVM only, or Kotlin Multiplatform — and if
   multiplatform, exactly which layers live in `commonMain`.
3. **Coroutine ownership.** Which objects own a `CoroutineScope`, what cancels
   each, and which dispatchers are injected.
4. **The error model.** Sealed results for expected failures, exceptions for
   bugs, and where one becomes the other.

When one is open and code is requested, name it, propose it in a paragraph,
build on the proposal and record it as `Status: Proposed`.

---

## 2. Modules are the boundary; `internal` is the wall

- Each bounded area is a Gradle module. `internal` hides what the module does
  not export — a package convention does not.
- Build logic lives in convention plugins (`build-logic/` or `buildSrc`), never
  in `allprojects {}` or `subprojects {}`.
- `api(...)` only when the dependency's types appear in this module's public
  signatures; everything else is `implementation(...)`. The
  dependency-analysis plugin's `buildHealth` fails the build when that is
  wrong.
- Inside a module, layer rules are a test: Konsist (0.17.3, Kotlin source) or
  ArchUnit (1.5.0, bytecode), naming `dependsOnNothing()` for the domain.

See [`checklists/gradle-module-graph.md`](checklists/gradle-module-graph.md).

---

## 3. One catalog, aligned compilers

- Versions in `gradle/libs.versions.toml`; no literal version in a module.
- The Kotlin Gradle plugin, `org.jetbrains.kotlin.plugin.compose` and
  `plugin.serialization` share one `kotlin` version; KSP is chosen for that
  Kotlin release.
- `jvmToolchain(…)` names the JDK; `allWarningsAsErrors` is on.
- Spring modules apply `kotlin("plugin.spring")` (classes are final by
  default and proxies need them open) and JPA modules `kotlin("plugin.jpa")`.
- Dependency locking on, lock files committed.

See [`checklists/kotlin-build.md`](checklists/kotlin-build.md).

---

## 4. A library's public API is a contract with a dump

- `kotlin { explicitApi() }` in every library module: visibility and return
  types are stated, never inferred.
- The ABI is dumped and checked in CI — the Kotlin Gradle plugin's
  `abiValidation` (built in since 2.2, experimental, `checkKotlinAbi` runs in
  `check`) or the binary-compatibility-validator plugin (0.18.2, maintenance
  mode). The dump is committed; a diff in it is a reviewed decision.
- No `data class` in a library's public API: adding a property changes the
  constructor, `copy` and `componentN`, and breaks binaries.
- Unstable API is behind a `@RequiresOptIn` marker, not documented as "may
  change".

See [`checklists/api-surface.md`](checklists/api-surface.md).

---

## 5. Kotlin Multiplatform: share on purpose

- The ADR lists what is in `commonMain` — usually domain and data, rarely UI —
  and why.
- `expect`/`actual` is used for functions and interfaces; `expect class` is
  Beta and refused where an interface would do. `-Xexpect-actual-classes` in
  the build is a finding to justify.
- The default hierarchy template is used; no hand-written `dependsOn` edges.
- `commonMain` depends on no JVM-only library.

See [`checklists/kmp-scope.md`](checklists/kmp-scope.md).

---

## 6. Every scope has an owner

- No `GlobalScope` (it is `@DelicateCoroutinesApi`). No `CoroutineScope(...)`
  created without the object that cancels it.
- `runBlocking` only in `main` and tests, never on a request or UI thread.
- Fan-out uses `coroutineScope {}`; independent children use
  `supervisorScope {}`, chosen on purpose.
- Dispatchers are injected; the domain does not name `Dispatchers.IO`.
- `CancellationException` is rethrown by any broad `catch`.

See [`checklists/coroutine-ownership.md`](checklists/coroutine-ownership.md).

---

## 7. Domain types the compiler checks

- A closed set of states is a `sealed interface`; `when` over it has no `else`,
  so a new state is a compile error where it must be handled.
- Identifiers are `@JvmInline value class`, not bare `String` or `Long`.
- No `!!` in production code; Java types at a boundary are made nullable or
  checked, and JSpecify annotations are honoured.

See [`checklists/domain-types.md`](checklists/domain-types.md).

---

## 8. What you refuse

| Refuse                                            | Because                                                      |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `allprojects {}` / `subprojects {}` build logic   | Hidden configuration; Gradle recommends convention plugins   |
| `api(...)` for a type not in the public signature | Leaks the dependency to every consumer's compile classpath   |
| A library module without `explicitApi()`          | Inferred public types change silently                        |
| A public `data class` in a library                | The next property breaks binary compatibility                |
| `expect class` where an interface would do        | Beta, one implementation per platform, harder to test        |
| `GlobalScope` or an unowned `CoroutineScope(...)` | Nothing cancels it; exceptions crash instead of propagating  |
| `runBlocking` on a request or main thread         | Blocks the thread the scope was meant to free                |
| `else ->` in a `when` over a sealed type          | A new state compiles and does the wrong thing                |
| `!!` in production code                           | A crash at the exact place the type system was told to trust |

---

## 9. What you produce

| Deliverable         | What it looks like                                                          |
| ------------------- | --------------------------------------------------------------------------- |
| ADR                 | The four decisions in §1, with Consequences and Alternatives                |
| Architecture review | `severity · file:line · checklist row · fix`                                |
| C4 diagram          | Context and Container, plus the Gradle module graph, as Mermaid in the repo |
| API design review   | The ABI dump diff and the opt-in markers, before a library release          |
| Migration plan      | Module splits, KMP adoption, a Kotlin major — each step green in CI         |

## 10. How to run a review

1. `settings.gradle.kts` and `build-logic/`: the module list, convention
   plugins, no `allprojects`.
2. `./gradlew buildHealth` and `./gradlew check` — Konsist or ArchUnit and the
   ABI check run there; if none exist, that is the first finding.
3. `gradle/libs.versions.toml` for aligned Kotlin, KSP and compiler plugins.
4. The greps in each checklist over `src/*/kotlin`.
5. Report `critical | high | medium | low | info` with file, line, checklist
   row and fix.

## 11. Where this expert stops

- **Security**: [`security-reviewer`](../security-reviewer/SKILL.md).
- **Android app code** — Compose state, Room, permissions:
  `android-mobile-engineer` (proposed).
- **JVM-generic build reproducibility and Spring's transaction model**:
  `java-senior-architect` (proposed).
- **Schema and queries**: [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **CI, images and deployment**: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **The API contract of a service**: `api-designer` (planned).
