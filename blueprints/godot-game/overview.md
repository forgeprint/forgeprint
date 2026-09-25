# Godot C# Game

A 2D game on Godot 4.7 in C#. The game's rules — movement, arena bounds,
scoring, win and lose — are a plain .NET library with xUnit tests and no
reference to Godot; the node scripts read input, call the rules and draw what
comes back. Everything that can be compiled and tested without the engine is,
by the recipe and by a CI workflow.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has shipped a game on it, and —
unlike most blueprints — CI has never run the thing it builds, because the
engine is not on a package registry. Read "What CI can prove" before relying
on it.

## What you get

- A **Godot 4.7.2** project (`project.godot`, `scenes/Main.tscn`) with the
  game assembly built by **Godot.NET.Sdk 4.7.2** and **GodotSharp 4.7.2** from
  NuGet, targeting `net8.0` as those packages do. The Compatibility renderer,
  a 640 × 360 window that scales.
- A small, complete game to replace: move with the arrow keys or WASD, collect
  ten coins before a 30-second clock runs out, R to play again.
- `scripts/Main.cs`, `scripts/Player.cs` and `scripts/Coin.cs`: a shell that
  reads input and copies state onto nodes, and two nodes that draw themselves.
  No art files, so nothing to import.
- **Rules with no Godot in them**, in `src/Game.Rules`: an immutable
  `GameState`, validated `Settings`, and `GameRules.Tick` — frame time clamped,
  diagonals normalised, the player kept inside the arena, the last coin
  counted on the frame the clock runs out. Randomness is a `System.Random`
  passed in, so a seed replays a game exactly.
- **xUnit v3 4.0.1** tests on Microsoft.Testing.Platform, targeting `net10.0`:
  the rules; a boundary test that fails when the rules project or assembly
  references Godot; and project-file tests that read `project.godot` and the
  scene the way the engine would — every input action the code reads is
  declared (and nothing else is), the main scene exists, and every script a
  scene attaches exists and declares its `partial` class under its file name.
- Input actions declared in `project.godot` and named once in C#, in
  `InputActions`.
- Nullable reference types on and **warnings as errors** in all three
  projects; `dotnet format --verify-no-changes`; `global.json` pinning the
  .NET 10 SDK.
- `Game.sln` with Godot's own configurations (`Debug`, `ExportDebug`,
  `ExportRelease`), so the editor builds and exports the same solution CI
  does. The recipe proves the `ExportRelease` configuration compiles without
  the editor-only assembly.
- A CI workflow with actions pinned by commit SHA, read-only permissions and
  no persisted credentials: format, build, test, and the export configuration.

## Options

None.

## What CI can prove, and what it cannot

CI proves that the game assembly compiles against the Godot 4.7.2 API with no
warnings, that the release export configuration compiles, that the rules do
what their tests say, that the rules do not depend on Godot, and that the
project files agree with the code about input actions, the main scene and
script names.

CI **cannot** prove any of these, and this blueprint does not pretend to:

- **That the game runs.** Starting the game needs the Godot editor or an
  exported build, and the engine binary comes from GitHub releases and
  godotengine.org, which are not package registries — this catalog's recipes
  may not download from them. Nobody has pressed F5 on this recipe's output.
- **That the scene loads.** `Main.tscn` is written by hand in Godot's text
  format; the tests check the script paths and class names in it, not that the
  engine accepts every line. The editor will also add `uid` values to it on
  first save.
- **Exports.** A headless export needs the engine and its export templates,
  a large download from the same places. Nothing here exports.
- **Scene tests.** Tests that instantiate nodes (GdUnit4 and the like) run
  inside the engine. The rules tests here are plain .NET and never load
  `GodotSharp`.
- **Rendering, input feel, audio and performance.** Nothing here draws a
  frame, and the game has no sound.

What you install yourself: the **.NET edition** of Godot 4.7.2 from
[the official download page](https://godotengine.org/download/). The standard
edition cannot run C# scripts.

## What it fits

- A 2D desktop game on Godot where you want to write C#, not GDScript, and
  want the game logic testable from the first commit.
- Somebody who knows C# and .NET and wants Godot's editor — scenes, animation,
  tilemaps, native exports — around code they can unit test.
- A game-jam entry or a prototype that should survive becoming a real project.

## What it is NOT for

- **A game written in GDScript.** This is the C# path, chosen on purpose
  (below). If you want GDScript, start from the Godot editor's own new-project
  flow; the catalog has no GDScript blueprint.
- **A browser game.** Godot 4 cannot export C# projects to the web. Pick
  **`phaser-web-game`** (TypeScript, Phaser 4) instead: it runs in a browser,
  and its whole game boots headless in CI, which this one cannot.
- **Mobile.** Godot's Android and iOS exports for C# need a newer framework
  on Android and are experimental; nothing here targets them, and `platforms`
  does not list them.
- **3D.** The skeleton is 2D. Godot does 3D well, but the scene, the renderer
  choice and the rules' coordinate system would all change.
- **Unity or Unreal projects.** Different engines, different licences, and
  neither can be built from a package registry either.
- **Multiplayer.** There is no networking here.
- **An accessible game in the WCAG sense.** Keyboard-only play is the whole
  claim; nothing checks contrast, remapping or timing, and `requirements` does
  not list `accessibility`.

## Trade-offs made on your behalf

- **C#, not GDScript** (catalog decision D22). GDScript is Godot's own
  language and the one most of its tutorials use; it needs no .NET SDK, has no
  compile step and exports to the web. C# was chosen because it fits the
  catalog's existing language taxonomy, and because it can be compiled and
  unit-tested outside the engine — which is the only kind of proof a CI
  without the engine can give. The price: the .NET editor build, no web
  export, and fewer examples to copy from.
- **Rules outside the engine.** Movement and collision are a few lines of
  arithmetic rather than `CharacterBody2D` and `Area2D`. That is what makes
  them testable without Godot. If the game needs physics bodies, use them, and
  accept that those parts are tested only by playing.
- **`System.Numerics.Vector2` in the rules**, converted to `Godot.Vector2` in
  `Main`. One conversion per frame is the cost of a rules library with no
  Godot reference.
- **`net8.0` for the game**, because that is what GodotSharp 4.7 targets.
  .NET 8 support ends on 2026-11-10; moving earlier than the engine's own
  packages risks load failures at run time that no test here would see.
- **A hand-written `Game.sln`** instead of `dotnet new sln`, because the
  editor builds and exports with `ExportDebug` and `ExportRelease`, which a
  generated solution does not have.
- **Nodes draw themselves** with `_Draw`. No sprites, so no import step and
  nothing for a test to miss. Replace with `Sprite2D` when there is art.
- **No lock file for NuGet packages.** `Godot.NET.Sdk` adds `GodotSharpEditor`
  only in the `Debug` configuration, so what a lock file records would depend
  on the configuration it was restored in. Versions are pinned exactly
  instead; see the review for what that leaves open.

## Cost of adoption

About ten minutes for the recipe. Needs the .NET 10 SDK. Every package comes
from NuGet and no account is needed. Running the game needs the Godot 4.7.2
.NET editor, installed by hand.
