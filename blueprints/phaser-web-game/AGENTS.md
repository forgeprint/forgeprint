# Phaser Web Game — agent context

A browser game on Phaser 4, built by Vite, in strict TypeScript. Read this
before changing a rule, adding a scene or adding art.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand or shipped a
> game on it. Treat it as a starting point that works, not as a design
> somebody has shipped.

## The shape

```
src/rules/          the game: state, movement, scoring, win and lose. No Phaser
src/scenes/boot.ts      draws the placeholder textures in code
src/scenes/preload.ts   loads the art that lives in files, with a progress bar
src/scenes/play.ts      reads keys, calls tick(), draws what comes back
src/scenes/keys.ts      scene and texture keys, spelled once
src/config.ts       the one game config, shared by the page and the headless test
src/main.ts         the only line that starts a game in a page
src/game.test.ts    the whole game, booted HEADLESS and stepped frame by frame
scripts/check-budget.mjs  the size budget `npm run build` enforces
```

The split is the point. `src/rules/` is a pure function from
`(state, input, milliseconds, random)` to the next state. The scenes are a thin
shell around it: they translate keys into an `Input`, call `tick`, and copy the
result onto sprites. A rule is tested with a function call in plain Node; a
scene can only be tested by booting Phaser.

## Rules that are not style preferences

**`src/rules/` imports nothing from outside `src/rules/`.** Not Phaser, not a
scene, not a DOM helper. `src/rules/boundary.test.ts` reads every module in the
folder and fails on any import that does not start with `./`. The failure mode
it prevents: a rule that needs `Phaser.Math` or a sprite to run can only be
tested by booting the engine, and then it stops being tested.

**No `Math.random`, `Date.now` or `performance.now` in the rules.** Randomness
arrives as a `Random` argument and time as `dtMs`. The same test enforces it.
With both injected, a seed and a list of inputs replay a game exactly, which is
how a bug report becomes a failing test.

**Every rule lives in `tick`, not in `update`.** If `PlayScene.update` grows an
`if` about the game (not about input or drawing), it is a rule in the wrong
place and it has no test.

**`tick` clamps the frame time to `MAX_STEP_MS`.** A tab in the background or
a debugger pause delivers one very long frame; without the clamp the player
moves through the hazard without ever overlapping it. Do not remove it to
"fix" a slow-motion complaint — fix the frame rate.

**Positions in the rules are centres.** That is a Phaser sprite's default
origin, which is why the scene copies `x` and `y` straight across. If you
change a sprite's origin, convert in the scene, not in the rules.

**Sizes live in `SIZES` in `src/rules/game.ts`.** The textures are drawn at
those sizes and the collisions use them. Art at a different size than its
hitbox is a bug players find before you do.

**Keys are constants in `src/scenes/keys.ts`.** A mistyped string key in
`this.add.image(0, 0, 'coni')` does not throw: Phaser draws its
missing-texture square. The headless test checks every key in `TEXTURES`
exists after preload.

## Art and loading

- Placeholder art is drawn in `BootScene` on a plain canvas and registered with
  `textures.addCanvas`. Not `Graphics.generateTexture`, and not
  `textures.createCanvas(...).refresh()`: both need a renderer, and under the
  HEADLESS renderer there is none, so the test would throw.
- Art in files goes in `src/assets/` and is loaded in `PreloadScene.preload`.
  Import it with `?inline` (`import url from '../assets/x.png?inline'`): Vite
  hands over a data URL, the image is compiled into the script, and the
  headless test loads it the same way a browser does.
- **The headless test cannot load art by URL.** It has no server. When real art
  is too large to inline sensibly, import it without `?inline`, and change the
  test to register a stand-in texture for that key instead — and say so in the
  test, because from then on the test no longer proves that file loads.
- `PreloadScene` refuses to start the game when a file failed to load and
  names it on screen. Keep that: the alternative is a missing-texture square
  that looks like a rendering bug.

## The headless test, and what it does not prove

`src/game.test.ts` boots `gameConfig()` with `type: Phaser.HEADLESS` under
happy-dom, stops the game loop, and steps frames itself with
`game.headlessStep`. Keyboard input is real `KeyboardEvent`s on `window`.

`src/test/canvas-2d.ts` gives the test DOM a 2D context that draws nothing,
because Phaser probes one while it starts. That is also the line between what
is and is not tested: scenes, loading, input and rules run for real; **no
pixel is drawn or checked**, audio is off, and the frame rate is whatever the
test says it is. Rendering, input feel, audio and performance on a real device
are checked by playing it.

`Game.destroy()` throws under HEADLESS in Phaser 4.2.1, so the test does not
call it; the environment is discarded with the file.

## Commands

```bash
npm run dev         # development server with reload
npm run typecheck   # tsc, strict, no emit
npm test            # vitest: rules, boundary, headless game
npm run build       # vite build, then the size budget; fails when over
npm run preview     # serve dist/ locally
```

## The size budget

`scripts/check-budget.mjs` fails the build when the gzipped scripts exceed
400 kB or all files together exceed 2.5 MB, and when a source map is in
`dist/`. Phaser is about 360 kB of the script budget on its own. Raising a
number is allowed; do it in the same change that needs it, and say why in the
commit.

## When you are asked to add a rule

1. Add the state it needs to `GameState` and set it in `createGame`.
2. Change `tick` — in the order the existing comment describes, or say why not.
3. Write the test in `src/rules/game.test.ts` first, with a hand-built state
   rather than by playing frames until the situation happens.
4. Draw the result in `PlayScene.draw`. Nothing else in the scene changes.

## When you are asked to add a scene

1. Add its key to `SCENES`, the class to `src/scenes/`, and the class to the
   `scene` list in `src/config.ts` — the headless test boots that list.
2. If it holds a rule, the rule goes in `src/rules/` instead.
3. Extend `src/game.test.ts` to reach it: a scene no test starts is a scene
   that can fail to start without anybody noticing.
