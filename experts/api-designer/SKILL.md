---
name: api-designer
description: Design or review an HTTP API contract-first — the OpenAPI document is written and linted before any handler exists, methods and status codes follow RFC 9110, every error body is an RFC 9457 problem details object, and versioning, deprecation, pagination and retries are decided in the contract rather than discovered in production. Use when starting an API, adding or changing an endpoint, reviewing an API before it has external callers, or when an agent is about to write a route with no specification behind it.
license: CC-BY-4.0
---

# Designing an HTTP API contract-first

An agent asked for an API writes handlers, and the contract is whatever the
handlers happen to do. This skill reverses the order: **the OpenAPI document is
the design**, it is written first, a pinned linter passes on it, and the code is
checked against it rather than the other way round.

Everything here is checkable by a command, a grep, or a file that must exist.
Every rule cites a source in [`references.md`](references.md).

---

## 1. Before any handler: the contract file exists and lints clean

1. **Write `openapi.yaml` first**, declaring `openapi: 3.2.1`, the current
   release. Every operation has an `operationId`, a `summary`, a tag, every
   response it can return, and a `security` requirement or an explicit
   `security: []` for a deliberately public one.
2. **Lint it with a pinned linter**, and run it — do not assume it passes.
   The `recommended` rulesets leave the rules this skill depends on switched
   off, so commit a `redocly.yaml` beside the contract:

   ```yaml
   extends:
     - recommended-strict
   rules:
     no-http-verbs-in-paths: error
     operation-4xx-response: error
     operation-4xx-problem-details-rfc7807: error
     paths-kebab-case: error
   ```

   ```bash
   npx --yes @redocly/cli@2.54.2 lint openapi.yaml
   ```

   A non-zero exit means the contract is not done. If the project already pins
   a different linter version in its lockfile, use that one and say so.

3. **Commit the contract with, or before, the code that implements it.** A
   pull request that changes a route and not `openapi.yaml` is incomplete.
4. **Record the decisions that are expensive to reverse** — the versioning
   scheme, the error model, the pagination style, the identifier format — as
   an ADR under `docs/decisions/`, with Consequences and Alternatives.

Verify: `git diff --name-only` for a route change includes `openapi.yaml`.
See [`checklists/contract-first.md`](checklists/contract-first.md).

---

## 2. Methods and status codes mean what RFC 9110 says

- **Resources are nouns; the method is the verb.** `POST /orders`, not
  `POST /createOrder`. The linter's `no-http-verbs-in-paths` rule catches most.
- **Safe means safe** (RFC 9110 §9.2.1): `GET`, `HEAD` and `QUERY` change
  nothing. A `GET` that writes is a bug a crawler or a prefetch will find.
- **Idempotent means idempotent** (§9.2.2): `PUT` and `DELETE` repeated give
  the same state. `POST` is not; §4 below handles that.
- **A search too large for a query string is `QUERY`** (RFC 10008), which OAS
  3.2 models as `query:` on a Path Item — not `POST /search`, which throws away
  safety and cacheability.
- **Status codes are specific.** `201` with `Location` for a create (§15.3.2,
  §10.2.2); `204` with no body; `409` for a state conflict; `412` when an
  `If-Match` precondition fails; `415` for the wrong media type; `422` for a
  well-formed body that fails validation. `200` with `"success": false` is
  refused.
- **Optimistic concurrency uses `ETag` and `If-Match`** (§8.8.3, §13.1.1), not
  a version field the client may forget to send.

See [`checklists/http-semantics.md`](checklists/http-semantics.md).

---

## 3. Every error is a problem details object

One error shape, for every 4xx and 5xx, on every operation: RFC 9457,
`application/problem+json`, with `type`, `title`, `status`, `detail` and
`instance`, and extension members for field-level validation errors.

- Define it once in `components/schemas` and `$ref` it from every error
  response. Redocly's `operation-4xx-problem-details-rfc7807` rule checks the
  4xx half; RFC 9457 obsoleted 7807 and kept the format.
- `type` is a URI that identifies the problem kind and is documented. Omitted,
  it means `about:blank` — nothing beyond the status code.
- `detail` helps the client fix the request. It never carries a stack trace,
  a query, or an internal host name.

Verify: `grep -c "application/problem+json" openapi.yaml` is not zero, and no
error response declares any other media type.
See [`checklists/error-model.md`](checklists/error-model.md).

---

## 4. Collections, retries and limits are in the contract

- **Every collection is paginated**, with a maximum page size stated in the
  schema (`maximum:` on the limit parameter). Prefer an opaque cursor; next and
  previous may be carried as `Link` headers (RFC 8288). An unbounded list is
  API4:2023 waiting for its largest customer.
- **Every `POST` that creates or charges something states its retry story.**
  Either it is safe to repeat, or it accepts an idempotency key and says how
  long keys are remembered. The `Idempotency-Key` header is an expired IETF
  draft, not a standard; say so in the ADR if you adopt its name.
- **Rate limits and payload limits are declared** — `429` with `Retry-After`
  (RFC 9110 §10.2.3) on the operations that have them, and `maxLength` or
  `maxItems` on every string and array the caller controls.

See [`checklists/collections-and-retries.md`](checklists/collections-and-retries.md).

---

## 5. Evolution: additive by default, breaking only on purpose

- **Pick one versioning scheme and write it down** (§1.4). Whichever it is, a
  breaking change is a new major version; an additive one is not.
- **Breaking** means: a removed or renamed field, operation or enum value; a
  new required request field; a narrowed type; a changed status code or
  default. Diff the old and new contract and list each one.
- **Deprecate before removing.** Mark `deprecated: true` in the contract, send
  `Deprecation` (RFC 9745) and, once there is a date, `Sunset` (RFC 8594) on
  the responses. Sunset never precedes Deprecation.
- Clients must tolerate unknown response fields; say so in the contract's
  description, or adding a field becomes breaking in practice.

See [`checklists/evolution.md`](checklists/evolution.md).

---

## 6. Security at the contract, and where it stops

The contract is where three API risks are visible before any code exists:
object identifiers that invite BOLA (API1:2023), response and request schemas
that expose or accept properties the caller must not see or set (API3:2023),
and operations nobody inventoried (API9:2023). Check those here.

- Every operation declares its `security`; `securitySchemes` are defined; there
  is no global default that makes a new operation silently public.
- Request and response schemas are separate where they differ, and request
  schemas set `additionalProperties: false`.
- Every server URL is `https`.

**This is not a security review.** Authentication flows, token validation,
authorization logic and anything that needs the code go to
[`security-reviewer`](../security-reviewer/SKILL.md), against the OWASP rows in
[`docs/review-standards.md`](../../docs/review-standards.md).
See [`checklists/contract-security.md`](checklists/contract-security.md).

---

## 7. What you refuse

| Refuse                                                    | Because                                                 |
| --------------------------------------------------------- | ------------------------------------------------------- |
| A route written before its operation is in `openapi.yaml` | The contract becomes a description of accidents         |
| A contract generated from code, then called the design    | It records what was built, not what was decided         |
| `200` with an error in the body                           | Every client, proxy and monitor reads the status first  |
| A second error shape, or a bare string error body         | Clients special-case each one, forever                  |
| A verb in a path, or `POST` for a read                    | Loses safety, idempotency and caching (RFC 9110 §9.2)   |
| An unpaginated collection, or no maximum page size        | API4:2023, triggered by growth rather than an attacker  |
| A breaking change with no new version and no deprecation  | Callers find out from their pager                       |
| A request schema that is the storage model                | Mass assignment (API3:2023)                             |
| An unpinned linter in a verification command              | The check changes under you and nobody decided it would |

Name the row when you refuse, and propose the fix.

---

## 8. What you produce

- **API specification** — `openapi.yaml` at OAS 3.2 and its `redocly.yaml`,
  linted clean by the pinned command in §1, committed.
- **API design review** — each finding as
  `severity · file:line · checklist row · fix`, plus **checked and sound** and
  **not applicable, with reasons**.
  Verdict `MERGE` or `CHANGES`. Severities as `security-reviewer` defines them.
- **ADR** — one per expensive decision in §1.4.

A finding that cites no row and no source is an opinion and stays out.

---

## 9. What you defer

- **Deep security review** — to `security-reviewer`.
- **Documentation prose** — tutorials, guides, the words around the reference —
  to [`technical-writer`](../technical-writer/SKILL.md). The contract's own
  `summary` and `description` fields are yours.
- **Architecture beyond the contract** — persistence, transactions, process
  boundaries, layering — to the architects, for .NET
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md).
- **Non-HTTP interfaces** — GraphQL, gRPC, event streams. The HTTP rules here
  do not transfer and this skill does not pretend they do.
