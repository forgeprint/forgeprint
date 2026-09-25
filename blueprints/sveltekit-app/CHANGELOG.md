# Changelog — sveltekit-app

## 1.0.0 — 2026-09-25

First version.

A server-rendered SvelteKit 2.70 application on Svelte 5.57 in runes mode,
TypeScript 6 in strict mode, Tailwind 4.3, Vite 8.3 and adapter-node 5.5,
generated with `sv` 0.17.1 and then pinned exactly. One page with a server
`load` and a form action validated in `$lib/server`; a root layout that writes
the title, description and canonical link; a Content Security Policy with a
script nonce; a server that refuses to start without `ORIGIN`; and tests at
two levels: Vitest calling the validation, `load` and action directly, and
`node:test` starting `node build` and asserting on the HTML and headers it
sends.

**Generated** by a tool from the catalog's demand research
([2026-09-24](../../docs/research/2026-09-24-demand.md), phase 6 of the
[expansion plan](../../docs/research/2026-09-24-expansion-plan.md)). The recipe
runs in CI like every other, and nobody has built a real application on it, so
it is `tier: community`, CI-tested and not manually verified
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Decisions worth recording:

- **Vitest 5.0.1 instead of the 4.1 line `sv` generates.** On 2026-09-25 npm
  (10.9 and 11.0) could not resolve Vitest 4.1.x's optional peer set at all;
  4.0 and 5.0 resolve. 5.0.1 runs the generated configuration unchanged.
- **`vitest` is also pinned under `overrides`.** From Vitest 5.0.2's release on
  2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
  5.0.1 too: an optional peer chain through `@vitejs/devtools` accepts any
  `vitest` and npm resolved it to the newest, the same crash 4.1 hit. Nothing
  in that chain is installed.
- **`cookie` overridden to 0.7.2.** SvelteKit 2.70.3 depends on `cookie` 0.6,
  which `npm audit` reports as GHSA-pxg6-pf52-xh8x (low). With the override the
  audit is clean and every test passes.
- **Vitest's component mode is not set up.** It drives a browser that
  Playwright downloads from outside the npm registry. The page is checked
  instead by starting the built server and reading its HTML.
- **No `accessibility` claim**, although the form is labelled and the layout
  has a skip link: nothing here tests them in a browser.

Verified on 2026-09-25 with Node.js 22.23.3 (Windows, Git Bash) and in CI
(Linux, Node.js 22): `svelte-check` with no errors or warnings, `prettier` and
ESLint clean, 10 unit tests, the production build, and 8 built-server tests.
Every version was read from the npm registry the same day.

### Planned

- A sitemap generated from the route files, when there is more than one page.
