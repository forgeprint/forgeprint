# Boundary validation

A TypeScript type describes what the code expects. Only a runtime parser says
what actually arrived. Everything that crosses into the process is `unknown`
until a zod schema has accepted it.

| #   | Check                                                                                       | How                                                                                   | Source                                        |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| BV1 | Every handler parses body, query and params with a schema before using them                 | read each route; the first statement on the input is `safeParse` or `parse`           | OWASP ASVS 5.0.0 V2                           |
| BV2 | Request bodies use `z.strictObject`, so unknown keys are rejected rather than stripped      | grep the request schemas for `z.object(`                                              | Zod 4.6 — objects; OWASP API3:2023            |
| BV3 | No cast on untrusted data: no `as` on `req.body`, `req.query`, `JSON.parse` or `res.json()` | grep `as ` next to those names; `@typescript-eslint/no-unsafe-assignment` is an error | typescript-eslint 8.70 — no-unsafe-assignment |
| BV4 | Query and path values are coerced by the schema, with bounds                                | grep `Number(req.` and `parseInt(req.`; each is a finding                             | Zod 4.6 — coercion; OWASP ASVS 5.0.0 V2       |
| BV5 | Strings and arrays carry a maximum length                                                   | read each schema; every `z.string()` and `z.array()` has `.max()`                     | OWASP ASVS 5.0.0 V2; OWASP API4:2023          |
| BV6 | `process.env` is parsed by one schema at startup, and a failure exits non-zero              | start the service without a required variable; it must exit                           | The Twelve-Factor App — III Config            |
| BV7 | `process.env` is read nowhere outside the config module                                     | grep `process.env` across `src/`                                                      | The Twelve-Factor App — III Config            |
| BV8 | Responses from other services are parsed before use                                         | read each outbound client; the result of `res.json()` goes through a schema           | OWASP ASVS 5.0.0 V2                           |
| BV9 | Validation failures return 400 or 422 as problem details listing the fields                 | send an invalid body; read the response                                               | RFC 9457 §3; RFC 9110 §15.5                   |

## Why each one

**BV2** is the one Zod 4 made easy to miss. `z.object` strips unknown keys
without complaint, so a caller sending `tenantId` or `role` gets no error and
the field silently disappears — until somebody spreads the raw body into an
update instead of the parsed one. Strict parsing makes the attempt visible and
the mass-assignment path impossible.

**BV3** exists because the compiler agrees with every cast. `req.body as
CreateOrder` type-checks, passes review, and is the exact line where a string
becomes a number that is not one.

**BV6** turns a missing secret from a 500 at the first request into a process
that refuses to start, which is the moment somebody is watching.
