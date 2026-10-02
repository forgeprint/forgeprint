# Changelog — phoenix-liveview-app

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.0 — 2026-09-30

First version.

A Phoenix 1.8.15 application on Postgres with a LiveView page that is pushed
to from the server, magic-link authentication from `mix phx.gen.auth`, Ecto
migrations, a production configuration that refuses to start without its
secret, Sobelow, `mix_audit`, and a CI workflow with every action pinned by
commit.

**Generated** by a tool from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
which records it as the smallest demand signal on the list and builds it
anyway because the expansion plan says so: `phoenix` 454.1k downloads a week
and `phoenix_live_view` 333.9k on hex.pm, 23.2k stars on
`phoenixframework/phoenix`. Its recipe runs in CI like every other and nobody
has built on it yet, so it is `tier: community` and says so wherever it is
served ([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)). The
architecture and security review is
[docs/reviews/phoenix-liveview-app/2026-09-30.md](../../docs/reviews/phoenix-liveview-app/2026-09-30.md).

- Versions read from hex.pm and Docker Hub on 2026-09-30: `phx_new` 1.8.15
  (released 2026-09-25), `phoenix` 1.8.15, `phoenix_live_view` 1.2.12,
  `bandit` 1.12.5, `ecto_sql` 3.14.0, `postgrex` 0.22.4, `pbkdf2_elixir`
  2.3.1, `sobelow` 0.15.0, `mix_audit` 2.1.5, `postgres:18.6-alpine`. Every
  direct dependency is pinned exactly in `mix.exs`.
- Realtime is claimed because three tests hold it up: an anonymous visitor is
  refused over HTTP _and_ over the websocket mount; a click changes the page
  only because the broadcast came back, since the event handler assigns
  nothing; and an increment made in a different process reaches a mounted
  client. All through `Phoenix.LiveViewTest` and `Phoenix.PubSub`.
- Production reads `DATABASE_URL`, `SECRET_KEY_BASE` and `PHX_HOST` and has a
  default for none of them. A secret shorter than 64 bytes, or equal to the
  development one, is refused by name. Proved twice: six tests that read
  `config/runtime.exs` the way a boot reads it, and a recipe step that runs a
  production command with no secret and records the refusal.
- A Content Security Policy on the browser pipeline, wide enough for a
  LiveView socket and nothing else. It exists because Sobelow, set to
  `--exit Low`, refused the generated router without one.
- `mix precommit` runs what CI runs, in the same order: compile with warnings
  as errors, `deps.unlock --check-unused`, `format --check-formatted`,
  `sobelow --exit Low --private`, `deps.audit`, `test`.
- The recipe ends by starting the production server on a port the operating
  system chooses and asking it, over HTTP, for the protected page (302 to the
  login page) and for the login page itself.

**No Tailwind, no daisyUI, no heroicons.** The Phoenix 1.8 generator fetches
all three from a source-hosting site rather than a package registry, which
[CLAUDE.md rule 20](../../CLAUDE.md) does not allow. `--no-tailwind` removes
them; esbuild, which bundles the LiveView client, comes from npm and stays.
The application renders unstyled until a reader adds Tailwind back, and
`overview.md` says so under trade-offs rather than leaving it to be
discovered.

**`pbkdf2_elixir` rather than argon2 or bcrypt**, because it is pure Elixir
and needs no C toolchain the recipe would otherwise have to declare. It is
acceptable under the OWASP Password Storage Cheat Sheet; argon2id is better
and is one dependency away.

**Verified on** Elixir 1.20.4 / OTP 29 in the `elixir:1.20.4-otp-29` image
against `postgres:18.6-alpine`, on 2026-09-30: all 43 steps and their
verifications, 123 tests passing, Sobelow with no findings, `mix_audit`
clean. The five `docker compose` steps were exercised separately on the host
with real Docker, because the container running the recipe had none. CI on
the pull request is the run that counts.

### Planned

- A Dockerfile and a release, once `mix phx.gen.release --docker` output is
  actually built and started by the recipe rather than assumed.
- A browser check. `Phoenix.LiveViewTest` never loads `app.js`, so nothing
  here proves the socket connects in a real browser or that the Content
  Security Policy is wide enough for one.
- A second database option. Phoenix supports MySQL, SQL Server and SQLite,
  but LiveView's value does not change with the store, and an untested option
  is worse than none.
