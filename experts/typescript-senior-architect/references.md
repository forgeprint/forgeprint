# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. Versions were taken from the npm registry and the vendors' own pages
on the date shown. **Re-check every 90 days**, and whenever TypeScript 7.1
ships its new compiler API — that release changes `compiler-strictness.md`
TC11 and SKILL.md §1 decision 2.

> **Next re-check due: 2026-12-23.**

## Language and compiler

| Reference                                                                                         | Version                                           | Checked    | Used for                                                                                          |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) | 7.0, published 2026-07-08; npm `typescript` 7.0.2 | 2026-09-24 | SKILL.md §1 decision 2 — no compiler API in 7.0, the side-by-side install; TC5, TC7, TC11, WS5    |
| [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) | 6.0, published 2026-03-23; npm 6.0.3              | 2026-09-24 | `strict` on by default; `baseUrl` and `moduleResolution: node` deprecated — TC1, TC5, SKILL.md §6 |
| [TSConfig reference](https://www.typescriptlang.org/tsconfig/)                                    | current at check (TypeScript 6.0 / 7.0)           | 2026-09-24 | TC1–TC4, TC7, MF2, MF3, BV8, WS5, WS7 — each flag's meaning and the members of the strict family  |
| [Project references](https://www.typescriptlang.org/docs/handbook/project-references.html)        | current at check                                  | 2026-09-24 | WS5, WS6 — `composite`, `tsc --build`, and references forming an acyclic graph                    |

## Runtime and packages

| Reference                                                                                                                           | Version                                             | Checked    | Used for                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| [Node.js release schedule](https://nodejs.org/en/about/previous-releases)                                                           | 24.x Active LTS (24.21.0); 26.x LTS from 2026-10-28 | 2026-09-24 | The runtime this expert targets, and when that moves                                                 |
| [Node.js 24 — Modules: TypeScript](https://nodejs.org/docs/latest-v24.x/api/typescript.html)                                        | v24; type stripping stable since 24.12.0            | 2026-09-24 | SKILL.md §1 decision 1 and §6 (`enum`); TC6, MF4                                                     |
| [Node.js 24 — Modules: CommonJS, loading ES modules with `require`](https://nodejs.org/docs/latest-v24.x/api/modules.html)          | v24; `require(esm)` not experimental since 24.15.0  | 2026-09-24 | SKILL.md §4; MF8 — `ERR_REQUIRE_ASYNC_MODULE` on top-level `await`                                   |
| [Node.js 24 — Packages](https://nodejs.org/docs/latest-v24.x/api/packages.html)                                                     | v24                                                 | 2026-09-24 | MG6, MG7, MF1, MF5, MF7, WS1 — `"type"`, `"exports"`, `"imports"`, `"packageManager"`, dual packages |
| [Node.js 24 — CLI: `--unhandled-rejections`](https://nodejs.org/docs/latest-v24.x/api/cli.html)                                     | v24; default `throw` since v15                      | 2026-09-24 | PD4, SKILL.md §6                                                                                     |
| [Node.js 24 — Globals: `AbortController`, `AbortSignal.timeout`](https://nodejs.org/docs/latest-v24.x/api/globals.html)             | v24                                                 | 2026-09-24 | PD5, PD6                                                                                             |
| [Node.js — Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)                     | current at check                                    | 2026-09-24 | PD7                                                                                                  |
| [MDN — `Promise.allSettled()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) | current at check                                    | 2026-09-24 | PD8                                                                                                  |
| [pnpm — Workspace](https://pnpm.io/workspaces)                                                                                      | pnpm 12.6.0                                         | 2026-09-24 | WS3 — the `workspace:` protocol                                                                      |
| [pnpm — `pnpm install`](https://pnpm.io/cli/install)                                                                                | pnpm 12.6.0                                         | 2026-09-24 | WS2 — `--frozen-lockfile`                                                                            |
| [pnpm — `pnpm why`](https://pnpm.io/cli/why)                                                                                        | pnpm 12.6.0                                         | 2026-09-24 | WS4, BV1, the dependency audit in SKILL.md §7                                                        |

## Tools that enforce the rules

| Reference                                                                                                               | Version                            | Checked    | Used for                                                                           |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| [dependency-cruiser — rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md) | 18.4.0, released 2026-09-20        | 2026-09-24 | SKILL.md §3; MG1–MG5, MG9 — `forbidden`, `circular`, `dependencyTypes`, `--config` |
| [typescript-eslint — shared configs](https://typescript-eslint.io/users/configs)                                        | 8.70.1; peer `typescript` `<6.1.0` | 2026-09-24 | TC8, TC11 — `strict-type-checked`, and why the linter needs TypeScript 6           |
| [typescript-eslint — `ban-ts-comment`](https://typescript-eslint.io/rules/ban-ts-comment)                               | 8.70.1                             | 2026-09-24 | TC9                                                                                |
| [typescript-eslint — `no-explicit-any`](https://typescript-eslint.io/rules/no-explicit-any)                             | 8.70.1                             | 2026-09-24 | TC10                                                                               |
| [typescript-eslint — `no-unsafe-assignment`](https://typescript-eslint.io/rules/no-unsafe-assignment)                   | 8.70.1                             | 2026-09-24 | BV4 — the `no-unsafe-*` family                                                     |
| [typescript-eslint — `no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises)                   | 8.70.1                             | 2026-09-24 | PD1, PD3                                                                           |
| [typescript-eslint — `no-misused-promises`](https://typescript-eslint.io/rules/no-misused-promises)                     | 8.70.1                             | 2026-09-24 | PD2                                                                                |
| [publint](https://publint.dev/)                                                                                         | 0.3.24                             | 2026-09-24 | MF6                                                                                |
| [Are the Types Wrong? CLI](https://github.com/arethetypeswrong/arethetypeswrong.github.io)                              | `@arethetypeswrong/cli` 0.18.5     | 2026-09-24 | MF6                                                                                |

## Boundary validation

| Reference                                        | Version                    | Checked    | Used for                                                                  |
| ------------------------------------------------ | -------------------------- | ---------- | ------------------------------------------------------------------------- |
| [Zod](https://zod.dev/)                          | 4.6.5, released 2026-09-13 | 2026-09-24 | SKILL.md §5; BV1–BV3, BV5, BV7 — `parse`, `safeParse`, `z.infer`, `z.url` |
| [Zod — JSON Schema](https://zod.dev/json-schema) | 4.6.5                      | 2026-09-24 | BV9 — generating the contract from the schema                             |
| [Valibot](https://valibot.dev/)                  | 1.5.0                      | 2026-09-24 | BV1, BV3 — the alternative, and `InferOutput`                             |

## Frameworks

| Reference                                                                                                          | Version                             | Checked    | Used for                                      |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ---------- | --------------------------------------------- |
| [Next.js — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) | docs for 16.3.6, updated 2026-08-25 | 2026-09-24 | MG8 — `server-only` and environment poisoning |
| [NestJS — Modules](https://docs.nestjs.com/modules)                                                                | `@nestjs/core` 12.1.0               | 2026-09-24 | MG9 — a `@Module` is a DI scope               |

## Architecture

| Reference                                                                                                                  | Version          | Checked    | Used for                                                                               |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------- |
| [Architecture decision records — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011   | 2026-09-24 | SKILL.md §1 — Context, Decision, Consequences; Alternatives is this catalog's addition |
| [C4 model](https://c4model.com/)                                                                                           | current at check | 2026-09-24 | SKILL.md §7; WS8 — Context and Container diagrams only                                 |

## Deferred to elsewhere

This expert does **not** restate application security. Two copies of a standard
is one copy that is wrong.

- Authentication, authorization, input handling beyond shape, secrets and
  dependency vulnerabilities: [`docs/review-standards.md`](../../docs/review-standards.md)
  (OWASP ASVS, OWASP Top 10, API Security Top 10) and
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Supply chain and CI hardening: the NIST SSDF and SLSA rows in
  `docs/review-standards.md`, and [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
