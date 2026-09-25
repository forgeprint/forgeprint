# Contract first

The contract is the design, so it exists before the code and a machine checks
it. A specification written afterwards describes what happened; it cannot tell
anybody whether that was intended.

| #   | Check                                                                                      | How                                                                                      | Source                                       |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| CF1 | `openapi.yaml` exists and declares `openapi: 3.2.1`                                        | `grep -n "^openapi:" openapi.yaml`                                                       | OpenAPI Specification 3.2.1                  |
| CF2 | The contract lints clean under the pinned command, with the stricter rules switched on     | `npx --yes @redocly/cli@2.54.2 lint openapi.yaml` exits 0 with `redocly.yaml` next to it | Redocly CLI 2.54.2 — built-in rules          |
| CF3 | Every operation has a unique `operationId`                                                 | the linter's `operation-operationId-unique` rule                                         | OAS 3.2.1 — Operation Object                 |
| CF4 | Every operation has a `summary` and exactly one tag, and every tag is defined              | `operation-summary`, `operation-singular-tag`, `operation-tag-defined`                   | Redocly CLI 2.54.2 — built-in rules          |
| CF5 | Every response an operation can return is declared, including its errors                   | `operation-4xx-response`; then read one operation against its handler                    | OAS 3.2.1 — Responses Object                 |
| CF6 | Schemas are JSON Schema 2020-12 and live in `components`, referenced by `$ref`             | no inline schema repeated in two operations                                              | JSON Schema 2020-12; OAS 3.2.1               |
| CF7 | A change to a route changes `openapi.yaml` in the same pull request                        | `git diff --name-only` on the change includes `openapi.yaml`                             | OAS 3.2.1 — the description is the interface |
| CF8 | Every decision that is expensive to reverse is an ADR: versioning, errors, pagination, ids | `ls docs/decisions/`                                                                     | ADR practice (`docs/review-standards.md`)    |

## Why each one

**CF2** is the one that turns the rest from advice into a gate. The built-in
`recommended` rulesets leave `no-http-verbs-in-paths` and the problem-details
rule switched off, so a contract can pass `recommended-strict` with a verb in
every path. The `redocly.yaml` in SKILL.md §1 switches them on; without it, the
linter is checking less than the reader thinks.

**CF7** is where contract-first quietly becomes code-first. The contract is
right on day one, a route is added in a hurry on day forty, and from then on
the document is a history of intentions.

**CF8** exists because these four are the decisions a second team will have to
live with. Recorded, they can be argued with; implied by the code, they are
simply inherited.
