# Changelog — tauri-desktop-app

## 1.0.0 — 2026-09-25

First version.

A Tauri 2 desktop app with its logic in a plain Rust crate, one IPC command
behind a capability that grants nothing else, a strict CSP, and a Vite +
TypeScript frontend, with tests that pin the security surface.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where `tauri` showed 12.3M downloads in 90 days on crates.io and
tauri-apps/tauri 111.4k stars, and the catalog had no `desktop` blueprint.
Decision D23 of the
[expansion plan](../../docs/research/2026-09-24-expansion-plan.md) chose Tauri
over Electron for its smaller, CI-friendly toolchain. The recipe runs in CI
like every other; it was not run by hand, and nobody has shipped an app on
it, so it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Versions read from crates.io and the npm registry on 2026-09-25: tauri 2.11.6
(declared `rust-version` 1.77.2), tauri-build 2.6.3, serde_json 1.0.151;
@tauri-apps/api 2.11.1, @tauri-apps/cli 2.11.5, vite 8.3.1, vitest 5.0.1,
typescript 6.0.3, @types/node 22.20.4. Tauri 3 is in alpha and is not used.
Of the 419 packages in the resolved `Cargo.lock`, none declares a
`rust-version` above 1.85, which is the workspace's floor.

**The desktop shell is not compiled by the recipe.** The GitHub runner image
the catalog tests on (ubuntu-24.04, image 20260920.314) lists `pkg-config`,
`libssl-dev` and `xvfb` among its apt packages but not
`libwebkit2gtk-4.1-dev`, and installing it needs `sudo`, which a recipe may not
use. So the logic lives in a crate with no Tauri dependency, the shell is left
out of the workspace's `default-members`, and the generated CI builds the
shell in a pinned `rust:1.98.1-bookworm` container on Linux and on the
Windows and macOS runners.

Local evidence, not CI: on 2026-09-25 the recipe was run with
`forgeprint test-setup` in a Debian bookworm container with Rust 1.98.1 and
Node 22.23.2, and then the generated CI's `shell-linux` steps were replayed in
the same container after installing `libwebkit2gtk-4.1-dev`, `libxdo-dev` and
`libssl-dev`: `cargo clippy --locked -p app --all-targets -D warnings`,
`cargo test --locked -p app` (three tests through the real capability on the
mock runtime) and `npm run tauri -- build --no-bundle` all passed. The core
crate's tests also passed on Rust 1.85.0 (`rust:1.85.0-slim-bookworm`) against
the recipe's own `Cargo.lock`, which is what the generated `msrv` job runs.
Windows and macOS were not built; nothing was started with a display.

Checked on the way, by breaking a copy of the output: an unknown key in
`tauri.conf.json` makes `tauri info` exit 1 with the schema error, and adding
`core:default` to the capability fails `src/tauri-policy.test.ts`.

Decisions worth arguing about:

- **An app manifest listing `greet`**, so the capability is what allows it;
  without one, Tauri allows every app command from every window.
- **No `core:default`, no plugins**, both enforced by a test rather than by a
  comment.
- **`ipc.localhost` without a scheme in the CSP**, where Tauri's examples
  write `http://ipc.localhost`. CSP matches a scheme-less host against the
  page's own scheme, which is `http` for Tauri on Windows. Written this way
  because `forgeprint lint-setup` refuses a URL to a host that is not a
  package registry; not observed on Windows.
- **A Node script draws the placeholder icon** rather than an SVG. The
  `tauri icon` command accepts SVG, but the SVG namespace URL is refused by
  the same linter rule (see the open pull request on `xmlns` URLs).
- **Vanilla TypeScript** rather than React, to keep the frontend the smallest
  part of the app.
- **`vitest` is also pinned under `overrides`.** From Vitest 5.0.2's release on
  2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
  5.0.1: an optional peer chain through `@vitejs/devtools` accepts any `vitest`
  and npm resolved it to the newest. Nothing in that chain is installed.

### Planned

Nothing is promised. Signing, notarization, bundling in CI and the updater
would each need secrets and accounts, and are the obvious next versions if
somebody asks for them. An advisory check (`cargo audit`, `npm audit`) in the
generated CI is the first thing a real project should add.
