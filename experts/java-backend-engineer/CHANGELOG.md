# Changelog

## 1.0.0 — 2026-09-24

First version. Drafted by a tool from the
[2026-09-24 role research](../../docs/research/2026-09-24-roles.md) under
[ADR 0015](../../docs/decisions/0015-experts-per-language.md), which lets an
expert be specific to a language when its checklists are about that language.
**Not manually verified**: every version, property default and bug pattern was
read from its source on 2026-09-24, but no person has yet run this expert
against a real service and reported what changed.

- Request records validated with Jakarta Validation 3.1 and `@Valid`, and
  Jackson 3's `FAIL_ON_UNKNOWN_PROPERTIES` switched back on.
- `@Transactional` rules that follow from Spring's proxy: no self-invocation,
  a declared rollback rule for checked exceptions, no remote call inside,
  `open-in-view` off.
- RFC 9457 `ProblemDetail` from one advice, with Spring Boot 4.1.1's
  problem-details support (off by default) turned on.
- Virtual threads on Java 25 with a deliberately sized HikariCP pool, HTTP
  client timeouts, and Spring Framework 7 `@Retryable` that names what it
  retries.
- Graceful shutdown inside the orchestrator's grace period, liveness free of
  external checks, structured JSON logs with the trace id.
- Error Prone, NullAway with JSpecify, and SpotBugs failing the build.
- Six checklists, each row traced to a source in `references.md`.

Targets Java 25 LTS and Spring Boot 4.1.1. `references.md` is due for
re-reading on 2026-12-23, or when Spring Boot 4.2 reaches GA.
