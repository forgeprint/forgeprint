# API Designer

## What it changes

An agent asked for an API writes the handlers first, and the contract is
whatever they turn out to do: a verb in one path, `200` with `"success": false`
in another, three error shapes, a list endpoint with no page size. Each is
reasonable locally and expensive once somebody depends on it.

Four things change with this expert:

- **The OpenAPI document comes first and a pinned linter gates it.**
  `openapi.yaml` at OAS 3.2.1, a committed `redocly.yaml` that switches on the
  rules the default ruleset leaves off, and
  `npx --yes @redocly/cli@2.54.2 lint openapi.yaml` exiting 0 before any
  handler is written.
- **Methods and status codes follow RFC 9110**, with section numbers — and a
  large read is `QUERY` (RFC 10008), not `POST /search`.
- **One error shape**: RFC 9457 problem details, defined once and referenced
  everywhere.
- **Change, pagination and retries are decided in the contract**: a versioning
  ADR, `Deprecation` and `Sunset` headers, a maximum page size, and a stated
  retry story for every `POST`.

Six checklists: contract first, HTTP semantics, error model, evolution,
collections and retries, contract security.

## What it fits

- Starting an HTTP API, before any handler exists.
- Adding or changing an endpoint on an API that already has callers.
- Reviewing an API design before it is published, when changing it is still
  cheap.
- Any stack. The contract, the linter and the RFCs are language-neutral; the
  checklists read the contract, not the code, except where a row says so.

## What it does not fit

- **A security review.** It checks what a contract can show — declared
  security, `https`, identifiers, property exposure, inventory — and stops.
  Authentication flows, token validation and authorization logic go to
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **Documentation prose.** Guides, tutorials and the words around the
  reference go to [`technical-writer`](../technical-writer/SKILL.md). The
  contract's own `summary` and `description` fields stay here.
- **Architecture behind the contract.** Persistence, transactions, layering
  and process boundaries belong to an architect — for .NET,
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md).
- **GraphQL, gRPC and event-driven interfaces.** The HTTP rules do not transfer,
  and the linter command does not read those formats.
- **An internal endpoint with one caller in the same repository.** The full
  contract discipline is overhead there, and this expert will say so rather
  than impose it.

## Pros and cons

**In its favour:** the gate is a command. The contract lints or it does not,
error bodies are `application/problem+json` or a grep finds the exception, and
every rule cites an RFC section or a named linter rule. It also records what is
_not_ a standard: the `Idempotency-Key` header is cited as an expired draft,
because citing it as more would be the kind of wrong answer that sounds right.

**Against it:** it is written from research, not from practice, and has not yet
been run against a real API with callers (`provenance: generated`). It pins one
linter version that will age within weeks, and it chooses Redocly over Spectral
for a reason — a released OpenAPI 3.2 support — that will likely not hold at
the next re-check.
Contract-first is also a real cost on a prototype whose shape is still being
discovered; this expert does not pretend otherwise.
