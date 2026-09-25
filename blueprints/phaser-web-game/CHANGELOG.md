# Changelog — phaser-web-game

## 1.0.0 — 2026-09-25

First version, and the catalog's first `game` blueprint.

A 2D browser game on Phaser 4.2.1 and Vite 8.3.1 in strict TypeScript 7.0.2:
boot, preload and play scenes around a rules folder that never imports Phaser,
Vitest 5.0.1 tests for the rules and for the whole game booted under Phaser's
HEADLESS renderer in happy-dom 20.14.5, a size budget that fails the build, and
a CI workflow with actions pinned by SHA.

**Generated** by a tool from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where `game` was the one project type with no blueprint and `phaser` drew
276.5k downloads a week on npm. CI runs its recipe; nobody has verified it by
hand or shipped a game on it, so it is `tier: community`
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Every version was read from the npm registry on 2026-09-25. Phaser 4.2.1 was
chosen over Phaser 3 because it is the registry's `latest`, and a new project
should not start on the previous major.

Things that came out of running it rather than describing it:

- Under HEADLESS there is no renderer, so `Graphics.generateTexture` and
  `CanvasTexture.refresh` both throw. The placeholder textures are drawn on a
  plain canvas and registered with `textures.addCanvas`, which works under
  every renderer.
- Phaser probes a 2D canvas context while it loads, and neither happy-dom nor
  jsdom has one. The test supplies a context that draws nothing, instead of
  the `canvas` package, whose native binaries download from outside the npm
  registry.
- `Game.destroy()` throws under HEADLESS in 4.2.1 (the texture manager's `stamp`
  is still undefined when it is destroyed). The test stops the loop and steps
  frames itself instead of destroying the game.
- happy-dom was chosen over jsdom because jsdom 30 needs Node 22.22.2, while
  Vite 8 and Vitest 5 need 22.12.0.
- The research suggested a Playwright smoke test. It is left out: Playwright
  downloads browsers from outside the npm registry. `overview.md` lists what
  that leaves unproven.
- `vitest` is also pinned under `overrides`. From Vitest 5.0.2's release on
  2026-09-25, npm 10 and 11 crashed with "reading 'edgesOut'" on the pinned
  5.0.1: an optional peer chain through `@vitejs/devtools` accepts any `vitest`
  and npm resolved it to the newest. Nothing in that chain is installed.

The built game was also played once in a Chromium-based browser while it was
written — it rendered, moved, ended and restarted — which is a single
observation, not a verification.

### Planned

- Touch input, for phones. Not built, and not claimed.
- Sound, once there is a way to say something useful about it in a test.
