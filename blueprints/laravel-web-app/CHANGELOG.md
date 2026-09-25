# Changelog — laravel-web-app

## 1.0.0 — 2026-09-25

First version, and the catalog's first PHP blueprint.

Laravel 13 on SQLite, with login and registration through Fortify, a dashboard
behind the `auth` middleware, Blade views styled with Tailwind 4 and built by
Vite 8, PHPUnit feature tests and a CI workflow.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where it ranked fourth: `laravel/framework` 15.4M installs a month on
Packagist, PHP 18.9% and Laravel 8.9% in the 2025 Stack Overflow survey, and no
PHP blueprint in the catalog. It was drafted by a tool, its recipe runs in CI,
and nobody has run it by hand, so it is `tier: community` and says so wherever
it is served ([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Pinned, and checked against Packagist and the npm registry on 2026-09-25:
`laravel/laravel` 13.10.1, `laravel/framework` 13.33.0, `laravel/fortify`
1.40.0; `vite` 8.3.1, `laravel-vite-plugin` 3.2.0, `tailwindcss` and
`@tailwindcss/vite` 4.3.3, `concurrently` 10.0.5, `@laravel/multiplex` 0.4.4.
CI actions pinned by commit: `actions/checkout` v7.0.1,
`shivammathur/setup-php` 2.37.2, `actions/setup-node` v7.0.0.

Verified: all 35 steps run by `forgeprint test-setup` on the catalog's CI
runner — Ubuntu 24.04 image 20260920.314, with its preinstalled PHP 8.3.6 and
Composer 2.10.3, and Node.js 22 — which is the PHP floor Laravel 13 and
`requires_tools` state. Not verified: PHP 8.4 and 8.5 (the generated CI
workflow names 8.5), macOS and Windows.

Decisions a reader might make differently, each explained in `overview.md`:

- **Fortify rather than a starter kit.** The official starter kits have no
  tagged release since February 2025 and are installed from their `main`
  branch, so a recipe cannot pin one.
- **Only registration is on among Fortify's features.** Fortify's defaults
  turn on password reset, email verification, two-factor authentication and
  passkeys, none of which this project has views for.
- **The skeleton's web font is removed** from the Vite configuration, because
  it is downloaded from a font service during the build.

### Planned

- Password reset, with its views, a mailer configured for local development
  and tests.
- A rate limit on registration.
- An example policy with the test where one user asks for another user's
  record and is refused.
