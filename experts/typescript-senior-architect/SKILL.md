---
name: typescript-senior-architect
description: Hold a TypeScript codebase's architecture with the tools that can enforce it — a strict tsconfig, a dependency-cruiser rule set, one module format per package, a schema at every place untyped data enters, and no promise left floating. Use when starting a TypeScript service or monorepo, reviewing a TypeScript design, choosing ESM or CommonJS, or when an agent is about to write `as`, `any`, an `enum`, a deep import into another package or an un-awaited call.
license: CC-BY-4.0
---

# Working as a senior TypeScript architect

TypeScript's types are erased before the program runs. Everything a TypeScript
architecture promises — that the domain does not reach into the database
client, that a request body has the shape its type claims, that a rejected
promise is handled — is either enforced by a tool in CI or not enforced at all.

So this skill is mostly configuration and commands. Each rule names the tool
that holds it, and the check that proves the tool is switched on. Targets:
**TypeScript 7.0** (`tsc`, native) for builds, **TypeScript 6.0** for anything
that needs the compiler API, **Node.js 24 LTS**. Sources: [`references.md`](references.md).

---

## 1. Four decisions, written down before the first file

Record each as an ADR (`docs/decisions/NNNN-<slug>.md`: Context, Decision,
Consequences, Alternatives considered). These are the TypeScript choices that
touch every file once made:

1. **Module format and runtime.** ESM (`"type": "module"`, `module: nodenext`)
   or CommonJS, per package — and whether code runs through `tsc` output or
   Node's built-in type stripping, which forbids `enum`, namespaces with
   runtime code and parameter properties.
2. **The compiler split.** TypeScript 7.0 ships no compiler API, and
   typescript-eslint 8.70 accepts `typescript` `<6.1.0`. Decide how both
   coexist: the TypeScript team's answer is `@typescript/native` for `tsc`
   beside `typescript` aliased to `@typescript/typescript6`.
3. **The boundary schema library.** One — zod 4 or valibot 1 — used everywhere
   untyped data enters. Two libraries means two error shapes at the API.
4. **The package graph.** Which workspace packages exist, which may import
   which, and what each one exports.

When the user asks for code and one is open, name it, propose an answer in a
paragraph, proceed on it, and mark the ADR `Status: Proposed`.

---

## 2. The compiler is the first reviewer

`strict` is the default since TypeScript 6.0, so its presence proves little.
Check the flags `strict` does **not** include, and check the resolved config,
not the file:

```bash
npx tsc --showConfig -p tsconfig.json
```

The resolved output must contain `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax` and
`noFallthroughCasesInSwitch`, all `true`, and must not contain `baseUrl` or
`ignoreDeprecations`. Where Node's type stripping runs the code,
`erasableSyntaxOnly` is `true` too. Library packages add `isolatedDeclarations`.

The escape hatches get a lint rule each, from typescript-eslint's
`strict-type-checked` set: `no-explicit-any`, `ban-ts-comment` (a
`@ts-expect-error` must carry a description; `@ts-ignore` is refused),
`no-non-null-assertion`, `no-unsafe-*`. See
[`checklists/compiler-strictness.md`](checklists/compiler-strictness.md).

---

## 3. The module graph, enforced

A folder called `domain/` is a hope. A rule that fails the build is a boundary.
Pin dependency-cruiser and commit `.dependency-cruiser.cjs`:

```js
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/(infrastructure|http)/|^node_modules/' },
    },
    {
      name: 'no-dev-deps-in-src',
      severity: 'error',
      from: { path: '^src/' },
      to: { dependencyTypes: ['npm-dev'] },
    },
  ],
};
```

```bash
npx depcruise --config .dependency-cruiser.cjs src
```

It runs in `pnpm run check`, and a deliberate violation on a branch must turn
it red — a rule set nobody has seen fail has not been shown to work.

Between packages, the boundary is `package.json` `"exports"`: anything not
listed throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. No `paths` alias may point into
another package's `src/`. In NestJS, a `@Module` is a dependency-injection
scope, not an import boundary — the cruiser rule still applies. In Next.js,
every module holding a secret or a database call starts with
`import 'server-only'`. See [`checklists/module-graph.md`](checklists/module-graph.md).

---

## 4. One module format per package

- **An application is ESM.** `"type": "module"`, `module: nodenext`, relative
  imports with their extension. Node 24 can `require()` synchronous ESM, so a
  CommonJS consumer is not a reason to stay on CommonJS.
- **A library publishes one format unless a named consumer needs two.** A dual
  package can load twice and hold two copies of its state. If it must be dual,
  `publint` and `@arethetypeswrong/cli` pass before release.
- `verbatimModuleSyntax` keeps `import type` honest, so a type-only import
  never becomes a runtime `require`.

See [`checklists/module-format.md`](checklists/module-format.md).

---

## 5. Parse at the boundary, trust inside it

A TypeScript type on an HTTP body is a claim the compiler cannot check. Every
place untyped data enters — request bodies, query strings, `JSON.parse`,
`fetch` responses, queue messages, `process.env` — goes through the schema
library from §1, and the static type is **derived from the schema**
(`z.infer<typeof Order>`), never written beside it.

```ts
const Env = z.object({ DATABASE_URL: z.url(), PORT: z.coerce.number().int() });
export const env = Env.parse(process.env); // once, at startup, in one module
```

Refuse `JSON.parse(text) as Order`, `(await res.json()) as T` and
`process.env.X!` outside that one module. See
[`checklists/boundary-validation.md`](checklists/boundary-validation.md).

---

## 6. What you refuse

| Refuse                                                  | Because                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `any`, and `as unknown as T`                            | Turns the checker off for everything the value touches                          |
| `@ts-ignore`                                            | Silences an error without saying which, and stays after the error is gone       |
| `enum` and namespaces with runtime code                 | Not erasable: Node's type stripping refuses them; use `as const` objects        |
| A floating promise, or an `async` callback to `forEach` | A rejection nobody awaits crashes the process under Node's default `throw` mode |
| `baseUrl`                                               | Deprecated in 6.0, an error in 7.0                                              |
| A deep import into another package (`@org/x/src/...`)   | Bypasses `"exports"`, and the other package can no longer change its internals  |
| `export *` barrels spanning layers                      | The usual source of the cycles `no-circular` reports                            |
| A second copy of `typescript` in the workspace          | Two checkers disagreeing about the same file; `pnpm why typescript` shows one   |
| A type written by hand beside its schema                | The two drift, and the compiler checks neither against the other                |

See [`checklists/promise-discipline.md`](checklists/promise-discipline.md) for
the async half, and [`checklists/workspace-layout.md`](checklists/workspace-layout.md)
for the monorepo half.

---

## 7. What you produce

| Deliverable         | When                                           | What it looks like                                                       |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| ADR                 | Before any of the four decisions in §1         | `docs/decisions/NNNN-*.md`, Consequences and Alternatives filled         |
| Architecture review | On request, or before a package boundary moves | `severity · file:line · checklist row · fix`                             |
| C4 diagram          | Context and Container only                     | Mermaid in the repository; one container per deployable, not per package |
| API design review   | Before a contract has callers                  | The schema is the contract; the OpenAPI document is generated from it    |
| Dependency audit    | Before adding a runtime dependency             | What it pulls in (`pnpm why`), its module format, its types, its licence |

---

## 8. How to run a review

1. `npx tsc --showConfig` for every `tsconfig.json` that builds code; compare
   with §2.
2. `npx depcruise --config .dependency-cruiser.cjs src` — or record that no
   rule set exists, which is itself the first finding.
3. Each `package.json`: `"type"`, `"exports"`, `"packageManager"`, and every
   dependency pinned by the lockfile.
4. `grep -rnE "as unknown as|: any\b|@ts-ignore|JSON\.parse\(" src` — each hit
   is either inside a boundary module or a finding.
5. Report findings as `critical | high | medium | low | info` with file, line,
   the checklist row and the fix. A finding that cites no row is an opinion.

## 9. Where this expert stops

- **Security** — authentication, injection, secrets handling, dependency CVEs:
  [`security-reviewer`](../security-reviewer/SKILL.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
- **Tests** — what to test and how: [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- **CI, containers, deployment**: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **Bundle size and runtime speed**: [`performance-engineer`](../performance-engineer/SKILL.md).
- **Code style** — formatting and naming belong to Prettier and the team.
