# Changelog

## 1.0.0 — 2026-09-24

The catalog's Java architect, a language-specific sibling of
`dotnet-senior-architect` under ADR 0015.

- Four decisions in writing before code: the module enforcement mechanism,
  the JDK and Spring Boot line, the persistence boundary, and the thread
  model.
- Module boundaries as a test: Spring Modulith 2.1's
  `ApplicationModules.verify()` or ArchUnit 1.5 layer, slice and dependency
  rules, with `FreezingArchRule` for existing violations.
- A reproducible, convergent build: pinned wrapper and plugins, Maven
  Enforcer 3.6 convergence rules, `project.build.outputTimestamp` and
  `artifact:compare`, or Gradle 9 locking and `failOnVersionConflict()`.
- Types that close the cases: records, sealed hierarchies with exhaustive
  switches, JSpecify `@NullMarked` checked by NullAway through Error Prone.
- Spring as the proxy sees it: constructor injection, validated
  `@ConfigurationProperties` records, no self-invoked `@Transactional`,
  `spring.jpa.open-in-view=false`.
- A deliberate thread model: virtual threads with explicit bounds, no
  `synchronized` rewrites on Java 24+ (JEP 491), `ScopedValue` for context.
- Nine refusals and six checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), under ADR 0015's per-language rule.
Every version was read from Maven Central, Gradle's version service or the
vendor's documentation on 2026-09-24. The expert has not been manually
verified against a real project — `provenance: generated` says so
(ADR 0011).
