# Java Senior Backend Engineer

## What it changes

Spring Boot is short to write because it decides things for you. The decisions
that hurt are the ones nobody notices: Jackson 3 accepting unknown JSON
properties, a `@Transactional` method called through `this`, a checked
exception that commits, problem-details support switched off, and a Hikari pool
of ten behind a thousand virtual threads. An agent without this expert writes
all of these, because each one passes its first test. With it:

- **The boundary is explicit.** Request records with Jakarta constraints and
  `@Valid`; `fail-on-unknown-properties` switched back on; no entity ever bound
  from or returned as JSON; `@ConfigurationProperties` validated at startup.
- **Transactions are the ones the proxy can see.** No self-invocation, a
  declared rollback rule for checked exceptions, `readOnly` reads, no remote
  call inside, `open-in-view` off.
- **One advice speaks RFC 9457**, with `spring.mvc.problemdetails.enabled`
  turned on so Spring's own errors match yours.
- **Virtual threads with a pool sized on purpose**, timeouts on every HTTP
  client, and `@Retryable` that names what it retries.
- **The build enforces it.** Error Prone, NullAway with JSpecify, and SpotBugs
  fail the build rather than warn.

Six checklists and nine refusals, most of them a property, a bug pattern or a
test slice.

## What it fits

- Spring Boot 4.1 services on Java 25 with Spring MVC, Spring Data JPA or
  `JdbcTemplate`, and PostgreSQL.
- Moving a Spring Boot 3 service to 4 — the Jackson 3 default and the moved
  HTTP client properties are exactly the kind of change this catches.
- Turning on virtual threads and needing to know what else has to change.

## What it does not fit

- **Architecture.** Module boundaries, hexagonal or layered structure and the
  persistence model are the architect's. The catalog's architect today is
  .NET-specific ([`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)).
- **The API contract.** It keeps the generated OpenAPI committed and diffed;
  the contract's content is the API designer's.
- **A security audit** — [`security-reviewer`](../security-reviewer/SKILL.md).
- **Schema design and migrations** — [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Spring WebFlux and reactive stacks.** The transaction, thread and pool
  rules assume blocking I/O on virtual threads.
- **Kotlin, Quarkus, Micronaut or plain Jakarta EE.** Several rules are about
  Spring's proxy and Spring Boot's defaults specifically.

## Pros and cons

**In its favour:** it names defaults that are easy to miss and cites the exact
property and default value for each, read from the Spring Boot 4.1.1 metadata
rather than remembered: `problemdetails.enabled` false, `open-in-view` true,
HTTP client timeouts unset, Jackson 3 ignoring unknown properties. Every one is
a one-line fix once somebody knows to look.

**Against it:** it is tied to Spring Boot's minor versions, and several of
those defaults have moved between 3.x and 4.x; 4.2 is already at a milestone.
It assumes PostgreSQL and Kubernetes-style probes. And it was drafted by a tool
from documentation and source rather than from a person's review history,
which `provenance: generated` records.
