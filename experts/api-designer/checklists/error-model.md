# Error model

One error shape, everywhere, defined by a standard the caller's tooling already
understands. Every second shape is a branch in every client, maintained for
ever.

| #   | Check                                                                                                | How                                                                                    | Source                                |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| EM1 | Every 4xx and 5xx response uses `application/problem+json`                                           | `grep -n "application/problem+json" openapi.yaml`; no error response with another type | RFC 9457 §6 (media type registration) |
| EM2 | One problem schema, defined once in `components`, referenced from every error response               | the linter's `operation-4xx-problem-details-rfc7807` rule; then grep for inline copies | RFC 9457 §3.1                         |
| EM3 | The schema carries `type`, `title`, `status`, `detail` and `instance`                                | read the schema                                                                        | RFC 9457 §3.1.1–§3.1.5                |
| EM4 | Each problem `type` the API emits is a documented URI; none is invented per response                 | list the `type` values in examples; each resolves to a description                     | RFC 9457 §3.1.1, §4                   |
| EM5 | `detail` tells the client how to correct the request; it carries no stack trace, query or host name  | read the examples and the error-mapping code                                           | RFC 9457 §3.1.4, §5                   |
| EM6 | Field-level validation errors are an extension member with a stated schema, not text inside `detail` | find the `422` example                                                                 | RFC 9457 §3.2                         |
| EM7 | The `status` member equals the HTTP status code of the response                                      | compare example bodies with their response codes                                       | RFC 9457 §3.1.2                       |

## Why each one

**EM2** is the check that makes EM1 true over time. A problem schema copied
into each operation drifts one field at a time until there are three shapes
that all claim to be RFC 9457. The linter rule is named for RFC 7807, which RFC
9457 obsoleted without changing the format, so it still applies.

**EM5** is where an error model becomes a disclosure. A `detail` that includes
the failing SQL is useful to exactly one person, and it is not the one the API
was built for. The RFC itself says `detail` is for correcting the problem, not
for debugging it.

**EM6** is what lets a client put the message next to the right field. Text in
`detail` has to be parsed by a regular expression that breaks the first time
somebody improves the wording.
