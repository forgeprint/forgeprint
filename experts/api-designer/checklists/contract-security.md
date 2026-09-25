# Contract security

What a contract can show about security before any code exists. This is the
design half; the review of authentication flows, token validation and
authorization logic belongs to `security-reviewer`, against the OWASP rows in
`docs/review-standards.md`.

| #   | Check                                                                                           | How                                                                      | Source                                               |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| CS1 | Every operation declares `security`, or `security: []` on purpose, and the public list is short | the linter's `security-defined` rule; list the `security: []` operations | OAS 3.2.1 — Security Requirement Object              |
| CS2 | Every scheme an operation names is defined in `components.securitySchemes`                      | the linter validates the references                                      | OAS 3.2.1 — Security Scheme Object                   |
| CS3 | Every server URL is `https`                                                                     | `grep -n "url: http:" openapi.yaml` finds nothing                        | API8:2023 (`docs/review-standards.md`)               |
| CS4 | An object identifier in a path is scoped to the caller, and the operation says how              | for each `{id}` path parameter, the description names the ownership rule | API1:2023 BOLA                                       |
| CS5 | Request schemas are not response schemas, and set `additionalProperties: false`                 | compare the request and response schema for each resource                | API3:2023 Broken Object Property Level Authorization |
| CS6 | Response schemas expose no property the caller should not see                                   | read each response schema for internal flags, tenant ids, hashes         | API3:2023                                            |
| CS7 | Administrative operations are separate, separately secured, and not merely undocumented         | list them; each has its own security requirement                         | API5:2023 BFLA                                       |
| CS8 | The contract is the complete inventory: no route in the code that is absent from it             | compare the router's route table with the contract's paths               | API9:2023 Improper Inventory Management              |

## Why each one

**CS4** is where the most common API vulnerability is visible at design time.
The contract cannot enforce ownership, but it can state the rule, and an
operation whose description cannot say whose object `{id}` may name has not
been designed yet. The check in code is `security-reviewer`'s.

**CS5** is mass assignment prevented in the schema. When the request schema is
the response schema, every property the server returns is one the client may
try to set — including the one that says who owns the row.

**CS8** is the route nobody documented, so nobody reviewed, so nobody retired.
It is the reason the contract has to be complete rather than representative.
