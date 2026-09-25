# Module format

ESM or CommonJS is decided once per package, recorded, and then enforced by
the compiler. A package that is partly both is the source of the errors that
only appear after publishing.

| #   | Check                                                                            | How                                                        | Source                                           |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| MF1 | Every `package.json` states `"type"` explicitly                                  | `grep -L '"type"' packages/*/package.json`                 | Node.js 24 — Packages: determining module system |
| MF2 | An ESM package compiles with `module: nodenext` (or `preserve` behind a bundler) | `npx tsc --showConfig`                                     | TSConfig reference — `module`                    |
| MF3 | `verbatimModuleSyntax` is on, and type-only imports use `import type`            | `npx tsc --showConfig`; the compiler enforces the rest     | TSConfig reference — `verbatimModuleSyntax`      |
| MF4 | Relative imports in ESM carry their extension                                    | `tsc` under `nodenext` reports a missing one               | Node.js 24 — Modules: TypeScript                 |
| MF5 | No `.cjs` and `.mjs` mixed in one package without an ADR saying why              | `find src -name "*.cjs" -o -name "*.mts" -o -name "*.cts"` | Node.js 24 — Packages                            |
| MF6 | A library that ships both formats passes `publint` and `attw` before release     | `npx publint`; `npx @arethetypeswrong/cli --pack .`        | publint 0.3.24; arethetypeswrong 0.18.5          |
| MF7 | A dual package keeps its state in one format only                                | read the entry points for module-level mutable state       | Node.js 24 — Packages: dual package hazard       |
| MF8 | No top-level `await` in a module a CommonJS consumer will `require()`            | grep the entry graph for top-level `await`                 | Node.js 24 — Modules: `require(esm)`             |

## Why each one

**MF1** because the default is CommonJS. A package with no `"type"` is a
CommonJS package whether its author meant that or not, and `.js` output from
an ESM-intended build then fails at the first `import` statement.

**MF7** is the dual package hazard: the same package loaded once through
`import` and once through `require` gives two copies of every singleton, and a
cache, a registry or an `instanceof` check silently splits in two.

**MF8** because `require(esm)` — stable in Node 24 — only works for a
synchronous module graph. One top-level `await` deep in the graph turns every
CommonJS caller's `require` into `ERR_REQUIRE_ASYNC_MODULE`.
