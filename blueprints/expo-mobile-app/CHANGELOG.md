# Changelog — expo-mobile-app

## 1.0.0 — 2026-09-25

First version, and the catalog's first `mobile` blueprint.

Expo SDK 57 (React Native 0.86.3, React 19.2.3, TypeScript 6.0) on Expo
Router, scaffolded with `create-expo` 5.0.2 from `expo-template-default`
57.0.27, with typed routes, a screen tested through the router, ESLint on
`eslint-config-expo` 57.0.2, a dependency check against the SDK's own table,
and a static web export plus Hermes bundles for Android and iOS as the build
proof.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where `react-native` (9.7M a week), `expo` (6.8M) and `expo-router` (4.5M) made
this the strongest mobile candidate. Its recipe runs in CI like every other and
nobody has run the app on a device, so it is `tier: community` and says so
wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)). Every version
was read from the npm registry on 2026-09-25; the recipe ran end to end with
`forgeprint test-setup` on Node 22.23.

Five things came out of building it rather than describing it.

**`create-expo-app` does not pin the scaffolder.** It is a shim depending on
`create-expo >=5.0.1`, so the recipe calls `create-expo` directly. Its
`--no-agents-md` flag is passed too: without it, the scaffolder writes its own
`AGENTS.md`, `CLAUDE.md` and `.claude/settings.json`.

**The template fails its own lint.** `use-color-scheme.web.ts` sets state
inside an effect, which the React hooks rules in `eslint-config-expo` 57
reject. The recipe replaces it with a `useSyncExternalStore` hydration check
that behaves the same.

**Testing Library 14 and Expo Router's harness do not work together.**
`renderRouter` calls `render` synchronously and 14 made it asynchronous, so
every query reported that nothing had been rendered. Pinned to 13.3.3 with the
matching `react-test-renderer` 19.2.3.

**TypeScript 6 no longer loads every `@types` package.** Jest's globals are
named in `tsconfig.json` under `types`, and the route types are generated with
`expo customize tsconfig.json`, the one command that writes them without a dev
server.

**Metro requires Node 22.13.** `requires_tools` says so rather than `node>=22`.

### Planned

- Testing Library 14 when Expo Router's test harness renders asynchronously.
- ESLint 10 when `eslint-config-expo` supports it.
- Nothing that needs an account or a device (EAS, store submission, a device
  test) will be added to the recipe; `overview.md` says what to do instead.
