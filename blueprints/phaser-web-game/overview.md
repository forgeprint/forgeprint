# Phaser Web Game

A 2D browser game in strict TypeScript on Phaser 4, built by Vite into static
files. The game's rules are plain TypeScript with ordinary unit tests; the
whole game also boots under Phaser's HEADLESS renderer in Vitest, so the
scenes, the loader and the keyboard wiring are tested without a browser.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has shipped a game on it, which is
what `tier: official` means in this catalog and why this is `community`.

## What you get

- **Phaser 4.2.1**, the `latest` release on npm when this was written (4.0.0
  shipped on 2026-04-10; Phaser 3 is the previous major, and its examples do
  not all carry over), **Vite 8.3.1**, **TypeScript 7.0.2** strict,
  **Vitest 5.0.1** with **happy-dom 20.14.5**. All pinned exactly.
- A small, complete game to replace: move with the arrow keys or WASD, collect
  ten coins before a 30-second clock runs out, avoid a bouncing hazard, Space
  to play again.
- Three scenes: **boot** draws placeholder textures in code, **preload** loads
  art from files with a progress bar and refuses to start if a file failed,
  **play** reads input and draws.
- **Rules with no Phaser in them.** `src/rules/` holds state, movement,
  collisions, scoring, win and lose as pure functions. Randomness is a seeded
  generator passed in, and time is a number passed in, so a game replays
  exactly from a seed and a list of inputs.
- **A test that enforces the boundary.** It reads every module in `src/rules/`
  and fails on any import from outside the folder, and on `Math.random`,
  `Date.now` or `performance.now`.
- **A headless test of the whole game**: boots the real config and scene list,
  checks every texture exists after preload, holds an arrow key and watches the
  player move, runs the clock out, and presses Space to start again.
- **A size budget that fails the build**: 400 kB of gzipped script (Phaser is
  about 360 kB of that) and 2.5 MB of files in total, and no source maps.
- A CI workflow with actions pinned by commit SHA, read-only permissions, and
  `npm ci` from the committed lock file.
- One committed original asset: a 142-byte coin PNG, inlined into the bundle.

## Options

None. Phaser's renderer choice (`AUTO`: WebGL with a Canvas fallback) is a
line in `src/config.ts`, not a blueprint option.

## What CI can prove, and what it cannot

CI proves the rules (unit tests), the boundary (the import test), that the
scenes hand over in order with every texture present, that keyboard events
reach the rules, that the clock runs and the game ends and restarts, that the
production build succeeds under budget, and that the coin is compiled into the
script.

CI **cannot** prove any of these, and this blueprint does not pretend to:

- **Rendering.** The HEADLESS renderer draws nothing, and the test DOM's 2D
  canvas is a stub that answers every call with nothing. A sprite drawn in the
  wrong colour, off screen or behind another passes every test.
- **Input feel.** Latency, key repeat, focus (the page has to have it for keys
  to arrive), touch and gamepads. Touch is not implemented at all.
- **Audio.** Tests run with `noAudio`, and the game has no sound.
- **Performance on real devices.** The budget bounds download size, not frame
  rate. A game that holds 60 fps on a laptop can stutter on a mid-range phone.

The research suggested a Playwright smoke test in a real browser. It is not
here: Playwright downloads its browsers from outside the npm registry, which
this catalog's recipes may not do. The headless test covers what can be
covered without one; the list above is what is left.

## What it fits

- A 2D game for the browser: arcade, puzzle, platformer, a game-jam entry.
- Somebody who knows TypeScript and wants the game logic testable from day
  one, rather than living in scene callbacks.
- A game that ships as static files to any host, including a subfolder.

## What it is NOT for

- **3D.** Phaser is a 2D framework. For 3D in the browser, three.js or an
  engine with an editor.
- **A game that needs an editor, a physics-heavy world, or console and
  desktop exports.** Pick **Godot** — the catalog plans a `godot-game`
  blueprint for exactly this; until it lands, Godot's own project templates.
  Godot gives you a scene editor, an animation editor and native exports,
  which a code-only Phaser project never will.
- **An accessible game in the WCAG sense.** The canvas is invisible to a
  screen reader, and nothing here checks contrast, offers key remapping or
  slows the clock. The game is playable from the keyboard alone, and that is
  the whole claim; `requirements` does not list `accessibility`.
- **Multiplayer.** There is no server here and nothing that talks to one.
- **Mobile app stores.** The build is a web page. Wrapping it for a store is a
  separate project with its own toolchain.
- **A web application that happens to have a canvas.** Use a web blueprint
  such as `nextjs-fullstack-app` and put the canvas in a component.

## Trade-offs made on your behalf

- **No physics engine.** Movement and collisions are a few lines of
  arithmetic in `src/rules/`, which is what keeps them testable without
  Phaser. Arcade Physics is already in the Phaser bundle; if the game needs
  bodies, gravity and tilemap collisions, turn it on and accept that those
  rules are then tested only through the headless test.
- **Art is inlined.** The coin is compiled into the script as a data URL so
  the headless test can load it without a server. That is right for tiny
  sprites and wrong for large sheets; `AGENTS.md` says what to change when the
  art grows.
- **happy-dom, not jsdom.** jsdom 30 needs Node 22.22.2; happy-dom runs on the
  same Node 22.12 floor as Vite and Vitest. Neither provides a real canvas.
- **The test stubs the 2D canvas** rather than installing `canvas`, whose
  native binaries download from outside the npm registry.
- **The test never calls `Game.destroy()`.** It throws under HEADLESS in
  Phaser 4.2.1. The test file's environment is discarded instead.
- **No linter.** TypeScript strict and the tests are the gate. Add ESLint when
  a second person joins.
- **Phaser is one 1.4 MB chunk.** Splitting it buys nothing on first load,
  because the game cannot start without it.

## Cost of adoption

About ten minutes. Needs Node.js 22.12.0 or newer and npm. Nothing is
downloaded from outside the npm registry, and no account is needed.
