# Setup

Creates a Phoenix 1.8 application on Postgres: a LiveView page whose number
changes because the server pushed it and not because the browser asked,
magic-link authentication from `mix phx.gen.auth` with the page behind it,
Ecto migrations, a production configuration that refuses to start without its
secret, Sobelow and the Elixir security advisories, and a CI workflow with
every action pinned by commit.

Run every step from the empty directory that will hold the project. Each step
is one action and ends with the command that proves it worked. Stop at the
first verification that fails.

Requires Elixir 1.20 or newer on OTP 29, from a version manager (asdf, mise,
or `erlef/setup-beam` in CI) so that archives and dependencies install without
elevated privileges; Git, Docker and curl. `mix.exs` pins `elixir: "~> 1.20"`,
so an older Elixir is refused by Mix rather than discovered halfway through a
compile.

1. Install Hex, the package manager `mix` fetches dependencies with: `mix local.hex --force`
   Verify: `mix hex.info > /dev/null`

2. Install rebar3, which builds the Erlang dependencies in the tree: `mix local.rebar --force`
   Verify: `ls "$HOME/.mix"/elixir/*/rebar3`

3. Install the Phoenix project generator from Hex at a pinned version. From the registry, not from a script somebody pipes into a shell: `mix archive.install hex phx_new 1.8.15 --force`
   Verify: `mix phx.new --version | grep -qx "Phoenix installer v1.8.15"`

4. Generate the application into this directory. The generator asks whether an existing directory is really the right one, and `printf` answers it, so the step needs nobody at the keyboard. `--no-tailwind` is what keeps every download in this recipe coming from a package registry: the Tailwind and daisyUI defaults are fetched from a source-hosting site instead, and esbuild — which is what actually bundles the LiveView client — comes from npm: `printf 'Y\n' | mix phx.new . --app liveview_app --module LiveviewApp --database postgres --adapter bandit --no-tailwind --no-install`
   Verify: `test -f lib/liveview_app_web/endpoint.ex`

5. Fetch what the generator asked for, so that the Phoenix generators below can run: `mix deps.get`
   Verify: `test -f mix.lock`

6. Generate authentication: a `User` schema, a token table, magic-link sign-in, sudo mode for changing an email or a password, a scope assigned on every request, and the tests for all of it. `--live` because the rest of this application is LiveView; `pbkdf2` because it is pure Elixir and needs no C toolchain, where argon2 and bcrypt do: `mix phx.gen.auth Accounts User users --live --hashing-lib pbkdf2`
   Verify: `test -f lib/liveview_app_web/user_auth.ex`

7. Replace `mix.exs` with every direct dependency pinned to an exact version, the security checks added, and one alias that runs what CI runs:

   ```elixir
   defmodule LiveviewApp.MixProject do
     use Mix.Project

     def project do
       [
         app: :liveview_app,
         version: "0.1.0",
         # The generator writes a looser range. This one is the toolchain the
         # recipe was run on, and `mix` refuses an older Elixir rather than
         # failing halfway through a compile.
         elixir: "~> 1.20",
         elixirc_paths: elixirc_paths(Mix.env()),
         start_permanent: Mix.env() == :prod,
         aliases: aliases(),
         deps: deps(),
         compilers: [:phoenix_live_view] ++ Mix.compilers(),
         listeners: [Phoenix.CodeReloader]
       ]
     end

     def application do
       [
         mod: {LiveviewApp.Application, []},
         extra_applications: [:logger, :runtime_tools]
       ]
     end

     def cli do
       [
         preferred_envs: [precommit: :test]
       ]
     end

     defp elixirc_paths(:test), do: ["lib", "test/support"]
     defp elixirc_paths(_), do: ["lib"]

     # Every direct dependency is pinned to the exact version this recipe was run
     # with, so a project generated today and one generated in six months compile
     # the same code. `mix.lock` pins what these depend on in turn. Raise a pin
     # deliberately, with `mix deps.update <name>`, and read the changelog.
     defp deps do
       [
         {:phoenix, "1.8.15"},
         {:phoenix_ecto, "4.7.0"},
         {:ecto_sql, "3.14.0"},
         {:postgrex, "0.22.4"},
         {:phoenix_html, "4.3.0"},
         {:phoenix_live_reload, "1.7.0", only: :dev},
         {:phoenix_live_view, "1.2.12"},
         {:lazy_html, "0.1.13", only: :test},
         {:phoenix_live_dashboard, "0.8.7"},
         {:esbuild, "0.10.0", runtime: Mix.env() == :dev},
         {:swoosh, "1.28.1"},
         {:req, "0.7.4"},
         {:telemetry_metrics, "1.2.0"},
         {:telemetry_poller, "1.3.0"},
         {:gettext, "1.0.2"},
         {:jason, "1.4.5"},
         {:dns_cluster, "0.2.0"},
         {:bandit, "1.12.5"},
         # Password hashing. pbkdf2_elixir is pure Elixir, so the project builds
         # without a C toolchain; argon2_elixir is stronger and needs one. Both
         # are acceptable under the OWASP Password Storage Cheat Sheet.
         {:pbkdf2_elixir, "2.3.1"},
         # Static analysis for Phoenix-shaped security mistakes, and a check of
         # the dependency tree against the Elixir Security Advisories. Neither
         # ships in the application.
         {:sobelow, "0.15.0", only: [:dev, :test], runtime: false},
         {:mix_audit, "2.1.5", only: [:dev, :test], runtime: false}
       ]
     end

     defp aliases do
       [
         setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build"],
         "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
         "ecto.reset": ["ecto.drop", "ecto.setup"],
         test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
         "assets.setup": ["esbuild.install --if-missing"],
         "assets.build": ["compile", "esbuild liveview_app"],
         "assets.deploy": ["esbuild liveview_app --minify", "phx.digest"],
         # What CI runs, in one command, so the two cannot drift apart.
         precommit: [
           "compile --warnings-as-errors",
           "deps.unlock --check-unused",
           "format --check-formatted",
           "sobelow --exit Low --private",
           "deps.audit",
           "test"
         ]
       ]
     end
   end
   ```

   Verify: `grep -q '{:phoenix, "1.8.15"}' mix.exs`

8. Resolve the pinned versions and rewrite `mix.lock` from them: `mix deps.get`
   Verify: `grep -q '"phoenix": {:hex, :phoenix, "1.8.15"' mix.lock`

9. Replace `config/dev.exs` so that development reads its database from the environment and binds the server to loopback:

   ```elixir
   import Config

   # Where development talks to Postgres. Read from the environment rather than
   # written here, because the port belongs to whatever container is running:
   # `docker compose port db 5432` prints the one Docker chose. The fallback is
   # the compose file's own credentials, which are local-only by construction.
   config :liveview_app, LiveviewApp.Repo,
     url:
       System.get_env("DATABASE_URL") || "postgres://app:local-development-only@127.0.0.1:5432/app",
     stacktrace: true,
     show_sensitive_data_on_connection_error: true,
     pool_size: 10

   config :liveview_app, LiveviewAppWeb.Endpoint,
     # Loopback, not 0.0.0.0: a development server has code reloading, readable
     # stack traces and a mailbox preview, and none of that belongs on a network
     # interface somebody else can reach.
     http: [ip: {127, 0, 0, 1}, port: 4000],
     check_origin: false,
     code_reloader: true,
     debug_errors: true,
     # Obviously not a secret, and production refuses this exact string by name
     # (config/runtime.exs). A plausible-looking development value is how a
     # development value reaches production.
     secret_key_base: "local-development-only-not-a-real-secret-0000000000000000000000000000",
     watchers: [
       esbuild: {Esbuild, :install_and_run, [:liveview_app, ~w(--sourcemap=inline --watch)]}
     ]

   # Enable dev routes for the dashboard and the mailbox preview.
   config :liveview_app, dev_routes: true

   # Do not include metadata nor timestamps in development logs.
   config :logger, :default_formatter, format: "[$level] $message\n"

   # Set a higher stacktrace during development. Avoid configuring such
   # in production as building large stacktraces may be expensive.
   config :phoenix, :stacktrace_depth, 20

   # Initialize plugs at runtime for faster development compilation.
   config :phoenix, :plug_init_mode, :runtime

   config :phoenix_live_view,
     # Include debug annotations and locations in rendered markup.
     # Changing this configuration will require mix clean and a full recompile.
     debug_heex_annotations: true,
     debug_attributes: true,
     # Enable helpful, but potentially expensive runtime checks.
     enable_expensive_runtime_checks: true

   # Disable the Swoosh API client; it is only required for production adapters.
   config :swoosh, :api_client, false
   ```

   Verify: `grep -q 'System.get_env("DATABASE_URL")' config/dev.exs`

10. Replace `config/test.exs` so that the test database is derived from the same URL:

    ```elixir
    import Config

    # Only in tests, remove the complexity from the password hashing algorithm.
    config :pbkdf2_elixir, :rounds, 1

    # The test database is the development one with `_test` appended, so a single
    # DATABASE_URL configures both and neither can write into the other. The
    # MIX_TEST_PARTITION suffix is what `mix test --partitions` needs.
    config :liveview_app, LiveviewApp.Repo,
      url:
        (System.get_env("DATABASE_URL") ||
           "postgres://app:local-development-only@127.0.0.1:5432/app") <>
          "_test" <> (System.get_env("MIX_TEST_PARTITION") || ""),
      pool: Ecto.Adapters.SQL.Sandbox,
      pool_size: System.schedulers_online() * 2

    # No server runs during tests; LiveViewTest drives the socket in process.
    config :liveview_app, LiveviewAppWeb.Endpoint,
      http: [ip: {127, 0, 0, 1}, port: 4002],
      secret_key_base: "test-only-not-a-real-secret-000000000000000000000000000000000000000000",
      server: false

    # In test we do not send emails.
    config :liveview_app, LiveviewApp.Mailer, adapter: Swoosh.Adapters.Test

    # Disable the Swoosh API client; it is only required for production adapters.
    config :swoosh, :api_client, false

    # Print only warnings and errors during test.
    config :logger, level: :warning

    # Initialize plugs at runtime for faster test compilation.
    config :phoenix, :plug_init_mode, :runtime

    # Enable helpful, but potentially expensive runtime checks.
    config :phoenix_live_view, enable_expensive_runtime_checks: true

    # Sort query params output of verified routes for robust url comparisons.
    config :phoenix, sort_verified_routes_query_params: true
    ```

    Verify: `grep -q 'Ecto.Adapters.SQL.Sandbox' config/test.exs`

11. Replace `config/runtime.exs` so that production refuses to start without a database, a real secret and a host:

    ```elixir
    import Config

    # Read after compilation and before the system starts, for every environment
    # and inside a release. Everything production needs from its operator is read
    # here, and anything missing stops the boot with a message that names it — a
    # server that starts with a development secret is the failure this file exists
    # to make impossible.

    # The exact development value from config/dev.exs. Named here so production can
    # refuse it by name rather than hope nobody copied it.
    development_secret_key_base =
      "local-development-only-not-a-real-secret-0000000000000000000000000000"

    if System.get_env("PHX_SERVER") do
      config :liveview_app, LiveviewAppWeb.Endpoint, server: true
    end

    config :liveview_app, LiveviewAppWeb.Endpoint,
      http: [port: String.to_integer(System.get_env("PORT", "4000"))]

    if config_env() == :dev do
      # Reload browser tabs when matching files change.
      config :liveview_app, LiveviewAppWeb.Endpoint,
        live_reload: [
          web_console_logger: true,
          patterns: [
            ~r"priv/static/(?!uploads/).*\.(js|css|png|jpeg|jpg|gif|svg)$"E,
            ~r"priv/gettext/.*\.po$"E,
            ~r"lib/liveview_app_web/router\.ex$"E,
            ~r"lib/liveview_app_web/(controllers|live|components)/.*\.(ex|heex)$"E
          ]
        ]
    end

    if config_env() == :prod do
      database_url =
        System.get_env("DATABASE_URL") ||
          raise """
          environment variable DATABASE_URL is missing.
          For example: ecto://USER:PASS@HOST/DATABASE
          """

      maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

      config :liveview_app, LiveviewApp.Repo,
        url: database_url,
        pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
        socket_options: maybe_ipv6

      secret_key_base =
        System.get_env("SECRET_KEY_BASE") ||
          raise """
          environment variable SECRET_KEY_BASE is missing.
          You can generate one by calling: mix phx.gen.secret
          """

      # Session cookies and LiveView socket tokens are signed with this. Plug
      # requires 64 bytes, and the development value must never reach here.
      if secret_key_base == development_secret_key_base do
        raise "SECRET_KEY_BASE is the development value from config/dev.exs. Generate one: mix phx.gen.secret"
      end

      if byte_size(secret_key_base) < 64 do
        raise "SECRET_KEY_BASE must be at least 64 bytes. Generate one: mix phx.gen.secret"
      end

      # No default. The host ends up in password-reset and magic-link emails, and a
      # wrong one sends a working login link to the wrong origin.
      host =
        System.get_env("PHX_HOST") ||
          raise """
          environment variable PHX_HOST is missing.
          It is the public host name, for example app.example.com.
          """

      config :liveview_app, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

      # `force_ssl` is not here on purpose: Phoenix reads it at compile time, so a
      # value set in this file is silently ignored. It lives in config/prod.exs.
      config :liveview_app, LiveviewAppWeb.Endpoint,
        url: [host: host, port: 443, scheme: "https"],
        http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}],
        secret_key_base: secret_key_base

      # The mailer still has to be configured before magic links work in
      # production: pick a Swoosh adapter and give it its credentials from the
      # environment, never from this file.
      #
      #     config :liveview_app, LiveviewApp.Mailer,
      #       adapter: Swoosh.Adapters.Mailgun,
      #       api_key: System.fetch_env!("MAILGUN_API_KEY"),
      #       domain: System.fetch_env!("MAILGUN_DOMAIN")
      #
      #     config :swoosh, :api_client, Swoosh.ApiClient.Req
    end
    ```

    Verify: `grep -q 'PHX_HOST is missing' config/runtime.exs`

12. Create `compose.yaml`, the local database:

    ```yaml
    # Local development only. Nothing here is a production configuration.
    services:
      db:
        image: postgres:18.6-alpine
        environment:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: local-development-only
          POSTGRES_DB: app
          # The first start initialises the cluster and then flushes it to disk,
          # which can take minutes on a busy disk. Skipping that flush risks only
          # this throwaway database, and only on a host crash.
          POSTGRES_INITDB_ARGS: --no-sync
        # Loopback, and no fixed host port: 5432 is usually taken already, by an
        # installed Postgres or another project. Ask Docker which port it chose
        # with `docker compose port db 5432`.
        ports: ['127.0.0.1::5432']
        healthcheck:
          # Over TCP on purpose. While it initialises the cluster, the image runs
          # a temporary server on the Unix socket only, then stops it; a socket
          # check reports healthy during that window and the first connection
          # lands on a server that is shutting down.
          test: ['CMD-SHELL', 'pg_isready -h 127.0.0.1 -U app -d app']
          interval: 2s
          retries: 15
          # Failures while the cluster is first initialised do not count.
          start_period: 120s
    ```

    Verify: `docker compose config --quiet`

13. Create `lib/liveview_app/counter.ex`, the one module that names the PubSub topic:

    ```elixir
    defmodule LiveviewApp.Counter do
      @moduledoc """
      A counter every connected client sees, and the only module that names its
      PubSub topic.

      The value lives in an `Agent` rather than in each socket's assigns, so two
      browsers looking at the page see the same number. `increment/0` writes it and
      then broadcasts the new value; every subscriber assigns what it is told and
      re-renders. No LiveView updates its own assigns in an event handler, which is
      what makes the page correct for the second browser as well as the first.

      Nothing here is durable: restart the application and the count is zero again.
      When a number has to survive a restart, write it to Postgres inside a
      transaction and broadcast after the transaction commits, never before.
      """

      use Agent

      alias Phoenix.PubSub

      @topic "counter"

      def start_link(_opts) do
        Agent.start_link(fn -> 0 end, name: __MODULE__)
      end

      @doc "Subscribes the calling process to `{:counter_changed, value}` messages."
      def subscribe do
        PubSub.subscribe(LiveviewApp.PubSub, @topic)
      end

      @doc "The current value."
      def value do
        Agent.get(__MODULE__, & &1)
      end

      @doc "Adds one, tells every subscriber, and returns the new value."
      def increment do
        value = Agent.get_and_update(__MODULE__, fn value -> {value + 1, value + 1} end)
        :ok = PubSub.broadcast(LiveviewApp.PubSub, @topic, {:counter_changed, value})
        value
      end

      @doc """
      Puts the counter back to zero.

      The value is process state rather than a row in the database, so the Ecto
      sandbox cannot roll it back between tests. Tests that touch it reset it.
      """
      def reset do
        Agent.update(__MODULE__, fn _value -> 0 end)
      end
    end
    ```

    Verify: `test -f lib/liveview_app/counter.ex`

14. Replace `lib/liveview_app/application.ex` so the counter is supervised:

    ```elixir
    defmodule LiveviewApp.Application do
      @moduledoc false

      use Application

      @impl true
      def start(_type, _args) do
        children = [
          LiveviewAppWeb.Telemetry,
          LiveviewApp.Repo,
          {DNSCluster, query: Application.get_env(:liveview_app, :dns_cluster_query) || :ignore},
          {Phoenix.PubSub, name: LiveviewApp.PubSub},
          # Before the endpoint: a LiveView mounts as soon as the endpoint accepts
          # a socket, and it reads the counter while it mounts.
          LiveviewApp.Counter,
          LiveviewAppWeb.Endpoint
        ]

        opts = [strategy: :one_for_one, name: LiveviewApp.Supervisor]
        Supervisor.start_link(children, opts)
      end

      @impl true
      def config_change(changed, _new, removed) do
        LiveviewAppWeb.Endpoint.config_change(changed, removed)
        :ok
      end
    end
    ```

    Verify: `grep -q 'LiveviewApp.Counter' lib/liveview_app/application.ex`

15. Create `lib/liveview_app_web/live/counter_live.ex`, the page:

    ```elixir
    defmodule LiveviewAppWeb.CounterLive do
      @moduledoc """
      The page that shows what a LiveView is for.

      It holds no state of its own. Clicking the button asks the context to
      increment; the new value arrives back over PubSub, in `handle_info/2`, and
      that is the only place `:count` is assigned. Every other browser on the page
      gets the same message at the same time, which is the difference between a
      page that re-renders for you and a page that is live for everyone.
      """

      use LiveviewAppWeb, :live_view

      alias LiveviewApp.Counter

      @impl true
      def mount(_params, _session, socket) do
        # Only on the websocket mount: the first, static render is a dead process
        # and a subscription from it would never be cleaned up.
        if connected?(socket), do: Counter.subscribe()

        {:ok, assign(socket, page_title: "Counter", count: Counter.value())}
      end

      @impl true
      def handle_event("increment", _params, socket) do
        Counter.increment()
        {:noreply, socket}
      end

      @impl true
      def handle_info({:counter_changed, count}, socket) do
        {:noreply, assign(socket, count: count)}
      end

      @impl true
      def render(assigns) do
        ~H"""
        <Layouts.app flash={@flash} current_scope={@current_scope}>
          <h1>Counter</h1>

          <p>
            Open this page in a second browser and press the button in one of them.
          </p>

          <p id="count" aria-live="polite">{@count}</p>

          <button id="increment" phx-click="increment" phx-disable-with="…">
            Add one
          </button>
        </Layouts.app>
        """
      end
    end
    ```

    Verify: `test -f lib/liveview_app_web/live/counter_live.ex`

16. Replace `lib/liveview_app_web/router.ex` with the counter route behind authentication and a content security policy on the browser pipeline:

    ```elixir
    defmodule LiveviewAppWeb.Router do
      use LiveviewAppWeb, :router

      import LiveviewAppWeb.UserAuth

      # Everything this application loads, it serves itself: one stylesheet, one
      # bundle, and a websocket back to the same origin. `connect-src` names the
      # websocket schemes because `'self'` does not reliably cover a plain-`ws`
      # socket on an http page — and that line is wider than it looks, because a
      # bare scheme matches any host. Narrow it to your own origin, as
      # `wss://app.example.com`, once the deployment has a name. `default-src`
      # is what keeps a third-party script from being there to use it.
      @content_security_policy """
      default-src 'self'; \
      img-src 'self' data:; \
      connect-src 'self' ws: wss:; \
      object-src 'none'; \
      base-uri 'self'; \
      form-action 'self'; \
      frame-ancestors 'none'\
      """

      pipeline :browser do
        plug :accepts, ["html"]
        plug :fetch_session
        plug :fetch_live_flash
        plug :put_root_layout, html: {LiveviewAppWeb.Layouts, :root}
        plug :protect_from_forgery
        plug :put_secure_browser_headers, %{"content-security-policy" => @content_security_policy}
        plug :fetch_current_scope_for_user
      end

      pipeline :api do
        plug :accepts, ["json"]
      end

      scope "/", LiveviewAppWeb do
        pipe_through :browser

        get "/", PageController, :home
      end

      # The LiveDashboard and the mailbox preview exist only where
      # `config :liveview_app, dev_routes: true` is set, which is config/dev.exs
      # and nowhere else. Both show the contents of the running system; putting
      # them behind a flag is cheaper than remembering to put them behind a login.
      if Application.compile_env(:liveview_app, :dev_routes) do
        import Phoenix.LiveDashboard.Router

        scope "/dev" do
          pipe_through :browser

          live_dashboard "/dashboard", metrics: LiveviewAppWeb.Telemetry
          forward "/mailbox", Plug.Swoosh.MailboxPreview
        end
      end

      ## Authentication routes

      scope "/", LiveviewAppWeb do
        pipe_through [:browser, :require_authenticated_user]

        # Two gates, not one. `require_authenticated_user` answers the first,
        # ordinary HTTP request; the `on_mount` hook answers the websocket that
        # follows it, and a LiveView added here without the hook would be open to
        # anyone who connects a socket directly.
        live_session :require_authenticated_user,
          on_mount: [{LiveviewAppWeb.UserAuth, :require_authenticated}] do
          live "/counter", CounterLive, :show
          live "/users/settings", UserLive.Settings, :edit
          live "/users/settings/confirm-email/:token", UserLive.Settings, :confirm_email
        end

        post "/users/update-password", UserSessionController, :update_password
      end

      scope "/", LiveviewAppWeb do
        pipe_through [:browser]

        live_session :current_user,
          on_mount: [{LiveviewAppWeb.UserAuth, :mount_current_scope}] do
          live "/users/register", UserLive.Registration, :new
          live "/users/log-in", UserLive.Login, :new
          live "/users/log-in/:token", UserLive.Confirmation, :new
        end

        post "/users/log-in", UserSessionController, :create
        delete "/users/log-out", UserSessionController, :delete
      end
    end
    ```

    Verify: `grep -q 'live "/counter", CounterLive' lib/liveview_app_web/router.ex`

17. Create `test/liveview_app_web/live/counter_live_test.exs`, which is where the realtime claim is either true or it is not:

    ```elixir
    defmodule LiveviewAppWeb.CounterLiveTest do
      @moduledoc """
      The three claims this blueprint makes about LiveView, each with a test.

      `async: false`, because the counter is one Agent for the whole node: two
      test processes incrementing it at the same time would see each other's
      numbers. Everything that goes through Ecto stays async-safe.
      """

      use LiveviewAppWeb.ConnCase, async: false

      import Phoenix.LiveViewTest

      alias LiveviewApp.Counter

      setup do
        Counter.reset()
        :ok
      end

      test "an anonymous visitor is redirected to the login page", %{conn: conn} do
        # The ordinary HTTP request first.
        conn = get(conn, ~p"/counter")
        assert redirected_to(conn) == ~p"/users/log-in"

        # And the websocket mount, which is a second door into the same page.
        assert {:error, {:redirect, %{to: "/users/log-in"}}} = live(conn, ~p"/counter")
      end

      describe "signed in" do
        setup :register_and_log_in_user

        test "renders the current value", %{conn: conn} do
          Counter.increment()

          {:ok, view, html} = live(conn, ~p"/counter")

          assert html =~ "Counter"
          assert has_element?(view, "#count", "1")
        end

        test "clicking the button changes the page over the socket", %{conn: conn} do
          {:ok, view, _html} = live(conn, ~p"/counter")
          assert has_element?(view, "#count", "0")

          view |> element("#increment") |> render_click()

          # The click assigns nothing. The number only changes because the
          # broadcast came back, so this asserts the round trip and not a local
          # re-render.
          assert has_element?(view, "#count", "1")
        end

        test "a change made elsewhere is pushed to a mounted client", %{conn: conn} do
          {:ok, view, _html} = live(conn, ~p"/counter")
          assert has_element?(view, "#count", "0")

          # Nothing in this process is holding the socket: the increment happens
          # in the test process, and the LiveView hears about it because it
          # subscribed. That is the realtime claim.
          assert Counter.increment() == 1

          assert has_element?(view, "#count", "1")
        end
      end
    end
    ```

    Verify: `test -f test/liveview_app_web/live/counter_live_test.exs`

18. Create `test/liveview_app/runtime_config_test.exs`, which reads the production configuration the way a boot would:

    ```elixir
    defmodule LiveviewApp.RuntimeConfigTest do
      @moduledoc """
      What production refuses to start without.

      `config/runtime.exs` is read before the supervision tree starts, so every
      `raise` in it is a boot that stops instead of a server that runs with a
      development secret. Reading the same file with `Config.Reader` is how that
      can be asserted without starting a production node.
      """

      use ExUnit.Case, async: false

      @runtime Path.expand("../../config/runtime.exs", __DIR__)
      @prod Path.expand("../../config/prod.exs", __DIR__)
      @variables ~w(DATABASE_URL SECRET_KEY_BASE PHX_HOST)
      @database "postgres://app:local-development-only@127.0.0.1:5432/app"
      @development_secret "local-development-only-not-a-real-secret-0000000000000000000000000000"
      @good_secret String.duplicate("z", 64)

      setup do
        saved = Map.new(@variables, fn name -> {name, System.get_env(name)} end)
        Enum.each(@variables, &System.delete_env/1)

        on_exit(fn ->
          Enum.each(saved, fn
            {name, nil} -> System.delete_env(name)
            {name, value} -> System.put_env(name, value)
          end)
        end)

        :ok
      end

      test "refuses to start without a database" do
        assert_raise RuntimeError, ~r/DATABASE_URL/, &read_production/0
      end

      test "refuses to start without a secret" do
        System.put_env("DATABASE_URL", @database)

        assert_raise RuntimeError, ~r/SECRET_KEY_BASE/, &read_production/0
      end

      test "refuses the development secret" do
        System.put_env("DATABASE_URL", @database)
        System.put_env("SECRET_KEY_BASE", @development_secret)

        assert_raise RuntimeError, ~r/development value/, &read_production/0
      end

      test "refuses a secret shorter than 64 bytes" do
        System.put_env("DATABASE_URL", @database)
        System.put_env("SECRET_KEY_BASE", String.duplicate("z", 63))

        assert_raise RuntimeError, ~r/at least 64 bytes/, &read_production/0
      end

      test "refuses to start without a host" do
        System.put_env("DATABASE_URL", @database)
        System.put_env("SECRET_KEY_BASE", @good_secret)

        assert_raise RuntimeError, ~r/PHX_HOST/, &read_production/0
      end

      test "starts with every variable set, and builds its URLs over https" do
        System.put_env("DATABASE_URL", @database)
        System.put_env("SECRET_KEY_BASE", @good_secret)
        System.put_env("PHX_HOST", "app.example.com")

        endpoint = read_production()[:liveview_app][LiveviewAppWeb.Endpoint]

        assert endpoint[:url] == [host: "app.example.com", port: 443, scheme: "https"]
        assert endpoint[:secret_key_base] == @good_secret
      end

      test "http is redirected to https in production" do
        # In config/prod.exs and not in config/runtime.exs: Phoenix reads
        # `force_ssl` at compile time, so the same lines in runtime.exs would be
        # accepted, ignored, and serve the site over http forever.
        endpoint = Config.Reader.read!(@prod, env: :prod)[:liveview_app][LiveviewAppWeb.Endpoint]

        assert :x_forwarded_proto in endpoint[:force_ssl][:rewrite_on]
      end

      defp read_production do
        Config.Reader.read!(@runtime, env: :prod)
      end
    end
    ```

    Verify: `test -f test/liveview_app/runtime_config_test.exs`

19. Create `.github/workflows/ci.yml`, with every action pinned by commit and the token read-only:

    ```yaml
    name: ci

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        services:
          db:
            image: postgres:18.6-alpine
            env:
              POSTGRES_USER: app
              POSTGRES_PASSWORD: local-development-only
              POSTGRES_DB: app
            ports: ['5432:5432']
            options: >-
              --health-cmd "pg_isready -h 127.0.0.1 -U app -d app"
              --health-interval 2s
              --health-retries 15
        env:
          DATABASE_URL: postgres://app:local-development-only@127.0.0.1:5432/app
          MIX_ENV: test
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false

          - uses: erlef/setup-beam@54075bcc5e249e4758d363f27d099f55d843f124 # v1.24.1
            with:
              otp-version: '29'
              elixir-version: '1.20'

          # mix.lock is the whole key: two runs with the same lock resolve the
          # same tree, and a run with a different one must not reuse the build.
          - uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
            with:
              path: |
                deps
                _build
              key: ${{ runner.os }}-mix-${{ hashFiles('mix.lock') }}
              restore-keys: ${{ runner.os }}-mix-

          - run: mix deps.get --check-locked

          # Everything the project asks of a change, in the order that fails
          # fastest. `precommit` in mix.exs runs the same list locally.
          - run: mix compile --warnings-as-errors
          - run: mix deps.unlock --check-unused
          - run: mix format --check-formatted
          - run: mix sobelow --exit Low --private
          - run: mix deps.audit
          - run: mix test
    ```

    Verify: `grep -q "erlef/setup-beam@54075bcc5e249e4758d363f27d099f55d843f124" .github/workflows/ci.yml`

20. Replace `README.md`:

    ```markdown
    # app

    A Phoenix LiveView application on Postgres.

    ## Run it

    `docker compose up -d --wait` starts the database, and
    `docker compose port db 5432` prints the port Docker chose for it. Export
    `DATABASE_URL` from that, then `mix setup` and `mix phx.server`. The site is
    on <http://127.0.0.1:4000>; `/counter` is behind a login, and the sign-in
    email is delivered to the mailbox preview at `/dev/mailbox` instead of being
    sent anywhere.

    Without `DATABASE_URL`, development and test fall back to the credentials in
    `compose.yaml` on port 5432.

    ## Test it

    `mix test` creates and migrates the test database first. `mix precommit` runs
    everything CI runs: compile with warnings as errors, unused dependencies,
    formatting, `sobelow`, the advisory check, and the suite.

    ## Deploy it

    Production reads `DATABASE_URL`, `SECRET_KEY_BASE` and `PHX_HOST` from the
    environment and refuses to start without any of them. `mix phx.gen.secret`
    generates a secret; a short one, or the development one, is refused by name.
    Configure a real Swoosh adapter before the first release, or nobody can log
    in: the only way in is the link the mailer sends.
    ```

    Verify: `grep -q "mix precommit" README.md`

21. Keep the files the checks below write out of Git, so a throwaway secret cannot be committed by accident: `printf '\n# Written by the setup checks, never committed.\n/db.url\n/prod-secret.txt\n/server.port\n/server.pid\n/server.log\n/counter-status.txt\n/refused.log\n/refused.code\n/sobelow.json\n/audit.json\n/login.html\n' >> .gitignore`
    Verify: `grep -qx "/prod-secret.txt" .gitignore`

22. Format everything, including what the generators wrote: `mix format`
    Verify: `mix format --check-formatted`

23. Compile the project with warnings treated as errors: `mix compile --warnings-as-errors`
    Verify: `test -d _build/dev/lib/liveview_app/ebin`

24. Check that the lock file carries nothing no dependency asks for: `mix deps.unlock --check-unused`
    Verify: `mix deps.get --check-locked`

25. Scan for Phoenix-shaped security mistakes — a missing content security policy, a raw SQL interpolation, a directory traversal, a route that renders user input — and keep the report: `mix sobelow --exit Low --private --format json > sobelow.json`
    Verify: `grep -q '"total_findings": 0' sobelow.json`

26. Check every dependency against the Elixir Security Advisories, which `mix_audit` carries with it rather than fetching, and keep the report: `mix deps.audit --format json > audit.json`
    Verify: `grep -q '"pass":true' audit.json`

27. Install the esbuild binary the asset pipeline uses, from the npm registry: `mix assets.setup`
    Verify: `ls _build/esbuild-*`

28. Bundle the JavaScript that connects the LiveView socket in a browser: `mix assets.build`
    Verify: `test -s priv/static/assets/js/app.js`

29. Remove a database container left behind by an earlier attempt, so this does not depend on a clean machine: `docker compose down -v > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker compose ps -q db)"`

30. Start Postgres and wait until it accepts connections: `docker compose up -d --wait`
    Verify: `test -n "$(docker compose ps -q db)"`

31. Ask Docker which host port it chose, and write the database URL once so every step below uses the same one: `echo "postgres://app:local-development-only@$(docker compose port db 5432)/app" > db.url`
    Verify: `grep -q "^postgres://app:local-development-only@127.0.0.1:[0-9]*/app$" db.url`

32. Run the suite. It creates and migrates the test database first, then proves that an anonymous visitor is refused the counter over HTTP and over the socket, that a click changes the page only because the broadcast came back, that an increment made in another process reaches a mounted client, and that production refuses a missing, copied or short secret: `DATABASE_URL="$(cat db.url)" mix test`
    Verify: `DATABASE_URL="$(cat db.url)" mix test test/liveview_app_web/live/counter_live_test.exs test/liveview_app/runtime_config_test.exs`

33. Generate a throwaway production secret for the checks below. It is written to a file rather than printed, and `.gitignore` already covers it: `mix phx.gen.secret > prod-secret.txt`
    Verify: `test "$(wc -c < prod-secret.txt)" -ge 64`

34. Apply the migrations with the production configuration, which is the first thing a deployment does: `DATABASE_URL="$(cat db.url)" SECRET_KEY_BASE="$(cat prod-secret.txt)" PHX_HOST=127.0.0.1 MIX_ENV=prod mix ecto.migrate`
    Verify: `DATABASE_URL="$(cat db.url)" SECRET_KEY_BASE="$(cat prod-secret.txt)" PHX_HOST=127.0.0.1 MIX_ENV=prod mix ecto.migrations | grep -q "up .*create_users_auth_tables"`

35. Build and digest the production assets: `DATABASE_URL="$(cat db.url)" SECRET_KEY_BASE="$(cat prod-secret.txt)" PHX_HOST=127.0.0.1 MIX_ENV=prod mix assets.deploy`
    Verify: `test -f priv/static/cache_manifest.json`

36. Run the same production command with no secret at all, and record what it did. This is the refusal as a deployment would meet it, rather than as a test: `DATABASE_URL="$(cat db.url)" PHX_HOST=127.0.0.1 MIX_ENV=prod mix ecto.migrations > refused.log 2>&1; echo "$?" > refused.code`
    Verify: `grep -qv '^0$' refused.code && grep -q "SECRET_KEY_BASE is missing" refused.log`

37. Ask the operating system for a free port and keep it. A fixed port can already be taken, and then the checks below either fail or are answered by somebody else's server: `elixir -e '{:ok, socket} = :gen_tcp.listen(0, [ip: {127, 0, 0, 1}]); {:ok, port} = :inet.port(socket); :gen_tcp.close(socket); IO.puts(port)' > server.port`
    Verify: `grep -qE '^[0-9]+$' server.port`

38. Start the production server on that port in the background, and keep its process id: `DATABASE_URL="$(cat db.url)" SECRET_KEY_BASE="$(cat prod-secret.txt)" PHX_HOST=127.0.0.1 PORT="$(cat server.port)" PHX_SERVER=true MIX_ENV=prod mix phx.server > server.log 2>&1 & echo $! > server.pid`
    Verify: `test -s server.pid`

39. Wait for it to say it is listening: `for attempt in $(seq 60); do grep -q "Running LiveviewAppWeb.Endpoint" server.log && break; sleep 1; done`
    Verify: `grep -q "Running LiveviewAppWeb.Endpoint with Bandit" server.log`

40. Ask the running production server for the counter without a session, and record the status and where it was sent: `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" "http://127.0.0.1:$(cat server.port)/counter" > counter-status.txt`
    Verify: `grep -q "^302 http://127.0.0.1:[0-9]*/users/log-in$" counter-status.txt`

41. Ask for the login page, which anyone may see, and keep it: `curl -fsS -o login.html "http://127.0.0.1:$(cat server.port)/users/log-in"`
    Verify: `grep -q 'name="csrf-token"' login.html`

42. Stop the production server: `kill "$(cat server.pid)"`
    Verify: `sleep 2; ! kill -0 "$(cat server.pid)" 2>/dev/null`

43. Stop the database: `docker compose down -v`
    Verify: `test -z "$(docker compose ps -q db)"`

## After setup

- `mix phx.server` with `DATABASE_URL` exported serves the site on
  <http://127.0.0.1:4000>. Register at `/users/register`, then open
  `/dev/mailbox` and follow the link: no mail leaves the machine in
  development.
- `mix precommit` is the whole gate in one command, and CI runs the same list.
- The counter is a demonstration, not a feature. Delete
  `lib/liveview_app/counter.ex`, its LiveView, its route and its test once the
  first real page exists — and keep the shape: state in a context, a broadcast
  after the write, and `handle_info/2` as the only place the LiveView assigns.
