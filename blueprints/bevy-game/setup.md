# Setup

Creates a 2D game on Bevy 0.19.1 as a Cargo workspace of two crates: `game`,
the rules as Bevy plugins with no window, renderer or audio compiled in, and
`app`, a thin binary that draws them in a window. The rules are tested headless
by driving a real Bevy `App` one frame at a time.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Rust 1.95 or newer through rustup, with the rustfmt and clippy
components. No toolchain file is written: it would make rustup download a
toolchain in the middle of the recipe. No system package is needed to build
either crate; running the window binary needs a desktop, and no step here
runs it.

The first build compiles several hundred crates and takes minutes, not
seconds. Later builds reuse them.

1. Create `Cargo.toml`, the workspace manifest, with:

   ```toml
   [workspace]
   # `game` is the rules: components, resources, systems and states, with no
   # window, renderer or audio compiled in. `app` is the thin binary that puts
   # them on a screen. The split is what lets the rules build and test on a
   # machine with no display and no system libraries.
   members = ["game", "app"]
   resolver = "3"

   [workspace.package]
   version = "0.1.0"
   edition = "2024"
   # The oldest Rust this builds with. Bevy 0.19.1 declares 1.95, and nothing it
   # pulls in asks for more. The msrv job in CI builds with exactly this
   # toolchain, so the number is checked rather than hoped for.
   rust-version = "1.95"
   # A game, not a library for crates.io.
   publish = false

   [workspace.dependencies]
   # `=` is an exact pin: Bevy breaks its API in every minor release, and
   # `cargo update` must not move it. Each member turns on only the features it
   # needs; with the defaults off, nothing here pulls in a window or audio.
   bevy = { version = "=0.19.1", default-features = false }
   game = { path = "game" }

   [workspace.lints.rust]
   unsafe_code = "forbid"

   [workspace.lints.clippy]
   # Bevy systems take their data as parameters and their filters as types, so
   # these two fire on ordinary, idiomatic systems. Bevy's own guide allows both.
   too_many_arguments = "allow"
   type_complexity = "allow"
   ```

   Verify: `grep -q 'rust-version = "1.95"' Cargo.toml`

2. Create `game/Cargo.toml`, the rules crate's manifest, with:

   ```toml
   [package]
   name = "game"
   description = "The rules of the game, as Bevy plugins with no window, renderer or audio."
   version.workspace = true
   edition.workspace = true
   rust-version.workspace = true
   publish.workspace = true

   [dependencies]
   # ECS, app, time, transform and input are always in Bevy. On top of them:
   # `std`, `States` and the keyboard. Adding a rendering, window or audio feature
   # here is what the boundary check in the recipe fails on.
   bevy = { workspace = true, features = ["std", "bevy_state", "keyboard"] }

   [lints]
   workspace = true
   ```

   Verify: `grep -q '"bevy_state"' game/Cargo.toml`

3. Create `game/src/lib.rs`, the rules crate root, with the system sets and the game plugin, with:

   ```rust
   //! The rules of the game, as Bevy plugins. Nothing in this crate opens a
   //! window, draws, or plays a sound: the `app` crate does that on top of these
   //! plugins. What is here builds and tests anywhere Rust does.
   //!
   //! The game: move with the arrow keys or WASD, collect every coin before the
   //! clock runs out, press Space to play again.

   mod coins;
   mod player;
   mod round;

   use bevy::prelude::*;

   pub use coins::{COIN_POSITIONS, Coin, CoinPlugin, PICKUP_RADIUS};
   pub use player::{ARENA_HALF_SIZE, MoveIntent, PLAYER_SPEED, Player, PlayerPlugin};
   pub use round::{GameState, LevelEntity, ROUND_SECONDS, RoundClock, RoundPlugin, Score};

   /// The order the game's systems run in, every frame of a round. Every system
   /// in `Update` belongs to exactly one of these, and a test fails the build
   /// when two systems touch the same data with no order between them.
   #[derive(SystemSet, Debug, Clone, Copy, PartialEq, Eq, Hash)]
   pub enum GameSystems {
       /// Devices become intent. The only set that reads an input device.
       Input,
       /// Intent becomes movement.
       Movement,
       /// Whatever touches something it can pick up, does.
       Collection,
       /// The clock ticks, and the round is won or lost.
       Rules,
   }

   /// The whole game: its state, its plugins, and the order of their systems.
   ///
   /// Needs `StatesPlugin` and `InputPlugin` added before it. `DefaultPlugins`
   /// brings both; a headless test adds them itself.
   pub struct GamePlugin;

   impl Plugin for GamePlugin {
       fn build(&self, app: &mut App) {
           app.init_state::<GameState>()
               .configure_sets(
                   Update,
                   (
                       GameSystems::Input,
                       GameSystems::Movement,
                       GameSystems::Collection,
                       GameSystems::Rules,
                   )
                       .chain()
                       .run_if(in_state(GameState::Playing)),
               )
               .add_plugins((RoundPlugin, PlayerPlugin, CoinPlugin));
       }
   }
   ```

   Verify: `test -f game/src/lib.rs`

4. Create `game/src/round.rs`, the round: states, clock, score and the win and lose rule, with:

   ```rust
   //! A round: the state machine, the clock, the score, and the rule that ends
   //! it.

   use bevy::prelude::*;

   use crate::{Coin, GameSystems};

   /// How long a round lasts.
   pub const ROUND_SECONDS: f32 = 30.0;

   /// Where the game is. Systems that only make sense in one state say so with
   /// `run_if(in_state(..))`, rather than checking a flag inside the system.
   #[derive(States, Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
   pub enum GameState {
       #[default]
       Playing,
       Won,
       Lost,
   }

   /// Coins collected this round.
   #[derive(Resource, Debug, Default, Clone, Copy, PartialEq, Eq)]
   pub struct Score(pub u32);

   /// Time left in the round. It ticks only while the round is being played.
   #[derive(Resource, Debug)]
   pub struct RoundClock(pub Timer);

   impl Default for RoundClock {
       fn default() -> Self {
           Self(Timer::from_seconds(ROUND_SECONDS, TimerMode::Once))
       }
   }

   /// Everything a round spawns carries this, and all of it goes when the round
   /// is left. A new kind of entity in the level gets it too, or it outlives the
   /// round it belongs to.
   #[derive(Component, Debug)]
   pub struct LevelEntity;

   pub struct RoundPlugin;

   impl Plugin for RoundPlugin {
       fn build(&self, app: &mut App) {
           app.init_resource::<Score>()
               .init_resource::<RoundClock>()
               .add_systems(OnEnter(GameState::Playing), reset_round)
               .add_systems(OnExit(GameState::Won), despawn_level)
               .add_systems(OnExit(GameState::Lost), despawn_level)
               .add_systems(
                   Update,
                   (
                       (tick_clock, decide_outcome)
                           .chain()
                           .in_set(GameSystems::Rules),
                       // Both this and `decide_outcome` set the next state. They
                       // never run in the same frame, but the schedule cannot
                       // know that, so the order is written down.
                       restart
                           .after(GameSystems::Rules)
                           .run_if(not(in_state(GameState::Playing))),
                   ),
               );
       }
   }

   fn reset_round(mut score: ResMut<Score>, mut clock: ResMut<RoundClock>) {
       *score = Score::default();
       *clock = RoundClock::default();
   }

   fn tick_clock(time: Res<Time>, mut clock: ResMut<RoundClock>) {
       clock.0.tick(time.delta());
   }

   /// Winning is checked first: collecting the last coin on the frame the clock
   /// runs out is a win.
   fn decide_outcome(
       coins: Query<(), With<Coin>>,
       clock: Res<RoundClock>,
       mut next: ResMut<NextState<GameState>>,
   ) {
       if coins.is_empty() {
           next.set(GameState::Won);
       } else if clock.0.is_finished() {
           next.set(GameState::Lost);
       }
   }

   fn restart(keys: Res<ButtonInput<KeyCode>>, mut next: ResMut<NextState<GameState>>) {
       if keys.just_pressed(KeyCode::Space) {
           next.set(GameState::Playing);
       }
   }

   fn despawn_level(mut commands: Commands, level: Query<Entity, With<LevelEntity>>) {
       for entity in &level {
           commands.entity(entity).despawn();
       }
   }
   ```

   Verify: `test -f game/src/round.rs`

5. Create `game/src/player.rs`, the player plugin, with:

   ```rust
   //! The player: one entity, steered by intent, kept inside the arena.

   use bevy::prelude::*;

   use crate::{GameState, GameSystems, LevelEntity};

   /// World units per second.
   pub const PLAYER_SPEED: f32 = 240.0;

   /// Half the width and height of the arena, centred on the origin. The player's
   /// centre never leaves it.
   pub const ARENA_HALF_SIZE: Vec2 = Vec2::new(320.0, 240.0);

   #[derive(Component, Debug)]
   pub struct Player;

   /// Where the player is trying to go this frame, as a direction. Movement reads
   /// this and nothing else; the keyboard is one thing that writes it. A gamepad
   /// or touch control is another writer in `GameSystems::Input`, not a change
   /// to movement.
   #[derive(Resource, Debug, Default, Clone, Copy, PartialEq)]
   pub struct MoveIntent(pub Vec2);

   pub struct PlayerPlugin;

   impl Plugin for PlayerPlugin {
       fn build(&self, app: &mut App) {
           app.init_resource::<MoveIntent>()
               .add_systems(OnEnter(GameState::Playing), spawn_player)
               .add_systems(
                   Update,
                   (
                       read_keyboard.in_set(GameSystems::Input),
                       move_player.in_set(GameSystems::Movement),
                   ),
               );
       }
   }

   fn spawn_player(mut commands: Commands) {
       commands.spawn((Player, LevelEntity, Transform::default()));
   }

   fn read_keyboard(keys: Res<ButtonInput<KeyCode>>, mut intent: ResMut<MoveIntent>) {
       let mut direction = Vec2::ZERO;
       if keys.any_pressed([KeyCode::ArrowLeft, KeyCode::KeyA]) {
           direction.x -= 1.0;
       }
       if keys.any_pressed([KeyCode::ArrowRight, KeyCode::KeyD]) {
           direction.x += 1.0;
       }
       if keys.any_pressed([KeyCode::ArrowDown, KeyCode::KeyS]) {
           direction.y -= 1.0;
       }
       if keys.any_pressed([KeyCode::ArrowUp, KeyCode::KeyW]) {
           direction.y += 1.0;
       }
       intent.0 = direction;
   }

   /// Distance is speed times the frame's duration, never a fixed step per
   /// frame: a fixed step makes the game run faster on a faster machine.
   fn move_player(
       time: Res<Time>,
       intent: Res<MoveIntent>,
       mut players: Query<&mut Transform, With<Player>>,
   ) {
       // Normalised, so a diagonal is no faster than a straight line.
       let step = intent.0.normalize_or_zero() * PLAYER_SPEED * time.delta_secs();
       for mut transform in &mut players {
           let next =
               (transform.translation.truncate() + step).clamp(-ARENA_HALF_SIZE, ARENA_HALF_SIZE);
           transform.translation = next.extend(transform.translation.z);
       }
   }
   ```

   Verify: `test -f game/src/player.rs`

6. Create `game/src/coins.rs`, the coin plugin, with:

   ```rust
   //! Coins: placed when a round starts, collected by touching them.

   use bevy::prelude::*;

   use crate::{GameState, GameSystems, LevelEntity, Player, Score};

   /// Where the coins are. Fixed rather than random, so a round is the same
   /// every time and a test can walk to each one.
   pub const COIN_POSITIONS: [Vec2; 5] = [
       Vec2::new(-240.0, 160.0),
       Vec2::new(240.0, 160.0),
       Vec2::new(0.0, -180.0),
       Vec2::new(-200.0, -120.0),
       Vec2::new(200.0, -120.0),
   ];

   /// How close the player's centre has to come to a coin's centre to collect it.
   pub const PICKUP_RADIUS: f32 = 24.0;

   #[derive(Component, Debug)]
   pub struct Coin;

   pub struct CoinPlugin;

   impl Plugin for CoinPlugin {
       fn build(&self, app: &mut App) {
           app.add_systems(OnEnter(GameState::Playing), spawn_coins)
               .add_systems(Update, collect_coins.in_set(GameSystems::Collection));
       }
   }

   fn spawn_coins(mut commands: Commands) {
       for position in COIN_POSITIONS {
           commands.spawn((
               Coin,
               LevelEntity,
               Transform::from_translation(position.extend(0.0)),
           ));
       }
   }

   fn collect_coins(
       mut commands: Commands,
       players: Query<&Transform, With<Player>>,
       coins: Query<(Entity, &Transform), With<Coin>>,
       mut score: ResMut<Score>,
   ) {
       for player in &players {
           let at = player.translation.truncate();
           for (coin, transform) in &coins {
               if at.distance(transform.translation.truncate()) <= PICKUP_RADIUS {
                   // Deferred to the end of the set. The rules run after this
                   // set, so Bevy applies the despawn before they count coins.
                   commands.entity(coin).despawn();
                   score.0 += 1;
               }
           }
       }
   }
   ```

   Verify: `test -f game/src/coins.rs`

7. Create `game/tests/rules.rs`, the headless tests of the rules, with:

   ```rust
   //! The game, run headless: the real plugins in a Bevy `App` with no window,
   //! driven one frame at a time with `app.update()`, a clock that advances
   //! exactly one tenth of a second per frame, and keys pressed by writing the
   //! same `KeyboardInput` messages a window would.

   use std::time::Duration;

   use bevy::ecs::schedule::{LogLevel, ScheduleBuildSettings, ScheduleLabel};
   use bevy::input::ButtonState;
   use bevy::input::InputPlugin;
   use bevy::input::keyboard::{Key, KeyboardInput};
   use bevy::prelude::*;
   use bevy::state::app::StatesPlugin;
   use bevy::time::TimeUpdateStrategy;
   use game::{
       ARENA_HALF_SIZE, COIN_POSITIONS, Coin, GamePlugin, GameState, PLAYER_SPEED, Player, RoundClock,
       Score,
   };

   const FRAME: Duration = Duration::from_millis(100);

   /// The game with no window, after its first frame: a round has started.
   fn headless() -> App {
       headless_at(FRAME)
   }

   /// The same, on a machine whose frames last `frame`.
   fn headless_at(frame: Duration) -> App {
       let mut app = App::new();
       app.add_plugins((MinimalPlugins, StatesPlugin, InputPlugin, GamePlugin))
           .insert_resource(TimeUpdateStrategy::ManualDuration(frame));
       app.update();
       app
   }

   fn frames(app: &mut App, count: u32) {
       for _ in 0..count {
           app.update();
       }
   }

   fn key(app: &mut App, key_code: KeyCode, state: ButtonState) {
       app.world_mut().write_message(KeyboardInput {
           key_code,
           logical_key: Key::Dead(None),
           state,
           text: None,
           repeat: false,
           window: Entity::PLACEHOLDER,
       });
   }

   fn state(app: &App) -> GameState {
       *app.world().resource::<State<GameState>>().get()
   }

   fn score(app: &App) -> u32 {
       app.world().resource::<Score>().0
   }

   fn coins_left(app: &mut App) -> usize {
       let world = app.world_mut();
       world.query_filtered::<(), With<Coin>>().iter(world).count()
   }

   fn player_at(app: &mut App) -> Vec2 {
       let world = app.world_mut();
       world
           .query_filtered::<&Transform, With<Player>>()
           .single(world)
           .expect("exactly one player")
           .translation
           .truncate()
   }

   fn put_player(app: &mut App, at: Vec2) {
       let world = app.world_mut();
       let mut transform = world
           .query_filtered::<&mut Transform, With<Player>>()
           .single_mut(world)
           .expect("exactly one player");
       transform.translation = at.extend(0.0);
   }

   /// Leaves `left` seconds on the round's clock.
   fn clock_at(app: &mut App, left: Duration) {
       let mut clock = app.world_mut().resource_mut::<RoundClock>();
       let total = clock.0.duration();
       clock.0.set_elapsed(total - left);
   }

   #[test]
   fn a_round_starts_with_the_player_in_the_middle_and_every_coin_out() {
       let mut app = headless();

       assert_eq!(state(&app), GameState::Playing);
       assert_eq!(player_at(&mut app), Vec2::ZERO);
       assert_eq!(coins_left(&mut app), COIN_POSITIONS.len());
       assert_eq!(score(&app), 0);
   }

   #[test]
   fn holding_a_key_moves_the_player_at_its_speed() {
       let mut app = headless();

       key(&mut app, KeyCode::ArrowRight, ButtonState::Pressed);
       frames(&mut app, 5);

       // Five frames of a tenth of a second each.
       let moved = player_at(&mut app);
       assert!(
           (moved.x - PLAYER_SPEED * 0.5).abs() < 1e-3,
           "moved to {moved}"
       );
       assert_eq!(moved.y, 0.0);

       key(&mut app, KeyCode::ArrowRight, ButtonState::Released);
       frames(&mut app, 5);
       assert_eq!(player_at(&mut app), moved, "released keys stop the player");
   }

   #[test]
   fn distance_follows_time_not_the_number_of_frames() {
       // A machine twice as fast: twice the frames, each half as long.
       let mut app = headless_at(FRAME / 2);

       key(&mut app, KeyCode::ArrowRight, ButtonState::Pressed);
       frames(&mut app, 10);

       let moved = player_at(&mut app);
       assert!(
           (moved.x - PLAYER_SPEED * 0.5).abs() < 1e-3,
           "moved to {moved}"
       );
   }

   #[test]
   fn a_diagonal_is_no_faster_than_a_straight_line() {
       let mut app = headless();

       key(&mut app, KeyCode::KeyW, ButtonState::Pressed);
       key(&mut app, KeyCode::KeyD, ButtonState::Pressed);
       frames(&mut app, 5);

       let distance = player_at(&mut app).length();
       assert!(
           (distance - PLAYER_SPEED * 0.5).abs() < 1e-3,
           "moved {distance}"
       );
   }

   #[test]
   fn the_player_stops_at_the_edge_of_the_arena() {
       let mut app = headless();

       key(&mut app, KeyCode::ArrowLeft, ButtonState::Pressed);
       frames(&mut app, 30);

       assert_eq!(player_at(&mut app).x, -ARENA_HALF_SIZE.x);
   }

   #[test]
   fn touching_a_coin_scores_it_and_removes_it() {
       let mut app = headless();

       put_player(&mut app, COIN_POSITIONS[0]);
       app.update();

       assert_eq!(score(&app), 1);
       assert_eq!(coins_left(&mut app), COIN_POSITIONS.len() - 1);
   }

   #[test]
   fn collecting_every_coin_wins_the_round() {
       let mut app = headless();

       for coin in COIN_POSITIONS {
           put_player(&mut app, coin);
           app.update();
       }
       // The state changes on the frame after the rule decides.
       app.update();

       assert_eq!(state(&app), GameState::Won);
       assert_eq!(score(&app), COIN_POSITIONS.len() as u32);
   }

   #[test]
   fn the_round_is_lost_when_the_clock_runs_out() {
       let mut app = headless();

       // 29 seconds in: still playing.
       frames(&mut app, 290);
       assert_eq!(state(&app), GameState::Playing);

       frames(&mut app, 20);
       assert_eq!(state(&app), GameState::Lost);
   }

   #[test]
   fn the_last_coin_on_the_last_frame_is_a_win() {
       let mut app = headless();
       let (last, rest) = COIN_POSITIONS.split_last().expect("coins");
       for coin in rest {
           put_player(&mut app, *coin);
           app.update();
       }

       // Less than one frame left: this frame both finishes the clock and
       // collects the last coin.
       clock_at(&mut app, FRAME / 2);
       put_player(&mut app, *last);
       frames(&mut app, 2);

       assert_eq!(state(&app), GameState::Won);
   }

   #[test]
   fn nothing_moves_and_the_clock_stops_once_the_round_is_over() {
       let mut app = headless();
       clock_at(&mut app, Duration::ZERO);
       frames(&mut app, 2);
       assert_eq!(state(&app), GameState::Lost);

       let elapsed = app.world().resource::<RoundClock>().0.elapsed();
       key(&mut app, KeyCode::ArrowRight, ButtonState::Pressed);
       frames(&mut app, 5);

       assert_eq!(player_at(&mut app), Vec2::ZERO);
       assert_eq!(app.world().resource::<RoundClock>().0.elapsed(), elapsed);
   }

   #[test]
   fn space_after_the_round_ends_starts_a_fresh_one() {
       let mut app = headless();
       put_player(&mut app, COIN_POSITIONS[0]);
       app.update();
       clock_at(&mut app, Duration::ZERO);
       frames(&mut app, 2);
       assert_eq!(state(&app), GameState::Lost);

       key(&mut app, KeyCode::Space, ButtonState::Pressed);
       frames(&mut app, 2);

       assert_eq!(state(&app), GameState::Playing);
       assert_eq!(score(&app), 0);
       assert_eq!(coins_left(&mut app), COIN_POSITIONS.len());
       // `player_at` fails unless there is exactly one: the old round's player
       // went with the old round.
       assert_eq!(player_at(&mut app), Vec2::ZERO);
   }

   #[test]
   fn space_during_a_round_does_not_restart_it() {
       let mut app = headless();
       put_player(&mut app, COIN_POSITIONS[0]);
       app.update();

       key(&mut app, KeyCode::Space, ButtonState::Pressed);
       frames(&mut app, 2);

       assert_eq!(state(&app), GameState::Playing);
       assert_eq!(score(&app), 1);
       assert_eq!(coins_left(&mut app), COIN_POSITIONS.len() - 1);
   }

   #[test]
   fn systems_that_share_data_run_in_a_declared_order() {
       // Bevy runs systems in parallel. Two systems that touch the same data
       // with no order between them run in whichever order the scheduler picks,
       // and the game behaves differently from one run to the next. This makes
       // that a build error instead of a bug report.
       let mut app = App::new();
       app.add_plugins((MinimalPlugins, StatesPlugin, InputPlugin, GamePlugin));
       for schedule in [Update.intern(), OnEnter(GameState::Playing).intern()] {
           app.edit_schedule(schedule, |schedule| {
               schedule.set_build_settings(ScheduleBuildSettings {
                   ambiguity_detection: LogLevel::Error,
                   ..default()
               });
           });
       }

       frames(&mut app, 2);
   }
   ```

   Verify: `test -f game/tests/rules.rs`

8. Create `app/Cargo.toml`, the window binary's manifest, with:

   ```toml
   [package]
   name = "app"
   description = "The game in a window: the rules from `game`, drawn with Bevy's 2D renderer."
   version.workspace = true
   edition.workspace = true
   rust-version.workspace = true
   publish.workspace = true

   [[bin]]
   name = "example"
   path = "src/main.rs"

   [dependencies]
   game.workspace = true
   # The 2D renderer, a window through winit on X11 (and on Wayland desktops
   # through XWayland), and the keyboard. Left out on purpose: audio (ALSA on
   # Linux), gamepads (libudev on Linux) and native Wayland, each of which needs
   # a system library to build. Adding one is a sentence in AGENTS.md.
   bevy = { workspace = true, features = [
       "default_app",
       "multi_threaded",
       "2d_bevy_render",
       "bevy_winit",
       "x11",
       "keyboard",
   ] }

   [lints]
   workspace = true
   ```

   Verify: `grep -q '"2d_bevy_render"' app/Cargo.toml`

9. Create `app/src/main.rs`, the window binary, with:

   ```rust
   //! The game in a window. This crate draws what the rules in `game` spawn and
   //! nothing else: no rule, no score and no state change is decided here.

   mod view;

   use bevy::prelude::*;

   fn main() -> AppExit {
       App::new()
           .add_plugins((
               // Brings the window, the renderer, input and `States`, which
               // `GamePlugin` needs to be added before it.
               DefaultPlugins.set(WindowPlugin {
                   primary_window: Some(Window {
                       title: "example".into(),
                       ..default()
                   }),
                   ..default()
               }),
               game::GamePlugin,
               view::ViewPlugin,
           ))
           .run()
   }
   ```

   Verify: `test -f app/src/main.rs`

10. Create `app/src/view.rs`, the view plugin, which draws what the rules spawn, with:

    ```rust
    //! How the game looks: a camera, the arena, a square for the player and one
    //! for each coin, and the round's status in the window title. Everything here
    //! reads the game's components and resources; nothing writes them.

    use bevy::prelude::*;
    use bevy::window::PrimaryWindow;
    use game::{ARENA_HALF_SIZE, COIN_POSITIONS, Coin, GameState, Player, RoundClock, Score};

    const PLAYER_SIZE: f32 = 32.0;
    const COIN_SIZE: f32 = 20.0;

    pub struct ViewPlugin;

    impl Plugin for ViewPlugin {
        fn build(&self, app: &mut App) {
            app.add_systems(Startup, (spawn_camera, spawn_arena))
                .add_systems(Update, (dress_players, dress_coins, show_status));
        }
    }

    fn spawn_camera(mut commands: Commands) {
        commands.spawn(Camera2d);
    }

    fn spawn_arena(mut commands: Commands) {
        commands.spawn((
            Sprite::from_color(
                Color::srgb(0.12, 0.12, 0.16),
                (ARENA_HALF_SIZE + PLAYER_SIZE / 2.0) * 2.0,
            ),
            Transform::from_xyz(0.0, 0.0, -1.0),
        ));
    }

    /// The rules spawn a `Player` with a position and nothing to draw; this gives
    /// it a sprite the frame after.
    fn dress_players(mut commands: Commands, added: Query<Entity, Added<Player>>) {
        for entity in &added {
            commands.entity(entity).insert(Sprite::from_color(
                Color::srgb(0.35, 0.7, 1.0),
                Vec2::splat(PLAYER_SIZE),
            ));
        }
    }

    fn dress_coins(mut commands: Commands, added: Query<Entity, Added<Coin>>) {
        for entity in &added {
            commands.entity(entity).insert(Sprite::from_color(
                Color::srgb(1.0, 0.8, 0.2),
                Vec2::splat(COIN_SIZE),
            ));
        }
    }

    /// The status goes in the window title, which needs no font file.
    fn show_status(
        state: Res<State<GameState>>,
        score: Res<Score>,
        clock: Res<RoundClock>,
        mut window: Single<&mut Window, With<PrimaryWindow>>,
    ) {
        let status = match state.get() {
            GameState::Playing => format!(
                "Coins {}/{}, {:.0}s left",
                score.0,
                COIN_POSITIONS.len(),
                clock.0.remaining_secs().ceil()
            ),
            GameState::Won => "You won. Space to play again".to_owned(),
            GameState::Lost => "Out of time. Space to play again".to_owned(),
        };
        if window.title != status {
            window.title = status;
        }
    }
    ```

    Verify: `test -f app/src/view.rs`

11. Create `.gitignore`, the ignore file, with:

    ```text
    /target/
    # Written by the check that the rules crate stays headless.
    /game-deps.txt
    ```

    Verify: `test -f .gitignore`

12. Create `.github/workflows/ci.yml`, the project's own CI, with:

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
          # A pinned toolchain, so a new clippy lint arrives as a pull request
          # that moves this number rather than as a red build on a quiet day.
          - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
            with:
              toolchain: '1.98.1'
              components: clippy, rustfmt
          # Bevy is several hundred crates. The cache is keyed on Cargo.lock, so it
          # is rebuilt only when a dependency moves.
          - uses: Swatinem/rust-cache@6323deb102c322ba6fcbdcafc7e3dddab59af2b6 # v2.9.2
          - run: cargo fmt --all --check
          - run: cargo clippy --locked --workspace --all-targets -- -D warnings
          - run: cargo test --locked -p game
          # The rules crate compiles no renderer, window, audio or gamepad code.
          # This is what keeps it that way: one feature added to game/Cargo.toml
          # and a rule can depend on a window or a GPU that no test has.
          - name: The rules crate stays headless
            run: |
              cargo tree --locked -p game -e normal --prefix none > game-deps.txt
              if grep -E '^(bevy_render|bevy_winit|bevy_audio|bevy_gilrs|wgpu|winit) ' game-deps.txt; then
                echo "game depends on a renderer, window, audio or gamepad crate" >&2
                exit 1
              fi
          # The window binary builds on a bare runner because it enables no
          # feature that needs a system library (no audio, no gamepads, no native
          # Wayland). If one is added, this job needs that library installed
          # first; AGENTS.md says which.
          - run: cargo build --locked -p app

      # rust-version in Cargo.toml is a promise to everyone who builds this with
      # an older toolchain. This job is what keeps it.
      msrv:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
            with:
              toolchain: '1.95.0'
          - uses: Swatinem/rust-cache@6323deb102c322ba6fcbdcafc7e3dddab59af2b6 # v2.9.2
          - run: cargo test --locked -p game
          - run: cargo check --locked --workspace --all-targets
    ```

    Verify: `test -f .github/workflows/ci.yml`

13. Create `README.md`, the README, with:

    ```markdown
    # example

    A 2D game on Bevy. Move with the arrow keys or WASD, collect every coin
    before the clock runs out, press Space to play again.

    ## Play it

    `cargo run --release -p app`. A debug build of Bevy runs, but slowly; the
    first release build takes several minutes, later ones seconds.

    On Linux the game opens an X11 window (through XWayland on a Wayland desktop)
    and draws with Vulkan or OpenGL, all loaded when it starts. A desktop already
    has them; a server or a container without a display does not, and the game
    will not start there.

    ## Test it

    `cargo test -p game` runs the rules headless: no window, no GPU, no display.
    `cargo clippy --workspace --all-targets -- -D warnings` checks both crates.

    ## Where things go

    - `game/` is the rules: components, resources, systems, states. It never
      draws, opens a window or plays a sound, which is why it tests anywhere.
    - `app/` is the window: it draws what the rules spawn and decides nothing.

    See `AGENTS.md` before adding a system.
    ```

    Verify: `test -f README.md`

14. Resolve the dependencies and write the lock file, which is committed. Cargo picks the newest versions that still build on the declared rust-version: `cargo generate-lockfile`
    Verify: `grep -A1 -x 'name = "bevy"' Cargo.lock | grep -qx 'version = "0.19.1"'`

15. Check the formatting of both crates: `cargo fmt --all --check`
    Verify: `cargo fmt --all --check`

16. Check both crates for the mistakes the compiler allows, with warnings as errors. This type-checks the window binary too, without a display: `cargo clippy --locked --workspace --all-targets -- -D warnings`
    Verify: `cargo clippy --locked --workspace --all-targets -- -D warnings`

17. Run the rules headless: movement, collection, the clock, winning, losing, restarting, and the check that no two systems share data without an order: `cargo test --locked -p game`
    Verify: `cargo test --locked -p game`

18. List what the rules crate is built from, to prove the boundary: `cargo tree --locked -p game -e normal --prefix none > game-deps.txt`
    Verify: `grep -q '^bevy_state ' game-deps.txt && ! grep -qE '^(bevy_render|bevy_winit|bevy_audio|bevy_gilrs|wgpu|winit) ' game-deps.txt`

19. Build the window binary. It links with no system library; the window and the GPU driver are loaded when it starts, which CI cannot do: `cargo build --locked -p app`
    Verify: `test -f target/debug/example -o -f target/debug/example.exe`
