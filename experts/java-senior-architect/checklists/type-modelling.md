# Type modelling

Modern Java can say "exactly these cases" and "never null" in a way the
compiler checks. A design that uses neither leaves both questions to runtime.

| #   | Check                                                           | How                                                                              | Source                                                            |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| TM1 | DTOs, events, commands and configuration properties are records | `grep -rn "class .*Dto\|class .*Event\|class .*Command" --include=*.java`        | JEP 395 — Records                                                 |
| TM2 | A closed set of variants is a `sealed` interface with `permits` | read the domain for type-code enums carrying behaviour, or open hierarchies      | JEP 409 — Sealed classes                                          |
| TM3 | A switch over a sealed type is exhaustive and has no `default`  | `grep -rn "default ->" --include=*.java` near sealed types                       | JEP 441 — Pattern matching for switch                             |
| TM4 | Every package has `@NullMarked` in `package-info.java`          | `find src/main -name package-info.java`; grep each for `@NullMarked`             | JSpecify 1.0                                                      |
| TM5 | NullAway runs through Error Prone and fails the compile         | the compiler arguments: `-Xplugin:ErrorProne` and `NullAway:OnlyNullMarked=true` | NullAway 0.14; Error Prone 2.50; Spring Framework 7 — null-safety |
| TM6 | `Optional` is used as a return type only                        | `grep -rn "Optional<.*> [a-z]*[;,)]" --include=*.java` for fields and parameters | Java 25 API — `Optional`                                          |
| TM7 | No preview feature in production code                           | `grep -rn "enable-preview" pom.xml build.gradle*`                                | JDK 25 — JEP list (preview status)                                |
| TM8 | Records validate their invariants in a compact constructor      | read each record that carries a rule                                             | JEP 395 — Records                                                 |

## Why each one

**TM3** is what makes `sealed` worth having. With an exhaustive switch and no
`default`, adding a permitted subtype is a compile error at every place that
must handle it; with a `default`, it is a silent fall-through found in
production.

**TM5** because annotations nobody checks are documentation. Spring Framework 7
annotates its own API with JSpecify and checks it with NullAway, which means a
Spring Boot 4 application gets accurate nullness from the framework — but only
if its own code is checked the same way.

**TM7** because a preview API can change or disappear in the next release, and
an LTS line is chosen precisely to avoid that. In Java 25, Structured
Concurrency is still a preview; Scoped Values are final.
