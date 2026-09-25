# Compiler strictness

Since TypeScript 6.0, `strict` is on by default, so a `tsconfig.json` that says
`"strict": true` proves nothing. The flags worth checking are the ones outside
the strict family, and the lint rules that close the escape hatches the
compiler leaves open.

| #    | Check                                                                             | How                                                                          | Source                                            |
| ---- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| TC1  | The resolved config has `strict` on and no member of the strict family turned off | `npx tsc --showConfig`; grep for `"strict[A-Za-z]*": false`, `noImplicitAny` | TSConfig reference — `strict` (TypeScript 6.0)    |
| TC2  | `noUncheckedIndexedAccess` is `true`                                              | `npx tsc --showConfig`                                                       | TSConfig reference                                |
| TC3  | `exactOptionalPropertyTypes` is `true`                                            | `npx tsc --showConfig`                                                       | TSConfig reference                                |
| TC4  | `noImplicitOverride` and `noFallthroughCasesInSwitch` are `true`                  | `npx tsc --showConfig`                                                       | TSConfig reference                                |
| TC5  | No `baseUrl`, no `ignoreDeprecations`, no `moduleResolution: node`                | `npx tsc --showConfig`                                                       | Announcing TypeScript 6.0; TypeScript 7.0         |
| TC6  | Code run by Node's type stripping has `erasableSyntaxOnly: true`                  | find the start script; if it runs `.ts` directly, check the flag             | Node.js 24 — Modules: TypeScript                  |
| TC7  | A published library has `isolatedDeclarations: true`                              | the library's `tsconfig.json`                                                | TSConfig reference; Announcing TypeScript 7.0     |
| TC8  | typescript-eslint's `strict-type-checked` config is on                            | read `eslint.config.*`                                                       | typescript-eslint 8.70 — shared configs           |
| TC9  | `@ts-ignore` appears nowhere; each `@ts-expect-error` carries a reason            | `grep -rn "@ts-ignore\|@ts-expect-error" src`                                | typescript-eslint 8.70 — `ban-ts-comment`         |
| TC10 | No explicit `any`, no `as unknown as`                                             | `grep -rnE ": any\b\|as any\|as unknown as" src`                             | typescript-eslint 8.70 — `no-explicit-any`        |
| TC11 | `tsc` and the linter use TypeScript versions each one supports                    | `pnpm why typescript`; typescript-eslint 8.70 needs `<6.1.0`                 | typescript-eslint 8.70 peer range; TypeScript 7.0 |

## Why each one

**TC2** is the one that finds real bugs on the first run. Without it,
`items[0]` is typed as the element even when the array is empty, and every
"cannot read properties of undefined" that follows is one the compiler was
told not to report.

**TC11** is new with TypeScript 7.0. The native compiler ships without the
API that typescript-eslint and most codegen tools call, so a project that
upgrades `typescript` to 7 without the side-by-side install breaks its linter —
or worse, pins the linter to an older checker that disagrees with the build.
