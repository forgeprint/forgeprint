# Bevy Game

A 2D desktop game in Rust on Bevy 0.19.1, as a Cargo workspace of two crates:
`game`, the rules as ECS plugins with no window, renderer or audio compiled
in, and `app`, a thin binary that draws them. The rules are tested by running
the real plugins in a Bevy `App` with no window, one frame at a time.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has shipped a game on it, which is
what `tier: official` means in this catalog and why this is `community`.

## What you get

- **Bevy 0.19.1**, pinned exactly (`=0.19.1`), with default features off in
  both crates. Rust edition 2024, `rust-version = "1.95"` because that is what
  Bevy 0.19.1 declares, and a committed `Cargo.lock`.
- A small, complete game to replace: move with the arrow keys or WASD, collect
  five coins before a 30-second clock runs out, Space to play again.
- **A plugin per feature**: `RoundPlugin` (a `States` enum of `Playing`, `Won`
  and `Lost`, the clock, the score, the rule that ends a round, restart),
  `PlayerPlugin` and `CoinPlugin`, gathered by `GamePlugin`.
- **Systems in sets with an explicit order**: `Input`, `Movement`,
  `Collection`, `Rules`, chained, and all gated on `Playing`.
- **Thirteen headless tests** that build the game with `MinimalPlugins`, feed
  it keys as `KeyboardInput` messages, advance a fixed 100 ms per
  `app.update()`, and assert on the world: speed, diagonals, the arena edge,
  that distance follows time rather than frame count, collecting, winning,
  losing, a coin on the last frame beating the clock, nothing moving after the
  round, and a restart that leaves exactly one player.
- **A test that fails on unordered systems**: it builds the schedules with
  Bevy's ambiguity detection set to error, so two systems that touch the same
  data with no order between them fail the build.
- **A boundary the recipe checks**: `cargo tree` of the rules crate must not
  contain `bevy_render`, `bevy_winit`, `bevy_audio`, `bevy_gilrs`, `wgpu` or
  `winit`.
- **A window binary that builds on a bare Linux runner.** It uses Bevy's 2D
  renderer and a winit window on X11, and leaves out audio, gamepads and native
  Wayland, which are the features that need system libraries to build. It
  links against nothing but the C library; X11 and the GPU driver are loaded
  when it starts.
- A CI workflow with actions pinned by commit SHA, read-only permissions, a
  pinned toolchain, a build cache keyed on `Cargo.lock`, and an `msrv` job on
  Rust 1.95.0.

## Options

None. Which Bevy features the window binary turns on is a list in
`app/Cargo.toml`, and `AGENTS.md` says what each one left out costs to add.

## What CI can prove, and what it cannot

CI proves the rules (the headless tests), the order of the systems (the
ambiguity test), the boundary (the dependency tree), that both crates pass
clippy with warnings as errors, that the window binary compiles and links,
and — in the generated project's own CI — that the rules build on Rust 1.95.

CI **cannot** prove any of these, and this blueprint does not pretend to:

- **Rendering.** No test opens a window or touches a GPU. A sprite in the
  wrong colour, off screen, or never drawn at all passes every test. The view
  code in `app` is compiled and linted, never run.
- **Input feel.** Tests write key messages directly; they do not prove the
  window receives them, how key repeat behaves, or what latency feels like.
  Gamepads and touch are not supported.
- **Audio.** The game has none, and the feature that would add it is off.
- **Performance.** Nothing measures frame rate, and the tests use a fixed frame
  length. A debug build of Bevy is slow enough to mislead; judge speed with
  `cargo run --release`.
- **Windows and macOS.** The manifest lists them because Bevy supports them
  and nothing here is Linux-specific, but CI builds only on Linux.
- **That the binary starts.** It needs a display and a Vulkan or OpenGL
  driver, and a CI runner has neither.

## What it fits

- A 2D desktop game in Rust: arcade, puzzle, top-down, a game-jam entry.
- Somebody who knows Rust and wants ECS rules that are tested from the first
  commit, rather than verified by playing.
- A game whose logic is worth running headless later: a server, a replay
  checker, an AI opponent trained against the rules.

## What it is NOT for

- **A game in the browser.** Bevy can target WebAssembly, but this blueprint
  does not set it up. For a 2D browser game, pick **`phaser-web-game`**: Phaser
  in TypeScript, static files, a size budget.
- **A game that needs an editor, an animation timeline, or console exports.**
  Pick **`godot-game`**: Godot in C#, with a scene editor and export templates
  this code-only project will never have.
- **Somebody new to Rust.** Bevy leans on the type system (queries, system
  parameters, plugins) and breaks its API every minor release. The borrow
  checker and the ECS at the same time is a hard first project.
- **3D.** The window binary enables only the 2D renderer. Bevy does 3D well,
  but the feature list, the camera and the tests here are 2D.
- **Audio, gamepads, native Wayland**, as shipped. Each is a feature and a
  system library away; `AGENTS.md` lists both, and the CI job that builds the
  binary then needs the library installed.
- **Multiplayer.** No networking. Bevy has no built-in networking either.
- **Mobile app stores.** Bevy's iOS and Android support is not set up here.

## Trade-offs made on your behalf

- **Two crates, not one.** The split costs a workspace and a `pub` API
  between the rules and the view. It buys rules that build and test without a
  display, GPU, or system library, and a boundary a command can check.
- **Default features off.** Bevy's defaults pull in 2D, 3D, UI and audio, and
  on Linux need ALSA and libudev to build. Off, the rules crate compiles a
  small fraction of Bevy and the binary builds on a bare runner. The cost is
  a feature list to maintain; a new Bevy capability starts as a line there.
- **The rules use `Transform` directly**, not a position component of their
  own. It is idiomatic Bevy and it is what the renderer reads, so there is no
  sync system to forget. It also means the rules depend on Bevy itself, not
  only on plain Rust: they are tested through Bevy, the way they run.
- **Variable time step in `Update`**, not `FixedUpdate`. Simpler for a small
  arcade game. A game with physics, or one that has to replay exactly from
  inputs, should move its movement and rules to `FixedUpdate`.
- **Fixed coin positions, no randomness.** A round is the same every time and
  a test can walk to each coin. A game that wants variety adds a seeded
  generator as a resource, so tests can still fix the seed.
- **Status in the window title**, not on-screen text, so no font file is
  bundled and no text feature is needed.
- **No dev-profile tuning.** Bevy's guide suggests optimising dependencies in
  debug builds, which makes the game playable in debug and every clean build
  slower. CI builds clean often, so the recipe keeps the default and the
  README says to play with `--release`.
- **No `rust-toolchain.toml`**: it would have rustup download a toolchain in
  the middle of the recipe, from a host that is not a package registry.

## Cost of adoption

Rust 1.95 or newer, with rustfmt and clippy. No system package is needed to
build either crate. Compile time is the real cost: the recipe's first build
compiles over four hundred crates and took around ten minutes on a
three-core container, most of it the window binary; the rules crate alone
builds and tests in about a minute. Incremental builds after that are seconds,
and the generated CI caches the dependencies. No account and no paid service.
