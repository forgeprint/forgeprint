# Changelog — nuxt-app

## 1.0.0 — 2026-09-25

First version, and the catalog's first Vue blueprint.

Nuxt 4.5.2 on Vue 3.5 with Tailwind 4: pages whose SEO tags are asserted in
the HTML the production build sends, one Nitro route that checks its size and
validates its body with a zod schema shared with the form, and Vitest suites
for unit, component and end-to-end tests. ESLint through `@nuxt/eslint`, type
checking through `nuxt typecheck`, and a CI workflow with actions pinned by
SHA.

**Generated** from
[the 2026-09-24 expansion plan](../../docs/research/2026-09-24-expansion-plan.md),
where the demand was `vue` 12.0M a week, `nuxt` 1.6M and `@nuxt/kit` 5.4M on
npm, and Vue.js at 17.6% in the 2025 Stack Overflow survey. A tool drafted it,
its recipe runs in CI, and nobody has built an application on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)). Every version
was read from the npm registry on 2026-09-25.

Four things came out of building it rather than describing it.

**`nuxi init` and `npm create nuxt` fetch their templates from GitHub**, not
from the npm registry, and ask questions. The recipe writes the project file
by file instead, so every byte comes from the registry and nothing prompts.

**A hoisted h3 2 breaks the component tests.** `@nuxt/eslint` depends on a
tool that uses h3 2; npm hoists it, and `@nuxt/test-utils` decides from the
top-level copy that the project runs h3 2 and fails to load a package that was
never installed. Nitro 2 uses h3 1, so `h3@1.15.11` is a direct dependency.

**The built server treats port 0 as unset** and falls back to 3000. The
recipe asks the operating system for a free port first and passes it in.

**`fetch` replaces a `Host` header**, so a test that sends a forged one through
it passes without testing anything. The test that proves the canonical URL
ignores the request's host uses `node:http`.

TypeScript is 6.0.3 rather than 7: `vue-tsc` drives the TypeScript compiler
API, which the 7.0 package does not provide.

**`vitest` is also pinned under `overrides`.** From Vitest 5.0.2's release on
2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
5.0.1: an optional peer chain through `@vitejs/devtools` accepts any `vitest`
and npm resolved it to the newest. Nothing in that chain is installed.

Verified on Windows 11 with Git Bash and Node.js 22.23.3 by
`forgeprint test-setup nuxt-app`: install, lint, type check, 19 tests across
the three suites, production build, and the requests against the built server.

### Planned

- Nothing. A database, authentication or a deployment target would each be a
  different blueprint rather than an addition to this one.
