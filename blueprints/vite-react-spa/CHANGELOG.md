# Changelog — vite-react-spa

## 1.0.0 — 2026-09-25

First version.

A client-only single-page application: React 19.3 with React Router 8 in data
mode, built by Vite 8, styled with Tailwind 4, strict TypeScript 6. A typed API
client is the only code allowed to touch the network, and the API's base URL
is checked once — at startup and again at build time, by the same function.
Vitest 5 with Testing Library and jsdom runs the tests, including axe-core
against every route. ESLint 10 with `typescript-eslint` enforces the two
boundaries `AGENTS.md` describes.

**Generated** from the catalog's 2026-09-24 research
([demand report](../../docs/research/2026-09-24-demand.md), decision D14 in the
[expansion plan](../../docs/research/2026-09-24-expansion-plan.md)): `vite`
131.2M downloads a week, `@vitejs/plugin-react` 67.3M, React used by 44.7% of
respondents in the Stack Overflow 2025 survey. The recipe is CI-tested and
nobody has built an application on it by hand, so it is `tier: community` and
says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

The difference from `nextjs-fullstack-app` is the point of it: there is no
server, no database and no server rendering here. The build output is static
files, and the data comes from an API this project does not contain.

What running it rather than describing it decided:

- **TypeScript 6.0.3, not 7.** `typescript-eslint` 8.70.1 declares
  `typescript >=4.8.4 <6.1.0`, and type-aware linting is worth more here than
  the faster compiler. Moving to 7 waits for a `typescript-eslint` that
  supports it.
- **Node 22.22.2 is the floor**, not 22.12 as Vite alone would allow: jsdom 30
  declares `^22.22.2` and React Router 8 declares `>=22.22.0`.
- **ESLint 10, not 9.** ESLint 9 reached end of life on 2026-08-06.
  `eslint-plugin-jsx-a11y` is left out because it does not yet declare ESLint
  10 support; the axe-core tests cover the same ground at runtime.
- **axe-core directly, not a wrapper.** `vitest-axe` has not been released
  since 0.1.0; calling `axe.run` and asserting the violation list is shorter
  than the wrapper and has one fewer package to trust.
- **Colour contrast is switched off by name in the axe run.** jsdom does no
  layout, so axe reports contrast as "incomplete" and prints canvas warnings.
  Disabling it explicitly keeps a green run from reading as a contrast check.
- **The build refuses to run without `VITE_API_BASE_URL`** and writes nothing
  when it refuses; the recipe proves both.
- **`vitest` is also pinned under `overrides`.** From Vitest 5.0.2's release on
  2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
  5.0.1: an optional peer chain through `@vitejs/devtools` accepts any `vitest`
  and npm resolved it to the newest. Nothing in that chain is installed.

What was run, and on what. `forgeprint test-setup vite-react-spa` passed all
29 steps on Windows with Git Bash, but on Node 22.12.0 — below the declared
floor — with `requires_tools` lowered for that run only, so npm printed engine
warnings throughout. The run on a supported Node is the `setup-test` check on
this pull request (Node 22 on the runner). Along the way: `npm run typecheck`,
`npm run lint`, `npm test` (15 tests) and `npm run build` pass; the build
without the variable fails with the configuration message and leaves no
`dist/`; the output has no source maps and carries the API URL, the page
language and the Tailwind classes. Removing the focus call, or a link's
accessible name, was confirmed to fail the tests.

One thing only Windows showed: run from a directory reached through an 8.3
short path, Vitest loaded two copies of itself and the jest-dom matchers
registered on the wrong one ("Invalid Chai property"). The same files pass from
the long path. It is the machine's temporary directory, not the project, and
nothing in the recipe changes for it.

### Planned

- A browser test suite (Playwright with axe) for contrast, keyboard traps and
  reflow, once browsers can be fetched in a way the recipe rules accept.
- `eslint-plugin-jsx-a11y`, when it declares ESLint 10 support.
- TypeScript 7, when `typescript-eslint` supports it.
