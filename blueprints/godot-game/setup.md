# Setup

Creates a 2D game on Godot 4.7 in C#: a main scene, a player node, input
actions declared in `project.godot`, and the game's rules in a plain .NET
library that is tested with xUnit and never references Godot.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires the .NET SDK 10. **The Godot engine is not installed by this recipe.**
Everything here is built with `Godot.NET.Sdk` and `GodotSharp` from NuGet,
which compile the game without the engine; running the game needs the Godot
4.7.2 .NET editor, which you download yourself (see "After setup").

1. Pin the SDK, and run tests on Microsoft.Testing.Platform, which xUnit v3 needs under the .NET 10 `dotnet test`. Create `global.json` with:

   ```json
   {
     "sdk": {
       "version": "10.0.100",
       "rollForward": "latestFeature"
     },
     "test": {
       "runner": "Microsoft.Testing.Platform"
     }
   }
   ```

   Verify: `dotnet --version`

2. Create `Directory.Build.props`, which every project here inherits, with:

   ```xml
   <Project>

     <!--
       Applies to every project here: the Godot game, the rules and the tests.
       The target framework stays in each project file, where the Godot editor
       expects to find and rewrite it.
     -->
     <PropertyGroup>
       <Nullable>enable</Nullable>
       <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
       <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
     </PropertyGroup>

   </Project>
   ```

   Verify: `test -f Directory.Build.props`

3. Create `.gitignore` with:

   ```gitignore
   # Godot's import cache and the build output Godot.NET.Sdk moves under it.
   # Export credentials (keystore passwords) also live in .godot/.
   .godot/

   # The rules and the tests build to the usual places.
   bin/
   obj/

   # Local editor settings.
   .vs/
   .vscode/
   *.user
   ```

   Verify: `test -f .gitignore`

4. Keep Godot's importer out of the .NET projects and their build output. Create `src/.gdignore` with:

   ```text
   # Godot imports nothing below this folder: it holds .NET projects and their build output.
   ```

   Verify: `test -f src/.gdignore`

5. Create `src/Game.Rules/Game.Rules.csproj` with:

   ```xml
   <Project Sdk="Microsoft.NET.Sdk">

     <!--
       The game's rules, in plain .NET. This project references no Godot
       package and no Godot project: BoundaryTests fails the day it does.
       net8.0 because the game assembly that consumes it targets what
       Godot.NET.Sdk 4.7 targets.
     -->
     <PropertyGroup>
       <TargetFramework>net8.0</TargetFramework>
       <ImplicitUsings>enable</ImplicitUsings>
     </PropertyGroup>

   </Project>
   ```

   Verify: `dotnet restore src/Game.Rules`

6. Create `src/Game.Rules/Settings.cs` with:

   ```csharp
   namespace Game.Rules;

   // The numbers the game is tuned by. Distances are pixels and positions are
   // centres, the same convention as a Node2D's position, so the scene copies
   // them across without converting.
   public sealed record Settings
   {
       public Settings(
           float arenaWidth,
           float arenaHeight,
           float playerSpeed,
           float playerHalfSize,
           float coinRadius,
           int coinsToWin,
           float secondsToPlay)
       {
           ArgumentOutOfRangeException.ThrowIfNegativeOrZero(playerHalfSize);
           ArgumentOutOfRangeException.ThrowIfNegativeOrZero(coinRadius);
           ArgumentOutOfRangeException.ThrowIfLessThan(arenaWidth, 2f * Math.Max(playerHalfSize, coinRadius));
           ArgumentOutOfRangeException.ThrowIfLessThan(arenaHeight, 2f * Math.Max(playerHalfSize, coinRadius));
           ArgumentOutOfRangeException.ThrowIfNegative(playerSpeed);
           ArgumentOutOfRangeException.ThrowIfNegativeOrZero(coinsToWin);
           ArgumentOutOfRangeException.ThrowIfNegativeOrZero(secondsToPlay);

           ArenaWidth = arenaWidth;
           ArenaHeight = arenaHeight;
           PlayerSpeed = playerSpeed;
           PlayerHalfSize = playerHalfSize;
           CoinRadius = coinRadius;
           CoinsToWin = coinsToWin;
           SecondsToPlay = secondsToPlay;
       }

       // The arena matches the viewport declared in project.godot.
       public static Settings Default { get; } = new(
           arenaWidth: 640f,
           arenaHeight: 360f,
           playerSpeed: 220f,
           playerHalfSize: 12f,
           coinRadius: 8f,
           coinsToWin: 10,
           secondsToPlay: 30f);

       public float ArenaWidth { get; }
       public float ArenaHeight { get; }
       public float PlayerSpeed { get; }
       public float PlayerHalfSize { get; }
       public float CoinRadius { get; }
       public int CoinsToWin { get; }
       public float SecondsToPlay { get; }
   }
   ```

   Verify: `dotnet build src/Game.Rules`

7. Create `src/Game.Rules/GameState.cs` with:

   ```csharp
   using System.Numerics;

   namespace Game.Rules;

   public enum Outcome
   {
       Playing,
       Won,
       Lost,
   }

   // One frame of the game. Immutable: GameRules.Tick returns the next one.
   public sealed record GameState(
       Vector2 Player,
       Vector2 Coin,
       int Score,
       float SecondsLeft,
       Outcome Outcome);
   ```

   Verify: `dotnet build src/Game.Rules`

8. Create `src/Game.Rules/InputActions.cs` with:

   ```csharp
   namespace Game.Rules;

   // The input action names, spelled once. project.godot declares each of them
   // under [input]; a test fails when one is missing, because Godot does not:
   // an undeclared action only prints an error and reads as never pressed.
   public static class InputActions
   {
       public const string MoveLeft = "move_left";
       public const string MoveRight = "move_right";
       public const string MoveUp = "move_up";
       public const string MoveDown = "move_down";
       public const string Restart = "restart";

       public static IReadOnlyList<string> All { get; } = [MoveLeft, MoveRight, MoveUp, MoveDown, Restart];
   }
   ```

   Verify: `dotnet build src/Game.Rules`

9. Create `src/Game.Rules/GameRules.cs` with:

   ```csharp
   using System.Numerics;

   namespace Game.Rules;

   // Every rule of the game, as functions from one state to the next. Nothing in
   // this file knows about Godot: the scene reads input, calls Tick, and copies
   // the result onto its nodes. Randomness arrives as an argument and time as a
   // number, so a seed and a list of inputs replay a game exactly.
   public static class GameRules
   {
       // A window dragged, a breakpoint, a slow frame: one very long frame would
       // move the player through a coin without ever overlapping it.
       public const float MaxStepSeconds = 0.1f;

       public static GameState Start(Settings settings, Random random)
       {
           ArgumentNullException.ThrowIfNull(settings);
           ArgumentNullException.ThrowIfNull(random);

           var centre = new Vector2(settings.ArenaWidth / 2f, settings.ArenaHeight / 2f);
           return new GameState(
               Player: centre,
               Coin: PlaceCoin(settings, random, avoid: centre),
               Score: 0,
               SecondsLeft: settings.SecondsToPlay,
               Outcome: Outcome.Playing);
       }

       public static GameState Tick(GameState state, Vector2 input, float deltaSeconds, Settings settings, Random random)
       {
           ArgumentNullException.ThrowIfNull(state);
           ArgumentNullException.ThrowIfNull(settings);
           ArgumentNullException.ThrowIfNull(random);

           if (state.Outcome != Outcome.Playing)
           {
               return state;
           }

           var seconds = float.IsFinite(deltaSeconds) ? Math.Clamp(deltaSeconds, 0f, MaxStepSeconds) : 0f;

           // A diagonal is not faster than a straight line.
           var direction = input.LengthSquared() > 1f ? Vector2.Normalize(input) : input;
           var player = KeepInside(state.Player + (direction * settings.PlayerSpeed * seconds), settings);
           var next = state with
           {
               Player = player,
               SecondsLeft = Math.Max(0f, state.SecondsLeft - seconds),
           };

           // Collecting is checked before the clock: the coin taken on the last
           // frame counts.
           if (Touches(player, state.Coin, settings))
           {
               next = next with
               {
                   Score = state.Score + 1,
                   Coin = PlaceCoin(settings, random, avoid: player),
               };
               if (next.Score >= settings.CoinsToWin)
               {
                   return next with { Outcome = Outcome.Won };
               }
           }

           return next.SecondsLeft <= 0f ? next with { Outcome = Outcome.Lost } : next;
       }

       public static Vector2 KeepInside(Vector2 position, Settings settings)
       {
           ArgumentNullException.ThrowIfNull(settings);

           var half = settings.PlayerHalfSize;
           return new Vector2(
               Math.Clamp(position.X, half, settings.ArenaWidth - half),
               Math.Clamp(position.Y, half, settings.ArenaHeight - half));
       }

       public static bool Touches(Vector2 player, Vector2 coin, Settings settings)
       {
           ArgumentNullException.ThrowIfNull(settings);

           var reach = settings.PlayerHalfSize + settings.CoinRadius;
           return Vector2.DistanceSquared(player, coin) < reach * reach;
       }

       public static string Describe(GameState state, Settings settings)
       {
           ArgumentNullException.ThrowIfNull(state);
           ArgumentNullException.ThrowIfNull(settings);

           return state.Outcome switch
           {
               Outcome.Won => $"You win! {state.Score} coins. Press R to play again.",
               Outcome.Lost => $"Time is up: {state.Score} of {settings.CoinsToWin}. Press R to play again.",
               _ => $"Coins {state.Score}/{settings.CoinsToWin}   Time {Math.Ceiling(state.SecondsLeft)}",
           };
       }

       private static Vector2 PlaceCoin(Settings settings, Random random, Vector2 avoid)
       {
           var r = settings.CoinRadius;
           for (var attempt = 0; attempt < 16; attempt++)
           {
               var candidate = new Vector2(
                   r + (random.NextSingle() * (settings.ArenaWidth - (2f * r))),
                   r + (random.NextSingle() * (settings.ArenaHeight - (2f * r))));
               if (!Touches(avoid, candidate, settings))
               {
                   return candidate;
               }
           }

           // Sixteen unlucky draws: the corner farthest from the player.
           var x = avoid.X < settings.ArenaWidth / 2f ? settings.ArenaWidth - r : r;
           var y = avoid.Y < settings.ArenaHeight / 2f ? settings.ArenaHeight - r : r;
           return new Vector2(x, y);
       }
   }
   ```

   Verify: `dotnet build src/Game.Rules`

10. Declare the window size the rules' arena matches and the input actions the scripts read. Create `project.godot` with:

    ```ini
    ; Godot project settings. The editor rewrites this file; keep hand edits to
    ; the sections below, and keep the action names in step with
    ; src/Game.Rules/InputActions.cs (ProjectFileTests checks both ways).

    config_version=5

    [application]

    config/name="Game"
    run/main_scene="res://scenes/Main.tscn"
    config/features=PackedStringArray("4.7", "C#", "GL Compatibility")

    [display]

    window/size/viewport_width=640
    window/size/viewport_height=360
    window/stretch/mode="canvas_items"

    [dotnet]

    project/assembly_name="Game"

    [input]

    move_left={
    "deadzone": 0.2,
    "events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194319,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null), Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":65,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
    }
    move_right={
    "deadzone": 0.2,
    "events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194321,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null), Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":68,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
    }
    move_up={
    "deadzone": 0.2,
    "events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194320,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null), Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":87,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
    }
    move_down={
    "deadzone": 0.2,
    "events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194322,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null), Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":83,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
    }
    restart={
    "deadzone": 0.2,
    "events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":82,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
    }

    [rendering]

    renderer/rendering_method="gl_compatibility"
    renderer/rendering_method.mobile="gl_compatibility"
    ```

    Verify: `grep -q '^run/main_scene="res://scenes/Main.tscn"' project.godot`

11. Create `Game.csproj`, the game assembly the Godot editor builds, with:

    ```xml
    <Project Sdk="Godot.NET.Sdk/4.7.2">

      <!--
        The game assembly the Godot editor builds and loads. The SDK version is
        the engine version: open this project with Godot 4.7.2 (.NET edition), or
        change both together. net8.0 is what Godot.NET.Sdk 4.7 targets.
      -->
      <PropertyGroup>
        <TargetFramework>net8.0</TargetFramework>
        <EnableDynamicLoading>true</EnableDynamicLoading>
        <RootNamespace>Game</RootNamespace>
      </PropertyGroup>

      <!--
        This project sits at the root of the Godot project, so its default glob
        would also compile the rules and the tests. They are projects of their
        own.
      -->
      <ItemGroup>
        <Compile Remove="src/**;tests/**" />
      </ItemGroup>

      <ItemGroup>
        <ProjectReference Include="src/Game.Rules/Game.Rules.csproj" />
      </ItemGroup>

    </Project>
    ```

    Verify: `dotnet restore Game.csproj`

12. Create `scripts/Player.cs` with:

    ```csharp
    using Godot;

    namespace Game;

    // The player's node. It draws itself and nothing else: where it stands is
    // decided by GameRules and copied here by Main.
    public partial class Player : Node2D
    {
        private float _halfSize = 12f;

        public float HalfSize
        {
            get => _halfSize;
            set
            {
                _halfSize = value;
                QueueRedraw();
            }
        }

        public override void _Draw() =>
            DrawRect(new Rect2(-_halfSize, -_halfSize, 2f * _halfSize, 2f * _halfSize), Colors.CornflowerBlue);
    }
    ```

    Verify: `dotnet build Game.csproj`

13. Create `scripts/Coin.cs` with:

    ```csharp
    using Godot;

    namespace Game;

    // The coin's node. Drawn in code, so the skeleton has no art to import.
    public partial class Coin : Node2D
    {
        private float _radius = 8f;

        public float Radius
        {
            get => _radius;
            set
            {
                _radius = value;
                QueueRedraw();
            }
        }

        public override void _Draw() => DrawCircle(Vector2.Zero, _radius, Colors.Gold);
    }
    ```

    Verify: `dotnet build Game.csproj`

14. Create `scripts/Main.cs` with:

    ```csharp
    using Game.Rules;
    using Godot;
    using NumericsVector2 = System.Numerics.Vector2;

    namespace Game;

    // The shell around Game.Rules: read input, call GameRules.Tick, copy the
    // result onto the nodes. An `if` about the game written here is a rule in the
    // wrong place, and it has no test.
    public partial class Main : Node2D
    {
        private readonly Settings _settings = Settings.Default;
        private readonly System.Random _random = new();
        private GameState _state = null!;
        private Player _player = null!;
        private Coin _coin = null!;
        private Label _hud = null!;

        public override void _Ready()
        {
            _player = GetNode<Player>("Player");
            _coin = GetNode<Coin>("Coin");
            _hud = GetNode<Label>("Hud");
            _player.HalfSize = _settings.PlayerHalfSize;
            _coin.Radius = _settings.CoinRadius;
            Restart();
        }

        public override void _Process(double delta)
        {
            if (_state.Outcome != Outcome.Playing)
            {
                if (Input.IsActionJustPressed(InputActions.Restart))
                {
                    Restart();
                }

                return;
            }

            var input = Input.GetVector(
                InputActions.MoveLeft,
                InputActions.MoveRight,
                InputActions.MoveUp,
                InputActions.MoveDown);
            _state = GameRules.Tick(_state, new NumericsVector2(input.X, input.Y), (float)delta, _settings, _random);
            Present();
        }

        private void Restart()
        {
            _state = GameRules.Start(_settings, _random);
            Present();
        }

        private void Present()
        {
            _player.Position = new Vector2(_state.Player.X, _state.Player.Y);
            _coin.Position = new Vector2(_state.Coin.X, _state.Coin.Y);
            _coin.Visible = _state.Outcome == Outcome.Playing;
            _hud.Text = GameRules.Describe(_state, _settings);
        }
    }
    ```

    Verify: `dotnet build Game.csproj`

15. Create `scenes/Main.tscn`, the main scene, with:

    ```ini
    [gd_scene load_steps=4 format=3]

    [ext_resource type="Script" path="res://scripts/Main.cs" id="1_main"]
    [ext_resource type="Script" path="res://scripts/Player.cs" id="2_player"]
    [ext_resource type="Script" path="res://scripts/Coin.cs" id="3_coin"]

    [node name="Main" type="Node2D"]
    script = ExtResource("1_main")

    [node name="Player" type="Node2D" parent="."]
    position = Vector2(320, 180)
    script = ExtResource("2_player")

    [node name="Coin" type="Node2D" parent="."]
    script = ExtResource("3_coin")

    [node name="Hud" type="Label" parent="."]
    offset_left = 8.0
    offset_top = 8.0
    offset_right = 632.0
    offset_bottom = 32.0
    ```

    Verify: `grep -q 'path="res://scripts/Main.cs"' scenes/Main.tscn`

16. Create `tests/.gdignore` with:

    ```text
    # Godot imports nothing below this folder: it holds .NET projects and their build output.
    ```

    Verify: `test -f tests/.gdignore`

17. Create `tests/Game.Rules.Tests/Game.Rules.Tests.csproj` with:

    ```xml
    <Project Sdk="Microsoft.NET.Sdk">

      <!--
        Tests the rules without the engine. It references Game.Rules and never
        Game.csproj: GodotSharp only works inside a running engine, so a test that
        loaded it would need the editor installed.
      -->
      <PropertyGroup>
        <TargetFramework>net10.0</TargetFramework>
        <OutputType>Exe</OutputType>
        <ImplicitUsings>enable</ImplicitUsings>
        <IsPackable>false</IsPackable>
      </PropertyGroup>

      <ItemGroup>
        <PackageReference Include="xunit.v3" Version="4.0.1" />
      </ItemGroup>

      <ItemGroup>
        <ProjectReference Include="../../src/Game.Rules/Game.Rules.csproj" />
      </ItemGroup>

      <ItemGroup>
        <Using Include="Xunit" />
      </ItemGroup>

    </Project>
    ```

    Verify: `dotnet restore tests/Game.Rules.Tests`

18. Create `tests/Game.Rules.Tests/GameRulesTests.cs` with:

    ```csharp
    using System.Numerics;

    namespace Game.Rules.Tests;

    public sealed class GameRulesTests
    {
        private static readonly Settings Settings = Settings.Default;

        // A state built by hand, so a test says exactly the situation it is about
        // instead of playing frames until it happens.
        private static GameState At(Vector2 player, Vector2 coin, int score = 0, float secondsLeft = 30f) =>
            new(player, coin, score, secondsLeft, Outcome.Playing);

        private static readonly Vector2 FarCoin = new(600f, 340f);

        [Fact]
        public void Start_puts_the_player_in_the_centre_with_the_full_clock()
        {
            var state = GameRules.Start(Settings, new Random(1));

            Assert.Equal(new Vector2(320f, 180f), state.Player);
            Assert.Equal(0, state.Score);
            Assert.Equal(Settings.SecondsToPlay, state.SecondsLeft);
            Assert.Equal(Outcome.Playing, state.Outcome);
            Assert.False(GameRules.Touches(state.Player, state.Coin, Settings));
        }

        [Fact]
        public void The_same_seed_and_inputs_replay_the_same_game()
        {
            static GameState Play(int seed)
            {
                var random = new Random(seed);
                var state = GameRules.Start(Settings, random);
                for (var frame = 0; frame < 600; frame++)
                {
                    var input = new Vector2(MathF.Sin(frame / 20f), MathF.Cos(frame / 31f));
                    state = GameRules.Tick(state, input, 1f / 60f, Settings, random);
                }

                return state;
            }

            Assert.Equal(Play(7), Play(7));
        }

        [Fact]
        public void Moving_right_moves_by_speed_times_time()
        {
            var state = At(new Vector2(100f, 100f), FarCoin);

            var next = GameRules.Tick(state, Vector2.UnitX, 0.05f, Settings, new Random(1));

            Assert.Equal(100f + (Settings.PlayerSpeed * 0.05f), next.Player.X, precision: 3);
            Assert.Equal(100f, next.Player.Y);
        }

        [Fact]
        public void A_diagonal_is_not_faster_than_a_straight_line()
        {
            var start = new Vector2(200f, 200f);
            var state = At(start, FarCoin);

            var next = GameRules.Tick(state, new Vector2(1f, 1f), 0.05f, Settings, new Random(1));

            Assert.Equal(Settings.PlayerSpeed * 0.05f, Vector2.Distance(start, next.Player), precision: 3);
        }

        [Theory]
        [InlineData(-1f, 0f)]
        [InlineData(1f, 0f)]
        [InlineData(0f, -1f)]
        [InlineData(0f, 1f)]
        public void The_player_never_leaves_the_arena(float x, float y)
        {
            var random = new Random(1);
            var state = At(new Vector2(320f, 180f), FarCoin, secondsLeft: 1000f);

            for (var frame = 0; frame < 300; frame++)
            {
                state = GameRules.Tick(state, new Vector2(x, y), 0.1f, Settings, random);
            }

            var half = Settings.PlayerHalfSize;
            Assert.InRange(state.Player.X, half, Settings.ArenaWidth - half);
            Assert.InRange(state.Player.Y, half, Settings.ArenaHeight - half);
        }

        [Fact]
        public void One_long_frame_is_clamped_so_the_player_cannot_skip_over_a_coin()
        {
            var state = At(new Vector2(100f, 100f), FarCoin);

            var next = GameRules.Tick(state, Vector2.UnitX, 5f, Settings, new Random(1));

            Assert.Equal(100f + (Settings.PlayerSpeed * GameRules.MaxStepSeconds), next.Player.X, precision: 3);
            Assert.Equal(30f - GameRules.MaxStepSeconds, next.SecondsLeft, precision: 3);
        }

        [Theory]
        [InlineData(float.NaN)]
        [InlineData(float.PositiveInfinity)]
        [InlineData(-1f)]
        public void A_nonsense_frame_time_moves_nothing(float seconds)
        {
            var state = At(new Vector2(100f, 100f), FarCoin);

            var next = GameRules.Tick(state, Vector2.UnitX, seconds, Settings, new Random(1));

            Assert.Equal(state, next);
        }

        [Fact]
        public void Touching_the_coin_scores_and_moves_the_coin_away()
        {
            var player = new Vector2(100f, 100f);
            var state = At(player, coin: new Vector2(105f, 100f));

            var next = GameRules.Tick(state, Vector2.Zero, 1f / 60f, Settings, new Random(1));

            Assert.Equal(1, next.Score);
            Assert.False(GameRules.Touches(next.Player, next.Coin, Settings));
            Assert.Equal(Outcome.Playing, next.Outcome);
        }

        [Fact]
        public void The_last_coin_wins()
        {
            var state = At(new Vector2(100f, 100f), new Vector2(100f, 100f), score: Settings.CoinsToWin - 1);

            var next = GameRules.Tick(state, Vector2.Zero, 1f / 60f, Settings, new Random(1));

            Assert.Equal(Outcome.Won, next.Outcome);
            Assert.Equal(Settings.CoinsToWin, next.Score);
        }

        [Fact]
        public void The_last_coin_counts_on_the_frame_the_clock_runs_out()
        {
            var state = At(new Vector2(100f, 100f), new Vector2(100f, 100f), score: Settings.CoinsToWin - 1, secondsLeft: 0.01f);

            var next = GameRules.Tick(state, Vector2.Zero, 1f / 60f, Settings, new Random(1));

            Assert.Equal(Outcome.Won, next.Outcome);
        }

        [Fact]
        public void Running_out_of_time_loses()
        {
            var state = At(new Vector2(100f, 100f), FarCoin, score: 3, secondsLeft: 0.01f);

            var next = GameRules.Tick(state, Vector2.Zero, 1f / 60f, Settings, new Random(1));

            Assert.Equal(Outcome.Lost, next.Outcome);
            Assert.Equal(0f, next.SecondsLeft);
        }

        [Theory]
        [InlineData(Outcome.Won)]
        [InlineData(Outcome.Lost)]
        public void A_finished_game_does_not_change(Outcome outcome)
        {
            var state = At(new Vector2(100f, 100f), new Vector2(100f, 100f)) with { Outcome = outcome };

            var next = GameRules.Tick(state, Vector2.UnitX, 0.05f, Settings, new Random(1));

            Assert.Same(state, next);
        }

        [Fact]
        public void Describe_says_how_to_play_again_when_the_game_is_over()
        {
            var lost = At(Vector2.Zero, Vector2.Zero, score: 4) with { Outcome = Outcome.Lost };

            Assert.Equal("Time is up: 4 of 10. Press R to play again.", GameRules.Describe(lost, Settings));
        }

        [Fact]
        public void Settings_refuse_an_arena_smaller_than_the_player()
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new Settings(10f, 10f, 100f, 12f, 8f, 10, 30f));
        }

        [Fact]
        public void Settings_refuse_a_game_that_cannot_be_won()
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new Settings(640f, 360f, 100f, 12f, 8f, 0, 30f));
        }
    }
    ```

    Verify: `dotnet build tests/Game.Rules.Tests`

19. Create `tests/Game.Rules.Tests/ProjectFileTests.cs` with:

    ```csharp
    using System.Text.RegularExpressions;

    namespace Game.Rules.Tests;

    // Godot reports these mistakes only when the game runs, and CI has no engine.
    // Reading the files the engine reads catches them at test time instead.
    public sealed partial class ProjectFileTests
    {
        private static readonly string Root = ProjectRoot.Find();

        [Fact]
        public void Every_input_action_the_game_reads_is_declared_in_project_godot()
        {
            var declared = InputSection(File.ReadAllText(Path.Combine(Root, "project.godot")));

            foreach (var action in InputActions.All)
            {
                Assert.Contains(action, declared);
            }
        }

        [Fact]
        public void Every_declared_input_action_is_one_the_game_knows()
        {
            var declared = InputSection(File.ReadAllText(Path.Combine(Root, "project.godot")));

            Assert.Equal(InputActions.All.Order(), declared.Order());
        }

        [Fact]
        public void The_main_scene_exists()
        {
            var settings = File.ReadAllText(Path.Combine(Root, "project.godot"));
            var scene = MainScene().Match(settings);

            Assert.True(scene.Success, "project.godot sets no run/main_scene");
            Assert.True(File.Exists(FromResourcePath(scene.Groups[1].Value)), $"{scene.Groups[1].Value} does not exist");
        }

        [Fact]
        public void Every_script_a_scene_attaches_exists_and_declares_its_partial_class()
        {
            var scenes = Directory.GetFiles(Path.Combine(Root, "scenes"), "*.tscn", SearchOption.AllDirectories);
            Assert.NotEmpty(scenes);

            foreach (var scene in scenes)
            {
                foreach (Match script in ScriptResource().Matches(File.ReadAllText(scene)))
                {
                    var path = FromResourcePath(script.Groups[1].Value);
                    Assert.True(File.Exists(path), $"{Path.GetFileName(scene)} attaches {script.Groups[1].Value}, which does not exist");

                    // Godot finds a C# script's class by the file name, and the
                    // source generators need it partial.
                    var className = Path.GetFileNameWithoutExtension(path);
                    Assert.Matches($@"\bpartial\s+class\s+{className}\b", File.ReadAllText(path));
                }
            }
        }

        private static List<string> InputSection(string settings)
        {
            var start = settings.IndexOf("\n[input]", StringComparison.Ordinal);
            Assert.True(start >= 0, "project.godot has no [input] section");
            var end = settings.IndexOf("\n[", start + 1, StringComparison.Ordinal);
            var section = end < 0 ? settings[start..] : settings[start..end];
            return ActionName().Matches(section).Select(match => match.Groups[1].Value).ToList();
        }

        private static string FromResourcePath(string resourcePath) =>
            Path.Combine(Root, resourcePath["res://".Length..].Replace('/', Path.DirectorySeparatorChar));

        [GeneratedRegex(@"^run/main_scene=""(res://[^""]+)""", RegexOptions.Multiline)]
        private static partial Regex MainScene();

        [GeneratedRegex(@"^\[ext_resource type=""Script""[^\]]*path=""(res://[^""]+\.cs)""", RegexOptions.Multiline)]
        private static partial Regex ScriptResource();

        [GeneratedRegex(@"^([A-Za-z0-9_]+)=\{", RegexOptions.Multiline)]
        private static partial Regex ActionName();
    }

    internal static class ProjectRoot
    {
        // The Godot project root is the folder holding project.godot, found by
        // walking up from wherever the test runner put this assembly.
        public static string Find()
        {
            for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
            {
                if (File.Exists(Path.Combine(directory.FullName, "project.godot")))
                {
                    return directory.FullName;
                }
            }

            throw new InvalidOperationException("No project.godot above " + AppContext.BaseDirectory);
        }
    }
    ```

    Verify: `dotnet build tests/Game.Rules.Tests`

20. Create `tests/Game.Rules.Tests/BoundaryTests.cs` with:

    ```csharp
    using System.Xml.Linq;

    namespace Game.Rules.Tests;

    // The rules stay testable only while they do not need the engine. These tests
    // hold that line from both sides: what the project file asks for, and what
    // the compiled assembly actually uses.
    public sealed class BoundaryTests
    {
        [Fact]
        public void The_rules_assembly_references_no_Godot_assembly()
        {
            var referenced = typeof(GameRules).Assembly
                .GetReferencedAssemblies()
                .Select(name => name.Name ?? string.Empty);

            Assert.DoesNotContain(referenced, name => name.StartsWith("Godot", StringComparison.OrdinalIgnoreCase));
        }

        [Fact]
        public void The_rules_project_file_references_no_Godot_package_or_project()
        {
            var path = Path.Combine(ProjectRoot.Find(), "src", "Game.Rules", "Game.Rules.csproj");
            var project = XDocument.Load(path).Root!;

            Assert.Equal("Microsoft.NET.Sdk", (string?)project.Attribute("Sdk"));
            var references = project
                .Descendants()
                .Where(element => element.Name.LocalName is "PackageReference" or "ProjectReference" or "Reference")
                .Select(element => (string?)element.Attribute("Include") ?? string.Empty)
                .ToList();
            Assert.DoesNotContain(references, include => include.Contains("Godot", StringComparison.OrdinalIgnoreCase));
            Assert.DoesNotContain(references, include => include.EndsWith("Game.csproj", StringComparison.OrdinalIgnoreCase));
        }
    }
    ```

    Verify: `dotnet build tests/Game.Rules.Tests`

21. Create the solution, with the three configurations the Godot editor builds and exports with: Debug, ExportDebug and ExportRelease. Create `Game.sln` with:

    ```text
    Microsoft Visual Studio Solution File, Format Version 12.00
    # Visual Studio Version 17
    Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Game", "Game.csproj", "{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A01}"
    EndProject
    Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Game.Rules", "src\Game.Rules\Game.Rules.csproj", "{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A02}"
    EndProject
    Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Game.Rules.Tests", "tests\Game.Rules.Tests\Game.Rules.Tests.csproj", "{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A03}"
    EndProject
    Global
    	GlobalSection(SolutionConfigurationPlatforms) = preSolution
    		Debug|Any CPU = Debug|Any CPU
    		ExportDebug|Any CPU = ExportDebug|Any CPU
    		ExportRelease|Any CPU = ExportRelease|Any CPU
    	EndGlobalSection
    	GlobalSection(ProjectConfigurationPlatforms) = postSolution
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A01}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A01}.Debug|Any CPU.Build.0 = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A01}.ExportDebug|Any CPU.ActiveCfg = ExportDebug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A01}.ExportDebug|Any CPU.Build.0 = ExportDebug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A01}.ExportRelease|Any CPU.ActiveCfg = ExportRelease|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A01}.ExportRelease|Any CPU.Build.0 = ExportRelease|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A02}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A02}.Debug|Any CPU.Build.0 = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A02}.ExportDebug|Any CPU.ActiveCfg = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A02}.ExportDebug|Any CPU.Build.0 = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A02}.ExportRelease|Any CPU.ActiveCfg = Release|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A02}.ExportRelease|Any CPU.Build.0 = Release|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A03}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A03}.Debug|Any CPU.Build.0 = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A03}.ExportDebug|Any CPU.ActiveCfg = Debug|Any CPU
    		{6A1C2F3E-4B5D-4E6F-8A7B-9C0D1E2F3A03}.ExportRelease|Any CPU.ActiveCfg = Release|Any CPU
    	EndGlobalSection
    EndGlobal
    ```

    Verify: `dotnet sln Game.sln list`

22. Create `.github/workflows/ci.yml` with:

    ```yaml
    # Builds and tests what can be built and tested without the Godot engine:
    # formatting, the game assembly against Godot.NET.Sdk from NuGet, the rules
    # and their tests, and the configuration an export compiles with. Running the
    # game, exporting it and anything that draws a frame need the engine binary,
    # which this workflow does not download.
    name: CI

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6.0.0
            with:
              global-json-file: global.json
          - run: dotnet restore Game.sln
          - run: dotnet format Game.sln --verify-no-changes --no-restore
          - run: dotnet build Game.sln --no-restore
          - run: dotnet test --solution Game.sln --no-build
          - run: dotnet build Game.sln --configuration ExportRelease
    ```

    Verify: `test -f .github/workflows/ci.yml`

23. Build everything, warnings as errors: `dotnet build Game.sln`
    Verify: `test -f .godot/mono/temp/bin/Debug/Game.dll`

24. Check the formatting the CI workflow checks: `dotnet format Game.sln --verify-no-changes`
    Verify: `dotnet format whitespace --folder --verify-no-changes`

25. Run the tests — the rules, the boundary and the project files: `dotnet test --solution Game.sln --no-build`
    Verify: `dotnet test --project tests/Game.Rules.Tests --no-build --filter-class Game.Rules.Tests.BoundaryTests`

26. Build the configuration a release export compiles with: `dotnet build Game.sln --configuration ExportRelease`
    Verify: `test -f .godot/mono/temp/bin/ExportRelease/Game.Rules.dll && test ! -e .godot/mono/temp/bin/ExportRelease/GodotSharpEditor.dll`

## After setup

- **Install the engine to run the game.** Download the **.NET** edition of
  Godot 4.7.2 from the official download page,
  [godotengine.org/download](https://godotengine.org/download/), and
  open `project.godot` with it. The standard edition cannot run C# scripts.
  Nothing in this recipe proved the game runs: CI has no engine.
- Press F5 in the editor. Arrow keys or WASD move, R plays again after a win
  or a loss.
- Keep the editor version and `Godot.NET.Sdk/4.7.2` in `Game.csproj` equal.
  The editor offers to update the SDK version when you open the project with a
  newer one; accept it, and run `dotnet build Game.sln` and the tests after.
- Exporting needs export templates, which the editor downloads for you from
  its Export dialog. Keep `export_presets.cfg` in the repository; the editor
  keeps export passwords in `.godot/export_credentials.cfg`, which is ignored.
