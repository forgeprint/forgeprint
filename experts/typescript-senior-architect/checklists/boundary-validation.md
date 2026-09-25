# Boundary validation

A static type describes what the compiler was told. At every place data enters
from outside the process, the only thing that makes the type true is a parser
that runs.

| #   | Check                                                                             | How                                                                              | Source                                            |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| BV1 | One schema library is used, and it is named in an ADR                             | `pnpm why zod valibot`; only one appears as a direct dependency                  | zod 4.6; valibot 1.5                              |
| BV2 | Every HTTP handler parses its body, params and query before using them            | read each route; the first statement on input is a `parse`/`safeParse`           | zod 4.6 — basic usage                             |
| BV3 | Static types for external data are derived from the schema                        | `grep -rn "z.infer\|InferOutput"`; no hand-written interface duplicates a schema | zod 4.6 — type inference                          |
| BV4 | No `JSON.parse(...) as T`, no `(await res.json()) as T`                           | `grep -rnE "JSON\.parse\(.*\) as \|json\(\)\) as "`                              | typescript-eslint 8.70 — `no-unsafe-*` rules      |
| BV5 | `process.env` is read in one module, parsed at startup, and exported typed        | `grep -rn "process.env" src` returns one file                                    | zod 4.6; Node.js 24 — `process.env`               |
| BV6 | A missing or malformed setting stops the process before it listens                | remove one variable and start; it must exit non-zero                             | BV5                                               |
| BV7 | Queue and webhook payloads are parsed like HTTP bodies                            | read each consumer's first lines                                                 | zod 4.6 — basic usage                             |
| BV8 | `catch (e)` treats `e` as `unknown` and narrows before use                        | `useUnknownInCatchVariables` is on (part of `strict`)                            | TSConfig reference — `useUnknownInCatchVariables` |
| BV9 | The public API contract is generated from the schemas, not maintained beside them | find the OpenAPI or JSON Schema output and the script that produces it           | zod 4.6 — JSON Schema conversion                  |

## Why each one

**BV4** is the most common way a TypeScript codebase lies to itself. The cast
compiles, the type is wrong the first time the upstream changes, and the error
surfaces three calls later as `undefined is not a function` — nowhere near the
line that caused it.

**BV6** is BV5 proved from the other direction. A schema that is defined and
never called at startup reads correctly in review and does nothing; only
starting the process without the variable shows the check exists.
