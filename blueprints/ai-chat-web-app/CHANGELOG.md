# Changelog — ai-chat-web-app

## 1.0.0 — 2026-09-25

First version. A Next.js 16 chat on the AI SDK 7 (`ai` 7.0.114,
`@ai-sdk/react` 4.0.117, `@ai-sdk/anthropic` 4.0.63), with one streaming
route, input bounded before the model is called, the key and the system
prompt kept on the server, and tests against the SDK's mock model.

**Generated** by a tool from
[the 2026-09-24 expansion plan](../../docs/research/2026-09-24-expansion-plan.md),
where the demand was `ai` at 17.9M downloads a week and `@anthropic-ai/sdk` at
27.7M. The recipe is CI-tested; nobody has run it against a real model or
built an application on it, so it is `tier: community` and says so wherever it
is served ([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Every version was read from the npm registry on 2026-09-25, and the two
GitHub Actions in the generated workflow are pinned to the commits their
release tags pointed at that day.

Things that came out of running it rather than describing it:

**`jsdom` 30 needs Node 22.22**, above the floor this recipe wants, so the UI
tests run on `happy-dom`. Vitest 5 itself needs 22.12, which is the floor in
`requires_tools`.

**`next build` rewrites `tsconfig.json`** to the automatic JSX runtime and
four compiler flags. The recipe writes it in that form, so the build leaves it
alone and vitest compiles the JSX the same way.

**happy-dom applies a textarea's `maxLength` when a form is submitted by a
click.** The over-long-message UI test dispatches the submit event directly,
so the route — the control under test — is what refuses it.

**`happy-dom` replaces `console`**, so nothing a component logs in a UI test
reaches the terminal. Worth knowing before debugging one.

**`vitest` is also pinned under `overrides`.** From Vitest 5.0.2's release on
2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
5.0.1: an optional peer chain through `@vitejs/devtools` accepts any `vitest`
and npm resolved it to the newest. Nothing in that chain is installed.

### Planned

- Rate limiting and authentication are left out on purpose; see "What it is
  NOT for" in `overview.md`. An option for either would change the route's
  shape, so each is a separate decision rather than a toggle.
