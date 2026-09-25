# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Versions were read from the npm registry, the Node.js release schedule and each
project's own documentation on the date shown. **Re-check every 90 days**, and
sooner when Node.js 26 enters LTS on 2026-10-28 or typescript-eslint widens its
TypeScript peer range.

> **Next re-check due: 2026-12-23.**

## Runtime and language

| Reference                                                                                                              | Version                                                                                   | Checked    | Used for                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| [Node.js release schedule](https://github.com/nodejs/Release)                                                          | 24 "Krypton" Active LTS (24.21.0); 22 Maintenance; 26 Current, LTS from 2026-10-28        | 2026-09-24 | The target runtime in SKILL.md                                         |
| [Node.js 24 — Command-line options](https://nodejs.org/docs/latest-v24.x/api/cli.html)                                 | 24.x; `--unhandled-rejections` default `throw` since v15.0.0                              | 2026-09-24 | `promise-discipline.md` PD4, PD5                                       |
| [Node.js 24 — HTTP](https://nodejs.org/docs/latest-v24.x/api/http.html)                                                | 24.x; `requestTimeout` default 300000, `server.close()` closes idle connections since v19 | 2026-09-24 | `lifecycle.md` LC4, LC5                                                |
| [Node.js 24 — Globals, AbortSignal](https://nodejs.org/docs/latest-v24.x/api/globals.html)                             | 24.x; `AbortSignal.timeout` since v17.3.0, `AbortSignal.any` since v20.3.0                | 2026-09-24 | `lifecycle.md` LC1, LC2                                                |
| [Node.js 24 — Asynchronous context tracking](https://nodejs.org/docs/latest-v24.x/api/async_context.html)              | 24.x; module Stability 2                                                                  | 2026-09-24 | `errors-and-logs.md` EL9                                               |
| [Node.js 24 — Test runner](https://nodejs.org/docs/latest-v24.x/api/test.html)                                         | 24.x; `MockTimers` stable                                                                 | 2026-09-24 | `test-layers.md` TL1, TL8                                              |
| [Node.js — Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)        | current at check                                                                          | 2026-09-24 | `promise-discipline.md` PD7, PD8                                       |
| [Node.js Docker best practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)                 | `main` at check                                                                           | 2026-09-24 | `lifecycle.md` LC8 — `CMD ["node", …]` so npm does not swallow SIGTERM |
| [undici — Client](https://undici.nodejs.org/#/docs/api/Client)                                                         | undici 8.11.2; `headersTimeout` and `bodyTimeout` default `300e3`                         | 2026-09-24 | `lifecycle.md` LC1 — what global `fetch` waits for without a signal    |
| [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)                      | 6.0.3 latest 6.x; `strict` on by default                                                  | 2026-09-24 | `errors-and-logs.md` EL1, EL6; the lint pin in SKILL.md §6             |
| [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)                      | 7.0.2 is npm `latest`                                                                     | 2026-09-24 | Why SKILL.md §6 separates the build compiler from the lint compiler    |
| [TSConfig reference — useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables) | TypeScript 6.0                                                                            | 2026-09-24 | `errors-and-logs.md` EL6                                               |
| [ECMAScript 2022 — Error cause](https://tc39.es/ecma262/2022/)                                                         | ES2022                                                                                    | 2026-09-24 | `errors-and-logs.md` EL1                                               |

## Libraries and frameworks

| Reference                                                                                                   | Version                                                     | Checked    | Used for                                                                          |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| [Zod — API](https://zod.dev/api)                                                                            | zod 4.6.5; `z.object` strips unknown keys by default        | 2026-09-24 | `boundary-validation.md` BV1–BV5, BV8; `test-layers.md` TL2                       |
| [typescript-eslint rules](https://typescript-eslint.io/rules/no-floating-promises/)                         | 8.70.1; peer `typescript >=4.8.4 <6.1.0`                    | 2026-09-24 | PD1–PD3, PD9, BV3, EL3, EL5, `lifecycle.md` LC9                                   |
| [ESLint — no-console](https://eslint.org/docs/latest/rules/no-console)                                      | ESLint 10.11.0                                              | 2026-09-24 | `errors-and-logs.md` EL10                                                         |
| [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html)                                | express 5.2.1                                               | 2026-09-24 | `promise-discipline.md` PD6                                                       |
| [Fastify — Testing](https://fastify.dev/docs/latest/Guides/Testing/)                                        | fastify 5.12.5                                              | 2026-09-24 | `test-layers.md` TL4 — `inject`                                                   |
| [Hono — Testing](https://hono.dev/docs/guides/testing)                                                      | hono 4.13.9                                                 | 2026-09-24 | `test-layers.md` TL4 — `app.request`                                              |
| NestJS                                                                                                      | @nestjs/core 12.1.0, read from the npm registry             | 2026-09-24 | In `stack` only; exception filters are where EL2's mapper lives in a Nest service |
| [node-postgres — Pool](https://node-postgres.com/apis/pool)                                                 | pg 8.23.0; `max` 10, `connectionTimeoutMillis` 0 by default | 2026-09-24 | `pool-and-idempotency.md` PI1–PI5, PI10                                           |
| [node-postgres — Transactions](https://node-postgres.com/features/transactions)                             | pg 8.23.0                                                   | 2026-09-24 | PI1, `test-layers.md` TL6                                                         |
| [node-postgres — Queries](https://node-postgres.com/features/queries)                                       | pg 8.23.0                                                   | 2026-09-24 | PI7                                                                               |
| [PostgreSQL 18 — Client connection defaults](https://www.postgresql.org/docs/18/runtime-config-client.html) | 18.6                                                        | 2026-09-24 | PI6 — `statement_timeout`                                                         |
| [pino — Redaction](https://getpino.io/#/docs/redaction)                                                     | pino 10.3.1                                                 | 2026-09-24 | `errors-and-logs.md` EL7                                                          |
| [Vitest — Timers](https://vitest.dev/guide/mocking/timers)                                                  | vitest 5.0.1                                                | 2026-09-24 | TL1, TL8                                                                          |
| [Testcontainers for Node.js — PostgreSQL](https://node.testcontainers.org/modules/postgresql/)              | @testcontainers/postgresql 12.1.0                           | 2026-09-24 | TL5                                                                               |

## HTTP and operations

| Reference                                                                                                               | Version                                 | Checked    | Used for                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)                                                     | June 2022, Internet Standard            | 2026-09-24 | §9.2.2 idempotent methods (PI8, LC3); §15.5 client error status codes (BV9)                                 |
| [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)                                      | July 2023, obsoletes RFC 7807           | 2026-09-24 | §3 members (EL2, BV9, TL3); §5 security considerations (EL4)                                                |
| [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/07/) | draft-07, 2025-10-15, **expired**       | 2026-09-24 | PI8, PI9, TL7. Cited as the clearest description of the convention, not as a standard — it never became one |
| [W3C Trace Context](https://www.w3.org/TR/trace-context/)                                                               | Level 1, W3C Recommendation             | 2026-09-24 | EL8 — `traceparent` as the correlation id                                                                   |
| [Kubernetes — Container probes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)                      | Kubernetes 1.37 (stable release 1.37.1) | 2026-09-24 | `lifecycle.md` LC7                                                                                          |

## Tracked in `docs/review-standards.md`

These are cited by name and version in the checklists, and not restated here.
Two copies of a standard is one copy that is wrong.

| Standard                  | Version in `docs/review-standards.md` | Rows that cite it                           |
| ------------------------- | ------------------------------------- | ------------------------------------------- |
| OWASP ASVS                | 5.0.0 — V1, V2, V16                   | BV1, BV2, BV4, BV5, BV8, EL4, EL7, PI7, TL2 |
| OWASP API Security Top 10 | 2023 — API3, API4                     | BV2, BV5                                    |
| The Twelve-Factor App     | III Config, IX Disposability          | BV6, BV7, LC5, LC6, TL9                     |

The security review itself belongs to [`security-reviewer`](../security-reviewer/SKILL.md).
