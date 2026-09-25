# Changelog — angular-app

## 1.0.0 — 2026-09-25

First version: Angular 22.2 as the framework now recommends starting it —
standalone components, zoneless change detection, signals for state — with a
lazily loaded feature behind a functional route guard, one HTTP interceptor,
Vitest in jsdom, angular-eslint, compile-time i18n, and a production build per
locale that fails over its budget.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where Angular was the fifteenth combination: `@angular/core` 5.0M downloads a
week, `@angular/cli` 4.4M (npm); Angular 18.2% in the Stack Overflow 2025
survey; 101.0k stars on angular/angular. Its recipe runs in CI like every other
and nobody has built an application on it, so it is `tier: community` and says
so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

**Verified:** the full recipe with `forgeprint test-setup` on Windows (Git
Bash) with Node.js 22.23.3 and npm 10.9.4, and on the Ubuntu runner through
the `setup-test` workflow. Every version was read from the npm registry on
2026-09-25: Angular 22.2.0 (CLI, build, localize), angular-eslint 22.5.0,
ESLint 10.11.0, typescript-eslint 8.70.1, TypeScript 6.0.3, Vitest 5.0.1,
jsdom 30.1.1, Tailwind 4.3.3. Actions in the generated workflow are pinned to
commit SHAs.

Decided while building it rather than describing it:

**`ng new` generates, then the recipe pins.** The generator writes `^` ranges,
which resolve to whatever is newest on the day somebody runs it. It runs with
`--skip-install`, and the next step replaces `package.json` with exact
versions before anything is installed.

**Node.js 22.22.3 is the floor, not 22.** Angular 22 declares
`^22.22.3 || ^24.15.0 || >=26.0.0`, and jsdom 30 declares 22.22.2. The manifest
says 22.22.3 so the tool check refuses an older Node before the CLI does.

**TypeScript 6.0, not 7.** Angular 22's compiler accepts `>=6.0 <6.1`.

**The budget is proved, not assumed.** The recipe shrinks the error budget to
1 kB, confirms the build refuses and writes nothing, and restores it. The real
budget is 350 kB for an initial bundle of about 271 kB.

**The i18n rule needed `index.html` excluded.** angular-eslint's i18n rule
flags the `<title>` in `src/index.html`, which is not an Angular template;
lint covers `src/app/**/*.html` and the inline templates instead.

**British English as the second locale**, so the repository stays in one
language while the build still proves a translation is compiled in:
`Organize` in the en-US bundle, `Organise` in the en-GB one.

**`vitest` is also pinned under `overrides`.** From Vitest 5.0.2's release on
2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
5.0.1: an optional peer chain through `@vitejs/devtools` accepts any `vitest`
and npm resolved it to the newest. Nothing in that chain is installed.

### Planned

- A browser-based test run (Vitest browser mode or Playwright) for what jsdom
  cannot see, once it can run without a download from outside the npm
  registry.
