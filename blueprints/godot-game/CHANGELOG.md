# Changelog — godot-game

## 1.0.0 — 2026-09-25

First version, and the catalog's first Godot blueprint.

A 2D game on Godot 4.7.2 in C#: a main scene with player and coin nodes that
draw themselves, input actions declared in `project.godot`, and the rules in a
plain `net8.0` library that references nothing from Godot. The game assembly
builds with `Godot.NET.Sdk` 4.7.2 and `GodotSharp` 4.7.2 from NuGet; the
tests run on xUnit v3 4.0.1 under Microsoft.Testing.Platform on the .NET 10
SDK. Warnings are errors in all three projects, formatting is checked, and the
generated project carries a CI workflow with actions pinned by SHA.

**Generated** by a tool from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where `game` had no blueprint and godotengine/godot had 117.7k stars. The
language follows decision D22 of
[the expansion plan](../../docs/research/2026-09-24-expansion-plan.md): C#,
which the taxonomy already has, rather than a new `gdscript` value. CI runs its
recipe; nobody has verified it by hand, and nobody has run the game it
produces, so it is `tier: community`
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Every version was read from the NuGet API on 2026-09-25: `Godot.NET.Sdk`,
`GodotSharp`, `GodotSharpEditor` and `Godot.SourceGenerators` 4.7.2 (the
newest stable; 4.8 is in `dev` previews), `xunit.v3` 4.0.1.

Things that came out of running it rather than describing it:

- `dotnet build` of a Godot C# project works with no engine installed:
  `Godot.NET.Sdk` resolves from NuGet as an MSBuild SDK and brings
  `GodotSharp` with it. That is what made a recipe possible at all. Starting
  the game is a different matter, and `overview.md` lists what CI cannot prove.
- The SDK moves the game's `bin/` and `obj/` under `.godot/mono/temp/`. The
  recipe checks the game assembly there.
- Godot.NET.Sdk's project sits at the Godot project root, so its default glob
  compiled the rules and tests too. `Game.csproj` removes `src/**` and
  `tests/**` from compilation, and `.gdignore` files keep the editor's importer
  out of them.
- `xunit.v3` 4.x runs only on Microsoft.Testing.Platform, and the .NET 10
  `dotnet test` refuses the VSTest path for it. `global.json` opts in, and the
  test project is an executable with no `Microsoft.NET.Test.Sdk`.
- `dotnet new sln` produces a solution without `ExportDebug` and
  `ExportRelease`, which the editor builds with. `Game.sln` is written out with
  Godot's three configurations; the tests are built in `Debug` only.
- A missing `partial` on a node script is already an error from Godot's
  source generators (GD0001); a script whose class name differs from its file
  name compiles, so a test checks it.
- The boundary test was checked against the mistake it exists for: adding a
  `GodotSharp` reference to the rules project fails it.

Verified on Windows 11 with the .NET SDK 10.0.103 through
`forgeprint test-setup`: 26 steps, 27 tests passing, zero warnings.

### Planned

- A scene test in the engine, when a headless Godot can be obtained from a
  package registry. Not before.
- Web export, when Godot supports it for C#.
