# Collections and retries

Two failures that need no attacker: a list that grows until it cannot be
returned, and a network retry that charges a customer twice. Both are decided
in the contract or not at all.

| #   | Check                                                                                                            | How                                                                              | Source                                    |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| CR1 | Every collection operation is paginated                                                                          | find every response schema with a top-level array; each has a limit and a cursor | API4:2023 (`docs/review-standards.md`)    |
| CR2 | The page-size parameter declares a `maximum`                                                                     | `grep -n -A3 "name: limit" openapi.yaml`                                         | API4:2023; JSON Schema 2020-12 validation |
| CR3 | Next and previous pages are given to the client, not computed by it; `Link` headers where used carry `rel`       | read the list response: a cursor field or a `Link` header                        | RFC 8288                                  |
| CR4 | Every string and array the caller sends has `maxLength` or `maxItems`                                            | grep request schemas for `type: string` and `type: array` without a bound        | API4:2023; JSON Schema 2020-12 validation |
| CR5 | Every non-idempotent `POST` states whether a repeat is safe, and if not, how an idempotency key is used and kept | read the operation description; an ADR if a key is adopted                       | RFC 9110 §9.2.2; Idempotency-Key draft-07 |
| CR6 | Operations that are rate limited declare `429` and a `Retry-After` header                                        | read the declared responses                                                      | RFC 9110 §10.2.3; API4:2023               |
| CR7 | A retried request that conflicts with the first gets a defined answer, not a second side effect                  | read what the handler does with a repeated key and a different body              | RFC 9110 §9.2.2                           |

## Why each one

**CR1 and CR2** together. Pagination with no maximum page size is pagination
that a client can switch off with `limit=1000000`. The unbounded list is a
denial of service triggered by one successful customer.

**CR5** is the double charge. A client times out on a `POST`, cannot tell
whether it ran, and retries. Without an idempotency story that retry is a
second order. The `Idempotency-Key` header is the common convention, but its
IETF draft expired without becoming a standard; adopt the name if it helps and
say in the ADR that it rests on a draft.

**CR7** is the half of CR5 that gets forgotten: a repeated key with a
_different_ body is a client bug, and the API has to say so rather than
silently return the first result.
