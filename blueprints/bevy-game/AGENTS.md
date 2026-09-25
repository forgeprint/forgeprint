# AGENTS.md — Bevy game

A 2D game on Bevy 0.19.1, as a Cargo workspace of two crates. `game` holds the
rules as Bevy plugins and compiles no window, renderer or audio. `app` is a
thin binary that draws what the rules spawn. These rules are for an agent
about to change it.

## Commands

```bash
cargo fmt --all --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked -p game          # the rules, headless
cargo build --locked -p app          # the window binary; builds, cannot run in CI
cargo run --release -p app           # play it; debug Bevy is too slow to judge
```

## Where code goes

| Kind of code                                            | Where                            |
| ------------------------------------------------------- | -------------------------------- |
| A component, resource, state or system that decides     | `game/src/`                      |
| Anything that draws, plays a sound, or opens a window   | `app/src/view.rs`                |
| Reading a device (keyboard, gamepad, touch) into intent | `game/`, in `GameSystems::Input` |
| A test of a rule                                        | `game/tests/`                    |

- **`game` never enables a rendering, window or audio feature.** Its
  `Cargo.toml` asks Bevy for `std`, `bevy_state` and `keyboard` and nothing
  else. The recipe and the `check` job in CI list `game`'s dependency tree and
  fail if `bevy_render`, `bevy_winit`, `bevy_audio`, `bevy_gilrs`, `wgpu` or
  `winit` appears. The day one does, a rule can start depending on a window
  or a GPU that no test has, audio or gamepads bring system libraries into the
  test build, and every test run compiles the renderer first.
- **`app` decides nothing.** It adds a `Sprite` to entities the rules spawned
  and writes the status into the window title. If a change in `app` needs to
  write a component or resource from `game`, the change belongs in `game`.
- **A plugin per feature.** `RoundPlugin`, `PlayerPlugin`, `CoinPlugin`, all
  added by `GamePlugin`. A new feature is a new module with its own plugin,
  added to the tuple in `GamePlugin::build`, not systems appended to an
  existing one.
- **Devices are read in two places only**: `read_keyboard`, in
  `GameSystems::Input`, which turns keys into `MoveIntent`, and `restart`,
  which runs when no round is being played. Movement reads `MoveIntent`, never
  a device, so a gamepad is a second writer of `MoveIntent` and not a change to
  movement.

## Systems and ordering

Bevy runs systems in parallel and picks an order for any two that have none.
Two systems that touch the same data with no declared order are a bug that
shows up on some machines and not others.

- **Every system in `Update` is in exactly one `GameSystems` set**: `Input`,
  `Movement`, `Collection`, `Rules`. The sets are chained in `GamePlugin`, so
  that is the order every frame, and they all run only in
  `GameState::Playing`.
- **`systems_that_share_data_run_in_a_declared_order`** builds the schedule
  with ambiguity detection set to error. It fails when you add a system that
  conflicts with another and forget the order. Do not weaken it; add
  `.before`/`.after`, or put the system in the right set.
- A system that must run outside `Playing` (like `restart`) still gets an
  explicit order against anything that writes the same data.
- A new phase is a new variant of `GameSystems`, placed in the chain in
  `GamePlugin`. Not a system with `.after(some_other_system)` spread across
  modules.

## State

- **`GameState` is a Bevy `States` enum.** A system that only makes sense in
  one state says so with `run_if(in_state(..))`, not with a flag checked inside
  the system.
- **Spawning happens in `OnEnter(GameState::Playing)`; everything spawned
  there carries `LevelEntity`**, and `OnExit(Won)` and `OnExit(Lost)` despawn
  every `LevelEntity`. A new kind of entity in the level without the marker
  survives into the next round; the restart test catches a second player,
  not a stray enemy, so add the marker.
- **`NextState::set` runs `OnExit` and `OnEnter` even when the state does not
  change.** Setting `Playing` while already `Playing` resets the round and
  spawns a second level. Use `set_if_neq` where that is not the intent.
- **A state change is seen one frame later.** `NextState` is applied in the
  next frame's `StateTransition`. Tests call `app.update()` once more after the
  frame that decides.

## Time

- **Distance is speed times `time.delta_secs()`.** Never a fixed step per
  frame: the game would run faster on a faster machine.
  `distance_follows_time_not_the_number_of_frames` fails if you do.
- `Time` in `Update` is virtual time, which clamps a frame to 250 ms. A test
  frame longer than that silently advances less than it says.
- Timers (`RoundClock`) tick in a system inside a gated set, so they stop when
  the round ends.

## Commands are deferred

`commands.entity(e).despawn()` happens at the next sync point, not on the next
line. Bevy inserts one between two systems that have an order, so a system in
`Rules` sees what `Collection` despawned. Two systems in the same set with no
order between them do not. When a later system has to see an earlier one's
commands, order them.

## Tests

- Tests build the real game headless:
  `MinimalPlugins, StatesPlugin, InputPlugin, GamePlugin`, with
  `TimeUpdateStrategy::ManualDuration` so each `app.update()` is exactly one
  known frame.
- **Press keys by writing `KeyboardInput` messages**, as the window does. Do
  not mutate `ButtonInput<KeyCode>` directly: `InputPlugin` clears
  `just_pressed` at the start of every frame, before any game system sees it.
- Assert on the world: `State<GameState>`, resources, and queries for
  components. A test that only checks the app did not panic proves nothing.
- Integration tests in `game/tests/` use the crate's public API only. A rule
  that cannot be tested through it is missing a public type, not a test hook.

## Dependencies

- **Bevy is pinned with `=`**, and so is every Bevy crate through it. Bevy
  breaks its API in every minor release; an upgrade is its own change that
  follows the official migration guide, moves `rust-version` to what the new
  Bevy declares, and moves the `msrv` job in CI with it.
- `rust-version` is 1.95 because Bevy 0.19.1 declares it. The `msrv` job
  builds with exactly that.
- Clippy's `too_many_arguments` and `type_complexity` are allowed for the
  workspace, because Bevy systems trip them by design. Nothing else is.

## Adding what was left out

Each of these needs a system library on Linux, which is why none is on:

| Feature        | In `app/Cargo.toml`    | Linux packages (Debian and Ubuntu names)           |
| -------------- | ---------------------- | -------------------------------------------------- |
| Audio          | `bevy_audio`, `vorbis` | `libasound2-dev`, `pkg-config`                     |
| Gamepads       | `bevy_gilrs`           | `libudev-dev`, `pkg-config`                        |
| Native Wayland | `wayland`              | `libwayland-dev`, `libxkbcommon-dev`, `pkg-config` |

Installing them is the developer's one-time step on their own machine, with
their package manager and their privileges. The `check` job in
`.github/workflows/ci.yml` then needs the same packages before
`cargo build -p app`, or it goes red. The rules crate needs none of them and
its tests stay as they are.

## When you are asked to add a kind of entity (an enemy, a pickup)

1. A module in `game/src/` with its component, its systems, and a plugin.
2. Spawn it in `OnEnter(GameState::Playing)` with `LevelEntity`.
3. Put each `Update` system in the `GameSystems` set that matches what it
   does.
4. If it changes how a round ends, change `decide_outcome` in `round.rs`, and
   say in a test which wins when two outcomes land on the same frame.
5. Add the plugin to `GamePlugin`.
6. Tests in `game/tests/` that drive it through frames and assert on the world.
7. Give it a sprite in `app/src/view.rs`, the same way `dress_coins` does.
8. `cargo test -p game` and `cargo clippy --workspace --all-targets` both
   green.
