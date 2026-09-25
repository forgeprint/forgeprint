# Domain types

Kotlin's type system can carry a large part of a domain's rules: which states
exist, which values may be absent, which identifiers cannot be swapped. These
rows check that it is being asked to.

| #   | Check                                                                                              | How                                                                                             | Source                                  |
| --- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------- |
| DT1 | A closed set of domain states or results is a `sealed interface` or `sealed class`                 | read status enums with behaviour and class hierarchies with a fixed set of subtypes             | Kotlin 2.4 — sealed classes             |
| DT2 | No `else ->` branch in a `when` over a sealed type (except an `expect sealed` type in common code) | `grep -rn -B8 "else ->" src/main/kotlin`; check the subject's type                              | Kotlin 2.4 — sealed classes             |
| DT3 | Identifiers are `@JvmInline value class` wrappers, not bare `String`, `Long` or `UUID`             | read function signatures that take two or more ids of the same primitive type                   | Kotlin 2.4 — inline value classes       |
| DT4 | No `!!` in production code                                                                         | `grep -rn "!!" src/main/kotlin` returns nothing, or each hit has a comment naming the invariant | Kotlin 2.4 — null safety                |
| DT5 | Values from Java APIs are given an explicit Kotlin nullability at the boundary                     | read calls into Java libraries whose results are assigned without a declared type               | Kotlin 2.4 — Java interop, null safety  |
| DT6 | Expected failures are sealed results; exceptions are for bugs and infrastructure                   | read service return types; a `throw` for "not found" or "invalid input" is a finding            | Kotlin 2.4 — sealed classes; the §1 ADR |
| DT7 | Domain objects are immutable: `val` properties and read-only collection types                      | `grep -rnE "\bvar \|MutableList<\|MutableMap<" <domain module>/src/main`                        | Kotlin 2.4 — collections overview       |
| DT8 | The domain module imports no framework type                                                        | covered by `gradle-module-graph.md` MG8                                                         | Konsist 0.17.3; ArchUnit 1.5.0          |

## Why each one

**DT2** is the row that pays for sealed types. With no `else`, adding a state
is a compile error in every `when` that has to handle it. With `else`, it
compiles and quietly takes the default path — the exact failure sealed types
exist to prevent.

**DT3** because `fun transfer(from: String, to: String)` accepts its arguments
in either order. Two value classes make the swap a compile error at no runtime
cost on the JVM.

**DT4** because `!!` is an instruction to crash exactly where the type system
said the value might be missing. Where the invariant is real, a `requireNotNull`
with a message says which one; where it is not, the type should be nullable.
