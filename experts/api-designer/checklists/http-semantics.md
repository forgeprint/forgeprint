# HTTP semantics

Every client library, proxy, cache and monitor between the caller and the
server already knows what `GET`, `409` and `ETag` mean. An API that uses them
as RFC 9110 defines them gets that machinery for free; one that invents its own
meanings has to explain them to every one of those, and cannot.

| #   | Check                                                                                                              | How                                                            | Source                                          |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------- |
| H1  | Paths are nouns; no verb in a path                                                                                 | the linter's `no-http-verbs-in-paths` rule                     | RFC 9110 §9 — the method is the verb            |
| H2  | `GET`, `HEAD` and `QUERY` operations change no state                                                               | read each safe operation's description and handler for a write | RFC 9110 §9.2.1; RFC 10008                      |
| H3  | `PUT` and `DELETE` are idempotent: repeating one leaves the same state                                             | read what a second identical call does                         | RFC 9110 §9.2.2                                 |
| H4  | A read whose input is too large for a query string is `QUERY`, not `POST`                                          | grep the contract for `post:` on a search or filter operation  | RFC 10008; OAS 3.2.1 — Path Item `query`        |
| H5  | A create returns `201` with a `Location` header                                                                    | read each create operation's `201` response headers            | RFC 9110 §15.3.2, §10.2.2                       |
| H6  | No `200` whose body reports a failure                                                                              | grep response schemas for `success`, `ok` or `error` booleans  | RFC 9110 §15                                    |
| H7  | The client errors are specific: `409` conflict, `412` failed precondition, `415` media type, `422` invalid content | read the declared 4xx set per operation                        | RFC 9110 §15.5.10, §15.5.13, §15.5.16, §15.5.21 |
| H8  | An update that can race uses `ETag` and `If-Match`, and declares `412`                                             | find the update operations; check the header and the response  | RFC 9110 §8.8.3, §13.1.1                        |
| H9  | Media types are declared on every request and response body                                                        | no `content:` block without a media type key                   | RFC 9110 §12; OAS 3.2.1 — Media Type Object     |

## Why each one

**H2** is the rule a crawler, a link prefetcher or a retrying proxy enforces
for you, destructively. A `GET` that deletes is not a style problem; it is a
delete that runs whenever anything decides to look.

**H4** is new enough that agents miss it. Before RFC 10008, a complex search
became `POST /search` and lost safety, idempotency and cacheability at once.
`QUERY` keeps all three, and OAS 3.2 has a field for it.

**H8** is the lost update. Without a precondition, two clients that read the
same version both write, and the second silently erases the first. A version
field in the body works only if every client remembers to send it; `If-Match`
is enforced by the server.
