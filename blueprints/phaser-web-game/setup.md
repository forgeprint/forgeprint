# Setup

Creates a browser game in TypeScript on Phaser 4, built by Vite: boot, preload
and play scenes, the game's rules in plain TypeScript modules that never import
Phaser, Vitest tests for the rules and for the whole game booted under Phaser's
HEADLESS renderer, a production build with a size budget that fails the build,
and a CI workflow. There is no server; the build output is static files.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.12.0 or newer, the floor Vitest 5 and Vite 8 declare, and
npm. Nothing is downloaded from outside the npm registry: no browser, no asset
site.

1. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Create `package.json` with:

   ```json
   {
     "name": "game",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "engines": {
       "node": ">=22.12.0"
     },
     "scripts": {
       "dev": "vite",
       "build": "vite build && node scripts/check-budget.mjs",
       "preview": "vite preview",
       "typecheck": "tsc",
       "test": "vitest run"
     },
     "overrides": {
       "vitest": "5.0.1"
     },
     "dependencies": {
       "phaser": "4.2.1"
     },
     "devDependencies": {
       "happy-dom": "20.14.5",
       "typescript": "7.0.2",
       "vite": "8.3.1",
       "vitest": "5.0.1"
     }
   }
   ```

   Verify: `test -f package.json`

2. Install the pinned dependencies. This writes `package-lock.json`, which is committed and is what CI installs from: `npm install --no-audit --no-fund`
   Verify: `npm ls phaser vite vitest happy-dom typescript --depth=0`

3. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "es2023",
       "lib": ["dom", "dom.iterable", "es2023"],
       "module": "esnext",
       "moduleResolution": "bundler",
       "verbatimModuleSyntax": true,
       "noEmit": true,
       "strict": true,
       "exactOptionalPropertyTypes": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "noFallthroughCasesInSwitch": true,
       "skipLibCheck": true,
       "types": ["vite/client"]
     },
     "include": ["src", "vite.config.ts"]
   }
   ```

   Verify: `test -f tsconfig.json`

4. Create `vite.config.ts` with:

   ```typescript
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     // Relative asset URLs, so dist/ works from any path a static host puts it
     // under, including a subfolder.
     base: './',
     build: {
       // Source maps publish the original source to anybody who opens the
       // developer tools. Turn them on deliberately.
       sourcemap: false,
       // Phaser alone is over a megabyte minified, so Vite's 500 kB warning
       // fires on every build and teaches everyone to ignore it. The real limit
       // is scripts/check-budget.mjs, which fails the build instead of warning.
       chunkSizeWarningLimit: 2_000,
     },
     test: {
       include: ['src/**/*.test.ts'],
       // The rules tests run in plain Node. The one test that boots Phaser
       // selects happy-dom in its own first line.
       environment: 'node',
     },
   });
   ```

   Verify: `test -f vite.config.ts`

5. Create `index.html` with:

   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>Game</title>
       <style>
         html,
         body {
           margin: 0;
           height: 100%;
           background: #11151c;
         }
         #game {
           width: 100%;
           height: 100%;
         }
       </style>
     </head>
     <body>
       <main id="game" aria-label="Game"></main>
       <noscript>This game needs JavaScript.</noscript>
       <script type="module" src="/src/main.ts"></script>
     </body>
   </html>
   ```

   Verify: `test -f index.html`

6. Create `src/rules/geometry.ts` with:

   ```typescript
   /**
    * Shapes the rules reason about. Positions are centres, the same convention
    * a Phaser sprite uses with its default origin, so the scene copies them
    * across without converting anything.
    */
   export interface Vec {
     readonly x: number;
     readonly y: number;
   }

   export interface Size {
     readonly width: number;
     readonly height: number;
   }

   export interface Box extends Vec, Size {}

   /** True when two boxes share any area. Touching edges do not count. */
   export function overlaps(a: Box, b: Box): boolean {
     return (
       Math.abs(a.x - b.x) * 2 < a.width + b.width && Math.abs(a.y - b.y) * 2 < a.height + b.height
     );
   }

   export function clamp(value: number, min: number, max: number): number {
     return Math.min(Math.max(value, min), max);
   }

   /** Keeps a box entirely inside the arena. */
   export function keepInside(box: Box, arena: Size): Box {
     return {
       ...box,
       x: clamp(box.x, box.width / 2, arena.width - box.width / 2),
       y: clamp(box.y, box.height / 2, arena.height - box.height / 2),
     };
   }
   ```

   Verify: `test -f src/rules/geometry.ts`

7. Create `src/rules/random.ts` with:

   ```typescript
   /** A source of numbers in [0, 1). The rules never call Math.random. */
   export type Random = () => number;

   /**
    * mulberry32: a small seeded generator. The same seed gives the same game,
    * which is what makes a rule test repeatable and a reported bug replayable.
    * Not for anything where guessing the next number matters.
    */
   export function createRandom(seed: number): Random {
     let state = seed >>> 0;
     return () => {
       state = (state + 0x6d2b79f5) >>> 0;
       let t = state;
       t = Math.imul(t ^ (t >>> 15), t | 1);
       t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
       return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
     };
   }
   ```

   Verify: `test -f src/rules/random.ts`

8. Create `src/rules/movement.ts` with:

   ```typescript
   import { keepInside, type Box, type Size, type Vec } from './geometry';

   /** What the player is holding this frame, already translated from keys. */
   export interface Input {
     readonly left: boolean;
     readonly right: boolean;
     readonly up: boolean;
     readonly down: boolean;
   }

   export const NO_INPUT: Input = { left: false, right: false, up: false, down: false };

   /**
    * A unit vector, or zero. Opposite keys cancel, and a diagonal is normalised:
    * without that, holding two keys moves the player about 41% faster than one.
    */
   export function direction(input: Input): Vec {
     const x = Number(input.right) - Number(input.left);
     const y = Number(input.down) - Number(input.up);
     const length = Math.hypot(x, y);
     return length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
   }

   /** Moves a box for `dtMs` milliseconds at `speed` pixels per second. */
   export function move(box: Box, input: Input, speed: number, dtMs: number, arena: Size): Box {
     const { x, y } = direction(input);
     const distance = (speed * dtMs) / 1000;
     return keepInside({ ...box, x: box.x + x * distance, y: box.y + y * distance }, arena);
   }
   ```

   Verify: `test -f src/rules/movement.ts`

9. Create `src/rules/game.ts` with:

   ```typescript
   import { keepInside, overlaps, type Box, type Size, type Vec } from './geometry';
   import { move, type Input } from './movement';
   import type { Random } from './random';

   /**
    * The whole game, as data and functions over it. Collect coins before the
    * clock runs out; touch the hazard and it is over.
    *
    * Nothing here knows Phaser exists. The scene reads input, calls `tick`, and
    * draws what comes back; every rule is testable as a function call.
    */
   export type Status = 'playing' | 'won' | 'lost';

   export interface Rules {
     readonly arena: Size;
     /** Pixels per second. */
     readonly playerSpeed: number;
     readonly hazardSpeed: number;
     /** Coins needed to win. */
     readonly target: number;
     readonly timeLimitMs: number;
   }

   export const DEFAULT_RULES: Rules = {
     arena: { width: 480, height: 320 },
     playerSpeed: 180,
     hazardSpeed: 110,
     target: 10,
     timeLimitMs: 30_000,
   };

   /** Sizes in pixels. The textures are drawn at these sizes, so the two agree. */
   export const SIZES = {
     player: { width: 16, height: 16 },
     coin: { width: 12, height: 12 },
     hazard: { width: 20, height: 20 },
   } as const satisfies Record<string, Size>;

   /**
    * The longest step one tick simulates. A frame that took two seconds (a tab
    * in the background, a debugger pause) would otherwise move the player
    * straight through the hazard without ever overlapping it.
    */
   export const MAX_STEP_MS = 50;

   export interface GameState {
     readonly rules: Rules;
     readonly status: Status;
     readonly score: number;
     readonly remainingMs: number;
     readonly player: Box;
     readonly coin: Box;
     readonly hazard: Box;
     /** Unit direction the hazard is travelling in. */
     readonly hazardHeading: Vec;
   }

   export function createGame(rules: Rules, random: Random): GameState {
     const { width, height } = rules.arena;
     const player: Box = { x: width / 2, y: height / 2, ...SIZES.player };
     return {
       rules,
       status: 'playing',
       score: 0,
       remainingMs: rules.timeLimitMs,
       player,
       coin: spawnCoin(rules.arena, player, random),
       hazard: { x: SIZES.hazard.width, y: SIZES.hazard.height, ...SIZES.hazard },
       hazardHeading: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
     };
   }

   /**
    * Advances the game by `dtMs`. A finished game is returned unchanged, so the
    * scene can keep calling this without checking first.
    *
    * Order matters and is tested: the hazard is checked before the coin, so a
    * frame that touches both loses; a coin on the last frame still counts.
    */
   export function tick(state: GameState, input: Input, dtMs: number, random: Random): GameState {
     if (state.status !== 'playing') return state;

     const dt = Math.min(Math.max(dtMs, 0), MAX_STEP_MS);
     const { rules } = state;
     const player = move(state.player, input, rules.playerSpeed, dt, rules.arena);
     const { hazard, hazardHeading } = moveHazard(state, dt);
     const remainingMs = Math.max(state.remainingMs - dt, 0);
     const next = { ...state, player, hazard, hazardHeading, remainingMs };

     if (overlaps(player, hazard)) return { ...next, status: 'lost' };

     if (overlaps(player, state.coin)) {
       const score = state.score + 1;
       if (score >= rules.target) return { ...next, score, status: 'won' };
       return { ...next, score, coin: spawnCoin(rules.arena, player, random) };
     }

     return remainingMs === 0 ? { ...next, status: 'lost' } : next;
   }

   /** The hazard travels in a straight line and bounces off the arena's walls. */
   function moveHazard(state: GameState, dt: number): Pick<GameState, 'hazard' | 'hazardHeading'> {
     const { arena, hazardSpeed } = state.rules;
     const distance = (hazardSpeed * dt) / 1000;
     const { hazard } = state;
     let { x: hx, y: hy } = state.hazardHeading;
     const x = hazard.x + hx * distance;
     const y = hazard.y + hy * distance;
     if (x <= hazard.width / 2 || x >= arena.width - hazard.width / 2) hx = -hx;
     if (y <= hazard.height / 2 || y >= arena.height - hazard.height / 2) hy = -hy;
     return { hazard: keepInside({ ...hazard, x, y }, arena), hazardHeading: { x: hx, y: hy } };
   }

   /**
    * Somewhere the player is not. Tries a few random spots, then falls back to
    * the corner furthest from the player, so a spawn can never land on a
    * collect-for-free position however the dice fall.
    */
   export function spawnCoin(arena: Size, player: Box, random: Random): Box {
     const { width, height } = SIZES.coin;
     for (let attempt = 0; attempt < 8; attempt += 1) {
       const coin = keepInside(
         { x: random() * arena.width, y: random() * arena.height, width, height },
         arena,
       );
       if (!overlaps(coin, { ...player, width: player.width * 3, height: player.height * 3 })) {
         return coin;
       }
     }
     return keepInside(
       {
         x: player.x < arena.width / 2 ? arena.width : 0,
         y: player.y < arena.height / 2 ? arena.height : 0,
         width,
         height,
       },
       arena,
     );
   }
   ```

   Verify: `test -f src/rules/game.ts`

10. Create `src/rules/movement.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { direction, move, NO_INPUT } from './movement';

    const arena = { width: 100, height: 100 };
    const box = { x: 50, y: 50, width: 10, height: 10 };

    describe('movement', () => {
      it('does not move without input', () => {
        expect(move(box, NO_INPUT, 100, 1_000, arena)).toEqual(box);
      });

      it('moves speed pixels per second', () => {
        expect(move(box, { ...NO_INPUT, right: true }, 20, 500, arena).x).toBe(60);
      });

      it('is no faster on a diagonal than in a straight line', () => {
        const { x, y } = direction({ ...NO_INPUT, right: true, down: true });
        expect(Math.hypot(x, y)).toBeCloseTo(1);
      });

      it('cancels opposite keys instead of preferring one', () => {
        expect(direction({ left: true, right: true, up: true, down: true })).toEqual({
          x: 0,
          y: 0,
        });
      });

      it('stops at the edge of the arena', () => {
        const moved = move(box, { ...NO_INPUT, left: true, up: true }, 1_000, 1_000, arena);
        expect(moved.x).toBe(5);
        expect(moved.y).toBe(5);
      });
    });
    ```

    Verify: `test -f src/rules/movement.test.ts`

11. Create `src/rules/game.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { overlaps } from './geometry';
    import {
      createGame,
      DEFAULT_RULES,
      MAX_STEP_MS,
      spawnCoin,
      tick,
      type GameState,
    } from './game';
    import { NO_INPUT } from './movement';
    import { createRandom } from './random';

    const random = createRandom(1);
    const start = (): GameState => createGame(DEFAULT_RULES, createRandom(1));
    const right = { ...NO_INPUT, right: true };

    /** The hazard parked in the far corner, so a test about coins is only about coins. */
    function quiet(state: GameState): GameState {
      const { width, height } = state.rules.arena;
      return {
        ...state,
        hazard: { ...state.hazard, x: width - 10, y: height - 10 },
        hazardHeading: { x: 0, y: 0 },
      };
    }

    describe('a new game', () => {
      it('starts playing, with no score and the whole clock', () => {
        const game = start();
        expect(game.status).toBe('playing');
        expect(game.score).toBe(0);
        expect(game.remainingMs).toBe(DEFAULT_RULES.timeLimitMs);
      });

      it('never puts the coin where the player already is', () => {
        const game = start();
        expect(overlaps(game.player, game.coin)).toBe(false);
      });

      it('is the same game for the same seed', () => {
        expect(start()).toEqual(start());
      });
    });

    describe('scoring', () => {
      it('counts a coin the player touches, and moves the coin away', () => {
        const game = quiet(start());
        const onCoin = { ...game, coin: { ...game.coin, x: game.player.x, y: game.player.y } };

        const next = tick(onCoin, NO_INPUT, 16, random);

        expect(next.score).toBe(1);
        expect(next.status).toBe('playing');
        expect(overlaps(next.player, next.coin)).toBe(false);
      });

      it('wins on the coin that reaches the target', () => {
        const game = quiet(start());
        const last = {
          ...game,
          score: DEFAULT_RULES.target - 1,
          coin: { ...game.coin, x: game.player.x, y: game.player.y },
        };

        expect(tick(last, NO_INPUT, 16, random).status).toBe('won');
      });

      it('still counts a coin collected on the frame the clock runs out', () => {
        const game = quiet(start());
        const last = {
          ...game,
          score: DEFAULT_RULES.target - 1,
          remainingMs: 1,
          coin: { ...game.coin, x: game.player.x, y: game.player.y },
        };

        expect(tick(last, NO_INPUT, 16, random).status).toBe('won');
      });
    });

    describe('losing', () => {
      it('loses when the player touches the hazard', () => {
        const game = start();
        const touching = {
          ...game,
          hazard: { ...game.hazard, x: game.player.x, y: game.player.y },
        };

        expect(tick(touching, NO_INPUT, 16, random).status).toBe('lost');
      });

      it('loses when a frame touches the hazard and a coin at once', () => {
        const game = start();
        const both = {
          ...game,
          hazard: { ...game.hazard, x: game.player.x, y: game.player.y },
          coin: { ...game.coin, x: game.player.x, y: game.player.y },
        };

        const next = tick(both, NO_INPUT, 16, random);
        expect(next.status).toBe('lost');
        expect(next.score).toBe(0);
      });

      it('loses when the clock runs out', () => {
        const game = { ...quiet(start()), remainingMs: 10 };

        const next = tick(game, NO_INPUT, 16, random);
        expect(next.remainingMs).toBe(0);
        expect(next.status).toBe('lost');
      });
    });

    describe('ticks', () => {
      it('leaves a finished game exactly as it was', () => {
        const over = { ...start(), status: 'lost' as const };
        expect(tick(over, right, 16, random)).toBe(over);
      });

      it('simulates at most one short step, however long the frame took', () => {
        const game = quiet(start());
        const next = tick(game, right, 5_000, random);

        expect(next.player.x - game.player.x).toBeCloseTo(
          (DEFAULT_RULES.playerSpeed * MAX_STEP_MS) / 1000,
        );
        expect(next.remainingMs).toBe(DEFAULT_RULES.timeLimitMs - MAX_STEP_MS);
      });

      it('ignores a negative frame time rather than running the clock backwards', () => {
        const game = start();
        expect(tick(game, NO_INPUT, -100, random).remainingMs).toBe(game.remainingMs);
      });

      it('keeps the hazard inside the arena for a whole game', () => {
        let game = { ...start(), player: { ...start().player, x: -1_000, y: -1_000 } };
        for (let frame = 0; frame < 2_000; frame += 1) {
          game = { ...tick(game, NO_INPUT, 16, random), status: 'playing', remainingMs: 1_000 };
          const { x, y, width, height } = game.hazard;
          expect(x - width / 2).toBeGreaterThanOrEqual(0);
          expect(y - height / 2).toBeGreaterThanOrEqual(0);
          expect(x + width / 2).toBeLessThanOrEqual(DEFAULT_RULES.arena.width);
          expect(y + height / 2).toBeLessThanOrEqual(DEFAULT_RULES.arena.height);
        }
      });
    });

    describe('spawnCoin', () => {
      it('falls back to the far corner when every random spot is taken', () => {
        const arena = DEFAULT_RULES.arena;
        const player = { x: 10, y: 10, width: 16, height: 16 };
        const coin = spawnCoin(arena, player, () => 0);

        expect(overlaps(coin, player)).toBe(false);
        expect(coin.x).toBeGreaterThan(arena.width / 2);
        expect(coin.y).toBeGreaterThan(arena.height / 2);
      });
    });
    ```

    Verify: `test -f src/rules/game.test.ts`

12. Create `src/rules/boundary.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    /**
     * The rules are plain TypeScript. This test is what keeps them that way: it
     * reads every module in this folder as text and refuses an import from
     * anywhere but the folder itself (Phaser, the DOM helpers, a scene), and the
     * two calls that would make a game impossible to replay.
     */
    const sources = import.meta.glob<string>(['./*.ts', '!./*.test.ts'], {
      query: '?raw',
      import: 'default',
      eager: true,
    });

    const specifiers = (source: string): string[] =>
      [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g)].map(
        (match) => match[1] ?? '',
      );

    describe('the rules folder', () => {
      it('has modules to check, so a moved folder cannot pass by being empty', () => {
        expect(Object.keys(sources).length).toBeGreaterThanOrEqual(4);
      });

      it.each(Object.entries(sources))(
        '%s imports nothing from outside src/rules',
        (_file, source) => {
          // Named on its own so the failure says what went wrong, not only where.
          expect(source).not.toMatch(/['"]phaser['"]/);
          for (const specifier of specifiers(source)) {
            expect(specifier, `import of "${specifier}"`).toMatch(/^\.\/[\w-]+$/);
          }
        },
      );

      it.each(Object.entries(sources))(
        '%s takes randomness and time as arguments',
        (_file, source) => {
          expect(source).not.toMatch(/Math\.random\s*\(|Date\.now\s*\(|performance\.now\s*\(/);
        },
      );
    });
    ```

    Verify: `test -f src/rules/boundary.test.ts`

13. Write the coin, a 12×12 indexed-colour PNG drawn for this blueprint (142 bytes, CC BY 4.0 like the rest of it), from its base64 text. It is a real file in `src/assets/` because that is where art goes, and small enough to read back byte for byte: `node -e "require('node:fs').mkdirSync('src/assets', { recursive: true }); require('node:fs').writeFileSync('src/assets/coin.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAACVBMVEUAAAD/0Wa4hgv8OfXXAAAAA3RSTlMA//9EUNYhAAAAMUlEQVR42mNgAAEmJgYYYGJiZIRxmRjBgAnGZmKC8pA5YEVMEBKVg1sPqtGoliKcAwAqDACJic0FYgAAAABJRU5ErkJggg==', 'base64'))"`
    Verify: `node -e "const b = require('node:fs').readFileSync('src/assets/coin.png'); if (b.toString('latin1', 1, 4) !== 'PNG' || b.readUInt32BE(16) !== 12 || b.readUInt32BE(20) !== 12) process.exit(1)"`

14. Create `src/scenes/keys.ts` with:

    ```typescript
    /** Scene and texture keys, spelled once. A typo in a string key fails silently. */
    export const SCENES = {
      boot: 'boot',
      preload: 'preload',
      play: 'play',
    } as const;

    export const TEXTURES = {
      player: 'player',
      hazard: 'hazard',
      coin: 'coin',
    } as const;
    ```

    Verify: `test -f src/scenes/keys.ts`

15. Create `src/scenes/boot.ts` with:

    ```typescript
    import Phaser from 'phaser';

    import { SIZES } from '../rules/game';
    import { SCENES, TEXTURES } from './keys';

    /**
     * Draws the placeholder textures in code, then hands over to the preloader.
     *
     * Drawn on a canvas texture rather than with Graphics.generateTexture: the
     * canvas path needs no renderer, so it behaves the same under WebGL, Canvas
     * and the HEADLESS renderer the tests boot with.
     */
    export class BootScene extends Phaser.Scene {
      constructor() {
        super(SCENES.boot);
      }

      create(): void {
        this.square(TEXTURES.player, SIZES.player.width, '#4cc9f0');
        this.square(TEXTURES.hazard, SIZES.hazard.width, '#f72585');
        this.scene.start(SCENES.preload);
      }

      private square(key: string, size: number, colour: string): void {
        if (this.textures.exists(key)) return;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error(`no 2D canvas to draw the ${key} texture on`);
        context.fillStyle = colour;
        context.fillRect(0, 0, size, size);
        this.textures.addCanvas(key, canvas);
      }
    }
    ```

    Verify: `test -f src/scenes/boot.ts`

16. Create `src/scenes/preload.ts` with:

    ```typescript
    import Phaser from 'phaser';

    import coinUrl from '../assets/coin.png?inline';
    import { SCENES, TEXTURES } from './keys';

    /**
     * Loads the art that lives in files, with a progress bar, and refuses to
     * start the game if any of it failed.
     *
     * `?inline` makes Vite hand over a data URL instead of a path: the image is
     * compiled into the bundle, the game makes no request for it, and the
     * headless test (which has no server to fetch from) loads it the same way a
     * browser does.
     */
    export class PreloadScene extends Phaser.Scene {
      private failed: string[] = [];

      constructor() {
        super(SCENES.preload);
      }

      init(): void {
        this.failed = [];
      }

      preload(): void {
        const { width, height } = this.scale;
        const bar = this.add
          .rectangle(width / 2 - 100, height / 2, 200, 8, 0xffffff)
          .setOrigin(0, 0.5)
          .setScale(0, 1);
        this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => bar.setScale(value, 1));
        this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
          this.failed.push(file.key);
        });

        this.load.image(TEXTURES.coin, coinUrl);
      }

      create(): void {
        if (this.failed.length > 0) {
          // Starting anyway would draw Phaser's missing-texture square where the
          // art should be, which looks like a rendering bug rather than a failed
          // download. Say what failed instead.
          this.add.text(16, 16, `Could not load: ${this.failed.join(', ')}`, { color: '#ff6b6b' });
          return;
        }
        this.scene.start(SCENES.play);
      }
    }
    ```

    Verify: `test -f src/scenes/preload.ts`

17. Create `src/scenes/play.ts` with:

    ```typescript
    import Phaser from 'phaser';

    import { createGame, DEFAULT_RULES, tick, type GameState } from '../rules/game';
    import type { Input } from '../rules/movement';
    import { createRandom, type Random } from '../rules/random';
    import { SCENES, TEXTURES } from './keys';

    /** Registry key for a fixed seed. Unset in the browser; set by the headless test. */
    export const SEED_KEY = 'seed';

    type Keys = Record<
      'left' | 'right' | 'up' | 'down' | 'a' | 'd' | 'w' | 's' | 'restart',
      Phaser.Input.Keyboard.Key
    >;

    /**
     * The game, as a thin shell around `src/rules`: read the keys, call `tick`,
     * draw what it returns. No rule lives here — a scene is only tested by
     * booting the whole game, a rule is tested with a function call.
     */
    export class PlayScene extends Phaser.Scene {
      private state!: GameState;
      private random!: Random;
      private keys!: Keys;
      private sprites!: Record<'player' | 'coin' | 'hazard', Phaser.GameObjects.Image>;
      private hud!: Phaser.GameObjects.Text;
      private banner!: Phaser.GameObjects.Text;

      constructor() {
        super(SCENES.play);
      }

      /** What the rules say right now. Read by the headless test; never written from outside. */
      get snapshot(): GameState {
        return this.state;
      }

      create(): void {
        const seed: unknown = this.registry.get(SEED_KEY);
        this.random = createRandom(
          typeof seed === 'number' ? seed : Math.floor(Math.random() * 2 ** 32),
        );
        this.state = createGame(DEFAULT_RULES, this.random);

        this.sprites = {
          coin: this.add.image(0, 0, TEXTURES.coin),
          hazard: this.add.image(0, 0, TEXTURES.hazard),
          player: this.add.image(0, 0, TEXTURES.player),
        };

        const keyboard = this.input.keyboard;
        if (keyboard === null) throw new Error('keyboard input is turned off in the game config');
        this.keys = keyboard.addKeys({
          left: 'LEFT',
          right: 'RIGHT',
          up: 'UP',
          down: 'DOWN',
          a: 'A',
          d: 'D',
          w: 'W',
          s: 'S',
          restart: 'SPACE',
        }) as Keys;

        const style = { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' };
        this.hud = this.add.text(8, 8, '', style);
        this.banner = this.add
          .text(this.scale.width / 2, this.scale.height / 2, '', style)
          .setOrigin(0.5);
        this.draw();
      }

      override update(_time: number, delta: number): void {
        if (this.state.status !== 'playing') {
          if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.scene.restart();
          return;
        }
        this.state = tick(this.state, this.readInput(), delta, this.random);
        this.draw();
      }

      private readInput(): Input {
        const k = this.keys;
        return {
          left: k.left.isDown || k.a.isDown,
          right: k.right.isDown || k.d.isDown,
          up: k.up.isDown || k.w.isDown,
          down: k.down.isDown || k.s.isDown,
        };
      }

      private draw(): void {
        const { player, coin, hazard, score, remainingMs, status, rules } = this.state;
        this.sprites.player.setPosition(player.x, player.y);
        this.sprites.coin.setPosition(coin.x, coin.y);
        this.sprites.hazard.setPosition(hazard.x, hazard.y);
        this.hud.setText(
          `Coins ${String(score)}/${String(rules.target)}   Time ${String(Math.ceil(remainingMs / 1000))}`,
        );
        this.banner.setText(
          status === 'won'
            ? 'You win. Space to play again.'
            : status === 'lost'
              ? 'Game over. Space to try again.'
              : '',
        );
      }
    }
    ```

    Verify: `test -f src/scenes/play.ts`

18. Create `src/config.ts` with:

    ```typescript
    import Phaser from 'phaser';

    import { DEFAULT_RULES } from './rules/game';
    import { BootScene } from './scenes/boot';
    import { PlayScene } from './scenes/play';
    import { PreloadScene } from './scenes/preload';

    /**
     * The one game configuration. The browser and the headless test both build
     * the game from here, so the test boots the same scenes in the same order and
     * differs only in what it overrides: the renderer, audio and the seed.
     */
    export function gameConfig(
      overrides: Phaser.Types.Core.GameConfig = {},
    ): Phaser.Types.Core.GameConfig {
      return {
        type: Phaser.AUTO,
        parent: 'game',
        width: DEFAULT_RULES.arena.width,
        height: DEFAULT_RULES.arena.height,
        backgroundColor: '#1d2330',
        pixelArt: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [BootScene, PreloadScene, PlayScene],
        ...overrides,
      };
    }
    ```

    Verify: `test -f src/config.ts`

19. Create `src/main.ts` with:

    ```typescript
    import Phaser from 'phaser';

    import { gameConfig } from './config';

    // The only line that starts a game in a page. Everything it runs is built by
    // gameConfig(), which the headless test calls too.
    new Phaser.Game(gameConfig());
    ```

    Verify: `test -f src/main.ts`

20. Create `src/test/canvas-2d.ts` with:

    ```typescript
    /**
     * A 2D canvas context that draws nothing.
     *
     * The HEADLESS renderer draws nothing either, but Phaser still probes a 2D
     * context while it starts (feature detection, the canvas textures), and the
     * test DOM has none. This answers every call with nothing so the game can
     * boot. It is also exactly the line between what the headless test proves
     * and what it does not: scenes, loading, input and rules run for real; no
     * pixel is ever drawn or checked.
     */
    function nullContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
      const pixels = (width = 1, height = 1): ImageData =>
        ({
          data: new Uint8ClampedArray(Math.max(1, width * height) * 4),
          width,
          height,
        }) as ImageData;
      const answers: Record<PropertyKey, unknown> = {
        canvas,
        getImageData: (_x: number, _y: number, width: number, height: number) =>
          pixels(width, height),
        createImageData: (width: number, height: number) => pixels(width, height),
        measureText: () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }),
        createLinearGradient: () => ({ addColorStop: () => undefined }),
        createRadialGradient: () => ({ addColorStop: () => undefined }),
        createPattern: () => ({}),
      };
      const assigned: Record<PropertyKey, unknown> = {};
      return new Proxy({} as CanvasRenderingContext2D, {
        get: (_target, name) =>
          name in answers ? answers[name] : name in assigned ? assigned[name] : () => undefined,
        set: (_target, name, value: unknown) => {
          assigned[name] = value;
          return true;
        },
      });
    }

    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      kind: string,
    ) {
      return kind === '2d' ? nullContext(this) : null;
    } as typeof HTMLCanvasElement.prototype.getContext;
    ```

    Verify: `test -f src/test/canvas-2d.ts`

21. Create `src/game.test.ts` with:

    ```typescript
    // @vitest-environment happy-dom
    // The canvas stub has to be in place before Phaser is imported: Phaser runs
    // its feature detection while the module loads.
    import './test/canvas-2d';

    import Phaser from 'phaser';
    import { beforeAll, describe, expect, it } from 'vitest';

    import { gameConfig } from './config';
    import { SCENES, TEXTURES } from './scenes/keys';
    import { PlayScene, SEED_KEY } from './scenes/play';

    /**
     * Boots the real game — the same config, scenes and order as the browser —
     * under Phaser's HEADLESS renderer, then drives it frame by frame.
     *
     * What this proves: the scenes hand over in order, every texture the game
     * uses exists, keyboard input reaches the rules, and the clock runs. What it
     * cannot: anything drawn. See src/test/canvas-2d.ts.
     */
    const FRAME_MS = 16;
    let game: Phaser.Game;
    let time = 0;

    async function until(condition: () => boolean, what: string): Promise<void> {
      const deadline = Date.now() + 5_000;
      while (!condition()) {
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    function step(frames: number): void {
      for (let frame = 0; frame < frames; frame += 1) {
        time += FRAME_MS;
        game.headlessStep(time, FRAME_MS);
      }
    }

    function key(type: 'keydown' | 'keyup', name: string, keyCode: number): void {
      // Phaser reads the legacy keyCode, which KeyboardEventInit does not declare.
      window.dispatchEvent(new KeyboardEvent(type, { key: name, keyCode } as KeyboardEventInit));
    }

    const play = (): PlayScene => game.scene.getScene(SCENES.play) as PlayScene;

    beforeAll(async () => {
      game = new Phaser.Game(
        gameConfig({
          type: Phaser.HEADLESS,
          audio: { noAudio: true },
          banner: false,
          callbacks: {
            preBoot: (booting) => {
              booting.registry.set(SEED_KEY, 7);
            },
          },
        }),
      );
      await until(() => game.scene.isActive(SCENES.play), 'the play scene');
      // From here the test owns the clock. Game.destroy() is not called: under
      // HEADLESS it throws in this Phaser version, and the environment is thrown
      // away with the file anyway.
      game.loop.stop();
    });

    describe('the game, booted headless', () => {
      it('goes boot, preload, play, and has every texture it draws', () => {
        expect(game.scene.isActive(SCENES.boot)).toBe(false);
        expect(game.scene.isActive(SCENES.preload)).toBe(false);
        for (const texture of Object.values(TEXTURES)) {
          expect(game.textures.exists(texture), texture).toBe(true);
        }
        expect(play().snapshot.status).toBe('playing');
      });

      it('runs the clock from the frames it is given', () => {
        const before = play().snapshot.remainingMs;
        step(10);
        expect(play().snapshot.remainingMs).toBe(before - 10 * FRAME_MS);
      });

      it('moves the player while an arrow key is held, and stops when it is released', () => {
        const start = play().snapshot.player.x;

        key('keydown', 'ArrowRight', 39);
        step(10);
        const moved = play().snapshot.player.x;
        key('keyup', 'ArrowRight', 39);
        step(10);

        expect(moved).toBeGreaterThan(start);
        expect(play().snapshot.player.x).toBe(moved);
      });

      it('ends, and Space starts a new game', () => {
        // Nobody is collecting coins, so the game ends one way or the other
        // (the clock, or the hazard) within its time limit.
        step(Math.ceil(play().snapshot.rules.timeLimitMs / FRAME_MS) + 1);
        expect(play().snapshot.status).toBe('lost');

        key('keydown', ' ', 32);
        step(2);
        key('keyup', ' ', 32);

        expect(play().snapshot.status).toBe('playing');
        expect(play().snapshot.score).toBe(0);
      });
    });
    ```

    Verify: `test -f src/game.test.ts`

22. Create `scripts/check-budget.mjs` with:

    ```javascript
    // Fails when the built game is heavier than its budget. `npm run build` runs
    // it after `vite build`, so a build that is over budget is a failed build.
    //
    // Usage: node scripts/check-budget.mjs [directory]   (default: dist)
    import { readdirSync, readFileSync } from 'node:fs';
    import { join, relative } from 'node:path';
    import { gzipSync } from 'node:zlib';

    const BUDGET = {
      // What a first visit downloads as script, compressed the way a static host
      // serves it. Phaser is about 360 kB of this by itself; the rest is the game.
      scriptsGzip: 400_000,
      // Every file in the build, uncompressed: code, art, audio, fonts. Images and
      // audio are already compressed, so their raw size is what gets downloaded.
      allFiles: 2_500_000,
    };

    const root = process.argv[2] ?? 'dist';

    function walk(directory) {
      return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)],
      );
    }

    let files;
    try {
      files = walk(root);
    } catch {
      console.error(`${root}/ does not exist: run vite build first`);
      process.exit(1);
    }

    let scriptsGzip = 0;
    let allFiles = 0;
    const maps = [];
    for (const file of files) {
      const bytes = readFileSync(file);
      allFiles += bytes.length;
      if (file.endsWith('.js')) scriptsGzip += gzipSync(bytes, { level: 9 }).length;
      if (file.endsWith('.map')) maps.push(relative(root, file));
    }

    const kb = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;
    const over = [];
    if (scriptsGzip > BUDGET.scriptsGzip) over.push('scripts');
    if (allFiles > BUDGET.allFiles) over.push('all files');

    console.log(`scripts (gzip): ${kb(scriptsGzip)} of ${kb(BUDGET.scriptsGzip)}`);
    console.log(`all files:      ${kb(allFiles)} of ${kb(BUDGET.allFiles)}`);
    if (maps.length > 0) {
      // A source map publishes the original source; vite.config.ts turns them off.
      console.error(`source maps in the build: ${maps.join(', ')}`);
      process.exitCode = 1;
    }
    if (over.length > 0) {
      console.error(`over budget: ${over.join(', ')}`);
      process.exitCode = 1;
    }
    ```

    Verify: `test -f scripts/check-budget.mjs`

23. Create `.gitignore` with:

    ```text
    node_modules/
    dist/
    *.tsbuildinfo
    *.local
    # Vite loads .env files into the build, and anything VITE_-prefixed in one is
    # published in the bundle. This game reads no configuration; keep it that way.
    .env*
    ```

    Verify: `test -f .gitignore`

24. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      check:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          # npm ci, not npm install: the committed lock file is what gets built,
          # and a lock file that disagrees with package.json fails here.
          - run: npm ci
          - run: npm run typecheck
          - run: npm test
          # Includes the size budget: a build that is over it fails.
          - run: npm run build
    ```

    Verify: `test -f .github/workflows/ci.yml`

25. Create `README.md` with:

    ```markdown
    # game

    A browser game on Phaser 4, built by Vite into static files.

    ## Play it

    Install with `npm ci`, then `npm run dev` and open the address it prints.
    Arrow keys or WASD move; collect the coins before the clock runs out and keep
    away from the pink square. Space starts again.

    ## Check it

    - `npm run typecheck` — TypeScript, strict.
    - `npm test` — the rules as plain functions, and the whole game booted under
      Phaser's HEADLESS renderer. Nothing is drawn in the tests.
    - `npm run build` — writes `dist/` and fails if it is over the size budget in
      `scripts/check-budget.mjs`.

    What the tests cannot tell you — how it looks, how the controls feel, the frame
    rate on a real phone — you find out by playing it on the devices you care about.

    ## Ship it

    `dist/` is static files. Any static host serves it, from any path.

    ## Change it

    Read `AGENTS.md` first. The short version: a rule goes in `src/rules/` with a
    test, and the scenes only read input and draw.
    ```

    Verify: `test -f README.md`

26. Type-check everything, tests and config included: `npm run typecheck`
    Verify: `npm run typecheck`

27. Run the tests: the rules as plain functions, the boundary that keeps Phaser out of `src/rules/`, and the whole game booted headless and driven frame by frame: `npm test`
    Verify: `npm test`

28. Build for production. `npm run build` is `vite build` followed by the size budget, so the log carries the measured sizes: `npm run build > build.log 2>&1`
    Verify: `grep -q "scripts (gzip)" build.log && test -f dist/index.html`

29. Confirm the coin was compiled into the script rather than left as a file the game would have to fetch: `grep -l "data:image/png;base64," dist/assets/*.js`
    Verify: `grep -q "data:image/png;base64," dist/assets/*.js`

30. Confirm no source map was shipped, because a map publishes the original source to anybody with developer tools: `find dist -name "*.map"`
    Verify: `test -z "$(find dist -name '*.map')"`

31. Make a stand-in build that is over budget, to prove the budget check fails rather than only prints: `node -e "require('node:fs').mkdirSync('budget-probe/assets', { recursive: true }); require('node:fs').writeFileSync('budget-probe/assets/heavy.js', require('node:crypto').randomBytes(600000).toString('base64'))"`
    Verify: `test -f budget-probe/assets/heavy.js`

32. Run the budget against it, and keep the exit status: `node scripts/check-budget.mjs budget-probe > budget-probe.log 2>&1; echo "$?" > budget-probe.code`
    Verify: `grep -qv '^0$' budget-probe.code && grep -q "over budget: scripts" budget-probe.log`
