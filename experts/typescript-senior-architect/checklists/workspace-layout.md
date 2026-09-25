# Workspace layout

A TypeScript monorepo is several packages, one lockfile and one compiler. The
package boundary is where most of the architecture lives, so it is checked the
way a dependency direction is checked elsewhere.

| #   | Check                                                                                          | How                                                                         | Source                                           |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| WS1 | The root `package.json` names the exact package manager in `"packageManager"`                  | read it; `pnpm@<x.y.z>`, not a range                                        | Node.js 24 — Packages: `"packageManager"`        |
| WS2 | CI installs with the lockfile frozen                                                           | the CI script runs `pnpm install --frozen-lockfile`                         | pnpm 12 — `pnpm install`                         |
| WS3 | Internal dependencies use the `workspace:` protocol                                            | `grep -rn '"@<scope>/' packages/*/package.json`; each is `workspace:`       | pnpm 12 — Workspace                              |
| WS4 | Exactly one `typescript` build and one `tsc` version in the tree                               | `pnpm why typescript`                                                       | pnpm 12 — `pnpm why`                             |
| WS5 | Packages that build each other use project references with `composite: true`                   | each `tsconfig.json` has `references`; `tsc --build` succeeds from the root | TSConfig reference — `composite`; TypeScript 7.0 |
| WS6 | The package graph is acyclic                                                                   | `tsc --build` refuses a reference cycle; dependency-cruiser `no-circular`   | TypeScript handbook — project references         |
| WS7 | A shared `tsconfig.base.json` holds the strictness flags; packages extend it and do not loosen | grep each package config for the flags in `compiler-strictness.md`          | TSConfig reference — `extends`                   |
| WS8 | Each deployable is one package, and the C4 container diagram shows deployables, not packages   | compare `packages/` with the container diagram                              | C4 model — container diagram                     |

## Why each one

**WS4** because two TypeScript versions in one workspace means two checkers:
the editor, the linter and the build can each report a different answer for
the same file, and the one that passes in CI is not the one the developer saw.
With TypeScript 7.0 the answer is deliberate — `tsc` 7 and `typescript` 6 for
the API — and WS4 is then two _named_ installs, never an accident.

**WS7** is where strictness is lost quietly. One package that overrides
`noUncheckedIndexedAccess` to `false` to get a migration through becomes the
package every new file is added to.
