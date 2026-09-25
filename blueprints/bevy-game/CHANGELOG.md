# Changelog — bevy-game

## 1.0.0 — 2026-09-25

First version.

A 2D desktop game on Bevy 0.19.1 as a two-crate workspace: the rules as ECS
plugins in a crate with no window, renderer or audio, tested headless by
driving a real Bevy `App` frame by frame, and a thin binary that draws them.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where `bevy` showed 1.5M downloads in 90 days on crates.io and
bevyengine/bevy 48.4k stars, and the catalog had no `game` blueprint at all.
It is the Rust one of three: `phaser-web-game` and `godot-game` were drafted
alongside it. Its recipe runs in CI like every other; it was not run by hand, and
nobody has built a game on it, so it is `tier: community` and says so wherever
it is served ([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Versions read from crates.io on 2026-09-25: bevy 0.19.1 (2026-08-13), whose
declared `rust-version` is 1.95; 0.20.0-rc.1 exists and is not used. That is
where the blueprint's `rust-version` and `cargo>=1.95` come from.

What was run before the recipe was written, in `rust:1.98.1-slim-trixie` (a
Debian image with no display and no audio, input or X11 development
packages): `cargo fmt --check`, `cargo clippy -D warnings` on both crates,
`cargo test -p game` (13 tests), and `cargo build -p app`, whose binary links
against the C library alone. In `rust:1.95.0-slim-trixie`: the same tests and
`cargo check` of both crates. Then the recipe itself, all 19 steps, in a fresh
container. Ten deliberate breakages of the rules — no set ordering, no
normalised diagonal, no arena clamp, losing checked before winning, no
despawn on leaving a round, no order on restart, restart allowed mid-round, no
score reset, a clock that ticks after the round, a fixed step per frame — each
made at least one test fail.

Decisions worth arguing about:

- **Two crates.** The rules build and test with no display, GPU or system
  library; the view is the only code that cannot be tested in CI, and it is
  the smallest.
- **The window binary leaves out audio, gamepads and native Wayland**, the
  three Bevy features that need a system library to build on Linux. The
  result builds on a bare runner and in the recipe. `AGENTS.md` lists each
  feature and its packages.
- **An ambiguity test.** Bevy's scheduler can report systems that touch the
  same data with no order between them; the tests turn that report into a
  failure.
- **Keys through `KeyboardInput` messages**, the way the window delivers them,
  rather than by setting `ButtonInput` directly, which `InputPlugin` would
  clear before the game saw a fresh press.
- **No `rust-toolchain.toml`**, the same as `rust-cli`: it would have rustup
  download a toolchain mid-recipe from a host that is not a package registry.
- **No `cargo fmt` repair step.** The open tooling fix for blank lines in code
  blocks does not touch this recipe: rustfmt never leaves two blank lines in a
  row, so there is nothing for option resolution to collapse.

### Planned

Nothing is promised. The obvious next versions, if somebody asks: a
WebAssembly build, audio behind the feature and the packages `AGENTS.md`
names, and a Windows job in the generated CI.
