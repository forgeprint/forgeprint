# Changelog — browser-extension

## 1.0.0 — 2026-09-25

First version.

A Manifest V3 extension for Chrome and Firefox built with WXT 0.21.4 on Vite
8.3.1 and TypeScript 7.0.2: a background service worker that is the only
writer of storage, a content script on one declared site, a popup built with
DOM calls, typed messages parsed by one function and accepted by sender, and
`scripts/check-manifest.mjs`, which fails when a built manifest asks for more
than `extension-policy.json` lists. Vitest 5.0.1 with WXT's fake browser and
happy-dom 20.14.5 runs 51 tests.

**Generated** from the catalog's 2026-09-24 research
([demand report](../../docs/research/2026-09-24-demand.md), decision D23 in the
[expansion plan](../../docs/research/2026-09-24-expansion-plan.md), which added
the `extension` project type and the `wxt` stack value): `wxt` 406.6k
downloads a week on npm, wxt-dev/wxt 10.5k stars. The recipe is CI-tested and
nobody has loaded the result into a browser and built on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

What running it rather than describing it decided:

- **Written file by file.** `wxt init` lists and downloads its templates from
  GitHub (`giget`, the GitHub contents API), not from the npm registry, so it
  cannot be a recipe step here.
- **No telemetry to switch off.** WXT 0.21.4's published code makes no network
  request outside `wxt init`, the opt-in `zip.downloadPackages` (which packs
  from the npm registry and is not set here) and two runtime helpers that fetch
  the extension's own files; there is no usage reporting to disable.
- **Firefox builds as Manifest V3 only with `--mv3`.** Without it WXT builds
  Manifest V2 for Firefox. The Firefox build runs the background from
  `background.scripts`, which the recipe asserts.
- **The CSP is written out.** WXT's default for Manifest V3 extension pages adds
  `'wasm-unsafe-eval'`; the policy uses Chrome's documented default,
  `script-src 'self'; object-src 'self';`, and the check holds both builds to
  it.
- **A dev build asks for more.** WXT's dev server adds `tabs`, `scripting` and
  a localhost host permission; the manifest check exists partly to catch a dev
  manifest shipped by mistake.
- **`npm install --ignore-scripts`.** No package in the tree has an install
  script, so nothing is lost, and `wxt prepare` runs explicitly before the
  type-check instead of from `postinstall`.
- **The fake browser delivers an empty sender** and only answers a listener
  that calls `sendResponse` and returns `true`. The background uses that
  pattern, which is also the one Chrome and Firefox both support, and the
  tests pass the sender explicitly.
- **Node 22.12.0 is the floor**: Vite 8 and Vitest 5 declare it, WXT declares
  22 or newer.
- **happy-dom, not jsdom**, for the popup test: jsdom 30 would raise the floor
  to 22.22.2 for one test file.
- **`vitest` is also pinned under `overrides`.** From Vitest 5.0.2's release on
  2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
  5.0.1: an optional peer chain through `@vitejs/devtools` accepts any `vitest`
  and npm resolved it to the newest. Nothing in that chain is installed.

What was run, and on what. `forgeprint test-setup browser-extension` passed all
35 steps on Windows with Git Bash and Node 22.12.0 (npm 11.0.0). The run on
Linux is the `setup-test` check on this pull request. Along the way: the
type-check, 51 tests, both production builds, the manifest check on both, the
check refusing a manifest widened with `tabs`, no `eval`/`new Function`/
`importScripts` and no source map in either build, and all three archives.

### Planned

- A browser test (Playwright or `web-ext` with a real Chromium and Firefox)
  that loads the unpacked build, once browsers can be fetched in a way the
  recipe rules accept.
- Icons, and an options page.
