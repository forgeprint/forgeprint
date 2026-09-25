# Godot C# Game — agent context

A 2D game on Godot 4.7 in C#. The Godot project is the repository root; the
game's rules are a plain .NET library beside it. Read this before changing a
rule, adding a node script, or touching a project file.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand or shipped a
> game on it — and CI has never started the engine. Treat it as a starting
> point that compiles and whose rules are tested, not as a game somebody has
> played to the end.

## The shape

```
project.godot            engine settings: main scene, window, input actions
Game.csproj              the game assembly (Godot.NET.Sdk/4.7.2, net8.0)
Game.sln                 Debug, ExportDebug, ExportRelease — Godot's three
scenes/Main.tscn         the main scene: Main, Player, Coin, Hud
scripts/Main.cs          reads input, calls GameRules.Tick, copies the result
scripts/Player.cs        draws the player; decides nothing
scripts/Coin.cs          draws the coin; decides nothing
src/Game.Rules/          the game: state, movement, bounds, scoring, win/lose. No Godot
tests/Game.Rules.Tests/  xUnit v3: rules, the boundary, and the project files
Directory.Build.props    nullable on, warnings are errors, for all three projects
global.json              SDK 10 pin, and dotnet test on Microsoft.Testing.Platform
```

`src/` and `tests/` each hold a `.gdignore`. Without it the editor imports
every file under them, build output included, as a game resource.

## Rules that are not style preferences

**`src/Game.Rules` never references Godot.** No `GodotSharp` package, no
reference to `Game.csproj`, no `using Godot;`. `BoundaryTests` fails on any of
them — once from the project file, once from the compiled assembly's
references. The failure mode it prevents: `GodotSharp` only works inside a
running engine, so a rule that touches a Godot type can no longer be tested by
`dotnet test`, and CI has no engine to test it any other way.

**Every rule lives in `GameRules.Tick`, not in `_Process`.** `Main._Process`
turns input into a vector, calls `Tick`, and copies positions and text onto
nodes. An `if` in a script that is about the game (not about input or
drawing) is a rule in the wrong place, and it has no test.

**Randomness and time are arguments.** `Tick` takes a `System.Random` and the
frame's seconds. Do not call `GD.Randf`, `Time.GetTicksMsec` or `DateTime.Now`
from the rules. With both injected, a seed and a list of inputs replay a game
exactly, which is how a bug report becomes a failing test.

**`Tick` clamps a frame to `MaxStepSeconds`, and ignores a frame time that is
not a finite, positive number.** A dragged window or a breakpoint delivers one
very long frame; without the clamp the player passes through a coin without
overlapping it.

**Positions are centres, in pixels.** That is a `Node2D`'s `Position`, which is
why `Main` copies `X` and `Y` straight across. The arena in
`Settings.Default` is the viewport in `project.godot` (640 × 360); change them
together.

**Input action names are spelled once, in `InputActions`.** Godot does not
fail on an undeclared action: it prints an error and reads it as never
pressed. `ProjectFileTests` fails when `project.godot` and `InputActions`
disagree in either direction.

**A script's class name is its file name, and the class is `partial`.** Godot
finds a C# script's class by the file name; a mismatch compiles and then fails
to attach when the scene loads. The source generators refuse a missing
`partial` themselves (GD0001, an error). `ProjectFileTests` checks both for
every script a scene attaches.

**Warnings are errors, everywhere.** `Directory.Build.props` sets it for the
game, the rules and the tests, with nullable reference types on. A nullable
warning in a script is a `NullReferenceException` in a running game that CI
never starts; the build is the only place it can be caught here.

## Versions move together

- `Godot.NET.Sdk/4.7.2` in `Game.csproj` is the engine version. Open the
  project with the Godot **4.7.2 .NET** editor. When you upgrade the editor it
  offers to update this line; accept, then build and run the tests.
- `Game.csproj` and `Game.Rules.csproj` target `net8.0` because
  `GodotSharp` 4.7 does. Keep the rules on the same framework as the game, or
  the game cannot reference them. Setting `TargetFramework` in
  `Directory.Build.props` instead is a known way to have the editor rewrite it.
- The tests target `net10.0` and run on the .NET 10 SDK pinned in
  `global.json`. They are never loaded by the engine.
- .NET 8 support ends on 2026-11-10. Move the game and the rules to the next
  framework Godot's packages target, not before: a newer framework than the
  engine's own is a known source of load failures at run time, which no test
  here would catch.

## Commands

```bash
dotnet build Game.sln                              # all three projects, warnings as errors
dotnet test --solution Game.sln                    # rules, boundary, project files
dotnet format Game.sln --verify-no-changes         # what CI checks
dotnet build Game.sln --configuration ExportRelease   # what a release export compiles
```

Running the game, exporting it and debugging a scene are done from the Godot
editor. None of them run in CI.

## When you are asked to add a rule

1. Add the state it needs to `GameState` and set it in `GameRules.Start`.
2. Change `Tick`. Collecting is checked before the clock, on purpose — say so
   in the change if you reorder anything.
3. Write the test first, in `GameRulesTests`, with a hand-built state rather
   than by playing frames until the situation happens.
4. Show the result in `Main.Present`. Nothing else in the script changes.

## When you are asked to add a node or a scene

1. The script goes in `scripts/`, named after its class, `partial`, deriving
   from the node type the scene declares.
2. Attach it in the `.tscn` with an `ext_resource` of type `Script`; the
   project-file test then checks it exists and matches.
3. If it decides anything about the game, the decision goes in
   `src/Game.Rules` and the script calls it.
4. A new input action goes in `InputActions` and in `project.godot` together.
